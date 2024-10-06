import { Game } from "../Game";
import { GameObject } from "../GameObject";
import { FiniteStateMachine } from "../FSM/FiniteStateMachine";
import { ProgrammableGameObject } from "../ProgrammableGameObject";
import Collider from "./lgm3D.Collider";
import Rigidbody from "./lgm3D.Rigidbody";
import { ColliderMetaData, GameObjectComponentMetaData } from "../structs/ComponentsMetaData";
import BoxColliderInspector, { InspectorComponent } from "@renderer/components/Objects/BoxColliderComponentInspector";
import Component from "../lgm3D.Component";


@InspectorComponent(BoxColliderInspector)
export default class BoxCollider extends Collider {

    static COLLIDER_MAT: BABYLON.StandardMaterial;
    // le collider n'a plus de physicsBody lorsqu'il est rattaché à un parent qui a Rigidbody

    _colliderShape: BABYLON.PhysicsShape;

    size: BABYLON.Vector3 = new BABYLON.Vector3(1, 1, 1);  // dimensions of the box

    public metaData: ColliderMetaData = {
        shape: undefined,
        isTrigger: false,
        physicsBody: {
            material: undefined
        },
        type: ""
    };

    _isTrigger: boolean = false;
    private _scene: BABYLON.Scene;

    get isTrigger(): boolean {
        return this._isTrigger;
    }

    set isTrigger(value: boolean) {
        if (this._isTrigger !== value) {
            this._isTrigger = value;
            this._colliderShape.isTrigger = this._isTrigger;
        }
    }

    // Le fsm qui appelera l'event OnCollisionEnter
    setEventReceiverFSM(fsm: FiniteStateMachine) {
        this._receiverFSM = fsm;
    }


    constructor(owner: GameObject) {

        super(owner);

        this._gameObject = owner;
        this._scene = this._gameObject.scene;
        
        const shapeSize = new BABYLON.Vector3(1, 1, 1);
        this._boxMesh = BABYLON.MeshBuilder.CreateBox("BoxCollider", { height: shapeSize.y, width: shapeSize.x, depth: shapeSize.z }, this._scene);
        this._boxMesh.doNotSerialize = true; // ne pas sauvegarder le maillage dans le JSON à chaque fois
        this._boxMesh.parent = this._gameObject.transform;
        const shapePos = this._boxMesh.position;
        this._colliderShape = new BABYLON.PhysicsShapeBox(
            shapePos,
            BABYLON.Quaternion.Identity(),
            shapeSize,
            this._scene);


        this._boxMesh.isVisible = true;
        this._boxMesh.visibility = 0.5;

        this.updateBodyShape();

        this._physicsBody.setMassProperties({ mass: 0 });

        if (!BoxCollider.COLLIDER_MAT) {

            BoxCollider.COLLIDER_MAT = new BABYLON.StandardMaterial("_EDITOR_COLLIDER_MAT_", this._scene);
            BoxCollider.COLLIDER_MAT.wireframe = true;
            BoxCollider.COLLIDER_MAT.doNotSerialize = true;
        }
        // Appliquer le matériau au cube
        this._boxMesh.material = BoxCollider.COLLIDER_MAT;
        //this._boxMesh.renderOutline = true;
        this._boxMesh.renderOverlay = true;
        this._boxMesh.outlineWidth = 0.5;
        this._boxMesh.overlayColor = BABYLON.Color3.Green();

        this._boxMesh.name += this._boxMesh.uniqueId;
        this._boxMesh.isPickable = false;

        this.isTrigger = false;


        // Cet évenement est appelé après l'activation du moteur physique
        // TODO : enlever cet event quand le collider est supprimé
        Game.getInstance().onGameStarted.add(this.onGameStartedEvent());

        Game.getInstance().onGameStoped.add(this.onGameStopedEvent());
    }
    
    private onGameStopedEvent() {
        
        if (this._physicsBody) {
            this._physicsBody.setCollisionCallbackEnabled(false);
            this._physicsBody.getCollisionObservable().removeCallback(this.detectionCollision);
        }
    }

    private onGameStartedEvent() {

        // Mise à jour de l'échelle
        //this.updateBodyShape();

        // On remet à jour le shapeContainer si il y a des modifications sur les dimensions du boxCollider
        const parent = this._gameObject.transform.parent;
        // if (parent) {
        //     const parentRigidbody = parent.getComponent<Rigidbody>("Rigidbody");
        //     if (parentRigidbody) { // BUG : il faut d'abord ajouter le composant rigidbody sur le parent avec les collider enfants
        //         if (this._physicsBody) {
        //                 this._physicsBody.dispose();
        //                 //this._colliderShape.dispose();
        //                 this._physicsBody = null;
        //         }
        //         //parentRigidbody._shapeContainer.removeChild(this._colliderShape);
        //         //parentRigidbody._shapeContainer.addChildFromParent(this._boxMesh, this._colliderShape, parentRigidbody.gameObject);
        //     } else {
        //         this._physicsBody.shape = this._colliderShape;
        //     }
        // }

        if (this._physicsBody) {
            this._physicsBody.setCollisionCallbackEnabled(true);
            this._physicsBody.getCollisionObservable().add(this.detectionCollision);
        }
    }

    public copyFrom<BoxCollider>(componentSource: BoxCollider) {
        alert("COPY BOX COLLIDER FROM " +componentSource.gameObject.Id+ " INTO  : " + this._gameObject.Id);
        this._boxMesh.dispose();
        this._boxMesh = componentSource._boxMesh;
        return this;
    }

    /**
   * Supprime le composant BoxCollider de l'objet.
   */
    destroy() : void {
        Game.getInstance().onGameStarted.removeCallback(this.onGameStartedEvent);
        this._physicsBody?.setCollisionCallbackEnabled(false);
        this._physicsBody?.getCollisionObservable().removeCallback(this.detectionCollision);
        this._physicsBody?.dispose();
        this._colliderShape.dispose();
        this._boxMesh.dispose();
        this._gameObject._components.delete(this);
    }

    public toJson() {
        this.metaData.type = Collider.name;
        (this.metaData as ColliderMetaData).isTrigger = this.isTrigger;
        return this.metaData;
    }

    updateBodyShape(updateSize = true) : BABYLON.PhysicsShapeBox {

        this._physicsBody = new BABYLON.PhysicsBody(this._gameObject.transform, BABYLON.PhysicsMotionType.STATIC, false, this._gameObject.scene);

        //console.log(this._boxMesh.getBoundingInfo().boundingBox.maximum * new BABYLON.Vector3(2, 2, 2));
        const collShapeUpdated = new BABYLON.PhysicsShapeBox(
            this._boxMesh.position,
            this._boxMesh.rotationQuaternion,
            //this._gameObject.parent ? this._boxMesh.getBoundingInfo().boundingBox.extendSize * this._gameObject.scaling : this._gameObject.scaling,
            //updateSize ? this._boxMesh.getBoundingInfo().boundingBox.extendSize * this._gameObject.scale
            this._gameObject.scale,
            this._scene
        );

        this._colliderShape = collShapeUpdated;
        if (this._physicsBody) {
            this._physicsBody.shape = this._colliderShape;
        }
        return collShapeUpdated;
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
