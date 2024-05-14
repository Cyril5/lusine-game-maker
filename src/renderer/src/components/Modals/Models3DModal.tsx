import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useRef, useState } from 'react';
import { Card, Col, Container, Form, ProgressBar, Row, Stack } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import ProjectManager from '@renderer/editor/ProjectManager';
import EditorUtils from '@renderer/editor/EditorUtils';
import LGM3DEditor from '@renderer/editor/LGM3DEditor';

// import modelsDirectory from '../public/projects/MonProjet/models?url';

const Models3DModal = (props: any) => {

    const fs = require("fs");
    const { app } = require('@electron/remote');

    const fileInputRef = useRef(null);
    const [show, setShow] = useState(false);
    const handleClose = () => {
        setShow(false);
        props.onClose();
    }

    const [selectedFile, setSelectedFile] = useState(null);
    const [progress, setProgress] = useState(0);

    const [modelfiles, setFiles] = useState([]);

    let modelsDirectory = ProjectManager.getModelsDirectory();

    const readModelsFiles = () => {
        fs.readdir(modelsDirectory, (err, files) => {
            if (err) {
                console.error("Erreur lors de la lecture du répertoire :", err);
                return;
            }

            // Filtrer les fichiers avec les extensions .obj, .fbx et .glb
            const filteredFiles = files.filter(file => {
                const ext = EditorUtils.path.extname(file).toLowerCase();
                return ext == '.glb' || ext == '.gltf';
                //return ext === '.obj' || ext === '.fbx' || ext === '.glb';
            });

            setFiles(filteredFiles);
        });
    }

    // Récupérer la liste de tous les modèles dans le dossier Models du projet
    useEffect(() => {

        modelsDirectory = ProjectManager.getModelsDirectory();

        console.log(modelsDirectory);

        readModelsFiles();

    }, []);

    useEffect(()=>{
        setShow(props.show);
    },[props.show])


    // Importation nouveau modèle dans le projet 
    const handleFileChange = async (event) => {

        const input = event.target;
        const file = input.files[0];
        //setSelectedFile(file);

        try {
            const readStream = fs.createReadStream(file.path);
            const writeStream = fs.createWriteStream(modelsDirectory + "/" + file.name);

            readStream.on("data", chunk => {
                console.log(chunk.length);
                setProgress(prevProgress => prevProgress + chunk.length);
            });
            // copier le fichier dans le répértoire Models du projet
            readStream.pipe(writeStream);

            await new Promise((resolve, reject) => {
                writeStream.on("finish", resolve);
                writeStream.on("error", reject);
            });

            readModelsFiles();

        } catch (error) {
            console.error(error);
            //setError("File upload failed");
        }

    };

    const openFileDialog = () => {
        fileInputRef.current.click();

    };

    const handleSelectModel = (file) => {
        setSelectedFile(file);
        console.log(file);
    }

    const handleAddModelToScene = (file) => {
        const options = {
            convertMeterToCm: false
        };
        handleClose();
        LGM3DEditor.getInstance().addModel3DObject(file, options);
    }

    const getModelText = (filename) => {
        const newFilename = filename.split(".")[0];
        return newFilename.charAt(0).toUpperCase() + newFilename.slice(1);
    }

    return (
        <>
            <Modal show={show} onHide={handleClose} backdrop={false}>
                <Modal.Header closeButton>
                    <Modal.Title>Ajouter un Objet3D</Modal.Title>
                </Modal.Header>
                <Modal.Body>

                    <Button variant="primary" onClick={openFileDialog}>
                        Importer <FontAwesomeIcon icon="file-import" />
                        <input type="file" ref={fileInputRef} accept={".glb, .gltf"} onChange={handleFileChange} style={{ display: "none" }} />
                    </Button>

                    <Stack direction='horizontal'>
                        <ProgressBar now={progress} />
                        {progress}
                    </Stack>


                    <Container fluid>
                        <Row>
                            <Stack direction="vertical">
                                {modelfiles.map((file,key) => (
                                        <Button key={key} variant='secondary' onClick={() => handleSelectModel(file)}>{file}</Button>
                                ))}
                            </Stack>
                        </Row>
                        <p>Séléctionnez un modèle dans la liste ci-dessus ou importez un nouveau.</p>
                        <p>Modèle selectionné : {selectedFile}</p>
                        <Form.Check type="checkbox" disabled label=" Convertir en mètres (l'échelle sera à 0.001m) " />
                        <Button variant='success' disabled={!selectedFile} onClick={() => handleAddModelToScene(selectedFile)}>Ajouter dans la scène</Button>
                    </Container>





                </Modal.Body>
                <Modal.Footer>

                </Modal.Footer>
            </Modal>
        </>
    );
}

export default Models3DModal;