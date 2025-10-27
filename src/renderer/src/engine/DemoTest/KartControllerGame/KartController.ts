// KartController.ts
import * as BABYLON from "@babylonjs/core";
import { Game } from "@renderer/engine/Game";
import { GameObject } from "@renderer/engine/GameObject";
import { Rigidbody } from "@renderer/engine/physics/lgm3D.Rigidbody";

/** Unity-like: projette v sur le plan orthogonal à normal */
function projectOnPlane(v: BABYLON.Vector3, normal: BABYLON.Vector3): BABYLON.Vector3 {
  const n = normal.normalize();
  return v.subtract(n.scale(BABYLON.Vector3.Dot(v, n)));
}
/** Unity-like: projette v sur la direction dir */
function projectOnVector(v: BABYLON.Vector3, dir: BABYLON.Vector3): BABYLON.Vector3 {
  const n = dir.normalize();
  return n.scale(BABYLON.Vector3.Dot(v, n));
}
/** Compat helpers pour les différentes builds de PhysicsRaycastResult */
function getRayHitNormal(res: BABYLON.PhysicsRaycastResult): BABYLON.Vector3 {
  // Certaines builds exposent hitNormalWorld, d'autres hitNormal
  const anyRes = res as any;
  const n: BABYLON.Vector3 | undefined = anyRes.hitNormalWorld ?? anyRes.hitNormal;
  return n instanceof BABYLON.Vector3 && n.lengthSquared() > 1e-8 ? n.normalize() : BABYLON.Vector3.Up();
}

type Keys = Record<string, boolean>;

export default class KartController {
  // Références
  private scene: BABYLON.Scene;
  private root: BABYLON.TransformNode;
  //private sphere: BABYLON.AbstractMesh;
  private sphereCarController: GameObject;
  private visual: BABYLON.TransformNode;
  //private body: BABYLON.PhysicsBody;
  private rigidBody: Rigidbody;

  // Inputs
  private keys: Keys = {};
  private deadzone = 0.12;
  private turnInput = 0;    // -1..1
  private speedInput = 0;   // 0..1 (RT / Up) — jamais négatif
  private brakeInput = 0;   // 0..1 (LT / Down)

  // Tuning
  // Accélération plus punchy à 120 kg
  public moveForce = 1200;   // (≈ 10 m/s² max à throttle 1)
  public maxSpeed = 55;     // ~ 200 km/h arcade

  // Grip & stabilité (scalés pour 120 kg)
  public lateralGrip = 1200;   // anti-drift plus fort
  public steerAssist = 500;    // réalignement plus énergique
  public downforce = 300;    // colle un peu plus au sol

  // Freins (moteur + pédale) adaptés masse
  public engineBrake = 1500;
  public brakeForce = 4000;
  public minStopSpeed = 0.5;

  public turnStrength = 40;    // degrés/s (rotation du root)
  public groundOffset = 0.45;   // hauteur visuelle
  public useMaxSpeedClamp = true;

  public allowReverse = false;  // pas de marche arrière pour l’instant

  /** Lissage de l’alignement (0.0 = instantané, ~0.1-0.2 confortable) */
  public tiltLerp = 0.15;

  /** Forward projeté sur le sol, stocké pour l’alignement visuel */
  private fwdOnPlane = BABYLON.Vector3.Forward(); // (0,0,1)

  // Sol / raycast
  private groundNormal = BABYLON.Vector3.Up();
  private rayResult = new BABYLON.PhysicsRaycastResult();

  constructor(
    root: BABYLON.TransformNode,
    //sphere: BABYLON.AbstractMesh,
    sphere: GameObject,
    visual: BABYLON.TransformNode,
    scene: BABYLON.Scene,
    //body: BABYLON.PhysicsBody
    body: Rigidbody
  ) {
    this.root = root;
    this.sphereCarController = sphere;
    this.visual = visual;
    this.scene = scene;
    this.rigidBody = body;

    // La sphère physique doit être indépendante
    this.sphereCarController.setParent(null);

    // Clavier
    window.addEventListener("keydown", e => (this.keys[e.code] = true));
    window.addEventListener("keyup", e => (this.keys[e.code] = false));

    // --- AVANT la physique : inputs → rotation root → forces
    this.scene.onBeforePhysicsObservable.add(() => {

      if (!Game.getInstance().isRunning)
        return;

      const dt = this.scene.getEngine().getDeltaTime() * 0.001;

      // 1) Inputs
      this.readInput();

      // 2) Rotation du root (style Unity: Euler + degrés/s)
      const eul = (this.root.rotationQuaternion?.toEulerAngles() ?? this.root.rotation.clone());
      eul.y += (this.turnInput * this.turnStrength) * (Math.PI / 180) * dt; // deg→rad
      this.root.rotationQuaternion = BABYLON.Quaternion.FromEulerVector(eul);
      this.root.computeWorldMatrix(true);

      // 3) Normale du sol (raycast physique v2)
      const plugin = this.scene.getPhysicsEngine()?.getPhysicsPlugin() as BABYLON.IPhysicsEnginePluginV2 | undefined;
      if (plugin) {
        const from = this.sphereCarController.worldPosition.add(new BABYLON.Vector3(0, 0.25, 0));
        const to = from.add(new BABYLON.Vector3(0, -2.0, 0));
        this.rayResult.reset();
        plugin.raycast(from, to, this.rayResult); // v2: (from, to, result)
        this.groundNormal.copyFrom(this.rayResult.hasHit ? getRayHitNormal(this.rayResult) : BABYLON.Vector3.Up());
      } else {
        this.groundNormal.set(0, 1, 0);
      }

      // 4) Axes projettés sur la piste
      const forward = this.root.getDirection(BABYLON.Axis.Z);
      const fwdOnPlane = projectOnPlane(forward, this.groundNormal).normalize();

      const vel = this.rigidBody.getLinearVelocity() ?? BABYLON.Vector3.ZeroReadOnly;
      const tanVel = projectOnPlane(vel, this.groundNormal);
      const speedTan = tanVel.length();
      const forwardComp = projectOnVector(tanVel, fwdOnPlane);
      const lateral = tanVel.subtract(forwardComp);

      const location = this.sphereCarController.worldPosition;
      const isBraking = this.brakeInput > 0.01;
      const hasThrottle = this.speedInput > 0.01;

      // on mémorise le forward projeté pour l’alignement visuel
      if (fwdOnPlane.lengthSquared() > 1e-6) {
        this.fwdOnPlane.copyFrom(fwdOnPlane);
      }

      // 5) Propulsion (seulement si pas en frein)
      if (!isBraking && hasThrottle && fwdOnPlane.lengthSquared() > 1e-6) {
        const drive = fwdOnPlane.scale(this.moveForce * this.speedInput);
        this.rigidBody.body.applyForce(drive, location);
      }

      // 6) Frein (LT / S/↓) : s’oppose à la vitesse tangentielle
      if (isBraking && speedTan > 1e-6) {
        const oppose = tanVel.normalize().scale(-this.brakeForce * this.brakeInput);
        this.rigidBody.body.applyForce(oppose, location);

        // Snap à l’arrêt pour éviter le micro-glissement
        if (speedTan < this.minStopSpeed) {
          const newVel = vel.subtract(tanVel); // conserve la composante verticale
          this.rigidBody.setLinearVelocity(newVel);
        }
      }

      // 7) Frein moteur (quand pas de RT/Up et pas en frein)
      if (!hasThrottle && !isBraking && forwardComp.lengthSquared() > 1e-8) {
        const engineBrakeForce = forwardComp.normalize().scale(-this.engineBrake);
        this.rigidBody.body.applyForce(engineBrakeForce, location);
      }

      // 8) Lateral grip (anti-slide)
      if (lateral.lengthSquared() > 1e-6) {
        this.rigidBody.body.applyForce(lateral.scale(-this.lateralGrip), location);
      }

      // 9) Steer assist (réoriente la vitesse dans l’axe)
      if (speedTan > 0.01 && fwdOnPlane.lengthSquared() > 1e-6) {
        const desiredTan = fwdOnPlane.scale(speedTan);
        const delta = desiredTan.subtract(tanVel);
        this.rigidBody.body.applyForce(delta.scale(this.steerAssist), location);
      }

      // 10) Downforce : colle au sol (légèrement dépendant de la vitesse)
      const stick = this.groundNormal.scale(-this.downforce * (1 + 0.02 * speedTan));
      this.rigidBody.body.applyForce(stick, location);

      // 11) Clamp vitesse max (arcade)
      if (this.useMaxSpeedClamp) {
        const v = this.rigidBody.getLinearVelocity() ?? BABYLON.Vector3.ZeroReadOnly;
        const sp = v.length();
        if (sp > this.maxSpeed) this.rigidBody.setLinearVelocity(v.normalize().scale(this.maxSpeed));
      }
    });

    function quatFromTo(from: BABYLON.Vector3, to: BABYLON.Vector3): BABYLON.Quaternion {
      const f = from.normalizeToNew();
      const t = to.normalizeToNew();
      const dot = BABYLON.Vector3.Dot(f, t);

      // quasi opposés : choisir un axe orthogonal pour tourner de 180°
      if (dot < -0.999999) {
        // trouver un vecteur non parallèle
        let axis = BABYLON.Vector3.Cross(BABYLON.Axis.X, f);
        if (axis.lengthSquared() < 1e-6) axis = BABYLON.Vector3.Cross(BABYLON.Axis.Y, f);
        axis.normalize();
        return BABYLON.Quaternion.RotationAxis(axis, Math.PI);
      }

      // formule courte-arc : q = [cross, 1+dot] normalisé
      const c = BABYLON.Vector3.Cross(f, t);
      const q = new BABYLON.Quaternion(c.x, c.y, c.z, 1 + dot);
      q.normalize();
      return q;
    }

    // --- APRÈS la physique : recoller root/mesh sur la sphère (position)
    this.scene.onAfterPhysicsObservable.add(() => {

      if (!Game.getInstance().isRunning)
        return;

      const dt = this.scene.getEngine().getDeltaTime() * 0.001;

      // 1) Recaler la position du root sur la sphère + offset
      const p = this.sphereCarController.worldPosition;
      this.root.position.copyFrom(p).addInPlace(this.groundNormal.scale(this.groundOffset));

      // 2) S'assurer que le root utilise un quaternion
      if (!this.root.rotationQuaternion) {
        this.root.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, 0, 0);
      }

      // 3) Cible "à la Unity":
      // targetRot = FromToRotation(transform.up, hit.normal) * transform.rotation
      const upNow = this.root.getDirection(BABYLON.Axis.Y);      // équiv. transform.up (monde)
      const qFromTo = quatFromTo(upNow, this.groundNormal);         // FromToRotation
      const targetRot = qFromTo.multiply(this.root.rotationQuaternion);

      // 4) Lissage: transform.rotation = Slerp(current, target, alignToGroundSmooth * dt)
      const t = Math.min(1, 3.8 * dt);           // alignToGroundSmooth ~ 3..8
      BABYLON.Quaternion.SlerpToRef(
        this.root.rotationQuaternion,
        targetRot,
        t,
        this.root.rotationQuaternion
      );

      // 5) (Option visuelle) Si ton mesh visuel est enfant du root,
      //    garde sa position locale à zéro pour éviter toute double translation.
      this.visual.position.set(0, -1, 0);
      // Laisse la rotation locale du visuel telle quelle (hérite du root).
    });
  }

  // Tout est déjà orchestré par les observables
  public update(_dt: number) { }

  // ---------- INPUTS ----------
  private readInput() {
    const pads = navigator.getGamepads?.();
    const pad = pads ? (Array.from(pads).find(p => !!p) as Gamepad | undefined) : undefined;

    let steer = 0, throttle = 0, brake = 0;

    if (pad) {
      const sx = pad.axes[0] ?? 0;
      steer = Math.abs(sx) < this.deadzone ? 0 : sx;

      const rt = pad.buttons[7]?.value ?? 0; // RT = accélère
      const lt = pad.buttons[6]?.value ?? 0; // LT = freine

      throttle = Math.max(0, rt); // 0..1 — jamais négatif ici
      brake = Math.max(0, lt); // 0..1
    } else {
      const left = this.keys["ArrowLeft"] || this.keys["KeyQ"] || this.keys["KeyA"];
      const right = this.keys["ArrowRight"] || this.keys["KeyD"];
      const up = this.keys["ArrowUp"] || this.keys["KeyZ"] || this.keys["KeyW"];
      const down = this.keys["ArrowDown"] || this.keys["KeyS"];

      steer = (right ? 1 : 0) - (left ? 1 : 0);
      throttle = up ? 1 : 0;  // ↑ / Z / W → accélère
      brake = down ? 1 : 0;  // ↓ / S     → freine
    }

    this.turnInput = steer;
    this.speedInput = throttle; // 0..1
    this.brakeInput = brake;    // 0..1
  }
}
