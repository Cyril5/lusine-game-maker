import { Engine } from "@babylonjs/core";
import { GameObject } from "./GameObject";
import { Renderer } from "./Renderer";
import { ProgrammableGameObject } from "./ProgrammableGameObject";
import InputManager, { KeyCode } from "./InputManager";
import State from "./FSM/State";
import { Observable, Vector3 } from "babylonjs";
import DemoTest from "./DemoTest";

export class Game {

    onGameStarted : Observable<void>;
    onGameUpdate : Observable<void>;
    onGameStoped : Observable<void>;

    private static _instance: any;

    private static _deltaTime: Number = 0;
    private _engine: Engine | undefined;
    private _isRunning: boolean = false;

    private _t;

    private _demoTest = new DemoTest();


    public static getInstance() {

        if (!Game._instance) {
            this._instance = new Game();
            return Game._instance;
        } else {
            return Game._instance;
        }
    }

    // Deltatime in seconds
    static get deltaTime(): Number {
        return Game._deltaTime;
    }



    public async start() {
        
        
        this._isRunning = true;
        console.log("Game started");
        
        
        const scene = Renderer.getInstance().scene;
        
        this._demoTest.run(scene);
        
        InputManager.initKeyboardListeners();
        
        // Interpretation des codes de chaques states de chaques fsm
        const gameObjects = GameObject.gameObjects.values();
        
        let runCodeSuccess = 0;
        
        for (const gameObject of gameObjects) {
            if(gameObject instanceof ProgrammableGameObject) {

                const states = gameObject.finiteStateMachines[0].states.length;
                for (let index = 0; index < states; index++) {
                    const state = gameObject.finiteStateMachines[0].states[index];
                    await state.runCode();
                }
                console.log(gameObject.finiteStateMachines[0].currentState.onEnterState);
                gameObject.finiteStateMachines[0].currentState.onEnterState.notifyObservers();
            }
        }
        
        //GameObject.saveAllTransforms();

        this.onGameStarted.notifyObservers();
        
        clearTimeout(this._t);
        
        scene.physicsEnabled = true;
        
        //const followCam = scene.setActiveCameraByName("FollowCam");
        // const camera = scene.cameras[0];
        // followCam.position.copyFrom(camera.position);
        // followCam.rotation.copyFrom(camera.rotation);

    }



    private update(deltaTime: Number) {

        if (!this._isRunning)
            return;

        Game._deltaTime = deltaTime/1000;
        // console.log(this._isRunning);
        this.onGameUpdate.notifyObservers();
        
        const gameObjects = GameObject.gameObjects.values();
        for (const go of gameObjects) {
            if(go instanceof ProgrammableGameObject) {
                //console.log(Game.deltaTime);
                go.finiteStateMachines[0].currentState.onUpdateState.notifyObservers();
            }
        }

        // if (InputManager.getKeyDown(KeyCode.Z)) { // Z
        //     this.playerCar.translate(Axis.Z, this.speed, BABYLON.Space.LOCAL);
        // }
        // else if (this.keys[83]) { // S
        //     this.playerCar.translate(Axis.Z, -this.speed, BABYLON.Space.LOCAL);
        // }

        // if (this.keys[81]) { // Q
        //     this.playerCar.rotate(Axis.Y, -0.03, BABYLON.Space.LOCAL);
        // }
        // else if (this.keys[68]) { // D
        //     this.playerCar.rotate(Axis.Y, 0.03, BABYLON.Space.LOCAL);
        // }

    }


    public stop() {
        
        console.log('stop game');

        State.deleteRuntimeGlobalVars();
        
        const scene = Renderer.getInstance().scene;
        
        InputManager.removeKeyboardListeners();
        this._isRunning = false;

        Renderer.getInstance().scene.physicsEnabled = false;
        GameObject.gameObjects.forEach((value,key)=>{
            //value.setAbsolutePosition(new BABYLON.Vector3(0,45,0));
            //value.resetTransform();
            if(value instanceof ProgrammableGameObject) {
                console.warn(value.name);
                value.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0,0,0);
                const zeroVector = new BABYLON.Vector3.Zero();
                value.physicsImpostor?.setAngularVelocity(zeroVector);
                value.physicsImpostor?.setLinearVelocity(zeroVector);
                value.physicsImpostor?.sleep();
            }
        })


        this._demoTest.stop();
        
        this.onGameStoped.notifyObservers();

    }

    private constructor() {
        this.onGameStarted = new Observable();
        this.onGameUpdate = new Observable();
        this.onGameStoped = new Observable();

        const engine = Renderer.getInstance().scene.getEngine();
        engine.runRenderLoop(() => {
            // appeler tous les start des machine states
            this.update(engine.getDeltaTime());
        });
    }
}