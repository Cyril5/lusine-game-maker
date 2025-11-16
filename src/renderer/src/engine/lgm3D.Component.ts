import { GameObject } from "./GameObject";
import { GameObjectComponentMetaData } from "./structs/ComponentsMetaData";


export default abstract class Component {
    name?: string;
    _gameObject: GameObject; // set seulement pour la classe GameObject

    public metaData: GameObjectComponentMetaData = {
        type: "",
        enabled: true,
        data: {} // données du composant
    };

    get gameObject(): GameObject {
        return this._gameObject;
    }

    constructor(gameObject: GameObject) {
        this._gameObject = gameObject;
    }

    public destroy(): void {
        this._gameObject.removeComponent(this.componentName);
    }

    public getType(): string {
        return (this as any).constructor?.name ?? "Component";
    }

    public abstract copyFrom<T extends Component>(componentSource: T): Component;

    public abstract update(dt: number): void;
    
    public toJson(): any {
        return {
            componentType: this.getType(),
            enabled: this.metaData.enabled ?? true,
            data: {}
        };
    }

}


