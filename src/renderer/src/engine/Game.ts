import { Engine } from "@babylonjs/core";
import { GameObject } from "./GameObject";

export class Game {

    private _deltaTime : Number = 0;
    private static _instance: any;
    private _engine: Engine | undefined;
    private _isRunning:boolean = false;

    public static getInstance() {
        alert("Game : "+Game._instance);

        if(Game._instance===undefined) {
            this._instance = new Game()
            return Game._instance;
        }else{
            return Game._instance;
        }
    }

    public update(deltaTime : Number) {

        this._deltaTime = deltaTime;
        // console.log(this._isRunning);
        if(this._isRunning) {
            console.log(this._deltaTime);

            GameObject.gameObjects.forEach(go => {
                go.finiteStateMachine.onUpdate();
            });

        }

    }

    public start() {
        this._isRunning = true;
        alert("Game started");
        alert("RUN : "+this._isRunning);
        // appelé tous les start des machine states
    }

    public stop() {
        this._isRunning = false;
    }

    private constructor() {
        alert("make a game");
    }
}