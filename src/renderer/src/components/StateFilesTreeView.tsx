import React, { useState } from "react";
import { Button } from "react-bootstrap";
import Editor from "./Editor";

const Node = ({ children, title , level}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div style={{ marginLeft: level * 5 }}>
      {((level !== 0 || !children)) && (
        <Button size="sm" variant="outline-primary" onClick={() => setIsVisible(!isVisible)}>{isVisible ? '-' : '+'}</Button>
        )}
        <button>{title}</button>
      {isVisible && <div>{children}</div>}
    </div>
  );
};

const StateFilesTreeView = ({ data, level = 0}) => {
  return (
    <div>
      {data.map((node) => (
        <Node key={node.id} title={node.title} level={level + 1}>
          {node.children ? (
            <StateFilesTreeView data={node.children} level={level + 1} />
          ) : (
            <div>No children</div>
          )}
        </Node>
      ))}
    </div>
  );
};

export default StateFilesTreeView;