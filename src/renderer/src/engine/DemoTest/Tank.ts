// src/gameplay/Tank.ts
import InputManager from "../InputManager";
import { GameObject } from "../GameObject";
import BoxCollider from "../physics/lgm3D.BoxCollider";
import Utils from "../utils/lgm3D.Utils";
import { Rigidbody } from "../physics/lgm3D.Rigidbody";
import { Game } from "../Game";

function clamp01(v: number) { return v < 0 ? 0 : v > 1 ? 1 : v; }

export class Tank extends GameObject {
  rb: Rigidbody;
  isPlayer: boolean;
  input?: InputManager;

  private accelFwd = 18;
  private accelRev = 10;
  private brakeAccel = 28;
  private drag = 1.5;
  private maxSpeedFwd = 14;
  private maxSpeedRev = 6;

  private steerMax = 2.6;
  private steerRefSpeed = 8;
  private minSpeedToSteer = 0.35;

  private cam?: BABYLON.UniversalCamera;
  private camDistance = 10;
  private camHeight   = 5;
  private camLookAhead = 2.5;
  private camLerp      = 0.12;

  constructor(scene: BABYLON.Scene, isPlayer: boolean, startPos: BABYLON.Vector3) {
    super(isPlayer ? "CarPlayer" : "CarEnemy", scene);
    this.isPlayer = isPlayer;
    this.transform.position.copyFrom(startPos);
    if (this.transform.position.y < 5) this.transform.position.y = 5;

    const car = GameObject.getById(106);
    car.setParent(this);
    car.setLocalPosition(0,0,0);

    this.rb = this.addComponent(Utils.RB_COMPONENT_TYPE,
      new Rigidbody(this, scene, BABYLON.PhysicsMotionType.DYNAMIC, 12));

    const colliderGO = new GameObject("Collider", scene);
    colliderGO.addComponent(Utils.BX_COLLIDER_COMPONENT_TYPE, new BoxCollider(colliderGO));
    colliderGO.setParent(this);
    colliderGO.setLocalPosition(0, 0, 0);
    colliderGO.setScale(new BABYLON.Vector3(0.54,0.52,1));

    if (this.isPlayer) {
      this.input = new InputManager();
      this.cam = new BABYLON.UniversalCamera("CarCam",
        this.transform.position.add(new BABYLON.Vector3(0, this.camHeight, -this.camDistance)),
        scene
      );
      this.cam.minZ = 0.1;
      this.cam.maxZ = 2000;
      this.cam.fov = 1.0;
      this.cam.inputs.clear();
      this.cam.inertia = 0;
      Game.getInstance().onGameStarted.add(()=>{
        scene.activeCamera = this.cam!;
      });
    }

    try { (this.rb.body as any)?.setLinearDamping?.(0.05); } catch {}
    try { (this.rb.body as any)?.setAngularDamping?.(0.35); } catch {}
  }

  update() {
    const dt = this.transform.getScene().getEngine().getDeltaTime() * 0.001;

    let turn = 0, thrust = 0;
    if (this.isPlayer && this.input) {
      turn   = (this.input.isDown("d") ? 1 : 0) + (this.input.isDown("q") ? -1 : 0);
      thrust = (this.input.isDown("w") || this.input.isDown("z") ? 1 : 0) + (this.input.isDown("s") ? -1 : 0);
    }

    if (thrust !== 0 || turn !== 0) (this.rb.body as any)?.wakeUp?.();

    const fwd = this.transform.getDirection(BABYLON.Vector3.Forward());
    fwd.y = 0; fwd.normalize();

    const lin = new BABYLON.Vector3();
    this.rb.body.getLinearVelocityToRef(lin);

    const horiz = new BABYLON.Vector3(lin.x, 0, lin.z);
    let speed = horiz.length();

    let dirSign = 0;
    if (speed > 1e-6) {
      const vDir = horiz.scale(1 / speed);
      dirSign = BABYLON.Vector3.Dot(vDir, fwd) >= 0 ? 1 : -1;
    }

    if (thrust > 0) {
      if (dirSign >= 0) {
        speed = Math.min(this.maxSpeedFwd, speed + this.accelFwd * dt);
      } else {
        speed -= this.brakeAccel * dt;
        if (speed < 0) { speed = 0; dirSign = 0; }
      }
    } else if (thrust < 0) {
      if (dirSign <= 0) {
        speed = Math.min(this.maxSpeedRev, speed + this.accelRev * dt);
      } else {
        speed -= this.brakeAccel * dt;
        if (speed < 0) { speed = 0; dirSign = 0; }
      }
    } else {
      if (speed > 0) speed = Math.max(0, speed - this.drag * dt);
    }

    // >>> FIX : si bloqué, prend le signe de l’intention
    if (speed > 0 && dirSign === 0 && thrust !== 0) {
      dirSign = (thrust > 0) ? 1 : -1;
    }

    let moveDir: BABYLON.Vector3;
    if (speed <= 1e-6) {
      moveDir = fwd.clone();
      dirSign = thrust < 0 ? -1 : 1;
    } else {
      moveDir = dirSign >= 0 ? fwd : fwd.scale(-1);
    }

    const targetHoriz = moveDir.scale(speed * (dirSign >= 0 ? 1 : -1));
    lin.x = targetHoriz.x;
    lin.z = targetHoriz.z;
    this.rb.body.setLinearVelocity(lin);

    const ang = new BABYLON.Vector3();
    this.rb.body.getAngularVelocityToRef(ang);

    const steerFactor = clamp01((speed - this.minSpeedToSteer) / Math.max(0.0001, (this.steerRefSpeed - this.minSpeedToSteer)));
    const canSteer = steerFactor > 0;
    const steerDir = (dirSign >= 0) ? 1 : -1;
    ang.y = canSteer ? (turn * this.steerMax * steerFactor * steerDir) : 0;
    ang.x = 0; ang.z = 0;
    this.rb.body.setAngularVelocity(ang);

    if (this.cam) {
      const target = this.transform.getAbsolutePosition().add(fwd.scale(this.camLookAhead));
      const localAnchor = new BABYLON.Vector3(0, this.camHeight, -this.camDistance);
      const desiredPos = BABYLON.Vector3.TransformCoordinates(localAnchor, this.transform.getWorldMatrix());

      this.cam.position = BABYLON.Vector3.Lerp(this.cam.position, desiredPos, this.camLerp);
      this.cam.setTarget(BABYLON.Vector3.Lerp(this.cam.getTarget(), target, this.camLerp));
    }
  }
}
