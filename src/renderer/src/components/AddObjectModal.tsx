import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ProgrammableGameObject } from '@renderer/engine/ProgrammableGameObject';
import React, { useEffect, useRef, useState } from 'react';
import { Card, Col, Container, ProgressBar, Row } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Editor from './Editor';
import Models3DModal from './Models3DModal';

function AddObjectModal(props: any) {

    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const [selectedFile, setSelectedFile] = useState(null);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);

    const handleFileChange = async (event) => {
        setSelectedFile(event.target.files[0]);
        handleClose();

        try {
            const data = new FormData();
            data.append("file", selectedFile);
            const response = await fetch("/upload", {
                method: "POST",
                body: data,
                onUploadProgress: (event) => {
                    setProgress((event.loaded / event.total) * 100);
                },
            });
            const result = await response;
            console.log(result);
        } catch (error) {
            console.error(error);
            //setError("File upload failed");
        }

    };

    const openFileDialog = () => {
        fileInputRef.current.click();

    };

    return (
        <>
            <input type="file" ref={fileInputRef} accept={".obj,.fbx,.glb,.gltf"} onChange={handleFileChange} style={{ display: "none" }} />
            <ProgressBar animated now={progress} />

            <Button variant="primary" onClick={handleShow}>
                <span>Ajouter un objet  </span>
                <FontAwesomeIcon icon="cube" />
                <FontAwesomeIcon icon="plus" />
            </Button>

            <Modal centered show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Ajouter un objet</Modal.Title>
                </Modal.Header>
                <Modal.Body>

                    <Container fluid>
                        <Row>
                            <Col>
                                <Card style={{ width: '18rem' }}>
                                    <Card.Img variant="top" src="holder.js/100px180" />
                                    <Card.Body>
                                        <Card.Title>Objet Programmable</Card.Title>
                                        <Card.Text>
                                            Objet non visuel avec une machine d'états pour programmer
                                        </Card.Text>
                                        <Button variant="primary" onClick={() => Editor.getInstance().addProgrammableObject()}>Ajouter</Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col>
                                <Card style={{ width: '18rem' }}>
                                    <Card.Img variant="top" src="holder.js/100px180" />
                                    <Card.Body>
                                        <Card.Title>Modèle 3D</Card.Title>
                                        <Card.Text>
                                            Description model 3D
                                        </Card.Text>
                                        {/* <Button variant="primary" onClick={openFileDialog}>Ajouter</Button> */}
                                        <Models3DModal />
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col>
                                <Card style={{ width: '18rem' }}>
                                    <Card.Img variant="top" src="holder.js/100px180" />
                                    <Card.Body>
                                        <Card.Title>Etat de Machine d'Etats</Card.Title>
                                        <Card.Text>
                                            Description de l'Etat de Machine
                                        </Card.Text>
                                        <Button variant="primary" onClick={openFileDialog}>Ajouter</Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <Card style={{ width: '18rem' }}>
                                    <Card.Img variant="top" src="holder.js/100px180" />
                                    <Card.Body>
                                        <Card.Title>Collider</Card.Title>
                                        <Card.Text>
                                            Description du collider
                                        </Card.Text>
                                        <Button variant="primary">Ajouter</Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Container>





                </Modal.Body>
                <Modal.Footer>

                </Modal.Footer>
            </Modal>
        </>
    );
}

export default AddObjectModal;