import { Mesh, MeshBuilder, Scene, Vector3 } from "@babylonjs/core";
import { TransformNode } from "babylonjs";

export class GameObject extends TransformNode {

    static saveAllTransforms() {

        GameObject._gameObjects.forEach((value, key) => {
            value.saveTransform();
        });
    }

    static resetAllTransforms() {
        GameObject._gameObjects.forEach((value, key) => {
            value.resetTransform();
        });
    }

    // enum Type {
    //     None,
    //     Programmable,
    //   }

    public static test = new Array(GameObject);

    public static kebab = 0;

    private static _gameObjects = new Map<Number | string, GameObject>() //unique id or uuid // map uuid,gameObject
    public static get gameObjects() {
        return GameObject._gameObjects;
    }

    initPosition: Vector3 = new Vector3();
    initRotation: Vector3 = new Vector3();
    initScale: Vector3 = Vector3.One();

    constructor(name: string, scene: Scene) {

        super(name, scene);
        // L'accès direct au renderer provoque une erreur
        //        this._transform = new TransformComponent(this, name, scene);

        this.metadata = { type: "GameObject" }

        if (!GameObject._gameObjects.has(this.uniqueId)) {
            GameObject._gameObjects.set(this.uniqueId, this);
        } else {
            console.error("L'objet ayant l'id :" + this.uniqueId + "existe déjà");
            return;
        }



        GameObject.kebab++;

    }

    saveTransform() {
        this.initPosition = this.position;
        this.initRotation = this.rotation;
        this.scaling = this.scaling;
    }

    resetTransform = () => {
        this.position = this.initPosition;
        this.rotation = this.initRotation;
        this.scaling = this.initScale;
    }
}