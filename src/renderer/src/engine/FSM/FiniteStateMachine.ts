import State from "./State";
import { ProgrammableGameObject } from "../ProgrammableGameObject";
import { IStateFile } from "./IStateFile";
import { Observable } from "babylonjs";
import ColliderComponent from "../physics/ColliderComponent";

// Machine d'états fini attachable sur des ProgrammableGameObject seulement
export class FiniteStateMachine {

    states:Array<State> = [];

    //#region "Propriétées"
    private _gameObject: ProgrammableGameObject;
    public get gameObject(): ProgrammableGameObject {
        return this._gameObject;
    }
    
    private _currState: State | null = null;
    public get currentState(): State | null {
        return this._currState;
    }
    //#endregion "Propriétées"
    
    //#region "Evenements"
    onUpdate : Observable<void>;
    onTriggerEnter : Observable<ColliderComponent | null>;
    onTriggerStay : Observable<ColliderComponent | null>;
    onTriggerExit : Observable<ColliderComponent | null>;
    //#endregion "Evenements"

    constructor(gameObject : ProgrammableGameObject) {
        this._gameObject = gameObject;
        this.addState("Nouvel Etat");

        this.onUpdate = new Observable();
        this.onTriggerEnter = new Observable();

        // TEST
        this.onTriggerEnter.add((collider)=>{
            console.log("ping");
            console.log(this._gameObject.name+ " touche : "+collider.shape.name);
        })

        this.onTriggerStay = new Observable();
        this.onTriggerExit = new Observable();
    }

    addState(name:string='Nouvel Etat',statefile?: IStateFile | undefined):State {

        const newState = new State(this,statefile);
        newState.name = name;

        this.states.push(newState);

        if(this.states.length == 1) {
            this.setState(newState);
        }
            
        return newState;
    }

    setState(state:State) {
        if(this._currState)
            this._currState.onExitState();
        this._currState = state;
        this._currState.onEnterState();
    }

}