import { FiniteStateMachine } from "./FSM/lgm3D.FiniteStateMachine";
import { Game } from "./Game";
import { GameObject } from "./GameObject";
import RotateTowardsBehaviour from "./behaviours/lgm3D.RotateTowardsBehaviour";
import Utils from "./lgm3D.Utils";
import { Rigidbody } from "./physics/lgm3D.Rigidbody";

export class ProgrammableGameObject extends GameObject {

    // Another constructor
    static createEmptyFromNodeData(node: BABYLON.Node) {
        const pgo = new ProgrammableGameObject(node.name, node.getScene());
        pgo.transform.dispose();
        GameObject.gameObjects.delete(pgo.Id);
        pgo._transform = node;
        pgo.setUId(node.metadata.gameObjectId, false);
        pgo.name = node.name;
        return pgo
    }

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
        this._rigidbody = new Rigidbody(this as GameObject, this._scene);
        this.addComponent(Utils.RB_COMPONENT_TYPE, this._rigidbody);

        //Ajout du comportement RotateTowardsBehaviour
        this.rotateTowardsBehaviour = this.addComponent("LGM3D_RotateTowardsBehaviour", new RotateTowardsBehaviour());
    }

    move(axis: BABYLON.Vector3, speed: number, space: BABYLON.Space): void {
        if (!this._rigidbody) {
            console.error('Un rigidbody est requis pour cet objet programmable');
            return; // this.body = PhysicsBody de l'objet
        }

        // Récupérer la vélocité actuelle
        const currentVel = this._rigidbody.getLinearVelocity();

        // Calculer la direction dans le bon espace (local ou world)
        const forward = BABYLON.Vector3.TransformNormal(axis.normalize(),
            space === BABYLON.Space.LOCAL ? this.transform.getWorldMatrix() : BABYLON.Matrix.Identity()
        );

        forward.normalize().scaleInPlace(speed);

        // On garde la composante Y (gravité, sauts, etc.)
        const newVel = new BABYLON.Vector3(forward.x, currentVel.y, forward.z);

        // Appliquer la nouvelle vélocité
        this._rigidbody.setLinearVelocity(newVel);
    }

    setRotationQuaternion(quaternion: BABYLON.Quaternion): void {
        this.transform.rotationQuaternion = quaternion;
    }

    rotate(axis: BABYLON.Vector3, amount: number, space?: BABYLON.Space | undefined): void {
        if (Game.getInstance().isRunning) {
            //if (this._rigidbody.body) {
            //console.log(BABYLON.Tools.ToDegrees(amount));
            //this._rigidbody?.body?.setTargetTransform(this.transform.absolutePosition,this.transform.rotationQuaternion);
            const vel = new BABYLON.Vector3();
            this._rigidbody?.body?.getAngularVelocityToRef(vel);
            this._rigidbody?.body?.setAngularVelocity(new BABYLON.Vector3(vel.x, amount, vel.z));
            // }else{                
            //     // amount de base est en radians
            //     this.transform.rotate(axis, amount, space);
            // } 
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