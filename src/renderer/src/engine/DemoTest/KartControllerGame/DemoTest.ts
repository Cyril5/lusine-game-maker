import * as BABYLON from "@babylonjs/core";
import KartController from "./KartController";
import { GameObject } from "@renderer/engine/GameObject";


export default class DemoTest {
    private scene!: BABYLON.Scene;
    private kart!: KartController;
    static initialized: boolean;
    body?: BABYLON.PhysicsBody;


    init = async (scene: BABYLON.Scene) => {

        console.log("INIT");

        if (DemoTest.initialized)
            return;
        DemoTest.initialized = true;

        console.log("First Game initialisation");

        this.scene = scene;

        // sphere
        // const sphereTst = BABYLON.MeshBuilder.CreateSphere("sphereTEST", { diameter: 2 }, scene);
        // const sag = new BABYLON.PhysicsAggregate(sphereTst, BABYLON.PhysicsShapeType.SPHERE, { mass: 1 }, scene);

        // //sol
        // const trackMesh = BABYLON.MeshBuilder.CreateBox("trackTEST_in_demo", { width: 10, height: 1, depth: 10 }, scene);
        // trackMesh.setPositionWithLocalVector?.(new BABYLON.Vector3(0, -5, 0)); // si tu veux garder ça
        // // trackMesh.computeWorldMatrix(true);
        // // trackMesh.bakeCurrentTransformIntoVertices();
        // // trackMesh.freezeWorldMatrix();

        // const matTrack = new BABYLON.StandardMaterial("test", scene);
        // matTrack.diffuseColor = BABYLON.Color3.Black();
        // trackMesh.material = matTrack;

        // const aggTrack = new BABYLON.PhysicsAggregate(trackMesh, BABYLON.PhysicsShapeType.MESH, { mass: 0 }, scene);

        const ground = BABYLON.MeshBuilder.CreateBox("ground", { width: 500, height: 2, depth: 500 }, scene);
        const gShape = new BABYLON.PhysicsShapeMesh(ground, scene);
        gShape.material = {friction:0, restitution:0};
        const gBody = new BABYLON.PhysicsBody(ground, BABYLON.PhysicsMotionType.STATIC, false, scene);
        gBody.shape = gShape;
        const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
        groundMat.diffuseColor = BABYLON.Color3.Green();
        ground.material = groundMat;

        const initKart = () => {

            // --- Création du kart ---
            const root = new BABYLON.TransformNode("KartRoot", scene);
            const sphere = BABYLON.MeshBuilder.CreateSphere("KartSphere", { diameter: 1 }, scene);
            //const matSphere = new BABYLON.StandardMaterial("SphereControllerMat", scene);
            //sphere.material = matSphere;
            //matSphere.diffuseColor = BABYLON.Color3.Red();
            sphere.position.y = 5;
            sphere.visibility = 0.25;
            //sphere.position.x = 25.80;

            // const kartMesh = BABYLON.MeshBuilder.CreateBox("KartVisual", { width: 1.4, height: 0.5, depth: 2.0 }, scene);
            // kartMesh.parent = root;
            // kartMesh.position.y = 0.5;
            // const matKart = new BABYLON.StandardMaterial("matKart", scene);
            // kartMesh.material = matKart;
            // matKart.diffuseColor = BABYLON.Color3.Red();

            // --- Havok physics setup ---
            const shapeSphere = new BABYLON.PhysicsShapeSphere(BABYLON.Vector3.Zero(), 0.5, scene);
            shapeSphere.material = {
                friction: 0.0,     // glisse arcade
                restitution: 0.0   // pas de rebond physique (on “fake” en code si besoin)
            } as BABYLON.PhysicsMaterial;

            this.body = new BABYLON.PhysicsBody(sphere, BABYLON.PhysicsMotionType.DYNAMIC, false, scene);
            this.body.shape = shapeSphere;
            this.body.setMassProperties({ mass: 70 });
            this.body.setLinearDamping(0.05);
            this.body.setAngularDamping(0.4);

            // --- Contrôleur du kart ---
            this.kart = new KartController(root, sphere, scene, this.body);

            const followCam = new BABYLON.FollowCamera("cam", new BABYLON.Vector3(0, 10, 10), scene, root);
            followCam.radius = -4;
            followCam.heightOffset = 1.5;
            followCam.cameraAcceleration = 0.15;
            

            const carModel = GameObject.getById(320);
            carModel.setScale(new BABYLON.Vector3(2.5, 2.5, 2.5));
            carModel.transform.setParent(root);
            carModel.setLocalPosition(0, 0.5, 0);
        }


        initKart();

        BABYLON.SceneLoader.ImportMesh("", "https://models.babylonjs.com/", "StanfordBunny.obj", scene, async (meshes) => {

            console.log(scene.getPhysicsEngine()?.getPhysicsPlugin()?.name);

            // 1) Prendre un vrai Mesh avec vertices/indices
            //const meshes = nodes.filter(n => n instanceof BABYLON.Mesh) as BABYLON.Mesh[];
            const bunny = meshes[0];
            if (!bunny) {
                console.error("[PHY] Aucun mesh solide trouvé dans l'OBJ.");
                return;
            }
            console.log("vertices " + bunny.getTotalVertices());

            // 2) Détacher du parent (évite transforms héritées), scaler, puis BAKER
            if (bunny.parent) bunny.setParent(null);
            bunny.position.y = 1.070;
            bunny.position.x = 25;
            bunny.scaling.set(50, 50, 50);

            const shape = new BABYLON.PhysicsShapeMesh(bunny, scene);
            shape.material = { friction: 0.7, restitution: 0.0 } as BABYLON.PhysicsMaterial;

            const body = new BABYLON.PhysicsBody(bunny, BABYLON.PhysicsMotionType.STATIC, false, scene);
            body.shape = shape;
            //bunny.freezeWorldMatrix?.();

            console.log("[PHY] Engine enabled?", !!scene.getPhysicsEngine());
            console.log("[PHY] Bunny isDisposed?", bunny.isDisposed(), "| isInstance?", (bunny as any).isAnInstance === true);

        });

        //CIRCUIT TEST
        const trackMesh = scene.getMeshById("Road");
        trackMesh!.setParent(null);
        trackMesh!.position.y = 2;
        trackMesh!.position.z = 176;
        trackMesh!.scaling = new BABYLON.Vector3(4,4,4);
        const trackPhyShape = new BABYLON.PhysicsShapeMesh(trackMesh, scene);
        trackPhyShape.material = {friction: 0, restitution: 0};
        const trackPhyBody = new BABYLON.PhysicsBody(trackMesh, BABYLON.PhysicsMotionType.STATIC, false, scene);
        trackPhyBody.shape = trackPhyShape;

        const wallMesh = scene.getMeshById("Wall A");
        wallMesh!.setParent(null);
        wallMesh!.position.y = 0.94;
        wallMesh!.position.z = 176;
        wallMesh!.scaling = new BABYLON.Vector3(4,4,4);
        const trackPhyShape2 = new BABYLON.PhysicsShapeMesh(wallMesh, scene);
        trackPhyShape2.material = {friction: 0, restitution: 0};
        const trackPhyBody2 = new BABYLON.PhysicsBody(wallMesh, BABYLON.PhysicsMotionType.STATIC, false, scene);
        trackPhyBody2.shape = trackPhyShape2;

        const wallMesh2 = scene.getMeshById("Wall B");
        wallMesh2!.setParent(null);
        wallMesh2!.position.y = 0.94;
        wallMesh2!.position.z = 176;
        wallMesh2!.scaling = new BABYLON.Vector3(4,4,4);
        const trackPhyShape3 = new BABYLON.PhysicsShapeMesh(wallMesh2, scene);
        trackPhyShape3.material = {friction: 0, restitution: 0};
        const trackPhyBody3 = new BABYLON.PhysicsBody(wallMesh2, BABYLON.PhysicsMotionType.STATIC, false, scene);
        trackPhyBody3.shape = trackPhyShape3;




    }

    start() {
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

