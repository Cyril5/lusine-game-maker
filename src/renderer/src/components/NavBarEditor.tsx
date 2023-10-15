import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Dropdown, DropdownButton } from 'react-bootstrap';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import logo from '../assets/logo.png?url';
import Editor from './Editor';
import { useState } from 'react';
import EditorUtils from '@renderer/editor/EditorUtils';


const NavBarEditor = (props: any)=> {

    // Déclaration de l'état en utilisant le Hook useState
    const [gameIsRunning, setGameIsRunning] = useState(false);

  const handleStateGame = ()=> {
    if(gameIsRunning) {
      Editor.getInstance().stopGame();
    }else{
      Editor.getInstance().playGame();
    }
    setGameIsRunning(!gameIsRunning);
  }

  return (
    <Navbar bg="dark" expand="sm" variant="dark">
      <Container>
        <Navbar.Brand href="#home">
          <img
            alt=""
            src={logo}
            width="30"
            height="30"
            className="d-inline-block align-top"
          />{' '}
          Lusine Game Maker
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">

            {/* <Button variant='secondary' onClick={()=>Editor.getInstance().load()}><FontAwesomeIcon icon="folder-open"></FontAwesomeIcon></Button> */}
            <Button variant='primary' onClick={()=>Editor.getInstance().save()}><FontAwesomeIcon icon="floppy-disk"/>  Sauver</Button>

            {/* <Nav.Link onClick={props.onClickAddObject}>Ajouter</Nav.Link> */}

            <Button variant={gameIsRunning ? "danger" : "success"} onClick={handleStateGame}> <FontAwesomeIcon icon={gameIsRunning ? "stop" : "play"} /> {gameIsRunning ? "Stop" : "Start"}</Button>
            {/* <Button variant="danger" onClick={Editor.getInstance().stopGame}> <FontAwesomeIcon icon="stop" /> Stop</Button> */}
            {/* <Button variant="warning" disabled> <FontAwesomeIcon icon="reply" /> Restart</Button> */}

            <DropdownButton id="dropdown-basic-button" variant='secondary' title={<span><FontAwesomeIcon icon="gear" /> Options</span>}>
              <Dropdown.Item href="#">Physique</Dropdown.Item>
              <Dropdown.Item onClick={()=>Editor.getInstance().showDebugInspector()}>Show Debug Inspector</Dropdown.Item>
              <Dropdown.Item href="#">Option 3</Dropdown.Item>
            </DropdownButton>

          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );


}

export default NavBarEditor;