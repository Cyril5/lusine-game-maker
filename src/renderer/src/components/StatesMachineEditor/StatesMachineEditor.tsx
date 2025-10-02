import { useRef, useEffect, useState, useMemo } from 'react';

import { Accordion, Alert, Breadcrumb, Button, Col, Container, Dropdown, Form, Offcanvas, Row } from 'react-bootstrap';
import '../../assets/css/fsm-graph.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import StateEditorUtils from '@renderer/editor/StateEditorUtils';
import { StateFile } from '@renderer/engine/FSM/IStateFile';

import FSMGraph from '@renderer/components/StatesMachineEditor/FSMGraph';
import { State } from '@renderer/engine/FSM/lgm3D.State';
import LGM3DEditor from '@renderer/editor/LGM3DEditor';
import { EdgeVM, NodeVM } from './FSMGraphEditorTypes';
import { FiniteStateMachine } from '@renderer/engine/FSM/lgm3D.FiniteStateMachine';
import EditorUtils from '@renderer/editor/EditorUtils';
import FSMVariablesPanel from './VariablesPanel';

type StateMachineEditorPropsTypes = {
    fsm?: FiniteStateMachine, //Todo remplacer par un id
};

const StatesMachineEditor = ({ fsm }: StateMachineEditorPropsTypes) => {

    const [graph, setGraph] = useState(() => buildGraphFromFsm(fsm)); // {nodes, edges}
    const [objectName, setObjectName] = useState('');
    const [fsmName, setFSMName] = useState('');
    const [firstStateFileName, setFirstStateFileName] = useState('Aucun');

    const fsmGraphRef = useRef();
    const [stateName, setStateName] = useState("");

    const [states, setStates] = useState<NodeVM[]>([]);
    //const [transitions, setTransitions] = useState<EdgeVM[]>(fsm.transitions ?? []);
    const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
    const selectedState = useMemo(
        () => states.find(s => s.id === selectedStateId) ?? null,
        [states, selectedStateId]
    );

    useEffect(() => {
        if (fsm) {
            setObjectName(LGM3DEditor.getInstance().selectedGameObject?.name);
            setFSMName(fsm.name);
            setStates(fsm.states);
            setGraph(buildGraphFromFsm(fsm)); //maj du graph
        }
    }, [fsm]);

    useEffect(() => {
        if (selectedState?.stateFile) {
            setFirstStateFileName(selectedState.stateFile.clsName);
        } else {
            setFirstStateFileName('Aucun');
        }
    }, [selectedState]);

    //const handleStateFile = (stateFile: StateFile | null) => {
    // selectedState.stateFile = stateFile;
    // console.log(selectedState.stateFile);
    //}

    const setSelectedState = (state) => {
        if (state) setSelectedStateId(state.id); else setSelectedStateId(null);
    }

    const [stateFileClsName, setStateFileClsName] = useState<string | null>(null);
    const handleStateFileSelect = (eventKey: string | null) => {
        if (!selectedState) return;
        if (eventKey === "__none__") {
            setStates(prev => prev.map(s => s.id === selectedState.id ? { ...s, stateFile: undefined } : s));
            return;
        }
        const sf = StateFile.getStateFiles().get(eventKey!);
        if (!sf) return;
        setStates(prev => prev.map(s => s.id === selectedState.id ? { ...s, stateFile: sf } : s));
    };

    // Lorsqu'on sélectionne un état
    const handleStateSelect = (state: State) => {
        setSelectedState(state);
        setStateName(state.name);
        setFirstStateFileName(state.stateFile.name);
    }

    const handleRenameState = (e) => {
        const inputText = e.target.value;
        selectedState.name = inputText;
        setStateName(inputText);
        fsmGraphRef.current.updateSelectedNode(inputText);
    }

    function buildGraphFromFsm(fsm?: FiniteStateMachine) {
        return { states: fsm?.states ?? [] };   // ✅ plus de "nodes", on renvoie "states"
    }

    const handleAddState = (e) => {
        EditorUtils.openInputDialog({
            title: "Créer un nouvel état",
            message: "Choisissez le nom de l'état à insérer dans l'automate fini",
            label: 'Nom:',
            value: 'Nouvel Etat',
            inputAttrs: { type: 'text', required: true },
            type: 'input',
            buttonsLabel: { ok: 'Ajouter', cancel: 'Annuler' }
        }, (response) => {
            if (response) {
                const s = fsm!.addState(response);
                setSelectedState(s);
                setGraph(buildGraphFromFsm(fsm)); // ← force la maj du FSMGraph
            }
        }, (error) => {
            console.error(error);
        });
    }

    return (
        <>

            {!fsm ? (
                <div className="no-fsm-msg">
                    <h2>Sélectionnez d'abord un Automate Fini</h2>
                    <p>Sélectionnez un objet Programmable qui contient un Automate Fini.</p>
                </div>
            ) : (
                <>
                    <Breadcrumb>
                        <Breadcrumb.Item href="#">{objectName}</Breadcrumb.Item>
                        <Breadcrumb.Item href="#">{fsm.name}</Breadcrumb.Item>
                    </Breadcrumb>

                    <Container>
                        <Row>
                            <Col>
                                <FSMGraph
                                    data={graph}
                                    //transitions={transitions}
                                    onChangeStates={setStates}
                                    //onChangeTransitions={setTransitions}
                                    onSelectedState={setSelectedState} // 👈 callback
                                    onAddStateBtnClick={handleAddState}
                                />

                                <Offcanvas show={selectedState} backdrop={false} placement="end">
                                    <Offcanvas.Header closeButton>
                                        <Offcanvas.Title>État sélectionné</Offcanvas.Title>
                                    </Offcanvas.Header>
                                    <Offcanvas.Body>
                                        {selectedState && (
                                            <>
                                                <p><b>ID:</b> {selectedState.id}</p>
                                                <p><b>Nom:</b> {selectedState.name}</p>
                                                <p><b>State File:</b> {selectedState.stateFile ? selectedState.stateFile.clsName : 'Aucun'}</p>
                                                <Dropdown onSelect={handleStateFileSelect}>
                                                    <Dropdown.Toggle variant="warning" id="dropdown-statefile">
                                                        {selectedState.stateFile ? selectedState.stateFile.clsName : 'Aucun'}
                                                    </Dropdown.Toggle>
                                                    <Dropdown.Menu>
                                                        <Dropdown.Item
                                                            eventKey="__none__"
                                                            active={!selectedState?.stateFile}
                                                        >
                                                            Aucun
                                                        </Dropdown.Item>
                                                        {Array.from(StateFile.getStateFiles()).map(([key, sf]) => (
                                                            <Dropdown.Item
                                                                key={key}
                                                                eventKey={key}                                     // <- renvoyé dans handleStateFileSelect
                                                                active={selectedState.stateFile?.clsName === sf.clsName}
                                                            >
                                                                {sf.clsName}
                                                            </Dropdown.Item>
                                                        ))}
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            </>
                                        )}
                                    </Offcanvas.Body>
                                </Offcanvas>

                                <FontAwesomeIcon icon="person-running"></FontAwesomeIcon> : Défini l'état comme Etat de départ de l'Automate Fini.
                                <br />
                                <FontAwesomeIcon icon="edit"></FontAwesomeIcon> : Editer le fichier d'Etat sélectionné.
                            </Col>
                            <Col md={3}>

                                <Accordion defaultActiveKey={['0']} alwaysOpen>
                                    <Accordion.Item eventKey="0">
                                        <Accordion.Header>Variables</Accordion.Header>
                                        <Accordion.Body>
                                            <FSMVariablesPanel fsm={fsm} />
                                        </Accordion.Body>
                                    </Accordion.Item>
                                </Accordion>

                                {/* <div className='fsm-properties-bar'>
                                    <h3>{fsm.name}</h3>
                                    <p>Nom AF : <Form.Control type="text" defaultValue={fsm.name} /></p>

                                    <p>Démarrer au début du jeu : Oui</p>




                                    {selectedState && (
                                        <>
                                            <h3>
                                                <FontAwesomeIcon icon={'flag'}></FontAwesomeIcon>
                                                <Form.Control type="text" onChange={handleRenameState} value={stateName} />
                                            </h3>
                                            <div className="state-file-field">
                                                Fichier d'état :
                                                <Dropdown>
                                                    <Dropdown.Toggle variant="warning" id="dropdown-basic">
                                                        {!firstStateFileName ? 'Aucun' : firstStateFileName}
                                                    </Dropdown.Toggle>

                                                    <Dropdown.Menu>
                                                        {Array.from(stateFiles).map(([key, value]) => (
                                                            <Dropdown.Item key={key} href={`#/${value}`} onClick={() => handleStateFile(value)}>
                                                                {value.clsName}
                                                            </Dropdown.Item>
                                                        ))}
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                                <Button variant="primary"><FontAwesomeIcon icon="edit"></FontAwesomeIcon></Button>

                                            </div>
                                            <Button variant="success"><FontAwesomeIcon icon="person-running"></FontAwesomeIcon></Button>
                                        </>
                                    )}
                                </div> */}
                            </Col>
                        </Row>
                    </Container>
                </>
            )}



        </>
    );
}
export default StatesMachineEditor