import { Mesh, Scene, TransformNode } from "babylonjs";
import { ProgrammableGameObject } from "./ProgrammableGameObject";

export default class ColliderComponent {
    
    private _boxMesh : Mesh;
    private _gameObject : ProgrammableGameObject;

    constructor(gameObject : ProgrammableGameObject,scene : Scene) {
        this._gameObject = gameObject;
        this._boxMesh = BABYLON.MeshBuilder.CreateBox("BoxCollider", { height: 60, width: 75, depth: 140 }, scene);
        this._boxMesh.isVisible = true; // Masquer la boîte pour qu'elle ne soit pas visible dans la scène
        this._boxMesh.visibility = 0.25;
        this._boxMesh.physicsImpostor = new BABYLON.PhysicsImpostor(this._boxMesh, BABYLON.PhysicsImpostor.BoxImpostor, { 
            mass: 0,
            restitution: 0,
            friction: 0,
        });
        this._boxMesh.setParent(this._gameObject);
        this._boxMesh.isPickable = false;
    }

    // attachToGameObject(node : ProgrammableGameObject) {
    //     this._gameObject = node;
    // }

    get gameObject(): ProgrammableGameObject {
        return this._gameObject;
    }

}