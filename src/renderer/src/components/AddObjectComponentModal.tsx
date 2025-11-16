import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useRef, useState } from 'react';
import {
    Button,
    Card,
    Col,
    Container,
    Modal,
    Nav,
    ProgressBar,
    Row,
    Tab,
} from 'react-bootstrap';
import Models3DModal from './Modals/Models3DModal';
import LGM3DEditor from '@renderer/editor/LGM3DEditor';

function AddObjectModal(props: any) {
    const [show, setShow] = useState(false);
    const [activeTab, setActiveTab] = useState<'physics' | 'controller'>('physics');

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    /** helper pour exécuter une action d’ajout + fermer la modal */
    const handleAddAndClose = (action: () => void) => {
        action();
        handleClose();
    };

    return (
        <>
            <Button variant="primary" onClick={handleShow}>
                <span>Ajouter un composant&nbsp;</span>
                <FontAwesomeIcon icon="cube" />
                &nbsp;
                <FontAwesomeIcon icon="plus" />
            </Button>

            <Modal
                centered
                show={show}
                onHide={handleClose}
                dialogClassName="add-object-modal"
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Ajouter un composant</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p className="mb-3">Double-cliquez pour ajouter un composant sur l'objet.</p>

                    <Tab.Container
                        activeKey={activeTab}
                        onSelect={(k) => setActiveTab((k as 'physics' | 'controller') ?? 'physics')}
                    >
                        <Row>
                            {/* Onglets verticaux à gauche */}
                            <Col sm={3} className="add-object-modal__tabs">
                                <Nav variant="pills" className="flex-column">
                                    <Nav.Item>
                                        <Nav.Link eventKey="objects">Physique</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="collision">Controlleur</Nav.Link>
                                    </Nav.Item>
                                </Nav>
                            </Col>

                            {/* Contenu des onglets à droite */}
                            <Col sm={9} className="add-object-modal__content">
                                <Tab.Content>
                                    {/* Onglet OBJETS */}
                                    <Tab.Pane eventKey="objects">
                                        <Row className="g-3">
                                            <Col md={6}>
                                                <Card
                                                    className="add-object-modal__item"
                                                    onDoubleClick={() =>
                                                        handleAddAndClose(() => {}
                                                        )
                                                    }
                                                >
                                                    <Card.Body>
                                                        <Card.Title>Corps Physique</Card.Title>
                                                        <Card.Text>
                                                            Permet l'objet d'être influencé par la physique (gravité, force, masse)
                                                        </Card.Text>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </Tab.Pane>

                                    {/* Onglet 2 */}
                                    <Tab.Pane eventKey="controller">
                                        <Row className="g-3">
                                            <Col md={6}>
                                                <Card
                                                    className="add-object-modal__item"
                                                    onDoubleClick={() =>
                                                        handleAddAndClose(() =>
                                                            LGM3DEditor.getInstance().addBoxCollider()
                                                        )
                                                    }
                                                >
                                                    <Card.Img
                                                        variant="top"
                                                        src="holder.js/100px180"
                                                        alt="Boîte de collision"
                                                    />
                                                    <Card.Body>
                                                        <Card.Title>Boîte de collision</Card.Title>
                                                        <Card.Text>
                                                            Collider en forme de boîte pour gérer les collisions
                                                            simples.
                                                        </Card.Text>
                                                    </Card.Body>
                                                </Card>
                                            </Col>

                                            <Col md={6}>
                                                <Card
                                                    className="add-object-modal__item"
                                                    onDoubleClick={() =>
                                                        handleAddAndClose(() =>
                                                            LGM3DEditor.getInstance().addSphereCollider()
                                                        )
                                                    }
                                                >
                                                    <Card.Img
                                                        variant="top"
                                                        src="holder.js/100px180"
                                                        alt="Sphère de collision"
                                                    />
                                                    <Card.Body>
                                                        <Card.Title>Sphère de collision</Card.Title>
                                                        <Card.Text>
                                                            Collider sphérique pratique pour les personnages ou
                                                            objets ronds.
                                                        </Card.Text>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </Tab.Pane>
                                </Tab.Content>
                            </Col>
                        </Row>
                    </Tab.Container>
                </Modal.Body>

                <Modal.Footer>
                    {/* Pour l’instant vide, tu pourras rajouter du contenu plus tard (aide, bouton doc, etc.) */}
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default AddObjectModal;
