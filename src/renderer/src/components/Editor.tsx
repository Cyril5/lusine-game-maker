import { Renderer } from "../engine/Renderer";
import NavBarEditor from "./NavBarEditor";
import { Tab, Tabs } from "react-bootstrap";
import LevelEditor from "@renderer/pages/LevelEditor";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import StatesMachineEditor from "@renderer/components/StatesMachineEditor/StatesMachineEditor";
import StateEditor from "@renderer/pages/StateEditor";
import EditorAlert from "./EditorAlert";
import StartupModal from "./Modals/StartupModal";
import LoadingEditorModal from "./Modals/LoadingEditorModal";
import { useEffect, useState } from "react";
import { IStateFile } from "@renderer/engine/FSM/IStateFile";
import LGM3DEditor, { EditorComponentStatesType, Mode } from "@renderer/editor/LGM3DEditor";



const Editor = function () {

    
    const [eMode, setMode] = useState(1);
    const [activeTab, setActiveTab] = useState(1);
    const [game, setGame] = useState<any>(null);
    const [objetJeu, setObjetJeu] = useState(null);
    const [showAddObjectModal, setShowAddObjectModal] = useState(false);
    const [initStateFile, setInitStateFile] = useState<IStateFile>(null);
    const [alertState, setAlert] = useState({
        show: false,
        type: null,
        message: '',
        onCloseCallback: null,
    });
    
    const [showStartupModal, setShowStartupModal] = useState(false);
    const [showLoadingModal, setShowLoadingModal] = useState(true);
    const [gameObjects, setGameObjects] = useState(null);
    const [fsm, setFSM] = useState(null);
    const [stateFiles, setStateFiles] = useState(null);

    const states : EditorComponentStatesType = {
        setMode: setMode,
        setActiveTab: setActiveTab,
        setAlert: setAlert,
        setGameObjects: setGameObjects,
        setShowLoadingModal: setShowLoadingModal,
        setShowStartupModal: setShowStartupModal,
        setFSM: setFSM,
        setStateFiles: setStateFiles,
        setInitStateFile: setInitStateFile,
        setObjetJeu: setObjetJeu,
        setGame: setGame
    }
    
    // Initialisation de l'éditeur
    new LGM3DEditor(states);
    
    useEffect(()=>{
    },[]);
    
    
    
    
    
    
    
    const showDebugInspector = () => {
        Renderer.getInstance().scene.debugLayer.show();
    }

    // const showStartupModal = (show: boolean = true) => {
    //     setShowStartupModal(show);
    // }


    // constructor(props: { objetJeu }) {
    //     super(props);
    //     Editor._instance = this;


    //     this.state.objetJeu = props.objetJeu;

    //     Renderer.isReadyObservable.addOnce(() => {
    //         this.setState({ showStartupModal: true, showLoadingModal: false });
    //     });

    // }

    const clearScene = (scene: BABYLON.Scene) => {
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



    // loadDemo() {
    //     //Renderer.isReadyObservable.add(async () => {
    //     this.setupBaseScene();

    //     const city = this.addModel3DObject("PizzaHome.glb", null, (city) => {

    //         city.name = "PizzaHome";



    //     });



    //     car.qualifier = Qualifiers.PLAYER_TAG;

    //     // Créer les fichiers pour stocker le code
    //     if (!FileManager.fileExists(ProjectManager.getFilePath("States", "StateA." + StateEditorUtils._stateFilesFormat))) { //StateA.xml
    //         //StateEditorUtils.createStateFile("StateA");
    //     } else {
    //         //Ajouter à la liste des fichiers d'état
    //         //StateEditorUtils.addStateFile("StateA");
    //     }
    //     StateEditorUtils.addStateFile("StateA");

    //     car.finiteStateMachines[0].states[0].stateFile = StateEditorUtils.getStateFile("StateA"); //StateA.state

    //     const car2: ProgrammableGameObject = new ProgrammableGameObject("Car2", scene);
    //     car2.qualifier = Qualifiers.NEUTRAL_TAG;

    //     StateEditorUtils.addStateFile("AICarMainState");
    //     car2.finiteStateMachines[0].states[0].stateFile = StateEditorUtils.getStateFile("AICarMainState");

    //     const carCollider = new BoxCollider(car, scene);

    //     this.addModel3DObject("Car_04_3.fbx", null, (carModel) => {

    //         carModel.name += " - Car04_3";

    //         const carMesh = Renderer.getInstance().scene.getMeshByName("Model::Car_04_3");
    //         if (carMesh) {


    //             //carCollider = BABYLON.MeshBuilder.CreateBox("carBoxCollider", { height: 60, width: 75, depth: 140 }, scene);
    //             //carCollider.isVisible = true; // Masquer la boîte pour qu'elle ne soit pas visible dans la scène
    //             //carCollider.position = carMesh.position; // Positionner la boîte à la position de la voiture
    //             //carCollider.visibility = 0.25;
    //             //carMesh.setParent(car);
    //         }
    //         carModel.setParent(car);
    //         car.addRigidbody({ mass: 1, restitution: 0.2, friction: 0.5 });
    //         car.position.z = -222.25;


    //     });


    //     const carCollider2: BoxCollider = new BoxCollider(car2, scene);
    //     carCollider2.isTrigger = true;
    //     carCollider2.shape.name = "CarCollider2";

    //     this.addModel3DObject("Car_03.fbx", null, (carModel) => {

    //         carModel.name += " - Car03";

    //         const carMesh = Renderer.getInstance().scene.getMeshByName("Model::CAR_03");

    //         carModel.setParent(car2);
    //         car2.addRigidbody({ mass: 1, restitution: 0.2, friction: 0.5 }); // Ajouter l'imposteur de boîte à la voiture
    //         car2.position.y = 41.958;
    //     });


    //     const camera = scene.getCameraByName("FollowCam");
    //     camera.lockedTarget = car;
    //     camera.radius = -500;
    //     camera.heightOffset = 200;

    //     //let speed = 5;


    //     Renderer.getInstance().scene.getEngine().runRenderLoop(() => {
    //         // Déplacement de la voiture
    //         // if (keys[90]) { // Z
    //         //     car.translate(Axis.Z, speed, BABYLON.Space.LOCAL);
    //         // }
    //         // else if (keys[83]) { // S
    //         //     car.translate(Axis.Z, -speed, BABYLON.Space.LOCAL);
    //         // }

    //         // if (keys[81]) { // Q
    //         //     car.rotate(Axis.Y, -0.03, BABYLON.Space.LOCAL);
    //         // }
    //         // else if (keys[68]) { // D
    //         //     car.rotate(Axis.Y, 0.03, BABYLON.Space.LOCAL);
    //         // }

    //         // if (car && car2) {

    //         //     if (car.position.y < -300) {
    //         //         car.position.y = 500;
    //         //         car.rotation = new Vector3(0, 0, 0);
    //         //     }

    //         //     if (car2.position.y < -300) {
    //         //         car2.position = new Vector3(0, 500, 0);
    //         //         car2.rotation = new Vector3(0, 0, 0);
    //         //     }
    //         // }
    //     });
    //     //});


    // }

    const handleTabChange = function (tabKey) {
        setActiveTab(tabKey);
        setMode(tabKey);
    };

    // updateObjectsTreeView = () => {
    //     // Création des noeuds pour chaques gameObject
    //     const arr: GameObject[] = [];
    //     const selectedId = this.selectedGameObject?.Id;
    //     for (const [id, gameObject] of GameObject.gameObjects) {

    //         const parent = gameObject.transform.parent?.metadata.gameObjectId | 0;
    //         //console.log(selectedId);
    //         arr.push({
    //             "id": id,
    //             "selected": selectedId == id,
    //             "droppable": true,
    //             "parent": parent,
    //             "text": gameObject.name + " (ID : " + id + ")",
    //             "data": {
    //                 "type": gameObject.metadata.type,
    //                 "chidrenCount": gameObject.transform.getChildren().length
    //             }
    //         });
    //     }

    //     this.setState({
    //         gameObjects: arr
    //     });

    // }



    // private _gizmoManager: GizmoManager;
    // get gizmoManager(): GizmoManager {
    //     return this._gizmoManager;
    // }

    const setTransformMode = (transformMode: string) => {

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
    
//     private _selectedGameObject: GameObject | null = null;
//     get selectedGameObject(): GameObject | null {
//     return this._selectedGameObject;
// }



const handleAddObject = () => {
    alert("Utiliser plutôt le bouton représentant un cube avec un +");
    this.setState({ showAddObjectModal: true });
}


return (
    <>
        <EditorAlert show={alertState.show} message={alertState.message} onCloseCallback={alertState.onCloseCallback} />

        <NavBarEditor />
        {activeTab != Mode.StatesEditor && (
            <>
                {/* <CommandModal /> */}

            </>
        )}

        <LoadingEditorModal show={showLoadingModal} />
        <StartupModal show={showStartupModal} />

        <Tabs activeKey={activeTab} onSelect={handleTabChange} >
            <Tab eventKey={1} title={<span><FontAwesomeIcon icon="ghost" /> Editeur de niveau</span>}>
                <LevelEditor objJeu={objetJeu} gameobjectslist={gameObjects} />
            </Tab>
            <Tab eventKey={2} title={<span><FontAwesomeIcon icon="diagram-project" />
                Automates Fini</span>}>
                {/* {this.state.activeTab == 2 ? <StatesMachineEditor statefiles={this.state.stateFiles} fsm={this.state.fsm}/> : null} */}
                <StatesMachineEditor statefiles={stateFiles} fsm={fsm} />
            </Tab>
            <Tab eventKey={3} title={<span><FontAwesomeIcon icon="file-pen" />
                Editeur d'état</span>}>
                {/* le useEffect sera rappelé */}
                <StateEditor statefiles={stateFiles} initStateFile={initStateFile} resizeWorkspace={activeTab == Mode.StatesEditor} />
            </Tab>
        </Tabs>

    </>
);
}
export default Editor

