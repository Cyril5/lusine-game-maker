import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useRef, useState } from 'react';
import { Card, Col, Container, Row } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

function AddObjectModal(props: any) {

    const [kebab, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);
    
    const handleFileChange = (event) => {
      setSelectedFile(event.target.files[0]);
      handleClose();

    };

    const openFileDialog = () => {
        fileInputRef.current.click();
      };

    return (
        <>
             <input type="file" ref={fileInputRef} accept={".obj,.glb,.gltf"} onChange={handleFileChange} style={{ display: "none" }} />

            <Button variant="primary" onClick={handleShow}>
                <FontAwesomeIcon icon="cube"/>
                 <FontAwesomeIcon icon="plus"/>
            </Button>

            <Modal show={kebab} onHide={handleClose}>
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
                                        <Button variant="primary">Ajouter</Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col>
                                <Card style={{ width: '18rem' }}>
                                    <Card.Img variant="top" src="holder.js/100px180" />
                                    <Card.Body>
                                        <Card.Title>Objet 3D</Card.Title>
                                        <Card.Text>
                                            Description de l'objet 3D
                                        </Card.Text>
                                        <Button variant="primary" onClick={openFileDialog}>Ajouter</Button>
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
                    </Container>





                </Modal.Body>
                <Modal.Footer>

                </Modal.Footer>
            </Modal>
        </>
    );
}

export default AddObjectModal;