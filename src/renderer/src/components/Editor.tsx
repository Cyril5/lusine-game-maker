import { Component } from "react";
import { Game } from "../engine/Game";

import { GridMaterial } from "@babylonjs/materials/grid"
import { GameObject } from "../engine/GameObject";
import { Renderer } from "../engine/Renderer";
import { ProgrammableGameObject } from "@renderer/engine/ProgrammableGameObject";
import { Model3D } from "@renderer/engine/Model3D";
import NavBarEditor from "./NavBarEditor";
import AddObjectModal from "./AddObjectModal";
import CommandModal from "./CommandModal";
import { Card, Tab, Tabs } from "react-bootstrap";
import LevelEditor from "@renderer/pages/LevelEditor";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import StatesMachineEditor from "@renderer/pages/StatesMachineEditor";
import StateEditor from "@renderer/pages/StateEditor";
import { Axis, FollowCamera, MeshBuilder, PhysicsImpostor, Space, Vector3 } from "babylonjs";
import ColliderComponent from "@renderer/engine/physics/ColliderComponent";
import EditorAlert, { EditorAlertType } from "./EditorAlert";
import StateEditorUtils from "./StateEditorUtils";
import FileManager from "@renderer/engine/FileManager";
import Qualifiers from "@renderer/editor/Qualifiers";
import State from "@renderer/engine/FSM/State";

export default class Editor extends Component {

    // TODO : A déplacer dans un export de EditorAlert 
    static showAlert(message: string,type?: EditorAlertType) {
        Editor.getInstance().setState({
            alert:{show: true,message: message}
        })
    }



    // use state REACT
    state = {
        activeTab: 1,
        game: null,
        // showAddObjectModal: false,
        objetJeu: null,
        initStateFile: null,
        alert:{
            show : false,
            type: null,
            message: '',
        }
    };

    constructor(props: {} | Readonly<{}>) {
        super(props);
        Editor._instance = this;

        this.state.objetJeu = props.objetJeu;


    }

    componentDidMount() {
        console.log("Editor did mount");
        // window.CANNON = cannon;

        Renderer.isReadyObservable.add(async () => {

            const scene = Renderer.getInstance().scene;

            const ammo = Renderer.getInstance().ammo;

            // Mettre en pause le moteur physique
            scene.physicsEnabled = false;

            //GRID
            const groundMaterial = new GridMaterial("groundMaterial", scene);
            groundMaterial.majorUnitFrequency = 5;
            groundMaterial.minorUnitVisibility = 0.5;
            groundMaterial.gridRatio = 100;
            groundMaterial.opacity = 0.99;
            groundMaterial.useMaxLine = true;

            const ground = MeshBuilder.CreateGround("ground", { width: 1000, height: 1000 }, scene);
            ground.material = groundMaterial;

            const city = this.addModel3DObject("Lowpoly_City.fbx", null, (city) => {
                
                city.name = "Modèle 3D - Ville";
                // Juste un test
                const road = scene.getMeshByName("Model::ROAD");
                if (road) {
                    const parent = road.parent;
                    road.setParent(null); //avant d'appliquer un physicsImposter il faut que le parent soit null
                    // Créez une forme de collision de maillage pour la route
                    road.physicsImpostor = new BABYLON.PhysicsImpostor(road, BABYLON.PhysicsImpostor.MeshImpostor, { mass: 0, friction: 0.5, restitution: 0 }, scene);
                    road.setParent(parent);
                }

                // let buildings = scene.getNodeByName("Model::Block_1");
                // buildings.dispose();
                // buildings = scene.getNodeByName("Model::Block_2");
                // buildings.dispose();
                // buildings = scene.getNodeByName("Model::Block_3");
                // buildings.dispose();
                // buildings = scene.getNodeByName("Model::Block_4");
                // buildings.dispose();

            });


            const car = new ProgrammableGameObject("Car_PO", scene);
            car.qualifier = Qualifiers.PLAYER_TAG;

            // Créer un fichier json pour stocker le code puis l'appliquer à l'état
            if(!FileManager.fileExists(Game.getFilePath("States", "StateA."+StateEditorUtils._stateFilesFormat))) { //StateA.xml
                StateEditorUtils.createStateFile("StateA",car.fsm.states[0].stateFile);
            }else{
                StateEditorUtils.addStateFile("StateA",car.fsm.states[0].stateFile);
            }

            //car.fsm.states[0].stateFile.codeFilename = Game.getFilePath("States", "StateA."+StateEditorUtils._stateCodeFilesFormat); //StateA.state
            car.fsm.states[0].name = "State A";

            
            const car2 = new ProgrammableGameObject("Car2", scene);
            car2.qualifier = Qualifiers.NEUTRAL_TAG;
            //car2.fsm.setState(car.fsm.states[0]); // TODO : à améliorer

            console.warn(car2.fsm.states[0]);

            const carCollider = new ColliderComponent(car,scene);

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


            const carCollider2 : ColliderComponent = new ColliderComponent(car2,scene);
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

        });
    }

    // useEffect(()=>{

    // });

    handleTabChange = (tabKey) => {
        this.setState({ activeTab: tabKey });
    };



    addProgrammableObject() {
        new ProgrammableGameObject("ObjetProgrammable", Renderer.getInstance().scene);
    }

    addModel3DObject(filename: string, options = null, callback: (model: Model3D) => void | null) {
        
        console.log(filename);
        
        // TODO : Remplacer par Game.getFilePath("Models");
        const os = require('os');
        const path = require('path');
        const documentsPath = os.homedir() + '\\Documents\\Lusine Game Maker\\MonProjet';
        let modelsDirectory = path.resolve(documentsPath, 'Models');

       

        //const model = new Model3D("https://models.babylonjs.com/", "aerobatic_plane.glb", Renderer.getInstance().scene);
        const model = new Model3D(modelsDirectory, filename, options, Renderer.getInstance().scene);
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
                    const pog : ProgrammableGameObject= model.getObjectOfTypeInParent<ProgrammableGameObject>(ProgrammableGameObject);
                    this.selectGameObject(pog.Id);
                }));
            });

            callback(model);



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

    private _selectedGameObject: GameObject;
    get selectedGameObject(): GameObject {
        return this._selectedGameObject;
    }

    selectGameObject = (id: number) => {
        const go = GameObject.gameObjects.get(id);
        //console.log(GameObject.gameObjects);
        if(!go) {
            console.error(`GameObject Id : ${id} non trouvé`);
            return;
        }

        this._selectedGameObject = go;
        this.updateObjetJeu(this._selectedGameObject);
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
        this.setState({ objetJeu });
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
                <NavBarEditor />
                {/* <Navigation/> */}
                <AddObjectModal show={false} />
                <EditorAlert show={this.state.alert.show} message={this.state.alert.message}/>
                <CommandModal />

                <Tabs activeKey={this.state.activeTab} onSelect={this.handleTabChange} >
                    <Tab eventKey={1} title={<span><FontAwesomeIcon icon="ghost" /> Editeur de niveau</span>}>
                        <LevelEditor objJeu={this.state.objetJeu} />
                    </Tab>
                    <Tab eventKey={2} title={<span><FontAwesomeIcon icon="diagram-project" />
                        Automates Fini</span>}>
                        {this.state.activeTab == 2 ? <StatesMachineEditor /> : null}
                    </Tab>
                    <Tab eventKey={3} title="Editeur d'état">
                        {/* le useEffect sera rappelé */}
                        <StateEditor initStateFile={this.state.initStateFile} resizeWorkspace={this.state.activeTab == 3} />
                    </Tab>
                </Tabs>

            </>
        );
    }

}