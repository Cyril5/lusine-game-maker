import { PhysicsBody } from "@babylonjs/core";
import { GameObject } from "../GameObject";
import Component from "../lgm3D.Component";
import BoxCollider from "./lgm3D.BoxCollider";
import EditorUtils from "@renderer/editor/EditorUtils";
import Collider from "./lgm3D.Collider";

export default class Rigidbody extends Component {

    options = {
        type: 2,
        restitution: 1,
        angularDamping: 100,
        linearDamping: 10,
        mass: 1,
    }

    private _body: BABYLON.PhysicsBody | null = null;
    _shapeContainer: BABYLON.PhysicsShapeContainer | null = null;
    _shapeContainerChildren: Array<BABYLON.PhysicsShape>; //TODO : Enveler de la liste les physicsShape disposed


    get body(): PhysicsBody | null {
        return this._body;
    }

    public copyFrom<Rigidbody>(componentSource: Rigidbody) {
        this.options = componentSource.options;
        alert("COPY RIGIDBODY FROM " + componentSource.gameObject.Id+ "INTO : "+this.gameObject.Id);
        return this;
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
        this._gameObject._rigidbody = this;
        this._shapeContainerChildren = new Array<BABYLON.PhysicsShape>();
        this._shapeContainer = new BABYLON.PhysicsShapeContainer(this._gameObject.scene);

    }

    // Doit être lancé à chaques changement des colliders enfants (par exemple avant que le jeu commence)
    public test() {

        if (this._body) {
            this._body.dispose();
        }

        this.updateContainerShapes();

        console.log("container shape updated");
        //this._body = new BABYLON.PhysicsBody(this._gameObject, BABYLON.PhysicsMotionType.DYNAMIC, false, this._gameObject.scene);
        this.setPhysicsType(this.options.type);

        
        
    }

    public setPhysicsType(motionType: BABYLON.PhysicsMotionType | -1) {
        if (motionType > -1) {
            this._body = new BABYLON.PhysicsBody(this._gameObject.transform, this.options.type, false, this._gameObject.scene);
            
            this._body.shape = this._shapeContainer;
            this._shapeContainer!.material = { restitution: this.options.restitution };
            
            this._body.setMassProperties({
                mass: this.options.mass,
            });
            
            //this._rigidbody.shape = this._shapeContainer; // todo : vérifier si il faut mettre après this._shapeContainer.addChildFromParent si il y a des enfants
            return;

        }
        this._body?.dispose();
    }
    /**
     * Parcourre les colliders enfant pour les ajouter au containerShape
     */
    updateContainerShapes() {

        // const box = BABYLON.MeshBuilder.CreateBox("box2", { size:2 }, this._gameObject.scene);
        // box.material = new StandardMaterial("block",this._gameObject.scene);
        // box.material.color = BABYLON.Color3.Red();
        // box.position.copyFrom(this._gameObject.position);
        // box.setParent(this._gameObject);
        // const shape = new BABYLON.PhysicsShapeBox(box.position,box.rotationQuaternion,new BABYLON.Vector3(2,2,2),this._gameObject.scene);


        this._gameObject.transform.getChildTransformNodes().forEach((node) => {
            
            const go = GameObject.getById(node.uniqueId);

            if(!go)
                return;

            const collider: Collider | null = go.getComponent<BoxCollider>("BoxCollider");
            const rigidbody: Rigidbody | null = go.getComponent<Rigidbody>("Rigidbody");
            if (!collider) {
                return;
            }
            if (rigidbody) {
                EditorUtils.showWarnMsg("Les sous rigidbody d'un rigidbody ne sont pas supporté");
                return;
            }

            collider.updateBodyShape();
            
            //this._shapeContainer!.addChildFromParent(this._gameObject.transform, shape, collider._boxMesh);
            this._shapeContainer!.addChild(collider._colliderShape, collider.gameObject.transform.position, collider._boxMesh.rotationQuaternion);

            if (this._shapeContainer!.getNumChildren() > 1)
                this._shapeContainer?.removeChild(0);
            
            // console.log("dispose collider body");
            collider._physicsBody.dispose();

        });

        //TEST
        // const cube = BABYLON.MeshBuilder.CreateBox("BOX_COLL_TEST", { width: 3, height: 2, depth: 3 },this._gameObject.scene);

        // const boudingBox = cube.getBoundingInfo().boundingBox.extendSize;

        // cube.setParent(this._gameObject);
        // cube.position = new BABYLON.Vector3(0, 0, 0);
        // cube.isVisible = true;

        // const cubeShape = new BABYLON.PhysicsShapeBox(
        //     cube.position,
        //     BABYLON.Quaternion.Identity(),
        //     new BABYLON.Vector3(3,2,3),
        //     this._gameObject.scene);

        // this._shapeContainer!.removeChild(0);
        // this._shapeContainer!.addChildFromParent(this._gameObject, cubeShape, cube);

    }

}