import { GameObject } from "./GameObject"
import Editor from "@renderer/components/Editor";
import Rigidbody from "./physics/lgm3D.Rigidbody";
import BoxCollider from "./physics/lgm3D.BoxCollider";
import { Game } from "./Game";
import { Vector3 } from "@babylonjs/core";

export default class DemoTest {

    private static init = true;
    private car : GameObject;
    private carBody : Rigidbody;
    private scene : BABYLON.Scene;

    init = (scene: BABYLON.Scene) => {

        if(!DemoTest.init)
            return;
        this.scene = scene;
        
        this.car = GameObject.gameObjects.get(485);

        //this.testA();
        this.testB();
    

            // carCollider.addComponent(new BoxCollider(scene,carCollider),"BoxCollider");
            // carCollider.scaling = new BABYLON.Vector3(3,3,3);
            // carCollider.setParent(car);
            // carCollider.setPositionWithLocalVector(new BABYLON.Vector3(0,0,0));

            // const obstacle =  new GameObject("Obstacle",scene);
            // obstacle.position = new BABYLON.Vector3(0,5,0);
            // obstacle.addComponent(new BoxCollider(scene,obstacle),"BoxCollider");

            
            // box.gameObject.position = car!.position;
            // car!.addRigidbody({mass:100,restitution:0.9,friction:0.5});
            // box.gameObject.setParent(car!);
            
            //car!._shapeContainer.addChild(box._colliderShape);

            // const roadMesh = GameObject.gameObjects.get(29)!.getChildMeshes()[0];
            // const aggregate = new BABYLON.PhysicsAggregate(roadMesh, BABYLON.PhysicsShapeType.MESH, { mass: 0 }, scene);

            Editor.getInstance().updateObjectsTreeView();
            
            DemoTest.init = false;
        
    }

    update() {

    }

    start() {
        // this.carBody.body.disablePreStep = false; 
        // this.scene.onAfterRenderObservable.addOnce(() => {
        //     this.carBody.body.disablePreStep = true;
        // });
    }

    stop(scene : BABYLON.Scene) {
        // if(carRb) {

        //     //car.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0,0,0);
        //     setTimeout(()=>{
        //         carRb.body.disablePreStep = true;
        //     },5000)
        // }
        
    }

    private testA() {
        const cube = BABYLON.MeshBuilder.CreateBox("box", { width: 2, height: 2, depth: 2 },this.scene);
        cube.parent = this.car;
        cube.position = new BABYLON.Vector3(0, 0, 0);
        const cubeShape = new BABYLON.PhysicsShapeBox(
            new BABYLON.Vector3(0, 0, 0),
            BABYLON.Quaternion.Identity(),
            new BABYLON.Vector3(2, 2, 2),
            this.scene);

        this.carBody = this.car.getComponent<Rigidbody>("Rigidbody");
        this.carBody._shapeContainer.addChildFromParent(this.car, cubeShape, cube);
    }

    private testB() {

        // const obstacle = BABYLON.MeshBuilder.CreateBox("box2", { width: 10, height: 3, depth: 10 },this.scene);
        // obstacle.position = new BABYLON.Vector3(0, 1, 25);
        //         const obstacleShape = new BABYLON.PhysicsShapeBox(
        //     new BABYLON.Vector3(0, 0, 0),
        //     BABYLON.Quaternion.Identity(),
        //     new BABYLON.Vector3(5, 3, 5),
        //     this.scene);
        // new BABYLON.PhysicsAggregate(obstacle, BABYLON.PhysicsShapeType.BOX, {mass: 0});

        //const boxCollider = new GameObject("CarCollider",this.scene);
        //boxCollider.setParent(this.car);
        //boxCollider.addComponent(new BoxCollider(this.scene,boxCollider),"BoxCollider");
        //boxCollider.position = new BABYLON.Vector3(0,0,0);
        //boxCollider.scaling = new BABYLON.Vector3(2.34,4.48,3.9);
        // this.carBody = this.car.getComponent<Rigidbody>("Rigidbody");

        // this.carBody.body.transformNode.position = new Vector3(3,3,0);
    }
}