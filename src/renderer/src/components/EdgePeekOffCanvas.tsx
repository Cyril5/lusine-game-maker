// EdgePeekOffcanvas.tsx
import { useEffect, useRef, useState } from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import Button from "react-bootstrap/Button";

type OpenGesture = "edge" | "edge+Alt" | "button";

type EdgePeekOffcanvasProps = {
    enabled?: boolean;     // <- désactive le "edge peek" (met à false en Play)
    edgeSizePx?: number;
    widthPx?: number;
    openDelayMs?: number;
    closeDelayMs?: number;
    title?: string;
    backdrop?: boolean;
    openGesture?: OpenGesture; // "edge" | "edge+Alt" | "button"
    hotkey?: { code: string; ctrl?: boolean; alt?: boolean; shift?: boolean }; // ex: Ctrl+H
    allowHotkeyInPlay?: boolean; // si enabled=false, on peut quand même ouvrir via hotkey si true
    children?: React.ReactNode;
    onRegisterApi?: (api: { open: () => void; close: () => void; toggle: () => void; isOpen: () => boolean }) => void;
};

export default function EdgePeekOffcanvas({
    enabled = true,
    edgeSizePx = 8,
    widthPx = 360,
    openDelayMs = 120,
    closeDelayMs = 1000,
    title,
    backdrop = false,
    hotkey = { code: "KeyH", ctrl: true }, // Ctrl+H
    allowHotkeyInPlay = true,
    children,
    onRegisterApi
}: EdgePeekOffcanvasProps) {

    const [show, setShow] = useState(false);
    const [pinned, setPinned] = useState(false);
    const openTimer = useRef<number | null>(null);
    const closeTimer = useRef<number | null>(null);
    const rafLock = useRef(false);
    const isPointerInsidePanel = useRef(false);

    const pointerLocked = () => !!document.pointerLockElement;

    const scheduleOpen = () => {
        if (!enabled || pinned || show || pointerLocked()) return;
        if (openTimer.current) window.clearTimeout(openTimer.current);
        openTimer.current = window.setTimeout(() => setShow(true), openDelayMs);
    };

    const scheduleClose = () => {
        if (pinned || !show) return;
        if (closeTimer.current) window.clearTimeout(closeTimer.current);
        closeTimer.current = window.setTimeout(() => {
            if (!isPointerInsidePanel.current && !pinned) setShow(false);
        }, closeDelayMs);
    };

    // useEffect(() => {
    //     if (!enabled) return; // en Play: pas d’ouverture auto
    //     const onPointerMove = (e: PointerEvent) => {
    //         if (rafLock.current) return;
    //         rafLock.current = true;
    //         requestAnimationFrame(() => {
    //             rafLock.current = false;
    //             if (!isPointerInsidePanel.current) {
    //                 scheduleClose();
    //             }
    //         });
    //     };

    //     window.addEventListener("pointermove", onPointerMove, { passive: true });
    //     return () => window.removeEventListener("pointermove", onPointerMove);
    // }, [enabled, edgeSizePx, show, pinned]);

    // Hotkey (permet d’ouvrir même en Play si allowHotkeyInPlay)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const match =
                e.code === hotkey.code &&
                (!!hotkey.ctrl === e.ctrlKey) &&
                (!!hotkey.alt === e.altKey) &&
                (!!hotkey.shift === e.shiftKey);

            if (!match) return;

            // Si edge peek désactivé (Play), on autorise quand même via hotkey ?
            if (!enabled && !allowHotkeyInPlay) return;

            e.preventDefault();
            setShow(prev => !prev);
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [enabled, hotkey, allowHotkeyInPlay]);

    // Esc ferme si pas épinglé
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && show && !pinned) setShow(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [show, pinned]);

    useEffect(() => {
        return () => {
            if (openTimer.current) window.clearTimeout(openTimer.current);
            if (closeTimer.current) window.clearTimeout(closeTimer.current);
        };
    }, []);

    useEffect(() => {
        if (!onRegisterApi) return;
        const api = {
            open: () => setShow(true),
            close: () => setShow(false),
            toggle: () => setShow(s => !s),
            isOpen: () => show,
        };
        onRegisterApi(api);
    }, [onRegisterApi, show]);

    const onEnterPanel = () => {
        isPointerInsidePanel.current = true;
        if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
    const onLeavePanel = () => {
        isPointerInsidePanel.current = false;
        scheduleClose();
    };

    return (
        <Offcanvas
            placement="start"
            show={show}
            onHide={() => !pinned && setShow(false)}
            backdrop={backdrop}
            scroll
            style={{ width: widthPx }}
            onMouseEnter={onEnterPanel}
            onMouseLeave={onLeavePanel}
        >
            <Offcanvas.Header closeButton={!pinned}>
                <Offcanvas.Title style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {title}
                    <Button
                        size="sm"
                        variant={pinned ? "warning" : "outline-secondary"}
                        onClick={() => setPinned(p => !p)}
                        title={pinned ? "Désépingler" : "Épingler"}
                    >
                        {pinned ? "📌 Épinglé" : "📍 Épingler"}
                    </Button>
                </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>{children}</Offcanvas.Body>
        </Offcanvas>
    );
}

type FloatingHierarchyTabProps = {
    onClick: () => void;
    show?: boolean;        // afficher le tab ?
    topPx?: number;        // position verticale (ex: 120)
    title?: string;        // tooltip
};

export function FloatingHierarchyTab({
    onClick,
    show = true,
    topPx = 120,
    title = "Hiérarchie (Ctrl+H)"
}: FloatingHierarchyTabProps) {
    if (!show) return null;

    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            aria-label="Ouvrir la hiérarchie"
            style={{
                position: "fixed",
                left: 0,
                top: topPx,
                transform: "translateX(-6px)",       // léger débord pour “coller” au bord
                width: 32,
                height: 120,
                borderRadius: "0 8px 8px 0",
                border: "none",
                cursor: "pointer",
                outline: "none",
                zIndex: 1060,                        // au-dessus du canvas
                background: "rgba(40,40,48,255)",
                color: "#fff",
                boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                writingMode: "vertical-rl",
                textOrientation: "upright",
                fontSize: 12,
                letterSpacing: 1,
                opacity: 0.7,
                transition: "opacity 120ms, transform 120ms"
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateX(0)";
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "0.7";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateX(-6px)";
            }}
        >
            {title}
        </button>
    );
}

