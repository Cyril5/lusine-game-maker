import { Game } from "../Game";
import { GameObject } from "../GameObject";
import { FiniteStateMachine } from "../FSM/lgm3D.FiniteStateMachineOLD";
import { ProgrammableGameObject } from "../ProgrammableGameObject";
import Collider from "./lgm3D.Collider";
import { ColliderMetaData, GameObjectComponentMetaData } from "../structs/ComponentsMetaData";
import BoxColliderInspector, { InspectorComponent } from "@renderer/components/Objects/BoxColliderComponentInspector";
import Utils from "../utils/lgm3D.Utils";
import { ColliderSystem } from "./lgm3D.ColliderSystem";
import { Rigidbody } from "./lgm3D.Rigidbody";
import * as BABYLON from "@babylonjs/core";

@InspectorComponent(BoxColliderInspector)
export default class BoxCollider extends Collider {

    private PHYSICS_MARGIN = 0.998; // ou 0.995 (correction visuelle pour compenser la marge physique).
    static COLLIDER_MAT: BABYLON.StandardMaterial;
    size: BABYLON.Vector3 = new BABYLON.Vector3(1, 1, 1);  // dimensions of the box

    public metaData: ColliderMetaData = {
        shape: undefined,
        isTrigger: false,
        physicsBody: {
            material: undefined
        },
        type: ""
    };

    // Le fsm qui appelera l'event OnCollisionEnter
    setEventReceiverFSM(fsm: FiniteStateMachine) {
        this._receiverFSM = fsm;
    }

    constructor(owner: GameObject) {

        super(owner);
        this._scene = this._gameObject.scene;

        // Si il y a déjà un maillage alors prendre les dimensions de ce dernier
        let mesh = this._gameObject.transform.getChildMeshes(true)[0];
        if (!mesh) {
            mesh = BABYLON.MeshBuilder.CreateBox("__MeshBoxCollider__", { height: 1, width: 1, depth: 1 }, this._scene);
            mesh.setParent(this._gameObject.transform);
            mesh.setPositionWithLocalVector(new BABYLON.Vector3(0, 0, 0));
        }
        this._editorGizmo = mesh;
        this._editorGizmo.doNotSerialize = true;

        this._editorGizmo.isVisible = true;
        this._editorGizmo.visibility = 0.5;

        //this._physicsBody.setMassProperties({ mass: 0 });
        //this.register();

        if (!BoxCollider.COLLIDER_MAT) {
            BoxCollider.COLLIDER_MAT = new BABYLON.StandardMaterial("_EDITOR_COLLIDER_MAT_", this._scene);
            BoxCollider.COLLIDER_MAT.wireframe = true;
            BoxCollider.COLLIDER_MAT.doNotSerialize = true;
        }
        // Appliquer le matériau au cube
        this._editorGizmo.material = BoxCollider.COLLIDER_MAT;
        this._editorGizmo.renderOverlay = true;
        this._editorGizmo.outlineWidth = 0.5;
        this._editorGizmo.overlayColor = BABYLON.Color3.Green();

        this._editorGizmo.name += this._editorGizmo.uniqueId;
        this._editorGizmo.isPickable = false;

        this.isTrigger = false;

        ColliderSystem.registerCollider(this);  // 👈 pas de dépendance inverse
        ColliderSystem.install(this.gameObject.scene);          // safe: no-op si déjà installé
        // Build initial via le batch (facultatif : on peut marquer dirty ici)
        ColliderSystem.markDirty(this.gameObject);

        // Cet évenement est appelé après l'activation du moteur physique
        // TODO : enlever cet event quand le collider est supprimé
        Game.getInstance().onGameStarted.add(this.onGameStartedEvent());

        Game.getInstance().onGameStopped.add(this.onGameStoppedEvent());
    }

    // ---------- Construction dynamique (attaché à un Rigidbody parent) ----------

    buildShapeInto(rb: Rigidbody) {
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
            node.position,               // center in shape-local
            BABYLON.Quaternion.Identity(),        // rotation in shape-local
            sizeWorld,                            // final size in world units
            scene
        );
        (shape as any).isTrigger = this._isTrigger;
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

        // 1) Récupérer le mesh proxy (cube vert, par ex.)
        const mesh = node.getChildMeshes(true)[0];
        if (!mesh) {
            console.warn(`[BoxCollider] Aucun mesh trouvé pour ${node.name}`);
            return;
        }
        mesh.computeWorldMatrix(true);

        // 2) BoundingBox du mesh en MONDE
        const bb = mesh.getBoundingInfo().boundingBox;
        const sizeWorld = bb.extendSizeWorld.scale(2);

        // 3) Calcul offset/rot locaux par rapport au collider root
        const colliderWM = node.getWorldMatrix();
        const colliderInv = BABYLON.Matrix.Invert(colliderWM);

        // Centre du mesh -> en local du collider
        const offsetLocal = node.position;

        // Rotation locale = rot(meshWorld) * inverse(rot(colliderWorld))
        const meshRotWorld = BABYLON.Quaternion.FromRotationMatrix(mesh.getWorldMatrix().getRotationMatrix());
        const nodeRotWorld = BABYLON.Quaternion.FromRotationMatrix(colliderWM.getRotationMatrix());
        const rotLocal = meshRotWorld.multiply(nodeRotWorld.conjugate());

        // 4) Créer le body si inexistant
        if (!this._physicsBody) {
            this._physicsBody = new BABYLON.PhysicsBody(
                node,
                BABYLON.PhysicsMotionType.STATIC,
                false,
                this._scene
            );
        }

        // 5) Jeter l’ancienne shape si elle existe
        if (this._physicsShape) {
            this._physicsShape.dispose();
            this._physicsShape = undefined;
        }

        // 6) Créer la nouvelle shape
        const shape = new BABYLON.PhysicsShapeBox(offsetLocal, rotLocal, sizeWorld, this._scene);
        (shape as any).isTrigger = this._isTrigger;

        // 7) Assigner au body
        this._physicsBody.shape = shape;
        this._physicsShape = shape;

        console.log(`[BoxCollider] Build Static body pour ${node.name}`);
    }

    private onGameStoppedEvent() {
        if (this._physicsBody) {
            this._physicsBody.setCollisionCallbackEnabled(false);
            this._physicsBody.getCollisionObservable().removeCallback(this.detectionCollision);
        }
    }

    private onGameStartedEvent() {
        if (this._physicsBody) {
            this._physicsBody.setCollisionCallbackEnabled(true);
            this._physicsBody.getCollisionObservable().add(this.detectionCollision);
        }
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
        ColliderSystem.unregisterCollider(this);
        Game.getInstance().onGameStarted.removeCallback(this.onGameStartedEvent);
        this._physicsBody?.setCollisionCallbackEnabled(false);
        this._physicsBody?.getCollisionObservable().removeCallback(this.detectionCollision);
        this._physicsBody?.dispose();
        this._physicsBody.dispose();
        this._editorGizmo.dispose();

        //TODO: Vérifier si le body du collider est relié à un rigidbody parent
    }

    public toJson() {
        this.metaData.type = Utils.BX_COLLIDER_COMPONENT_TYPE;
        (this.metaData as ColliderMetaData).isTrigger = this.isTrigger;
        return this.metaData;
    }

    detectionCollision(collisionEvent: BABYLON.IPhysicsCollisionEvent): void {
        if (collisionEvent.type == "COLLISION_STARTED") {
            // envoyer le message à l'objet root qui a un FSM
            console.log("COLLISION STARTED !!");
        }
    }

    // Deprecated
    detectCollisionTrigger(event: string, trigger: boolean): void {

        for (let [key, otherCollider] of BoxCollider.colliders) {
            const otherColliderMesh = otherCollider.shape;
            if (trigger) {
                switch (event) {
                    case 'enter':
                        this._boxMesh.actionManager.registerAction(
                            new BABYLON.ExecuteCodeAction(
                                {
                                    trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                                    parameter: {
                                        mesh: otherColliderMesh,
                                        usePreciseIntersection: false // false pour les boxCollider 
                                    }
                                },
                                () => {
                                    if (otherCollider) {
                                        console.log(`collision : ${this._boxMesh.name} & ${otherColliderMesh.name}`);

                                        (this._gameObject as ProgrammableGameObject)?.finiteStateMachines[0].onCollisionEnter.notifyObservers(otherCollider);
                                    }
                                }

                            )
                        );
                        break;
                }
            }
        }

    }

}
