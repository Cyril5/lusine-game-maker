import { Mesh} from "babylonjs";
import { ProgrammableGameObject } from "../ProgrammableGameObject";
import { Game } from "../Game";

export default class ColliderComponent {
    
    static colliders = new Map<number | string, ColliderComponent>();

    private _boxMesh : Mesh;
    private _gameObject : ProgrammableGameObject;

    detectableQualifiers : Array<string>;
    
    get shape(): Mesh {
        return this._boxMesh;
    }
    
    _isTrigger : boolean = false;
    get isTrigger():boolean {
        return this._isTrigger;
    }
    set isTrigger(value : boolean) {
        this._isTrigger = value;
        if(this._isTrigger) {
            this._boxMesh.physicsImpostor?.dispose();
        }else{
            this._boxMesh.physicsImpostor = new BABYLON.PhysicsImpostor(this._boxMesh, BABYLON.PhysicsImpostor.BoxImpostor, { 
                mass: 0,
                restitution: 0,
                friction: 0,
            });
        }
    }

    
    constructor(gameObject : ProgrammableGameObject,scene : BABYLON.Scene) {
        
        this.detectableQualifiers = new Array<string>();

        this._gameObject = gameObject;
        this._boxMesh = BABYLON.MeshBuilder.CreateBox("BoxCollider", { height: 60, width: 75, depth: 140 }, scene);
        ColliderComponent.colliders.set(this._boxMesh.uniqueId,this);
        this._boxMesh.isVisible = true; // Masquer la boîte pour qu'elle ne soit pas visible dans la scène
        this._boxMesh.visibility = 0.25;
        this._boxMesh.name += this._boxMesh.uniqueId; 

        this.isTrigger = false; // créer le physicsImpostor

        this._boxMesh.setParent(this._gameObject);
        this._boxMesh.isPickable = false;

        this._boxMesh.actionManager = new BABYLON.ActionManager(scene);
        Game.getInstance().onGameStarted.add(()=>{
            this.detectCollisionTrigger('enter',true);
        });

        // TODO se désinscrire de l'event quand le jeu est stopé 
        Game.getInstance().onGameStoped.remove(()=>{
            this.detectCollisionTrigger('enter',true);
        });

    }

    private detectCollisionTrigger(event : string,trigger : boolean) {

        for (let [key, otherCollider] of ColliderComponent.colliders) {            
            const otherColliderMesh = otherCollider.shape;
            if(trigger) {
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
                                    ()=>{
                                        if(otherCollider) {
                                            //console.log(`collision : ${this._boxMesh.name} & ${otherColliderMesh.name}`);
                                            this._gameObject.fsm.onCollisionEnter.notifyObservers(otherCollider);
                                        }
                                    }
                                
                            )
                        );
                        break;
                }
            }
        }

    }

    // attachToGameObject(node : ProgrammableGameObject) {
    //     this._gameObject = node;
    // }

    get gameObject(): ProgrammableGameObject {
        return this._gameObject;
    }

}