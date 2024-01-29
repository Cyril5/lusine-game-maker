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
    const [showModelsModal,setShowModalsModal] = useState(false);

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

    const handleOpenModelsModal = (event) => {
        setShowModalsModal(true);
    };

    return (
        <>
            <input type="file" ref={fileInputRef} accept={".glb,.gltf"} onChange={handleFileChange} style={{ display: "none" }} />
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
                    <p>Double cliquez pour ajouter un objet</p>

                        <Row>
                            <Col md={6}>
                                <Card style={{ width: '18rem' }}>
                                    <Card.Img variant="top" src="holder.js/100px180" />
                                    <Card.Body>
                                        <Card.Title>Collisionneur</Card.Title>
                                        <Card.Text>
                                            Surface de collision
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card style={{ width: '18rem' }} onDoubleClick={() => {
                                    Editor.getInstance().addProgrammableObject();
                                    handleClose();
                                    }}>
                                    <Card.Img variant="top" src="holder.js/100px180" />
                                    <Card.Body>
                                        <Card.Title>Objet Programmable</Card.Title>
                                        <Card.Text>
                                            Objet non visuel avec une machine d'états pour programmer
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card style={{ width: '18rem' }} onDoubleClick={handleOpenModelsModal}>
                                    <Card.Img variant="top" src="holder.js/100px180" />
                                    <Card.Body>
                                        <Card.Title>Modèle 3D</Card.Title>
                                        <Card.Text>
                                            Description model 3D
                                        </Card.Text>
                                        <Models3DModal show={showModelsModal} onClose={()=>setShowModalsModal(false)}/>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <Card style={{ width: '18rem' }} onDoubleClick={()=>Editor.getInstance().addBoxCollider()}>
                                    <Card.Img variant="top" src="holder.js/100px180" />
                                    <Card.Body>
                                        <Card.Title>Boite de collision</Card.Title>
                                        <Card.Text>
                                            Description du collider
                                        </Card.Text>
                                        <Button variant="primary">Ajouter</Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>



                </Modal.Body>
                <Modal.Footer>

                </Modal.Footer>
            </Modal>
        </>
    );
}

export default AddObjectModal;