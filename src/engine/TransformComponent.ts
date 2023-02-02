import { Scene, TransformNode } from "babylonjs";
import { GameObject } from "./GameObject";

export class TransformComponent extends TransformNode {

    private _gameObject : GameObject;

    get gameObject(): GameObject {
        return this._gameObject;
    }

    constructor(gameObject : GameObject,name:string,scene:Scene) {
        super(name,scene);
        this._gameObject = gameObject;
    }
}