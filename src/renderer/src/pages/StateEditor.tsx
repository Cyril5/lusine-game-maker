import React, { useRef, useEffect, useState } from 'react';
import CodeMirror, { useCodeMirror } from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { darcula } from '@uiw/codemirror-theme-darcula';
import { ClassAPITest } from '../engine/ClassAPITest';
import { GameObject } from '../engine/GameObject';

import Blockly from 'blockly';
import toolboxXml from '../assets/blocks/toolbox.xml?raw'; // ?raw to import as string
import LusineBlocksDarkTheme from '../engine/blocks/themes/lusine-gm-dark'
import '../engine/blocks/blocksDefs';
import '@blockly/block-plus-minus';
import * as Fr from 'blockly/msg/fr';

const StateEditor = ({ initialXml, onChange }) => {

    const blocklyDivRef = useRef(null);

    const [getCode, setCode] = useState("");


    useEffect(() => {
        console.log("use effect state editor");
        const workspace = Blockly.inject(blocklyDivRef.current, {
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

    },[]); // Le deuxième argument est un tableau de dépendances. Si le tableau est vide, l'effet ne se déclenchera qu'une seule fois lors du premier rendu du composant.

    const blocklyStyle = {
        width: "100%",
        height: "50vh",
    }

    Blockly.setLocale(Fr);

   

      const onChangeCode = React.useCallback((value, viewUpdate) => {
        //console.log('value:', value);
      }, []);

    return (
        <>


                    <div id="blocklyDiv" ref={blocklyDivRef} style={blocklyStyle} />
                    <CodeMirror
                        id="command-area"
                        // value={getCode}
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