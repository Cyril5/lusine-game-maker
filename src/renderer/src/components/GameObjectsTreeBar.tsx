import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Accordion, Button, Form, Offcanvas } from "react-bootstrap";
import Editor from "./Editor";
import GameObjectsTreeView from "./GameObjectsTreeView";
import AddObjectModal from "./AddObjectModal";
import { ResizableBox } from 'react-resizable';

const GameObjectsTreeBar = (props: any) => {

  const { gameObjects } = props;

  const [isResizing, setIsResizing] = useState(false);
  const [width, setWidth] = useState(200); // Largeur initiale

  const handleRefreshObjectsList = (event): void => {
    Editor.getInstance().updateObjectsTreeView();
  }

  useEffect(() => {
    const handleMouseUp = () => {
      setIsResizing(false);
    };

    const handleMouseMove = (event) => {
      if (isResizing) {
        //setWidth(event.clientX);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);


  const handleMouseDown = (event) => {
    //setIsResizing(true);
  };

  return (

    <>
      <div
        className="resizable"
        style={{ width: `${width}px`, border: '1px solid #000', position: 'relative' }}
      >
        <div
          className="resizer"
          style={{
            width: '10px',
            height: '100%',
            position: 'absolute',
            top: 0,
            right: 0,
            cursor: 'col-resize',
          }}
          onMouseDown={handleMouseDown}
        ></div>
        <h5><FontAwesomeIcon icon={'cubes'} /> Objets</h5>
        <Button variant="success" size="sm"><FontAwesomeIcon icon={'refresh'} onClick={handleRefreshObjectsList} /></Button>

        <GameObjectsTreeView gameObjects={gameObjects} />
        <AddObjectModal show={false} />
      </div>



      {/* <div className="tree-bar">

        </div> */}
    </>
  );
};

export default GameObjectsTreeBar;