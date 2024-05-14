import RendererComponent from "../components/RendererComponent";

import { Button, ButtonGroup, ButtonToolbar, Col, Container, Row } from 'react-bootstrap';
import PropertiesBar from '../components/PropertiesBar';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import GameObjectsTreeModal from '@renderer/components/Modals/GameObjectsTreeModal';
import ConsoleModal from "@renderer/components/Modals/ConsoleModal";
import AssetsModal from "@renderer/components/Modals/AssetsModal";
import { useEffect, useRef, useState } from "react";
import LGM3DEditor from "@renderer/editor/LGM3DEditor";
import { GameObject } from "@renderer/engine/GameObject";


const LevelEditor = (props) => {

    const editor = LGM3DEditor.getInstance();

    // Cela permet de simplifier la syntaxe lorsque vous voulez accéder à une propriété d'un objet. Au lieu d'écrire props.gameObjects à plusieurs endroits, vous pouvez simplement écrire gameObjects.
    const { gameobjectslist } = props;

    const [objetJeu, setObjetJeu] = useState<GameObject | null>(null);

    const setTransformMode = (transformMode: string) => {
        editor.setTransformMode(transformMode);
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
            <Container fluid>
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
                        <GameObjectsTreeModal gameobjectslist={gameobjectslist} />
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
                    <AssetsModal />

                    {/* <Col md={2}> */}
                    {/* <h2>Objets <FontAwesomeIcon icon="cubes" /></h2> */}
                    {/* <Button onClick={() => LGM3DEditor.getInstance().handleAddObject()}>Ajouter</Button> */}
                    {/* <TreeView data={data} expandedNodes={expandedNodes} setExpandedNodes={setExpandedNodes} />
                         */}
                    {/* <GameObjectsTreeView data={data}/> */}
                    {/* </Col> */}



                </Row>
            </Container>

        </>
    );
}
export default LevelEditor