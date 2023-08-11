import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Accordion, Button, Form, Offcanvas } from "react-bootstrap";
import Editor from "./Editor";
import GameObjectsTreeView from "./GameObjectsTreeView";
import AddObjectModal from "./AddObjectModal";

const GameObjectsTreeBar = (props : any) => {

    const [divWidth, setDivWidth] = useState(200);

    const handleMouseDown = (e) => {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };
  
    const handleMouseMove = (e) => {
      const newWidth = divWidth + (e.movementX || 0);
      setDivWidth(newWidth);
    };
  
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    return (
        <div
            className="resizable-div"
            style={{ width: divWidth + 'px' }}
            onMouseDown={handleMouseDown}
          >
            REZIZE ME !
            {/* <Button variant="secondary" onClick={toggleShow} className="objects-tree-btn">
                <FontAwesomeIcon icon="cube" />
            </Button> */}
            {/* <Offcanvas className="properties-bar" placement="start" scroll backdrop={false} show={show} onHide={handleClose} {...props}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Objets <FontAwesomeIcon icon="cube" /></Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                </Offcanvas.Body>
            </Offcanvas> */}
            <GameObjectsTreeView/>
            <AddObjectModal show={false} />

        </div>
    );
};

export default GameObjectsTreeBar;