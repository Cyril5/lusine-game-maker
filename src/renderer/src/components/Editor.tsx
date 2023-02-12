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
import Models3DModal from "./Models3DModal";
import { SceneLoader } from "@babylonjs/core";

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

    handleTabChange = (tabKey) => {
        this.setState({ activeTab: tabKey });
    };
    

    
    addProgrammableObject() {
        new ProgrammableGameObject("ObjetProgrammable", Renderer.getInstance().scene);
    }
    
    async addModel3DObject(filename : string,options=null) {

        console.log(filename);

        const os = require('os');
        const path = require('path');
        const documentsPath = os.homedir() + '\\Documents\\Lusine Game Maker\\MonProjet';
        let modelsDirectory = path.resolve(documentsPath, 'Models');

        //const model = new Model3D("https://models.babylonjs.com/", "aerobatic_plane.glb", Renderer.getInstance().scene);
        const model = new Model3D(modelsDirectory+"/", filename,options, Renderer.getInstance().scene);
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