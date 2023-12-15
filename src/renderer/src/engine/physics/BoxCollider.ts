import { Mesh } from "babylonjs";
import { Game } from "../Game";
import { GameObject } from "../GameObject";
import { FiniteStateMachine } from "../FSM/FiniteStateMachine";
import { useFetcher } from "react-router-dom";
import { ProgrammableGameObject } from "../ProgrammableGameObject";

export default class BoxCollider {


    static colliders = new Map<number | string, BoxCollider>();

    private _boxMesh: Mesh;
    private _gameObject: GameObject;

    private _receiverFSM: FiniteStateMachine | null = null;

    detectableQualifiers: Array<string>;

    get shape(): Mesh {
        return this._boxMesh;
    }

    get gameObject() : GameObject {
        return this._gameObject;
    }

    _isTrigger: boolean = false;
    get isTrigger(): boolean {
        return this._isTrigger;
    }
    set isTrigger(value: boolean) {
        this._isTrigger = value;
        if (this._isTrigger) {
            this._boxMesh.physicsImpostor?.dispose();
        } else {
            this._boxMesh.setParent(null);
            this._boxMesh.physicsImpostor = new BABYLON.PhysicsImpostor(this._boxMesh, BABYLON.PhysicsImpostor.BoxImpostor, {
                mass: 0,
                restitution: 0,
                friction: 0,
            });
        }
    }

    // Le fsm qui appelera l'event OnCollisionEnter
    setEventReceiverFSM(fsm: FiniteStateMachine) {
        this._receiverFSM = fsm;
    }

    
    
    constructor(scene: BABYLON.Scene) {
        
        this.detectableQualifiers = new Array<string>();

        this._boxMesh = BABYLON.MeshBuilder.CreateBox("BoxCollider", { height: 3, width: 3, depth: 3 }, scene);
        
        BoxCollider.colliders.set(this._boxMesh.uniqueId, this);
        this._boxMesh.isVisible = true;
        this._boxMesh.visibility = 1;
        this._boxMesh.name += this._boxMesh.uniqueId;
        
        this._gameObject = new GameObject("BoiteCollision",scene);
        
        this.isTrigger = false; // créer le physicsImpostor en fonction du choix "isTrigger"
        this._boxMesh.setParent(this._gameObject);
        
        // scene.getEngine().runRenderLoop(function () {
        //     // si le parent à changé
        //     if(this._gameObject.parent != )
        // });

        
        
        this._boxMesh.isPickable = false;
        
        this._boxMesh.actionManager = new BABYLON.ActionManager(scene);
        
        console.log(this._gameObject);
        this._gameObject.onParentChange.add((newParent : GameObject)=> {
            alert("parent change");
            console.error(newParent.physicsImpostor);
            // le parent doit être un objet avec un rigidbody
            this.attachToGameObject(newParent);

            const impostor = newParent.physicsImpostor;

            if(impostor) {
                newParent.removeRigidbody();
                newParent.addRigidbody({mass:1,restitution:0.2,friction:0.5});
            }
        });

        Game.getInstance().onGameStarted.add(() => {
            
            //TEST
            //console.error(this._gameObject.parent.name);
            //this.attachToGameObject(this._gameObject.parent);

            console.log("box playing");

            // pour que la collision physique fonctionne il faut que le mesh soit enfant de l'objet qui a le rigidbody
            //this.attachToGameObject(this._gameObject.parent);

            this.detectCollisionTrigger('enter', true);
        });

        // TODO se désinscrire de l'event quand le jeu est stopé 
        Game.getInstance().onGameStoped.remove(() => {
            this.detectCollisionTrigger('enter', true);

            //this._boxMesh.setParent(this._gameObject);
        });
    }

    attachToGameObject(go: GameObject) : void {
        //this._boxMesh.position = go.position;
        this._boxMesh.setParent(go);
    }



    private detectCollisionTrigger(event: string, trigger: boolean) : void {

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
                                        //console.log(`collision : ${this._boxMesh.name} & ${otherColliderMesh.name}`);
                                        if (this._receiverFSM == null) { return };

                                        this._receiverFSM.onCollisionEnter.notifyObservers(otherCollider);
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