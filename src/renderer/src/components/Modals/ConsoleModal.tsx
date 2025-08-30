import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { useEffect, useState } from "react";
import { Offcanvas, Button, Alert } from "react-bootstrap";

const { ipcRenderer } = require('electron');

const ConsoleModal = (props)=> {

    const [erreurs,setErrors] = useState([]);
    const [show,setShow] = useState(false);
  
    useEffect(()=>{
    
     // Écoutez les messages de la console envoyés depuis le processus principal
     ipcRenderer.on('console-message', (event, data) => {
         if(data.level === 3 && erreurs.length <= 20) {
             setErrors((anciennesErreurs) => [...anciennesErreurs, data]);
            //  const errorStack = new Error(data.message).stack;
            //  console.log(errorStack);
         }
       });
    },[])
       

        return (
          <>
            {/* <Button variant="danger" className="console-btn me-2" onClick={() => setShow(true)} style={{ width: '32px' }}>
                <FontAwesomeIcon icon="terminal" />
                 {(erreurs.length > 0) && (erreurs.length)}
            </Button> */}
             {/* <Offcanvas placement="bottom" scroll backdrop={false} onHide={() => setShow(false)} show={show} {...props}>
                 <Offcanvas.Header closeButton>
                     <Offcanvas.Title>Sortie d'erreurs<FontAwesomeIcon icon="terminal" /></Offcanvas.Title>
                     <Button variant="secondary" onClick={()=>setErrors([])}>Vider la console</Button>
                 </Offcanvas.Header>
                 <Offcanvas.Body> */}
                 {erreurs.map((erreur, index) => (
                        <Alert variant='danger' key={index}>
                            <Alert.Heading>{erreur.message}</Alert.Heading>
                            <p>{erreur.sourceId} (line : {erreur.line})</p>
                         </Alert>
                 ))}
                 {/* </Offcanvas.Body>
            </Offcanvas> */}
          </>
        );
                 }
export default ConsoleModal;


// const ConsoleModalTest = (props) => {

//     const [errors, setErrors] = useState([]);
//     const [show, setShow] = useState(false);

//     useEffect(() => {

//         window.onerror = (a, b, c, d, e) => {
//             console.log(`message: ${a}`);
//             console.log(`source: ${b}`);
//             console.log(`lineno: ${c}`);
//             console.log(`colno: ${d}`);
//             console.log(`error: ${e}`);
          
//             // return true;
//           };

//         // Fonction de gestion des erreurs personnalisée
//         const gestionnaireErreur = (event) => {

//             console.log('CRASH');

//             const { message, source, lineno, colno, error } = event;
//             // Faites quelque chose avec l'erreur ici, par exemple, l'enregistrez sur un serveur ou affichez-la dans le composant
//             // Créer un objet d'erreur contenant les détails de l'erreur
//             const nouvelleErreur = {
//                 message,
//                 source,
//                 lineno,
//                 colno,
//                 error,
//             };
            

//             // Ajouter la nouvelle erreur à la liste des erreurs dans l'état
//             setErrors((anciennesErreurs) => [...anciennesErreurs, nouvelleErreur]);

//         };

//         // Rediriger les erreurs de la console vers la fonction de gestion des erreurs personnalisée
//         window.addEventListener('error', gestionnaireErreur);

//         // Nettoyer l'écouteur d'événement lors du démontage du composant
//         return () => {
//             window.removeEventListener('error', gestionnaireErreur);
//         };
//     }, []);

//     return (
//         <>
//             <Button variant="danger" className="console-btn me-2" onClick={() => setShow(true)} style={{ width: '32px' }}>
//                 <FontAwesomeIcon icon="terminal" />
//                 {(errors.length > 0) && (errors.length)}
//             </Button>
//             <Offcanvas placement="bottom" scroll backdrop={false} onHide={() => setShow(false)} show={show} {...props}>
//                 <Offcanvas.Header closeButton>
//                     <Offcanvas.Title>Sortie d'erreurs<FontAwesomeIcon icon="terminal" /></Offcanvas.Title>
//                 </Offcanvas.Header>
//                 <Offcanvas.Body>
//                     {errors.map((error, key) => (
//                         <Alert key={key} variant='danger'>
//                             <Alert.Heading>{error.message}</Alert.Heading>
//                         </Alert>
//                     ))}

//                 </Offcanvas.Body>
//             </Offcanvas>
//         </>
//     )
// }