import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DndProvider, MultiBackend, Tree, getBackendOptions } from '@minoru/react-dnd-treeview';
import { GameObject } from '@renderer/engine/GameObject';
import { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import LGM3DEditor from '@renderer/editor/LGM3DEditor';

// const initialData = [
//   {
//     "id": 1,
//     "parent": 0,
//     "droppable": true,
//     "text": "Folder 1",
//     "data": {
//       "type" : "GameObject"
//     }
//   },
//   {
//     "id": 2,
//     "parent": 1,
//     "text": "File 1-1",
//     "data": {
//       "type" : "GameObject"
//     }
//   },
//   {
//     "id": 3,
//     "parent": 1,
//     "text": "File 1-2",
//     "data": {
//       "type" : "GameObject"
//     }
//   },
//   {
//     "id": 4,
//     "parent": 0,
//     "droppable": true,
//     "text": "Folder 2",
//     "data": {
//       "type" : "GameObject"
//     }
//   },
//   {
//     "id": 5,
//     "parent": 4,
//     "droppable": true,
//     "text": "Folder 2-1",
//     "data": {
//       "type" : "GameObject"
//     }
//   },
//   {
//     "id": 6,
//     "parent": 5,
//     "text": "File 2-1-1",
//     "data": {
//       "type" : "GameObject"
//     }
//   }
// ];


const GameObjectsTreeView = (props: any) => {

  const {gameobjectslist} = props; // équivalent à props.gameobjectslist

  const [treeData, setTreeData] = useState(gameobjectslist);

  useEffect(() => {
    if(gameobjectslist) {
        setTreeData(gameobjectslist);
    }

  }, [gameobjectslist])

  const handleDrop = (newTreeData,{ dragSourceId, dropTargetId, dragSource, dropTarget }) => {
    // alert(`${dragSourceId}`);
    // alert(`${dropTargetId}`);

    GameObject.gameObjects.get(dragSourceId).setParent(dropTargetId > 0 ? GameObject.gameObjects.get(dropTargetId) : null);
    setTreeData(newTreeData);
  }

  return (
  //   <DndProvider backend={MultiBackend} options={getBackendOptions()}>
  //   <Tree
  //     tree={treeData}
  //     rootId={0}
  //     render={(node, { depth, isOpen, onToggle }) => (
  //       <div style={{ marginInlineStart: depth * 10 }}>
  //         {node.droppable && (
  //           <span onClick={onToggle}>{isOpen ? "[-]" : "[+]"}</span>
  //         )}
  //         {node.text}
  //       </div>
  //     )}
  //     dragPreviewRender={(monitorProps) => (
  //       <div>{monitorProps.item.text}</div>
  //     )}
  //     onDrop={handleDrop}
  //   />
  // </DndProvider>

    treeData && (
    <DndProvider backend={MultiBackend} options={getBackendOptions()}>
      <Tree
        tree={treeData}
        rootId={0}
        render={(node, { depth, isOpen, onToggle }) => (
          <div style={{ marginLeft: depth * 10 }}>
            {node.droppable && (
              <span onClick={onToggle}><FontAwesomeIcon icon={isOpen ? 'minus' : 'plus'}></FontAwesomeIcon> </span>
            )}
            <Button variant={node.selected ? 'warning': 'secondary'} className='tree-btn' onClick={()=>LGM3DEditor.getInstance().selectGameObject(node.id)}>
              <FontAwesomeIcon icon={node.data.type=='Model3D' ? 'cube' : 'bug'}></FontAwesomeIcon>
              {node.text}
            </Button>
          </div>
        )}
        dragPreviewRender={(monitorProps) => (
          <div>{monitorProps.item.text}</div>
        )}
        onDrop={handleDrop}


      />
    </DndProvider>
    )
  );
};
export default GameObjectsTreeView;