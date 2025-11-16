import { GameObject } from "../GameObject";
import { FiniteStateMachine } from "../FSM/lgm3D.FiniteStateMachineOLD";
import Collider from "./lgm3D.Collider";
import { ColliderSystem } from "./lgm3D.ColliderSystem";
import { Rigidbody } from "./lgm3D.Rigidbody";
import * as BABYLON from "@babylonjs/core";

export default class BoxCollider extends Collider {
    size: BABYLON.Vector3 = new BABYLON.Vector3(1, 1, 1);  // dimensions of the box

    // Le fsm qui appelera l'event OnCollisionEnter
    setEventReceiverFSM(fsm: FiniteStateMachine) {
        this._receiverFSM = fsm;
    }

    public override getType(): string {
        return "BoxCollider";
    }

    constructor(owner: GameObject) {

        super(owner);
        this._scene = this._gameObject.scene;

        // Si il y a déjà un maillage alors prendre les dimensions de ce dernier
        // let mesh = this._gameObject.transform.getChildMeshes(true)[0];
        // if (!mesh) {
        //     mesh = BABYLON.MeshBuilder.CreateBox("__MeshBoxCollider__", { height: 1, width: 1, depth: 1 }, this._scene);
        //     mesh.setParent(this._gameObject.transform);
        //     mesh.setPositionWithLocalVector(new BABYLON.Vector3(0, 0, 0));
        // }
        const mesh = BABYLON.MeshBuilder.CreateBox("__MESH_BOX_COLL__", { height: 1, width: 1, depth: 1 }, this._scene);
        mesh.setParent(this._gameObject.transform);
        mesh.setPositionWithLocalVector(new BABYLON.Vector3(0, 0, 0));
        mesh.receiveShadows = false;
        this._editorGizmo = mesh;
        this._editorGizmo.doNotSerialize = true;
        this._editorGizmo.scaling = BABYLON.Vector3.One();
        this._editorGizmo.rotation = BABYLON.Vector3.Zero();
        // Appliquer le matériau au cube
        this._editorGizmo.material = BoxCollider.COLLIDER_MAT;
        // this._editorGizmo.renderOverlay = true;
        // this._editorGizmo.outlineWidth = 0.5;
        // this._editorGizmo.overlayColor = BABYLON.Color3.Green();
        this._editorGizmo.isPickable = false;
        this._editorGizmo.receiveShadows = false;
        this._editorGizmo.checkCollisions = false;
        this._editorGizmo.renderingGroupId = 2;
        this._editorGizmo.name += this._editorGizmo.uniqueId;
        this.isTrigger = false;

        this._worldChangedObserver = owner.onWorldTransformChanged.add(() => {
            this._handleWorldTransformChanged();
        });

        this._handleWorldTransformChanged();
    }

    // ---------- Construction dynamique (attaché à un Rigidbody parent) ----------

    buildShapeIntoBody(rb: Rigidbody) {
        if (!this._dirty) return;
        this._dirty = false;

        const scene = this._scene;
        const node = this._gameObject.transform;

        // Ensure matrices are up-to-date
        node.computeWorldMatrix(true);
        const rootNode = rb.gameObject.transform;
        rootNode.computeWorldMatrix(true);

        // Mesh proxy (the green cube)
        const mesh = this._editorGizmo as BABYLON.Mesh;
        if (!mesh) return;
        mesh.computeWorldMatrix(true);

        // --- SIZE (world) = (mesh local AABB size) ⊙ (mesh world scale) ---
        const bb = mesh.getBoundingInfo().boundingBox;
        const baseLocalSize = bb.maximum.subtract(bb.minimum); // exact local size, not world AABB

        const meshScale = new BABYLON.Vector3();
        const meshQ = new BABYLON.Quaternion();
        const meshP = new BABYLON.Vector3();
        mesh.getWorldMatrix().decompose(meshScale, meshQ, meshP);

        const sizeWorld = new BABYLON.Vector3(
            Math.abs(baseLocalSize.x * meshScale.x),
            Math.abs(baseLocalSize.y * meshScale.y),
            Math.abs(baseLocalSize.z * meshScale.z)
        );
        sizeWorld.scaleInPlace(this.PHYSICS_MARGIN);

        // --- OFFSET & ROTATION (root space) ---
        const rootWM = rootNode.getWorldMatrix();
        const rootInv = BABYLON.Matrix.Invert(rootWM);

        // Offset: center of the mesh in root space
        const offsetRoot = BABYLON.Vector3.TransformCoordinates(bb.centerWorld, rootInv);

        // Rotation: mesh world rot relative to root world rot
        const rootQ = BABYLON.Quaternion.FromRotationMatrix(rootWM.getRotationMatrix());
        const rotRoot = meshQ.multiply(rootQ.conjugate());

        // --- (Re)create shape centered at 0,0,0 (we pass offset/rot to the container) ---
        this._physicsShape?.dispose();
        const shape = new BABYLON.PhysicsShapeBox(
            BABYLON.Vector3.Zero(),               // center in shape-local
            BABYLON.Quaternion.Identity(),        // rotation in shape-local
            sizeWorld,                            // final size in world units
            scene
        );
        (shape as any).isTrigger = this._isTrigger;
        this._applyMaterial(shape);
        this._physicsShape = shape;

        // If a static body was left over, remove it
        if (this._physicsBody) {
            this._physicsBody.dispose();
            this._physicsBody = undefined;
        }

        // Inject into the RB container with correct offset/rotation
        rb.addShape(shape, offsetRoot, rotRoot);
    }

    public _setDirty(v: boolean) {
        this._dirty = v;
    }

    public findRigidbody(): Rigidbody | undefined {
        let current: GameObject | undefined = this.gameObject;
        while (current) {
            const rb = current.getComponent(Rigidbody);
            if (rb) {
                // Dès qu’on en trouve un forcer rebuild au prochain cycle
                ColliderSystem.markDirty(this.gameObject);
                return rb;
            }
            current = current.parent;
        }
        return undefined;
    }

    public buildStatic() {
        if (!this._dirty) return;
        this._dirty = false;

        const node = this.gameObject.transform;
        node.computeWorldMatrix(true);

        // Toujours le gizmo du collider
        const mesh = this._editorGizmo as BABYLON.Mesh;
        if (!mesh) return;
        mesh.computeWorldMatrix(true);

        const bb = mesh.getBoundingInfo().boundingBox;

        // 1) TAILLE MONDE = taille locale × scale monde (pas d’AABB monde)
        const sizeLocal = bb.maximum.subtract(bb.minimum);
        const s = new BABYLON.Vector3();
        const qMesh = new BABYLON.Quaternion();
        const p = new BABYLON.Vector3();
        mesh.getWorldMatrix().decompose(s, qMesh, p);

        const sizeWorld = new BABYLON.Vector3(
            Math.abs(sizeLocal.x * s.x),
            Math.abs(sizeLocal.y * s.y),
            Math.abs(sizeLocal.z * s.z)
        );
        sizeWorld.scaleInPlace(this.PHYSICS_MARGIN);

        // 2) OFFSET local = centre du gizmo converti dans l'espace du collider
        const colliderWM = node.getWorldMatrix();
        const colliderInv = BABYLON.Matrix.Invert(colliderWM);
        const offsetLocal = BABYLON.Vector3.TransformCoordinates(bb.centerWorld, colliderInv);

        // 3) ROTATION locale = rot(meshWorld) * inv(rot(colliderWorld))
        const qNode = BABYLON.Quaternion.FromRotationMatrix(colliderWM.getRotationMatrix());
        const rotLocal = qMesh.multiply(qNode.conjugate());

        // 4) Body statique + shape
        if (!this._physicsBody) {
            this._physicsBody = new BABYLON.PhysicsBody(
                node, BABYLON.PhysicsMotionType.STATIC, false, this._scene
            );
        }

        this._physicsShape?.dispose();
        const shape = new BABYLON.PhysicsShapeBox(offsetLocal, rotLocal, sizeWorld, this._scene);
        (shape as any).isTrigger = this._isTrigger;
        this._applyMaterial(shape);

        this._physicsBody.shape = shape;
        this._physicsShape = shape;

        console.log(`[BoxCollider] Build Static body pour ${node.name}`);
    }

    public copyFrom<BoxCollider>(componentSource: BoxCollider) {
        alert("COPY BOX COLLIDER FROM " + componentSource.gameObject.Id + " INTO  : " + this._gameObject.Id);
        this._editorGizmo.dispose();
        this._editorGizmo = componentSource._boxMesh;
        return this;
    }

    /**
    * Supprime le composant BoxCollider de l'objet.
    */
    destroy(): void {
        ColliderSystem.unregisterCollider(this); // TODO : A voir si on peut le déplacer dans la classe Collider directement
        //TODO: Vérifier si le body du collider est relié à un rigidbody parent
    }

    public override toJson() : any {
        const json = super.toJson(); // récupère type + enabled + data:{}
        json.data.shape = "BOX";
        return json;
    }

}
