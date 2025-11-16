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
    const [showModelsModal, setShowModalsModal] = useState(false);
    // const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [progress, setProgress] = useState(0);
    const [activeTab, setActiveTab] = useState<'objects' | 'collision'>('objects');

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    // const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    //     const file = event.target.files?.[0];
    //     if (!file) return;

    //     setSelectedFile(file);
    //     // Si tu veux fermer la modal après sélection de fichier :
    //     // handleClose();

    //     try {
    //         const data = new FormData();
    //         data.append('file', file);

    //         const response = await fetch('/upload', {
    //             method: 'POST',
    //             body: data,
    //             // ⚠️ onUploadProgress n'existe pas sur fetch, à faire côté main/IPC ou via axios
    //         });

    //         // Ici tu peux mettre un faux suivi de progression si besoin
    //         setProgress(100);
    //         console.log(await response.json());
    //     } catch (error) {
    //         console.error(error);
    //         // setError("File upload failed");
    //     }
    // };

    // const openFileDialog = () => {
    //     fileInputRef.current?.click();
    // };

    const handleOpenModelsModal = () => {
        setShowModalsModal(true);
    };

    const handleModelsModalClose = () => {
        setShowModalsModal(false);
    };

    /** helper pour exécuter une action d’ajout + fermer la modal */
    const handleAddAndClose = (action: () => void) => {
        action();
        handleClose();
    };

    return (
        <>
            {/* input caché pour upload */}
            {/* <input
                type="file"
                ref={fileInputRef}
                accept=".glb,.gltf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            /> */}

            {/* barre de progression upload (si tu l'utilises) */}
            {/* {progress > 0 && progress < 100 && (
                <Container className="mt-2">
                    <ProgressBar animated now={progress} />
                </Container>
            )} */}

            <Button variant="primary" onClick={handleShow}>
                <span>Ajouter un objet&nbsp;</span>
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
                    <Modal.Title>Ajouter un objet</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p className="mb-3">Double-cliquez pour ajouter un objet.</p>

                    <Tab.Container
                        activeKey={activeTab}
                        onSelect={(k) => setActiveTab((k as 'objects' | 'collision') ?? 'objects')}
                    >
                        <Row>
                            {/* Onglets verticaux à gauche */}
                            <Col sm={3} className="add-object-modal__tabs">
                                <Nav variant="pills" className="flex-column">
                                    <Nav.Item>
                                        <Nav.Link eventKey="objects">Objets</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="collision">Collisions</Nav.Link>
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
                                                        handleAddAndClose(() =>
                                                            LGM3DEditor.getInstance().addProgrammableObject()
                                                        )
                                                    }
                                                >
                                                    <Card.Img
                                                        variant="top"
                                                        src="holder.js/100px180"
                                                        alt="Objet programmable"
                                                    />
                                                    <Card.Body>
                                                        <Card.Title>Objet programmable</Card.Title>
                                                        <Card.Text>
                                                            Objet non visuel avec une machine d&apos;états pour
                                                            programmer le comportement.
                                                        </Card.Text>
                                                    </Card.Body>
                                                </Card>
                                            </Col>

                                            <Col md={6}>
                                                <Card
                                                    className="add-object-modal__item"
                                                    onDoubleClick={handleOpenModelsModal}
                                                >
                                                    <Card.Img
                                                        variant="top"
                                                        src="holder.js/100px180"
                                                        alt="Modèle 3D"
                                                    />
                                                    <Card.Body>
                                                        <Card.Title>Modèle 3D</Card.Title>
                                                        <Card.Text>
                                                            Ajouter un modèle 3D existant à la scène (GLB/GLTF).
                                                        </Card.Text>
                                                        {/* La modal de sélection de modèles 3D */}
                                                        <Models3DModal
                                                            show={showModelsModal}
                                                            onClose={handleModelsModalClose}
                                                        />
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </Tab.Pane>

                                    {/* Onglet COLLISIONS */}
                                    <Tab.Pane eventKey="collision">
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
