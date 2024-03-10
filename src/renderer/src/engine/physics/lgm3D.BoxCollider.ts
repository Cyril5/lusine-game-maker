import { Game } from "../Game";
import { GameObject } from "../GameObject";
import { FiniteStateMachine } from "../FSM/FiniteStateMachine";
import { ProgrammableGameObject } from "../ProgrammableGameObject";
import Collider from "./lgm3D.Collider";
import Rigidbody from "./lgm3D.Rigidbody";

export default class BoxCollider extends Collider {

    // le collider n'a plus de physicsBody lorsqu'il est rattaché à un parent qui a Rigidbody

    _colliderShape: BABYLON.PhysicsShape;

    _isTrigger: boolean = false;
    private _scene: BABYLON.Scene;

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



    constructor(scene: BABYLON.Scene, owner: GameObject) {

        super(scene);

        this._gameObject = owner;
        this._scene = scene;

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

        //const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);
        //const sphereShape = new BABYLON.PhysicsShapeSphere(new BABYLON.Vector3(owner.position.x, 0, 0), 1, scene);
        this._physicsBody = new BABYLON.PhysicsBody(this._gameObject, BABYLON.PhysicsMotionType.STATIC,false,scene);
        this._colliderShape.material = { friction: 0.2, restitution: 0.3 };
        this.updateBodyShape();
        this._physicsBody.setMassProperties({ mass: 0 });


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

        this._gameObject.onParentChange.add((newParent: GameObject) => {

            const parentRbContainer = newParent.getComponent<Rigidbody>("Rigidbody");
            console.log(parentRbContainer);

            if (parentRbContainer) {
                console.log("parent change");
                // this._colliderShape.dispose();
                // this._colliderShape = new BABYLON.PhysicsShapeBox(
                //     this._boxMesh.position,
                //     BABYLON.Quaternion.Identity(),
                //     shapeSize,
                //     scene);

                parentRbContainer._shapeContainer.addChildFromParent(newParent, this._colliderShape, this._boxMesh);
                parentRbContainer._shapeContainerChildren.push(this._colliderShape);
            }

            Game.getInstance().onGameStarted.add(() => {

                //if (this._owner) {

                //AMMOJS : pour que la collision physique fonctionne il faut que le mesh soit enfant de l'objet qui a le rigidbody
                // this.attachToGameObject(this._owner);
                // this._owner.physicsImpostor.forceUpdate();
                //}
                //this.detectCollisionTrigger('enter', true);

                this.updateBodyShape();

            });

            // TODO se désinscrire de l'event quand le jeu est stopé 
            Game.getInstance().onGameStoped.remove(() => {
                //this.detectCollisionTrigger('enter', true);

                //this.updateBoxMeshCollider();
                this._physicsBody.disablePreStep = false;
                this._physicsBody.getCollisionObservable().removeCallback(this.detectionCollision);
            });
        });

        // TODO : enlever cet event quand le collider est supprimé
        Game.getInstance().onGameStarted.add(()=>{
            // Mise à jour de l'échelle
            this.updateBodyShape();
            
            if(this._physicsBody) {
                this._physicsBody.setCollisionCallbackEnabled(true);
                this._physicsBody.getCollisionObservable().add(this.detectionCollision);
                this._physicsBody.disablePreStep = false;
                
                //test : this._gameObject.position = new BABYLON.Vector3(0,10,0);
                scene.onAfterRenderObservable.addOnce(() => {
                    // Turn disablePreStep on again for maximum performance
                    this._physicsBody.disablePreStep = true;
                });
            }
        });

        Game.getInstance().onGameStoped.add(()=>{
            this._physicsBody.setCollisionCallbackEnabled(false);
            this._physicsBody.getCollisionObservable().removeCallback(this.detectionCollision);
        });
    }

    private updateBodyShape() {

        const collShapeUpdated = new BABYLON.PhysicsShapeBox(
            this._boxMesh.position,
            this._boxMesh.rotationQuaternion,
            this._gameObject.scaling
            ,this._scene);
        
        this._colliderShape = collShapeUpdated;
        this._physicsBody.shape = this._colliderShape;

        // On remet à jour le shapeContainer si il y a des modifications sur les dimensions du boxCollider
        const parent = this._gameObject.parent;
        if(parent) {
            const parentRigidbody = parent.getComponent<Rigidbody>("Rigidbody");
            if (parentRigidbody) {
                this._physicsBody.dispose();
                parentRigidbody._shapeContainer.removeChild(this._colliderShape);
                parentRigidbody._shapeContainer.addChildFromParent(parentRigidbody.gameObject, this._colliderShape, this._boxMesh);
            }else{

            }
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
