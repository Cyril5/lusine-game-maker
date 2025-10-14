// KartController.ts
import * as BABYLON from "@babylonjs/core";

type Keys = Record<string, boolean>;

function projectOnPlane(v: BABYLON.Vector3, normal: BABYLON.Vector3): BABYLON.Vector3 {
    const n = normal.normalize();
    // Projection = v - (v·n) * n
    const dot = BABYLON.Vector3.Dot(v, n);
    return v.subtract(n.scale(dot));
}

function projectOnVector(v: BABYLON.Vector3, direction: BABYLON.Vector3): BABYLON.Vector3 {
    const n = direction.normalize();
    const dot = BABYLON.Vector3.Dot(v, n);
    return n.scale(dot);
}

export default class KartController {
    // Réfs
    private scene: BABYLON.Scene;
    private root: BABYLON.TransformNode;
    private sphere: BABYLON.AbstractMesh;
    //private mesh: BABYLON.AbstractMesh;
    private body: BABYLON.PhysicsBody;

    // Inputs
    private keys: Keys = {};
    private deadzone = 0.12;

    // Tuning "Unity-like"
    public moveForce = 1000;          // intensité AddForce
    public turnStrength = 120;       // degrés / seconde (comme ton snippet Unity)
    public groundOffset = 0.45;      // garde au sol visuelle
    public maxSpeed = 125;            // clamp optionnel
    public useMaxSpeedClamp = true;

    private groundNormal = BABYLON.Vector3.Up();
    public lateralGrip = 150;    // ↑ = + d’adhérence latérale (stop slide)
    public steerAssist = 20;    // ↑ = la vitesse tourne plus vite vers le forward
    public downforce = 40;      // colle au sol (augmente avec la vitesse)

    // internes
    private turnInput = 0;           // -1..1
    private speedInput = 0;          // -1..1

    private rayResult = new BABYLON.PhysicsRaycastResult();

    constructor(
        root: BABYLON.TransformNode,
        sphere: BABYLON.AbstractMesh,
        //mesh: BABYLON.AbstractMesh,
        scene: BABYLON.Scene,
        body: BABYLON.PhysicsBody
    ) {
        this.root = root;
        this.sphere = sphere;
        //this.mesh = mesh;
        this.scene = scene;
        this.body = body;

        // IMPORTANT : la sphère ne doit pas être parente du root
        this.sphere.setParent(null);

        // --- clavier (fallback)
        window.addEventListener("keydown", e => (this.keys[e.code] = true));
        window.addEventListener("keyup", e => (this.keys[e.code] = false));

        // AVANT la physique: inputs -> rotation root -> force
        // --- AVANT la physique: input -> rotation -> forces
        this.scene.onBeforePhysicsObservable.add(() => {
            const dt = this.scene.getEngine().getDeltaTime() * 0.001;

            // 1) Inputs + rotation du root (comme Unity)
            this.readInput();
            const eul = (this.root.rotationQuaternion?.toEulerAngles() ?? this.root.rotation.clone());
            eul.y += (this.turnInput * this.turnStrength) * (Math.PI / 180) * dt;
            this.root.rotationQuaternion = BABYLON.Quaternion.FromEulerVector(eul);
            this.root.computeWorldMatrix(true);

            // 2) Normale du sol (raycast depuis la sphère)
            const plugin = this.scene.getPhysicsEngine()?.getPhysicsPlugin() as BABYLON.IPhysicsEnginePluginV2 | undefined;
            if (plugin) {
                const from = this.sphere.getAbsolutePosition().add(new BABYLON.Vector3(0, 0.25, 0));
                const to = from.add(new BABYLON.Vector3(0, -2.0, 0));

                // IMPORTANT: réutiliser l'objet et/ou le reset avant usage
                this.rayResult.reset();
                plugin.raycast(from, to, this.rayResult); // ✅ 3 paramètres

                if (this.rayResult.hasHit && this.rayResult.hitNormal) {
                    this.groundNormal.copyFrom(this.rayResult.hitNormal);
                }
            }

            // 3) Directions + vitesses tangentielles (sur le plan de la piste)
            const forward = this.root.getDirection(BABYLON.Axis.Z);
            const fwdOnPlane = projectOnPlane(forward, this.groundNormal).normalize();

            const vel = this.body.getLinearVelocity() ?? BABYLON.Vector3.ZeroReadOnly;
            const tanVel = projectOnPlane(vel, this.groundNormal); // vitesse sur la piste
            const speedTan = tanVel.length();
            const forwardComp = projectOnVector(tanVel, fwdOnPlane);        // composante dans l'axe
            const lateral = tanVel.subtract(forwardComp);                      // composante latérale (le slide)

            const location = this.sphere.getAbsolutePosition();

            // 4) Propulsion moteur (dans l’axe projeté sur la piste)
            if (Math.abs(this.speedInput) > 0.01 && fwdOnPlane.lengthSquared() > 1e-6) {
                const drive = fwdOnPlane.scale(this.moveForce * this.speedInput);
                this.body.applyForce(drive, location);
            }

            // 5) Lateral grip: freine le glissement latéral
            if (lateral.lengthSquared() > 1e-6) {
                // force opposée au slide proportionnelle à la vitesse latérale
                const gripForce = lateral.scale(-this.lateralGrip);
                this.body.applyForce(gripForce, location);
            }

            // 6) Steer assist: réoriente la vitesse vers le forward (sans changer l’énergie)
            if (speedTan > 0.01 && fwdOnPlane.lengthSquared() > 1e-6) {
                const desiredTan = fwdOnPlane.scale(speedTan);
                const delta = desiredTan.subtract(tanVel);         // "où je veux aller" - "où je vais"
                const steerAssistForce = delta.scale(this.steerAssist);  // facteur à régler
                this.body.applyForce(steerAssistForce, location);
            }

            // 7) Downforce: colle au sol (un peu plus avec la vitesse)
            const stick = this.groundNormal.scale(-this.downforce * (1 + 0.02 * speedTan));
            this.body.applyForce(stick, location);

            // 8) (option) clamp vitesse max arcade
            if (this.useMaxSpeedClamp) {
                const v = this.body.getLinearVelocity() ?? BABYLON.Vector3.ZeroReadOnly;
                const sp = v.length();
                if (sp > this.maxSpeed) this.body.setLinearVelocity(v.normalize().scale(this.maxSpeed));
            }
        });

        // APRÈS la physique: recoller root sur la sphère
        this.scene.onAfterPhysicsObservable.add(() => {
            const p = this.sphere.getAbsolutePosition();   // aucune autre source !
            const yOffset = this.groundOffset;
            this.root.position.copyFrom(p).addInPlaceFromFloats(0, yOffset, 0);

            // visuel = root
            // if (!this.mesh.rotationQuaternion) this.mesh.rotationQuaternion = new BABYLON.Quaternion();
            // this.mesh.rotationQuaternion.copyFrom(this.root.rotationQuaternion ?? BABYLON.Quaternion.Identity());
            // this.mesh.position.copyFrom(this.root.position);
        });
    }

    // Appelé par ton script externe si tu veux (sinon pas nécessaire)
    public update(_dt: number) {
        // tout est déjà orchestré par onBeforePhysics / onAfterPhysics
    }

    // ----------- INPUTS -----------
    private readInput() {
        // 1) Gamepad (Web Gamepad API) : RT=buttons[7], LT=buttons[6], stick gauche X=axes[0]
        let steer = 0, throttle = 0;
        const pads = navigator.getGamepads?.();
        const pad = pads ? (Array.from(pads).find(p => !!p) as Gamepad | undefined) : undefined;

        if (pad) {
            const steerAxis = pad.axes[0] ?? 0;
            steer = Math.abs(steerAxis) < this.deadzone ? 0 : steerAxis;

            const rt = pad.buttons[7]?.value ?? 0;
            const lt = pad.buttons[6]?.value ?? 0;
            throttle = rt - lt;          // RT avance, LT freine / recule
        } else {
            // 2) Fallback clavier : ZQSD / flèches
            const left = this.keys["KeyQ"] || this.keys["KeyA"];
            const right = this.keys["KeyD"];
            const up = this.keys["KeyZ"] || this.keys["KeyW"];
            const down = this.keys["KeyS"];

            steer = (right ? 1 : 0) - (left ? 1 : 0);
            throttle = (up ? 1 : 0) - (down ? 1 : 0);
        }

        this.turnInput = steer;
        this.speedInput = throttle;
    }
}
