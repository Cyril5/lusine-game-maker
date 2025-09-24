import React from "react";
import { useEffect, useState } from "react";
import { Alert } from "react-bootstrap";

const { ipcRenderer } = require('electron');

const ConsoleModal = (props) => {

  const [erreurs, setErrors] = useState([]);

  useEffect(() => {

    // Écoutez les messages de la console envoyés depuis le processus principal
    ipcRenderer.on('console-message', (event, data) => {
      if (data.level === 3 && erreurs.length <= 20) {
        setErrors((anciennesErreurs) => [...anciennesErreurs, data]);
        //  const errorStack = new Error(data.message).stack;
        //  console.log(errorStack);
      }
    });
  }, [])


  return (
    <>
      CONSOLE
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