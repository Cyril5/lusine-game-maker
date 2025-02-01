import React from "react";
import EditorCameraManager from "./EditorCameraManager";
import { Renderer } from "@renderer/engine/Renderer";
import { GameObject } from "@renderer/engine/GameObject";
import EditorUtils from "./EditorUtils";
import GameLoader from "./GameLoader";
import { EditorAlertType } from "@renderer/components/EditorAlert";
import { Model3D } from "@renderer/engine/Model3D";
import BoxCollider from "@renderer/engine/physics/lgm3D.BoxCollider";
import ProjectManager from "./ProjectManager";
import { ProgrammableGameObject } from "@renderer/engine/ProgrammableGameObject";
import { Game } from "@renderer/engine/Game";
import OriginAxis from "@renderer/editor/OriginAxis";
import { GridMaterial } from "@babylonjs/materials/grid";
import defaultSkyBoxTexture from  '@renderer/engine/sanGiuseppeBridge.env?url';

export enum Mode {
    LevelEditor = 1,
    StateMachineEditor = 2,
    StatesEditor = 3,
}

// Définit un type générique pour un setter d'état
type SetterStateEditorType<T> = React.Dispatch<React.SetStateAction<T>>;

export type EditorComponentStatesType = {

    setMode: SetterStateEditorType<number>;
    setActiveTab: SetterStateEditorType<number>;
    setGame: SetterStateEditorType<any>;
    setShowAddObjectModal: SetterStateEditorType<boolean>;
    setObjetJeu: SetterStateEditorType<any>;
    setInitStateFile: SetterStateEditorType<any>;
    setAlert: SetterStateEditorType<{
        show: false,
        type: null,
        message: '',
        onCloseCallback?: any
    }>;

    setShowStartupModal: SetterStateEditorType<boolean>;
    setShowLoadingModal: SetterStateEditorType<boolean>;
    setGameObjects: SetterStateEditorType<any>;
    setFSM: SetterStateEditorType<any>;
    setStateFiles: SetterStateEditorType<any>;

    // use state REACT
    // state = {
    //     eMode: 1,
    //     activeTab: 1,
    //     game: null,
    //     // showAddObjectModal: false,
    //     //objetJeu: null,
    //     initStateFile: null,
    //     alert: {
    //         show: false,
    //         type: null,
    //         message: '',
    //         onCloseCallback: null,
    //     },
    //     showStartupModal: false,
    //     showLoadingModal: true,
    //     gameObjects: null,
    //     fsm: null,
    //     stateFiles: null,
    // };

}


export default class LGM3DEditor {

    private static _instance: LGM3DEditor;

    public static getInstance(): LGM3DEditor {
        return this._instance;
    }

    states: EditorComponentStatesType = {}; // liste des setter des useState du composant editor

    private _renderer?: Renderer;

    eMode: Mode = Mode.LevelEditor;

    private _selectedGameObject: GameObject | null = null;
    get selectedGameObject(): GameObject | null {
        return this._selectedGameObject;
    }

    private _editorCameraManager: EditorCameraManager;

    constructor(editorStates: EditorComponentStatesType) {

        if (!LGM3DEditor._instance)
            LGM3DEditor._instance = this;

        this.states!.setMode = editorStates.setMode;
        this.states!.setActiveTab = editorStates.setActiveTab;
        this.states!.setShowLoadingModal = editorStates.setShowLoadingModal;
        this.states!.setShowStartupModal = editorStates.setShowStartupModal;
        this.states!.setGameObjects = editorStates.setGameObjects;
        this.states!.setAlert =editorStates.setAlert;
        this.states!.setStateFiles = editorStates.setStateFiles;
        this.states!.setFSM = editorStates.setFSM;
        this.states!.setInitStateFile = editorStates.setInitStateFile;
        this.states!.setObjetJeu = editorStates.setObjetJeu;

        Renderer.isReadyObservable.addOnce(() => {

            console.log("engine ready");
        
            this.states.setShowStartupModal(true);
            this.states.setShowLoadingModal(false);

            this._renderer = Renderer.getInstance();


        });

    }

    // Supprimer l'objet selectionné de la scene
    deleteSelection = (): void => {
        if (this.selectedGameObject) {
            const deleteGo = EditorUtils.showMsgDialog({
                message: `Voulez vous supprimer l'objet : ${this.selectedGameObject.name} (ID : ${this.selectedGameObject.Id}) ? \n Cette action est non réversible.`,
                type: 'warning',
                buttons: ['Oui', 'Non'],
                defaultId: 1,
                title: "Confirmation avant suppression",
            });

            if (deleteGo === 0) {
                console.log(this.selectedGameObject.type);
                this.selectedGameObject.dispose();
                this.updateObjectsTreeView();
            }
        }
    }

    getGizmo = (arg0: 'POS' | 'ROT') => {
        const gizmoManager = this._renderer!.gizmoManager;
        switch (arg0) {
            case 'POS':
                return gizmoManager.gizmos.positionGizmo;
            case 'ROT':
                return gizmoManager.gizmos.rotationGizmo;
        }
    }

    load = () => {
        console.log("ready load game");
        GameLoader.load(this._renderer!.scene);
    }

    save = () => {
        GameLoader.save(this._renderer!.scene);
    }

    // TODO : A déplacer dans un export de EditorAlert 
    static showAlert(message: string, type?: EditorAlertType, onClose?: () => void) {
        LGM3DEditor._instance.states.setAlert(
            { show: true, message: message, onCloseCallback: onClose }
        );

    }

    clearScene(scene: BABYLON.Scene) {
        // Parcourez tous les meshes (objets) de la scène et détruisez-les
        scene.meshes.forEach(function (mesh) {
            mesh.dispose();
        });

        // Parcourez toutes les caméras de la scène et détruisez-les
        scene.cameras.forEach((camera) => {
            if (camera.name !== Renderer.CAMERA_ID) {
                console.log(camera.id + " disposed");
                camera.dispose();
            }
        });

        // Parcourez toutes les lumières de la scène et détruisez-les
        scene.lights.forEach(function (light) {
            light.dispose();
        });

        scene.materials.forEach((material) => {
            material.dispose();
        });

        // scene.textures.forEach((texture)=>{
        //     texture.dispose();
        // });

    }

    addProgrammableObject() {
        const pog = new ProgrammableGameObject("ObjetProgrammable", this._renderer!.scene);
        this.selectGameObject(pog.Id);
        this.updateObjectsTreeView();
    }

    addBoxCollider() {
        const scene = this._renderer!.scene;
        const boxCollider = new GameObject("BoxCollider", scene);
        boxCollider.addComponent(new BoxCollider(boxCollider), "BoxCollider");
        this.updateObjectsTreeView();
    }

    addModel3DObject(filename: string, options = null, callback: (model: Model3D) => void | null) {

        // const os = require('os');
        // const path = require('path');
        // const documentsPath = os.homedir() + '\\Documents\\Lusine Game Maker\\MonProjet';
        // let modelsDirectory = path.resolve(documentsPath, 'Models');

        const modelsDirectory = ProjectManager.getModelsDirectory();

        //const model = new Model3D("https://models.babylonjs.com/", "aerobatic_plane.glb", this._renderer!.scene);
        const model = Model3D.createFromModel(modelsDirectory, filename, options, this._renderer!.scene);

        // quand je clic sur un mesh je peux le sélectionner dans l'éditeur
        // Créer un action manager pour le parentNode
        // Abonnement à l'événement onModelLoaded
        model.onLoaded.add((model3d) => {

            const children = model.transform.getChildren();
            children.forEach((child) => {

                child.actionManager = new BABYLON.ActionManager(this._renderer!.scene);
                // Ajouter une action de clic pour le mesh et ses enfants
                child.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLeftPickTrigger, (evt) => {
                    // Votre code ici
                    // const pog: ProgrammableGameObject = model.getObjectOfTypeInParent<GameObject>(GameObject);
                    // this.selectGameObject(pog.Id);
                }));
            });

            if (callback) {
                callback(model);
            }

            // Raffraichir la treeview des gameObjects
            this.updateObjectsTreeView();

        });

    }

    updateObjectsTreeView = () => {
        // Création des noeuds pour chaques gameObject
        const arr: GameObject[] = [];
        const selectedId = this.selectedGameObject?.Id;
        for (const [id, gameObject] of GameObject.gameObjects) {

            const parent = gameObject.transform.parent?.metadata.gameObjectId | 0;
            //console.log(selectedId);
            arr.push({
                "id": id,
                "selected": selectedId == id,
                "droppable": true,
                "parent": parent,
                "text": gameObject.name + " (ID : " + id + ")",
                "data": {
                    "type": gameObject.metadata.type,
                    "chidrenCount": gameObject.transform.getChildren().length,
                    "instancesCount": GameObject.getInstancesOfType(gameObject)!.length,
                }
            });
        }
        this.states.setGameObjects(arr);

    }

    selectGameObject = (id: number) => {
        const go = GameObject.gameObjects.get(id);
    
        if (!go) {
            console.error(`GameObject Id : ${id} non trouvé`);
            return;
        }
    
        this._selectedGameObject = go;
        this.updateObjetJeu(this._selectedGameObject as GameObject);
    
        this._renderer!.camera.target.copyFrom(this._selectedGameObject.position);
    
        this.updateObjectsTreeView();
    }

    getGameObjectById = (id: number) => {

        return GameObject.gameObjects.get(id);
    }

    setTransformMode(transformMode: string) {

        const gizmoManager = this._renderer!.gizmoManager;
        gizmoManager.positionGizmoEnabled = false;
        gizmoManager.rotationGizmoEnabled = false;
        gizmoManager.scaleGizmoEnabled = false;
        gizmoManager.boundingBoxGizmoEnabled = false;

        switch (transformMode) {
            case "TRANSLATE":
                gizmoManager.positionGizmoEnabled = true;
                break;
            case "ROTATE":
                gizmoManager.rotationGizmoEnabled = true;
                gizmoManager.gizmos.rotationGizmo.updateGizmoRotationToMatchAttachedMesh = false;
                break;
            case "SCALE":
                gizmoManager.scaleGizmoEnabled = true;
                break;
            case "BOUND_BOX":
                gizmoManager.boundingBoxGizmoEnabled = true;
                break;
        }
    }

    updateObjetJeu = (objetJeu: GameObject) => {

        if (!objetJeu) {
            this._renderer.gizmoManager.attachToNode(null);
            this._renderer.gizmoManager.positionGizmoEnabled = false;
            // this.setState({
            //     objetJeu: null,
            // });

            this.states.setObjetJeu(null);
            return;
        }
    
        let gofsm = null;
        if (objetJeu.finiteStateMachines) {
            if (objetJeu.finiteStateMachines.length > 0) {
                gofsm = objetJeu.finiteStateMachines[0];
            }
        }
    
        this.states.setObjetJeu(objetJeu);
        this.states.setFSM(gofsm);
    
        this._renderer.gizmoManager.positionGizmoEnabled = true;
        this._renderer.gizmoManager.attachToNode(objetJeu.transform);
    };
    
    
    playGame = () => {
        Game.getInstance().start();
    }
    
    stopGame = () => {
        Game.getInstance().stop();
    }

    showDebugInspector(): void {
        this._renderer!.scene.debugLayer.show();
    }

    setupBaseScene = () => {

        //window.CANNON = cannon;

        const scene = this._renderer.scene;

        scene.debugLayer.show();

        const camRenderer = this._renderer.camera
        camRenderer.fov = 0.75;
        camRenderer.maxZ = 850;


        this.states.setShowStartupModal(false);


        //const ammo = renderer.ammo;
        const havok = this._renderer!.hk;

        this._editorCameraManager = new EditorCameraManager(this._renderer!.canvas, this._renderer!.scene, this._renderer!.camera);

        // Mettre en pause le moteur physique
        scene.physicsEnabled = false;

        const ground = BABYLON.MeshBuilder.CreateGround("_EDITOR_GRID_", { width: 1000, height: 1000 }, scene);
                
        //scene.createDefaultEnvironment();
        // const hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(defaultSkyBoxTexture, scene);
        // scene.environmentTexture = hdrTexture;
        
        // Skybox
        // const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:1000.0}, this._renderer!.scene);
        // const skyboxMaterial = new BABYLON.PBRMaterial("skyBox", this._renderer!.scene);
        // skyboxMaterial.backFaceCulling = false;
        // skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(defaultSkyBoxTexture, this._renderer!.scene);
        // skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        // skybox.material = skyboxMaterial;
        // skybox.doNotSerialize = true;
        
        ground.doNotSerialize = true;
        if (!scene.getEngine().isWebGPU) {
            //GRID
            const groundMaterial = new GridMaterial("_EDITOR_GRIDMAT_", scene);
            groundMaterial.majorUnitFrequency = 100;
            groundMaterial.minorUnitVisibility = 0.5;
            groundMaterial.gridRatio = 10;
            groundMaterial.opacity = 0.99;
            groundMaterial.useMaxLine = true;
            groundMaterial.doNotSerialize = true;

            ground.material = groundMaterial;
            BABYLON.Tags.AddTagsTo({ groundMaterial }, EditorUtils.EDITOR_TAG);
        } else {
            ground.dispose();
        }

        if (scene.lights.length === 0) {
            new BABYLON.HemisphericLight("defaultLight", new BABYLON.Vector3(0, 1, 0), scene);
        }

        const axis = new OriginAxis(scene);
        BABYLON.Tags.AddTagsTo({ ground }, EditorUtils.EDITOR_TAG);
        return;

    }
    

}