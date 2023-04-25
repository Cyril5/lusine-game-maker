import { Axis, Engine } from "@babylonjs/core";
import { GameObject } from "./GameObject";
import { Renderer } from "./Renderer";
import { ProgrammableGameObject } from "./ProgrammableGameObject";
import InputManager, { KeyCode } from "./InputManager";

export class Game {

    private static os = require('os');
    private static path = require('path');
    private static _instance: any;

    private _deltaTime: Number = 0;
    private _engine: Engine | undefined;
    private _isRunning: boolean = false;

    playerCar: ProgrammableGameObject;
    speed = 5;



    // Créer un nom de chemin complet
    public static getFilePath(directory: string, file?: string): string {
        // const os = require('os');
        // const path = require('path');
        const documentsPath = Game.os.homedir() + '\\Documents\\Lusine Game Maker\\MonProjet';
        const dir = Game.path.resolve(documentsPath, directory);
        return Game.path.resolve(dir, file);
    }

    public static getInstance() {

        if (!Game._instance) {
            this._instance = new Game();
            return Game._instance;
        } else {
            return Game._instance;
        }
    }

    private update(deltaTime: Number) {

        if (!this._isRunning)
            return;

        this._deltaTime = deltaTime;
        // console.log(this._isRunning);
        //console.log(this._deltaTime);

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

    public start() {
        this._isRunning = true;
        console.log("Game started");

        const scene = Renderer.getInstance().scene;

        InputManager.initKeyboardListeners();



        this.playerCar = GameObject.gameObjects.get(8);

        // Interpretation des codes de chaques states de chaques fsm
        const gameObjects = GameObject.gameObjects.values();
        for (const gameObject of gameObjects) {
            if(gameObject instanceof ProgrammableGameObject) {
                const states = gameObject.fsm.states.length;
                for (let index = 0; index < states; index++) {
                    const state = gameObject.fsm.states[index];
                    state.runCode();
                }
            }
        }



        //this.playerCar.fsm.states[0].runCode();


        scene.physicsEnabled = true;
        scene.setActiveCameraByName("FollowCam");


    }

    public stop() {
        const scene = Renderer.getInstance().scene;

        InputManager.removeKeyboardListeners();
        this._isRunning = false;

        Renderer.getInstance().scene.physicsEnabled = false;
        scene.setActiveCameraByName("Camera");


        // removeEventListener("keydown");
        // removeEventListener("keyup");
    }

    private constructor() {
        const engine = Renderer.getInstance().scene.getEngine();
        engine.runRenderLoop(() => {
            // appeler tous les start des machine states
            this.update(engine.getDeltaTime());
        });
    }
}