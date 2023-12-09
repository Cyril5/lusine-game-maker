import { BoundingInfo, IPhysicsEnabledObject, IndicesArray, Nullable, PhysicsImpostor, Vector3 } from "@babylonjs/core";
import { Mesh, Observable, TransformNode } from "babylonjs";

export class GameObject extends TransformNode  {
    
    private _rigidbody: PhysicsImpostor | null;
    private _physicsRootMesh : Mesh;
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
        return this._rigidbody;
    }

    set type(value) {
        this.metadata.type = value;
    }
    get type(): string {
        return this.metadata.type;
    }

    static saveAllTransforms() {

        GameObject._gameObjects.forEach((go, key) => {
            go.saveTransform();
        });
    }

    public static get gameObjects() {
        return GameObject._gameObjects;
    }

    private _initLocalPos: Vector3 = new Vector3();
    private _initRotation;
    initScale: Vector3 = Vector3.One();

    constructor(name: string, scene: BABYLON.Scene) {

        super(name, scene);

        //this._physicsRootMesh.setParent(this);

        // L'accès direct au renderer provoque une erreur
        //        this._transform = new TransformComponent(this, name, scene);
        this.onDelete = new Observable();
        this.onCreated = new Observable();

        
        if (!GameObject._gameObjects.has(this.uniqueId)) {
            GameObject._gameObjects.set(this.uniqueId, this);
            // this.onCreated.notifyObservers();
            this.metadata = { gameObjectId: this.uniqueId,type: "GameObject",parentId : null}
        } else {
            console.error("L'objet ayant l'id :" + this.uniqueId + "existe déjà");
            return;
        }


    }
    // getBoundingInfo(): BoundingInfo {
    //     return this._physicsRootMesh.getBoundingInfo();
    // }
    // getVerticesData(kind: string): Nullable<number[] | Float32Array> {
    //     return this._physicsRootMesh.getVerticesData();
    // }
    // getIndices?(): Nullable<IndicesArray> {
    //     return this._physicsRootMesh.getIndices();
    // }

    setUId(value : number) {
        const oldId = this.uniqueId;
        super.uniqueId = value;
        this.metadata.gameObjectId = value;
        GameObject._gameObjects.delete(oldId);
        GameObject._gameObjects.set(this.uniqueId,this);
        console.log(GameObject._gameObjects);
    }

    dispose() {
        this.onDelete.notifyObservers();
        GameObject._gameObjects.delete(this.uniqueId);
        // this.onCreated.clear();
        // this.onDelete.clear();
        // this._physicsImpostor?.dispose();
        super.dispose();
    }

    addRigidbody(options: { mass: 1, restitution: 0.2, friction: 0.5 }): void {

        console.log(this._rigidbody);
        //if (!this._physicsImpostor) {
            console.log("add rb to "+this.name);
            this.physicsImpostor = new BABYLON.PhysicsImpostor(this,
                BABYLON.PhysicsImpostor.NoImpostor, options, this._scene); // Ajouter l'imposteur de boîte à la voiture
        //}        
    }
    
    removeRigidbody() : void {
        if(this._rigidbody) { 
            console.log("remove rb to "+this.name);          
            this._rigidbody.dispose();
            this._physicsRootMesh.dispose();
        }
    }

    saveTransform() : void {
        this.initLocalPos = this.position.clone();
        this._initRotation = this.rotation.clone();
        console.log(this._initRotation);
    }

    resetTransform = () => {
        if (this._rigidbody) {
            this._rigidbody.sleep();
            this._rigidbody.setLinearVelocity(Vector3.Zero());
        }
        
        this.position.copyFrom(this.initLocalPos);
        //this.setAbsolutePosition(new BABYLON.Vector3(this.initWoldPos.x,this.initWoldPos.y,this.initWoldPos.z));
        
        //this.setPositionWithLocalVector(new BABYLON.Vector3(this.initLocalPos.x,this.initLocalPos.y,this.initLocalPos.z));
        
        console.log(this._initRotation);
        this.rotation = this._initRotation;
        console.log(this.rotation);
        //this.rotation = new Vector3(this.initRotation!.x,this.initRotation!.y,this.initRotation!.z);
        // this.scaling = this.initScale;

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

    public deserialize() {
        this.uniqueId = this.metadata.gameObjectId;
        this.type = this.metadata.type;
    }
}