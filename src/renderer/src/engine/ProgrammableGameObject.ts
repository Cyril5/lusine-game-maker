import { FiniteStateMachine } from "./FSM/FiniteStateMachine";
import { GameObject } from "./GameObject";
import Rigidbody from "./physics/lgm3D.Rigidbody";

export class ProgrammableGameObject extends GameObject {

    static readonly TYPE_NAME = "PROG_GO";

    // Pour le moment il y a qu'un fsm sur un objet programmable
    private _fsms : Array<FiniteStateMachine>;
    private _scene : BABYLON.Scene;


    public get finiteStateMachines(): Array<FiniteStateMachine> {
        return this._fsms;
    }

    constructor(name:string,scene : BABYLON.Scene) {
        super(name,scene);
        this._fsms = new Array<FiniteStateMachine>();
        this.type = ProgrammableGameObject.TYPE_NAME;
        this._fsms.push(new FiniteStateMachine(this));
        this._scene = scene;
        this.addComponent(new Rigidbody(this),"Rigidbody");
    }

    deserialize(): void {
        
    }


}