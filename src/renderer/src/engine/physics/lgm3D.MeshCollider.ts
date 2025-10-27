import { GameObject } from "../GameObject";
import Collider from "./lgm3D.Collider";
import { Rigidbody } from "./lgm3D.Rigidbody";
import ColliderSystem from "./lgm3D.ColliderSystem";

export default class MeshCollider extends Collider {
  /** Si true, on utilisera une shape de type MESH (triangles). Sinon tu peux décliner en convex ultérieurement. */
  useTrimesh = true;

  constructor(owner: GameObject) {
    super(owner);
    // Gizmo: si pas de maillage, on en crée un minimal (mais en général, MeshCollider = mesh existant)
    // Pas de physique ici !
    ColliderSystem.markDirty(owner);
  }

  public _setDirty(v: boolean) { this._dirty = v; }

  public buildShapeIntoBody(rb: Rigidbody) {
    if (!this._dirty) return;
    this._dirty = false;

    const node = this._gameObject.transform;
    node.computeWorldMatrix(true);
    const rootNode = rb.gameObject.transform;
    rootNode.computeWorldMatrix(true);

    const mesh = node.getChildMeshes(false)[0]; // de préférence le mesh “source”
    if (!mesh) return;
    mesh.computeWorldMatrix(true);

    // offset/rot root-space
    const rootWM = rootNode.getWorldMatrix();
    const rootInv = BABYLON.Matrix.Invert(rootWM);
    const bb = mesh.getBoundingInfo().boundingBox;

    const offsetRoot = BABYLON.Vector3.TransformCoordinates(bb.centerWorld, rootInv);
    const qMesh = BABYLON.Quaternion.FromRotationMatrix(mesh.getWorldMatrix().getRotationMatrix());
    const qRoot = BABYLON.Quaternion.FromRotationMatrix(rootWM.getRotationMatrix());
    const rotRoot = qMesh.multiply(qRoot.conjugate());

    this._physicsShape?.dispose();
    const shape = new BABYLON.PhysicsShapeMesh(mesh, this._scene); // trimesh
    (shape as any).isTrigger = this._isTrigger;
    this._applyMaterial(shape);
    this._physicsShape = shape;

    this._physicsBody?.dispose(); this._physicsBody = undefined;
    rb.addShape(shape, offsetRoot, rotRoot);
  }

  public buildStatic() {
    if (!this._dirty) return;
    this._dirty = false;

    const node = this._gameObject.transform;
    node.computeWorldMatrix(true);
    const mesh = node.getChildMeshes(false)[0];
    if (!mesh) return;
    mesh.computeWorldMatrix(true);

    const colliderWM = node.getWorldMatrix();
    const inv = BABYLON.Matrix.Invert(colliderWM);
    const bb = mesh.getBoundingInfo().boundingBox;

    const offsetLocal = BABYLON.Vector3.TransformCoordinates(bb.centerWorld, inv);
    const qMesh = BABYLON.Quaternion.FromRotationMatrix(mesh.getWorldMatrix().getRotationMatrix());
    const qNode = BABYLON.Quaternion.FromRotationMatrix(colliderWM.getRotationMatrix());
    const rotLocal = qMesh.multiply(qNode.conjugate());

    if (!this._physicsBody) {
      this._physicsBody = new BABYLON.PhysicsBody(node, BABYLON.PhysicsMotionType.STATIC, false, this._scene);
    }

    this._physicsShape?.dispose();
    const shape = new BABYLON.PhysicsShapeMesh(mesh, this._scene);
    (shape as any).isTrigger = this._isTrigger;

    this._applyMaterial(shape);  
    // NB: ShapeMesh ne prend pas directement offset/rot : on passe par le body/container local
    // Pour un body statique “local”, l’offset/rot se gèrent via la transform du node ou via container.
    // Solution simple: on crée un PhysicsShapeContainer local si tu veux gérer offset/rot précisément.
    // Ici, version simple: shape + body au node (centre mesh ≈ pivot mesh).
    this._physicsBody.shape = shape;
    this._physicsShape = shape;
  }
}