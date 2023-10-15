import { FiniteStateMachine } from "./FSM/FiniteStateMachine";
import { GameObject } from "./GameObject";

export class ProgrammableGameObject extends GameObject {

    static readonly TYPE_NAME = "PROG_GO";

    // Pour le moment il y a qu'un fsm sur un objet programmable
    private _fsm : FiniteStateMachine;
    private _scene : BABYLON.Scene;


    public get fsm(): FiniteStateMachine {
        return this._fsm;
    }

    constructor(name:string,scene : BABYLON.Scene) {
        super(name,scene);
        this.type = ProgrammableGameObject.TYPE_NAME;
        this._fsm = new FiniteStateMachine(this);
        this._scene = scene;
    }

    deserialize(): void {
        
    }


}