import { Engine } from "@babylonjs/core";
import { GameObject } from "./GameObject";
import { Renderer } from "./Renderer";
import { ProgrammableGameObject } from "./ProgrammableGameObject";
import InputManager , {KeyCode } from "./InputManager";
import State from "./FSM/State";
import { Observable, Vector3 } from "babylonjs";
import DemoTest from "./DemoTest/DemoTest";
import Rigidbody from "./physics/lgm3D.Rigidbody";
import BoxCollider from "./physics/lgm3D.BoxCollider";
import Utils from "./lgm3D.Utils";

export class Game {

    //historyCommand : ICommand;

    onGameStarted: Observable<void>;
    onGameUpdate: Observable<void>;
    onGameStoped: Observable<void>;

    private static _instance: any;

    private static _deltaTime: number = 0;
    private _engine: Engine | undefined;
    private _isRunning: boolean = false;

    get isRunning(): boolean {
        return this._isRunning;
    }

    private _t;

    private _demoTest = new DemoTest();
    private pyodide;


    public static getInstance() {

        if (!Game._instance) {
            this._instance = new Game();
            return Game._instance;
        } else {
            return Game._instance;
        }
    }

    public getPyodide() {
        return this.pyodide;
    }

    // Deltatime in seconds
    static get deltaTime(): number {
        return Game._deltaTime;
    }

    static get input():InputManager {
        return InputManager.getInstance();
    }

    public async start() {

        
        const scene = Renderer.getInstance().scene;
        
        // Interpretation des codes de chaques states de chaques fsm
        const gameObjects = GameObject.gameObjects.values();
        
        let runCodeSuccess = 0;
        
        this._demoTest.init(scene);
        
        for (const gameObject of gameObjects) {
            
            //Mis à jour des shapes des rigidbody
            // const rb = gameObject.getComponent<Rigidbody>(Utils.RB_COMPONENT_TYPE);
            // //rb?.test(); // NE PAS ENLEVER POUR LE MOMENT
            
            // const collider = gameObject.getComponent<BoxCollider>(Utils.BX_COLLIDER_COMPONENT_TYPE);
            // if (collider) {
                //     if (!collider.gameObject.transform.parent) {
                    //         collider.updateBodyShape();
                    //     }
                    // }
                    
                    if (gameObject instanceof ProgrammableGameObject) {
                        
                        const states = gameObject.finiteStateMachines[0].states.length;
                        if (states > 0) {
                            for (let index = 0; index < states; index++) {
                                const state = gameObject.finiteStateMachines[0].states[index];
                                await state.runCode();
                            }
                            if (gameObject.finiteStateMachines[0].currentState) {
                                console.log(gameObject.finiteStateMachines[0].currentState.onEnterState);
                                gameObject.finiteStateMachines[0].currentState.onEnterState.notifyObservers();
                            }
                        }
                    }
                }
                
                clearTimeout(this._t);
                scene.physicsEnabled = true;
                this.onGameStarted.notifyObservers();
                this._isRunning = true;

                console.log("Game started");
                this._demoTest.start();
            }
            
            private update(deltaTime: number) {

        if (!this._isRunning)
            return;

        this.onGameUpdate.notifyObservers();
        this._demoTest.onGameUpdate();

        const gameObjects = GameObject.gameObjects.values();
        for (const go of gameObjects) {
            if (go instanceof ProgrammableGameObject) {
                //console.log(Game.deltaTime);
                if (go.finiteStateMachines[0].currentState) {
                    go.finiteStateMachines[0].currentState.onUpdateState.notifyObservers();
                }
            }
        }
    }

    public stop() {

        console.log('stop game');

        State.deleteRuntimeGlobalVars();

        const scene = Renderer.getInstance().scene;

        this._isRunning = false;

        Renderer.getInstance().scene.physicsEnabled = false;

        GameObject.gameObjects.forEach((go: GameObject, key) => {
            if (go instanceof ProgrammableGameObject) {
                // if(go.rigidbody) {
                //     const zeroVector = BABYLON.Vector3.Zero();
                //     go.rigidbody.setAngularVelocity(zeroVector);
                //     go.rigidbody.setLinearVelocity(zeroVector);
                //     go.rigidbody.disablePreStep = false; 
                //     go.rigidbody.transformNode.position.set(0,0,0);
                //     //car.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0,0,0);
                //     setTimeout(()=>{
                //         go.rigidbody.disablePreStep = true;
                //     },3000)
                // }
            }
        })

        this._demoTest.stop(scene);

        this.onGameUpdate.clear();
        this.onGameStoped.notifyObservers();

    }

    private constructor() {
        this.onGameStarted = new Observable();
        this.onGameUpdate = new Observable();
        this.onGameStoped = new Observable();

        const scene = Renderer.getInstance().scene;
        const engine = scene.getEngine();

        scene.onBeforeRenderObservable.add(()=>{            
            if (!this._isRunning)
                return;
            Game._deltaTime = engine.getDeltaTime() / 1000;
            this.update(Game._deltaTime);
        })
    }


}