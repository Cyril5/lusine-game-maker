import { Mesh, MeshBuilder, Scene, Vector3 } from "@babylonjs/core";
import { TransformNode } from "babylonjs";
import { ProgrammableGameObject } from "./ProgrammableGameObject";

export class GameObject extends TransformNode {
    
    private static _gameObjects = new Map<number | string, GameObject>() //unique id or uuid // map uuid,gameObject

    qualifier : number = 0; 

    get Id(): number {
        return this.uniqueId;
    }

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

    // getObjectOfTypeInParent<T>(targetType: new () => T): T | null {
    //     let node: TransformNode | null = this;
    //     // Parcourez les parents jusqu'à ce que vous trouviez un parent du type T ou que vous atteigniez la racine (null).
    //     while (node) {
    //         if (node instanceof targetType) {
    //             // Si le parent correspond au type T, retournez-le.
    //             return node as T;
    //         }
    //         // Sinon, passez au parent suivant.
    //         node = node.parent;
    //     }

    //     // Si aucun parent du type T n'est trouvé, retournez null.
    //     return null;
    // }

    getObjectOfTypeInParent<T>(targetType: new () => T): T | null {
        const searchParent = (node: GameObject | null): T | null => {
            if (!node) {
                // Si le nœud est null (racine atteinte), retournez null.
                return null;
            }

            if (node instanceof targetType) {
                // Si le parent correspond au type T, retournez-le.
                return node as T;
            }

            // Sinon, recherchez le parent du type T dans le parent actuel.
            return searchParent(node.parent);
        }

        // Démarrez la recherche à partir de l'instance actuelle (this).
        return searchParent(this);
    }
}