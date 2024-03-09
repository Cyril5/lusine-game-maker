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
        super(gameObject);
        this._shapeContainerChildren = new Array<BABYLON.PhysicsShape>();
        this._rigidbody = new BABYLON.PhysicsBody(this.gameObject, BABYLON.PhysicsMotionType.DYNAMIC, false, this.gameObject.scene);
        this._shapeContainer = new BABYLON.PhysicsShapeContainer(this.gameObject.scene);
    
        this._rigidbody.material = {friction: 0.2, restitution: 0};
        this._rigidbody.shape = this._shapeContainer; // todo : vérifier si il faut mettre après this._shapeContainer.addChildFromParent si il y a des enfants
        this._rigidbody.setMassProperties ({
            mass: 1,
        });
        //this.addRigidbody({ mass: 1, restitution: 0.2, friction: 0.5 });
    }

    addRigidbody(options: { mass, restitution, friction: 0.5 }): void {


        return;
        //ammojs
        //if (!this._physicsImpostor) {
            console.log("add rb to "+this.name);
            this.physicsImpostor = new BABYLON.PhysicsImpostor(this,
                BABYLON.PhysicsImpostor.NoImpostor, options, this._scene); // Ajouter l'imposteur de boîte à la voiture
            this._rigidbody = this.physicsImpostor;
        //}        
    }
    
}