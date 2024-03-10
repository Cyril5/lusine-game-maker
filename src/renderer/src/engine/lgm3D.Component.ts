import { GameObject } from "./GameObject";

export default abstract class Component {

    protected _gameObject : GameObject;

    get gameObject(): GameObject {
        return this._gameObject;
    }

    public abstract update(dt : number);

    constructor(gameObject : GameObject) {
        this._gameObject = gameObject;
    }

}