import { Component, useEffect, useRef } from "react";
import { Game } from "../engine/Game";
import AddObjectModal from "./AddObjectModal";
import CommandModal from "./CommandModal";
import NavBarEditor from "./NavBarEditor";

import { Col, Container, Row, Tab, Tabs } from "react-bootstrap";
import LevelEditor from "../pages/LevelEditor";
import StateEditor from "../pages/StateEditor";
import { GameObject } from "../engine/GameObject";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import StatesMachineEditor from "../pages/StatesMachineEditor";
import { Renderer } from "../engine/Renderer";
import { ProgrammableGameObject } from "@renderer/engine/ProgrammableGameObject";
import { Model3D } from "@renderer/engine/Model3D";

export default class Editor extends Component {

    addProgrammableObject() {
        new ProgrammableGameObject("ObjetProgrammable",Renderer.getInstance().scene);
    }

    addModel3DObject() {
        const model = new Model3D("https://models.babylonjs.com/","aerobatic_plane.glb",Renderer.getInstance().scene);
        model.name = "AVION";
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
        
        switch(transformMode) {
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

    private _selectedGameObject : GameObject;
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

    private static _instance : Editor;
    static getInstance(): Editor {
        return Editor._instance;
    }

    state = {
        game: null,
        showAddObjectModal: false,
        objetJeu: null,
    };

    constructor(props: {} | Readonly<{}>) {
        super(props);
        Editor._instance = this;


        this.state.objetJeu = props.objetJeu;
    }

    updateObjetJeu = (objetJeu : GameObject) => {
        this.setState({ objetJeu });
        Renderer.getInstance().gizmoManager.positionGizmoEnabled = true;
        Renderer.getInstance().gizmoManager.attachToNode(objetJeu.transform);
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
                <AddObjectModal kebab={this.state.showAddObjectModal} />
                <CommandModal />

                <Tabs defaultActiveKey="level">
                    <Tab eventKey="level" title={<span><FontAwesomeIcon icon="ghost" /> Editeur de niveau</span>}>
                        <LevelEditor objJeu={this.state.objetJeu}/>
                    </Tab>
                    <Tab eventKey="statesMachineEditor" 
                    title={<span><FontAwesomeIcon icon="diagram-project" /> Automates Fini</span>}>
                        <StatesMachineEditor/>
                    </Tab>
                    <Tab eventKey="stateEditor" title="Editeur d'état">
                        <StateEditor />
                    </Tab>
                </Tabs>

            </>
        );
    }

}