import RendererComponent from "./RendererComponent";

import { Button, ButtonGroup, ButtonToolbar, Col, Container, Row, Tab, Tabs } from 'react-bootstrap';
import PropertiesBar from './PropertiesBar';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import GameObjectsTreeModal from '@renderer/components/Modals/GameObjectsTreeModal';
import ConsoleModal from "@renderer/components/Modals/ConsoleModal";
import AssetsModal from "@renderer/components/Modals/AssetsModal";
import { useEffect, useRef, useState } from "react";
import LGM3DEditor from "@renderer/editor/LGM3DEditor";
import { GameObject } from "@renderer/engine/GameObject";
import { DockDesk } from "@renderer/components/DockDesk";
import { DockableWindowPanel } from "@renderer/components/DockableWindowPanel";
import { DemoTreeView } from "@renderer/components/TreeViewObjects";
import MaterialsList from "@renderer/components/MaterialsList";


const LevelEditor = (props) => {

    const editor = LGM3DEditor.getInstance();

    const [objetJeu, setObjetJeu] = useState<GameObject | null>(null);
    const [gameObjects, setGameObjects] = useState(null);
    const [key, setKey] = useState(1);

    // Cela permet de simplifier la syntaxe lorsque vous voulez accéder à une propriété d'un objet. Au lieu d'écrire props.gameObjects à plusieurs endroits, vous pouvez simplement écrire gameObjects.
    const { gameobjectslist, showgameobjectstreemodal } = props;

    const setTransformMode = (transformMode: string) => {
        editor.setTransformGizmoMode(transformMode);
    }

    const toogleGameObjectsTreeModal = () => {

    }

    useEffect(() => {
    }, []);

    useEffect(() => {
        console.log(props.objJeu);
        if (props.objJeu) {
            setObjetJeu(props.objJeu);
        }

    }, [props.objJeu])


    return (
        <>
            <div className="level-editor">
                <Container fluid={true}>
                                <ButtonToolbar aria-label="Toolbar with button groups">
                                <ButtonGroup className="me-2" aria-label="First group">
                                    <Button onClick={() => editor.setTransformGizmoMode("TRANSLATE")} variant="secondary"><FontAwesomeIcon icon="arrows-up-down-left-right" /></Button>
                                    <Button onClick={() => setTransformMode("ROTATE")} variant="secondary"><FontAwesomeIcon icon="arrows-rotate" /></Button>
                                    <Button onClick={() => editor.setTransformGizmoMode("SCALE")} variant="secondary"><FontAwesomeIcon icon="maximize" /></Button>
                                    <Button onClick={() => editor.setTransformGizmoMode("BOUND_BOX")} variant="secondary" disabled={true}><FontAwesomeIcon icon="up-right-from-square" /></Button>
                                </ButtonGroup>
                                <ButtonGroup className="me-2" aria-label="Second group">
                                    <Button disabled variant="secondary"><FontAwesomeIcon icon="earth-europe" /> Monde</Button>
                                    <Button variant="secondary"><FontAwesomeIcon icon="location-crosshairs" /> Local</Button>
                                    <Button variant="danger" onClick={() => editor.deleteSelection()}><FontAwesomeIcon icon="trash" /></Button>
                                </ButtonGroup>
                            </ButtonToolbar>
                    <Row>
                        <Col sm={2}>
                            <GameObjectsTreeModal gameobjectslist={gameObjects} show={false} />
                        </Col>
                        <Col>
                            <div className="scene-level-editor">
                                <RendererComponent />
                                <div id="inspector-host"/>
                            </div>
                        </Col>
                        <Col sm={2}>
                            <PropertiesBar
                                id={objetJeu?.Id}
                                gameobject_name={objetJeu?.name}
                                parentid={objetJeu?.transform.parent?.uniqueId}
                            /> 
                        </Col>
                    </Row>
                </Container>

                <Tabs activeKey={key} onSelect={(k) => setKey(k)}>
                    <Tab eventKey={1} title={<span><FontAwesomeIcon icon="cube" />  Materiaux</span>}>
                        <MaterialsList></MaterialsList>
                    </Tab>
                    <Tab eventKey={2} title={<span><FontAwesomeIcon icon="terminal" />  Console</span>}>
                        <ConsoleModal></ConsoleModal>
                    </Tab>
                </Tabs>
            </div>


            {/* <div className="mdiRoot"> */}
            {/* <DockDesk> */}
            {/* <DockableWindowPanel className="panel" id="hierarchy" title="Hierarchy" initialPlacement={{ mode: "dock", zone: "left" }}>
                            <div className="treeViewObjects">
                                <GameObjectsTreeModal gameobjectslist={gameObjects} show={false} />
                            </div>
                        </DockableWindowPanel> */}

            {/* <DockableWindowPanel id="renderer" title="renderer" initialPlacement={{ mode: "dock", zone: "center" }}> */}
            {/* <RendererComponent /> */}
            {/* </DockableWindowPanel> */}

            {/* <DockableWindowPanel id="inspector" title="Inspector" initialPlacement={{ mode: "dock", zone: "right" }}>
                            <PropertiesBar
                                id={objetJeu?.Id}
                                gameobject_name={objetJeu?.name}
                                parentid={objetJeu?.transform.parent?.uniqueId}
                            />
                        </DockableWindowPanel> */}
            {/* <DockableWindowPanel id="south-panel" title="" initialPlacement={{ mode: "dock", zone: "bottom" }}>
                            <Tabs activeKey={key} onSelect={(k) => setKey(k)}>
                                <Tab eventKey={1} title={<span><FontAwesomeIcon icon="cube" />  Materiaux</span>}>
                                    <MaterialsList></MaterialsList>
                                </Tab>
                                <Tab eventKey={2} title={<span><FontAwesomeIcon icon="terminal" />  Console</span>}>
                                    <ConsoleModal></ConsoleModal>
                                </Tab>
                            </Tabs>
                        </DockableWindowPanel> */}
            {/* </DockDesk> */}
            {/* </div> */}
        </>
    );
}
export default LevelEditor