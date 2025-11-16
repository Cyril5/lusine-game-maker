import React from "react";
import { setGameObjects, setMaterialIds } from "./EditorStore";
import EditorCameraManager from "./EditorCameraManager";
import { Renderer } from "@renderer/engine/Renderer";
import { GameObject } from "@renderer/engine/GameObject";
import EditorUtils from "./EditorUtils";
import GameLoader from "./GameLoader";
import { EditorAlertType } from "@renderer/components/EditorAlert";
import { Model3D } from "@renderer/engine/lgm3D.Model3D";
import BoxCollider from "@renderer/engine/physics/lgm3D.BoxCollider";
import { ProgrammableGameObject } from "@renderer/engine/ProgrammableGameObject";
import { Game } from "@renderer/engine/Game";
import OriginAxis from "@renderer/editor/OriginAxis";
import { GridMaterial } from "@babylonjs/materials/grid";
import defaultEnvTexture from '@renderer/engine/hdr/environment.env?url';
import skyboxSample from "@renderer/engine/skyboxes/TropicalSunnyDay_nx.jpg?url";
import { snapshotTransform, TransformSnapshot } from "./snapshots/TransformSnapshot";
import { MoveGOTransformCommand } from "./commands/MoveGOTransformCommand";
import { commands } from "./CommandsInvoker";
import Utils from "@renderer/engine/utils/lgm3D.Utils";
import FileManager from "@renderer/engine/lgm3D.FileManager";
import AssetsManager from "@renderer/engine/lgm3D.AssetsManager";
import { PostFXManager } from "@renderer/engine/lgm3D.PostFX";
import { FiniteStateMachine } from "@renderer/engine/FSM/lgm3D.FiniteStateMachine";

import * as BABYLON from "@babylonjs/core";
import SphereCollider from "@renderer/engine/physics/lgm3D.SphereCollider";

export enum Mode {
    LevelEditor = 1,
    StateMachineEditor = 2,
    StatesEditor = 3,
}

// Définit un type générique pour un setter d'état
type SetterStateEditorType<T> = React.Dispatch<React.SetStateAction<T>>;

export type EditorComponentStatesType = {
    // Use states composant React
    setMode: SetterStateEditorType<number>;
    setActiveTab: SetterStateEditorType<number>;
    setGame: SetterStateEditorType<any>;
    setShowAddObjectModal: SetterStateEditorType<boolean>;
    setSelectedGO: SetterStateEditorType<any>;
    setInitStateFile: SetterStateEditorType<any>;
    setAlert: SetterStateEditorType<{
        show: false,
        type: null,
        message: '',
        onCloseCallback?: any
    }>;

    setShowStartupModal: SetterStateEditorType<boolean>;
    setShowLoadingModal: SetterStateEditorType<boolean>;
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

export class LGM3D_COMMANDS {
    parentGOToOther(sourceId: number, destinationID: number) {
        GameObject.getById(sourceId)?.setParent(GameObject.getById(destinationID));
    }
    getGoMetadata(goId) {
        GameObject.getById(goId).metadata;
    }

    getChildOf(goId, indexChild): BABYLON.Node | null {
        const children = GameObject.getById(goId).transform.getChildren();
        if (children.length === 0) {
            console.warn('This object has not any children');
            return null;
        }
        return children[indexChild];
    }
}


export default class LGM3DEditor {

    private static _instance: LGM3DEditor;
    private _gizmoObservers: Array<{ remove(): void }> = [];
    private _pendingBefore: TransformSnapshot | null = null;
    private _snapshotSpace: "world" | "local" = "world"; // adapte selon ton UI

    get gameObjects(): any {
        return GameObject.gameObjects;
    }

    public static getInstance(): LGM3DEditor {
        return this._instance;
    }

    states: EditorComponentStatesType = {}; // liste des setter des useState du composant editor

    private _renderer?: Renderer;

    eMode: Mode = Mode.LevelEditor;

    private _selectedGO: GameObject | null = null;
    get selectedGameObject(): GameObject | null {
        return this._selectedGO;
    }

    private _editorCameraManager!: EditorCameraManager;

    constructor(editorStates: EditorComponentStatesType) {

        if (!LGM3DEditor._instance)
            LGM3DEditor._instance = this;

        // =====================================================
        // Permet d'executer des commandes (ne pas activer en prod)
        window["LGM3DGOS"] = GameObject;
        window["LGM3D_COMANDS"] = new LGM3D_COMMANDS;
        //======================================================

        this.states!.setMode = editorStates.setMode;
        this.states!.setActiveTab = editorStates.setActiveTab;
        this.states!.setShowLoadingModal = editorStates.setShowLoadingModal;
        this.states!.setShowStartupModal = editorStates.setShowStartupModal;
        this.states!.setAlert = editorStates.setAlert;
        this.states!.setStateFiles = editorStates.setStateFiles;
        this.states!.setFSM = editorStates.setFSM;
        this.states!.setInitStateFile = editorStates.setInitStateFile;
        this.states!.setSelectedGO = editorStates.setSelectedGO;

        Renderer.isReadyObservable.addOnce(() => {

            console.log("engine ready");

            this.states.setShowStartupModal(true);
            this.states.setShowLoadingModal(false);

            this._renderer = Renderer.getInstance();
        });
        AssetsManager.onMaterialsListChanged.add(this.onMaterialsListChangedEvent);

    }

    onMaterialsListChangedEvent() {
        // Récupère les IDs uniques des matériaux de l’AssetManager
        const ids = Array.from(AssetsManager._materials.values()).map(m => m.uniqueId);
        // Envoie la liste d’IDs au store
        setMaterialIds(ids);
    }

    undo(): void {
        commands.undo();
    }

    get canUndo(): boolean { return commands.canUndo; }
    get canRedo() { return commands.canRedo };

    redo(): void {
        commands.redo();
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
                this.selectedGameObject.destroy();
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
        Game.getInstance().onGameStopped.add(() => {
            this._renderer?.scene.setActiveCameraByName("_RENDERER_CAMERA_");
        });
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
        boxCollider.addComponent(Utils.BX_COLLIDER_COMPONENT_TYPE, new BoxCollider(boxCollider));
        this.selectGameObject(boxCollider.Id);
        this.updateObjectsTreeView();
    }

    addSphereCollider() {
        const sphCollider = new GameObject("SphereCollider", this._renderer!.scene);
        sphCollider.addComponent("SphereCollider",new SphereCollider(sphCollider));
        this.selectGameObject(sphCollider.Id);
        this.updateObjectsTreeView();
    }

    importModelToProject(filename: any) {

        const modelsDirectory = AssetsManager.getModelsDirectory();
        const ext = EditorUtils.path.extname(filename).toLowerCase();
        const baseName = EditorUtils.path.basename(filename, ext);
        const targetDirectory = modelsDirectory + '/' + baseName;
        FileManager.createDir(targetDirectory);
        FileManager.copyFileToDir(filename, targetDirectory);
    }

    addModel3DObject(filename: string, options = null, callback: (model: Model3D) => void | null) {

        const modelsDirectory = AssetsManager.getModelsDirectory();
        const model = Model3D.createFromModel(modelsDirectory, filename, { extractTextures: true }, this._renderer!.scene);
        //FileManager.createDir(modelsDirectory+'/'+filename.split[ext]);

        // quand je clic sur un mesh je peux le sélectionner dans l'éditeur
        // Créer un action manager pour le parentNode
        // Abonnement à l'événement onModelLoaded
        model.onLoaded.addOnce((model3d) => {
            // const children = model.transform.getChildren();
            // children.forEach((child) => {

            //     child.actionManager = new BABYLON.ActionManager(this._renderer!.scene);
            //     // Ajouter une action de clic pour le mesh et ses enfants
            //     child.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLeftPickTrigger, (evt) => {
            //         // Votre code ici
            //         // const pog: ProgrammableGameObject = model.getObjectOfTypeInParent<GameObject>(GameObject);
            //         // this.selectGameObject(pog.Id);
            //     }));
            // });
            // model.transform.getChildren(undefined, true).forEach((node: Node) => {
            //     if ((node as any).receiveShadows !== undefined) {
            //         node.receiveShadows = true;
            //         shadowGen.addShadowCaster(node);
            //     }
            // });

            // if (callback) {
            //     callback(model);
            // }
            // Raffraichir la treeview des gameObjects
            this.selectGameObject(model3d.Id);
            this.updateObjectsTreeView();

        });

    }

    updateObjectsTreeView = () => {
        // Dossier Racine (visible), non déplaçable
        const arr: any[] = [{
            id: "ROOT",
            parent: 0,
            droppable: true,
            text: "Racine",
            isOpen: true,
            data: { type: "folder", locked: true }
        }];

        const selectedId = this.selectedGameObject?.Id;

        // Itère les GameObjects du moteur
        for (const [id, gameObject] of GameObject.gameObjects) {
            const parentId = gameObject.parent ? gameObject.parent.Id : "ROOT"; // <- important

            arr.push({
                id,                         // number ou string ok
                selected: selectedId === id,
                droppable: true,            // un GO peut contenir des GOs → expander visible
                parent: parentId,
                text: `${gameObject.name} (ID : ${id})`,
                data: {
                    type: "GameObject",
                    childrenCount: gameObject.transform.getChildren().length,
                    instancesCount: GameObject.getInstancesOfType(gameObject)?.length ?? 0,
                }
            });
        }
        setGameObjects(arr); // → pousse dans le store
    }

    selectGameObject = (id: number) => {
        const go = GameObject.gameObjects.get(id);

        if (!go) {
            console.error(`GameObject Id : ${id} non trouvé`);
            return;
        }

        this._selectedGO?.onLocalTransformChanged.removeCallback(this._onLocalTransformGameObjectSelectedChanged);
        this._selectedGO?.onWorldTransformChanged.removeCallback(this._onWorldTransformGameObjectSelectedChanged);
        this._selectedGO = go;
        this.selectedGameObject?.onLocalTransformChanged.add(this._onLocalTransformGameObjectSelectedChanged);
        this.selectedGameObject?.onWorldTransformChanged.add(this._onWorldTransformGameObjectSelectedChanged);
        this.updateObjetJeu(this._selectedGO as GameObject);
        this.updateObjectsTreeView();
    }

    getGameObjectById = (id: number) => {

        return GameObject.gameObjects.get(id);
    }

    private _clearGizmoObservers() {
        for (const o of this._gizmoObservers) o.remove();
        this._gizmoObservers.length = 0;
    }

    private _wireAxis(axis: any, axisName: string) {
        // start
        const startObs = axis.dragBehavior.onDragStartObservable.add(() => {
            if (!this._selectedGO) return;
            const go = this._selectedGO!;
            this._pendingBefore = {
                space: this._snapshotSpace,
                position: go.worldPosition.clone(),
                rotation: go.worldRotationQuaternion.clone(),
                scaling: go.scale.clone(),
            };
        });
        // end
        const endObs = axis.dragBehavior.onDragEndObservable.add(() => {
            if (!this._selectedGO || !this._pendingBefore) return;
            // au dragEnd :
            const after = snapshotTransform(this._selectedGO, this._snapshotSpace);
            // position
            const samePos = BABYLON.Vector3.DistanceSquared(after.position, this._pendingBefore.position) <= 1e-8;
            // rotation : q et -q représentent la même rotation → comparer via dot
            const sameRot = Math.abs(BABYLON.Quaternion.Dot(after.rotation, this._pendingBefore.rotation)) > 1 - 1e-5;
            // scale
            const sameScl = BABYLON.Vector3.DistanceSquared(after.scaling, this._pendingBefore.scaling) <= 1e-8;

            const changed = !(samePos && sameRot && sameScl);
            console.log({ changed, before: this._pendingBefore, after });

            if (changed) {
                commands.executeCommand(
                    new MoveGOTransformCommand(this._selectedGO, this._pendingBefore, after)
                );
            }
            this._pendingBefore = null;
            // console.debug(`[GIZMO] end ${axisName}`);
        });

        // Collecte les removers pour éviter les doublons à chaque setTransformGizmoMode
        this._gizmoObservers.push({
            remove: () => {
                axis.dragBehavior.onDragStartObservable.remove(startObs);
                axis.dragBehavior.onDragEndObservable.remove(endObs);
            }
        });
    }

    setTransformGizmoMode(
        transformMode: "TRANSLATE" | "ROTATE" | "SCALE" | "BOUND_BOX"
    ) {
        const gizmoManager = this._renderer!.gizmoManager;

        // 1) Désactive tout + nettoie les abonnements précédents
        gizmoManager.positionGizmoEnabled = false;
        gizmoManager.rotationGizmoEnabled = false;
        gizmoManager.scaleGizmoEnabled = false;
        gizmoManager.boundingBoxGizmoEnabled = false;
        this._clearGizmoObservers();

        // 2) Active le mode demandé et branche axes + drag start/end
        switch (transformMode) {
            case "TRANSLATE": {
                gizmoManager.positionGizmoEnabled = true;
                const pg = gizmoManager.gizmos.positionGizmo!;
                [pg.xGizmo, pg.yGizmo, pg.zGizmo].forEach((ax, i) =>
                    this._wireAxis(ax, `pos-${"xyz"[i]}`)
                );
                break;
            }
            case "ROTATE": {
                gizmoManager.rotationGizmoEnabled = true;
                const rg = gizmoManager.gizmos.rotationGizmo!;
                // utile pour rester en repère monde si besoin
                gizmoManager.gizmos.rotationGizmo.updateGizmoRotationToMatchAttachedMesh = false;
                [rg.xGizmo, rg.yGizmo, rg.zGizmo].forEach((ax, i) =>
                    this._wireAxis(ax, `rot-${"xyz"[i]}`)
                );
                break;
            }
            case "SCALE": {
                gizmoManager.scaleGizmoEnabled = true;
                const sg = gizmoManager.gizmos.scaleGizmo!;
                [sg.xGizmo, sg.yGizmo, sg.zGizmo].forEach((ax, i) =>
                    this._wireAxis(ax, `scl-${"xyz"[i]}`)
                );
                break;
            }
            case "BOUND_BOX": {
                gizmoManager.boundingBoxGizmoEnabled = true;
                const bg = gizmoManager.gizmos.boundingBoxGizmo!;
                // Le boundingBoxGizmo a aussi un dragBehavior (uniform scale/resize)
                this._wireAxis(bg, "bbox");
                break;
            }
        }
    }

    updateObjetJeu = (objetJeu: GameObject) => {

        if (!objetJeu) {
            this._renderer!.gizmoManager.attachToNode(null);
            this._renderer!.gizmoManager.positionGizmoEnabled = false;
            this.states.setSelectedGO(null);
            return;
        }

        let gofsm = null;
        const gofsms = objetJeu.getComponents(FiniteStateMachine);

        if (gofsms.length > 0) {
            gofsm = gofsms[0];
        }

        this.states.setSelectedGO(objetJeu);
        this.states.setFSM(gofsm);
        this._renderer!.gizmoManager.positionGizmoEnabled = true;
        this._renderer!.gizmoManager.attachToNode(objetJeu.transform);
    };

    private _onLocalTransformGameObjectSelectedChanged(go: GameObject) {
        console.log("selected object id :" + go.Id + 'local pos changed');
    }
    private _onWorldTransformGameObjectSelectedChanged(go: GameObject) {
        console.log("selected object id :" + go.Id + 'world pos changed');
    }

    playGame = () => {
        Game.getInstance().start();
    }

    stopGame = () => {
        Game.getInstance().stop();
    }

    private _htmlRootInspector?: HTMLElement;
    private _showDebugInspector = false;
    showDebugInspector(): void {
        this._showDebugInspector = !this._showDebugInspector;
        if (this._showDebugInspector) {
            if (!this._htmlRootInspector) this._htmlRootInspector = document.getElementById("inspector-host")!

            this._renderer?.scene.debugLayer.show({
                embedMode: true,
                overlay: false,
                handleResize: true,
                globalRoot: this._htmlRootInspector,
                enableClose: false,
            });
        } else {
            this._renderer?.scene.debugLayer.hide();
        }
        this._htmlRootInspector!.style.visibility = this._showDebugInspector ? "visible" : "hidden";
    }

    setupBaseScene = () => {

        const scene = this._renderer.scene;
        const camRenderer = this._renderer.camera
        camRenderer.fov = 0.75;
        camRenderer.maxZ = 850;

        //const ammo = renderer.ammo;
        const havok = this._renderer!.hk;

        this._editorCameraManager = new EditorCameraManager(this._renderer!.canvas, this._renderer!.scene, this._renderer!.camera);

        // Mettre en pause le moteur physique
        scene.physicsEnabled = false;

        const ground = BABYLON.MeshBuilder.CreateGround("_EDITOR_GRID_", { width: 1000, height: 1000 }, scene);

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
            //ground.dispose();
        }

        // Crée/attache la caméra (celle de l’éditeur ou de jeu)
        const camera = this._renderer!.camera;

        //TEST
        const setupEnvPBR = true;

        if (setupEnvPBR) {

            //IBL (environnement .env préfiltré, même une neutre “studio”)
            const env = BABYLON.CubeTexture.CreateFromPrefilteredData(defaultEnvTexture, scene);
            scene.environmentTexture = env;
            const skyBoxHdr = scene.createDefaultSkybox(env, true, 1000, 0.6); // skybox douce
            skyBoxHdr!.doNotSerialize = true;
            skyBoxHdr!.material!.doNotSerialize = true;
            skyBoxHdr!.material!.name = "_LEVEL_ENV_MAT_HDR_";
            skyBoxHdr!.name = "_LEVEL_ENV_HDR_";
            skyBoxHdr!.isVisible = false;

            // Key light (directionnelle) avec ombres douces
            const keyLight = new BABYLON.DirectionalLight("_LEVEL_KEY_LIGHT_", new BABYLON.Vector3(-0.3, -1, -0.3), scene);
            keyLight.position = new BABYLON.Vector3(0, 20, 0);
            keyLight.intensity = 1.2;
            keyLight.shadowMinZ = 0;
            keyLight.shadowMaxZ = 50;
            keyLight.castShadows = true;

            // const box = BABYLON.Mesh.CreateBox("box", 3);
            // box.position.y = 10;

            // const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 40, height: 40 }, scene);
            // ground.receiveShadows = true;
            // ground.material = new BABYLON.StandardMaterial("mat", scene);

            // Au moment où l’on charge un modèle, Babylon ajoute les meshes AVANT que le callback soit attaché.
            // Donc on doit aussi traiter ceux déjà existants une fois le shadowGen créé.
            const autoWire = (m: BABYLON.AbstractMesh) => {
                if (m.name.startsWith("_EDITOR_") || m.name.startsWith("_LEVEL_")) return;
                console.log("Mesh added generate shadows");
                m.receiveShadows = true;
                sg.addShadowCaster(m);
            };

            // Skybox
            const skybox = BABYLON.MeshBuilder.CreateBox("_LEVEL_ENV_SKYBOX_", { size: 1000.0 }, scene);
            const skyboxMaterial = new BABYLON.StandardMaterial("_LEVEL_ENV_MAT_SKYBOX_", scene);
            skyboxMaterial.backFaceCulling = false;
            skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(skyboxSample.replace('_nx.jpg', ''), scene);
            skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
            skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
            skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
            skybox.material = skyboxMaterial;
            skybox!.doNotSerialize = true;
            skyboxMaterial.doNotSerialize = true;

            // Fill light (hémisphérique) – adoucit les ombres
            const hemi = new BABYLON.HemisphericLight("_LEVEL_ENV_HEMI_LIGHT_", new BABYLON.Vector3(0, 1, 0), scene);
            hemi.intensity = 0.6;
            hemi.diffuse = new BABYLON.Color3(0.95, 0.98, 1.0);
            hemi.groundColor = new BABYLON.Color3(1.0, 0.95, 0.88);
            hemi.doNotSerialize = true;

            // Rim light (léger liseré)
            const rim = new BABYLON.DirectionalLight("_LEVEL_ENV_RIM_LIGHT_", new BABYLON.Vector3(0.6, -1, 0.2), scene);
            rim.intensity = 0.35;
            rim.doNotSerialize = true;

            const sg = new BABYLON.ShadowGenerator(1024, keyLight);
            sg.usePercentageCloserFiltering = true;
            sg.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
            sg.bias = 0.0002;
            sg.normalBias = 0.06;
            //sg.darkness = 0.8; // ← 🌑 ombre plus dark

            keyLight.intensity = 1.5;
            hemi.intensity = 0.5;
            // évite l’auto-detach des faces avant
            //sg.forceBackFacesOnly = true;

            // évite acne/peter-panning (ajuste selon l’échelle de ta scène)
            sg.bias = 0.0002;
            sg.normalBias = 0.06;
            // add initial caster
            //sg.addShadowCaster(box);
            scene.meshes.forEach(autoWire);
            scene.onNewMeshAddedObservable.add(autoWire);

            // bornes auto (pratique en éditeur)
            //(keyLight as BABYLON.DirectionalLight).autoCalcShadowZBounds = true;

            //PostFX
            this._postFX = new PostFXManager(scene);
            this._postFX.init(camera, {
                fxaa: true,
                bloom: true,
                dof: false,
                exposure: 1.05,
                contrast: 1.03,
                toneMapping: true,
                bloomKernel: 64,
                bloomThreshold: 0.9,
                bloomWeight: 0.35
            });
        }

        if (scene.lights.length === 0) {
            new BABYLON.HemisphericLight("defaultLight", new BABYLON.Vector3(0, 1, 0), scene);
        }

        const axis = new OriginAxis(scene);
        BABYLON.Tags.AddTagsTo({ ground }, EditorUtils.EDITOR_TAG);
        //this.setTransformGizmoMode('TRANSLATE'); //maj du gizmo et de ses events
    }


}