import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { GameObject } from "../engine/GameObject";
import Editor from "./Editor";

const Node = ({ children, title , level, gameObjectId }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div style={{ marginLeft: level * 5 }}>
      {((level !== 0 || !children)) && (
        <Button size="sm" variant="outline-primary" onClick={() => setIsVisible(!isVisible)}>{isVisible ? '-' : '+'}</Button>
        )}
        <button onClick={()=>handleTest(gameObjectId)}>{title}</button>
      {isVisible && <div>{children}</div>}
    </div>
  );
};

const handleTest=(gameObjectId)=> {

  Editor.getInstance().selectGameObject(gameObjectId);

}

const TreeView = ({ data, level = 0}) => {
  return (
    <div>
      {data.map((node) => (
        <Node key={node.id} title={node.title} level={level + 1} gameObjectId={node.gameObjectId}>
          {node.children ? (
            <TreeView data={node.children} level={level + 1} />
          ) : (
            <div>No children</div>
          )}
        </Node>
      ))}
    </div>
  );
};

export default TreeView;