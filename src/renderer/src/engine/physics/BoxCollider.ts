import { Mesh } from "babylonjs";
import { Game } from "../Game";
import { GameObject } from "../GameObject";
import { FiniteStateMachine } from "../FSM/FiniteStateMachine";

export default class BoxCollider {

    static colliders = new Map<number | string, BoxCollider>();

    private _boxMesh: Mesh;
    private _gameObject: GameObject;

    private _receiverFSM: FiniteStateMachine | null = null;

    detectableQualifiers: Array<string>;

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
            this._boxMesh.physicsImpostor?.dispose();
        } else {
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

        this._gameObject = new GameObject("BoiteCollision", scene);
        this._boxMesh = BABYLON.MeshBuilder.CreateBox("BoxCollider", { height: 3, width: 3, depth: 3 }, scene);

        BoxCollider.colliders.set(this._boxMesh.uniqueId, this);
        this._boxMesh.isVisible = true;
        this._boxMesh.visibility = 1;
        this._boxMesh.name += this._boxMesh.uniqueId;

        //this.isTrigger = false; // créer le physicsImpostor

        this._boxMesh.physicsImpostor = new BABYLON.PhysicsImpostor(this._boxMesh, BABYLON.PhysicsImpostor.BoxImpostor, {
            mass: 0,
            restitution: 0,
            friction: 0,
        });
        
        this._boxMesh.isPickable = false;
        
        this._boxMesh.actionManager = new BABYLON.ActionManager(scene);
        Game.getInstance().onGameStarted.add(() => {
            this.detectCollisionTrigger('enter', true);
        });

        // TODO se désinscrire de l'event quand le jeu est stopé 
        Game.getInstance().onGameStoped.remove(() => {
            this.detectCollisionTrigger('enter', true);
        });

    }

    private detectCollisionTrigger(event: string, trigger: boolean) {

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

    // attachToGameObject(node : ProgrammableGameObject) {
    //     this._gameObject = node;
    // }

    get gameObject(): ProgrammableGameObject {
        return this._gameObject;
    }

}