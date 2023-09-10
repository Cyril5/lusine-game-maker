import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Offcanvas, Button, Alert } from "react-bootstrap";

const ConsoleModal = (props) => {

    const [errors, setErrors] = useState([]);
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Fonction de gestion des erreurs personnalisée
        const gestionnaireErreur = (message) => {
            // Ajouter l'erreur à la liste des erreurs
            setErrors((prevErrors) => [...prevErrors, message]);
        };

        // Rediriger les erreurs vers la fonction de gestion des erreurs personnalisée
        window.addEventListener('error', (event) => {
            gestionnaireErreur(event.message);
        });

        setInterval(()=>{
            console.error('CRASH TEST!');
        },5000);

        return () => {
            // Nettoyer l'écouteur d'événement lors du démontage du composant
            //window.removeEventListener('error', gestionnaireErreur);
        };
    }, []);

    return (
        <>
            <Button variant="danger" className="console-btn me-2" onClick={() => setShow(true)} style={{ width: '32px' }}>
                <FontAwesomeIcon icon="terminal" />
                {(errors.length > 0) && (errors.length)}
            </Button>
            <Offcanvas placement="bottom" scroll backdrop={false} onHide={() => setShow(false)} show={show} {...props}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Sortie d'erreurs<FontAwesomeIcon icon="terminal" /></Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    {errors.map((error, key) => (
                        <Alert key={key} variant='danger'>
                            <Alert.Heading>{error}</Alert.Heading>
                        </Alert>
                    ))}

                </Offcanvas.Body>
            </Offcanvas>
        </>
    )
}
export default ConsoleModal;