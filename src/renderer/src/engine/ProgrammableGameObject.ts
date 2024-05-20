import { FiniteStateMachine } from "./FSM/FiniteStateMachine";
import { Game } from "./Game";
import { GameObject } from "./GameObject";
import RotateTowardsBehaviour from "./behaviours/lgm3D.RotateTowardsBehaviour";
import Rigidbody from "./physics/lgm3D.Rigidbody";

export class ProgrammableGameObject extends GameObject {

    static readonly TYPE_NAME = "PROG_GO";

    rotateTowardsBehaviour;

    // Pour le moment il y a qu'un fsm sur un objet programmable
    private _fsms: Array<FiniteStateMachine>;
    private _scene: BABYLON.Scene;

    _rigidbody: Rigidbody;

    public get finiteStateMachines(): Array<FiniteStateMachine> {
        return this._fsms;
    }

    constructor(name: string, scene: BABYLON.Scene) {
        super(name, scene);
        this._fsms = new Array<FiniteStateMachine>();
        this.type = ProgrammableGameObject.TYPE_NAME;
        this._fsms.push(new FiniteStateMachine(this));
        this._scene = scene;
        this._rigidbody = new Rigidbody(this as GameObject);
        this.addComponent(this._rigidbody, "Rigidbody");

        //Ajout du comportement RotateTowardsBehaviour
        this.rotateTowardsBehaviour = this.addComponent(new RotateTowardsBehaviour(),"LGM3D_RotateTowardsBehaviour");
    }

    get position() : BABYLON.Vector3 {
        return super.position;
    }
    set position(newPosition: BABYLON.Vector3) {
        this.transform.position = newPosition;

        if (Game.getInstance().isRunning) {
            if(!this._rigidbody) {
                return;
            }
            this._rigidbody?.body?.setTargetTransform(this.transform.absolutePosition,this.transform.rotationQuaternion);
        }
    }

    setEulerRotation(x : number,y : number,z : number) {
        this.transform.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(x, y, z);
        this._rigidbody?.body?.setTargetTransform(this.transform.absolutePosition,this.transform.rotationQuaternion);
    }


    move(axis: BABYLON.Vector3, distance: number, space: BABYLON.Space): void {
        const target = this.transform.translate(axis, distance, space);

        this._rigidbody?.body?.setTargetTransform(this.transform.absolutePosition, this.transform.rotationQuaternion);
    }

    setRotationQuaternion(quaternion: BABYLON.Quaternion): void {
        this.transform.rotationQuaternion = quaternion;
        this._rigidbody?.body?.setTargetTransform(this.transform.absolutePosition, this.transform.rotationQuaternion);
    }

    rotate(axis: BABYLON.Vector3, amount: number, space?: BABYLON.Space | undefined): void {
        // amount de base est en radians
        this.transform.rotate(axis, amount, space);
        if (Game.getInstance().isRunning) {
            if (this._rigidbody.body) {
                //console.log(BABYLON.Tools.ToDegrees(amount));
                this._rigidbody?.body?.setTargetTransform(this.transform.absolutePosition,this.transform.rotationQuaternion);
            } 
        }
    }

    deserialize(): void {

    }

    public save(): any {
        this.metadata["finiteStateMachines"] = [];
        this._fsms.forEach((fsm) => {

            const fsmJSON = {
                name: fsm.name,
                states: []
            };
            fsm.states.forEach((state) => {
                console.log(state.stateFile);
                fsmJSON.states.push({
                    statefile: {
                        name: (state.stateFile.name ? state.stateFile.name : null)
                    }
                });
            });
            this.metadata.finiteStateMachines.push(fsmJSON);
        })
    }


}