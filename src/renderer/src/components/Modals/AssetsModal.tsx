import React, { useState, useRef, useEffect } from "react";
import { Offcanvas } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const AssetsModal = (props) => {
  const [show, setShow] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const modalRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizing) {
        const deltaY = startY - e.clientY;
        const newHeight = startHeight + deltaY;
        modalRef.current.dialog.style.height = `${newHeight}px`;
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
  }, [isResizing, startY, startHeight]);

  const handleMouseDown = (e) => {
    setIsResizing(true);
    setStartY(e.clientY);
    setStartHeight(modalRef.current.dialog.offsetHeight);
  };

  return (
    <Offcanvas
      ref={modalRef}
      placement="bottom"
      scroll
      backdrop={false}
      show={show}
      {...props}
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>
          Objets <FontAwesomeIcon icon="cubes" />
        </Offcanvas.Title>
        <div
          className="resize-handle-n bg-warning"
          style={{ cursor: "ns-resize" }}
          onMouseDown={handleMouseDown}
        ></div>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <div className="testModal">
          <p>Contenu du modal ici</p>
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default AssetsModal;