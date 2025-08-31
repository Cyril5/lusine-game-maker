import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useRef, useState } from "react";
import { Accordion, Button, Dropdown, Form, Offcanvas } from "react-bootstrap";
import FSMComponent from "./FSMComponent";
import Editor from "./EditorOld";
import '@renderer/assets/css/properties-bar.scss';
import TransformComponent from "./Objects/TransformComponent";
import { GameObject } from "@renderer/engine/GameObject";
import ColliderComponent from "./Objects/ColliderComponent";
import PhysicComponent from "./Objects/PhysicComponent";
import BoxCollider from "@renderer/engine/physics/lgm3D.BoxCollider";
import Rigidbody from "@renderer/engine/physics/lgm3D.Rigidbody";
import { ProgrammableGameObject } from "@renderer/engine/ProgrammableGameObject";
import LGM3DEditor from "@renderer/editor/LGM3DEditor";

const PropertiesBar = ({ id, gameobject_name = '', parentid, ...props }) => {

    const gameObjectRef = useRef<GameObject>(null);

    // useEffect(() => {
    //     // Update the 3D object represented by Babylon.TransformNode based on the props
    //     const { x, y, z } = position;
    //     const { x: rx, y: ry, z: rz } = rotation;
    //     const { x: sx, y: sy, z: sz } = scaling;
    //   }, [position, rotation, scaling]);

    const [show, setShow] = useState(false);
    const [name, setName] = useState(gameobject_name);


    const handleClose = () => setShow(false);
    const toggleShow = () => setShow((s) => !s);

    // Si c'est un autre gameObject on met à jour la vue
    useEffect(() => {
        gameObjectRef.current = LGM3DEditor.getInstance().selectedGameObject;
        console.log(gameObjectRef.current);
        if (gameObjectRef.current) {
            setName(gameObjectRef.current.name);
            console.log(gameObjectRef.current.getComponent<BoxCollider>("BoxCollider"));
        } else {
            handleClose();
        }
    }, [id]);


    const handleSetGameObjectName = ((e: any) => {
        const newGameObjectName = e.target.value;
        LGM3DEditor.getInstance().selectedGameObject!.name = newGameObjectName;
        setName(newGameObjectName);
        LGM3DEditor.getInstance().updateObjectsTreeView();
    });

    // Déparenter l'objet sélectionné
    const handleUnparent = () => {
        LGM3DEditor.getInstance().selectedGameObject!.setParent(null);
        LGM3DEditor.getInstance().updateObjectsTreeView();
    }

    const handleSelectParent = () => {
        LGM3DEditor.getInstance().selectGameObject(gameObjectRef.current!.transform.parent.uniqueId);
    }

    const handleAddRigidbody = () => {
        LGM3DEditor.getInstance().selectedGameObject!.addRigidbody({ mass: 1, restitution: 0.2, friction: 0.5 });
    }

    const style = {
        top: '116px',
        height: '87vh'
    };

    const fsms = (gameObjectRef.current as ProgrammableGameObject)?.finiteStateMachines;
    return (

        <div>
            {/* <Button variant="secondary" onClick={toggleShow} className="me-2 properties-btn">
                <FontAwesomeIcon icon="wrench" />
            </Button> */}
            {/* <Offcanvas className="properties-bar" style={style} placement="end" scroll backdrop={false} show={show} onHide={handleClose} {...props}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Propriétées <FontAwesomeIcon icon="wrench" /></Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body> */}
                    {gameObjectRef.current && (

                        
                        <Accordion defaultActiveKey={['0', '1']} alwaysOpen>

                            <Accordion.Item eventKey="0">
                                <Accordion.Header>Objet</Accordion.Header>
                                <Accordion.Body>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Name</Form.Label>
                                        <Form.Control onChange={handleSetGameObjectName} value={name} />
                                    </Form.Group>
                                    <p>ID : {id}</p>
                                    {gameObjectRef.current.transform.parent && (
                                        <p>Parent : <Button variant="primary" size="sm" onClick={handleSelectParent}>{gameObjectRef.current.transform.parent.uniqueId}</Button> <Button onClick={handleUnparent} variant="danger" size="sm" disabled={!gameObjectRef.current.transform.parent.uniqueId}>Déparenter</Button></p>
                                    )}

                                    Qualifieur <Form.Select aria-label="Default select example">
                                        <option value="1">Aucun</option>
                                        <option value="2">Joueur</option>
                                        <option value="3">Bon</option>
                                    </Form.Select>

                                </Accordion.Body>
                            </Accordion.Item>
                            <Accordion.Item eventKey="1">
                                <Accordion.Header>Transformations</Accordion.Header>
                                <Accordion.Body>
                                    <TransformComponent gameObjectId={id} />
                                </Accordion.Body>
                            </Accordion.Item>
                            {/* {Array.from(gameObjectRef.current.getAllComponents()).map((component, index) => {
                                const InspectorComponent = (component as any).inspectorComponent;
                                //TODO : voir si c'est plus performant d'utiliser l'id du component du gameObject au lieu de le passer dans la prop 
                                if (InspectorComponent) {
                                    return<>
                                    <Accordion.Item eventKey={component.name} key={index}>
                                        <InspectorComponent componentInstance={component}/> 
                                    </Accordion.Item>
                                    </>
                                }
                            })} */}

                            {fsms && fsms.length > 0 && (
                            <Accordion.Item eventKey="2">
                                <Accordion.Header>Automates Finis</Accordion.Header>
                                <Accordion.Body>
                                    <FSMComponent/>
                                </Accordion.Body>
                            </Accordion.Item>
                            )}


                            {gameObjectRef.current.getComponent<BoxCollider>("BoxCollider") && (
                                <Accordion.Item eventKey="3">
                                    <Accordion.Header>Collision</Accordion.Header>
                                    <Accordion.Body>
                                        <ColliderComponent gameObjectId={id} />
                                    </Accordion.Body>
                                </Accordion.Item>
                            )}

                            {gameObjectRef.current.getComponent<Rigidbody>("Rigidbody") && (
                            <Accordion.Item eventKey="4">
                                <Accordion.Header>Physique</Accordion.Header>
                                <Accordion.Body>
                                    <PhysicComponent gameObjectId={id} />
                                </Accordion.Body>
                            </Accordion.Item>
                            )}

                        </Accordion>
                    )}
                    <Button>Ajouter composant</Button>
                {/* </Offcanvas.Body>
            </Offcanvas> */}

        </div>
    );
};

export default PropertiesBar;