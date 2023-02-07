import { useEffect } from "react";
import { Accordion, Button, Form } from "react-bootstrap";
import FSMComponent from "./FSMComponent";

const PropertiesBar = (props) => {

    const { gameObjectName } = props; // props.name 

    // useEffect(() => {
    //     // Update the 3D object represented by Babylon.TransformNode based on the props
    //     const { x, y, z } = position;
    //     const { x: rx, y: ry, z: rz } = rotation;
    //     const { x: sx, y: sy, z: sz } = scaling;
    //   }, [position, rotation, scaling]);

    return (
        <div>
            <Accordion defaultActiveKey={['0']} alwaysOpen>
                <Accordion.Item eventKey="0">
                    <Accordion.Header>Objet</Accordion.Header>
                    <Accordion.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control value={gameObjectName ? gameObjectName : 'null'} placeholder="Disabled input"/>
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
                        <FSMComponent/> 
                    </Accordion.Body>
                </Accordion.Item>
                )}
            </Accordion>
        </div>
    );
};

export default PropertiesBar;