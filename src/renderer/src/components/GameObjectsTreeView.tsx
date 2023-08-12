import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DndProvider, MultiBackend, Tree, getBackendOptions } from '@minoru/react-dnd-treeview';
import { GameObject } from '@renderer/engine/GameObject';
import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Button } from 'react-bootstrap';
import Editor from './Editor';

const initialData = [
  {
    "id": 1,
    "parent": 0,
    "droppable": true,
    "text": "Folder 1",
    "data": {
      "type" : "GameObject"
    }
  },
  {
    "id": 2,
    "parent": 1,
    "text": "File 1-1",
    "data": {
      "type" : "GameObject"
    }
  },
  {
    "id": 3,
    "parent": 1,
    "text": "File 1-2",
    "data": {
      "type" : "GameObject"
    }
  },
  {
    "id": 4,
    "parent": 0,
    "droppable": true,
    "text": "Folder 2",
    "data": {
      "type" : "GameObject"
    }
  },
  {
    "id": 5,
    "parent": 4,
    "droppable": true,
    "text": "Folder 2-1",
    "data": {
      "type" : "GameObject"
    }
  },
  {
    "id": 6,
    "parent": 5,
    "text": "File 2-1-1",
    "data": {
      "type" : "GameObject"
    }
  }
];


const GameObjectsTreeView = (props: any) => {
  const [treeData, setTreeData] = useState(initialData);

  useEffect(() => {
    if(props.gameObjects) {
      console.log(props.gameObjects);
  
        setTreeData(props.gameObjects);
    }

  }, [props.gameObjects])

  const handleDrop = (newTreeData) => setTreeData(newTreeData);

  return (
    <DndProvider backend={MultiBackend} options={getBackendOptions()}>
      <Tree
        tree={treeData}
        rootId={0}
        onDrop={handleDrop}
        render={(node, { depth, isOpen, onToggle }) => (
          <div style={{ marginLeft: depth * 10 }}>
            {node.droppable && (
              <span onClick={onToggle}><FontAwesomeIcon icon={isOpen ? 'minus' : 'plus'}></FontAwesomeIcon> </span>
            )}
            <Button variant={node.data.type=='ProgrammableObject' ? 'warning': 'secondary'} onClick={()=>Editor.getInstance().selectGameObject(node.id)}>
              <FontAwesomeIcon icon={node.data.type=='Model3D' ? 'cube' : 'bug'}></FontAwesomeIcon>
              {node.text}
            </Button>
          </div>
        )}
      />
    </DndProvider>
  );
};
export default GameObjectsTreeView;