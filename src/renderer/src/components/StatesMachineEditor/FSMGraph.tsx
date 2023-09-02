import React, { useEffect } from 'react';
import Drawflow from 'drawflow';
import 'drawflow/dist/drawflow.min.css';
import '../../assets/css/fsm-graph.scss';
import FSMNode from './FSMNode';
import ReactDOMServer from 'react-dom/server';

const FSMGraph = () => {

  const MAIN_OUTPUT_SOURCE_NODE = 'output_1';
  const MAIN_INPUT_TARGET_NODE = 'input_1';

  const getNodeOutput = (node)=> {
    return node.outputs[MAIN_OUTPUT_SOURCE_NODE];
  }
  const getNodeInput = (node)=>{
    return node.inputs[MAIN_INPUT_TARGET_NODE];
  }

  const setStartNodeConnectionData = (targetNode,inputId,outputId)=>{
    
  }

  useEffect(() => {
    const container = document.getElementById('drawflow-container');
    const editor = new Drawflow(container);
    editor.start();


    const data = { "name": '' };

    const startNodeData = {
      "connection": { // la connexion unique lié au startNode
        "output_id": 1,
        "input_id": 2, // l'id du noeud cible
      },
    };

    editor.addNode('start-node', 0, 1, 100, 200, 'start-node', startNodeData, 'Start');

    // const test = ReactDOMServer.renderToString(<FSMNode />);
    editor.addNode('state-node', 1, 1, 400, 300, 'bar', data, 'State A');
    editor.addNode('state-node', 1, 1, 400, 100, '', data, 'State B');

    editor.addConnection(1, 2, MAIN_OUTPUT_SOURCE_NODE, MAIN_INPUT_TARGET_NODE);


    editor.on('connectionStart', ({ output_id, output_class }) => {
      
    })

    

    editor.on('connectionCreated', ({ output_id, input_id, output_class, input_class }) => {

      const startNode = editor.getNodeFromId(1);

      if (editor.getNodeFromId(1).outputs[MAIN_OUTPUT_SOURCE_NODE].connections.length > 1) {

        console.log("suppression de l'ancien lien (start node avec : "+editor.getNodeFromId(1).data.connection.input_id);
        editor.removeSingleConnection(
          startNode.id, 
          editor.getNodeFromId(1).data.connection.input_id, // id de la destination 
          MAIN_OUTPUT_SOURCE_NODE,MAIN_INPUT_TARGET_NODE
          );

          editor.updateNodeDataFromId(1,{
            "connection": {
            "input_id": input_id,
            "output_id": output_id,
            }
          });
          
          console.log(editor.getNodeFromId(1).data);
        
      }else{

        // première liaison du startNode

        if(editor.getNodeFromId(1).outputs[MAIN_OUTPUT_SOURCE_NODE].connections.length == 0)
          return;

          console.log("first link");

        // mettre à jour le nouveau noeud relié au start
    
        editor.updateNodeDataFromId(1,{
          "connection": {
          //"node": editor.getNodeFromId(firstNodeLinkedId),
          "input_id": input_id,
          "output_id": output_id,
          }
        });
        
        console.log(editor.getNodeFromId(1).data);

      }
    });

    // return () => {
    //   editor.clear();
    // };

  }, []);

  return <div id="drawflow-container" style={{ width: '100%', height: '60vh', border: 'wheat 1px solid' }}></div>;
};


export default FSMGraph;