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


