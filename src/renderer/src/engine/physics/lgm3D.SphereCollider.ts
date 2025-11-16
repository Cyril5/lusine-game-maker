import { GameObject } from "../GameObject";
import Collider from "./lgm3D.Collider";
import ColliderSystem from "./lgm3D.ColliderSystem";
import { Rigidbody } from "./lgm3D.Rigidbody";
import * as BABYLON from "@babylonjs/core";

export default class SphereCollider extends Collider {
  /** Rayon “base” (avant scale). Si 0 → déduit du bounding. */
  radius = 0.5;

  public override getType(): string {
    return "SphereCollider";
  }

  constructor(owner: GameObject) {
    super(owner);
    // Gizmo éditeur 
    const mesh = BABYLON.MeshBuilder.CreateSphere("__MESH_SPHERE_COLL__", { diameter: 1, segments: 16 }, this._scene);
    mesh.setParent(owner.transform);
    mesh.setPositionWithLocalVector(BABYLON.Vector3.Zero());
    mesh.scaling = BABYLON.Vector3.One();

    this._editorGizmo = mesh;
    this._editorGizmo.material = Collider.COLLIDER_MAT;
    this._editorGizmo.name += this._editorGizmo.uniqueId;
    this._editorGizmo.isPickable = false;
    this._editorGizmo.doNotSerialize = true;
    this._editorGizmo.receiveShadows = false;
    this._editorGizmo.checkCollisions = false;
    this._editorGizmo.renderingGroupId = 2;

    // garder le gizmo sphérique quand le GO change de transform
    this._worldChangedObserver = owner.onWorldTransformChanged.add(() => {
      this._handleWorldTransformChanged();
    });

    // faire un premier sync (clamp scale + gizmo rond)
    this._handleWorldTransformChanged();
  }

  public buildShapeIntoBody(rb: Rigidbody) {
    if (!this._dirty) return;
    this._dirty = false;

    const node = this._gameObject.transform;
    node.computeWorldMatrix(true);
    const rootNode = rb.gameObject.transform;
    rootNode.computeWorldMatrix(true);

    const mesh = node.getChildMeshes(true)[0];
    if (!mesh) return;
    mesh.computeWorldMatrix(true);

    // Rayon monde conservateur (max scale)
    const s = new BABYLON.Vector3();
    const q = new BABYLON.Quaternion();
    const p = new BABYLON.Vector3();
    mesh.getWorldMatrix().decompose(s, q, p);

    let radiusWorld = this.radius > 0 ? this.radius * Math.max(Math.abs(s.x), Math.abs(s.y), Math.abs(s.z)) : 0;
    if (radiusWorld <= 0) {
      const bb = mesh.getBoundingInfo().boundingBox;
      const size = bb.maximumWorld.subtract(bb.minimumWorld);
      radiusWorld = Math.max(size.x, size.y, size.z) * 0.5;
    }
    radiusWorld *= this.PHYSICS_MARGIN;

    // offset / rot dans l’espace du RB
    const rootWM = rootNode.getWorldMatrix();
    const rootInv = BABYLON.Matrix.Invert(rootWM);
    const bb = mesh.getBoundingInfo().boundingBox;

    const offsetRoot = BABYLON.Vector3.TransformCoordinates(bb.centerWorld, rootInv);
    const rootQ = BABYLON.Quaternion.FromRotationMatrix(rootWM.getRotationMatrix());
    const rotRoot = q.multiply(rootQ.conjugate());

    // créer la shape et injecter dans le container du RB
    this._physicsShape?.dispose();
    const shape = new BABYLON.PhysicsShapeSphere(BABYLON.Vector3.Zero(), radiusWorld, this._scene);
    (shape as any).isTrigger = this._isTrigger;
    this._applyMaterial(shape);
    this._physicsShape = shape;

    // si un body statique existait, on le jette
    this._physicsBody?.dispose(); this._physicsBody = undefined;

    rb.addShape(shape, offsetRoot, rotRoot);
  }

  public buildStatic() {
    if (!this._dirty) return;
    this._dirty = false;

    const node = this._gameObject.transform;
    node.computeWorldMatrix(true);

    const mesh = this._editorGizmo;
    if (!mesh) return;
    mesh.computeWorldMatrix(true);

    // Décomposition pour récupérer l'échelle monde
    const s = new BABYLON.Vector3();
    const q = new BABYLON.Quaternion();
    const p = new BABYLON.Vector3();
    mesh.getWorldMatrix().decompose(s, q, p);

    // Rayon monde : soit basé sur `radius`, soit sur le bounding
    let radiusWorld =
      this.radius > 0
        ? this.radius * Math.max(Math.abs(s.x), Math.abs(s.y), Math.abs(s.z))
        : 0;

    const bb = mesh.getBoundingInfo().boundingBox;
    if (radiusWorld <= 0) {
      const size = bb.maximumWorld.subtract(bb.minimumWorld);
      radiusWorld = Math.max(size.x, size.y, size.z) * 0.5;
    }
    radiusWorld *= this.PHYSICS_MARGIN;

    // Centre monde de la sphère (centre du bounding)
    const centerWorld = bb.centerWorld;

    // Convertir ce centre dans l'espace local du node (body statique)
    const nodeWM = node.getWorldMatrix();
    const nodeInv = BABYLON.Matrix.Invert(nodeWM);
    const centerLocal = BABYLON.Vector3.TransformCoordinates(centerWorld, nodeInv);

    // Créer le body statique s'il n'existe pas encore
    if (!this._physicsBody) {
      this._physicsBody = new BABYLON.PhysicsBody(
        node,
        BABYLON.PhysicsMotionType.STATIC,
        false,
        this._scene
      );
    }

    // Recréer la shape
    this._physicsShape?.dispose();

    // Ici on utilise bien `centerLocal` et `radiusWorld`
    const shape = new BABYLON.PhysicsShapeSphere(
      centerLocal,
      radiusWorld,
      this._scene
    );
    (shape as any).isTrigger = this._isTrigger;
    this._applyMaterial(shape);

    this._physicsBody.shape = shape;
    this._physicsShape = shape;
  }

  protected override _handleWorldTransformChanged(): void {
    // d’abord : logique générique du Collider
    super._handleWorldTransformChanged(); // clamp des scale négatifs du GameObject
    //  ensuite : logique spécifique Sphere → garder le gizmo rond
    this._syncGizmoScaleFromOwner();
  }

  private _syncGizmoScaleFromOwner() {
    const gizmo = this._editorGizmo;
    if (!gizmo) return;

    const node = this._gameObject.transform;
    node.computeWorldMatrix(true);

    const wm = node.getWorldMatrix();
    const s = new BABYLON.Vector3();
    const q = new BABYLON.Quaternion();
    const p = new BABYLON.Vector3();
    wm.decompose(s, q, p);

    // empêcher les scales négatifs ou trop petits
    const MIN_SCALE = 0.001;
    s.x = Math.max(Math.abs(s.x), MIN_SCALE);
    s.y = Math.max(Math.abs(s.y), MIN_SCALE);
    s.z = Math.max(Math.abs(s.z), MIN_SCALE);

    // Le scale max définit la vraie taille en monde
    const max = Math.max(s.x, s.y, s.z);

    // On ajuste le scale local du gizmo pour qu'il reste sphérique
    gizmo.scaling.set(
      max / s.x,
      max / s.y,
      max / s.z
    );

    // Marquer le collider dirty
    this._dirty = true;
    ColliderSystem.markDirty(this._gameObject);
  }

  public toJson() {
    const json = super.toJson(); // récupère type + enabled + data:{}
    json.data.shape = "SPHERE";
    return json;
  }

}
