import { PhysicsBody } from "@babylonjs/core";
import { GameObject } from "../GameObject";
import Component from "../lgm3D.Component";

export default class Rigidbody extends Component {

    private _rigidbody : PhysicsBody;
    _shapeContainer : BABYLON.PhysicsShapeContainer | null = null;
    _shapeContainerChildren : Array<BABYLON.PhysicsShape>; //TODO : Enveler de la liste les physicsShape disposed
    

    get body(): PhysicsBody {
        return this._rigidbody;
    }

    public update(dt: number) {
        throw new Error("Method not implemented.");
    }

    constructor(gameObject:GameObject) {
        super();
        this.metaData = {type:Rigidbody.name};
        this._gameObject = gameObject;
        this._shapeContainerChildren = new Array<BABYLON.PhysicsShape>();
        this._rigidbody = new BABYLON.PhysicsBody(this._gameObject, BABYLON.PhysicsMotionType.DYNAMIC, false, this._gameObject.scene);
        this._shapeContainer = new BABYLON.PhysicsShapeContainer(this._gameObject.scene);
    
        this._rigidbody.material = {restitution: 0.2};
        this._rigidbody.shape = this._shapeContainer; // todo : vérifier si il faut mettre après this._shapeContainer.addChildFromParent si il y a des enfants
        this._rigidbody.setMassProperties ({
            mass: 1,
        });
    }
    
}