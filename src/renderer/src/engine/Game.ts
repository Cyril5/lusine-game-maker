import { Engine } from "@babylonjs/core";
import { GameObject } from "./GameObject";
import { Renderer } from "./Renderer";
import { ProgrammableGameObject } from "./ProgrammableGameObject";
import InputManager, { KeyCode } from "./InputManager";
import State from "./FSM/StateOld";
import { Observable, Vector3 } from "babylonjs";
import DemoTest from "./DemoTest/DemoTest";
import { FiniteStateMachine } from "./FSM/lgm3D.FiniteStateMachine";

export class Game {

    onGameStarted: Observable<void>;
    onGameUpdate: Observable<void>;
    onGameStopped: Observable<void>;
    onPhysicsDisabled: Observable<void> = new BABYLON.Observable();

    private static _instance: any;

    private static _deltaTime: number = 0;
    private _engine: Engine | undefined;
    private _isRunning: boolean = false;
    private _fsms: FiniteStateMachine[];

    get isRunning(): boolean {
        return this._isRunning;
    }

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
    static get deltaTime(): number {
        return Game._deltaTime;
    }

    static get input(): InputManager {
        return InputManager.getInstance();
    }

    public async start() {

        const scene = Renderer.getInstance().scene;

        // Interpretation des codes de chaques states de chaques fsm
        const gameObjects = GameObject.gameObjects.values();

        let runCodeSuccess = 0;

        this._demoTest.init(scene);

        for (const go of gameObjects) {
            // Collecter toutes les FSM une seule fois
            const fsms = go.getComponents(FiniteStateMachine);
            this._fsms.push(...fsms);
        }

        // Initialize
        await Promise.all(this._fsms.map(f => f.initialize()));
        // if (gameObject instanceof ProgrammableGameObject) {

        //     const states = gameObject.finiteStateMachines[0].states.length;
        //     if (states > 0) {
        //         for (let index = 0; index < states; index++) {
        //             const state = gameObject.finiteStateMachines[0].states[index];
        //             await state.runCode();
        //         }
        //         if (gameObject.finiteStateMachines[0].currentState) {
        //             console.log(gameObject.finiteStateMachines[0].currentState.onEnterState);
        //             gameObject.finiteStateMachines[0].currentState.onEnterState.notifyObservers();
        //         }
        //     }
        // }


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

        for (const fsm of this._fsms) {
            //fsm.onUpdateState.notifyObservers();
            fsm.update(deltaTime);
        }
    }

    public stop() {

        console.log('stop game');

        State.deleteRuntimeGlobalVars();

        const scene = Renderer.getInstance().scene;

        this._isRunning = false;

        this._fsms = [];
        this.onGameUpdate.clear();
        this.onGameStopped.notifyObservers();
        this._demoTest.stop(scene);
        Renderer.getInstance().scene.physicsEnabled = false;
        this.onPhysicsDisabled.notifyObservers();
    }

    private constructor() {
        this.onGameStarted = new Observable();
        this.onGameUpdate = new Observable();
        this.onGameStopped = new Observable();
        this._fsms = new Array<FiniteStateMachine>();

        const scene = Renderer.getInstance().scene;
        const engine = scene.getEngine();

        scene.onBeforeRenderObservable.add(() => {
            if (!this._isRunning)
                return;
            Game._deltaTime = engine.getDeltaTime() / 1000;
            this.update(Game._deltaTime);
        })
    }


}