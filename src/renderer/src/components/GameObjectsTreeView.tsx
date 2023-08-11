import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DndProvider, MultiBackend, Tree, getBackendOptions } from '@minoru/react-dnd-treeview';
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Button } from 'react-bootstrap';

const initialData =[
  {
    "id": 1,
    "parent": 0,
    "droppable": true,
    "text": "Folder 1"
  },
  {
    "id": 2,
    "parent": 1,
    "text": "File 1-1"
  },
  {
    "id": 3,
    "parent": 1,
    "text": "File 1-2"
  },
  {
    "id": 4,
    "parent": 0,
    "droppable": true,
    "text": "Folder 2"
  },
  {
    "id": 5,
    "parent": 4,
    "droppable": true,
    "text": "Folder 2-1"
  },
  {
    "id": 6,
    "parent": 5,
    "text": "File 2-1-1"
  }
];


const GameObjectsTreeView = () => {
  const [treeData, setTreeData] = useState(initialData);
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
            <Button variant='secondary'>
              {node.text}
            </Button>
          </div>
        )}
      />
    </DndProvider>
  );
            };
export default GameObjectsTreeView;