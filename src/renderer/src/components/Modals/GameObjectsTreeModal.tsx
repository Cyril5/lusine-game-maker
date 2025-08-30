import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import { Button, Offcanvas } from "react-bootstrap";
import GameObjectsTreeView from "../GameObjectsTreeView";
import AddObjectModal from "../AddObjectModal";
import LGM3DEditor from "@renderer/editor/LGM3DEditor";

const GameObjectsTreeModal = (props: any) => {

  const { gameobjectslist } = props;

  const [show, setShow] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const modalRef = useRef(null);

  const handleRefreshObjectsList = (event): void => {
    console.log("refresh objects list");
    LGM3DEditor.getInstance().updateObjectsTreeView();
  }

  useEffect(() => {
    setShow(props.show);
  }, [props.show])

  return (
    <>
      {/* <Button variant="success" size="sm"><FontAwesomeIcon icon={'refresh'} onClick={handleRefreshObjectsList} /></Button>
      <GameObjectsTreeView gameobjectslist={gameobjectslist} />
      <AddObjectModal show={false} /> */}

      <Button variant="success" size="sm"><FontAwesomeIcon icon={'refresh'} onClick={handleRefreshObjectsList} /></Button>
      <Button variant="primary" size="sm"><FontAwesomeIcon icon={'plus'}/></Button>
      <GameObjectsTreeView/>
      <AddObjectModal show={false} />
    </>
  );
};

export default GameObjectsTreeModal;