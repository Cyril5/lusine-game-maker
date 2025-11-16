import { useEffect, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import LGM3DEditor from "@renderer/editor/LGM3DEditor";
import Vector3Component, { Vector3Type } from "./Vector3Component";
import { Lgm3DMath } from "@renderer/engine/math/lgm3D.Math";

const TransformComponent = ({ gameObjectId }) => {
    const editor = LGM3DEditor.getInstance();
    const gameObjectRef = useRef<any>(null);

    const [pos, setPos] = useState<Vector3Type>({ x: 0, y: 0, z: 0 });
    const [rot, setRot] = useState<Vector3Type>({ x: 0, y: 0, z: 0 });
    const [scale, setScale] = useState<Vector3Type>({ x: 0, y: 0, z: 0 });

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
                syncFromGameObject();
            });

            // Optionnel : observe aussi les changements mondiaux (ex: parent bouge)
            worldObsRef.current = go.onWorldTransformChanged.add(() => {
                syncFromGameObject();
            });
        }

        // Cleanup auto
        return () => {
            if (localObsRef.current) localObsRef.current.remove();
            if (worldObsRef.current) worldObsRef.current.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameObjectId]);

    // ────────────────────────────────────────────────
    // Fonction pour lire la position Babylon
    // ────────────────────────────────────────────────
    const syncFromGameObject = () => {
        const go = gameObjectRef.current;
        if (!go) return;
        // Position locale
        const p = go.localPosition;
        setPos({ x: p.x, y: p.y, z: p.z });
        // Rotation locale (Euler en radians)
        const r = go.rotation;
        setRot({
            x: Lgm3DMath.radToDeg(r.x),
            y: Lgm3DMath.radToDeg(r.y),
            z: Lgm3DMath.radToDeg(r.z)
        });
        const s = go.scale;
        setScale({ x: s.x, y: s.y, z: s.z });
    };

    // ────────────────────────────────────────────────
    // Commit complet du Vector3 vers le moteur
    // ────────────────────────────────────────────────
    const commitPosition = (next: Vector3Type) => {
        const go = gameObjectRef.current;
        if (!go) return;

        const p = go.localPosition;
        const eps = 1e-6;
        if (
            Math.abs(next.x - p.x) < eps &&
            Math.abs(next.y - p.y) < eps &&
            Math.abs(next.z - p.z) < eps
        ) {
            return;
        }
        go.setLocalPosition(next.x, next.y, next.z);
        // La synchro visuelle se fera automatiquement via l’observable.
    };

    const commitRotation = (nextDeg: { x: number; y: number; z: number }) => {
        const go = gameObjectRef.current;
        if (!go) return;

        // rotation actuelle en radians
        const r = go.rotation;
        // on compare en degrés pour éviter de spammer les notifs
        const currentDeg = {
            x: Lgm3DMath.radToDeg(r.x),
            y: Lgm3DMath.radToDeg(r.y),
            z: Lgm3DMath.radToDeg(r.z),
        };

        const epsDeg = 0.001;
        if (
            Math.abs(nextDeg.x - currentDeg.x) < epsDeg &&
            Math.abs(nextDeg.y - currentDeg.y) < epsDeg &&
            Math.abs(nextDeg.z - currentDeg.z) < epsDeg
        ) {
            return;
        }

        // On envoie en radians au GameObject
        go.setRotationEuler(
            Lgm3DMath.degToRad(nextDeg.x),
            Lgm3DMath.degToRad(nextDeg.y),
            Lgm3DMath.degToRad(nextDeg.z)
        );
    };

    const commitScale = (next: Vector3Type) => {
        const go = gameObjectRef.current;
        if (!go) return;

        const s = go.scale;
        const eps = 1e-6;
        if (
            Math.abs(next.x - s.x) < eps &&
            Math.abs(next.y - s.y) < eps &&
            Math.abs(next.z - s.z) < eps
        ) {
            return;
        }

        go.setScale(next.x, next.y, next.z);
    };

    const resetPosition = () => {
        commitPosition({ x: 0, y: 0, z: 0 });
    };
    const resetRotation = () => {
        commitRotation({ x: 0, y: 0, z: 0 });
    };
    const resetScale = () => {
        commitScale({ x: 1, y: 1, z: 1 });
    };

    return (
        <>
            <Vector3Component
                label="Position"
                value={pos}
                onChange={commitPosition}
                decimals={3}
            />
            <Vector3Component
                label="Rotation"
                value={rot}
                onChange={commitRotation}
                decimals={3}
            />
            <Vector3Component
                label="Échelle"
                value={scale}
                onChange={commitScale}
                decimals={3}
            />
            <Button variant="danger" size="sm" onClick={resetPosition}>
                Réinitialiser la position locale
            </Button>
            <Button variant="danger" size="sm" onClick={resetRotation}>
                Réinitialiser la rotation locale
            </Button>
            <Button variant="danger" size="sm" onClick={resetScale}>
                Réinitialiser l'échelle
            </Button>
        </>
    );
};

export default TransformComponent;
