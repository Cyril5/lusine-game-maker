import { Game } from "../Game";
import { GameObject } from "../GameObject";
import Component from "../lgm3D.Component";

export class Rigidbody extends Component {

  options = {
    type: 2,
    restitution: 1,
    angularDamping: 100,
    linearDamping: 10,
    mass: 1,
  }

  public copyFrom<T extends Component>(componentSource: T): Component {
    throw new Error("Method not implemented.");
  }
  public update(dt: number): void {
    throw new Error("Method not implemented.");
  }

  public body: BABYLON.PhysicsBody;
  private _shapeContainer: BABYLON.PhysicsShapeContainer;

  _initWorldRot: BABYLON.Quaternion = BABYLON.Quaternion.Identity();
  _initWorldPos: BABYLON.Vector3 = new BABYLON.Vector3();
  _initLocalPos: BABYLON.Vector3 = new BABYLON.Vector3();
  _initLocalRot: BABYLON.Quaternion = BABYLON.Quaternion.Identity();

  constructor(
    go: GameObject,
    scene: BABYLON.Scene,
    type: BABYLON.PhysicsMotionType = BABYLON.PhysicsMotionType.DYNAMIC,
    mass = 1
  ) {
    super(go);
    // Le corps physique rattaché au TransformNode du GameObject
    this.body = new BABYLON.PhysicsBody(this._gameObject.transform, type, false, this._gameObject.scene);

    // Container qui va recevoir les colliders (shapes)
    this._shapeContainer = new BABYLON.PhysicsShapeContainer(this._gameObject.scene);
    this.body.shape = this._shapeContainer;

    // Propriétés physiques de base
    if (type == BABYLON.PhysicsMotionType.DYNAMIC) {
      this.body.setMassProperties({ mass });
    }

    // Game.getInstance().onGameStarted.add(() => {
    //   this.body.setTargetTransform(this._initLocalPos, this._initLocalRot);
    // });

    // Game.getInstance().onPhysicsDisabled.add(() => {
    //   // Pose d'origine (clonée par sécurité)
    //   this._initLocalPos = this._gameObject.transform.position;
    //   this._initLocalRot = this._gameObject.transform.rotationQuaternion;

    //   // Toujours remettre l'affichage de l'éditeur (LOCAL)
    //   this._gameObject.setLocalPosition(this._initLocalPos);
    //   this._gameObject.setRotationQuaternion(this._initLocalRot);

    //   // Vélocités à zéro
    //   this.body.setLinearVelocity(BABYLON.Vector3.Zero());
    //   this.body.setAngularVelocity(BABYLON.Vector3.Zero());
    // });
  }

  /** Ajout d’un collider (appelé par BoxCollider) */
  public addShape(shape: any, offset: BABYLON.Vector3, rotation: any) {
    this._shapeContainer.addChild(shape, offset, rotation);
  }

  // --------------------
  // Helpers pour le gameplay
  // --------------------
  public setLinearVelocity(v: BABYLON.Vector3) {
    this.body.setLinearVelocity(v);
  }

  public getLinearVelocity(): BABYLON.Vector3 {
    return this.body.getLinearVelocity();
  }

  public setAngularVelocity(v: BABYLON.Vector3) {
    this.body.setAngularVelocity(v);
  }

  public getAngularVelocity(): BABYLON.Vector3 {
    return this.body.getAngularVelocity();
  }

  public setGravity(enabled: boolean) {
    this.body.disablePreStep = !enabled;
  }

  // Rebuild “propre” : on reconstruit le container puis on demande aux colliders de réinjecter
  rebuildShapes(contribute: () => void) {
    this._shapeContainer = new BABYLON.PhysicsShapeContainer(this._gameObject.scene);
    this.body.shape = this._shapeContainer;
    contribute(); // chaque collider appelle addShape(...)
  }
}


