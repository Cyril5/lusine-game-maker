import React, { useRef, useEffect, useState } from 'react';

import Blockly from 'blockly';
import toolboxXml from '../assets/blocks/toolbox.xml?raw'; // ?raw to import as string
import LusineBlocksDarkTheme from '../engine/blocks/themes/lusine-gm-dark'
import '../engine/blocks/blocksDefs';
import '@blockly/block-plus-minus';
import * as Fr from 'blockly/msg/fr';
import { Breadcrumb, Button, ButtonGroup, Card, Container, Dropdown } from 'react-bootstrap';
import '../assets/css/fsm-graph.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const StatesMachineEditor = () => {

    return (
        <>
            <Breadcrumb>
                <Breadcrumb.Item href="#">Objet</Breadcrumb.Item>
                <Breadcrumb.Item href="#">Nom Automate Fini</Breadcrumb.Item>
            </Breadcrumb>


            <Container>

            <div className='statesGraphContainer'>
                <svg className='arrow' width="100%" height="100%"><line x1="160" y1="25" x2="490" y2="100" stroke="white" /></svg>
                
                <div className="node startNode">Départ</div>

                <Card className="node  mainState" style={{ width: '18rem'}}>
                    <Card.Header>
                    Etat Principal
                    <ButtonGroup aria-label="Basic example">
                            <Button variant="success"><FontAwesomeIcon icon="person-running"></FontAwesomeIcon></Button>
                            <Button variant="danger">X</Button>
                        </ButtonGroup>
                    </Card.Header>
                    <Card.Img variant="top" src="holder.js/100px180" />
                    <Card.Body>
                        Fichier d'Etat :
                        <div>   
                        <Dropdown>
                            <Dropdown.Toggle variant="warning" id="dropdown-basic">
                                Dropdown Button
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Item href="#/action-1">StateA.json</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                        <Button><FontAwesomeIcon icon="edit"></FontAwesomeIcon></Button>
                        </div>

                    </Card.Body>
                </Card>



            </div>
            <FontAwesomeIcon icon="person-running"></FontAwesomeIcon> : Défini l'état comme Etat de départ de l'Automate Fini
            </Container>


        </>
    );
}
export default StatesMachineEditor