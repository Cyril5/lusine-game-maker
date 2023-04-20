import { Axis, Engine } from "@babylonjs/core";
import { GameObject } from "./GameObject";
import { Renderer } from "./Renderer";

export class Game {

    private _deltaTime: Number = 0;
    private static _instance: any;
    private _engine: Engine | undefined;
    private _isRunning: boolean = false;

    playerCar: GameObject;
    speed = 5;
    keys = [];

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

        // GameObject.gameObjects.forEach(go => {
        //     go.finiteStateMachine.onUpdate();
        // });

        if (this.keys[90]) { // Z
            this.playerCar.translate(Axis.Z, this.speed, BABYLON.Space.LOCAL);
        }
        else if (this.keys[83]) { // S
            this.playerCar.translate(Axis.Z, -this.speed, BABYLON.Space.LOCAL);
        }

        if (this.keys[81]) { // Q
            this.playerCar.rotate(Axis.Y, -0.03, BABYLON.Space.LOCAL);
        }
        else if (this.keys[68]) { // D
            this.playerCar.rotate(Axis.Y, 0.03, BABYLON.Space.LOCAL);
        }

    }

    public start() {
        this._isRunning = true;
        console.log("Game started");

        const scene = Renderer.getInstance().scene;

        // Ajoute des contrôles de clavier pour la voiture
        addEventListener("keydown", (event) => {
            this.keys[event.keyCode] = true;
        });

        addEventListener("keyup", (event) => {
            this.keys[event.keyCode] = false;
        });

        this.playerCar = GameObject.gameObjects.get(8);

        scene.physicsEnabled = true;
        scene.setActiveCameraByName("FollowCam");


    }

    public stop() {
        const scene = Renderer.getInstance().scene;

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