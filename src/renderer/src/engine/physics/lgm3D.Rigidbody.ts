import { PhysicsBody } from "@babylonjs/core";
import { GameObject } from "../GameObject";
import Component from "../lgm3D.Component";
import BoxCollider from "./lgm3D.BoxCollider";
import EditorUtils from "@renderer/editor/EditorUtils";
import { Material, StandardMaterial } from "babylonjs";

export default class Rigidbody extends Component {

    options = {
        angularDamping: 100,
        linearDamping: 10,
        mass: 1,
    }

    private _body: PhysicsBody;
    _shapeContainer: BABYLON.PhysicsShapeContainer | null = null;
    _shapeContainerChildren: Array<BABYLON.PhysicsShape>; //TODO : Enveler de la liste les physicsShape disposed


    get body(): PhysicsBody | null {
        return this._body;
    }

    public update(dt: number) {
        throw new Error("Method not implemented.");
    }

    public destroy() {
        this._body.dispose();
        this._shapeContainer!.dispose();
    }

    constructor(gameObject: GameObject) {
        super();
        this.metaData = { type: Rigidbody.name };
        this._gameObject = gameObject;
        this._shapeContainerChildren = new Array<BABYLON.PhysicsShape>();
        
        this.updateContainerShapes();
        //this.test();
    }

    public test() {
        const box = BABYLON.MeshBuilder.CreateBox("box2", { size:2 }, this._gameObject.scene);
        box.material = new StandardMaterial("block",this._gameObject.scene);
        box.material.color = BABYLON.Color3.Red();
        box.position.copyFrom(this._gameObject.position);
        box.setParent(this._gameObject);
        const shape = new BABYLON.PhysicsShapeBox(box.position,box.rotationQuaternion,new BABYLON.Vector3(2,2,2),this._gameObject.scene);
        this._shapeContainer = new BABYLON.PhysicsShapeContainer(this._gameObject.scene);
        this._shapeContainer!.addChildFromParent(this._gameObject,shape,box);
        //this._shapeContainer!.addChild(collider._colliderShape);
        //collider._colliderShape.dispose();
        this._body = new BABYLON.PhysicsBody(this._gameObject, BABYLON.PhysicsMotionType.DYNAMIC, false, this._gameObject.scene);
        
        this._gameObject._rigidbody = this;
        console.log(this._gameObject._rigidbody.body);
        
        this._body.shape = this._shapeContainer;
        this._body.setMassProperties ({
            mass: 1,
        });

        
    }

    public setPhysicsType(motionType: BABYLON.PhysicsMotionType | null) {

        if (motionType) {
            if (!this._body) {
                this._body = new BABYLON.PhysicsBody(this._gameObject, BABYLON.PhysicsMotionType.DYNAMIC, false, this._gameObject.scene);
                //this._rigidbody.material = { restitution: this.options.restitution };
                //this._rigidbody.shape = this._shapeContainer; // todo : vérifier si il faut mettre après this._shapeContainer.addChildFromParent si il y a des enfants

                return;
            }
            this._body.setMotionType(motionType);
        } else {
            this._body?.dispose();
            this._body.shape?.dispose();
            this._body = null;
        }
    }
    /**
     * Parcourre les colliders enfant pour les ajouter au containerShape
     */
    updateContainerShapes() {
        this._gameObject.getChildTransformNodes().forEach((node) => {
            if (!GameObject.nodeIsGameObject(node)) {
                return;
            }            
            const go = node as GameObject;
            console.log(go.name);
            const collider : BoxCollider = go.getComponent<BoxCollider>("BoxCollider");
            const rigidbody : Rigidbody = go.getComponent<Rigidbody>("Rigidbody");
            if (!collider) {
                return;
            }
            if(rigidbody) {
                EditorUtils.showWarnMsg("Les sous rigidbody d'un rigidbody ne sont pas supporté");
                return;
            }
            //this._shapeContainer!.removeChild(collider._colliderShape);
            
            collider.rigidBody?.dispose();
            collider._physicsBody = null;

            //const shape = collider.updateBodyShape(true);
        });

    }

}