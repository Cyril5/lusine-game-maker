import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Accordion, Button, Form, Offcanvas } from "react-bootstrap";
import FSMComponent from "./FSMComponent";
import Editor from "./Editor";

const PropertiesBar = (props : any) => {


    // useEffect(() => {
    //     // Update the 3D object represented by Babylon.TransformNode based on the props
    //     const { x, y, z } = position;
    //     const { x: rx, y: ry, z: rz } = rotation;
    //     const { x: sx, y: sy, z: sz } = scaling;
    //   }, [position, rotation, scaling]);

    const {id,gameObjectName, gameObjectType,parentId} = props;

    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const toggleShow = () => setShow((s) => !s);

    const handleSetGameObjectName = (e: any)=>{
        Editor.getInstance().selectedGameObject.name = e.target.value;
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
                    <Accordion defaultActiveKey={['0']} alwaysOpen>
                        <Accordion.Item eventKey="0">
                            <Accordion.Header>Objet</Accordion.Header>
                            <Accordion.Body>
                                <Form.Group className="mb-3">
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control onChange={handleSetGameObjectName}/>
                                </Form.Group>
                                <p>ID : {props.id}</p>
                                <p>Parent : <Button variant="primary" size="sm">{props.parentId}</Button></p>
                            </Accordion.Body>
                        </Accordion.Item>
                        <Accordion.Item eventKey="1">
                            <Accordion.Header>Transform</Accordion.Header>
                            <Accordion.Body>
                                Transform Informations
                            </Accordion.Body>
                        </Accordion.Item>

                        {props.gameObjectType === "PROG_GO" && (
                            <Accordion.Item eventKey="2">
                                <Accordion.Header>Automates Fini</Accordion.Header>
                                <Accordion.Body>
                                    <FSMComponent />
                                </Accordion.Body>
                            </Accordion.Item>
                        )}
                        <Accordion.Item eventKey="3">
                            <Accordion.Header>Collision</Accordion.Header>
                            <Accordion.Body>
                                <p>Collision Component CannonJS</p>
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>
                </Offcanvas.Body>
            </Offcanvas>

        </div>
    );
};

export default PropertiesBar;