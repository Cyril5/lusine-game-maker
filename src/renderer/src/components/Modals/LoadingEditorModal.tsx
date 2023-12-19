import { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';

import '../../assets/css/startup-modal.scss'; 
import logo from '../../assets/logo.png';
import EditorUtils from '@renderer/editor/EditorUtils';
import { ProgressBar } from 'react-bootstrap';

const LoadingEditorModal = (props:any)=> {

  const [show, setShow] = useState(true);
  const [progressBarValue,setProgressBarValue] = useState(0);

  const handleClose = () => setShow(false); // lors du clic sur le bouton


  useEffect(()=>{
    setShow(props.show);

    if(props.onCloseCallback) {
        props.onCloseCallback();
    }
  },[props.show])

  useEffect(()=>{
    let value = 0;
    setInterval(()=>{
      //handleOpenDemoProject();
      setProgressBarValue(value++);
      if(value >= 100) {
        value = 0;
      }
    },100)
  },[])


  return (
    <>
      <Modal
        show={show}
        onHide={handleClose}
        backdrop="static"
        centered
      >
        <Modal.Header>
          <Modal.Title>Lusine Game Maker - {EditorUtils.VERSION}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <p>Chargement de l'éditeur...</p>
          <div className="btns-group">
          {/* <img src={logo} className='logo-modal'/> */}
          </div>
          <ProgressBar animated now={progressBarValue} variant="warning"/>
        </Modal.Body>
        <Modal.Footer>
          <div className='info'>
            <p>v.{EditorUtils.VERSION.toLowerCase().trim()}</p>

          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default LoadingEditorModal