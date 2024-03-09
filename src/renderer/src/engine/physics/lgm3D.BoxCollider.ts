import { Game } from "../Game";
import { GameObject } from "../GameObject";
import { FiniteStateMachine } from "../FSM/FiniteStateMachine";
import { ProgrammableGameObject } from "../ProgrammableGameObject";
import Collider from "./lgm3D.Collider";
import Rigidbody from "./lgm3D.Rigidbody";

export default class BoxCollider extends Collider {

    _colliderShape: BABYLON.PhysicsShape;

    _isTrigger: boolean = false;
    get isTrigger(): boolean {
        return this._isTrigger;
    }
    set isTrigger(value: boolean) {
        this._isTrigger = value;
        if (this._isTrigger) {
            //ammojs
            //this._boxMesh.physicsImpostor?.dispose();
            this._colliderShape.isTrigger = true;
        } else {
            //ammojs
            // this._boxMesh.physicsImpostor = new BABYLON.PhysicsImpostor(this._boxMesh, BABYLON.PhysicsImpostor.BoxImpostor, {
            //     mass: 0,
            //     restitution: 0,
            //     friction: 0,
            // });
            this._colliderShape.isTrigger = false;
        }
    }

    // Le fsm qui appelera l'event OnCollisionEnter
    setEventReceiverFSM(fsm: FiniteStateMachine) {
        this._receiverFSM = fsm;
    }



    constructor(scene: BABYLON.Scene) {

        super(scene);

        this._gameObject.addComponent(this,"BoxCollider");

        const shapeSize = BABYLON.Vector3.One();
        this._boxMesh = BABYLON.MeshBuilder.CreateBox("BoxCollider", { height: shapeSize.y, width: shapeSize.x, depth: shapeSize.z }, scene);
        this._boxMesh.setParent(this._gameObject);
        const shapePos = this._boxMesh.position;
        this._colliderShape = new BABYLON.PhysicsShapeBox(
            shapePos,
            BABYLON.Quaternion.Identity(),
            shapeSize,
            scene);

        this._boxMesh.isVisible = true;
        this._boxMesh.visibility = 0.5;

        const material = new BABYLON.StandardMaterial("material", scene);
        material.wireframe = true;
        material.diffuseColor = BABYLON.Color3.Green();
        // Appliquer le matériau au cube
        this._boxMesh.material = material;

        this._boxMesh.name += this._boxMesh.uniqueId;

        this.isTrigger = false; // créer le physicsImpostor en fonction du choix "isTrigger"

        // scene.getEngine().runRenderLoop(function () {
        //     // si le parent à changé
        //     if(this._gameObject.parent != )
        // });

        this._boxMesh.isPickable = false;

        this._boxMesh.actionManager = new BABYLON.ActionManager(scene);

        this._gameObject.onParentChange.add((newParent: GameObject) => {

            alert(newParent._shapeContainer);

            if (newParent._shapeContainer) {
                alert("parent change");
                // this._colliderShape.dispose();
                // this._colliderShape = new BABYLON.PhysicsShapeBox(
                //     this._boxMesh.position,
                //     BABYLON.Quaternion.Identity(),
                //     shapeSize,
                //     scene);

                newParent._shapeContainer.addChildFromParent(newParent, this._colliderShape, this._boxMesh);
                newParent._shapeContainerChildren.push(this._colliderShape);
            }

            Game.getInstance().onGameStarted.add(() => {

                //if (this._owner) {

                    //AMMOJS : pour que la collision physique fonctionne il faut que le mesh soit enfant de l'objet qui a le rigidbody
                    // this.attachToGameObject(this._owner);
                    // this._owner.physicsImpostor.forceUpdate();
                //}
                this.detectCollisionTrigger('enter', true);

                this.updateBoxMeshCollider();
            });

            // TODO se désinscrire de l'event quand le jeu est stopé 
            Game.getInstance().onGameStoped.remove(() => {
                this.detectCollisionTrigger('enter', true);

                this.updateBoxMeshCollider();
            });
        })
    }

    updateBoxMeshCollider() {
        // On remet à jour le shapeContainer si il y a des modifications sur les dimensions du boxCollider
        const parentRigidbody = (this._gameObject.parent as GameObject).getComponent<Rigidbody>("Rigidbody");
        if (parentRigidbody) {
            parentRigidbody._shapeContainer.removeChild(this._colliderShape);
            parentRigidbody._shapeContainer.addChildFromParent(parentRigidbody.gameObject, this._colliderShape, this._boxMesh);
        }

        //console.log("update transform");
        // this._boxMesh.position = this._gameObject.position;
        // this._boxMesh.scaling = this._gameObject.scaling;
        // this._boxMesh.rotation = this._gameObject.rotation;
        // On met à jour le rigidbody parent
        // const impostor = this._owner.physicsImpostor;

        // if (impostor) {
        //     this._owner.removeRigidbody();
        //     this._owner.addRigidbody({ mass: 1, restitution: 0.2, friction: 0.5 });
        // }

        //this._boxMesh._physicsImpostor!.setScalingUpdated();
    }

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

                                        (this._owner as ProgrammableGameObject)?.finiteStateMachines[0].onCollisionEnter.notifyObservers(otherCollider);
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
