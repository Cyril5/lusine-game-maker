import State from "./State";
import { ProgrammableGameObject } from "../ProgrammableGameObject";
import { IStateFile } from "./IStateFile";
import { Observable } from "babylonjs";
import BoxCollider from "../physics/lgm3D.BoxCollider";
import { Game } from "../Game";
import { EditorObservable } from "@renderer/editor/EditorObservable";
import Component from "../lgm3D.Component";



// Machine d'états fini attachable sur des ProgrammableGameObject seulement
export class FiniteStateMachine extends Component {

    public update(dt: number) {
        throw new Error("Method not implemented.");
    }

    states: Array<State> = [];

    name: string = 'Automate Fini Principal';

    // private _gameObject: ProgrammableGameObject;
    // public get gameObject(): ProgrammableGameObject {
    //     return this._gameObject;
    // }

    private _currState: State | null = null;
    public get currentState(): State | null {
        return this._currState;
    }

    //#region "Evenements"
    onStart: FSMObservable<void>;
    onUpdate: FSMObservable<void>;
    onCollisionEnter: FSMObservable<BoxCollider | null>;
    onCollisionStay: FSMObservable<BoxCollider | null>;
    onCollisionExit: FSMObservable<BoxCollider | null>;

    /**
    * Observable lorsqu'un état est ajouté
    */
    onStateAdded: EditorObservable | null;

    //#endregion "Evenements"

    constructor(gameObject) {

        super(gameObject);

        this.onStateAdded = new EditorObservable();
        this.onStart = new FSMObservable();
        this.onUpdate = new FSMObservable();
        this.onCollisionEnter = new FSMObservable();
        this.onCollisionStay = new FSMObservable();
        this.onCollisionExit = new FSMObservable();

        this.addState("Nouvel Etat");

        // TEST
        // this.onCollisionEnter.add((collider)=>{
        //     console.log("ping");
        //     console.log(this._gameObject.name+ " touche : "+collider.shape.name);
        // })


        // Game.getInstance().onGameStoped.add(()=>{
        //     this.clearObservables();
        // });

    }

    addState(name: string = 'Nouvel Etat', statefile?: IStateFile | undefined): State {

        const newState = new State(this, statefile);
        newState.name = name;

        this.states.push(newState);

        if (this.states.length == 1) {
            this.setState(newState);
        }

        this.onStateAdded.notifyObservers();
        return newState;
    }

    setState(state: State | null) : void {

        
        if(!state) {
            this._currState = null;
            return;
        }
        
        if (this._currState)
            this._currState.onExitState.notifyObservers();
        this._currState = state;
        console.log(this._currState.onEnterState);
        this._currState.onEnterState.notifyObservers();
    }

    /**
 * Enlève un état de l'Automate Fini.
 * Si input est un nombre alors supprimer l'élément à partir de l'index input
 * @param {State | number} input
 */
    removeState(input: State | number): void {
        if (typeof input === 'number') {
            // If input is a number, assume it's an index and remove by index
            const index = input as number;
            this.states.splice(index, 1);
        } else {
            // If input is a State object, find its index and remove by object
            const state = input as State;
            const index = this.states.indexOf(state);
            if (index !== -1) {
                this.states.splice(index, 1);
            }
        }
    }

    // Nettoyer la liste des méthodes dans les observables pour éviter de les rappeler à chaque démarrage du jeu
    // L'objet FSMObservable le fait déjà
    private clearObservables() : void {
        this.onStart.clear();
        this.onUpdate.clear();
        this.onCollisionEnter.clear();
        this.onCollisionStay.clear();
        this.onCollisionExit.clear();
    }

    deserialize() : any {
        const states : any = {};
        this.states.forEach((state)=>{
            const stateJson = {};
            stateJson["stateFilename"] = state.stateFile.filename;
            states.push(stateJson);
        });
        return states;
    }

    serialize() : any {
        // "finiteStateMachines":[
            //{
                //"states":[
                    //{
                    //    "statefile": {
                  //          "name": "StateA"
                //        }
              //      }
            //    ]
          //  }
        //]

        return {};
    }

}

/**
* Observable pour les FSM
* @remarks
* La liste des méthodes observées est supprimée lorsque le jeu s'arrête
*/
export class FSMObservable<T> extends Observable<T> {

    constructor() {
        super();
        // nettoyer la liste des méthodes lorsque jeu s'arrête
        Game.getInstance().onGameStoped.add(() => {
            this.clear();
        });
    }

}