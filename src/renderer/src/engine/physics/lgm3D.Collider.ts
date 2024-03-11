import { Game } from "../Game";
import { GameObject } from "../GameObject";
import { FiniteStateMachine } from "../FSM/FiniteStateMachine";
import { ProgrammableGameObject } from "../ProgrammableGameObject";
import Component from "../lgm3D.Component";
import { Renderer } from "../Renderer";

export default class Collider extends Component {

    public update(dt: number) {
        throw new Error("Method not implemented.");
    }

    private _hkPlugin: BABYLON.HavokPlugin;
    protected get havokPlugin(): BABYLON.HavokPlugin {
        return this._hkPlugin;
    }

    _colliderShape : BABYLON.PhysicsShape;
    protected _physicsBody : BABYLON.PhysicsBody;

    static colliders = new Map<number | string, Collider>();

    _boxMesh: BABYLON.Mesh;
    
    protected _receiverFSM: FiniteStateMachine | null = null;

    protected detectableQualifiers: Array<string>;


    get shape(): Mesh {
        return this._boxMesh;
    }


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

        super(null);

        this._hkPlugin = Renderer.getInstance().hk;
         
        this.detectableQualifiers = new Array<string>();
        
        return;
        const shapeSize = BABYLON.Vector3.One();
        this._boxMesh = BABYLON.MeshBuilder.CreateBox("BoxCollider", { height: shapeSize.y, width: shapeSize.x, depth: shapeSize.z }, scene);
        this._boxMesh.setParent(this._gameObject);
        const shapePos = this._boxMesh.position;
        this._colliderShape = new BABYLON.PhysicsShapeBox(
            shapePos,
            BABYLON.Quaternion.Identity(),
            shapeSize,
            scene);
        
        BoxCollider.colliders.set(this._boxMesh.uniqueId, this);
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

            if(newParent._shapeContainer) {
                alert("parent change");
                // this._colliderShape.dispose();
                // this._colliderShape = new BABYLON.PhysicsShapeBox(
                //     this._boxMesh.position,
                //     BABYLON.Quaternion.Identity(),
                //     shapeSize,
                //     scene);

                newParent._shapeContainer.addChildFromParent(newParent,this._colliderShape,this._boxMesh);
                newParent._shapeContainerChildren.push(this._colliderShape); 
            }  
            
            return;
            
            if(newParent) {
                console.error(newParent.physicsImpostor);
                // le parent doit être un objet avec un rigidbody
                this.attachToGameObject(newParent);
                this._owner = newParent;

                const impostor = newParent.physicsImpostor;
    
                if (impostor) {
                    newParent.removeRigidbody();
                    newParent.addRigidbody({ mass: 1, restitution: 0.2, friction: 0.5 });
                }
                this._gameObject.onAfterWorldMatrixUpdateObservable.add(()=>{
                    this.updateBodyShape();
                });
            }else{
                this._gameObject.onAfterWorldMatrixUpdateObservable.removeCallback(()=>this.updateBodyShape());
            }
        });


        Game.getInstance().onGameStarted.add(() => {

            if(this._owner) {

                //AMMOJS : pour que la collision physique fonctionne il faut que le mesh soit enfant de l'objet qui a le rigidbody
                // this.attachToGameObject(this._owner);
                // this._owner.physicsImpostor.forceUpdate();
            }
            this.detectCollisionTrigger('enter', true);

            this.updateBodyShape();
        });

        // TODO se désinscrire de l'event quand le jeu est stopé 
        Game.getInstance().onGameStoped.remove(() => {
            this.detectCollisionTrigger('enter', true);

            this.updateBodyShape();
        });
    }

    attachToGameObject(go: GameObject): void {
        //this._boxMesh.position = go.position;
        this._boxMesh.setParent(go);
    }

    updateBodyShape() {
            // On remet à jour le shapeContainer si il y a des modifications sur les dimensions du boxCollider
            const parentBodyGameObject = (this._gameObject.parent as GameObject);
            if(parentBodyGameObject) {
                parentBodyGameObject._shapeContainer.removeChild(this._colliderShape);
                parentBodyGameObject._shapeContainer.addChildFromParent(parentBodyGameObject,this._colliderShape,this._boxMesh);
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



    protected detectCollisionTrigger(event: string, trigger: boolean): void {

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

    public toJSON() {
        const test = JSON.stringify(this);
    }

}
