import { Button, Card, Dropdown, DropdownButton, Form, Offcanvas } from "react-bootstrap";

type MaterialModalProps = {
    show: boolean;
    onHide: () => void;
};

const MaterialModal = ({ show, onHide }: MaterialModalProps) => {
    return (
        <Offcanvas show={show} onHide={onHide} backdrop={false} scroll placement="end">
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>Editer matériel</Offcanvas.Title>
                <DropdownButton id="dropdown-basic-button" title="Dropdown button" size="sm" variant="warning">
                    <Dropdown.Item href="#/action-1">Material 0</Dropdown.Item>
                    <Dropdown.Item href="#/action-2">Material 1</Dropdown.Item>
                    <Dropdown.Item href="#/action-3">Material 2</Dropdown.Item>
                </DropdownButton>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <Form>
                    <Form.Group className="mb-3" controlId="matName">
                        <Form.Label>Name</Form.Label>
                        <Form.Control type="text" autoFocus />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="texturePath">
                        <Form.Label>Texture path</Form.Label>
                        <Form.Control type="text" />
                    </Form.Group>
                </Form>
                <Card style={{ width: "10rem" }}>
                    <Card.Img variant="top" src="https://place-hold.it/1024" />
                    <Card.Body>
                        <Card.Text>No texture yet</Card.Text>
                    </Card.Body>
                </Card>
                <Button variant="danger">Supprimer le matériel</Button>
            </Offcanvas.Body>
        </Offcanvas>
    );
};
export default MaterialModal;
