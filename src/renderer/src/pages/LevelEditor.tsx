import React, { useRef, useEffect, useState, useMemo } from 'react';
import Editor from "../components/Editor";
import RendererComponent from "../components/RendererComponent";

import { Button, ButtonGroup, ButtonToolbar, Col, Container, Row, Tab, Tabs } from 'react-bootstrap';
import TreeView from '../components/GameObjectsTreeView';
import NavBarEditor from '../components/NavBarEditor';
import { GameObject } from '../engine/GameObject';
import PropertiesBar from '../components/PropertiesBar';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import GameObjectsTreeView from '../components/GameObjectsTreeView';
import GameObjectsTreeBar from '@renderer/components/GameObjectsTreeBar';


const LevelEditor = (props) => {

    // Cela permet de simplifier la syntaxe lorsque vous voulez accéder à une propriété d'un objet. Au lieu d'écrire props.objJeu à plusieurs endroits, vous pouvez simplement écrire objJeu.
    const { objJeu } = props;
    const {gameObjects} = props;


    const setTransformMode = (transformMode: string) => {
        Editor.getInstance().setTransformMode(transformMode);
    }

    return (
        <>
            <Container fluid>
                <Row>
                    <Col>
                    </Col>
                    <Col>
                        <ButtonToolbar aria-label="Toolbar with button groups">
                            <ButtonGroup className="me-2" aria-label="First group">
                                <Button onClick={() => Editor.getInstance().setTransformMode("TRANSLATE")} variant="secondary"><FontAwesomeIcon icon="arrows-up-down-left-right" /></Button>
                                <Button onClick={() => setTransformMode("ROTATE")} variant="secondary"><FontAwesomeIcon icon="arrows-rotate" /></Button>
                                <Button onClick={() => Editor.getInstance().setTransformMode("SCALE")} variant="secondary"><FontAwesomeIcon icon="maximize" /></Button>
                                <Button onClick={() => Editor.getInstance().setTransformMode("BOUND_BOX")} variant="secondary"><FontAwesomeIcon icon="up-right-from-square" /></Button>
                            </ButtonGroup>
                            <ButtonGroup className="me-2" aria-label="Second group">
                                <Button disabled variant="secondary"><FontAwesomeIcon icon="earth-europe" /> Monde</Button>
                                <Button variant="secondary"><FontAwesomeIcon icon="location-crosshairs" /> Local</Button>
                            </ButtonGroup>
                        </ButtonToolbar>
                    </Col>
                    <Col>
                    </Col>
                </Row>

                <Row>
                    <Col md={2}>
                        {/* {gameObjects} */}
                        <GameObjectsTreeBar gameObjects={gameObjects}/>
                    </Col>
                    <Col>
                        <RendererComponent />
                    </Col>
                    {/* <div className='test'>
                    </div> */}

                        <PropertiesBar
                            id={objJeu?.id}
                            gameObjectType={objJeu?.type}
                            gameObjectName={objJeu?.name}
                            parentId={objJeu?.parent?.id}
                        />
                    {/* <Col md={2}> */}
                    {/* <h2>Objets <FontAwesomeIcon icon="cubes" /></h2> */}
                    {/* <Button onClick={() => Editor.getInstance().handleAddObject()}>Ajouter</Button> */}
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