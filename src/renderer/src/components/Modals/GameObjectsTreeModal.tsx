import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import { Button, Offcanvas } from "react-bootstrap";
import GameObjectsTreeView from "../GameObjectsTreeView";
import AddObjectModal from "../AddObjectModal";
import LGM3DEditor from "@renderer/editor/LGM3DEditor";

const GameObjectsTreeModal = (props: any) => {

  const {gameobjectslist} = props;

  const [show, setShow] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const modalRef = useRef(null);

  const handleRefreshObjectsList = (event): void => {
    LGM3DEditor.getInstance().updateObjectsTreeView();
  }

  useEffect(()=>{
    setShow(props.show);
  },[props.show])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizing) {
        const deltaX = e.clientX - startX;
        const newWidth = startWidth + deltaX;
        modalRef.current.dialog.style.width = `${newWidth}px`;
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, startX, startWidth]);

  const handleMouseDown = (e) => {
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(modalRef.current.dialog.offsetWidth);
  };


  return (
    <>

      <Offcanvas className={"objects-tree-modal"}
        ref={modalRef}
        placement="left"
        scroll
        backdrop={false}
        show={show}
        {...props}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            Scene Graph <FontAwesomeIcon icon="cubes" />
          </Offcanvas.Title>
          <div
            className="resize-handle-e"
            style={{ cursor: "ew-resize" }}
            onMouseDown={handleMouseDown}
          ></div>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <h5><FontAwesomeIcon icon={'cubes'} /> Objets</h5>
          <Button variant="success" size="sm"><FontAwesomeIcon icon={'refresh'} onClick={handleRefreshObjectsList} /></Button>
          <GameObjectsTreeView gameobjectslist={gameobjectslist} />
          <AddObjectModal show={false} />
        </Offcanvas.Body>
      </Offcanvas>

    </>
  );
};

export default GameObjectsTreeModal;