import { GameObject } from "./GameObject";
import { GameObjectComponentMetaData } from "./structs/ComponentsMetaData";


export default abstract class Component {
    name : string;
    _gameObject : GameObject; // set seulement pour la classe GameObject

    public metaData : GameObjectComponentMetaData = {
        type: ""
    };

    get gameObject(): GameObject {
        return this._gameObject;
    }


    public destroy() : void {
        this._gameObject.removeComponent(this.componentName);
    }
    
    public abstract copyFrom<T extends Component>(componentSource: T) : Component;

    public abstract update(dt : number) : void;
    public toJson() : any {
        return this.metaData;
    }

}


