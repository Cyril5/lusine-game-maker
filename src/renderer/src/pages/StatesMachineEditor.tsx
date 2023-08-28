import React, { useRef, useEffect, useState } from 'react';

import { Alert, Breadcrumb, Button, ButtonGroup, Card, Container, Dropdown } from 'react-bootstrap';
import '../assets/css/fsm-graph.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Editor from '@renderer/components/Editor';
import StateEditorUtils from '@renderer/editor/StateEditorUtils';
import { IStateFile } from '@renderer/engine/FSM/IStateFile';

const StatesMachineEditor = ({fsm=null,stateFiles=StateEditorUtils.statesFiles(),...props}) => {

    const [objectName, setObjectName] = useState('');
    const [fsmName,setFSMName] = useState('');
    const [firstStateFileName,setFirstStateFileName] = useState('Aucun');

    // Si c'est un autre gameObject on met à jour la vue
    useEffect(() => {

        if(fsm) {
            setObjectName(Editor.getInstance().selectedGameObject?.name);
            setFSMName(fsm.name); 
        }
    }, [fsm]);

    const handleStateFile = (stateFile : IStateFile)=>{
        console.log("change");
        fsm.states[0].stateFile = stateFile;
        setFirstStateFileName(stateFile.name);
        console.log(fsm.states[0].stateFile);
    }

    return (
        <>
                {!fsm ? (
                    <div className="no-fsm-msg">
                        <h2>Sélectionnez d'abord un Automate Fini</h2>
                        <p>Sélectionnez un objet Programmable qui contient un Automate Fini.</p>
                    </div>
                    ): (
                        <>
                <Alert key='danger' variant="danger">
                    <p>La gestion de plusieurs états dans l'automate fini n'est pas disponible dans cette version !
                    </p>
                </Alert>


                <Breadcrumb>
                    <Breadcrumb.Item href="#">{objectName}</Breadcrumb.Item>
                    <Breadcrumb.Item href="#">{fsm.name}</Breadcrumb.Item>
                </Breadcrumb>

                <Container>

                        <div className='statesGraphContainer'>
                            <svg className='arrow' width="100%" height="100%"><line x1="170" y1="25" x2="490" y2="100" stroke="white" /></svg>

                            <div className="node startNode">Départ</div>

                            <Card className="node  mainState" style={{ width: '18rem' }}>
                                <Card.Header>
                                    Etat Principal
                                    <ButtonGroup aria-label="Basic example">
                                        <Button variant="success"><FontAwesomeIcon icon="person-running"></FontAwesomeIcon></Button>
                                        <Button variant="danger">X</Button>
                                    </ButtonGroup>
                                </Card.Header>
                                <Card.Body>
                                    Fichier d'Etat :
                                    <div>
                                        <Dropdown>
                                            <Dropdown.Toggle variant="warning" id="dropdown-basic">
                                                {firstStateFileName}
                                            </Dropdown.Toggle>

                                            <Dropdown.Menu>
                                                
                                            {Array.from(stateFiles).map(([key, value]) => (
                                                <Dropdown.Item key={key} href={`#/${value}`} onClick={()=>handleStateFile(value)}>
                                                    {value.name}
                                                </Dropdown.Item>
                                            ))}
                                            </Dropdown.Menu>
                                        </Dropdown>
                                        <Button><FontAwesomeIcon icon="edit"></FontAwesomeIcon></Button>
                                    </div>

                                </Card.Body>
                            </Card>



                        </div>
                        <p>
                            <FontAwesomeIcon icon="person-running"></FontAwesomeIcon> : Défini l'état comme Etat de départ de l'Automate Fini.
                            <br />
                            <FontAwesomeIcon icon="edit"></FontAwesomeIcon> : Editer le fichier d'Etat sélectionné.
                        </p>

                    </Container>
                    </>
            )}



        </>
    );
}
export default StatesMachineEditor