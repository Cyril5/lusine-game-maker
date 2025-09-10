import Component from "./lgm3D.Component";
import { Observable } from "babylonjs";
import Utils from "./utils/lgm3D.Utils";

export class GameObject {

    private _parent?: GameObject;
    private _wmObs: BABYLON.Observer<BABYLON.TransformNode>;
    public get parent(): GameObject {
        return this._parent;
    }

    static getInstancesOfType(gameObject: GameObject) {

        if (GameObject._instances.has(gameObject)) {
            return GameObject._instances.get(gameObject);
        }
        return [];
    }

    private _components: Map<string, Component>

    private static _gameObjects = new Map<number | string, GameObject>() //unique id or uuid // map uuid,gameObject

    private static _instances = new Map<GameObject, GameObject[]>();

    qualifier: number = 0;

    /**
     * Observable lorsque l'objet est détruit.
    */
    readonly onDelete: Observable<void> = new BABYLON.Observable();
    /**
     * Observable lorsque l'objet est créé.
    */
    readonly onCreated: Observable<void> = new BABYLON.Observable();
    /**
     * Observable lorsque le parent change
    */
    readonly onParentChange: Observable<GameObject> = new BABYLON.Observable();

    private _lastRelativeMatrix: BABYLON.Matrix = BABYLON.Matrix.Identity();
    private _relInit = false;
    public readonly onLocalTransformChanged = new BABYLON.Observable<GameObject>();
    public readonly onWorldTransformChanged = new BABYLON.Observable<GameObject>();

    children: Array<GameObject> = [];

    /**
     * Get l'identifiant unique du GameObject.
    */
    get Id(): number {
        return this._transform.uniqueId;
    }

    get metadata(): {} {
        return this._transform.metadata;
    }
    set metadata(meta) {
        this._transform.metadata = meta;
    }

    set name(value) {
        this._transform.name = value;
    }
    get name(): string {
        return this._transform.name;
    }

    /**
     * Obsolète
    */
    set position(value: BABYLON.Vector3) {
        this._transform.position = value;
        console.warn('gameObject.position = value : Vector3 est obsolète. Utilisez plutôt setLocalPosition');
    }

    get worldPosition() {
        return this._transform.getAbsolutePosition();
    }
    setWorldPosition(v : BABYLON.Vector3) {
        if(!Utils.vector3Equals(this._transform.absolutePosition, v)) {
            this._transform.setAbsolutePosition(v);
            this.onWorldTransformChanged.notifyObservers(this);
        }
    }

    get localPosition() {
        return this._transform.position;
    }

    // --- SURCHARGES (signatures seulement) ---
    setLocalPosition(x: number, y: number, z: number): void;
    setLocalPosition(v: BABYLON.Vector3): void;
    setLocalPosition(a: number | BABYLON.Vector3, b?: number, c?: number): void {
        let target: BABYLON.Vector3;

        if (a instanceof BABYLON.Vector3) {
            target = a;
        } else {
            // évite une allocation si tu veux : this._transform.position.set(a, b!, c!)
            target = new BABYLON.Vector3(a, b ?? 0, c ?? 0);
        }

        // compare puis copie
        if (!Utils.vector3Equals(this._transform.position, target)) {
            this._transform.position.copyFrom(target);
            this.onLocalTransformChanged.notifyObservers(this);
        }
    }

    // --- Rotation (Euler locale) ---
    get rotation() { return this._transform.rotation; }
    setRotationEuler(v: BABYLON.Vector3): void {
        if (Utils.vector3Equals(this._transform.rotation, v)) return;
        this._transform.rotation.copyFrom(v);
        this.onLocalTransformChanged.notifyObservers(this);
    }

    get worldRotationQuaternion() {return this._transform.absoluteRotationQuaternion}

    // --- Rotation (Quaternion local) ---
    get rotationQuaternion() { return this._transform.rotationQuaternion; }
    setRotationQuaternion(q: BABYLON.Quaternion): void {
        const rq = this._transform.rotationQuaternion ?? (this._transform.rotationQuaternion = new BABYLON.Quaternion());
        if (BABYLON.Quaternion.Dot(rq, q) > 0.999999) return;
        rq.copyFrom(q);
        this.onLocalTransformChanged.notifyObservers(this);
    }

    get scale() {
        return this._transform.scaling;
    }
    setScale(v: BABYLON.Vector3) {
        //if (this._transform.scaling.equals(v)) return;
        if (Utils.vector3Equals(this._transform.scaling, v)) return;
        this._transform.scaling.copyFrom(v);
        this.onLocalTransformChanged.notifyObservers(this);
    }

    set type(value) {
        this.metadata["type"] = value;
    }
    get type(): string {
        return this.metadata.type;
    }

    private _scene: BABYLON.Scene;
    get scene(): BABYLON.Scene {
        return this._scene;
    }

    protected _transform: BABYLON.TransformNode;
    get transform(): BABYLON.TransformNode {
        return this._transform;
    }

    constructor(name: string, scene: BABYLON.Scene, transformNode?: BABYLON.TransformNode) {

        this._scene = scene;
        let metadataId = transformNode?.metadata.gameObjectId;
        console.warn("FOUND ? "+metadataId+" "+GameObject._gameObjects.get(metadataId));
        this._transform = !transformNode ? new BABYLON.TransformNode(name, scene) : transformNode;

        if (transformNode) {
            this._transform.rotationQuaternion = transformNode.rotationQuaternion;
            if(!metadataId)
                metadataId = scene.getUniqueId();
            if(!GameObject._gameObjects.has(metadataId)) {
                GameObject._gameObjects.set(metadataId, this);
                this.setUId(metadataId);
            }
            else
                console.error(`GameObjectId ${metadataId} already exists`);
        }
        else{
            this._transform.metadata = {};
            this._transform.rotationQuaternion = BABYLON.Quaternion.Identity();
            GameObject._gameObjects.set(this.Id, this);
            this.setUId(this.Id, false);
        }

        this._components = new Map<string, Component>();

        // L'accès direct au renderer provoque une erreur
        //        this._transform = new TransformComponent(this, name, scene);

        // Capte TOUT (gizmos / code / physique) mais filtre via matrice relative
        this._wmObs = this.transform.onAfterWorldMatrixUpdateObservable.add(()=>this._onAfterWorldMatrixUpdate());

        // if (!GameObject._gameObjects.has(this._transform.uniqueId)) {
        //     GameObject._gameObjects.set(this._transform.uniqueId, this);
        //     console.log("Ajout de l'id "+this._transform.uniqueId);
        //     // this.onCreated.notifyObservers();
        // } else {
        //     const newId = this.scene.getUniqueId();
        //     console.warn("L'objet ayant l'id :" + this._transform.uniqueId + " existe déjà. Nouvel id : " + newId);
        //     if(!transformNode)
        //         this.transform.metadata = { gameObjectId: this._transform.uniqueId, parentId: null }
        //     this.setUId(newId, false);
        // }
    }

    private _onAfterWorldMatrixUpdate() {
        // ⚠️ ne pas appeler computeWorldMatrix ici
        const parent = this._transform.parent as BABYLON.TransformNode | null;

        // matrice "relative" = parent^-1 * self  (ou monde si pas de parent)
        const rel = parent
            ? BABYLON.Matrix.Invert(parent.getWorldMatrix()).multiply(this.transform.getWorldMatrix())
            : this.transform.getWorldMatrix().clone();

        // première init : mémorise et (optionnel) notifie une fois
        if (!this._relInit) {
            this._lastRelativeMatrix.copyFrom(rel);
            this._relInit = true;
            // this.onWorldTransformChanged.notifyObservers(this); // optionnel
            return;
        }

        if (!Utils.matrixAlmostEqual(this._lastRelativeMatrix, rel, 1e-5)) {
            this._lastRelativeMatrix.copyFrom(rel);
            this.onWorldTransformChanged.notifyObservers(this);
        }
    }

    /**
     * Si le transformNode est relié à un GameObject ?
     * TODO : A améliorer
    */
    static nodeIsGameObject(node: BABYLON.TransformNode) {
        return node.metadata?.gameObjectId != null;
    }

    static saveAllTransforms() {

        GameObject._gameObjects.forEach((go, key) => {
            go.saveTransform();
        });
    }

    public static get gameObjects() {
        return GameObject._gameObjects;
    }

    public addComponent<T extends Component>(componentName: string, component: T): Component {

        if (this._components.has(componentName)) {
            console.error("Component already exists in gameObject");
            return null;
        }

        this._components.set(componentName, component);
        component.name = componentName;
        component._gameObject = this;
        return component;
    }

    /**
     * Converti un TransformNode en gameObject
     * TODO : A améliorer 
     * Ajouter peut être une callback à chaque traitement des enfants (source, clone)
    */
    static convertToGameObject(transformNode: BABYLON.TransformNode, recursive = true): GameObject | null {

        const scene = transformNode.getScene();

        if (recursive) {
            transformNode.getChildTransformNodes().forEach(childNode => {

                if (childNode.metadata && childNode.metadata.gameObjectId) {

                    const convertedObject = new GameObject(childNode.name, scene, childNode);

                    // convertedObject.transform.position.copyFrom(childNode.position);
                    // convertedObject.transform.rotation = childNode.rotation;
                    // convertedObject.transform.scaling.copyFrom(childNode.scaling);
                }

            });
        } else {
            if (transformNode.metadata && transformNode.metadata.gameObjectId) {
                return new GameObject(transformNode.name, scene, transformNode);
            }
        }

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

        return null;
    }

    public static createFromTransformNodeMetaData(node: BABYLON.TransformNode, scene: BABYLON.Scene): GameObject {
        return new GameObject(node.name, scene, node);
    }


    public static createInstance(sourceGO: GameObject): GameObject {

        let rootGameObject: GameObject | null = null;

        let root = true;
        const onNewNodeCreated = (source: BABYLON.TransformNode, clone: BABYLON.TransformNode): void => {

            const childSourceGO: GameObject = GameObject.getById(source.uniqueId);

            if (childSourceGO) {
                const cloneGO: GameObject | null = GameObject.convertToGameObject(clone, false);

                if (!cloneGO) return;

                alert('CONVERT : ' + source.name);
                cloneGO.transform!.metadata = { ...source.metadata };
                cloneGO.transform!.metadata.gameObjectId = clone.uniqueId;
                // Créer tous les composants et les copier (à faire aussi sur les enfants)
                const componentSources = childSourceGO.getAllComponents();
                for (const componentSource of componentSources) {
                    const c: Component = cloneGO.addComponent(componentSource.name, new componentSource.constructor(cloneGO));
                    c.copyFrom(componentSource);
                }

                if (root) {
                    rootGameObject = cloneGO;
                    const instances = [];
                    instances.push(cloneGO);
                    GameObject._instances.set(sourceGO, instances);
                    root = false;
                }
            }
        };

        sourceGO.transform.instantiateHierarchy(null, { doNotInstantiate: false }, (source, clone) => onNewNodeCreated(source, clone));

        //sourceGO.transform.setEnabled(false);
        // const nodes : BABYLON.TransformNode[] = [];
        // nodes.push(targetGO.transform);
        // nodes.push(sourceGO.transform.getChildTransformNodes());

        // nodes.forEach((node) => {
        //     if(GameObject.nodeIsGameObject(node)) {
        //         targetGO.transform!.metadata = { ...sourceGO.metadata };
        //         targetGO.transform!.metadata.gameObjectId = instance!.uniqueId;
        //         // Créer tous les composants et les copier
        //         const componentSources = sourceGO.getAllComponents();
        //         for (const componentSource of componentSources) { 
        //             const c : Component = targetGO.addComponent(componentSource, componentSource.name);
        //             console.log(componentSource);
        //             c.copyFrom(componentSource);
        //         }
        //     }
        // })

        return rootGameObject;
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
        this._components.get(componentName).destroy();
        this._components.delete(componentName);
    }

    private _initLocalPos: BABYLON.Vector3 = new BABYLON.Vector3();
    private _initRotation;
    initScale: BABYLON.Vector3 = BABYLON.Vector3.One();


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
            if (!GameObject._gameObjects.has(oldId)) {
                console.log(`GameObject ID ${oldId} not found `);
            } else {
                console.log("delete old id" + oldId);
                GameObject._gameObjects.delete(oldId);
            }
        }
        this._transform.uniqueId = value;
        console.log(`NEW GameObject ID ${value} `);
        GameObject._gameObjects.set(this._transform.uniqueId, this);
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
        this._transform.onAfterWorldMatrixUpdateObservable.remove(this._wmObs);
        this.transform.dispose();

        if (GameObject._instances.has(this)) {
            GameObject._instances.delete(this);
        }
    }

    setParent(newParent: GameObject) {
        this.transform.setParent(newParent?.transform);
        this._parent = newParent;
        if (newParent) {
            this.metadata.parentId = newParent.Id;
            newParent.children.push(this);
        } else {
            newParent.children.delete(this);
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
        this.metadata.parentId = (this.parent ? this.parent.Id : null);
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
}