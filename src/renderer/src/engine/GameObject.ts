import { IPhysicsEnabledObject, PhysicsImpostor, Scene, Vector3 } from "@babylonjs/core";
import { Observable, Quaternion, TransformNode } from "babylonjs";

export class GameObject extends TransformNode  implements IPhysicsEnabledObject {

    private _physicsImpostor : PhysicsImpostor | null;
    private static _gameObjects = new Map<number | string, GameObject>() //unique id or uuid // map uuid,gameObject

    qualifier: number = 0;

    /**
    * Observable lorsque l'objet est détruit.
    */
    onDelete: Observable<void>;
    /**
    * Observable lorsque l'objet est détruit.
    */
    onCreated: Observable<void>;

    /**
    * Get l'identifiant unique du GameObject.
    */
    get Id(): number {
        return this.uniqueId;
    }

    get PhysicsImpostor(): PhysicsImpostor {
        return this._physicsImpostor;
    }

    static saveAllTransforms() {

        GameObject._gameObjects.forEach((go, key) => {
            go.saveTransform();
        });
    }

    public static get gameObjects() {
        return GameObject._gameObjects;
    }

    initPosition: Vector3 = new Vector3();
    initRotation: BABYLON.Quaternion = new Quaternion();
    initScale: Vector3 = Vector3.One();

    constructor(name: string, scene: Scene) {

        super(name, scene);
        // L'accès direct au renderer provoque une erreur
        //        this._transform = new TransformComponent(this, name, scene);
        this.onDelete = new Observable();
        this.onCreated = new Observable();

        this.metadata = { type: "GameObject" }

        if (!GameObject._gameObjects.has(this.uniqueId)) {
            GameObject._gameObjects.set(this.uniqueId, this);
            // this.onCreated.notifyObservers();
        } else {
            console.error("L'objet ayant l'id :" + this.uniqueId + "existe déjà");
            return;
        }


    }

    dispose() {
        this.onDelete.notifyObservers();
        this.dispose();
    }

    addRigidbody(options : { mass : number,restitution : number,friction : number}) : void {

        if(!this._physicsImpostor) {
            this._physicsImpostor = new BABYLON.PhysicsImpostor(this, 
                BABYLON.PhysicsImpostor.NoImpostor, options
                , this._scene); // Ajouter l'imposteur de boîte à la voiture 
                return;
        }
        this._physicsImpostor.dispose();
    }


    saveTransform() {
        this.initPosition.copyFrom(this.position);
        this.initRotation.copyFrom(this.rotationQuaternion);
        this.scaling.copyFrom(this.scaling);
    }

    resetTransform = () => {

        this.setPositionWithLocalVector(new BABYLON.Vector3(this.initPosition.x,this.initPosition.y,this.initPosition.z));
        //this.setAbsolutePosition(new BABYLON.Vector3(0,45,0));

        this.rotationQuaternion = new Quaternion(this.initRotation.x,this.initRotation.y, this.initRotation.z,this.initRotation.w);
        // this.scaling = this.initScale;

        if(this._physicsImpostor) {
            this._physicsImpostor.sleep();
            this._physicsImpostor.setLinearVelocity(Vector3.Zero());
        }
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