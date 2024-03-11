import { GameObject } from "./GameObject";
import { GameObjectComponentMetaData } from "./structs/ComponentsMetaData";


export default abstract class Component {

    _gameObject : GameObject; // set seulement pour la classe GameObject

    public metaData : GameObjectComponentMetaData = {
        type: ""
    };

    get gameObject(): GameObject {
        return this._gameObject;
    }

    public abstract update(dt : number);
    public toJson() : any {
        return this.metaData;
    }

}