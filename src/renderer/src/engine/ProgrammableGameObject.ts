import { IPhysicsEnabledObject, PhysicsImpostor } from "babylonjs";
import { FiniteStateMachine } from "./FSM/FiniteStateMachine";
import { GameObject } from "./GameObject";

export class ProgrammableGameObject extends GameObject implements IPhysicsEnabledObject {

    // Pour le moment il y a qu'un fsm sur un objet programmable
    private _fsm : FiniteStateMachine;
    private _scene : BABYLON.Scene;
    private _physicsImpostor : PhysicsImpostor;

    public get fsm(): FiniteStateMachine {
        return this._fsm;
    }

    constructor(name:string,scene : BABYLON.Scene) {
        super(name,scene);
        this.type = "PROG_GO";
        this._fsm = new FiniteStateMachine(this);
        this._scene = scene;
    }

    addRigidbody(options : { mass : number,restitution : number,friction : number}) : void {

        if(!this._physicsImpostor) {
            this._physicsImpostor = new BABYLON.PhysicsImpostor(this, 
                BABYLON.PhysicsImpostor.NoImpostor, options
                , this._scene); // Ajouter l'imposteur de boîte à la voiture 
                return;
        }
        this._physicsImpostor.dispose();
    }

    addCollider() {

    }



}