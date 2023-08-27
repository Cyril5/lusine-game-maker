import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useState } from "react";
import { Accordion, Button, Form, Offcanvas } from "react-bootstrap";
import FSMComponent from "./FSMComponent";
import Editor from "./Editor";

const PropertiesBar = ({ id, gameobject_name = '', gameobject_type='', parentId, ...props }) => {


    // useEffect(() => {
    //     // Update the 3D object represented by Babylon.TransformNode based on the props
    //     const { x, y, z } = position;
    //     const { x: rx, y: ry, z: rz } = rotation;
    //     const { x: sx, y: sy, z: sz } = scaling;
    //   }, [position, rotation, scaling]);

    const [show, setShow] = useState(false);
    const [name,setName] = useState(gameobject_name);

    const handleClose = () => setShow(false);
    const toggleShow = () => setShow((s) => !s);

    // Si c'est un autre gameObject on met à jour la vue
    useEffect(() => {
        setName(gameobject_name); 
      }, [id]);

    
    const handleSetGameObjectName = ((e: any)=>{
        const newGameObjectName = e.target.value;
        Editor.getInstance().selectedGameObject.name = newGameObjectName;
        setName(newGameObjectName);
    });

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
                    <Accordion defaultActiveKey={['0']} alwaysOpen>
                        <Accordion.Item eventKey="0">
                            <Accordion.Header>Objet</Accordion.Header>
                            <Accordion.Body>
                                <Form.Group className="mb-3">
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control onChange={handleSetGameObjectName} value={name}/>
                                </Form.Group>
                                <p>ID : {id}</p>
                                <p>Parent : <Button variant="primary" size="sm">{parentId}</Button></p>
                            </Accordion.Body>
                        </Accordion.Item>
                        <Accordion.Item eventKey="1">
                            <Accordion.Header>Transform</Accordion.Header>
                            <Accordion.Body>
                                Transform Informations
                            </Accordion.Body>
                        </Accordion.Item>

                        {gameobject_type === "PROG_GO" && (
                            <Accordion.Item eventKey="2">
                                <Accordion.Header>Automates Fini</Accordion.Header>
                                <Accordion.Body>
                                    <FSMComponent />
                                </Accordion.Body>
                            </Accordion.Item>
                        )}
                    </Accordion>
                </Offcanvas.Body>
            </Offcanvas>

        </div>
    );
};

export default PropertiesBar;