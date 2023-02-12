import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'react-bootstrap';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';

import logo from '../assets/logo.png?url';

function NavBarEditor(props : any) {

  return (
    <Navbar bg="dark" expand="lg" variant="dark">
      <Container>
      <Navbar.Brand href="#home">
            <img
              alt=""
              src={logo}
              width="30"
              height="30"
              className="d-inline-block align-top"
            />{' '}
            Lusine Game Maker 0.1
          </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">

          <Button variant='secondary' size="lg" onClick={props.onClickAddObject}><FontAwesomeIcon icon="folder-open"></FontAwesomeIcon></Button>

            <Nav.Link onClick={props.onClickAddObject}>Ajouter</Nav.Link>

            <Button variant="success"> <FontAwesomeIcon icon="play"/> Start</Button>
            <Button variant="danger"> <FontAwesomeIcon icon="stop"/> Stop</Button>
            <Button variant="warning" disabled> <FontAwesomeIcon icon="reply"/> Restart</Button>

            <NavDropdown title="Dropdown" id="basic-nav-dropdown">
              <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
              <NavDropdown.Item href="#action/3.2">
                Montrer l'inspecteur
              </NavDropdown.Item>
              <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item href="#action/3.4">


              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );


}

export default NavBarEditor;