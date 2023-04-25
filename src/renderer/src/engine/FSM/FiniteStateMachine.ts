import { State } from "./State";
import { ProgrammableGameObject } from "../ProgrammableGameObject";
import { IStateFile } from "./IStateFile";

// Machine d'états fini attachable sur des ProgrammableGameObject seulement
export class FiniteStateMachine {

    private _gameObject: ProgrammableGameObject;
    public get gameObject(): ProgrammableGameObject {
        return this._gameObject;
    }
    
    private _currState: State;
    public get currentState(): State {
        return this._currState;
    }
    
    states:Array<State> = [];
    

    constructor(gameObject : ProgrammableGameObject) {
        this._gameObject = gameObject;
        this.addState("Nouvel Etat");
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

    // event
    public onUpdate() {
        // this._gameObject.transform.translate(new Vector3(0,0,0.1),Space.LOCAL);
    }
}