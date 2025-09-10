import { Game } from "../Game";
import { GameObject } from "../GameObject";
import { FiniteStateMachine } from "../FSM/lgm3D.FiniteStateMachine";
import { ProgrammableGameObject } from "../ProgrammableGameObject";
import Collider from "./lgm3D.Collider";
import { ColliderMetaData, GameObjectComponentMetaData } from "../structs/ComponentsMetaData";
import BoxColliderInspector, { InspectorComponent } from "@renderer/components/Objects/BoxColliderComponentInspector";
import Component from "../lgm3D.Component";
import Utils from "../utils/lgm3D.Utils";
import { RigidbodyTest } from "./lgm3D.Rigidbody";
import { ColliderSystem } from "./lgm3D.ColliderSystem";
import Rigidbody from "./lgm3D.Rigidbody";


@InspectorComponent(BoxColliderInspector)
export default class BoxCollider extends Collider {

    private PHYSICS_MARGIN = 0.998; // ou 0.995 (correction visuelle pour compenser la marge physique).
    static COLLIDER_MAT: BABYLON.StandardMaterial;

    // le collider n'a plus de physicsBody lorsqu'il est rattaché à un parent qui a Rigidbody
    private _body: BABYLON.PhysicsBody;
    private _rb: RigidbodyTest;

    private physicsShape: BABYLON.PhysicsShape;
    size: BABYLON.Vector3 = new BABYLON.Vector3(1, 1, 1);  // dimensions of the box

    private _dirty = true; // reconstruit une première fois
    private _scene: BABYLON.Scene;

    public metaData: ColliderMetaData = {
        shape: undefined,
        isTrigger: false,
        physicsBody: {
            material: undefined
        },
        type: ""
    };

    _isTrigger: boolean = false;

    get isTrigger(): boolean {
        return this._isTrigger;
    }

    set isTrigger(value: boolean) {
        if (this._isTrigger !== value) {
            this._isTrigger = value;
            this.physicsShape.isTrigger = this._isTrigger;
        }
    }

    // Le fsm qui appelera l'event OnCollisionEnter
    setEventReceiverFSM(fsm: FiniteStateMachine) {
        this._receiverFSM = fsm;
    }

    constructor(owner: GameObject) {

        super(owner);
        this._scene = this._gameObject.scene;

        // Si il y a déjà un maillage alors prendre les dimensions de ce dernier
        let mesh: BABYLON.AbstractMesh = this._gameObject.transform.getChildMeshes(true)[0];
        if (!mesh) {
            mesh = BABYLON.MeshBuilder.CreateBox("__MeshBoxCollider__", { height: 1, width: 1, depth: 1 }, this._scene);
            mesh.setParent(this._gameObject.transform);
            mesh.setPositionWithLocalVector(new BABYLON.Vector3(0, 0, 0));
        }
        this._boxMesh = mesh;
        this._boxMesh.doNotSerialize = true;

        this._boxMesh.isVisible = true;
        this._boxMesh.visibility = 0.5;

        //this._physicsBody.setMassProperties({ mass: 0 });
        //this.register();

        if (!BoxCollider.COLLIDER_MAT) {
            BoxCollider.COLLIDER_MAT = new BABYLON.StandardMaterial("_EDITOR_COLLIDER_MAT_", this._scene);
            BoxCollider.COLLIDER_MAT.wireframe = true;
            BoxCollider.COLLIDER_MAT.doNotSerialize = true;
        }
        // Appliquer le matériau au cube
        this._boxMesh.material = BoxCollider.COLLIDER_MAT;
        this._boxMesh.renderOverlay = true;
        this._boxMesh.outlineWidth = 0.5;
        this._boxMesh.overlayColor = BABYLON.Color3.Green();

        this._boxMesh.name += this._boxMesh.uniqueId;
        this._boxMesh.isPickable = false;

        this.isTrigger = false;

        ColliderSystem.registerCollider(this);  // 👈 pas de dépendance inverse
        ColliderSystem.install(this.gameObject.scene);          // safe: no-op si déjà installé
        // Build initial via le batch (facultatif : on peut marquer dirty ici)
        ColliderSystem.markDirty(this.gameObject);

        // À chaque update de worldMatrix du TransformNode, on vérifie si le LOCAL a bougé.
        // (si c'est juste le parent RB qui bouge, le local ne change pas → pas de rebuild)
        // this.gameObject.transform.onAfterWorldMatrixUpdateObservable.add(() => {
        //     if (ColliderSystem._hasSignificantLocalDelta(this.gameObject)) {
        //         ColliderSystem.markDirty(this.gameObject);
        //     }
        // });

        // Cet évenement est appelé après l'activation du moteur physique
        // TODO : enlever cet event quand le collider est supprimé
        Game.getInstance().onGameStarted.add(this.onGameStartedEvent());

        Game.getInstance().onGameStopped.add(this.onGameStoppedEvent());
    }


    // register() {
    //     // 0) matrices à jour
    //     this._boxMesh.computeWorldMatrix(true);
    //     this._gameObject.transform.computeWorldMatrix(true);

    //     const scene = this._scene;
    //     const bb = this._boxMesh.getBoundingInfo().boundingBox;

    //     // --- 1) Choisir le "root" physique ---
    //     //    - si un Rigidbody parent existe, root = GameObject porteur du RB
    //     //    - sinon, root = ce collider lui-même (statique)
    //     const rb = this.findRigidbody();
    //     const rootGO = rb ? rb.gameObject : this._gameObject;

    //     const colliderWM = this._gameObject.transform.getWorldMatrix();
    //     const rootWM = rootGO.transform.getWorldMatrix();
    //     const rootInv = BABYLON.Matrix.Invert(rootWM);

    //     // Matrice RELATIVE "root -> collider"
    //     const rel = rootInv.multiply(colliderWM);

    //     // Décomposition de la matrice relative
    //     const scaleRel = new BABYLON.Vector3();
    //     const rotRel = new BABYLON.Quaternion();
    //     const posRel = new BABYLON.Vector3();
    //     rel.decompose(scaleRel, rotRel, posRel); // ← offsetLocal, rotLocal, scaleLocalRel

    //     // --- 2) Taille de la box (dans l'espace du mesh, sans rotation) ---
    //     const sizeLocal = bb.extendSize.scale(2); // AABB local du mesh
    //     const sizeForShape = new BABYLON.Vector3(
    //         Math.abs(sizeLocal.x * scaleRel.x),
    //         Math.abs(sizeLocal.y * scaleRel.y),
    //         Math.abs(sizeLocal.z * scaleRel.z)
    //     );
    //     const shape = new BABYLON.PhysicsShapeBox(
    //         BABYLON.Vector3.Zero(),            // center local = 0
    //         BABYLON.Quaternion.Identity(),     // rot locale = identity
    //         sizeForShape,                      // taille finale
    //         scene
    //     );
    //     shape.isTrigger = this.isTrigger;
    //     this.physicsShape = shape;

    //     if (rb) {
    //         const rootScale = rb.gameObject.scale;
    //         if (!Utils.isAbsVector3Uniform(rb._gameObject.scale))
    //             console.warn(`Le Rigidbody parent a un scale non uniforme (${rootScale.x.toFixed(3)}, ${rootScale.y.toFixed(3)}, ${rootScale.z.toFixed(3)}).
    //                 Cela peut provoquer des décalages et une physique instable. 
    //                 Recommandé : garder le scale du root à (1,1,1) et ajuster la taille via les colliders.`);

    //         // ✅ DYNAMIQUE : ajouter au container du Rigidbody parent
    //         rb.addShape(shape, posRel, rotRel);
    //         if (this._body) {
    //             this._body.dispose();
    //             this._body = undefined;
    //         }
    //     } else {
    //         // ✅ STATIQUE : body sur CE collider
    //         // root = collider → la relative est l'identité, donc offset=0/rot=identity
    //         const body = new BABYLON.PhysicsBody(
    //             this._gameObject.transform,
    //             BABYLON.PhysicsMotionType.STATIC,
    //             false,
    //             scene
    //         );
    //         // Ici, comme body est déjà au bon endroit, on peut mettre la shape directement,
    //         // sans container ni offset/rot supplémentaires :
    //         body.shape = shape;

    //         this._body = body;
    //     }
    // }


    // ---------- Construction dynamique (attaché à un Rigidbody parent) ----------

    buildShapeInto(rb: RigidbodyTest) {
        if (!this._dirty) return;
        this._dirty = false;

        const scene = this._scene;
        const node = this._gameObject.transform;

        // Ensure matrices are up-to-date
        node.computeWorldMatrix(true);
        const rootNode = rb.gameObject.transform;
        rootNode.computeWorldMatrix(true);

        // Mesh proxy (the green cube)
        const mesh = node.getChildMeshes(true)[0];
        if (!mesh) return;
        mesh.computeWorldMatrix(true);

        // --- SIZE (world) = (mesh local AABB size) ⊙ (mesh world scale) ---
        const bb = mesh.getBoundingInfo().boundingBox;
        const baseLocalSize = bb.maximum.subtract(bb.minimum); // exact local size, not world AABB

        const meshS = new BABYLON.Vector3();
        const meshQ = new BABYLON.Quaternion();
        const meshP = new BABYLON.Vector3();
        mesh.getWorldMatrix().decompose(meshS, meshQ, meshP);

        const sizeWorld = new BABYLON.Vector3(
            Math.abs(baseLocalSize.x * meshS.x),
            Math.abs(baseLocalSize.y * meshS.y),
            Math.abs(baseLocalSize.z * meshS.z)
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
        this.physicsShape?.dispose();
        const shape = new BABYLON.PhysicsShapeBox(
            BABYLON.Vector3.Zero(),               // center in shape-local
            BABYLON.Quaternion.Identity(),        // rotation in shape-local
            sizeWorld,                            // final size in world units
            scene
        );
        (shape as any).isTrigger = this._isTrigger;
        this.physicsShape = shape;

        // If a static body was left over, remove it
        if (this._body) { this._body.dispose(); this._body = undefined; }

        // Inject into the RB container with correct offset/rotation
        rb.addShape(shape, offsetRoot, rotRoot);
    }

    public _setDirty(v: boolean) {
        this._dirty = v;
    }

    public findRigidbody(): RigidbodyTest | undefined {
        let current: GameObject | undefined = this.gameObject;
        while (current) {
            const rb = current.getComponent<RigidbodyTest>(Utils.RB_COMPONENT_TYPE);
            if (rb) {
                // 👇 Dès qu’on en trouve un → forcer rebuild au prochain cycle
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
        const offsetLocal = BABYLON.Vector3.TransformCoordinates(bb.centerWorld, colliderInv);

        // Rotation locale = rot(meshWorld) * inverse(rot(colliderWorld))
        const meshRotWorld = BABYLON.Quaternion.FromRotationMatrix(mesh.getWorldMatrix().getRotationMatrix());
        const nodeRotWorld = BABYLON.Quaternion.FromRotationMatrix(colliderWM.getRotationMatrix());
        const rotLocal = meshRotWorld.multiply(nodeRotWorld.conjugate());

        // 4) Créer le body si inexistant
        if (!this._body) {
            this._body = new BABYLON.PhysicsBody(
                node,
                BABYLON.PhysicsMotionType.STATIC,
                false,
                this._scene
            );
        }

        // 5) Jeter l’ancienne shape si elle existe
        if (this.physicsShape) {
            this.physicsShape.dispose();
            this.physicsShape = undefined;
        }

        // 6) Créer la nouvelle shape
        const shape = new BABYLON.PhysicsShapeBox(offsetLocal, rotLocal, sizeWorld, this._scene);
        (shape as any).isTrigger = this._isTrigger;

        // 7) Assigner au body
        this._body.shape = shape;
        this.physicsShape = shape;

        console.log(`[BoxCollider] Build Static body pour ${node.name}`);
    }

    private onGameStoppedEvent() {
        if (this._body) {
            this._body.setCollisionCallbackEnabled(false);
            this._body.getCollisionObservable().removeCallback(this.detectionCollision);
        }
    }

    private onGameStartedEvent() {
        if (this._body) {
            this._body.setCollisionCallbackEnabled(true);
            this._body.getCollisionObservable().add(this.detectionCollision);
        }
    }

    public copyFrom<BoxCollider>(componentSource: BoxCollider) {
        alert("COPY BOX COLLIDER FROM " + componentSource.gameObject.Id + " INTO  : " + this._gameObject.Id);
        this._boxMesh.dispose();
        this._boxMesh = componentSource._boxMesh;
        return this;
    }

    /**
    * Supprime le composant BoxCollider de l'objet.
    */
    destroy(): void {
        ColliderSystem.unregisterCollider(this);
        Game.getInstance().onGameStarted.removeCallback(this.onGameStartedEvent);
        this._body?.setCollisionCallbackEnabled(false);
        this._body?.getCollisionObservable().removeCallback(this.detectionCollision);
        this._body?.dispose();
        this.physicsShape.dispose();
        this._boxMesh.dispose();

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
