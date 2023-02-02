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

export default class Editor extends Component {

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
        alert("Add an object !");
        this.setState({ showModal: true });
    }

    static _instance : Editor;
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
        this.state.objetJeu = props.objetJeu
    }

    updateObjetJeu = (objetJeu) => {
        this.setState({ objetJeu });
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
                    title={<span><FontAwesomeIcon icon="diagram-project" /> Machine d'états</span>}>
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