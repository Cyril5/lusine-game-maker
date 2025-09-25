import { useEffect, useMemo, useState } from "react";
import { Button, Card, Dropdown, DropdownButton, Form, Offcanvas } from "react-bootstrap";
import AssetsManager from "@renderer/engine/lgm3D.AssetsManager";
import { ensureMaterialTexturesMeta, getMaterialTexturePath, MaterialMeta, setMaterialTexturePath } from "@renderer/engine/utils/MaterialUtils";

type MaterialModalProps = {
    show: boolean;
    onHide: () => void;
    matId: number | null;                           // <-- primitif + nullable
    onChangeMatId?: (id: number) => void;           // <-- optionnel : changer le matériau
    onSave?: (id: number, newName: string) => void; // <-- optionnel : callback de sauvegarde
};

const MaterialModal = ({ show, onHide, matId, onChangeMatId, onSave }: MaterialModalProps) => {
    const [matName, setMatName] = useState<string>("");
    const [albedoTexturePath, setAlbedoTexturePath] = useState<string>("");

    const material = useMemo(() => (matId != null ? AssetsManager.getMaterialById(matId) : null), [matId]);

    // Sync du nom quand on change de matériau ou quand on ouvre la modal
    useEffect(() => {
        if (material) {
            setMatName(material.name ?? "");
            setAlbedoTexturePath(getMaterialTexturePath(material, "albedo") ?? "");
        } else {
            setMatName("");
            setAlbedoTexturePath("");
        }
    }, [material, show]);

    const handleSelectMaterial = (id: number) => {
        onChangeMatId?.(id);
    };

    const handleSetMaterialName = (event) => {
        const v = event.target.value;
        setMatName(v);
        material!.name = v;
    }

    const handleSaveAlbedoTexture = () => {
        if (!material) return;
        ensureMaterialTexturesMeta(material); // crée metadata/textures si absents
        setMaterialTexturePath(material, "albedo", albedoTexturePath); // normalise & écrit
        // Optionnel: EditorStore.emitMaterialsChanged?.();
    };

    return (
        <Offcanvas
            show={show}
            onHide={onHide}
            placement="end"
            scroll
            backdrop={false}    // mets true si tu veux fermer au clic extérieur
            keyboard            // permet fermeture via Échap
            restoreFocus={false}
        >
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>Éditer matériel</Offcanvas.Title>
                <DropdownButton
                    id="mat-select"
                    title={material ? material.name : "Choisir…"}
                    size="sm"
                    variant="warning"
                    className="ms-2"
                    onSelect={(ek) => {
                        if (ek) handleSelectMaterial(Number(ek));
                    }}
                >
                    {Array.from(AssetsManager._materials.values()).map((m) =>
                        m ? (
                            <Dropdown.Item
                                key={m.uniqueId}
                                eventKey={String(m.uniqueId)}                          // <-- important
                                active={m.uniqueId === material?.uniqueId}             // <-- surbrillance
                            >
                                {m.name}
                            </Dropdown.Item>
                        ) : null
                    )}
                </DropdownButton>
            </Offcanvas.Header>

            <Offcanvas.Body>
                <Form>
                    <Form.Label>Id : {material!.uniqueId}</Form.Label>
                    <Form.Group className="mb-3" controlId="matName">
                        <Form.Label>Nom</Form.Label>
                        <Form.Control
                            type="text"
                            value={matName}                     // <-- champ contrôlé
                            onChange={handleSetMaterialName}
                            placeholder="Nom du matériau"
                            autoFocus
                            disabled={!material}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="texturePath">
                        <Form.Label>Texture Albedo path</Form.Label>
                        <Form.Control type="text" onChange={(e) => setAlbedoTexturePath(e.target.value)} value={albedoTexturePath} disabled={!material} />
                        <Button variant="primary" onClick={handleSaveAlbedoTexture}>Enregistrer</Button>
                    </Form.Group>

                    <div className="d-flex gap-2">
                        <Button variant="danger" className="ms-auto" disabled={!material}>
                            Supprimer le matériau
                        </Button>
                    </div>
                </Form>

                <hr />

                <Card style={{ width: "10rem" }}>
                    <Card.Img variant="top" src="https://place-hold.it/1024" />
                    <Card.Body>
                        <Card.Text>No texture yet</Card.Text>
                    </Card.Body>
                </Card>
                <p>Vous pouvez fermer ce panneau avec la touche Echap</p>
            </Offcanvas.Body>
        </Offcanvas>
    );
};

export default MaterialModal;

