import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

import '../assets/css/startup-modal.scss'; 
import logo from '../assets/logo.png';
import ProjectManager from '@renderer/editor/ProjectManager';
import EditorUtils from '@renderer/editor/EditorUtils';

const StartupModal = (props:any)=> {

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false); // lors du clic sur le bouton

  const handleCreateProject = ()=>{
    ProjectManager.createProject();
  }

  const handleOpenProject = ()=>{
    ProjectManager.openProject();
  }

  const handleOpenDemoProject = ()=>{
    ProjectManager.openDemoProject();
  }

  useEffect(()=>{
    setShow(props.show);

    if(props.onCloseCallback) {
        props.onCloseCallback();
    }
  },[props.show])


  useEffect(()=>{
    setTimeout(()=>{
      //handleOpenDemoProject();
    },1000)
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
          <div className="btns-group">
          <img src={logo} className='logo-modal'/>
            {/* <Button variant="secondary" onClick={handleOpenDemoProject}>Ouvrir le projet de démo</Button> */}
            <Button variant="secondary" onClick={handleCreateProject}>Créer un nouveau projet</Button>
            <Button variant="secondary" onClick={handleOpenProject}>Ouvrir un projet</Button>
            <Button variant="secondary" disabled onClick={handleClose}>Aide et documentation</Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className='info'>
            Développé par Cyril5 (clprods)
            {/* <a href="https://github.com/Cyril5/lusine-game-maker">https://github.com/Cyril5/lusine-game-maker</a> */}
            <a>https://github.com/Cyril5/lusine-game-maker</a>
            
            <p>v.{EditorUtils.VERSION.toLowerCase().trim()}</p>

          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default StartupModal