import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useRef, useState } from 'react';
import { Card, Col, Container, Row } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { ClassAPITest } from '../../engine/ClassAPITest';
import { GameObject } from '../../engine/GameObject';

function CommandModal(props: any) {

    const [kebab, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const textAreaRef = useRef(null);

    const handleExecuteCommand= ()=> {


      
        console.log(textAreaRef.current.value);
        try {
            eval(ClassAPITest);
            eval(GameObject);
            eval(textAreaRef.current.value);
        } catch (error) {
            console.error(error);
        }

    };

    return (
        <>
            <Button variant="danger" onClick={handleShow}>
            <FontAwesomeIcon icon="terminal"/> Exe...
            </Button>

            <Modal show={kebab} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Executer une commande</Modal.Title>
                </Modal.Header>
                <Modal.Body>

                    <Container>
                        <Row>
                            <textarea ref={textAreaRef} name="command" id="commandArea" cols="100" rows="25"></textarea>
                        </Row>
                        <Row>
                                <Button onClick={handleExecuteCommand}><FontAwesomeIcon icon="terminal"/>Executer</Button>
                            </Row>
                    </Container>




                </Modal.Body>
                <Modal.Footer>

                </Modal.Footer>
            </Modal>
        </>
    );
}

export default CommandModal;