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
import * as cannon from "cannon";
import { cp } from "fs";
import { AmmoJSPlugin } from '@babylonjs/core/Physics/Plugins/ammoJSPlugin';
import * as Ammo from "ammojs-typed";
import Collider from "@renderer/engine/Collider";


export default class Editor extends Component {

    // use state REACT
    state = {
        activeTab: 1,
        game: null,
        // showAddObjectModal: false,
        objetJeu: null,
    };

    constructor(props: {} | Readonly<{}>) {
        super(props);
        Editor._instance = this;

        this.state.objetJeu = props.objetJeu;


    }

    componentDidMount() {
        console.log("Editor did mount");
        window.CANNON = cannon;

        Renderer.isReadyObservable.add(async () => {

            const scene = Renderer.getInstance().scene;

            const ammo = Renderer.getInstance().ammo;

            console.log("pause physics engine");
            scene.physicsEnabled = false;



            //GRID
            const groundMaterial = new GridMaterial("groundMaterial", scene);
            groundMaterial.majorUnitFrequency = 5;
            groundMaterial.minorUnitVisibility = 0.5;
            groundMaterial.gridRatio = 1;
            groundMaterial.opacity = 0.99;
            groundMaterial.useMaxLine = true;

            const ground = MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
            ground.material = groundMaterial;
            //ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.MeshImpostor, { mass: 0, friction: 1, restitution: 0.3 }, Renderer.getInstance().scene);

            console.log("Editor knows renderer is ready");
            const city = this.addModel3DObject("Lowpoly_City.fbx", null, (city) => {
                // Juste un test
                const road = scene.getMeshByName("Model::ROAD");
                if (road) {
                    const parent = road.parent;
                    road.setParent(null); //avant d'appliquer un physicsImposter il faut que le parent soit null
                    // Créez une forme de collision de maillage pour la route
                    road.physicsImpostor = new BABYLON.PhysicsImpostor(road, BABYLON.PhysicsImpostor.MeshImpostor, { mass: 0, friction: 0.5, restitution: 0 }, scene);
                    //road.setParent(parent);
                }

                //const buildings = scene.getMeshByName("Model::City").dispose();
            });


            const car = new ProgrammableGameObject("Car_PO", scene);
            const car2 = new ProgrammableGameObject("Car2", scene);
            let carCollider = new Collider(scene);

            this.addModel3DObject("Car_04_3.fbx", null, (carModel) => {

                const carMesh = Renderer.getInstance().scene.getMeshByName("Model::Car_04_3");
                if (carMesh) {


                    //carCollider = BABYLON.MeshBuilder.CreateBox("carBoxCollider", { height: 60, width: 75, depth: 140 }, scene);
                    //carCollider.isVisible = true; // Masquer la boîte pour qu'elle ne soit pas visible dans la scène
                    //carCollider.position = carMesh.position; // Positionner la boîte à la position de la voiture
                    //carCollider.visibility = 0.25;
                    carMesh.setParent(car);
                }
                //carCollider.physicsImpostor = new BABYLON.PhysicsImpostor(carCollider, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 });
                carCollider.attachToNode(car);
                car.physicsImpostor = new BABYLON.PhysicsImpostor(car, BABYLON.PhysicsImpostor.NoImpostor, { mass: 1, restitution: 0.2, friction: 0.5 }, scene); // Ajouter l'imposteur de boîte à la voiture
                car.position.y = 41.958;


            });


            let carCollider2;
            this.addModel3DObject("Car_03.fbx", null, (carModel) => {

                const carMesh = Renderer.getInstance().scene.getMeshByName("Model::CAR_03");
                if (carMesh) {
                    carMesh.setParent(car2);
                    // carMesh.translate(Axis.Z, -50, Space.LOCAL);

                    carCollider2 = BABYLON.MeshBuilder.CreateBox("carBox2", { height: 60, width: 75, depth: 140 }, scene);
                    carCollider2.isVisible = true; // Masquer la boîte pour qu'elle ne soit pas visible dans la scène
                    carCollider2.position = carMesh.position; // Positionner la boîte à la position de la voiture
                    carCollider2.visibility = 0.25;
                }
                carCollider2.physicsImpostor = new BABYLON.PhysicsImpostor(carCollider2, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 });
                carCollider2.setParent(car2);
                car2.physicsImpostor = new BABYLON.PhysicsImpostor(car2, BABYLON.PhysicsImpostor.NoImpostor, { mass: 1, restitution: 0.2, friction: 0.5 }, scene); // Ajouter l'imposteur de boîte à la voiture
                car2.position.y = 100;
            });


            const camera = scene.getCameraByName("FollowCam");
            camera.lockedTarget = car;
            camera.radius = -500;
            camera.heightOffset = 200;

            let speed = 5;

            let keys = [];
            Renderer.getInstance().scene.getEngine().runRenderLoop(() => {
                // Déplacement de la voiture
                if (keys[90]) { // Z
                    car.translate(Axis.Z, speed, BABYLON.Space.LOCAL);
                }
                else if (keys[83]) { // S
                    car.translate(Axis.Z, -speed, BABYLON.Space.LOCAL);
                }

                if (keys[81]) { // Q
                    car.rotate(Axis.Y, -0.03, BABYLON.Space.LOCAL);
                }
                else if (keys[68]) { // D
                    car.rotate(Axis.Y, 0.03, BABYLON.Space.LOCAL);
                }

                if (car && car2) {

                    if (car.position.y < -300) {
                        car.position.y = 500;
                    }

                    if(car2.position.y < -300) {
                        car2.position = new Vector3(0,500,0);
                    }
                }
            });


            // Ajoute des contrôles de clavier pour la voiture
            window.addEventListener("keydown", function (event) {
                keys[event.keyCode] = true;
            });

            window.addEventListener("keyup", function (event) {
                keys[event.keyCode] = false;
            });

            setTimeout(()=>{
                scene.physicsEnabled = true;

            },2000)
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

        const os = require('os');
        const path = require('path');
        const documentsPath = os.homedir() + '\\Documents\\Lusine Game Maker\\MonProjet';
        let modelsDirectory = path.resolve(documentsPath, 'Models');

        //const model = new Model3D("https://models.babylonjs.com/", "aerobatic_plane.glb", Renderer.getInstance().scene);
        const model = new Model3D(modelsDirectory + "/", filename, options, Renderer.getInstance().scene);
        // quand je clic sur un mesh je peux le sélectionner dans l'éditeur
        // Créer un action manager pour le parentNode
        // Abonnement à l'événement onModelLoaded
        model.onLoaded.add((model3d) => {
            console.log("Le Model3D a été chargé : ", model3d);

            const children = model.getChildren()[0].getChildren();
            children.forEach((child) => {

                child.actionManager = new BABYLON.ActionManager(Renderer.getInstance().scene);
                // Ajouter une action de clic pour le mesh et ses enfants
                child.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLeftPickTrigger, (evt) => {
                    // Votre code ici
                    console.log("Le mesh et ses enfants ont été cliqués");
                    this.selectGameObject(model.id);
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

    selectGameObject = (id: Number | string) => {
        this._selectedGameObject = GameObject.gameObjects.get(id);
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


    private playGame = () => {

        Game.getInstance().start();
        // Renderer.getInstance()?.getEngine()?.runRenderLoop += ()=>{

        // }
    }

    private stopGame = () => {
        Game.getInstance().stop();
    }


    render() {
        return (
            <>
                <NavBarEditor />
                {/* <Navigation/> */}
                <AddObjectModal show={false} />
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
                        <StateEditor resizeWorkspace={this.state.activeTab == 3} />
                    </Tab>
                </Tabs>

            </>
        );
    }

}