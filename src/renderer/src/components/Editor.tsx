import { Component } from "react";
import { Game } from "../engine/Game";

import { GridMaterial } from "@babylonjs/materials/grid"
import { GameObject } from "../engine/GameObject";
import { Renderer } from "../engine/Renderer";
import { ProgrammableGameObject } from "@renderer/engine/ProgrammableGameObject";
import { Model3D } from "@renderer/engine/Model3D";
import NavBarEditor from "./NavBarEditor";
import { Tab, Tabs } from "react-bootstrap";
import LevelEditor from "@renderer/pages/LevelEditor";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import StatesMachineEditor from "@renderer/components/StatesMachineEditor/StatesMachineEditor";
import StateEditor from "@renderer/pages/StateEditor";
import { MeshBuilder } from "babylonjs";
import BoxCollider from "@renderer/engine/physics/lgm3D.BoxCollider";
import EditorAlert, { EditorAlertType } from "./EditorAlert";
import StateEditorUtils from "../editor/StateEditorUtils";
import FileManager from "@renderer/engine/FileManager";
import Qualifiers from "@renderer/editor/Qualifiers";
import StartupModal from "./Modals/StartupModal";
import ProjectManager from "@renderer/editor/ProjectManager";
import OriginAxis from "@renderer/editor/OriginAxis";
import GameLoader from "@renderer/editor/GameLoader";
import EditorUtils from "@renderer/editor/EditorUtils";
import EditorCameraManager from "@renderer/editor/EditorCameraManager";
import LoadingEditorModal from "./Modals/LoadingEditorModal";

enum Mode {
    LevelEditor = 1,
    StateMachineEditor = 2,
    StatesEditor = 3,
}

export default class Editor extends Component {


    eMode: Mode = Mode.LevelEditor;

    private _editorCameraManager: EditorCameraManager;

    // use state REACT
    state = {
        eMode: 1,
        activeTab: 1,
        game: null,
        // showAddObjectModal: false,
        objetJeu: null,
        initStateFile: null,
        alert: {
            show: false,
            type: null,
            message: '',
            onCloseCallback: null,
        },
        showStartupModal: false,
        showLoadingModal: true,
        gameObjects: null,
        fsm: null,
        stateFiles: null,
    };

    // Supprimer l'objet selectionné de la scene
    deleteSelection(): void {
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


    getGizmo(arg0: 'POS' | 'ROT') {
        const gizmoManager = Renderer.getInstance().gizmoManager;
        switch (arg0) {
            case 'POS':
                return gizmoManager.gizmos.positionGizmo;
            case 'ROT':
                return gizmoManager.gizmos.rotationGizmo;
        }
    }

    load(): void {
        console.log("ready load game");
        const scene = Renderer.getInstance().scene;

        GameLoader.load(scene);
    }


    save(): void {
        const scene = Renderer.getInstance().scene;
        GameLoader.save(scene);
    }


    showDebugInspector(): void {
        Renderer.getInstance().scene.debugLayer.show();
    }


    // TODO : A déplacer dans un export de EditorAlert 
    static showAlert(message: string, type?: EditorAlertType, onClose?: () => void) {
        Editor.getInstance().setState({
            alert: { show: true, message: message, onCloseCallback: onClose }
        })
    }

    showStartupModal(show: boolean = true) {
        this.setState({ showStartupModal: show });
    }


    constructor(props: { objetJeu }) {
        super(props);
        Editor._instance = this;


        this.state.objetJeu = props.objetJeu;

        Renderer.isReadyObservable.addOnce(() => {
            this.setState({ showStartupModal: true, showLoadingModal: false });
        });

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

    async setupBaseScene() {

        const renderer = Renderer.getInstance();

        //window.CANNON = cannon;

        const scene = renderer.scene;

        const camRenderer = renderer.camera
        camRenderer.fov = 0.75;
        camRenderer.maxZ = 850;


        this.showStartupModal(false);


        //const ammo = renderer.ammo;
        const havok = renderer.hk;

        this._editorCameraManager = new EditorCameraManager(renderer.canvas, renderer.scene, renderer.camera);

        // Mettre en pause le moteur physique
        scene.physicsEnabled = false;

        const ground = MeshBuilder.CreateGround("_EDITOR_GRID_", { width: 1000, height: 1000 }, scene);
        if (!scene.getEngine().isWebGPU) {
            //GRID
            const groundMaterial = new GridMaterial("_EDITOR_GRIDMAT_", scene);
            groundMaterial.majorUnitFrequency = 100;
            groundMaterial.minorUnitVisibility = 0.5;
            groundMaterial.gridRatio = 10;
            groundMaterial.opacity = 0.99;
            groundMaterial.useMaxLine = true;

            ground.material = groundMaterial;
            BABYLON.Tags.AddTagsTo({ groundMaterial }, EditorUtils.EDITOR_TAG);
        } else {
            ground.dispose();
        }

        const axis = new OriginAxis(scene);
        BABYLON.Tags.AddTagsTo({ ground }, EditorUtils.EDITOR_TAG);
        return;

    }

    loadDemo() {
        //Renderer.isReadyObservable.add(async () => {
        this.setupBaseScene();

        const city = this.addModel3DObject("PizzaHome.glb", null, (city) => {

            city.name = "PizzaHome";



        });



        car.qualifier = Qualifiers.PLAYER_TAG;

        // Créer les fichiers pour stocker le code
        if (!FileManager.fileExists(ProjectManager.getFilePath("States", "StateA." + StateEditorUtils._stateFilesFormat))) { //StateA.xml
            //StateEditorUtils.createStateFile("StateA");
        } else {
            //Ajouter à la liste des fichiers d'état
            //StateEditorUtils.addStateFile("StateA");
        }
        StateEditorUtils.addStateFile("StateA");

        car.finiteStateMachines[0].states[0].stateFile = StateEditorUtils.getStateFile("StateA"); //StateA.state

        const car2: ProgrammableGameObject = new ProgrammableGameObject("Car2", scene);
        car2.qualifier = Qualifiers.NEUTRAL_TAG;

        StateEditorUtils.addStateFile("AICarMainState");
        car2.finiteStateMachines[0].states[0].stateFile = StateEditorUtils.getStateFile("AICarMainState");

        const carCollider = new BoxCollider(car, scene);

        this.addModel3DObject("Car_04_3.fbx", null, (carModel) => {

            carModel.name += " - Car04_3";

            const carMesh = Renderer.getInstance().scene.getMeshByName("Model::Car_04_3");
            if (carMesh) {


                //carCollider = BABYLON.MeshBuilder.CreateBox("carBoxCollider", { height: 60, width: 75, depth: 140 }, scene);
                //carCollider.isVisible = true; // Masquer la boîte pour qu'elle ne soit pas visible dans la scène
                //carCollider.position = carMesh.position; // Positionner la boîte à la position de la voiture
                //carCollider.visibility = 0.25;
                //carMesh.setParent(car);
            }
            carModel.setParent(car);
            car.addRigidbody({ mass: 1, restitution: 0.2, friction: 0.5 });
            car.position.z = -222.25;


        });


        const carCollider2: BoxCollider = new BoxCollider(car2, scene);
        carCollider2.isTrigger = true;
        carCollider2.shape.name = "CarCollider2";

        this.addModel3DObject("Car_03.fbx", null, (carModel) => {

            carModel.name += " - Car03";

            const carMesh = Renderer.getInstance().scene.getMeshByName("Model::CAR_03");

            carModel.setParent(car2);
            car2.addRigidbody({ mass: 1, restitution: 0.2, friction: 0.5 }); // Ajouter l'imposteur de boîte à la voiture
            car2.position.y = 41.958;
        });


        const camera = scene.getCameraByName("FollowCam");
        camera.lockedTarget = car;
        camera.radius = -500;
        camera.heightOffset = 200;

        //let speed = 5;


        Renderer.getInstance().scene.getEngine().runRenderLoop(() => {
            // Déplacement de la voiture
            // if (keys[90]) { // Z
            //     car.translate(Axis.Z, speed, BABYLON.Space.LOCAL);
            // }
            // else if (keys[83]) { // S
            //     car.translate(Axis.Z, -speed, BABYLON.Space.LOCAL);
            // }

            // if (keys[81]) { // Q
            //     car.rotate(Axis.Y, -0.03, BABYLON.Space.LOCAL);
            // }
            // else if (keys[68]) { // D
            //     car.rotate(Axis.Y, 0.03, BABYLON.Space.LOCAL);
            // }

            // if (car && car2) {

            //     if (car.position.y < -300) {
            //         car.position.y = 500;
            //         car.rotation = new Vector3(0, 0, 0);
            //     }

            //     if (car2.position.y < -300) {
            //         car2.position = new Vector3(0, 500, 0);
            //         car2.rotation = new Vector3(0, 0, 0);
            //     }
            // }
        });
        //});


    }

    handleTabChange = (tabKey) => {
        this.setState({
            activeTab: tabKey,
            eMode: tabKey,
        });
    };

    updateObjectsTreeView = () => {
        // Création des noeuds pour chaques gameObject
        const arr: GameObject[] = [];
        const selectedId = this.selectedGameObject?.Id;
        for (const [id, gameObject] of GameObject.gameObjects) {

            const parent = gameObject.parent?.metadata.gameObjectId | 0;
            //console.log(selectedId);
            arr.push({
                "id": id,
                "selected":selectedId == id,
                "droppable": true,
                "parent": parent,
                "text": gameObject.name + " (ID : " + id + ")",
                "data": {
                    "type": gameObject.metadata.type,
                    "chidrenCount": gameObject.getChildren().length
                }
            });
        }

        this.setState({
            gameObjects: arr
        });

    }


    addProgrammableObject() {
        const pog = new ProgrammableGameObject("ObjetProgrammable", Renderer.getInstance().scene);

        this.selectGameObject(pog.Id);
        this.updateObjectsTreeView();
    }

    addBoxCollider() {
        const scene = Renderer.getInstance().scene;
        const boxCollider = new GameObject("BoxCollider",scene);
        boxCollider.addComponent(new BoxCollider(scene,boxCollider),"BoxCollider");
        this.updateObjectsTreeView();
    }

    addModel3DObject(filename: string, options = null, callback: (model: Model3D) => void | null) {


        // TODO : Remplacer par Game.getFilePath("Models");
        // const os = require('os');
        // const path = require('path');
        // const documentsPath = os.homedir() + '\\Documents\\Lusine Game Maker\\MonProjet';
        // let modelsDirectory = path.resolve(documentsPath, 'Models');

        const modelsDirectory = ProjectManager.getModelsDirectory();

        //const model = new Model3D("https://models.babylonjs.com/", "aerobatic_plane.glb", Renderer.getInstance().scene);
        const model = Model3D.createFromModel(modelsDirectory, filename, options, Renderer.getInstance().scene);

        // quand je clic sur un mesh je peux le sélectionner dans l'éditeur
        // Créer un action manager pour le parentNode
        // Abonnement à l'événement onModelLoaded
        model.onLoaded.add((model3d) => {

            const children = model.getChildren();
            children.forEach((child) => {

                child.actionManager = new BABYLON.ActionManager(Renderer.getInstance().scene);
                // Ajouter une action de clic pour le mesh et ses enfants
                child.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLeftPickTrigger, (evt) => {
                    // Votre code ici
                    const pog: ProgrammableGameObject = model.getObjectOfTypeInParent<GameObject>(GameObject);
                    this.selectGameObject(pog.Id);
                }));
            });

            if (callback) {
                callback(model);
            }

            // Raffraichir la treeview des gameObjects
            this.updateObjectsTreeView();

        });

    }

    // private _gizmoManager: GizmoManager;
    // get gizmoManager(): GizmoManager {
    //     return this._gizmoManager;
    // }

    setTransformMode(transformMode: string) {

        const gizmoManager = Renderer.getInstance().gizmoManager;
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
    // let gameRef = useRef<Game>(null);

    private _selectedGameObject: GameObject | null = null;
    get selectedGameObject(): GameObject | null {
        return this._selectedGameObject;
    }

    selectGameObject = (id: number) => {
        const go = GameObject.gameObjects.get(id);

        if (!go) {
            console.error(`GameObject Id : ${id} non trouvé`);
            return;
        }

        this._selectedGameObject = go;
        this.updateObjetJeu(this._selectedGameObject as GameObject);

        Renderer.getInstance().camera.target.copyFrom(this._selectedGameObject.position);

        this.updateObjectsTreeView();
    }

    handleAddObject = () => {
        alert("Utiliser plutôt le bouton représentant un cube avec un +");
        this.setState({ showAddObjectModal: true });
    }

    private static _instance: Editor;
    static getInstance(): Editor {
        return Editor._instance;
    }


    updateObjetJeu = (objetJeu: GameObject) => {

        if (!objetJeu) {
            Renderer.getInstance().gizmoManager.attachToNode(null);
            Renderer.getInstance().gizmoManager.positionGizmoEnabled = false;
            this.setState({
                objetJeu: null,
            });
            return;
        }

        let gofsm = null;
        if (objetJeu.finiteStateMachines) {
            if (objetJeu.finiteStateMachines.length > 0) {
                gofsm = objetJeu.finiteStateMachines[0];
            }
        }

        this.setState({
            objetJeu: objetJeu,
            fsm: gofsm
        });

        Renderer.getInstance().gizmoManager.positionGizmoEnabled = true;
        Renderer.getInstance().gizmoManager.attachToNode(objetJeu);
    };


    playGame = () => {

        Game.getInstance().start();
        // Renderer.getInstance()?.getEngine()?.runRenderLoop += ()=>{

        // }
    }

    stopGame = () => {
        Game.getInstance().stop();
    }


    render() {
        return (
            <>
                <EditorAlert show={this.state.alert.show} message={this.state.alert.message} onCloseCallback={this.state.alert.onCloseCallback} />

                <NavBarEditor />
                {this.state.activeTab != Mode.StatesEditor && (
                    <>
                        {/* <CommandModal /> */}

                    </>
                )}

                <LoadingEditorModal show={this.state.showLoadingModal} />
                <StartupModal show={this.state.showStartupModal} />

                <Tabs activeKey={this.state.activeTab} onSelect={this.handleTabChange} >
                    <Tab eventKey={1} title={<span><FontAwesomeIcon icon="ghost" /> Editeur de niveau</span>}>
                        <LevelEditor objJeu={this.state.objetJeu} gameObjects={this.state.gameObjects} />
                    </Tab>
                    <Tab eventKey={2} title={<span><FontAwesomeIcon icon="diagram-project" />
                        Automates Fini</span>}>
                        {/* {this.state.activeTab == 2 ? <StatesMachineEditor statefiles={this.state.stateFiles} fsm={this.state.fsm}/> : null} */}
                        <StatesMachineEditor statefiles={this.state.stateFiles} fsm={this.state.fsm} />
                    </Tab>
                    <Tab eventKey={3} title={<span><FontAwesomeIcon icon="file-pen" />
                        Editeur d'état</span>}>
                        {/* le useEffect sera rappelé */}
                        <StateEditor statefiles={this.state.stateFiles} initStateFile={this.state.initStateFile} resizeWorkspace={this.state.activeTab == 3} />
                    </Tab>
                </Tabs>

            </>
        );
    }

}

