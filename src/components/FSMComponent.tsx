import { Component, ReactNode } from "react";
import { Button, ListGroup } from "react-bootstrap";

export default class FSMComponent extends Component
{
    render(): ReactNode {
        return(
            <>
             <ListGroup>
                <ListGroup.Item variant="primary">AF Principal <Button>Editer</Button></ListGroup.Item>
                </ListGroup>
            </>
        )
    }
}