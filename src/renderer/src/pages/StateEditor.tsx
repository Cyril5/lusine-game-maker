import React, { useRef, useEffect, useState } from 'react';
import CodeMirror, { useCodeMirror } from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { darcula } from '@uiw/codemirror-theme-darcula';

import '../assets/css/states-editor.scss';

import Blockly from 'blockly';
import toolboxXml from '../assets/blocks/toolbox.xml?raw'; // ?raw to import as string
import LusineBlocksDarkTheme from '../engine/blocks/themes/lusine-gm-dark'
import '../engine/blocks/blocksDefs';
import {javascriptGenerator} from 'blockly/javascript';
import '@blockly/block-plus-minus';
import * as Fr from 'blockly/msg/fr';
import { Col, Container, Row } from 'react-bootstrap';
import StateFilesTreeView from '@renderer/components/StateFilesTreeView';

let workspace: Blockly.WorkspaceSvg;

const StateEditor = (props) => {

    const [currentState, setCurrentState] = useState(undefined);
    
    const blocklyDivRef = useRef(null);
    const blocklyAreaRef = useRef(null);
    
    const [code, setCode] = useState("");
    
    let blocklyReady: boolean = false;

    const onresize = (e) => {
        // Compute the absolute coordinates and dimensions of blocklyArea.
        let element = blocklyAreaRef.current;
        let x = 0;
        let y = 0;
        do {
            x += element.offsetLeft;
            y += element.offsetTop;
            element = element.offsetParent;
        } while (element);
        // Position blocklyDiv over blocklyArea.
        blocklyDivRef.current.style.left = x + 'px';
        blocklyDivRef.current.style.top = y + 'px';
        blocklyDivRef.current.style.width = blocklyAreaRef.current.offsetWidth + 'px';
        blocklyDivRef.current.style.height = blocklyAreaRef.current.offsetHeight + 'px';
        Blockly.svgResize(workspace);
    };

    //vérifier si l'onglet 3 est sélectionné lorsque la propriétée resizeWorkspace change
    useEffect(() => {
        if (props.resizeWorkspace && workspace !== undefined) {
          onresize();
        }
      }, [props.resizeWorkspace]);
    
    useEffect(() => {
        console.log("use effect state editor");

        workspace = Blockly.inject(blocklyDivRef.current, {
            theme: LusineBlocksDarkTheme,
            // toolbox: `
            //   <xml>
            //     <block type="controls_if"></block>
            //     <block type="controls_repeat_ext"></block>
            //     <block type="logic_compare"></block>
            //     <block type="math_number"></block>
            //     <block type="math_arithmetic"></block>
            //     <block type="text"></block>
            //     <block type="text_print"></block>
            //   </xml>
            // `
            toolbox: toolboxXml,
            grid: {
                spacing: 25,
                length: 3,
                colour: '#ccc',
                snap: true,
            },
            zoom: {
                controls: true,
                wheel: true,
                startScale: 1,
                maxScale: 3,
                minScale: 0.3,
                scaleSpeed: 1.2
            },
            collapse: true,
            comments: true,
            disable: true,
            maxBlocks: Infinity,
            trashcan: true,
            toolboxPosition: 'start',
            css: true,
            // media : 'https://blockly-demo.appspot.com/static/media/',
            rtl: false,
            scrollbars: true,
            oneBasedIndex: true
        });
        window.addEventListener('resize', onresize, false);
        onresize();

        const onChangeWorkspace = (event: { type: string; }) => {

            //BlocklyJS.addReservedWords('code');
            const code : string = javascriptGenerator.workspaceToCode(workspace);
            
            if(code !== "") {
                setCode(code);
                this.currentState.outputCode = code;
                console.log(code);
            }


            // AUTO SAVE
            // if (event.type == Blockly.Events.BLOCK_MOVE) {
            //     if (store.currentFSM.value.getBaseState().filename != '') {
            //         saveWorkspace();
            //     }
            // }
        }

        workspace.addChangeListener(onChangeWorkspace);


        blocklyReady = true;

    }, []); // Le deuxième argument est un tableau de dépendances. Si le tableau est vide, l'effet ne se déclenchera qu'une seule fois lors du premier rendu du composant.

    // const blocklyStyle = {
    //     width: "100%",
    //     height: "50vh",
    // }
    Blockly.setLocale(Fr);



    const onChangeCode = React.useCallback((value, viewUpdate) => {
        //console.log('value:', value);
    }, []);

    const [data, setData] = useState([{
        id: 1,
        title: "StateA",
        children: [

        ]
    }]);


    return (
        <>
            <Container fluid>
                <Row>
                    <Col>{/* <table>
                <tr>
                    <td id="blocklyArea" ref={blocklyAreaRef}>
                    </td>
                    </tr>
                </table> */}

                        <div id="blocklyArea" ref={blocklyAreaRef}>
                            Si ce message s'affiche : Redimensionner la fenêtre pour afficher l'espace de travail.
                        </div>

                        <div id="blocklyDiv" ref={blocklyDivRef} />
                    </Col>
                    <Col  md={2}>
                        <StateFilesTreeView data={data}/>
                    </Col>
                </Row>
            </Container>


            <CodeMirror
                id="command-area"
                value={code}
                theme={darcula}
                height="200px"
                extensions={[javascript({ jsx: false })]}
                onChange={onChangeCode}
            />



            {/* <Button onClick={handleExecuteCommand}>Executer</Button> */}



        </>
    );
}
export default StateEditor