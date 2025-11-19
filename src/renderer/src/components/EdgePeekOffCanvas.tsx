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
    placement: "start" | "end" | "bottom" | "top";
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
    placement = "start",
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
    
    const showRef = useRef(show);
    
    // garder show à jour dans un ref, sans relancer l’effet de registration
    useEffect(() => {
        showRef.current = show;
    }, [show]);
    
    useEffect(() => {
        if (!onRegisterApi) return;
        
        const api = {
            open: () => setShow(true),
            close: () => setShow(false),
            toggle: () => setShow(s => !s),
            isOpen: () => showRef.current, // on lit le ref, pas le state capturé
        };
        
        onRegisterApi(api);
        // on ne veut PAS relancer ça à chaque render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // <— important : tableau vide
    
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
            placement={placement}
            show={show}
            onHide={() => !pinned && setShow(false)}
            backdrop={backdrop}
            scroll
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

export type FloatingDockTabProps = {
    className: string;
    onClick: () => void;
    show?: boolean;
    leftPx?: number;   // <— nouveau
    topPx?: number;    // <— déjà existant, on garde
    tabWidth?: number; // <— nouveau
    tabHeight?: number;// <— nouveau
    label?: string;
    title?: string;
};

export function FloatingDockTab({
    onClick,
    className = "",
    show = true,
    label = "Onglet",
    title = "Ouvrir"
}: FloatingDockTabProps) {
    if (!show) return null;

    return (
        <button
            className={className}
            type="button"
            onClick={onClick}
            title={title}
            aria-label={title}
            onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.opacity = "1";
                el.style.transform = "translateX(0)";
            }}
            onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.opacity = "0.75";
                el.style.transform = "translateX(-6px)";
            }}
        >
            {label}
        </button>
    );
}

