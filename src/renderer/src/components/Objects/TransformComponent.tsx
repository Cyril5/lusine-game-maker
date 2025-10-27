import { useEffect, useRef, useState } from "react";
import { Button, Form } from "react-bootstrap";
import LGM3DEditor from "@renderer/editor/LGM3DEditor";

const TransformComponent = ({ gameObjectId }) => {
    const editor = LGM3DEditor.getInstance();
    const gameObjectRef = useRef<any>(null);
    const [pos, setPos] = useState({ x: 0, y: 0, z: 0 });
    const [editPos, setEditPos] = useState({ x: "0", y: "0", z: "0" });
    const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Pour stocker les observables et pouvoir les détacher au changement d’objet
    const localObsRef = useRef<any>(null);
    const worldObsRef = useRef<any>(null);

    // ────────────────────────────────────────────────
    // Synchronise depuis le GameObject sélectionné
    // ────────────────────────────────────────────────
    useEffect(() => {
        const go = editor.selectedGameObject;

        // Nettoie les observables de l'ancien objet
        if (localObsRef.current) localObsRef.current.remove();
        if (worldObsRef.current) worldObsRef.current.remove();

        if (go) {
            gameObjectRef.current = go;
            syncFromGameObject();

            // Observe les changements locaux (position, rotation, scale)
            localObsRef.current = go.onLocalTransformChanged.add(() => {
                // Important : Babylon peut spammer → pas besoin de debounce ici,
                // on se contente de rafraîchir les champs.
                syncFromGameObject();
            });

            // Optionnel : observe aussi les changements mondiaux (ex: parent bouge)
            worldObsRef.current = go.onWorldTransformChanged.add(() => {
                syncFromGameObject();
            });
        }

        // Cleanup auto quand le composant se démonte ou quand la sélection change
        return () => {
            if (localObsRef.current) localObsRef.current.remove();
            if (worldObsRef.current) worldObsRef.current.remove();
        };
    }, [gameObjectId]);

    // ────────────────────────────────────────────────
    // Fonction pour lire la position Babylon
    // ────────────────────────────────────────────────
    const syncFromGameObject = () => {
        const go = gameObjectRef.current;
        if (!go) return;
        const p = go.localPosition;
        const next = { x: p.x, y: p.y, z: p.z };
        // On met un nouvel objet pour forcer le rerender
        setPos(next);
        setEditPos({
            x: String(next.x),
            y: String(next.y),
            z: String(next.z),
        });
    };

    // ────────────────────────────────────────────────
    // Commit vers le moteur (débouoncé)
    // ────────────────────────────────────────────────
    const commitPosition = (nx: number | null, ny: number | null, nz: number | null) => {
        const go = gameObjectRef.current;
        if (!go) return;

        const p = go.localPosition;
        const newX = nx ?? p.x;
        const newY = ny ?? p.y;
        const newZ = nz ?? p.z;

        const eps = 1e-6;
        if (
            Math.abs(newX - p.x) < eps &&
            Math.abs(newY - p.y) < eps &&
            Math.abs(newZ - p.z) < eps
        )
            return;

        go.setLocalPosition(newX, newY, newZ);
        // La synchro visuelle se fera automatiquement via l’observable.
    };

    // ────────────────────────────────────────────────
    // Gestion de la saisie (débouoncée)
    // ────────────────────────────────────────────────
    const scheduleCommit = (axis: "x" | "y" | "z", raw: string) => {
        setEditPos((prev) => ({ ...prev, [axis]: raw }));
        if (raw === "" || raw === "-") return;

        const n = parseFloat(raw);
        if (Number.isNaN(n)) return;

        if (commitTimer.current) clearTimeout(commitTimer.current);
        commitTimer.current = setTimeout(() => {
            if (axis === "x") commitPosition(n, null, null);
            else if (axis === "y") commitPosition(null, n, null);
            else commitPosition(null, null, n);
        }, 150);
    };

    // ────────────────────────────────────────────────
    // Commit immédiat sur ENTER
    // ────────────────────────────────────────────────
    const onKeyDown = (axis: "x" | "y" | "z") => (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            const raw = editPos[axis];
            const n = parseFloat(raw);
            if (!Number.isNaN(n)) {
                if (commitTimer.current) clearTimeout(commitTimer.current);
                if (axis === "x") commitPosition(n, null, null);
                else if (axis === "y") commitPosition(null, n, null);
                else commitPosition(null, null, n);
            } else {
                // Restaure la valeur valide si entrée incorrecte
                setEditPos((prev) => ({ ...prev, [axis]: String(pos[axis]) }));
            }
        }
    };

    // ────────────────────────────────────────────────
    // Commit sur sortie du champ
    // ────────────────────────────────────────────────
    const onBlur = (axis: "x" | "y" | "z") => () => {
        const raw = editPos[axis];
        const n = parseFloat(raw);
        if (Number.isNaN(n)) {
            setEditPos((prev) => ({ ...prev, [axis]: String(pos[axis]) }));
        } else {
            if (commitTimer.current) clearTimeout(commitTimer.current);
            if (axis === "x") commitPosition(n, null, null);
            else if (axis === "y") commitPosition(null, n, null);
            else commitPosition(null, null, n);
        }
    };

    // ────────────────────────────────────────────────
    // Reset
    // ────────────────────────────────────────────────
    const resetPosition = () => {
        commitPosition(0, 0, 0);
    };

    // ────────────────────────────────────────────────
    // Rendu JSX
    // ────────────────────────────────────────────────
    return (
        <>
            <Button variant="danger" size="sm" onClick={resetPosition}>
                Réinitialiser la position locale
            </Button>

            <div className="transform-positions">
                <p className="x-axis">
                    X{" "}
                    <Form.Control
                        type="number"
                        value={editPos.x}
                        onChange={(e) => scheduleCommit("x", e.target.value)}
                        onKeyDown={onKeyDown("x")}
                        onBlur={onBlur("x")}
                    />
                </p>

                <p className="y-axis">
                    Y{" "}
                    <Form.Control
                        type="number"
                        value={editPos.y}
                        onChange={(e) => scheduleCommit("y", e.target.value)}
                        onKeyDown={onKeyDown("y")}
                        onBlur={onBlur("y")}
                    />
                </p>

                <p className="z-axis">
                    Z{" "}
                    <Form.Control
                        type="number"
                        value={editPos.z}
                        onChange={(e) => scheduleCommit("z", e.target.value)}
                        onKeyDown={onKeyDown("z")}
                        onBlur={onBlur("z")}
                    />
                </p>
            </div>
        </>
    );
};

export default TransformComponent;
