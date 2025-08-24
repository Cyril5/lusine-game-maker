// src/gameplay/Tank.ts
import InputManager from "../InputManager";
import { GameObject } from "../GameObject";
import BoxCollider from "../physics/lgm3D.BoxCollider";
import Utils from "../lgm3D.Utils";
import { Rigidbody } from "../physics/lgm3D.Rigidbody";

export class Tank extends GameObject {
  // visuels
  chassis: BABYLON.Mesh;
  turret: BABYLON.Mesh;
  barrel: BABYLON.Mesh;
  firePoint: BABYLON.TransformNode;

  // components
  rb: Rigidbody;
  isPlayer: boolean;
  input?: InputManager;

  // params
  private turnSpeed = 2.5;  // rad/s
  private maxSpeed  = 7;    // m/s
  private cooldown  = 0.25; // s
  private cdLeft    = 0;

  constructor(
    scene: BABYLON.Scene,
    isPlayer: boolean,
    startPos: BABYLON.Vector3
  ) {
    super(isPlayer ? "TankPlayer" : "TankEnemy", scene);
    this.isPlayer = isPlayer;

    // --- root position (spawn un peu en l'air)
    this.transform.position.copyFrom(startPos);
    if (this.transform.position.y < 5) this.transform.position.y = 5;

    // --- visuels
    const mat = new BABYLON.StandardMaterial("tankMat", scene);
    mat.diffuseColor = isPlayer ? BABYLON.Color3.FromHexString("#4aa3ff") : BABYLON.Color3.FromHexString("#66bb66");

    this.chassis = BABYLON.MeshBuilder.CreateBox("TankChassis", { width: 1.4, height: 0.6, depth: 2.0 }, scene);
    this.chassis.position.y = 0.3;
    this.chassis.material = mat;
    this.chassis.parent = this.transform;

    this.turret = BABYLON.MeshBuilder.CreateCylinder("Turret", { diameter: 0.9, height: 0.2 }, scene);
    this.turret.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(Math.PI / 2, 0, 0);
    this.turret.position.set(0, 0.55, 0);
    this.turret.material = mat;
    this.turret.parent = this.transform;

    this.barrel = BABYLON.MeshBuilder.CreateBox("Barrel", { width: 0.15, height: 0.15, depth: 1.0 }, scene);
    this.barrel.position.set(0, 0.65, 0.9);
    this.barrel.material = mat;
    this.barrel.parent = this.transform;

    this.firePoint = new BABYLON.TransformNode("FirePoint", scene);
    this.firePoint.parent = this.transform;
    this.firePoint.position.set(0, 0.65, 1.2);

    // --- Rigidbody sur le ROOT (container pour les shapes)
    this.rb = this.addComponent(Utils.RB_COMPONENT_TYPE, new Rigidbody(this, scene, BABYLON.PhysicsMotionType.DYNAMIC, /*mass*/ 12));

    // --- Enfant "Collider" avec BoxCollider (s’enregistre dans le container du RB)
    const colliderGO = new GameObject("Collider", scene);
    colliderGO.setParent(this);
    colliderGO.setLocalPosition(0, 0.3, 0); // centre local de la box
    // taille de la hitbox : même que chassis
    colliderGO.addComponent(Utils.BX_COLLIDER_COMPONENT_TYPE, new BoxCollider(colliderGO));

    if (this.isPlayer) {
      this.input = new InputManager();
    }
  }

  update() {
    // --- inputs
    let turn = 0, thrust = 0, shoot = false;
    if (this.isPlayer && this.input) {
      turn   = (this.input.isDown("d") ? 1 : 0) + (this.input.isDown("q") ? -1 : 0);                      // yaw
      thrust = (this.input.isDown("w") || this.input.isDown("z") ? 1 : 0) + (this.input.isDown("s") ? -1 : 0); // avant/arrière
      shoot  = this.input.isDown(" ") || this.input.isDown("enter");
    }

    // --- 1) rotation via angularVelocity (libre sur Y, bloqué sur X/Z ailleurs)
    const ang = new BABYLON.Vector3();
    this.rb.body.getAngularVelocityToRef(ang);
    ang.y = turn * this.turnSpeed;
    ang.x = 0; ang.z = 0;
    this.rb.body.setAngularVelocity(ang);

    // --- 2) translation : avancer/reculer dans le forward du ROOT
    // ne pas toucher à Y -> gravité
    const fwd = this.transform.getDirection(BABYLON.Vector3.Forward());
    fwd.y = 0; fwd.normalize();

    const lin = new BABYLON.Vector3();
    this.rb.body.getLinearVelocityToRef(lin);
    lin.x = fwd.x * thrust * this.maxSpeed;
    lin.z = fwd.z * thrust * this.maxSpeed;
    this.rb.body.setLinearVelocity(lin);

    // --- 3) tir
    // this.cdLeft -= dt;
    // if (shoot && this.cdLeft <= 0) {
    //   this.cdLeft = this.cooldown;

    //   const origin = this.firePoint.getAbsolutePosition();
    //   const dir = fwd.clone();
    //   const speed = 20;
    //   const vel = dir.scale(speed);

    //   projectiles.push(new Projectile(this.scene, plugin, origin, vel, this.rb.body));
    // }
  }
}
