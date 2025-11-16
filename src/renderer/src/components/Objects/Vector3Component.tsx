import React, { useEffect, useRef, useState } from "react";
import { Form } from "react-bootstrap";

export type Vector3Type = { x: number; y: number; z: number };

interface Vector3ComponentProps {
    /** Label affiché au-dessus (ex: "Position", "Rotation", "Scale") */
    label: string;
    /** Valeur actuelle du vecteur (contrôlé par le parent) */
    value: Vector3Type;
    /** Callback quand une des composantes change */
    onChange: (next: Vector3Type) => void;
    /** Nombre de chiffres après la virgule (par défaut 3) */
    decimals?: number;
}

/**
 * Composant générique pour éditer un Vector3 (x, y, z) :
 * - supporte la saisie temporaire "", "-"
 * - debounce les commits vers onChange
 * - formate les valeurs avec un nombre fixe de décimales
 */
const Vector3Component: React.FC<Vector3ComponentProps> = ({
    label,
    value,
    onChange,
    decimals = 3,
}) => {
    const [edit, setEdit] = useState<{ x: string; y: string; z: string }>({
        x: "0",
        y: "0",
        z: "0",
    });

    const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const formatNumber = (n: number) => {
        if (typeof n !== "number" || !isFinite(n)) return "0";
        return n.toFixed(decimals);
    };

    // Quand la valeur vient de l'extérieur (moteur / autre champ), on resynchronise
    useEffect(() => {
        setEdit({
            x: formatNumber(value.x),
            y: formatNumber(value.y),
            z: formatNumber(value.z),
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value.x, value.y, value.z, decimals]);

    const commitAxis = (axis: "x" | "y" | "z", n: number) => {
        const eps = 1e-6;
        if (Math.abs(n - value[axis]) < eps) return;

        const next: Vector3Type = {
            x: value.x,
            y: value.y,
            z: value.z,
        };
        next[axis] = n;
        onChange(next);
    };

    const scheduleCommit = (axis: "x" | "y" | "z", raw: string) => {
        setEdit((prev) => ({ ...prev, [axis]: raw }));

        // Autoriser les états intermédiaires
        if (raw === "" || raw === "-") return;

        const n = parseFloat(raw);
        if (Number.isNaN(n)) return;

        if (commitTimer.current) clearTimeout(commitTimer.current);
        commitTimer.current = setTimeout(() => {
            commitAxis(axis, n);
        }, 150);
    };

    const onKeyDown =
        (axis: "x" | "y" | "z") => (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                const raw = edit[axis];
                const n = parseFloat(raw);
                if (!Number.isNaN(n)) {
                    if (commitTimer.current) clearTimeout(commitTimer.current);
                    commitAxis(axis, n);
                } else {
                    // Restaure la valeur valide si entrée incorrecte
                    setEdit((prev) => ({
                        ...prev,
                        [axis]: formatNumber(value[axis]),
                    }));
                }
            }
        };

    const onBlur = (axis: "x" | "y" | "z") => () => {
        const raw = edit[axis];
        const n = parseFloat(raw);
        if (Number.isNaN(n)) {
            setEdit((prev) => ({
                ...prev,
                [axis]: formatNumber(value[axis]),
            }));
        } else {
            if (commitTimer.current) clearTimeout(commitTimer.current);
            commitAxis(axis, n);
        }
    };

return (
    <div className="vector3-component">
        <p className="label">{label}</p>

        <div className="axis-row">
            <p className="x-axis">
                X{" "}
                <Form.Control
                    type="number"
                    value={edit.x}
                    onChange={(e) => scheduleCommit("x", e.target.value)}
                    onKeyDown={onKeyDown("x")}
                    onBlur={onBlur("x")}
                />
            </p>

            <p className="y-axis">
                Y{" "}
                <Form.Control
                    type="number"
                    value={edit.y}
                    onChange={(e) => scheduleCommit("y", e.target.value)}
                    onKeyDown={onKeyDown("y")}
                    onBlur={onBlur("y")}
                />
            </p>

            <p className="z-axis">
                Z{" "}
                <Form.Control
                    type="number"
                    value={edit.z}
                    onChange={(e) => scheduleCommit("z", e.target.value)}
                    onKeyDown={onKeyDown("z")}
                    onBlur={onBlur("z")}
                />
            </p>
        </div>
    </div>
);

};

export default Vector3Component;
