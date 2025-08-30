import React from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { createPortal } from "react-dom";

// Minimal docking desk that manages zones (top/left/center/right/bottom)
// and floating windows. Panels register via context and are rendered here.

export type Zone = "top" | "left" | "center" | "right" | "bottom";
export type Mode = "dock" | "float";

export type Placement =
    | { mode: "dock"; zone: Zone }
    | { mode: "float"; x: number; y: number; width: number; height: number };

export type PanelRegistration = {
    id: string;
    title: string;
    node: React.ReactNode; // panel content
    initialPlacement: Placement;
};

export type DockAPI = {
    register: (reg: PanelRegistration) => void;
    unregister: (id: string) => void;
    getPlacement: (id: string) => Placement | undefined;
    dock: (id: string, zone: Zone) => void;
    float: (id: string, bounds?: { x?: number; y?: number; width?: number; height?: number }) => void;
    moveFloat: (id: string, pos: { x: number; y: number }) => void;
    resizeFloat: (id: string, size: { width: number; height: number }) => void;
};

export const DockContext = React.createContext<DockAPI | null>(null);
export const useDock = () => React.useContext(DockContext);

export type DockDeskProps = {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
};

export const DockDesk: React.FC<DockDeskProps> = ({ children, className, style }) => {
    const [registry, setRegistry] = React.useState<Map<string, PanelRegistration>>(() => new Map());
    const [placements, setPlacements] = React.useState<Map<string, Placement>>(() => new Map());

    const floatingLayerRef = React.useRef<HTMLDivElement | null>(null);

    const placementsRef = React.useRef(placements);
    React.useEffect(() => { placementsRef.current = placements; }, [placements]);

    const api = React.useMemo(() => ({
        register(reg) {
            setRegistry(prev => new Map(prev).set(reg.id, reg));
            setPlacements(prev => {
                if (prev.has(reg.id)) return prev;
                const next = new Map(prev); next.set(reg.id, reg.initialPlacement);
                return next;
            });
        },
        unregister(id) {
            setRegistry(prev => { const next = new Map(prev); next.delete(id); return next; });
            setPlacements(prev => { const next = new Map(prev); next.delete(id); return next; });
        },
        getPlacement(id) {
            return placementsRef.current.get(id);
        },
        update(id, patch: { title?: string; node?: React.ReactNode }) {
            setRegistry(prev => {
                const reg = prev.get(id);
                if (!reg) return prev;
                const next = new Map(prev);
                next.set(id, { ...reg, ...patch });
                return next;
            });
        },
        dock(id, zone) {
            setPlacements(prev => new Map(prev).set(id, { mode: "dock", zone }));
        },
        float(id, bounds) {
            setPlacements(prev => {
                const p = prev.get(id);
                const base = (p && p.mode === "float") ? p : { x: 80, y: 80, width: 480, height: 320 };
                const next = {
                    mode: "float" as const,
                    x: bounds?.x ?? base.x, y: bounds?.y ?? base.y,
                    width: bounds?.width ?? base.width, height: bounds?.height ?? base.height
                };
                const map = new Map(prev); map.set(id, next); return map;
            });
        },
        moveFloat(id, pos) {
            setPlacements(prev => {
                const p = prev.get(id); if (!p || p.mode !== "float") return prev;
                const map = new Map(prev); map.set(id, { ...p, ...pos }); return map;
            });
        },
        resizeFloat(id, size) {
            setPlacements(prev => {
                const p = prev.get(id); if (!p || p.mode !== "float") return prev;
                const map = new Map(prev); map.set(id, { ...p, ...size }); return map;
            });
        },
    }), []); // 👈 stable

    // Helpers to render panels by zone/floating
    const panelsByZone = React.useMemo(() => {
        const z: Record<Zone, string[]> = { top: [], left: [], center: [], right: [], bottom: [] } as any;
        placements.forEach((pl, id) => {
            if (pl.mode === "dock") z[pl.zone].push(id);
        });
        return z;
    }, [placements]);

    const floatingPanels = React.useMemo(() => {
        const arr: Array<{ id: string; pl: Extract<Placement, { mode: "float" }> }> = [];
        placements.forEach((pl, id) => { if (pl.mode === "float") arr.push({ id, pl }); });
        return arr;
    }, [placements]);

    return (
        <div className={["dockdesk", className ?? ""].filter(Boolean).join(" ")} style={{ position: "relative", width: "100%", height: "100%", ...style }}>
            <DockContext.Provider value={api}>
                {/* Layout: vertical (top | middle | bottom). Middle = horizontal (left | center | right) */}
                <PanelGroup direction="vertical" autoSaveId="desk-v1-vert">
                    {/* TOP */}
                    <Panel defaultSize={10} minSize={6} collapsible>
                        <ZoneStack ids={panelsByZone.top} registry={registry} api={api} />
                    </Panel>
                    <PanelResizeHandle className="dz-handle dz-handle-x" />

                    {/* MIDDLE */}
                    <Panel>
                        <PanelGroup direction="horizontal" autoSaveId="desk-v1-horz">
                            <Panel defaultSize={20} minSize={12} collapsible>
                                <ZoneStack ids={panelsByZone.left} registry={registry} api={api} />
                            </Panel>
                            <PanelResizeHandle className="dz-handle dz-handle-y" />

                            <Panel defaultSize={60} minSize={30}>
                                <ZoneStack ids={panelsByZone.center} registry={registry} api={api} />
                            </Panel>
                            <PanelResizeHandle className="dz-handle dz-handle-y" />

                            <Panel defaultSize={20} minSize={12} collapsible>
                                <ZoneStack ids={panelsByZone.right} registry={registry} api={api} />
                            </Panel>
                        </PanelGroup>
                    </Panel>

                    <PanelResizeHandle className="dz-handle dz-handle-x" />
                    {/* BOTTOM */}
                    <Panel defaultSize={12} minSize={6} collapsible>
                        <ZoneStack ids={panelsByZone.bottom} registry={registry} api={api} />
                    </Panel>
                </PanelGroup>

                {/* Floating layer host */}
                <div ref={floatingLayerRef} className="dockdesk-float-layer" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

                {/* Render floating panels via portal so they overlay the desk */}
                {floatingLayerRef.current && floatingPanels.map(({ id, pl }) => (
                    createPortal(
                        <FloatShell key={id} id={id} reg={registry.get(id)!} placement={pl} api={api} />, floatingLayerRef.current
                    )
                ))}

                {/* Children = declarative WindowPanels (they'll register on mount) */}
                {children}
            </DockContext.Provider>

            {/* handles chrome */}
            <style>{`
        .dz-handle { display:flex; align-items:center; justify-content:center; }
        .dz-handle::after { content:''; display:block; background:#2b2d33; opacity:.9; border-radius:2px; }
        .dz-handle-x { height: 6px; }
        .dz-handle-x::after { width: 60px; height: 2px; }
        .dz-handle-y { width: 6px; }
        .dz-handle-y::after { width: 2px; height: 48px; }
      `}</style>
        </div>
    );
};

// Stack multiple docked panels in a zone (simple vertical stack)
const ZoneStack: React.FC<{ ids: string[]; registry: Map<string, PanelRegistration>; api: DockAPI }> = ({ ids, registry, api }) => {
    if (!ids.length) return <div className="h-100 w-100" />;
    return (
        <div className="h-100 w-100 d-flex flex-column gap-2 p-2" style={{ minHeight: 0 }}>
            {ids.map((id) => {
                const reg = registry.get(id)!;
                return (
                    <DockedShell key={id} id={id} title={reg.title} api={api}>
                        {reg.node}
                    </DockedShell>
                );
            })}
        </div>
    );
};

// Simple docked panel chrome
const DockedShell: React.FC<{ id: string; title: string; api: DockAPI; children: React.ReactNode }> = ({ id, title, api, children }) => {
    return (
        <div className="dv-panel" style={{ background: "#121214", color: "#e6e6e6", border: "1px solid #71518bff", borderRadius: 10, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div className="dv-header" style={{ height: 32, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px", background: "linear-gradient(180deg,#1a1b1f,#15161a)", borderBottom: "1px solid #23242a" }}>
                <span style={{ fontSize: 12, opacity: .9 }}>{title}</span>
                <div style={{ display: "flex", gap: 6 }}>
                    <button className="dv-btn" onClick={() => api.dock(id, "left")}>⟵</button>
                    <button className="dv-btn" onClick={() => api.dock(id, "right")}>⟶</button>
                    <button className="dv-btn" onClick={() => api.dock(id, "top")}>⟰</button>
                    <button className="dv-btn" onClick={() => api.dock(id, "bottom")}>⟱</button>
                    <button className="dv-btn" onClick={() => api.dock(id, "center")}>◎</button>
                    <button className="dv-btn" onClick={() => api.float(id)}>⬚</button>
                </div>
            </div>
            <div className="dv-content" style={{ flex: 1, overflow: "auto" }}>{children}</div>
            <style>{`.dv-btn{background:#22232a;color:#ddd;border:1px solid #2e2f36;border-radius:6px;padding:2px 6px}`}</style>
        </div>
    );
};

// Floating wrapper that delegates movement/resize back to DockDesk
const FloatShell: React.FC<{ id: string; reg: PanelRegistration; placement: Extract<Placement, { mode: "float" }>; api: DockAPI }> = ({ id, reg, placement, api }) => {
    // basic drag & resize similar to your previous WindowPanel
    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const [st, setSt] = React.useState(placement);
    React.useEffect(() => setSt(placement), [placement]);

    const onTitleDown: React.PointerEventHandler<HTMLDivElement> = (ev) => {
        (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
        const sx = ev.clientX, sy = ev.clientY, ox = st.x, oy = st.y;
        const move = (e: PointerEvent) => {
            const nx = ox + (e.clientX - sx), ny = oy + (e.clientY - sy);
            setSt((s) => ({ ...s, x: nx, y: ny }));
            api.moveFloat(id, { x: nx, y: ny });
        };
        const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
        window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    };

    const startResize = (dir: "e" | "s" | "se") => (ev: React.PointerEvent) => {
        (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
        const sx = ev.clientX, sy = ev.clientY, sw = st.width, sh = st.height, ox = st.x, oy = st.y;
        const move = (e: PointerEvent) => {
            let w = sw, h = sh, x = ox, y = oy;
            if (dir.includes("e")) w = Math.max(240, sw + (e.clientX - sx));
            if (dir.includes("s")) h = Math.max(160, sh + (e.clientY - sy));
            setSt((s) => ({ ...s, width: w, height: h, x, y }));
            api.resizeFloat(id, { width: w, height: h });
        };
        const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
        window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    };

    return (
        <div ref={rootRef} className="floatwin" style={{ position: "absolute", left: st.x, top: st.y, width: st.width, height: st.height, pointerEvents: "auto", display: "flex", flexDirection: "column", background: "#121214", color: "#e6e6e6", border: "1px solid #2a2a2e", borderRadius: 10, boxShadow: "0 10px 30px rgba(0,0,0,.35)", overflow: "hidden" }}>
            <div className="floatwin-header" onPointerDown={onTitleDown} style={{ height: 32, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px", background: "linear-gradient(180deg,#1a1b1f,#15161a)", borderBottom: "1px solid #23242a", cursor: "grab" }}>
                <span style={{ fontSize: 12, opacity: .9 }}>{reg.title}</span>
                <div style={{ display: "flex", gap: 6 }}>
                    <button className="dv-btn" onClick={() => api.dock(id, "left")}>⟵</button>
                    <button className="dv-btn" onClick={() => api.dock(id, "right")}>⟶</button>
                    <button className="dv-btn" onClick={() => api.dock(id, "top")}>⟰</button>
                    <button className="dv-btn" onClick={() => api.dock(id, "bottom")}>⟱</button>
                    <button className="dv-btn" onClick={() => api.dock(id, "center")}>◎</button>
                </div>
            </div>
            <div className="floatwin-content" style={{ flex: 1, overflow: "auto", background: "#0f1014" }}>{reg.node}</div>

            {/* handles */}
            <div className="rs e" onPointerDown={startResize("e")} />
            <div className="rs s" onPointerDown={startResize("s")} />
            <div className="rs se" onPointerDown={startResize("se")} />

            <style>{`
        .dv-btn{background:#22232a;color:#ddd;border:1px solid #2e2f36;border-radius:6px;padding:2px 6px}
        .rs{position:absolute;background:transparent}
        .rs.e{top:8px;bottom:8px;right:-3px;width:6px;cursor:ew-resize}
        .rs.s{left:8px;right:8px;bottom:-3px;height:6px;cursor:ns-resize}
        .rs.se{right:-3px;bottom:-3px;width:12px;height:12px;cursor:nwse-resize}
      `}</style>
        </div>
    );
};
