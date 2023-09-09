import { Engine } from "@babylonjs/core";
import { GameObject } from "./GameObject";
import { Renderer } from "./Renderer";
import { ProgrammableGameObject } from "./ProgrammableGameObject";
import InputManager, { KeyCode } from "./InputManager";
import State from "./FSM/State";
import { Observable } from "babylonjs";

export class Game {

    onGameStarted : Observable<void>;
    onGameUpdate : Observable<void>;
    onGameStoped : Observable<void>;

    private static _instance: any;

    private _deltaTime: Number = 0;
    private _engine: Engine | undefined;
    private _isRunning: boolean = false;




    public static getInstance() {

        if (!Game._instance) {
            this._instance = new Game();
            return Game._instance;
        } else {
            return Game._instance;
        }
    }


    public async start() {

        this._isRunning = true;
        console.log("Game started");

        const scene = Renderer.getInstance().scene;

        InputManager.initKeyboardListeners();

        // Interpretation des codes de chaques states de chaques fsm
        const gameObjects = GameObject.gameObjects.values();

        let runCodeSuccess = 0;

        for (const gameObject of gameObjects) {
            if(gameObject instanceof ProgrammableGameObject) {
                const states = gameObject.fsm.states.length;
                for (let index = 0; index < states; index++) {
                    const state = gameObject.fsm.states[index];
                    await state.runCode();
                }
            }
            console.log(gameObject.fsm.currentState.onEnterState);
            gameObject.fsm.currentState.onEnterState.notifyObservers();
        }

        GameObject.saveAllTransforms();

        this.onGameStarted.notifyObservers();

        scene.physicsEnabled = true;
        //const followCam = scene.setActiveCameraByName("FollowCam");
        // const camera = scene.cameras[0];
        // followCam.position.copyFrom(camera.position);
        // followCam.rotation.copyFrom(camera.rotation);

    }



    private update(deltaTime: Number) {

        if (!this._isRunning)
            return;

        this._deltaTime = deltaTime;
        // console.log(this._isRunning);
        //console.log(this._deltaTime);
        this.onGameUpdate.notifyObservers();

        const gameObjects = GameObject.gameObjects.values();
        for (const go of gameObjects) {
            if(go instanceof ProgrammableGameObject) {
                go.fsm.currentState.onUpdateState.notifyObservers();
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
        
        State.deleteRuntimeGlobalVars();
        
        const scene = Renderer.getInstance().scene;
        
        InputManager.removeKeyboardListeners();
        this._isRunning = false;
        
        Renderer.getInstance().scene.physicsEnabled = false;
        scene.setActiveCameraByName("Camera").setEnabled(true);
        GameObject.resetAllTransforms();
        
        this.onGameStoped.notifyObservers();
        
        // removeEventListener("keydown");
        // removeEventListener("keyup");
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