import Component from "./lgm3D.Component";
import { Vector3 } from "@babylonjs/core";
import { Observable } from "babylonjs";
import { Exclude, Expose, instanceToPlain } from 'class-transformer';
import Rigidbody from "./physics/lgm3D.Rigidbody";

export class GameObject extends BABYLON.TransformNode {

    //instances : 

    private _components: Map<string, Component>

    private static _gameObjects = new Map<number | string, GameObject>() //unique id or uuid // map uuid,gameObject

    _collider: Collider;

    qualifier: number = 0;

    /**
     * Observable lorsque l'objet est détruit.
    */
    onDelete: Observable<void>;
    /**
     * Observable lorsque l'objet est créé.
    */
    onCreated: Observable<void>;
    /**
      * Observable lorsque le parent change
    */
    onParentChange: Observable<GameObject>;

    /**
     * Get l'identifiant unique du GameObject.
    */
    get Id(): number {
        return this.uniqueId;
    }



    set type(value) {
        this.metadata.type = value;
    }
    get type(): string {
        return this.metadata.type;
    }

    private _scene: BABYLON.Scene;
    get scene(): BABYLON.Scene {
        return this._scene;
    }

    static saveAllTransforms() {

        GameObject._gameObjects.forEach((go, key) => {
            go.saveTransform();
        });
    }

    public static get gameObjects() {
        return GameObject._gameObjects;
    }

    public addComponent<T extends Component>(component: T, componentName: string): Component {
        this._components.set(componentName, component);
        component.name = componentName;
        component._gameObject = this;
        return component;
    }

    static convertToGameObject(transformNode: BABYLON.TransformNode): GameObject {
        
        const scene = transformNode.getScene();

        const gameObject = new GameObject(transformNode.name + "_converted", transformNode.getScene());
        transformNode.metadata.convertedId = gameObject.Id;

        const nonGONodes: BABYLON.TransformNode[] = [];
        const convertedNodes : BABYLON.TransformNode[] = [];

        // on exclus les objets qui ne peuvent pas être converti en GameObject
        transformNode.getChildTransformNodes().forEach(childNode => {

            if (childNode.metadata) {
                return;
            }

            if (childNode.parent) {

                childNode.metadata = { parentId: null };

                childNode.metadata.parentId = childNode.parent.uniqueId;
                childNode.parent = null;
            }
            nonGONodes.push(childNode);
        });

        transformNode.getChildTransformNodes().forEach(childNode => {

            const types = ['GameObject', 'Model3D','PROG_GO'];

            
            if (childNode.metadata && childNode.metadata.gameObjectId) {
                
                const convertedObject = new GameObject(childNode.name + "_converted", childNode.getScene());
                convertedNodes.push(childNode);

                console.log(childNode.metadata);

                childNode.metadata.convertedId = convertedObject.Id;
                
                if(childNode.parent) {
                    convertedObject.metadata.parentId = childNode.parent.uniqueId;
                }

                convertedObject.position.copyFrom(childNode.position);
                convertedObject.rotation = childNode.rotation;
                convertedObject.scaling.copyFrom(childNode.scaling);
            }

        });

        nonGONodes.forEach(node=>{
            const oldParent = scene.getTransformNodeByUniqueId(node.metadata.parentId);
            node.setParent(scene.getTransformNodeByUniqueId(oldParent!.metadata.convertedId));
        });

        convertedNodes.forEach(node=>{
            if(node.parent) {
                scene.getTransformNodeByUniqueId(node.metadata.convertedId)!.setParent(scene.getTransformNodeByUniqueId(node.parent.metadata.convertedId));
            }
            node.dispose();
        });
        transformNode.dispose();

        return gameObject;
    }

    public static createFromTransformNodeMetaData(node: BABYLON.TransformNode, scene: BABYLON.Scene): GameObject {
        const go = new GameObject(node.name, scene);
        go.setUId(node.metadata.gameObjectId);
        node.name += " (orig)";
        go.position.copyFrom(node.position);
        go.rotation.copyFrom(node.rotation);
        go.scaling.copyFrom(node.scaling);
        return go;
    }


    public static duplicate(sourceGO: GameObject): GameObject {

        const instance = sourceGO.instantiateHierarchy(null);
        const targetGO = GameObject.convertToGameObject(instance!);

        // targetGO.getChildTransformNodes().forEach((childTN)=>{
        //     if(childTN.metadata) {
        //         GameObject.convertToGameObject(childTN,targetGO.scene);
        //     } 
        // });
        // const tn = go.clone(go.name+"__",null);
        // const go2 = new GameObject(go.name+"_clone",go.scene);
        // console.log(GameObject.gameObjects);
        for (const component in sourceGO._components.values) {
            alert(component);
        }

        const rbSource = sourceGO.getComponent<Rigidbody>("Rigidbody");
        if (rbSource) {
            const rb = targetGO.addComponent(new Rigidbody(targetGO), "Rigidbody");
            (rb as Rigidbody).copy(rbSource);
        }

        // return go2;
        return targetGO;
    }

    public static getById(id): GameObject {
        return GameObject.gameObjects.get(id);
    }

    public getComponent<T extends Component>(componentName: string): T | null {
        const component = this._components.get(componentName);
        if (component) {
            return component as T;
        } else {
            return null;
        }
    }


    // public getComponentsInChildren<T extends Component>(componentName) : T[] {

    // }

    public removeComponent(componentName: string): void {
        this._components.delete(componentName);
    }

    private _initLocalPos: Vector3 = new Vector3();
    private _initRotation;
    initScale: Vector3 = Vector3.One();

    constructor(name: string, scene: BABYLON.Scene) {

        super(name, scene);

        this.metadata = {};

        this._scene = scene;

        this._components = new Map<string, Component>();


        //this._physicsRootMesh.setParent(this);

        // L'accès direct au renderer provoque une erreur
        //        this._transform = new TransformComponent(this, name, scene);
        this.onDelete = new Observable();
        this.onCreated = new Observable();
        this.onParentChange = new Observable();


        if (!GameObject._gameObjects.has(this.uniqueId)) {
            GameObject._gameObjects.set(this.uniqueId, this);
            // this.onCreated.notifyObservers();
        } else {
            const newId = scene.getUniqueId();
            console.warn("L'objet ayant l'id :" + this.uniqueId + " existe déjà. Nouvel id : " + newId);
            this.setUId(newId, false);
            return;
        }
        this.metadata = { gameObjectId: this.uniqueId, type: "GameObject", parentId: null }


    }

    // ECS
    update(deltaTime: number): void {
        for (let index = 0; index < this._components.length; index++) {
            const component = this._components[index];
            component.update(deltaTime);
        }
    }

    setUId(value: number, deleteOldId = true) {
        const oldId = this.uniqueId;
        super.uniqueId = value;
        this.metadata["gameObjectId"] = value;
        if (deleteOldId) {
            GameObject._gameObjects.delete(oldId);
        }
        GameObject._gameObjects.set(this.uniqueId, this);
        //console.log(GameObject._gameObjects);
    }

    /**
   * Supprime le GameObject de la scene.
   * @remarks
   * Veuillez à supprimer tous les composants de l'objet avant de supprimer le gameObject
   */
    dispose(): void {
        this.onDelete.notifyObservers();
        GameObject._gameObjects.delete(this.uniqueId);
        // this.onCreated.clear();
        // this.onDelete.clear();
        // this._physicsImpostor?.dispose();
        super.dispose();
    }

    setParent(newParent: GameObject) {
        super.setParent(newParent);
        this.metadata.parentId = newParent.Id;
        this.onParentChange.notifyObservers(newParent);
    }

    saveTransform(): void {
        this.initLocalPos = this.position.clone();
        this._initRotation = this.rotation.clone();
        //console.log(this._initRotation);
    }

    resetTransform = () => {


        this.position.copyFrom(this.initLocalPos);
        //this.setAbsolutePosition(new BABYLON.Vector3(this.initWoldPos.x,this.initWoldPos.y,this.initWoldPos.z));

        //this.setPositionWithLocalVector(new BABYLON.Vector3(this.initLocalPos.x,this.initLocalPos.y,this.initLocalPos.z));

        //console.log(this._initRotation);
        this.rotation = this._initRotation;
        //console.log(this.rotation);
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

    public save(): any {
        this.metadata.type = this.type;
        this.metadata.gameObjectId = this.Id;
        this.metadata["components"] = [];
        this._components.forEach((component, key) => {
            this.metadata.components.push(component.toJson());
        });
        console.log(JSON.stringify(this.metadata));
        return this.metadata;
    }

    static nodeIsGameObject(node: BABYLON.TransformNode) {
        return node instanceof GameObject;
    }
}

export class SerialTest {
    id: number;
    private _firstName: string;
    private _lastName: string;
    _password: string;

    setName(firstName: string, lastName: string) {
        this._firstName = firstName;
        this._lastName = lastName;
    }

    @Expose()
    get name() {
        return this._firstName + ' ' + this._lastName;
    }

}