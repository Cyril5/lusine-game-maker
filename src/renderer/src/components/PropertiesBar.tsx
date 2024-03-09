import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useRef, useState } from "react";
import { Accordion, Button, Dropdown, Form, Offcanvas } from "react-bootstrap";
import FSMComponent from "./FSMComponent";
import Editor from "./Editor";
import '@renderer/assets/css/properties-bar.scss';
import TransformComponent from "./TransformComponent";
import { GameObject } from "@renderer/engine/GameObject";
import ColliderComponent from "./Objects/ColliderComponent";
import PhysicComponent from "./Objects/PhysicComponent";
import BoxCollider from "@renderer/engine/physics/lgm3D.BoxCollider";
import Rigidbody from "@renderer/engine/physics/lgm3D.Rigidbody";
import { ProgrammableGameObject } from "@renderer/engine/ProgrammableGameObject";

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
        gameObjectRef.current = Editor.getInstance().selectedGameObject;
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
        Editor.getInstance().selectedGameObject!.name = newGameObjectName;
        setName(newGameObjectName);
        Editor.getInstance().updateObjectsTreeView();
    });

    // Déparenter l'objet sélectionné
    const handleUnparent = () => {
        Editor.getInstance().selectedGameObject!.setParent(null);
        Editor.getInstance().updateObjectsTreeView();
    }

    const handleSelectParent = () => {
        Editor.getInstance().selectGameObject(gameObjectRef.current.parent.uniqueId);
    }

    const handleAddRigidbody = () => {
        Editor.getInstance().selectedGameObject!.addRigidbody({ mass: 1, restitution: 0.2, friction: 0.5 });
    }

    const style = {
        top: '116px',
        height: '87vh'
    };

    const fsms = (gameObjectRef.current as ProgrammableGameObject)?.finiteStateMachines;
    return (

        <div>
            <Button variant="secondary" onClick={toggleShow} className="me-2 properties-btn">
                <FontAwesomeIcon icon="wrench" />
            </Button>
            <Offcanvas className="properties-bar" style={style} placement="end" scroll backdrop={false} show={show} onHide={handleClose} {...props}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Propriétées <FontAwesomeIcon icon="wrench" /></Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
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
                                    {gameObjectRef.current.parent && (
                                        <p>Parent : <Button variant="primary" size="sm" onClick={handleSelectParent}>{gameObjectRef.current.parent.Id}</Button> <Button onClick={handleUnparent} variant="danger" size="sm" disabled={!gameObjectRef.current.parent.uniqueId}>Déparenter</Button></p>
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
                </Offcanvas.Body>
            </Offcanvas>

        </div>
    );
};

export default PropertiesBar;