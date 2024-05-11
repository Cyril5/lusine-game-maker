import { GameObject } from "./GameObject"
import Editor from "@renderer/components/Editor";
import Rigidbody from "./physics/lgm3D.Rigidbody";
import BoxCollider from "./physics/lgm3D.BoxCollider";
import { Game } from "./Game";
import GameLoader from "@renderer/editor/GameLoader";
import { ProgrammableGameObject } from "./ProgrammableGameObject";
import { PhysicsShape, PhysicsShapeBox, PhysicsShapeMesh, PhysicsShapeType } from "babylonjs";

export default class DemoTest {

    private test: ProgrammableGameObject;
    private static init = true;
    private car: GameObject;
    private carBody: Rigidbody;
    private scene: BABYLON.Scene;

    constructor() {
        GameLoader.onLevelLoaded.addOnce((scene) => {

            
            this.scene = scene;
            const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 50, height: 50 }, scene);
            
            this.car = GameObject.getById(122);
            //const carMesh = scene.getMeshByUniqueId(16)!.material = null;
            
            this.car.addComponent(new Rigidbody(this.car), "Rigidbody");
            const carCollider = new GameObject("CarCollider",this.scene);
            carCollider.addComponent(new BoxCollider(carCollider),"BoxCollider");
            carCollider.scaling = new BABYLON.Vector3(1.938,1.0,3.151);
            carCollider.position = new BABYLON.Vector3(0,0.512,0.570);
            carCollider.setParent(this.car);

            const groundGo = new GameObject("Ground",this.scene);
            ground.setParent(groundGo);

            var groundAggregate = new BABYLON.PhysicsAggregate(ground, BABYLON.PhysicsShapeType.BOX, { mass: 0 }, scene);

            //TEST COPY
            //const car2 = GameObject.duplicate(this.car);

            Editor.getInstance().updateObjectsTreeView();

        });
    }

    createHouse = () => {
        const box = BABYLON.MeshBuilder.CreateBox("box", {}, this.scene);
        box.position.y = 0.5;
        const roof = BABYLON.MeshBuilder.CreateCylinder("roof", { diameter: 1.3, height: 1.2, tessellation: 3 }, this.scene);
        roof.scaling.x = 0.75;
        roof.rotation.z = Math.PI / 2;
        roof.position.y = 1.22;
    }


    init = (scene: BABYLON.Scene) => {

        if (!DemoTest.init)
            return;
        //this.scene = scene;
        const obstacle = new GameObject("Obstacle", scene);
        obstacle.position = new BABYLON.Vector3(0, 2.38, 21.15);
        obstacle.scaling = new BABYLON.Vector3(25, 25, 7);
        obstacle.addComponent(new BoxCollider(obstacle), "BoxCollider");




        // box.gameObject.position = car!.position;
        // car!.addRigidbody({mass:100,restitution:0.9,friction:0.5});
        // box.gameObject.setParent(car!);

        //car!._shapeContainer.addChild(box._colliderShape);

        Editor.getInstance().updateObjectsTreeView();

        DemoTest.init = false;

    }

    start() {
        const followCam = this.scene.getCameraById("FollowCam");
        followCam.lockedTarget = this.car;
        followCam.radius = 15;
        followCam.rotationOffset = 180;
        followCam.heightOffset = 5;
        this.scene.setActiveCameraById("FollowCam");

        const groundMesh = this.scene.getMeshByUniqueId(50);

        groundMesh!.physicsBody.disablePreStep = false; 
        this.scene.onAfterRenderObservable.addOnce(() => {
            groundMesh!.physicsBody.disablePreStep = true; 
        });

        groundMesh.scaling = new BABYLON.Vector3(0.5,3,0.5);
        groundMesh.physicsBody?.shape!.dispose();
        groundMesh.physicsBody!.shape = new PhysicsShapeMesh(groundMesh,this.scene);
        
    }

    stop(scene: BABYLON.Scene) {

        this.scene.setActiveCameraById("_RENDERER_CAMERA_");
        // if(carRb) {

        //     //car.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0,0,0);
        //     setTimeout(()=>{
        //         carRb.body.disablePreStep = true;
        //     },5000)
        // }

        //this.car.position = new BABYLON.Vector3(0,1,0);

    }

}