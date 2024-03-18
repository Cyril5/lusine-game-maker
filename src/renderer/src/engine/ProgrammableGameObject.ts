import { Quaternion, Vector3 } from "@babylonjs/core";
import { FiniteStateMachine } from "./FSM/FiniteStateMachine";
import { Game } from "./Game";
import { GameObject } from "./GameObject";
import Rigidbody from "./physics/lgm3D.Rigidbody";

export class ProgrammableGameObject extends GameObject {

    static readonly TYPE_NAME = "PROG_GO";

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
        //this._rigidbody = new Rigidbody(this as GameObject);
        //this.addComponent(this._rigidbody, "Rigidbody");
    }

    get position() {
        return super.position;
    }

    set position(newPosition: BABYLON.Vector3) {
        if (Game.getInstance().isRunning) {
            if(!this._rigidbody) {
                return;
            }

            if (this._rigidbody.body) {
                //this._rigidbody.body.disablePreStep = false;
                super.position = newPosition;
                // this._scene.onAfterRenderObservable.addOnce(() => {
                //     // Turn disablePreStep on again for maximum performance
                //     this._rigidbody.body!.disablePreStep = true;
                // })
            }
        }
        super.position = newPosition;
    }

    move(axis: BABYLON.Vector3, distance: number, space: BABYLON.Space): void {
        const target = super.translate(axis, distance, space);
        this.getComponent<Rigidbody>("Rigidbody2")!.body!.setTargetTransform(this.absolutePosition, this.rotationQuaternion);
    }

    rotate(axis: BABYLON.Vector3, amount: number, space?: BABYLON.Space | undefined): void {
        // amount de base est en radians
        if (Game.getInstance().isRunning) {
            if (this._rigidbody.body) {
                console.log(BABYLON.Tools.ToDegrees(amount));
                this._rigidbody.body.setAngularVelocity(new Vector3(0, 1, 0));
            } else {
                super.rotate(axis, amount, space);
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