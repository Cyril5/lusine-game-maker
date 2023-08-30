import React, { useEffect } from 'react';
import Drawflow from 'drawflow';
import 'drawflow/dist/drawflow.min.css';
import '../../assets/css/fsm-graph.scss';
import FSMNode from './FSMNode';
import ReactDOMServer from 'react-dom/server';

const FSMGraph = () => {
  useEffect(() => {
    const container = document.getElementById('drawflow-container');
    const editor = new Drawflow(container);
    editor.start();


var data = { "name": '' };


const startNode = editor.addNode('start-node', 0, 1, 100, 200, 'start-node', data, 'Start');


// const test = ReactDOMServer.renderToString(<FSMNode />);
// editor.addNode('node0', 1, 1, 400, 100, '', data, test);
editor.addNode('node1', 1, 1, 400, 300, 'bar', data, 'State A');

editor.addConnection(1, 2, "output_1", "input_1");
//editor.addConnection(1, 3, "output_1", "input_1");

    return () => {
      editor.clear();
    };
  }, []);

  return <div id="drawflow-container" style={{ width: '100%', height: '60vh',border: 'wheat 1px solid' }}></div>;
};


export default FSMGraph;