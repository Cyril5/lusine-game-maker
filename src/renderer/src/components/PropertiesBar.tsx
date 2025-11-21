import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Accordion, Button, Form } from "react-bootstrap";

import { FSMComponent } from "./Objects/FSMComponent";
import "@renderer/assets/css/properties-bar.scss";
import TransformComponent from "./Objects/TransformComponent";
import { GameObject } from "@renderer/engine/GameObject";
import ColliderComponent from "./Objects/ColliderComponent";
import PhysicComponent from "./Objects/PhysicComponent";
import { Rigidbody } from "@renderer/engine/physics/lgm3D.Rigidbody";
import LGM3DEditor from "@renderer/editor/LGM3DEditor";
import { FiniteStateMachine } from "@renderer/engine/FSM/lgm3D.FiniteStateMachine";
import Collider from "@renderer/engine/physics/lgm3D.Collider";

type PropertiesBarProps = {
    id?: number | string;
    gameobject_name?: string;
    parentid?: number | string;
};

/**
 * Inspector / Panneau de propriétés
 * - Ne reçoit que l'ID en props (pas de GameObject pour éviter les gros objets React)
 * - Récupère le GameObject courant via LGM3DEditor
 * - Affiche Transform / Collider / Rigidbody / FSM selon les composants existants
 */
const PropertiesBar = ({ id, gameobject_name = "", parentid }: PropertiesBarProps) => {
    const editor = LGM3DEditor.getInstance();

    // nom éditable dans le formulaire
    const [name, setName] = useState<string>(gameobject_name ?? "");
    // simple "version" pour forcer un re-render quand on ajoute/supprime un composant
    const [version, setVersion] = useState(0);

    // --- Récupération du GameObject à partir de l'ID / sélection ---
    let go: GameObject | null = null;
    if (id != null) {
        const selected = editor.selectedGameObject as GameObject | null;
        // On suppose que l'id passé correspond à Id ou uniqueId du GameObject
        if (selected && (selected as any).Id == id || (selected as any).uniqueId == id) {
            go = selected;
        } else {
            go = selected; // fallback : on ne bloque pas l'UI
        }
    }

    // --- Sync du nom quand on change d'objet ---
    useEffect(() => {
        if (go) {
            setName(go.name ?? "");
        } else {
            setName(gameobject_name ?? "");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, version]);

    // --- Présence des composants (on recalcule à chaque render, c'est léger) ---
    const hasCollider = go?.getComponent(Collider);
    const hasRigidbody = go?.getComponent(Rigidbody);
    const hasFSM = go?.getComponents(FiniteStateMachine);

    // --- Handlers ---

    const handleSetGameObjectName = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setName(newName);
        if (!go) return;
        go.name = newName;
    };

    const handleAddRigidbody = () => {
        go!.addComponent("Rigidbody", new Rigidbody(go!, go!.scene));
    };

    // Déparenter l'objet sélectionné
    const handleUnparent = () => {
        LGM3DEditor.getInstance().selectedGameObject!.setParent(null);
        LGM3DEditor.getInstance().updateObjectsTreeView();
    }

    const handleSelectParent = () => {
        LGM3DEditor.getInstance().selectGameObject(go!.parent.Id);
    }

    // const handleAddFSM = () => {
    //     if (!go || hasFSM) return;
    //     (go as any).addComponent?.(FiniteStateMachine ?? ProgrammableGameObject);
    //     setVersion(v => v + 1);
    // };

    // const handleRemoveComponent = (componentCtor: any) => {
    //     if (!go) return;
    //     const comp = go.getComponentOfType?.(componentCtor);
    //     if (!comp) return;
    //     (go as any).removeComponent?.(comp);
    //     setVersion(v => v + 1);
    // };

    // --- UI ---

    // Aucun objet sélectionné
    if (!id) {
        return (
            <div className="properties-bar properties-bar--empty">
                <p>
                    <FontAwesomeIcon icon="info-circle" /> Aucun objet sélectionné.
                </p>
                <p>Sélectionne un GameObject dans la hiérarchie pour voir ses propriétés.</p>
            </div>
        );
    }

    return (
        <div className="properties-bar">
            <Accordion defaultActiveKey={["0", "1"]} alwaysOpen className="small-acc">
                {/* Onglet Objet */}
                <Accordion.Item eventKey="0">
                    <Accordion.Header>Objet</Accordion.Header>
                    <Accordion.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Nom</Form.Label>
                            <Form.Control
                                type="text"
                                onChange={handleSetGameObjectName}
                                value={name}
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <div className="text-muted small">
                                    ID : <code>{String(id)}</code>
                                </div>
                                { go && go?.parent && (
                                    <>
                                    Parent:
                                    <Button variant="primary" size="sm" onClick={handleSelectParent}>{go?.parent.Id}</Button>
                                    <Button onClick={handleUnparent} variant="danger" size="sm" disabled={!go!.parent}>Déparenter</Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </Accordion.Body>
                </Accordion.Item>

                {/* Onglet Transform */}
                <Accordion.Item eventKey="1">
                    <Accordion.Header>Transformations</Accordion.Header>
                    <Accordion.Body>
                        <TransformComponent gameObjectId={id} />
                    </Accordion.Body>
                </Accordion.Item>

                {/* Onglet FSM */}
                {hasFSM && go && (
                    <Accordion.Item eventKey="2">
                        <Accordion.Header>Automates Fini</Accordion.Header>
                        <Accordion.Body>
                            <FSMComponent
                                name={go.getComponent(FiniteStateMachine)?.name}
                                // onRemove={() => handleRemoveComponent(FiniteStateMachine)}
                            />
                        </Accordion.Body>
                    </Accordion.Item>
                )}

                {/* Onglet Collision */}
                {hasCollider && (
                    <Accordion.Item eventKey="3">
                        <Accordion.Header>Collision</Accordion.Header>
                        <Accordion.Body>
                            <ColliderComponent
                                gameObjectId={id}
                                // onRemove={() => handleRemoveComponent(BoxCollider)}
                            />
                        </Accordion.Body>
                    </Accordion.Item>
                )}

                {/* Onglet Physique */}
                <Accordion.Item eventKey="4">
                    <Accordion.Header>Physique</Accordion.Header>
                    <Accordion.Body>
                        {hasRigidbody && (
                            <PhysicComponent
                                gameObjectId={id}
                                // onRemove={() => handleRemoveComponent(Rigidbody)}
                            />
                        )}
                        {!hasRigidbody && (
                            <div className="d-flex flex-column gap-2">
                                <p className="text-muted small mb-1">
                                    Aucun Rigidbody sur cet objet.
                                </p>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={handleAddRigidbody}
                                    disabled={hasRigidbody}
                                >
                                    <FontAwesomeIcon icon="cube" /> Ajouter un corps physique
                                </Button>
                            </div>
                        )}
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>
        </div>
    );
};

export default PropertiesBar;
