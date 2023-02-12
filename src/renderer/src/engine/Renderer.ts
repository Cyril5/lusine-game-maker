import { ArcRotateCamera, Camera, Engine, GizmoManager, HemisphericLight, Mesh, MeshBuilder, Scene, SceneLoader, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";

import { GridMaterial } from "@babylonjs/materials/grid"
import { Game } from "./Game";
import { GameObject } from "./GameObject";
import { Sphere } from "./game-objects/Sphere";
import { Cube } from "./game-objects/Cube";
import { ProgrammableGameObject } from "./ProgrammableGameObject";
import { FBXLoader } from "babylon-fbx-loader";

export class Renderer {

    private static _rendererExists = false;

    private _scene: Scene;
    private _engine: Engine;
    private _camera: Camera;

    private _game: Game | undefined;
    private static instance: Renderer;

    get scene(): Scene {
        return this._scene;
    }

    private _gizmoManager: GizmoManager;
    get gizmoManager(): GizmoManager {
        return this._gizmoManager;
    }

    private init = async () => {

        this._gizmoManager = new GizmoManager(this._scene);
        this._gizmoManager.usePointerToAttachGizmos = false;


        this._engine.getRenderingCanvas().addEventListener("wheel", evt => evt.preventDefault());

        SceneLoader.RegisterPlugin(new FBXLoader());
        // await SceneLoader.ImportMeshAsync(null, 'models/fbxtest/', 'cube.fbx', this._scene);


        //GRID
        const groundMaterial = new GridMaterial("groundMaterial", this._scene);
        groundMaterial.majorUnitFrequency = 5;
        groundMaterial.minorUnitVisibility = 0.5;
        groundMaterial.gridRatio = 1;
        groundMaterial.opacity = 0.99;
        groundMaterial.useMaxLine = true;

        const ground = MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, this._scene);
        ground.material = groundMaterial;

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

        SceneLoader.ImportMesh("", "models/fbxtest/", "cube1m.obj", this._scene, (meshes) => {

            const cube = this._scene.getNodeByName("Cube");
            cube.parent = null;
            cube.scaling = new Vector3(0.01, 0.01, 0.01);

            const model3d: GameObject = new GameObject("CubeModel3D", this._scene);
            cube.parent = model3d.transform;


        });


        SceneLoader.ImportMesh("", "https://models.babylonjs.com/", "aerobatic_plane.glb", this._scene, (meshes) => {

            const plane = this._scene.getNodeByName("aerobatic_plane.2");
            plane.parent = null;
            // plane.scaling = new Vector3(, 0.5, 0.5);
            const propellor = this._scene.getNodeByName("Propellor_Joint.9");
            propellor.parent = plane;

            const model3d: GameObject = new GameObject("Modele 3D Avion", this._scene);
            plane.parent = model3d.transform;

            const progGo: ProgrammableGameObject = new ProgrammableGameObject("Objet Programmable", this._scene);
            model3d.parent = progGo;

            this._scene.getNodeById("__root__")?.dispose();

        });


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

        // run the main render loop
        //this._engine.runRenderLoop(() => {
        //  this._game?.update(this._engine.getDeltaTime());
        //});
    }

    // constructor(engine: Engine, scene: Scene) {


    //     this._engine = engine;
    //     this._scene = scene;

    //     this.init();

    //     //Renderer._rendererExists = true;

    // }

    private constructor(engine: Engine, scene: Scene) {
        console.log("init renderer");
        this._engine = engine;
        this._scene = scene;

        this.init();
    }

    public static initAndGetInstance(engine: Engine, scene: Scene): Renderer {
        if (!Renderer.instance) {
            Renderer.instance = new Renderer(engine, scene);
        }

        return Renderer.instance;
    }

    public static getInstance(): Renderer {
        return Renderer.instance;
    }


}