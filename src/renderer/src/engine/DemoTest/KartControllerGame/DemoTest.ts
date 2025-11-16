import * as BABYLON from "@babylonjs/core";
import KartController from "./KartController";
import { GameObject } from "@renderer/engine/GameObject";
import { Rigidbody } from "@renderer/engine/physics/lgm3D.Rigidbody";
import SphereCollider from "@renderer/engine/physics/lgm3D.SphereCollider";
import Collider from "@renderer/engine/physics/lgm3D.Collider";

const CAR_MODEL_ID = 118;
const PLAYER_CAR_ID = 301;
const PLAYER_SPC_CONTROLLER = 323; //sphere collider de playerCar

export default class DemoTest {

    private scene!: BABYLON.Scene;
    private kart!: KartController;
    static initialized: boolean;
    body?: BABYLON.PhysicsBody;
    initFailed = false;

    init = async (scene: BABYLON.Scene) => {

        console.log("INIT");

        if(!GameObject.getById(CAR_MODEL_ID)) {
            this.initFailed = true;
            return;
        }

        if (DemoTest.initialized)
            return;
        DemoTest.initialized = true;

        console.log("First Game initialisation");

        this.scene = scene;

        // const ground = BABYLON.MeshBuilder.CreateBox("ground", { width: 500, height: 2, depth: 500 }, scene);
        // const gShape = new BABYLON.PhysicsShapeMesh(ground, scene);
        // gShape.material = {friction:0, restitution:0};
        // const gBody = new BABYLON.PhysicsBody(ground, BABYLON.PhysicsMotionType.STATIC, false, scene);
        // gBody.shape = gShape;
        // const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
        // groundMat.diffuseColor = BABYLON.Color3.Green();
        // ground.material = groundMat;

        const initKart = () => {

            // --- Création du kart ---
            //const root = new BABYLON.TransformNode("KartRoot", scene);
            const root = GameObject.getById(PLAYER_CAR_ID);

            const spc = new GameObject("SphereCarController", scene);
            spc.setLocalPosition(0, 10, 0);
            const rb = spc.addComponent("Rigidbody", new Rigidbody(spc, scene, BABYLON.PhysicsMotionType.DYNAMIC, 120));
            rb.body.setLinearDamping(0.05);
            rb.body.setAngularDamping(0.4);
            const spcCollider = new GameObject("SphereCollider", scene);
            spcCollider.setParent(spc);
            spcCollider.setLocalPosition(0, 0, 0);
            const sphereCollider = spcCollider.addComponent("SphereCollider", new SphereCollider(spcCollider));
            sphereCollider.setFriction(0.3); // glisse Arcade
            sphereCollider.setRestitution(0);
            

            // const sphere = BABYLON.MeshBuilder.CreateSphere("KartSphere", { diameter: 1 }, scene);
            // sphere.doNotSerialize = true;
            // const matSphere = new BABYLON.StandardMaterial("SphereControllerMat", scene);
            // sphere.material = matSphere;
            // matSphere.diffuseColor = BABYLON.Color3.Red();
            // matSphere.doNotSerialize = true;
            //sphere.position.x = -37.10;
            //sphere.position.z = -12;
            //sphere.position.y = 5;
            //sphere.visibility = 0.25;
            //sphere.position.x = 25.80;

            // --- Havok physics setup ---
            // const shapeSphere = new BABYLON.PhysicsShapeSphere(BABYLON.Vector3.Zero(), 0.5, scene);
            // shapeSphere.material = {
            //     friction: 0.0,     // glisse arcade
            //     restitution: 0.0   // pas de rebond physique (on “fake” en code si besoin)
            // } as BABYLON.PhysicsMaterial;

            // this.body = new BABYLON.PhysicsBody(sphere, BABYLON.PhysicsMotionType.DYNAMIC, false, scene);
            // this.body.shape = shapeSphere;
            // this.body.setMassProperties({ mass: 70 });
            // this.body.setLinearDamping(0.05);
            // this.body.setAngularDamping(0.4);

            const carModel = GameObject.getById(CAR_MODEL_ID);
            //carModel.setScale(new BABYLON.Vector3(2.5, 2.5, 2.5));
            // carModel.setParent(root);
            // carModel.setLocalPosition(0, -1, 0);

            // --- Contrôleur du kart ---
            this.kart = new KartController(root.transform, spc, carModel.transform, scene, spc.getComponent(Rigidbody)!);
            //this.kart = new KartController(root.transform, sphere, carModel.transform, scene, this.body);

            const followCam = new BABYLON.FollowCamera("cam", new BABYLON.Vector3(0, 10, 10), scene, root.transform);
            followCam.radius = -6;
            followCam.heightOffset = 1.5;
            followCam.cameraAcceleration = 0.15;
        }

        //initKart();

        // BABYLON.SceneLoader.ImportMesh("", "https://models.babylonjs.com/", "StanfordBunny.obj", scene, async (meshes) => {
        // });

        //CIRCUIT TEST
        const trackMeshes = scene.getMeshesById("1TARMAC-road");
        trackMeshes.forEach((m) => {
            m!.setParent(null);
            const trackPhyShape = new BABYLON.PhysicsShapeMesh(m, scene);
            trackPhyShape.material = { friction: 0.8, restitution: 0 };
            const trackPhyBody = new BABYLON.PhysicsBody(m, BABYLON.PhysicsMotionType.STATIC, false, scene);
            trackPhyBody.shape = trackPhyShape;
        });
        // GROUND
        const grounds = ["1GRASS_grass_1_0", "0GRASS_grass_1_0", "1GRAVEL_gravel_0", "0GRASS2_grass_2_0", "1GRASS_2_grass_2_0", "Object021_gravel_0", "sand_outside_gravel_0", "Cylinder001_rock_0", "Plane001_rock_0"];
        grounds.forEach((id) => {
            const gm = scene.getMeshById(id);
            gm!.setParent(null);
            const gPhyShape = new BABYLON.PhysicsShapeMesh(gm, scene);
            gPhyShape.material = { friction: 0.3, restitution: 0 };
            const gPhyBody = new BABYLON.PhysicsBody(gm, BABYLON.PhysicsMotionType.STATIC, false, scene);
            gPhyBody.shape = gPhyShape;
        });
    }

    start() {
        if(this.initFailed) return;
        console.log("DemoTest started ✅");
        this.scene.setActiveCameraByName("cam");
    }

    onGameUpdate(dt: number) {
        this.kart.update(dt);
    }

    stop() {
        //this.body?.setTargetTransform(new BABYLON.Vector3(0,5,0), BABYLON.Quaternion.Identity());
    }
}

