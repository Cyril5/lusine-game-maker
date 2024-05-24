import Component from "./lgm3D.Component";
import { Vector3 } from "@babylonjs/core";
import { Observable } from "babylonjs";
import { Exclude, Expose, instanceToPlain } from 'class-transformer';
import Rigidbody from "./physics/lgm3D.Rigidbody";
import { GameObjectSetPosNumbersBlock } from "./blocks/gameObject/gameobject_setpos_numbers";
import RotateTowardsBehaviour from "./behaviours/lgm3D.RotateTowardsBehaviour";

export class GameObject {



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
        return this._transform.uniqueId;
    }

    get metadata(): {} {
        return this._transform.metadata;
    }

    set name(value) {
        this._transform.name = value;
    }
    get name(): string {
        return this._transform.name;
    }

    get position() {
        return this._transform.position;
    }
    set position(value) {
        this._transform.position = value;
    }

    get rotation() {
        return this._transform.rotation;
    }
    set rotation(value) {
        this._transform.rotation = value;
    }

    get scale() {
        return this._transform.scaling;
    }
    set scale(value : BABYLON.Vector3) {
        this._transform.scaling = value;
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

    protected _transform : BABYLON.TransformNode;
    get transform() : BABYLON.TransformNode {
        return this._transform;
    }

    static buildFromTransformNode(node : BABYLON.TransformNode) {

        if(!node.getScene())
            throw "No scene found";

        const go = new GameObject(node.name,node.getScene());
        GameObject._gameObjects.delete(go.Id);
        go._transform.dispose(); //supprimer le transform crée par le gameObject avant de le remplacer
        go._transform = node; 
        go.setUId(node.metadata.gameObjectId);
        return go;
    }

    constructor(name : string, scene: BABYLON.Scene) {
 
        this._transform = new BABYLON.TransformNode(name,scene);

        this._transform.rotationQuaternion = BABYLON.Quaternion.Identity();
 
        this._transform.metadata = {};
 
        this._scene = scene;
 
        this._components = new Map<string, Component>();
 
 
        //this._physicsRootMesh.setParent(this);
 
        // L'accès direct au renderer provoque une erreur
        //        this._transform = new TransformComponent(this, name, scene);
        this.onDelete = new Observable();
        this.onCreated = new Observable();
        this.onParentChange = new Observable();
 
 
        if (!GameObject._gameObjects.has(this._transform.uniqueId)) {
            GameObject._gameObjects.set(this._transform.uniqueId, this);
            // this.onCreated.notifyObservers();
        } else {
            const newId = this.scene.getUniqueId();
            console.warn("L'objet ayant l'id :" + this._transform.uniqueId + " existe déjà. Nouvel id : " + newId);
            this.setUId(newId, false);
            return;
        }
        this.transform.metadata = { gameObjectId: this._transform.uniqueId, type: "GameObject", parentId: null }


 
    }

    static nodeIsGameObject(node: BABYLON.TransformNode) {
        return node instanceof GameObject;
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

    /**
     * Converti un TransformNode en gameObject
     * TODO : A améliorer
    */
    static convertToGameObject(transformNode: BABYLON.TransformNode): GameObject {
        
        const scene = transformNode.getScene();

        const gameObject = GameObject.buildFromTransformNode(transformNode);
        transformNode.metadata.convertedId = gameObject.Id;

        const children = new Map<Number,BABYLON.TransformNode>();
        const nonGONodes: BABYLON.TransformNode[] = [];
        const convertedNodes : BABYLON.TransformNode[] = [];

        // on exclus les objets qui ne peuvent pas être converti en GameObject
        // transformNode.getChildTransformNodes().forEach(childNode => {

        //     children.set(childNode.uniqueId,childNode);

        //     if (childNode.metadata) {
        //         return;
        //     }

        //     if (childNode.parent) {

        //         childNode.metadata = { parentId: null };

        //         childNode.metadata.parentId = childNode.parent.uniqueId;
        //         //childNode.parent = null;
        //     }
        //     nonGONodes.push(childNode);
        // });

        transformNode.getChildTransformNodes().forEach(childNode => {

            const types = ['GameObject', 'Model3D','PROG_GO'];

            
            if (childNode.metadata && childNode.metadata.gameObjectId) {
                
                const convertedObject = GameObject.buildFromTransformNode(childNode);

                convertedNodes.push(childNode);
                children.set(convertedObject.Id,convertedObject.transform);

                childNode.metadata.convertedId = convertedObject.Id;
                
                convertedObject.transform.position.copyFrom(childNode.position);
                convertedObject.transform.rotation = childNode.rotation;
                convertedObject.transform.scaling.copyFrom(childNode.scaling);
            }

        });

        // nonGONodes.forEach(node=>{
        //     const oldParent = children.get(node.metadata.parentId);
        //     node.setParent(children.get(oldParent!.metadata.convertedId));
        // });

        // convertedNodes.forEach(node=>{
        //     if(node.parent) {
        //         children.get(node.metadata.convertedId)!.setParent(scene.getTransformNodeByUniqueId(node.parent.metadata.convertedId));
        //     }
        //     node.dispose();
        // });
        // transformNode.dispose();

        return gameObject;
    }

    public static createFromTransformNodeMetaData(node: BABYLON.TransformNode, scene: BABYLON.Scene): GameObject {
        const go = new GameObject(node.name, scene);
        go.setUId(node.metadata.gameObjectId);
        node.name += " (orig)";
        return go;
    }


    public static duplicate(sourceGO: GameObject): GameObject {

        const instance = sourceGO.transform.instantiateHierarchy(null);
        const targetGO = GameObject.convertToGameObject(instance!);

        const rbSource = sourceGO.getComponent<Rigidbody>("Rigidbody");
        if (rbSource) {
            const rb = targetGO.addComponent(new Rigidbody(targetGO), "Rigidbody");
            (rb as Rigidbody).copy(rbSource);
        }

        // return go2;
        return targetGO;
    }

    public static getById(id: number): GameObject {
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

    public getAllComponents() {
        return this._components.values();
    }


    public removeComponent(componentName: string): void {
        this._components.delete(componentName);
    }

    private _initLocalPos: Vector3 = new Vector3();
    private _initRotation;
    initScale: Vector3 = Vector3.One();


    // ECS
    update(deltaTime: number): void {
        for (let index = 0; index < this._components.length; index++) {
            const component = this._components[index];
            component.update(deltaTime);
        }
    }

    setUId(value: number, deleteOldId = true) {
        const oldId = this._transform.uniqueId;
        this.metadata["gameObjectId"] = value;
        if (deleteOldId) {
            console.log("delete old id"+oldId);
            GameObject._gameObjects.delete(oldId);
        }
        this._transform.uniqueId = value;
        GameObject._gameObjects.set(this._transform.uniqueId, this);
        //console.log(GameObject._gameObjects);
    }

    /**
   * Supprime le GameObject de la scene.
   * @remarks
   * Veuillez à supprimer tous les composants de l'objet avant de supprimer le gameObject
   */
    dispose(): void {
        this.onDelete.notifyObservers();
        GameObject._gameObjects.delete(this.Id);
        // this.onCreated.clear();
        // this.onDelete.clear();
        // this._physicsImpostor?.dispose();
        this.transform.dispose();
    }

    setParent(newParent: GameObject) {
        this.transform.setParent(newParent?.transform);
        if(newParent) {
            this.metadata.parentId = newParent.Id;
        }
        
        this.onParentChange.notifyObservers(newParent);
    }

    saveTransform(): void {
        this.initLocalPos = this.position.clone();
        this._initRotation = this.rotation.clone();
        //console.log(this._initRotation);
    }

    resetTransform = () => {


        this._transform.position.copyFrom(this.initLocalPos);
        //this.setAbsolutePosition(new BABYLON.Vector3(this.initWoldPos.x,this.initWoldPos.y,this.initWoldPos.z));

        //this.setPositionWithLocalVector(new BABYLON.Vector3(this.initLocalPos.x,this.initLocalPos.y,this.initLocalPos.z));

        //console.log(this._initRotation);
        this._transform.rotation = this._initRotation;
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
            return searchParent(node._transform.parent);
        }

        // Démarrez la recherche à partir de l'instance actuelle (this).
        return searchParent(this);
    }

    public deserialize() {
        this._transform.uniqueId = this.metadata.gameObjectId;
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