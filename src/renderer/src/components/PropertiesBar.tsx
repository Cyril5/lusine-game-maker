import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useRef, useState } from "react";
import { Accordion, Button, Dropdown, Form, Offcanvas } from "react-bootstrap";
import FSMComponent from "./FSMComponent";
import Editor from "./Editor";
import '@renderer/assets/css/properties-bar.scss';
import TransformComponent from "./TransformComponent";

const PropertiesBar = ({ id, gameobject_name = '', gameobject_type = '', parentId, ...props }) => {

    const gameObjectRef = useRef(Editor.getInstance().selectedGameObject);
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
        setName(gameobject_name);
        gameObjectRef.current = Editor.getInstance().selectedGameObject;
        if (gameObjectRef.current) {

        }
    }, [id]);


    const handleSetGameObjectName = ((e: any) => {
        const newGameObjectName = e.target.value;
        Editor.getInstance().selectedGameObject!.name = newGameObjectName;
        setName(newGameObjectName);
        Editor.getInstance().updateObjectsTreeView();
    });

    // Déparenter l'objet sélectionné
    const handleUnparent = ()=>{
        Editor.getInstance().selectedGameObject!.setParent(null);
        Editor.getInstance().updateObjectsTreeView();
    }

    const handleAddRigidbody = () => {
        Editor.getInstance().selectedGameObject!.addRigidbody({ mass: 1, restitution: 0.2, friction: 0.5 });
    }
    return (
        <div>
            <Button variant="secondary" onClick={toggleShow} className="me-2 properties-btn">
                <FontAwesomeIcon icon="wrench" />
            </Button>
            <Offcanvas className="properties-bar" placement="end" scroll backdrop={false} show={show} onHide={handleClose} {...props}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Propriétées <FontAwesomeIcon icon="wrench" /></Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <Accordion defaultActiveKey={['0','1']} alwaysOpen>
                        <Accordion.Item eventKey="0">
                            <Accordion.Header>Objet</Accordion.Header>
                            <Accordion.Body>
                                <Form.Group className="mb-3">
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control onChange={handleSetGameObjectName} value={name} />
                                </Form.Group>
                                <p>ID : {id}</p>
                                <p>Parent : <Button variant="primary" size="sm">{parentId}</Button> <Button onClick={handleUnparent} variant="danger" size="sm" disabled={!parentId}>Déparenter</Button></p>
                            </Accordion.Body>
                        </Accordion.Item>
                        <Accordion.Item eventKey="1">
                            <Accordion.Header>Transformations</Accordion.Header>
                            <Accordion.Body>
                                <TransformComponent gameObjectId={id} />
                            </Accordion.Body>
                        </Accordion.Item>

                        {gameobject_type === "PROG_GO" && (
                            <>
                                <Accordion.Item eventKey="2">
                                    <Accordion.Header>Automates Fini</Accordion.Header>
                                    <Accordion.Body>
                                        <FSMComponent />
                                    </Accordion.Body>
                                </Accordion.Item><Accordion.Item eventKey="3">
                                    <Accordion.Header>Physique
                                    </Accordion.Header>
                                    <Accordion.Body>
                                        <Dropdown>
                                            <Dropdown.Toggle variant="warning" id="dropdown-basic">
                                                Aucune
                                            </Dropdown.Toggle>

                                            <Dropdown.Menu>
                                                <Dropdown.Item>
                                                    Aucune
                                                </Dropdown.Item>
                                                <Dropdown.Item onClick={handleAddRigidbody}>
                                                    Actif
                                                </Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </Accordion.Body>
                                </Accordion.Item>
                            </>
                        )}


                    </Accordion>
                </Offcanvas.Body>
            </Offcanvas>

        </div>
    );
};

export default PropertiesBar;