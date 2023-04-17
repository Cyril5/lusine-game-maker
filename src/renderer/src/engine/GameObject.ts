import { Mesh, MeshBuilder, Scene, Vector3 } from "@babylonjs/core";
import { TransformComponent } from "./TransformComponent";

export class GameObject {

    // enum Type {
    //     None,
    //     Programmable,
    //   }

    protected type: string = "GameObject";

    public static test = new Array(GameObject);

    public static kebab = 0;

    private static _gameObjects = new Map<Number | string, GameObject>() //unique id or uuid // map uuid,gameObject
    public static get gameObjects() {
        return GameObject._gameObjects;
    }

    protected _transform: TransformComponent;
    public get transform(): TransformComponent {
        return this._transform;
    }

    // unique ID
    private _uId = 0;
    get id(): Number {
        return this._uId;
    }


    private _parent: GameObject = null;
    public set parent(value: GameObject) {
        this._parent = value;
        if (value === null) {
            this._transform.parent = null; // l'objet sera attaché à la scene
        } else {
            this._transform.parent = value.transform;
        }

    }
    public get parent(): GameObject {
        return this._parent;
    }

    public get position(): Vector3 {
        return this._transform.position;
    }
    get name(): string {
        return this._transform.name;
    }
    set name(value: string) {
        this._transform.name = value;
    }


    constructor(name: string, scene: Scene) {

        // L'accès direct au renderer provoque une erreur
        this._transform = new TransformComponent(this, name, scene);

        this._uId = this.transform.uniqueId;

        console.log("Créer le game obj : " + this._transform.name);

        if (!GameObject._gameObjects.has(this._uId)) {
            GameObject._gameObjects.set(this._uId, this);
        } else {
            console.error("L'objet ayant l'id :" + this._uId + "existe déjà");
            return;
        }



        GameObject.kebab++;

    }
}