import React, { useEffect,forwardRef, useImperativeHandle, useRef } from 'react';
import Drawflow from 'drawflow';
import 'drawflow/dist/drawflow.min.css';
import '../../assets/css/fsm-graph.scss';
import ReactDOMServer from 'react-dom/server';
import State from '@renderer/engine/FSM/State';
import { FiniteStateMachine } from '@renderer/engine/FSM/FiniteStateMachine';
import EditorUtils from '@renderer/editor/EditorUtils';

const FSMGraph = forwardRef((props,ref) => {

  const MAIN_OUTPUT_SOURCE_NODE = 'output_1';
  const MAIN_INPUT_TARGET_NODE = 'input_1';

  const drawflowRef = useRef(null);
  const selectedNodeRef = useRef(null);
  const currentFSMRef = useRef(props.fsm);

  const getNodeOutput = (node)=> {
    return node.outputs[MAIN_OUTPUT_SOURCE_NODE];
  }
  const getNodeInput = (node)=>{
    return node.inputs[MAIN_INPUT_TARGET_NODE];
  }

  

  const addNode = (state: State)=>{
    const data = {
      "connection": { // la connexion unique lié au startNode
        "output_id": 0,
        "input_id": 0, // l'id du noeud cible
      },
      "stateIndex": props.fsm.states.indexOf(state)
    }
    drawflowRef.current.addNode('state-node', 1, 1, 100, 200, 'state-node', data, state.name);
  }

  const updateSelectedNode = (name) : void=>{
    // TODO mettre le container en ref
    const container = document.getElementById('drawflow-container');
    container.querySelector('#node-'+selectedNodeRef.current.id).querySelector('.drawflow_content_node').innerHTML = name;
    
  }

  const checkStartNodeConnection = ({ sourceNode, targetNode}) : void =>{
    
    console.log("CHECK");
    const drawflow : Drawflow = drawflowRef.current;
    const startNode = drawflow.getNodeFromId(1);

    if (startNode.outputs[MAIN_OUTPUT_SOURCE_NODE].connections.length > 1) {

      console.log("suppression de l'ancien lien (start node avec : "+startNode.data.connection.input_id);
      drawflow.removeSingleConnection(
        startNode.id, 
        startNode.data.connection.input_id, // id de la destination 
        MAIN_OUTPUT_SOURCE_NODE,MAIN_INPUT_TARGET_NODE
        );

        drawflow.updateNodeDataFromId(1,{
          "connection": {
          "input_id": targetNode.id,
          "output_id": sourceNode.id,
          }
        });
        
        console.log(startNode.data);
      
    }else{

      // première liaison du startNode

      if(startNode.outputs[MAIN_OUTPUT_SOURCE_NODE].connections.length == 0)
        return;

        console.log("first link");

      // mettre à jour le nouveau noeud relié au start
  
      drawflow.updateNodeDataFromId(startNode.id,{
        "connection": {
        //"node": editor.getNodeFromId(firstNodeLinkedId),
        "input_id": targetNode.id,
        "output_id": sourceNode.id,
        }
      });

    }

    // Définir le nouveau état de départ quand on démarra le fsm
    const startState : number = targetNode.data.stateIndex;
    currentFSMRef.current.setState(currentFSMRef.current.states[startState]);

    console.log(currentFSMRef.current.currentState.name);
  }

    // Exposez la méthode dans l'API de la référence
    useImperativeHandle(ref, () => ({
      addNode,
      updateSelectedNode
    }));
    
    // Lorsque le fsm du parent à changé
    useEffect(()=>{
      currentFSMRef.current = props.fsm;
    },[props.fsm])

  useEffect(() => {
    const container = document.getElementById('drawflow-container');
    drawflowRef.current = new Drawflow(container);

    const drawflow : Drawflow = drawflowRef.current;
    drawflow.start();


    const data = { "name": '',"stateIndex": 0 };

    const startNodeData = {
      "connection": { // la connexion unique lié au startNode
        "output_id": 1,
        "input_id": 2, // l'id du noeud cible
      },
    };

    drawflow.addNode('start-node', 0, 1, 100, 200, 'start-node', startNodeData, 'Start');

    // const test = ReactDOMServer.renderToString(<FSMNode />);
    drawflow.addNode('state-node', 1, 1, 400, 300, 'state-node', data, 'Nouvel Etat');

    

    drawflow.addConnection(1, 2, MAIN_OUTPUT_SOURCE_NODE, MAIN_INPUT_TARGET_NODE);

    drawflow.on('nodeRemoved',(id)=>{
      currentFSMRef.current.removeState(selectedNodeRef.current.data.stateIndex);
      console.log(currentFSMRef.current);
    });

    // Si une connection a été enlevé 
    drawflow.on('connectionRemoved',({ output_id, input_id, output_class, input_class })=>{
      const startNode = drawflow.getNodeFromId(1);
      if(output_id == '1' && startNode.outputs[MAIN_OUTPUT_SOURCE_NODE].connections.length == 0) {
        currentFSMRef.current.setState(null);
        EditorUtils.showMsgDialog({type:'warning',message:"L'Automate Fini n'a pas d'état de départ."});
      }
    });
    
    // Lors de la sélection d'un noeud
    drawflow.on('nodeSelected',(id)=>{
      selectedNodeRef.current = drawflow.getNodeFromId(id);

      if(id > 1) {
        // sélectionner l'état et envoyer l'info au StatesMachineEditor
        props.onStateSelect(currentFSMRef.current.states[selectedNodeRef.current.data.stateIndex]);
      }
    });



    drawflow.on('connectionCreated', ({ output_id, input_id, output_class, input_class }) => {

      const sourceNode = drawflow.getNodeFromId(output_id);
      const targetNode = drawflow.getNodeFromId(input_id);
      // Si c'est le début du lien est le startNode
      if(sourceNode.id == '1') {
        checkStartNodeConnection({sourceNode, targetNode});
        return;
      }
      // autre liaison différente du startNode


    });

    return () => {
      drawflow.clear();
    };

  }, []);

  return <div id="drawflow-container" style={{ width: '100%', height: '60vh', border: 'wheat 1px solid' }}></div>;
});


export default FSMGraph;