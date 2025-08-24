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
  private _initMotionType: any;

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

    Game.getInstance().onGameStarted.add(() => {
      // Capture poses initiales au démarrage
      this._captureInitialPose();
      const scene = this._gameObject.scene;
      // Snap juste avant le 1er step physique
      const token = scene.onBeforePhysicsObservable.add(() => {
        scene.onBeforePhysicsObservable.remove(token);
        this._syncBodyToCurrentOnStart();
      });
    });
    // Reset à l’arrêt du jeu
    Game.getInstance().onGameStopped.add(() => this._resetToInitial());
  }

  /** Ajout d’un collider (appelé par BoxCollider) */
  public addShape(shape: any, offset: BABYLON.Vector3, rotation: any) {
    this._shapeContainer.addChild(shape, offset, rotation);
  }

  private _captureInitialPose() {
    // Local
    this._initLocalPos = this.gameObject.localPosition.clone();
    this._initLocalRot = (this.gameObject.rotationQuaternion ?? BABYLON.Quaternion.Identity()).clone();

    // Monde (helper safe)
    const { pos, rot } = this._getWorldPose(this._gameObject.transform);
    this._initWorldPos = pos;
    this._initWorldRot = rot;

    // MotionType initial
    this._initMotionType = (this.body as any)._pluginData?.motionType ?? BABYLON.PhysicsMotionType.DYNAMIC;
  }

  /** Retourne la pose monde du TransformNode, même s’il a un parent */
  private _getWorldPose(node: BABYLON.TransformNode): { pos: BABYLON.Vector3, rot: BABYLON.Quaternion } {
    if (!node.parent) {
      // Pas de parent → on peut prendre directement
      return {
        pos: node.position.clone(),
        rot: node.rotationQuaternion
          ? node.rotationQuaternion.clone()
          : BABYLON.Quaternion.FromEulerAngles(
            (node as any).rotation.x, (node as any).rotation.y, (node as any).rotation.z
          ),
      };
    }
    // Sinon, extraire via la worldMatrix
    node.computeWorldMatrix(true);
    const wm = node.getWorldMatrix();
    return {
      pos: wm.getTranslation().clone(),
      rot: BABYLON.Quaternion.FromRotationMatrix(wm.getRotationMatrix()),
    };
  }

  private _resetToInitial() {
    // Recaler l’éditeur (LOCAL)
    this._gameObject.setLocalPosition(this._initLocalPos);
    this._gameObject.setRotationQuaternion(this._initLocalRot);

    // Stop vélocités
    this.body.setLinearVelocity(BABYLON.Vector3.Zero());
    this.body.setAngularVelocity(BABYLON.Vector3.Zero());

    // Téléportation physique en MONDE (sans attendre un step)
    const prevType = (this.body as any)._pluginData?.motionType ?? this._initMotionType;
    this.body.setMotionType(BABYLON.PhysicsMotionType.ANIMATED);
    this.body.setTargetTransform(this._initWorldPos, this._initWorldRot);
    this.body.setMotionType(prevType);

    // En mode éditeur : geler la physique tout de suite
    this.body.disablePreStep = true;
  }

  private _syncBodyToCurrentOnStart() {
    // Pose MONDE courante (que l’éditeur voit)
    const node = this._gameObject.transform;
    node.computeWorldMatrix(true);
    const wm = node.getWorldMatrix();
    const posW = wm.getTranslation().clone();
    const rotW = BABYLON.Quaternion.FromRotationMatrix(wm.getRotationMatrix());

    // Zéro vélocités & snap en ANIMATED, puis on remet le type
    const prevType = (this.body as any)._pluginData?.motionType ?? this._initMotionType ?? BABYLON.PhysicsMotionType.DYNAMIC;
    this.body.setLinearVelocity(BABYLON.Vector3.Zero());
    this.body.setAngularVelocity(BABYLON.Vector3.Zero());

    this.body.setMotionType(BABYLON.PhysicsMotionType.ANIMATED);
    this.body.setTargetTransform(posW, rotW);
    this.body.setMotionType(prevType);

    // On s’assure que la physique est autorisée pendant le Play
    this.body.disablePreStep = false;
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


