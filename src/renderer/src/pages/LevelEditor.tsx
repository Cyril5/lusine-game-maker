import RendererComponent from "../components/RendererComponent";

import { Button, ButtonGroup, ButtonToolbar, Col, Container, Row, Tab, Tabs } from 'react-bootstrap';
import PropertiesBar from '../components/PropertiesBar';

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
            <div className="levelEditor">
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
                <div className="mdiRoot">
                    <DockDesk>
                        <DockableWindowPanel className="panel" id="hierarchy" title="Hierarchy" initialPlacement={{ mode: "dock", zone: "left" }}>
                            <div className="treeViewObjects">
                                <GameObjectsTreeModal gameobjectslist={gameObjects} show={false} />
                            </div>
                        </DockableWindowPanel>

                        <DockableWindowPanel id="inspector" title="Inspector" initialPlacement={{ mode: "dock", zone: "right" }}>
                            <PropertiesBar
                                id={objetJeu?.Id}
                                gameobject_name={objetJeu?.name}
                                parentid={objetJeu?.transform.parent?.uniqueId}
                            />
                        </DockableWindowPanel>
                        <DockableWindowPanel id="renderer" title="renderer" initialPlacement={{ mode: "dock", zone: "center" }}>
                            <RendererComponent />
                        </DockableWindowPanel>
                        <DockableWindowPanel id="assets" title="Assets" initialPlacement={{ mode: "dock", zone: "bottom" }}>
                            <Tabs activeKey={1}>
                                <Tab eventKey={1} title={<span><FontAwesomeIcon icon="cube" /> Materiaux</span>}>
                                    <MaterialsList></MaterialsList>
                                </Tab>
                                <Tab eventKey={2} title={<span><FontAwesomeIcon icon="diagram-project" />
                                    Modèles</span>}>
                                </Tab>
                                <Tab eventKey={3} title={<span><FontAwesomeIcon icon="image" />
                                    Textures</span>}>
                                </Tab>
                            </Tabs>
                        </DockableWindowPanel>
                    </DockDesk>
                </div>
            </div>

            {/* <Container fluid>
                <Row>
                    <Col>
                    </Col>
                    <Col>
                        <ButtonToolbar aria-label="Toolbar with button groups">
                            <ButtonGroup className="me-2" aria-label="First group">
                                <Button onClick={() => editor.setTransformMode("TRANSLATE")} variant="secondary"><FontAwesomeIcon icon="arrows-up-down-left-right" /></Button>
                                <Button onClick={() => setTransformMode("ROTATE")} variant="secondary"><FontAwesomeIcon icon="arrows-rotate" /></Button>
                                <Button onClick={() => editor.setTransformMode("SCALE")} variant="secondary"><FontAwesomeIcon icon="maximize" /></Button>
                                <Button onClick={() => editor.setTransformMode("BOUND_BOX")} variant="secondary" disabled={true}><FontAwesomeIcon icon="up-right-from-square" /></Button>
                            </ButtonGroup>
                            <ButtonGroup className="me-2" aria-label="Second group">
                                <Button disabled variant="secondary"><FontAwesomeIcon icon="earth-europe" /> Monde</Button>
                                <Button variant="secondary"><FontAwesomeIcon icon="location-crosshairs" /> Local</Button>
                                <Button variant="danger" onClick={() => editor.deleteSelection()}><FontAwesomeIcon icon="trash" /></Button>
                            </ButtonGroup>
                        </ButtonToolbar>
                    </Col>
                    <Col>
                    </Col>
                </Row>

                <Row>
                    <Col md={2}>
                        <GameObjectsTreeModal gameobjectslist={gameobjectslist} show={showgameobjectstreemodal} />
                    </Col>

                    <Col>
                        <RendererComponent />
                    </Col>


                    <div className="level-editor-panels">
                    </div>
                </Row>


                <Row>

                    <PropertiesBar
                        id={objetJeu?.Id}
                        gameobject_name={objetJeu?.name}
                        parentid={objetJeu?.transform.parent?.uniqueId}
                    />

                    <ConsoleModal />
                </Row>
            </Container> */}
        </>
    );
}
export default LevelEditor