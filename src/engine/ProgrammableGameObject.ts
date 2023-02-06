import { Scene } from "babylonjs";
import { FiniteStateMachine } from "./FSM/FiniteStateMachine";
import { GameObject } from "./GameObject";

export class ProgrammableGameObject extends GameObject {

    private _fsm : FiniteStateMachine;

    public get finiteStateMachine(): FiniteStateMachine {
        return this._fsm;
    }

    constructor(name : string,scene : Scene) {
        super("Objet Programmable",scene);
        this.type = "PROG_GO";
    }
}