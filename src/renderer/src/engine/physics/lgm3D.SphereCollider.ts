import { GameObject } from "../GameObject";
import Collider from "./lgm3D.Collider";
import { Rigidbody } from "./lgm3D.Rigidbody";
import ColliderSystem from "./lgm3D.ColliderSystem";

export default class SphereCollider extends Collider {
  /** Rayon “base” (avant scale). Si 0 → déduit du bounding. */
  radius = 0.5;
  private readonly PHYSICS_MARGIN = 0.998;

  constructor(owner: GameObject) {
    super(owner);
    // Gizmo éditeur simple (facultatif)
    let mesh = owner.transform.getChildMeshes(true)[0];
    if (!mesh) {
      mesh = BABYLON.MeshBuilder.CreateSphere("__MeshSphereCollider__", { diameter: 1 }, this._scene);
      mesh.setParent(owner.transform);
      mesh.setPositionWithLocalVector(BABYLON.Vector3.Zero());
    }
    this._editorGizmo = mesh;
    (this._editorGizmo as BABYLON.Mesh).isVisible = true;
    (this._editorGizmo as BABYLON.Mesh).visibility = 0.5;

    ColliderSystem.markDirty(owner); // première construction via système (en Play uniquement)
  }

  public _setDirty(v: boolean) { this._dirty = v; }

  public buildShapeInto(rb: Rigidbody) {
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
    const s = new BABYLON.Vector3(); const q = new BABYLON.Quaternion(); const p = new BABYLON.Vector3();
    mesh.getWorldMatrix().decompose(s, q, p);

    let rWorld = this.radius > 0 ? this.radius * Math.max(Math.abs(s.x), Math.abs(s.y), Math.abs(s.z)) : 0;
    if (rWorld <= 0) {
      const bb = mesh.getBoundingInfo().boundingBox;
      const size = bb.maximumWorld.subtract(bb.minimumWorld);
      rWorld = Math.max(size.x, size.y, size.z) * 0.5;
    }
    rWorld *= this.PHYSICS_MARGIN;

    // offset / rot dans l’espace du RB
    const rootWM = rootNode.getWorldMatrix();
    const rootInv = BABYLON.Matrix.Invert(rootWM);
    const bb = mesh.getBoundingInfo().boundingBox;

    const offsetRoot = BABYLON.Vector3.TransformCoordinates(bb.centerWorld, rootInv);
    const rootQ = BABYLON.Quaternion.FromRotationMatrix(rootWM.getRotationMatrix());
    const rotRoot  = q.multiply(rootQ.conjugate());

    // créer la shape et injecter dans le container du RB
    this._physicsShape?.dispose();
    const shape = new BABYLON.PhysicsShapeSphere(BABYLON.Vector3.Zero(), rWorld, this._scene);
    (shape as any).isTrigger = this._isTrigger;
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

    const mesh = node.getChildMeshes(true)[0];
    if (!mesh) return;
    mesh.computeWorldMatrix(true);

    const s = new BABYLON.Vector3(); const q = new BABYLON.Quaternion(); const p = new BABYLON.Vector3();
    mesh.getWorldMatrix().decompose(s, q, p);

    let rWorld = this.radius > 0 ? this.radius * Math.max(Math.abs(s.x), Math.abs(s.y), Math.abs(s.z)) : 0;
    if (rWorld <= 0) {
      const bb = mesh.getBoundingInfo().boundingBox;
      const size = bb.maximumWorld.subtract(bb.minimumWorld);
      rWorld = Math.max(size.x, size.y, size.z) * 0.5;
    }
    rWorld *= this.PHYSICS_MARGIN;

    const bb = mesh.getBoundingInfo().boundingBox;
    const colliderWM = node.getWorldMatrix();
    const inv        = BABYLON.Matrix.Invert(colliderWM);

    const offsetLocal = BABYLON.Vector3.TransformCoordinates(bb.centerWorld, inv);
    const meshRotWorld = BABYLON.Quaternion.FromRotationMatrix(mesh.getWorldMatrix().getRotationMatrix());
    const nodeRotWorld = BABYLON.Quaternion.FromRotationMatrix(colliderWM.getRotationMatrix());
    const rotLocal = meshRotWorld.multiply(nodeRotWorld.conjugate());

    if (!this._physicsBody) {
      this._physicsBody = new BABYLON.PhysicsBody(node, BABYLON.PhysicsMotionType.STATIC, false, this._scene);
    }

    this._physicsShape?.dispose();
    // NB: PhysicsShapeSphere n’a pas de paramètre de rotation → la sphère est isotrope (OK)
    const shape = new BABYLON.PhysicsShapeSphere(offsetLocal, rWorld, this._scene);
    (shape as any).isTrigger = this._isTrigger;

    this._physicsBody.shape = shape;
    this._physicsShape = shape;
  }
}
