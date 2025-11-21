import { Button, ListGroup } from "react-bootstrap";

export const FSMComponent = (props) => {

    const handleEditFSM = ()=>{
        // TODO : Appeler le EditorStore pour ouvrir l'éditeur de state machine avec le fsm selectionné
    }

    return (
        <>
            <ListGroup>
                <ListGroup.Item variant="primary">{props.name} <Button onClick={handleEditFSM}>Editer</Button></ListGroup.Item>
            </ListGroup>
            {/* <Button variant="primary">Ajouter</Button> */}
        </>
    )
}