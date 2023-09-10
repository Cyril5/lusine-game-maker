import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Accordion, Button, Form, Offcanvas } from "react-bootstrap";
import Editor from "./Editor";
import GameObjectsTreeView from "./GameObjectsTreeView";
import AddObjectModal from "./AddObjectModal";

const GameObjectsTreeBar = (props : any) => {

    const [divWidth, setDivWidth] = useState(250);
    const {gameObjects} = props;

    const handleMouseDown = (e) : void => {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };
  
    const handleMouseMove = (e) : void => {
      const newWidth = divWidth + (e.movementX || 0);
      setDivWidth(newWidth);
    };
  
    const handleMouseUp = () : void => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

  const handleRefreshObjectsList = (event): void=> {
    Editor.getInstance().updateObjectsTreeView();
  }

    return (
        <div
            className="tree-bar"
            onMouseDown={handleMouseDown}
          >
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


              
              <h5><FontAwesomeIcon icon={'cubes'}/> Objets</h5>
              <Button variant="success" size="sm"><FontAwesomeIcon icon={'refresh'} onClick={handleRefreshObjectsList}/></Button>

            <GameObjectsTreeView gameObjects={gameObjects}/>
            <AddObjectModal show={false} />

        </div>
    );
};

export default GameObjectsTreeBar;