import { Engine, GizmoManager, HemisphericLight, SceneLoader, Space, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";

import { Game } from "./Game";
// import { FBXLoader } from "babylon-fbx-loader";

import { Observable } from "babylonjs";
import Ammo from 'ammojs-typed';
import { AmmoJSPlugin } from "babylonjs";

import '@renderer/assets/css/index.scss';


export class Renderer {
    
    static readonly CAMERA_ID: string = '_RENDERER_CAMERA_';

    private readonly CAMERA_PANNING_SENSTIVITY = 25;
    private readonly CAMERA_ZOOM_SENSTIVITY = 2;  
    
    private _scene: BABYLON.Scene;
    private _engine: Engine;
    private _camera: BABYLON.ArcRotateCamera;
    
    private _game: Game | undefined;
    private static instance: Renderer;
    
    static isReadyObservable: Observable<any> = new Observable();
    
    get scene(): BABYLON.Scene {
        return this._scene;
    }
    
    private _gizmoManager: GizmoManager;
    get gizmoManager(): GizmoManager {
        return this._gizmoManager;
    }
    
    ammo: Ammo;
    
    //onLoaded:()=>void
    private loadPhysicsEngine = async (): Promise<void> => {
        
        try {
            this.ammo = await Ammo.bind(window)();
            this._scene.enablePhysics(new BABYLON.Vector3(0, -10, 0), new AmmoJSPlugin(true, this.ammo));
            //onLoaded();
            
        } catch (error) {
            console.error(error);
        }
    }
    
    
    private init = () => {
        
        
        console.log("renderer initializing");
        
        this._gizmoManager = new GizmoManager(this._scene);
        this._gizmoManager.usePointerToAttachGizmos = false;

        

        this._scene.debugLayer.onSelectionChangedObservable.add((selectedObjects) => {
            //const selectedObject = selectedObjects[0];
            // console.log(selectedObjects);
            
        });
        
        
        this._engine.getRenderingCanvas().addEventListener("wheel", evt => evt.preventDefault());
        
        //SceneLoader.RegisterPlugin(new FBXLoader());
        //BABYLON.SceneLoader.RegisterPlugin(new FBXLoader());
        // await SceneLoader.ImportMeshAsync(null, 'models/fbxtest/', 'cube.fbx', this._scene);
        
        this._camera.setPosition(new Vector3(0, 0, -10));
        
        const canvas = this._scene.getEngine().getRenderingCanvas();
        
        this._camera.attachControl(canvas, true);
        this._camera.panningSensibility = this.CAMERA_PANNING_SENSTIVITY;
        this._camera.zoomOnFactor = this.CAMERA_ZOOM_SENSTIVITY;
        
        //this._scene.debugLayer.show();
        
        // // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), this._scene);
        
        // // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 1.0;
        
        //const sunLight = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(0, -1, 0), this._scene);
        
        // Skybox
        // const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, this._scene);
        // const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this._scene);
        // skyboxMaterial.backFaceCulling = false;
        // skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/skybox", this._scene);
        // skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        // skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        // skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        // skybox.material = skyboxMaterial;
        
        
        //SceneLoader.ImportMesh("", "/models/", "haunted_house.glb", this._scene, function (meshes) {});
        
        // SceneLoader.ImportMesh("", "models/fbxtest/", "cube1m.obj", this._scene, (meshes) => {
            
            //     const cube = this._scene.getNodeByName("Cube");
            //     cube.parent = null;
            //     cube.scaling = new Vector3(0.01, 0.01, 0.01);
            
            //     const model3d: GameObject = new GameObject("CubeModel3D", this._scene);
            //     cube.parent = model3d;
            // });
            
            
            // Ajoute une caméra
            const camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 10, -20), this._scene);
            camera.radius = 30;
            camera.heightOffset = 10;
            camera.rotationOffset = 0;
            camera.cameraAcceleration = 0.05;
            camera.maxCameraSpeed = 20;
            
            // SceneLoader.ImportMesh("", "https://models.babylonjs.com/", "aerobatic_plane.glb", this._scene, (meshes) => {
                
                //     const plane = this._scene.getNodeByName("aerobatic_plane.2");
        //     plane.parent = null;
        //     // plane.scaling = new Vector3(, 0.5, 0.5);
        //     const propellor = this._scene.getNodeByName("Propellor_Joint.9");
        //     propellor.parent = plane;
        
        //     const model3d: GameObject = new GameObject("Modele 3D Avion", this._scene);
        //     plane.parent = model3d.transform;
        
        //     const progGo: ProgrammableGameObject = new ProgrammableGameObject("Objet Programmable", this._scene);
        //     model3d.parent = progGo;
        
        //     this._scene.getNodeById("__root__")?.dispose();
        
        //     // Créer un action manager pour le parentNode
                //     model3d.transform.getChildren()[0].actionManager = new BABYLON.ActionManager(this._scene);

        //     // Ajouter une action de clic pour le mesh et ses enfants
        //     model3d.transform.getChildren()[0].actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLeftPickTrigger, (evt)=> {
        //         // Votre code ici
        //         console.log(model3d.name);
        //     }));

        // });



        // // hide/show the Inspector
        // window.addEventListener("keydown", (ev) => {
        //     // Shift+Ctrl+Alt+I
        //     if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.key === 'i') {
        //         if (this._scene.debugLayer.isVisible()) {
        //             this._scene.debugLayer.hide();
        //         } else {
        //             this._scene.debugLayer.show();
        //         }
        //     }
        // });

        //run the main render loop
        // this._engine.runRenderLoop(() => {
        //  //this._game?.update(this._engine.getDeltaTime());
        //  GameObject.gameObjects.get(9).translate(Axis.Z,0.5,Space.LOCAL);
        //  if(carTest) {
        //  }
        // });

    }

    private constructor(engine: Engine, scene: BABYLON.Scene) {
        console.log("renderer constructor");
        this._engine = engine;
        this._scene = scene;
        this._camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, BABYLON.Vector3.Zero(), this._scene);
        this._camera.id = Renderer.CAMERA_ID;
        this._camera.name = Renderer.CAMERA_ID;
        this.init();
    }

    public static async initAndGetInstance(engine: Engine, scene: BABYLON.Scene) {
        if (Renderer.instance === undefined) {
            Renderer.instance = new Renderer(engine, scene);
        }

        // Renderer.instance.loadPhysicsEngine(()=>{

        //     console.log("ammo loaded");
        //     Renderer.isReadyObservable.notifyObservers();
        // });

        await Renderer.instance.loadPhysicsEngine().then(() => {

            console.log("AmmoJS loaded");
            Renderer.isReadyObservable.notifyObservers();

            return Renderer.instance;
        });

    }

    public static getInstance(): Renderer {
        if (Renderer.instance === undefined)
            console.error("Renderer instance is undefined");
        return Renderer.instance;
    }


}