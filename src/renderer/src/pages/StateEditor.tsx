import React, { useRef, useEffect, useState } from 'react';
import CodeMirror, { useCodeMirror } from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { darcula } from '@uiw/codemirror-theme-darcula';

import '../assets/css/states-editor.scss';

import Blockly from 'blockly';
import toolboxXml from '../assets/blocks/toolbox.xml?raw'; // ?raw to import as string
import LusineBlocksDarkTheme from '../engine/blocks/themes/lusine-gm-dark'
import '../engine/blocks/blocksDefs';
import { javascriptGenerator } from 'blockly/javascript';
import '@blockly/block-plus-minus';
import * as Fr from 'blockly/msg/fr';
import { Button, Col, Container, Row } from 'react-bootstrap';
import StateFilesTreeView from '@renderer/components/StateFilesTreeView';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Editor from '@renderer/components/Editor';
import { EditorAlert, EditorAlertType } from '@renderer/components/EditorAlert';
import FileManager from '@renderer/engine/FileManager';
import { IStateFile } from '@renderer/engine/FSM/IStateFile';

const serializer: Blockly.serialization.blocks.BlockSerializer = new Blockly.serialization.blocks.BlockSerializer();
let workspace: Blockly.WorkspaceSvg;

const StateEditor = (props: any) => {

    // Code copié à mettre dans une endroit global
    // const os = require('os');
    // const path = require('path');
    // const documentsPath = os.homedir() + '\\Documents\\Lusine Game Maker\\MonProjet';
    // let stateFilesDirectory = path.resolve(documentsPath, 'States');

    const [currentStateFile, setCurrentState] = useState(props.initStateFile); // IStateFile

    const blocklyDivRef = useRef(null);
    const blocklyAreaRef = useRef(null);

    const [code, setCode] = useState("");



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

    // Lorsque la propriétée initStateFile du composant a changé
    useEffect(() => {
        if (props.initStateFile) {
            // console.log(props.initStateFile);
            setCurrentState(props.initStateFile);
            openStateFile(props.initStateFile);
        }
    }, [props.initStateFile]);

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
            sounds: false,
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

            if (event.type == Blockly.Events.BLOCK_MOVE) {

                updateCodeFromCodeEditor();

            }

            // AUTO SAVE
            // if (event.type == Blockly.Events.BLOCK_MOVE) {
            //     if (store.currentFSM.value.getBaseState().filename != '') {
            //         saveWorkspace();
            //     }
            // }
        }

        workspace.addChangeListener(onChangeWorkspace);

    }, []); // Le deuxième argument est un tableau de dépendances. Si le tableau est vide, l'effet ne se déclenchera qu'une seule fois lors du premier rendu du composant.

    // const blocklyStyle = {
    //     width: "100%",
    //     height: "50vh",
    // }
    Blockly.setLocale(Fr);

    const updateCodeFromCodeEditor = () => {
        //javascriptGenerator.addReservedWords('code');
        const code: string = javascriptGenerator.workspaceToCode(workspace);
        if (code !== "") {
            //setCode(currentStateFile.outputCode);
            setCode(code);
        }
    }

    const openStateFile = (stateFile: IStateFile): void => {

        try {
            FileManager.readFile(stateFile.filename, (xmlFile) => {

                // Charger les blocs depuis un fichier JSON
                //     const xml = `<xml xmlns="https://developers.google.com/blockly/xml">
                //     <block type="state_onupdatestate" id="=2I,Vk7*J.TR~d/IVv0V" x="13" y="88"></block>
                //   </xml>`;
                // const json = {
                //     "type": "workspace",
                //     "id": "workspaceID",
                //     "xml": xml
                // }; // Remplacer par le contenu du fichier JSON

                //workspace.clear();
                Blockly.Events.disable(); // Désactiver les événements pour éviter les collisions d'ID
                const jsonDom: Element = Blockly.Xml.textToDom(xmlFile);
                Blockly.Xml.clearWorkspaceAndLoadFromXml(jsonDom, workspace);
                Blockly.Events.enable();

                setCurrentState(stateFile);
                updateCodeFromCodeEditor();

            });
        } catch (error) {
            console.error(error);
            Editor.showAlert(`Une erreur c'est produite pendant l'ouverture de ${currentStateFile.filename} \n\n ${error}`);
        }
    }

    const saveWorkspace = (): void => {

        currentStateFile.outputCode = code;

        try {
            //const content = JSON.stringify(serializer.save(workspace));

            // Convertir l'espace de travail en nœud DOM
            const xmlDom = Blockly.Xml.workspaceToDom(workspace);

            // Convertir le nœud DOM en chaîne de texte XML
            const content = Blockly.Xml.domToPrettyText(xmlDom);

            console.log(content);
            FileManager.writeInFile(currentStateFile.filename, content);

            // Mis à jour du code dans le fichier
            FileManager.writeInFile(currentStateFile.codeFilename,currentStateFile.outputCode);

        } catch (e) {
            Editor.showAlert(`Une erreur c'est produite pendant la sauvegarde de StateA :\n\n ${e}`, EditorAlertType.Error,);
            console.error(e);
        }
        // fs.writeFile(
        //     Project.getStatesDir() + '/' + currentStateFile.filename, JSON.stringify(json), err => {
        //         if (err) {
        //             Editor.showAlert(EditorAlertType.Error,`Une erreur c'est produite pendant la sauvegarde de StateA :\n\n ${err}`);
        //             console.error(err);
        //             return;
        //         }
        //     }
        // );
        // console.log(code);
    }


    const [data, setData] = useState([{
        id: 1,
        title: "StateA",
        children: [

        ]
    }]);


    return (
        <>
            <Container fluid>
                <Button variant='primary' size="lg" onClick={saveWorkspace}><FontAwesomeIcon icon="save"></FontAwesomeIcon></Button>
                {currentStateFile !== null && <p>{currentStateFile.filename}</p>}

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
                    <Col md={2}>
                        <StateFilesTreeView data={data} />
                    </Col>
                </Row>
            </Container>


            <CodeMirror
                id="command-area"
                value={code}
                theme={darcula}
                height="200px"
                extensions={[javascript({ jsx: false })]}
                readOnly={true}
            />



            {/* <Button onClick={handleExecuteCommand}>Executer</Button> */}



        </>
    );
}
export default StateEditor


