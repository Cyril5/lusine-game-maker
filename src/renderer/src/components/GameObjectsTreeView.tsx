import React, { useState } from "react";
import { Button } from "react-bootstrap";
import Editor from "./Editor";

const Node = ({ children, title, level, gameObjectId, onToggle, isExpanded }) => {
  return (
    <div style={{ marginLeft: level * 5 }}>
      {((level !== 0 || !children)) && (
        <Button size="sm" variant="outline-primary" onClick={onToggle}>
          {isExpanded ? "-" : "+"}
        </Button>
      )}
      <button onClick={() => handleTest(gameObjectId)}>{title}</button>
      {isExpanded && <div>{children}</div>}
    </div>
  );
};

const handleTest=(gameObjectId)=> {

  alert(Editor.getInstance());
  Editor.getInstance().selectGameObject(gameObjectId);

}

const TreeView = ({ data, level = 0 }) => {
  const [expandedNodes, setExpandedNodes] = useState([]);

  const handleToggle = (nodeId) => {
    if (expandedNodes.includes(nodeId)) {
      setExpandedNodes(expandedNodes.filter((id) => id !== nodeId));
    } else {
      setExpandedNodes([...expandedNodes, nodeId]);
    }
  };

  return (
    <div>
      {data.map((node) => (
        <Node
          key={node.id}
          title={node.title}
          level={level + 1}
          gameObjectId={node.gameObjectId}
          onToggle={() => handleToggle(node.id)}
          isExpanded={expandedNodes.includes(node.id)}
        >
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