import RendererComponent from "./RendererComponent";

import { Button, ButtonGroup, ButtonToolbar, Col, Container, Row, Tab, Tabs } from 'react-bootstrap';
import PropertiesBar from './PropertiesBar';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import GameObjectsTreeModal from '@renderer/components/Modals/GameObjectsTreeModal';
import ConsoleModal from "@renderer/components/Modals/ConsoleModal";
import AssetsModal from "@renderer/components/Modals/AssetsModal";
import { useEffect, useRef, useState } from "react";
import LGM3DEditor from "@renderer/editor/LGM3DEditor";
import { GameObject } from "@renderer/engine/GameObject";
import { DockDesk } from "@renderer/components/DockDesk";
import { DockableWindowPanel } from "@renderer/components/DockableWindowPanel";
import { DemoTreeView } from "@renderer/components/TreeViewObjects";
import MaterialsList from "@renderer/components/MaterialsList";
import EdgePeekOffcanvas, { FloatingDockTab } from "./EdgePeekOffCanvas";
import { Game } from "@renderer/engine/Game";


const LevelEditor = (props) => {

    const editor = LGM3DEditor.getInstance();

    const [objetJeu, setObjetJeu] = useState<GameObject | null>(null);
    const [gameObjects, setGameObjects] = useState(null);
    const [key, setKey] = useState(1);

    const setTransformMode = (transformMode: string) => {
        editor.setTransformGizmoMode(transformMode);
    }

    type PanelApi = { open: () => void; close: () => void; toggle: () => void; isOpen: () => boolean };

    const [apis, setApis] = useState<Record<string, PanelApi>>({});
    const registerApi = (id: string) => (api: PanelApi) =>
        setApis(prev => ({ ...prev, [id]: api }));

    const tabsConfig = [
        {
            id: "objects",
            label: "Objets",
            title: "Objets (Ctrl+H)",
            placement: "start",
            hotkey: { code: "KeyH", ctrl: true },
            panelWidth: 380,
            tab: { leftPx: 0, topPx: 158, tabWidth: 32, tabHeight: 120 },
            content: <GameObjectsTreeModal gameobjectslist={gameObjects} show={false} />
        },
        {
            id: "properties",
            label: "Propriétées",
            title: "Propriétées (Ctrl+P)",
            placement: "end",
            hotkey: { code: "KeyP", ctrl: true },
            panelWidth: 380,
            tab: { leftPx: "100%", topPx: 158, tabWidth: 32, tabHeight: 120 },
            content: <PropertiesBar id={objetJeu?.Id} gameobject_name={objetJeu?.name} parentid={objetJeu?.transform.parent?.uniqueId} />
        },
        {
            id: "materials",
            label: "Matériaux",
            placement: "bottom",
            title: "Matériaux (Ctrl+E)",
            hotkey: { code: "KeyE", ctrl: true },
            panelWidth: 1920,
            tab: { leftPx: 0, topPx: 500, tabWidth: 32, tabHeight: 120 },
            content: <MaterialsList />
        },
        {
            id: "console",
            label: "Console",
            placement: "bottom",
            title: "Console (F2)",
            hotkey: { code: "KeyF2", ctrl: true },
            panelWidth: 1920,
            tab: { leftPx: 0, topPx: 500, tabWidth: 32, tabHeight: 120 },
            content: <ConsoleModal/>
        },
        // Tu peux en ajouter d’autres (Console, Assets, etc.)
    ];


    useEffect(() => {
    }, []);

    useEffect(() => {
        console.log(props.objJeu);
        if (props.objJeu) {
            setObjetJeu(props.objJeu);
        }

    }, [props.objJeu])


    return (
        <>
            <div className="level-editor">
                <Container fluid={true}>
                    <div className="level-editor-toolbar">
                        <ButtonToolbar aria-label="Toolbar with button groups">
                            <ButtonGroup className="me-2" aria-label="First group">
                                <Button onClick={() => editor.setTransformGizmoMode("TRANSLATE")} variant="secondary"><FontAwesomeIcon icon="arrows-up-down-left-right" /></Button>
                                <Button onClick={() => setTransformMode("ROTATE")} variant="secondary"><FontAwesomeIcon icon="arrows-rotate" /></Button>
                                <Button onClick={() => editor.setTransformGizmoMode("SCALE")} variant="secondary"><FontAwesomeIcon icon="maximize" /></Button>
                                <Button onClick={() => editor.setTransformGizmoMode("BOUND_BOX")} variant="secondary" disabled={true}><FontAwesomeIcon icon="up-right-from-square" /></Button>
                            </ButtonGroup>
                            <ButtonGroup className="me-2" aria-label="Second group">
                                <Button variant="secondary"><FontAwesomeIcon icon="earth-europe" /> Monde</Button>
                                <Button variant="secondary"><FontAwesomeIcon icon="location-crosshairs" /> Local</Button>
                                <Button variant="danger" onClick={() => editor.deleteSelection()}><FontAwesomeIcon icon="trash" /></Button>
                            </ButtonGroup>
                        </ButtonToolbar>
                    </div>
                    <Row>
                        <div className="scene-level-editor">
                            <RendererComponent />
                            <div id="inspector-host" />

                            {tabsConfig.map(t => (
                                <div key={t.id}>
                                    <FloatingDockTab
                                        className={`lgm-tab lgm-tab-${t.id} ${t.placement === 'bottom' ? 'lgm-tab-horizontal' : ''}`}
                                        show={!apis[t.id]?.isOpen?.()}
                                        onClick={() => apis[t.id]?.toggle?.()}
                                        tabWidth={t.tab.tabWidth}
                                        tabHeight={t.tab.tabHeight}
                                        label={t.label}
                                        title={t.title}
                                    />

                                    <EdgePeekOffcanvas
                                        enabled={true}                 // tu peux le lier à !Game.getInstance().isRunning
                                        allowHotkeyInPlay={true}
                                        hotkey={t.hotkey}
                                        widthPx={t.panelWidth}
                                        title={t.label}
                                        backdrop={false}
                                        placement={t.placement}
                                        onRegisterApi={registerApi(t.id)}  // <— chaque panneau enregistre sa propre API
                                    >
                                        {t.content}
                                    </EdgePeekOffcanvas>
                                </div>
                            ))} 
                        </div>
                        <p>(G) Déplacer, (R) Pivoter, (S) Mise à l'échelle, (F) Focus, (Alt+RMB) Tourner autour la sélection, (Num4,5 Pavé numérique) Vue orthographique, (Num0 Pavé numérique) Vue perspective </p>
                    </Row>
                </Container>
            </div>


            {/* <div className="mdiRoot"> */}
            {/* <DockDesk> */}
            {/* <DockableWindowPanel className="panel" id="hierarchy" title="Hierarchy" initialPlacement={{ mode: "dock", zone: "left" }}>
                            <div className="treeViewObjects">
                                <GameObjectsTreeModal gameobjectslist={gameObjects} show={false} />
                            </div>
                        </DockableWindowPanel> */}

            {/* <DockableWindowPanel id="renderer" title="renderer" initialPlacement={{ mode: "dock", zone: "center" }}> */}
            {/* <RendererComponent /> */}
            {/* </DockableWindowPanel> */}

            {/* <DockableWindowPanel id="inspector" title="Inspector" initialPlacement={{ mode: "dock", zone: "right" }}>
                            <PropertiesBar
                                id={objetJeu?.Id}
                                gameobject_name={objetJeu?.name}
                                parentid={objetJeu?.transform.parent?.uniqueId}
                            />
                        </DockableWindowPanel> */}
            {/* <DockableWindowPanel id="south-panel" title="" initialPlacement={{ mode: "dock", zone: "bottom" }}>
                            <Tabs activeKey={key} onSelect={(k) => setKey(k)}>
                                <Tab eventKey={1} title={<span><FontAwesomeIcon icon="cube" />  Materiaux</span>}>
                                    <MaterialsList></MaterialsList>
                                </Tab>
                                <Tab eventKey={2} title={<span><FontAwesomeIcon icon="terminal" />  Console</span>}>
                                    <ConsoleModal></ConsoleModal>
                                </Tab>
                            </Tabs>
                        </DockableWindowPanel> */}
            {/* </DockDesk> */}
            {/* </div> */}
        </>
    );
}
export default LevelEditor