import HavokPhysics from "@babylonjs/havok";
import * as BABYLON from "@babylonjs/core";

// import { FBXLoader } from "babylon-fbx-loader";
//import { Observable } from "babylonjs";

import '@renderer/assets/css/index.scss';
import EditorUtils from '@renderer/editor/EditorUtils';
import KartController from "./DemoTest/KartControllerGame/KartController";
import EditorCameraManager from "@renderer/editor/camera/EditorCameraManager";


export class Renderer {

    static readonly CAMERA_ID: string = '_RENDERER_CAMERA_';

    private _scene: BABYLON.Scene;
    private _engine: BABYLON.Engine;
    private _camera: BABYLON.UniversalCamera;

    private static instance: Renderer;

    static isReadyObservable: BABYLON.Observable<any> = new BABYLON.Observable();
    body: BABYLON.PhysicsBody;
    kart: any;

    get scene(): BABYLON.Scene {
        return this._scene;
    }

    get camera(): BABYLON.UniversalCamera {
        return this._camera;
    }

    get canvas(): BABYLON.Nullable<HTMLCanvasElement> {
        return this._engine.getRenderingCanvas();
    }

    private _gizmoManager: BABYLON.GizmoManager;
    get gizmoManager(): BABYLON.GizmoManager {
        return this._gizmoManager;
    }

    ammo: Ammo;
    hk?: BABYLON.HavokPlugin;

    private loadHavokPhysicsEngine = async (): Promise<void> => {
        try {
            //window.CANNON = cannon;

            // initialize plugin
            const havokInstance = await HavokPhysics();
            // pass the engine to the plugin
            const hk = new BABYLON.HavokPlugin(true, havokInstance);
            this._scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), hk);
        } catch (error) {
            console.error(error);
            EditorUtils.showMsgDialog({ type: "error", title: "Load Physics Engine Error", message: error.message });
        }
        this.init();
    }


    private init = () => {

        console.log("renderer initializing");

        const scene = this._scene;

        this._gizmoManager = new BABYLON.GizmoManager(this._scene);
        this._gizmoManager.usePointerToAttachGizmos = false;
        this._engine.getRenderingCanvas().addEventListener("wheel", evt => evt.preventDefault());


        // 5) Logs diags utiles
        //console.log("[PHY] Shape type:", shape?.getType?.?.name ?? (shape as any)?.type ?? "unknown");


        //SceneLoader.RegisterPlugin(new FBXLoader());
        //BABYLON.SceneLoader.RegisterPlugin(new FBXLoader());
        // await SceneLoader.ImportMeshAsync(null, 'models/fbxtest/', 'cube.fbx', this._scene);
        const canvas = this._scene.getEngine().getRenderingCanvas();

        //this._camera.attachControl(canvas, true);

        // scene.debugLayer.show({
        //     embedMode: true,
        //     overlay: false,
        //     handleResize: true,
        //     globalRoot: document.getElementById("inspector-host")!
        // });

        //TEST
        // sphere
        //const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2 }, this.scene);
        //const sag = new BABYLON.PhysicsAggregate(sphere, BABYLON.PhysicsShapeType.SPHERE, { mass: 1 }, this.scene);

        // sol
        //const trackMesh = BABYLON.MeshBuilder.CreateBox("track", { width: 10, height: 1, depth: 10 }, this.scene);
        //trackMesh.setPositionWithLocalVector?.(new BABYLON.Vector3(0, -5, 0)); // si tu veux garder ça
        // trackMesh.computeWorldMatrix(true);
        // trackMesh.bakeCurrentTransformIntoVertices();
        // trackMesh.freezeWorldMatrix();

        // const matTrack = new BABYLON.StandardMaterial("test", this.scene);
        // matTrack.diffuseColor = BABYLON.Color3.Black();
        // trackMesh.material = matTrack;

        // const aggTrack = new BABYLON.PhysicsAggregate(trackMesh, BABYLON.PhysicsShapeType.MESH, { mass: 0 }, this.scene);

        // pas fins
        // const pe = this.scene.getPhysicsEngine();
        // pe.setTimeStep(1 / 120);
        // pe.setSubTimeStep(8);

    }

    private constructor(engine: BABYLON.Engine, scene: BABYLON.Scene) {
        console.log("renderer constructor");
        this._engine = engine;
        this._scene = scene;
        // --- FLY FPS CAMERA ---
        this._camera = new BABYLON.UniversalCamera(Renderer.CAMERA_ID, new BABYLON.Vector3(0, 2, -6), scene);
        this._camera.minZ = 0.05;
        this._camera.maxZ = 10000;
        this._camera.fov = BABYLON.Tools.ToRadians(60);
        this._camera.inertia = 0; // on gère nous-mêmes l’inertie
        this._camera.doNotSerialize = true;
        this._camera.doNotSerialize = true;
    }

    public static async initAndGetInstance(engine: BABYLON.Engine, scene: BABYLON.Scene) {
        if (Renderer.instance === undefined) {
            Renderer.instance = new Renderer(engine, scene);
        }

        var loadingScreen = new EngineLoadingScreen("I'm loading!!");
        engine.loadingScreen = loadingScreen;

        Renderer.instance.loadHavokPhysicsEngine().then(() => {
            console.log("Havok engine loaded");
            Renderer.isReadyObservable.notifyObservers(null);
            return Renderer.instance;
        });

    }

    public static getInstance(): Renderer {
        if (Renderer.instance === undefined)
            console.error("Renderer instance is undefined");
        return Renderer.instance;
    }
}

class EngineLoadingScreen implements BABYLON.ILoadingScreen {

    loadingScreenDiv: HTMLElement;

    //optional, but needed due to interface definitions
    public loadingUIBackgroundColor: string
    constructor(public loadingUIText: string) {
        this.loadingScreenDiv = document.getElementById("loadingScreen");
    }
    public displayLoadingUI() {
        this.loadingScreenDiv.style.opacity = '1';
        this.loadingScreenDiv.classList.remove("hide");
        this.loadingScreenDiv.style.display = "flex";
    }

    public hideLoadingUI() {
        this.loadingScreenDiv.style.opacity = '0';
        setTimeout(() => {
            this.loadingScreenDiv.classList.add('hide'); // Ajoute la classe hidden après la transition
            this.loadingScreenDiv.style.display = 'none';
        }, 2000); // 500ms, le même que la durée de transition
    }
}