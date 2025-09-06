import { useRef, useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { darcula } from '@uiw/codemirror-theme-darcula';

import '../assets/css/states-editor.scss';

import Blockly from 'blockly';
import { TypedVariableModal } from '@blockly/plugin-typed-variable-modal';
import toolboxXml from '../assets/blocks/toolbox.xml?raw'; // ?raw to import as string
import LusineBlocksDarkTheme from '../engine/blocks/themes/lusine-gm-dark'
import '../engine/blocks/blocksDefs';
import { javascriptGenerator } from 'blockly/javascript';
//import '@blockly/block-plus-minus';
import * as Fr from 'blockly/msg/fr';
import { Button, Col, Container, Dropdown, Offcanvas, Row } from 'react-bootstrap';
import StateFilesTreeView from '@renderer/components/StateFilesTreeView';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { EditorAlertType } from '@renderer/components/EditorAlert';
import FileManager from '@renderer/engine/lgm3D.FileManager';
import { IStateFile } from '@renderer/engine/FSM/IStateFile';
import StateEditorUtils from '@renderer/editor/StateEditorUtils';
import EditorUtils from '@renderer/editor/EditorUtils';
import CustomPrompt from '@renderer/components/StatesEditor/CustomPrompt';
import { pythonGenerator } from 'blockly/python';

//const serializer: Blockly.serialization.blocks.BlockSerializer = new Blockly.serialization.blocks.BlockSerializer();

const StateEditor = (statefiles = StateEditorUtils.getStatesFiles(), resizeWorkspace = true, ...props: any) => {


    const [currentStateFile, setCurrentStateFile] = useState<IStateFile>(props.initStateFile); // IStateFile
    const [mapStateFiles, setMapStateFiles] = useState<Map<string,IStateFile> | null>(null);
    const [showOutputCodeModal, setShowOutputCodeModal] = useState(false);

    const blocklyDivRef = useRef(null);
    const blocklyAreaRef = useRef(null);
    const workspaceRef = useRef(null); //: Blockly.WorkspaceSvg;

    const [code, setCode] = useState("");


    const onresize = () => {
        // Compute the absolute coordinates and dimensions of blocklyArea.
        let element: any = blocklyAreaRef.current;
        if (element) {
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
            Blockly.svgResize(workspaceRef.current);
        }
    };

    //vérifier si l'onglet 3 est sélectionné lorsque la propriétée resizeWorkspace change
    useEffect(() => {
        console.log(workspaceRef.current);
        if (resizeWorkspace && workspaceRef.current) {
            onresize();
        }
    }, [resizeWorkspace]);

    useEffect(() => {
        // console.log(StateEditorUtils.statesFiles());
        setMapStateFiles(StateEditorUtils.getStatesFiles());
    }, [statefiles]);


    // Lorsque la propriétée initStateFile du composant a changé
    useEffect(() => {
        if (props.initStateFile) {
            setCurrentStateFile(props.initStateFile);
            openStateFile(props.initStateFile);
        }
    }, [props.initStateFile]);

    let inputField;
    useEffect(() => {

        console.log("use effect state editor");

        workspaceRef.current = Blockly.inject(blocklyDivRef.current, {
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
                colour: '',
                snap: true,
            },
            zoom: {
                controls: true,
                wheel: false,
                startScale: 1,
                maxScale: 3,
                minScale: 0.3,
                scaleSpeed: 1.2
            },
            move: {
                scrollbars: {
                    horizontal: true,
                    vertical: true
                },
                drag: true,
                wheel: true,
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

            if (event.type == Blockly.Events.BLOCK_MOVE || event.type == Blockly.Events.BLOCK_CHANGE) {

                updateCodeFromCodeEditor();

            }

            // AUTO SAVE
            // if (event.type == Blockly.Events.BLOCK_MOVE) {
            //     if (store.currentFSM.value.getBaseState().filename != '') {
            //         saveWorkspace();
            //     }
            // }
        }

        workspaceRef.current.addChangeListener(onChangeWorkspace);
        const typedVarModal = new TypedVariableModal(workspaceRef.current, 'callbackName', [["Nombre", "Number"], ["Texte", "String"], ["Booléen", "Boolean"]]);
        typedVarModal.init();

        workspaceRef.current.registerToolboxCategoryCallback('CREATE_TYPED_VARIABLE', createFlyout);


        /** Override Blockly.dialog.setPrompt() with custom implementation. 
        */
        Blockly.dialog.setPrompt(function (message, defaultValue, callback) {

            show('Prompt', message, {
                showInput: true,
                showOkay: true,
                onOkay: function () {
                    callback(inputField.value);
                },
                showCancel: true,
                onCancel: function () {
                    callback(null);
                },
            });
            inputField.value = defaultValue;
        });

    }, []); // Le deuxième argument est un tableau de dépendances. Si le tableau est vide, l'effet ne se déclenchera qu'une seule fois lors du premier rendu du composant.

    // const blocklyStyle = {
    //     width: "100%",
    //     height: "50vh",
    // }
    Blockly.setLocale(Fr);

    const createFlyout = (workspace) => {
        let xmlList = [];
        // Add your button and give it a callback name.
        const button: HTMLButtonElement = document.createElement('button');
        button.setAttribute('text', 'Créer une variable');
        button.setAttribute('callbackKey', 'callbackName');

        xmlList.push(button);

        // This gets all the variables that the user creates and adds them to the
        // flyout.
        const blockList: Element[] = Blockly.VariablesDynamic.flyoutCategoryBlocks(workspace);
        xmlList = xmlList.concat(blockList);
        return xmlList;
    };

    const updateCodeFromCodeEditor = () => {
        //javascriptGenerator.addReservedWords('code');
        const lang : string = 'javascript'; // ou 'python'
        
        const code: string = javascriptGenerator.workspaceToCode(workspaceRef.current);
        //const code = pythonGenerator.workspaceToCode(workspaceRef.current);
        
        if (lang == 'javascript' && code !== "") {
            //setCode(currentStateFile.outputCode);
            const updatedCode = code.replace(/\bvar\b/g, 'let'); // Remplacez toutes les occurrences de "var" par "let"
        }
        console.log(code);
        setCode(code);
    }


    const openStateFile = (stateFile: IStateFile): void => {

        try {
            FileManager.readTextFile(stateFile.filename, (xmlFile) => {

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
                const jsonDom: Element = Blockly.utils.xml.textToDom(xmlFile);
                Blockly.Xml.clearWorkspaceAndLoadFromXml(jsonDom, workspaceRef.current);
                Blockly.Events.enable();

                onresize();

                setCurrentStateFile(stateFile);
                updateCodeFromCodeEditor();

            });
        } catch (error) {
            console.error(error);
            Editor.showAlert(`Une erreur c'est produite pendant l'ouverture de ${currentStateFile.filename} \n\n ${error}`);
        }
    }

    const openPromptNewStateFile = (): void => {
        // ouvrir une fenêtre pour créer le fichier
        EditorUtils.openInputDialog({
            title: "Créer un nouveau fichier d'état",
            message: 'Hello !',
            label: 'Nom:',
            value: 'NouvelEtat',
            inputAttrs: { type: 'text', required: true },
            type: 'input',
            buttonsLabel: { ok: 'Ajouter', cancel: 'Annuler' }
        }, (response) => {
            if (response) {
                const regexStateFileName: RegExp = /^[A-Za-z0-9]*$/;
                if (regexStateFileName.test(response)) {

                    // Génération du nouveau fichier d'état.
                    StateEditorUtils.createStateFile(response);

                } else {
                    Editor.showAlert("Le nom du fichier n'est pas valide. \n\nCe dernier ne pas doit contenir de caractère spéciaux ni d'espace "
                        , EditorAlertType.Error, () => {
                            openPromptNewStateFile();
                        }
                    );
                }
                console.log('result', response);
            }
        }, (error) => {
            console.error(error);
        });
    }

    const newWorkspace = (): void => {

        if (currentStateFile) {
            const { dialog } = require('@electron/remote');

            const options = {
                type: 'warning',
                title: `Confirmation avant création fichier d'état`,
                message: `Voulez vous enregistrer le fichier d'état : ${currentStateFile} avant d'en créer un nouveau ?`,
                buttons: ['Oui', 'Non', 'Annuler'],
                defaultId: 2,
                cancelId: 2,
            };

            const saveBeforeNewResponse = EditorUtils.showMsgDialog(options);
            switch (saveBeforeNewResponse) {
                case 0: //yes
                    saveWorkspace();
                    break;
                case 2: //annuler
                    return;
                    break;
            }
        }

        openPromptNewStateFile();

    }


    const saveWorkspace = (): void => {

        currentStateFile.outputCode = code;

        try {
            //const content = JSON.stringify(serializer.save(workspace));

            // Convertir l'espace de travail en nœud DOM
            const xmlDom = Blockly.Xml.workspaceToDom(workspaceRef.current);

            // Convertir le nœud DOM en chaîne de texte XML
            const content = Blockly.Xml.domToPrettyText(xmlDom);

            console.log(content);
            FileManager.writeInFile(currentStateFile.filename, content);

            // Mis à jour du code dans le fichier
            FileManager.writeInFile(currentStateFile.codeFilename, currentStateFile.outputCode);

        } catch (e) {
            Editor.showAlert(`Une erreur c'est produite pendant la sauvegarde de StateA :\n\n ${e}`, EditorAlertType.Error,);
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

    let backdropDiv_;
    let dialogDiv_;

    /** Hides any currently visible dialog. */
    const hide = () => {
        if (backdropDiv_) {
            backdropDiv_.style.display = 'none';
            dialogDiv_.style.display = 'none';
        }
    };

    /**
 * Shows the dialog.
 * Allowed options:
 *  - showOkay: Whether to show the OK button.
 *  - showCancel: Whether to show the Cancel button.
 *  - showInput: Whether to show the text input field.
 *  - onOkay: Callback to handle the okay button.
 *  - onCancel: Callback to handle the cancel button and backdrop clicks.
 */
    const show = (title, message, options) => {
        let backdropDiv = backdropDiv_;
        let dialogDiv = dialogDiv_;
        if (!dialogDiv) {
            // Generate HTML
            backdropDiv = document.createElement('div');
            backdropDiv.id = 'customDialogBackdrop';
            backdropDiv.style.cssText =
                'position: absolute;' +
                'color: black;' +
                'top: 0; left: 0; right: 0; bottom: 0;' +
                'background-color: rgba(0, 0, 0, 0.7);' +
                'z-index: 100;';
            document.body.appendChild(backdropDiv);

            dialogDiv = document.createElement('div');
            dialogDiv.id = 'customDialog';
            dialogDiv.style.cssText =
                'background-color: #fff;' +
                'color: black;' +
                'width: 400px;' +
                'margin: 20px auto 0;' +
                'padding: 10px;';
            backdropDiv.appendChild(dialogDiv);

            dialogDiv.onclick = function (event) {
                event.stopPropagation();
            };

            backdropDiv_ = backdropDiv;
            dialogDiv_ = dialogDiv;
        }
        backdropDiv.style.display = 'block';
        dialogDiv.style.display = 'block';

        dialogDiv.innerHTML =
            '<header class="customDialogTitle"></header>' +
            '<p class="customDialogMessage"></p>' +
            (options.showInput ? '<div><input id="customDialogInput"></div>' : '') +
            '<div class="customDialogButtons">' +
            (options.showCancel ? '<button id="customDialogCancel">Cancel</button>' : '') +
            (options.showOkay ? '<button id="customDialogOkay">OK</button>' : '') +
            '</div>';
        dialogDiv.getElementsByClassName('customDialogTitle')[0]
            .appendChild(document.createTextNode(title));
        dialogDiv.getElementsByClassName('customDialogMessage')[0]
            .appendChild(document.createTextNode(message));

        const onOkay = (event) => {
            hide();
            options.onOkay && options.onOkay();
            event && event.stopPropagation();
        };
        const onCancel = (event) => {
            hide();
            options.onCancel && options.onCancel();
            event && event.stopPropagation();
        };

        const dialogInput = document.getElementById('customDialogInput');
        inputField = dialogInput;
        if (dialogInput) {
            dialogInput.focus();

            dialogInput.onkeyup = (event) => {
                if (event.key === 'Enter') {
                    // Process as OK when user hits enter.
                    onOkay(null);
                    return false;
                } else if (event.key === 'Escape') {
                    // Process as cancel when user hits esc.
                    onCancel(null);
                    return false;
                }
            };
        } else {
            var okay = document.getElementById('customDialogOkay');
            okay && okay.focus();
        }

        if (options.showOkay) {
            document.getElementById('customDialogOkay')!.addEventListener('click', onOkay);
        }
        if (options.showCancel) {
            document.getElementById('customDialogCancel')!.addEventListener('click', onCancel);
        }

        backdropDiv.onclick = onCancel;
    };

    /**
* Supprime le fichier d'état actuel.
*/
    const deleteFile = (): void => {

        const confirm = EditorUtils.showMsgDialog({
            message: `Voulez vous supprimer le fichier d'état : ${currentStateFile.name} du projet (Emplacement : ${currentStateFile.filename}) ? \n Cette action est non réversible.`,
            type: 'warning',
            buttons: ['Oui', 'Non'],
            defaultId: 1,
            title: "Confirmation avant suppression",
        });

        if (confirm === 0) {
            FileManager.deleteFile(currentStateFile.codeFilename, () => {
                
                FileManager.deleteFile(currentStateFile.filename, () => {
                    StateEditorUtils.removeStateFile(currentStateFile.name);
                    setMapStateFiles(StateEditorUtils.getStatesFiles());
                    EditorUtils.showInfoMsg(`Le fichier d'état ${currentStateFile.filename} a été supprimé du projet`, "Fichier d'état supprimé")
                    setCurrentStateFile(null);
                });
            });

        }
    }


    return (
        <>
            <CustomPrompt />
            <Container fluid>
                <p> {currentStateFile ? currentStateFile.filename : 'Aucun fichier ouvert'}</p>

                <Row>

                    <Col>{/* <table>
                <tr>
                <td id="blocklyArea" ref={blocklyAreaRef}>
                </td>
                </tr>
            </table> */}
                        <Button variant='primary' size='lg' onClick={newWorkspace} ><FontAwesomeIcon icon="file"></FontAwesomeIcon></Button>

                        <Button variant='warning' size="lg" onClick={saveWorkspace} disabled={!currentStateFile}><FontAwesomeIcon icon="save"></FontAwesomeIcon></Button>

                        <Button variant='danger' size="lg" onClick={deleteFile} disabled={!currentStateFile}><FontAwesomeIcon icon="remove"></FontAwesomeIcon></Button>

                        <div id="blocklyArea" ref={blocklyAreaRef}>
                            Si ce message s'affiche : Redimensionner la fenêtre pour afficher l'espace de travail
                            <br />ou sélectionnez un fichier d'état dans la liste à droite de l'écran.
                        </div>

                        <div id="blocklyDiv" ref={blocklyDivRef} />
                    </Col>
                    <Col md={2}>
                        <div className='state-files-buttons'>
                            {mapStateFiles && Array.from(mapStateFiles).map(([key, value]) => (
                                <Button key={key} onClick={() => openStateFile(value as IStateFile)}>
                                    {(value as IStateFile).name}
                                </Button>
                            ))}
                        </div>
                    </Col>

                </Row>
            </Container>



            <Button variant="secondary" className="me-2" onClick={() => setShowOutputCodeModal(true)}>
                <FontAwesomeIcon icon="code" />
            </Button>
            <Offcanvas placement="bottom" scroll backdrop={false} onHide={() => setShowOutputCodeModal(false)} show={showOutputCodeModal} {...props}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Code sortie<FontAwesomeIcon icon="code" /></Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <CodeMirror
                        id="command-area"
                        value={code}
                        theme={darcula}
                        height="200px"
                        extensions={[javascript({ jsx: false })]}
                        readOnly={true}
                    />
                </Offcanvas.Body>
            </Offcanvas>



            {/* <Button onClick={handleExecuteCommand}>Executer</Button> */}



        </>
    );
}
export default StateEditor


