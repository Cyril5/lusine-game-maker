import React, { useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
//import Drawflow from 'drawflow';
//import Drawflow from '../../../src/assets/drawflow-modified.js';
//import 'drawflow/dist/drawflow.min.css';
//import '../../assets/css/fsm-graph.scss';

import * as Vis from 'vis-network';
import 'vis-network/styles/vis-network.min.css';

import State from '@renderer/engine/FSM/StateOld';
import { FiniteStateMachine } from '@renderer/engine/FSM/lgm3D.FiniteStateMachineOLD';
import EditorUtils from '@renderer/editor/EditorUtils';


const FSMGraph = forwardRef(({fsm,...props}, ref) => {

  const START_NODE_ID = '_START_NODE_ID_';

  const MAIN_OUTPUT_SOURCE_NODE = 'output_1';
  const MAIN_INPUT_TARGET_NODE = 'input_1';

  const visjsNetworkRef = useRef<Vis.Network>(null);
  const drawflowRef = useRef(null);
  const selectedNodeRef = useRef(null);
  const currentFSMRef = useRef<FiniteStateMachine>(fsm);


  const addNode = (nodeData, callback) => {

    console.log(currentFSMRef.current.states);

    nodeData.id = currentFSMRef.current.states.length;
    nodeData.label = 'Nouvel Etat';
    currentFSMRef.current.addState('Nouvel Etat');
    callback(nodeData);

  }

  const updateSelectedNode = (name): void => {

    const network = visjsNetworkRef.current;
    // TODO mettre le container en ref
    network!.body.data.nodes.update({id: network!.getSelectedNodes()[0],label:name});

  }

  const setStartStateNode = (edgeData, callback, targetNode): void => {

    const network = visjsNetworkRef.current;

    edgeData.arrows = 'to';
    callback(edgeData); // Création du lien
    const startNodeLinks = network!.getConnectedEdges(START_NODE_ID);
    const startNodeDestination = network!.getConnectedNodes(START_NODE_ID)[0];

    let nodeToUpdate = { id: startNodeDestination, color: { background: '#97C2FC', } };
    network!.body.data.nodes.update(nodeToUpdate);
    network!.body.data.edges.remove(startNodeLinks[0]); // suppression du lien précédent

    nodeToUpdate = { id: edgeData.to, color: { background: 'orange' } };
    network.body.data.nodes.update(nodeToUpdate);

    // Définir le nouveau état de départ quand on démarra le fsm
    const startState = nodeToUpdate.id;
    currentFSMRef.current.setState(currentFSMRef.current.states[startState]);

    console.log(currentFSMRef.current.currentState.name);
  }

  // Exposez la méthode du parent dans ce composant
  useImperativeHandle(ref, () => ({
    addNode,
    updateSelectedNode
  }));

  // Lorsque le fsm du parent à changé
  useEffect(() => {
    currentFSMRef.current = fsm;
    console.log("FSM changed !");
    console.log(visjsNetworkRef.current?.getViewPosition());
    visjsNetworkRef.current?.fit();
  }, [fsm])

  useEffect(() => {
    const container = document.getElementById('graph-container');
    const data = {
      nodes: [
        { id: START_NODE_ID, label: 'START', x: 0, y: 0 },
        { id: 0, label: 'State A', x: 150, y: 0 },
      ],
      edges: [
        { from: START_NODE_ID, to: 0, arrows: 'to' }, // Flèche allant de INIT à STATE_1
      ]
    };

    const locales = {
      en: {
        edit: 'Edit',
        del: 'Supprimer état',
        back: 'Back',
        addNode: 'Ajouter un état',
        addEdge: 'Ajouter une transition',
        editNode: '',
        editEdge: '',
        addDescription: 'Click in an empty space to place a new node.',
        edgeDescription: 'Click on a node and drag the edge to another node to connect them.',
        editEdgeDescription: 'Click on the control points and drag them to a node to connect to it.',
        createEdgeError: 'Cannot link edges to a cluster.',
        deleteClusterError: 'Clusters cannot be deleted.',
        editClusterError: 'Clusters cannot be edited.'
      }
    }

    const options = {
      locale: 'en',
      locales: locales,
      edges: {
        smooth: {
          enabled: false,
        }
      },
      nodes: {
        shape: 'box',
        shadow: false,
        color: {
          border: 'white',
          highlight: {
            background: 'yellow',
            border: 'red',
          }
        },
        scaling: {
          min: 100,
          max: 100
        },
        margin: {
          top: 10,
          left: 25,
          right: 25,
          bottom: 10,
        },

      },
      manipulation: {
        enabled: true,
        initiallyActive: true,
        addNode: (nodeData, callback) => {
          addNode(nodeData, callback);
        },
        deleteNode: (nodeData, callback)=> {

          if(visjsNetworkRef.current.body.data.nodes.length < 3) {
            callback(null)
            return;
          }

          if (nodeData.nodes[0] == START_NODE_ID) {
            EditorUtils.showWarnMsg('Vous ne pouvez pas supprimer le nœud "START" !');
            callback(null); // Annuler la suppression
          } else {
            callback(nodeData); // Autoriser la suppression des autres nœuds
          }
        },
        deleteEdge: (edgeData,callback)=>{

        },
        addEdge: (edgeData, callback) => {

          setStartStateNode(edgeData, callback, null);

          // if (edgeData.from === 1 && edgeData.to === 2) {
          //   alert("Vous ne pouvez pas lier le noeud avec l'id 1 vers le noeud avec l'id 2 !");
          //   callback(null); // Annuler la création du lien
          // } else {
          //   edgeData.arrows = 'to';
          //   callback(edgeData);
          // }
        },
      },
      physics: {
        enabled: false
      }
    };

    visjsNetworkRef.current = new Vis.Network(container, data, options);

    const network = visjsNetworkRef.current;

    // setInterval(()=>{
    //   visjsNetworkRef.current!.moveTo({position:{x:0,y:0}});
    // },2000)

    const startNode = {
      id: START_NODE_ID,
      color: { background: 'green' },
      font: { color: 'white' },

    };
    network.body.data.nodes.update(startNode);

    var isRightClicking = false; // Indique si le clic droit de la souris est enfoncé
    var prevMousePos = { x: 0, y: 0 }; // Position précédente de la souris

    // Ajouter un gestionnaire d'événements pour le clic sur un noeud
    network.on("click", function (params) {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        if (nodeId == START_NODE_ID)
          return;
        // Faites ce que vous voulez avec le noeud cliqué ici

        //sélectionner l'état et envoyer l'info au StatesMachineEditor
        props.onStateSelect(currentFSMRef.current.states[nodeId]);
      }
    });

    // Écouter l'événement mousedown sur le conteneur du graphique
    container.addEventListener('mousedown', function (event) {
      if (event.button === 2) { // Vérifier si c'est le bouton droit de la souris
        isRightClicking = true; // Le clic droit de la souris est enfoncé
        prevMousePos = { x: event.clientX, y: event.clientY }; // Enregistrer la position initiale de la souris
        event.preventDefault(); // Empêcher le comportement par défaut du navigateur
      }
    });

    // Écouter l'événement mousemove sur le document pour suivre les mouvements de la souris
    document.addEventListener('mousemove', function (event) {
      return;
      if (isRightClicking) { // Si le clic droit de la souris est enfoncé
        var deltaX = event.clientX - prevMousePos.x; // Calculer le déplacement horizontal de la souris
        var deltaY = event.clientY - prevMousePos.y; // Calculer le déplacement vertical de la souris
        var currentViewPosition = network.getViewPosition(); // Obtenir la position actuelle du viewport
        var newViewPosition = { x: currentViewPosition.x - deltaX, y: currentViewPosition.y - deltaY }; // Calculer la nouvelle position du viewport

        network.moveTo({ position: newViewPosition, animation: false }); // Déplacer le viewport sans animation
        prevMousePos = { x: event.clientX, y: event.clientY }; // Mettre à jour la position précédente de la souris
        event.preventDefault(); // Empêcher le comportement par défaut du navigateur
      }
    });

    //Écouter l'événement mouseup sur le document pour détecter quand le clic droit de la souris est relâché
    document.addEventListener('mouseup', function (event) {
      if (event.button === 2) { // Vérifier si c'est le bouton droit de la souris
        isRightClicking = false; // Le clic droit de la souris n'est plus enfoncé
        event.preventDefault(); // Empêcher le comportement par défaut du navigateur
      }
    });

    visjsNetworkRef.current!.fit();
































    // const container: HTMLElement | null = document.getElementById('drawflow-container');
    // drawflowRef.current = new Drawflow(container);

    // const drawflow: Drawflow = drawflowRef.current;
    // drawflow.start();


    // const data = { "name": '', "stateIndex": 0 };

    // const startNodeData = {
    //   "connection": { // la connexion unique lié au startNode
    //     "output_id": 1,
    //     "input_id": 2, // l'id du noeud cible
    //   },
    // };

    // drawflow.addNode('start-node', 0, 1, 100, 200, 'start-node', startNodeData, 'START');

    // // const test = ReactDOMServer.renderToString(<FSMNode />);
    // drawflow.addNode('state-node', 1, 1, 400, 300, 'state-node', data, 'Nouvel Etat');



    // drawflow.addConnection(1, 2, MAIN_OUTPUT_SOURCE_NODE, MAIN_INPUT_TARGET_NODE);

    // drawflow.on('nodeRemoved', (id) => {
    //   currentFSMRef.current.removeState(selectedNodeRef.current.data.stateIndex);
    //   if (id == 1) {
    //     const n = drawflow.addNode('start-node', 0, 1, 100, 200, 'start-node', startNodeData, 'START');
    //     //container.querySelector('#node-'+n).id = 'node-1';
    //     //drawflow.getNodeFromId(n).id = 1;
    //   }
    // });

    // // Si une connection a été enlevé 
    // drawflow.on('connectionRemoved', ({ output_id, input_id, output_class, input_class }) => {
    //   const startNode = drawflow.getNodeFromId(1);
    //   if (output_id == '1' && startNode.outputs[MAIN_OUTPUT_SOURCE_NODE].connections.length == 0) {
    //     currentFSMRef.current.setState(null);
    //     EditorUtils.showMsgDialog({ type: 'warning', message: "L'Automate Fini n'a pas d'état de départ." });
    //   }
    // });

    // // Lors de la sélection d'un noeud
    // drawflow.on('nodeSelected', (id) => {
    //   console.log(id);
    //   selectedNodeRef.current = drawflow.getNodeFromId(id);

    //   if (id > 1) {
    //     // sélectionner l'état et envoyer l'info au StatesMachineEditor
    //     props.onStateSelect(currentFSMRef.current.states[selectedNodeRef.current.data.stateIndex]);
    //   }
    // });



    // drawflow.on('connectionCreated', ({ output_id, input_id, output_class, input_class }) => {

    //   const sourceNode = drawflow.getNodeFromId(output_id);
    //   const targetNode = drawflow.getNodeFromId(input_id);
    //   // Si c'est le début du lien est le startNode
    //   if (sourceNode.id == '1') {
    //     setStartStateNode({ sourceNode, targetNode });
    //     return;
    //   }
    //   // autre liaison différente du startNode


    // });

    // return () => {
    //   drawflow.clear();
    // };

  }, []);

  //return <div id="drawflow-container" style={{ width: '100%', height: '60vh', border: 'wheat 1px solid' }}></div>;
  return <div id="graph-container" style={{ height: '60vh', border: 'wheat 1px solid' }}></div>
});


export default FSMGraph;