import React, { useEffect, useMemo, useRef, useState } from "react";
import StateNode from "./StateNode";
import TransitionEdge from "./TransitionEdge";
import { EdgeVM, NodeVM } from "./SMEditorTypes";

type LinkStep = "idle" | "source" | "target";

type FSMGraphProps = {
  states: NodeVM[];
  transitions: EdgeVM[];
  onChangeStates?: (states: NodeVM[]) => void;
  onChangeTransitions?: (edges: EdgeVM[]) => void;
  onSelectedState?: (state: NodeVM | null) => void;   // 👈 nouveau
  onSelectedTransition?: (edge: EdgeVM | null) => void; // 👈 optionnel
};

export default function FsmGraph({
  states,
  transitions,
  onChangeStates,
  onChangeTransitions,
  onSelectedState,
  onSelectedTransition
}: FSMGraphProps) {

  // ----- nodes from FSM -----
  const [nodes, setNodes] = useState<NodeVM[]>([]);
  const [edges, setEdges] = useState<EdgeVM[]>([]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // pan/zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const draggingView = useRef<{ ox: number; oy: number; sx: number; sy: number } | null>(null);

  // drag node
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number; sx: number; sy: number } | null>(null);

  // context menu
  const [ctxMenu, setCtxMenu] = useState<{ show: boolean; x: number; y: number; onNodeId?: string } | null>(null);

  // link wizard
  const [linkStep, setLinkStep] = useState<LinkStep>("idle");
  const [linkFrom, setLinkFrom] = useState<string | null>(null);
  const [hint, setHint] = useState<string>("");

  const nodesById = useMemo(() => Object.fromEntries(nodes.map(n => [n.id, n])), [nodes]);

  const viewportRef = useRef<HTMLDivElement | null>(null);

  // charger les nodes depuis la FSM
  useEffect(() => {
    if (!states) return;
    const gridStartX = 80, gridStartY = 80, stepX = 180, stepY = 120;
    const next: NodeVM[] = states.map((s, i) => ({
      id: s.id,
      name: s.name,
      stateFile: s.stateFile,
      x: s.ui?.x ?? (gridStartX + (i % 4) * stepX),
      y: s.ui?.y ?? (gridStartY + Math.floor(i / 4) * stepY),
    }));
    setNodes(next);
  }, [states]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // empêcher le scroll de la page
      e.preventDefault();

      // zoom "doux"
      const factor = e.deltaY < 0 ? 1.1 : 0.9;

      // Option UX : zoom centré sous la souris
      // récupérer la position souris dans le repère SVG
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      setPan(prevPan => {
        // avant de changer le zoom, calcule le point monde (avant zoom)
        const worldX = (px - prevPan.x) / zoom;
        const worldY = (py - prevPan.y) / zoom;

        // applique le nouveau zoom
        const newZoom = Math.min(2.5, Math.max(0.3, zoom * factor));
        setZoom(newZoom);

        // recalcule le pan pour garder le curseur “ancré” sur le même point monde
        const newPanX = px - worldX * newZoom;
        const newPanY = py - worldY * newZoom;
        return { x: newPanX, y: newPanY };
      });
    };

    // IMPORTANT: passive:false pour autoriser preventDefault()
    el.addEventListener("wheel", handleWheel, { passive: false });

    return () => el.removeEventListener("wheel", handleWheel);
  }, [zoom]);

  // actions
  function addNode() {
    const id = prompt("Id du nouvel état ?"); if (!id) return;
    if (nodesById[id]) { alert("Id déjà utilisé"); return; }
    setNodes(ns => [...ns, { id, x: 120, y: 80 }]);
  }

  function beginCreateTransition(fromNodeId?: string) {
    setSelectedEdgeId(null);
    setSelectedNodeId(null);
    setLinkFrom(null);
    setLinkStep("source");
    setHint("Sélectionnez l'état source…");
    if (fromNodeId) {
      setLinkFrom(fromNodeId);
      setLinkStep("target");
      setHint("Sélectionnez l'état de destination…");
    }
  }

  function onPickNodeForLink(nodeId: string) {
    if (linkStep === "source") {
      setLinkFrom(nodeId);
      setLinkStep("target");
      setHint("Sélectionnez l'état de destination…");
      return;
    }
    if (linkStep === "target" && linkFrom) {
      if (linkFrom === nodeId) {
        setHint("Source et destination identiques. Recommence.");
        setTimeout(() => { setHint(""); setLinkStep("idle"); setLinkFrom(null); }, 800);
        return;
      }
      const exists = edges.some(e => e.from === linkFrom && e.to === nodeId);
      if (!exists) {
        setEdges(es => [...es, { id: `e_${Date.now()}`, from: linkFrom, to: nodeId }]);
      }
      setLinkFrom(null);
      setLinkStep("idle");
      setHint("");
    }
  }

  function deleteSelectedEdge() {
    if (!selectedEdgeId) return;
    setEdges(es => es.filter(e => e.id !== selectedEdgeId));
    setSelectedEdgeId(null);
  }

  // context menu
  function openContextMenu(e: React.MouseEvent, onNodeId?: string) {
    e.preventDefault();
    setCtxMenu({ show: true, x: e.clientX, y: e.clientY, onNodeId });
    setSelectedEdgeId(null);
    setSelectedNodeId(onNodeId ?? null);
  }
  function closeContextMenu() { setCtxMenu(null); }


  function onBackgroundMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).tagName === "svg") {
      draggingView.current = { ox: e.clientX, oy: e.clientY, sx: pan.x, sy: pan.y };
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      closeContextMenu();
      onSelectedState?.(null);        // 👈 notifie le parent
      onSelectedTransition?.(null);
    }
  }

  function onBackgroundMouseMove(e: React.MouseEvent) {
    if (!draggingView.current) return;
    const dx = e.clientX - draggingView.current.ox;
    const dy = e.clientY - draggingView.current.oy;
    setPan({ x: draggingView.current.sx + dx, y: draggingView.current.sy + dy });
  }
  function onBackgroundMouseUp() { draggingView.current = null; }

  // drag node
  function onMouseDownNode(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    closeContextMenu();
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
    setDragging({ id, ox: e.clientX, oy: e.clientY, sx: nodesById[id].x, sy: nodesById[id].y });
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    const dx = e.clientX - dragging.ox;
    const dy = e.clientY - dragging.oy;
    setNodes(ns => ns.map(n => n.id === dragging.id ? { ...n, x: dragging.sx + dx, y: dragging.sy + dy } : n));
  }
  function onMouseUp() { setDragging(null); }

  // click node / edge
  function onNodeClick(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (linkStep === "source" || linkStep === "target") {
      onPickNodeForLink(id);
    } else {
      setSelectedNodeId(id);
      setSelectedEdgeId(null);
      const node = nodes.find(n => n.id === id) ?? null;
      onSelectedState?.(node);   // 👈 notifie le parent
      onSelectedTransition?.(null);
    }
  }

  function onEdgeClick(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    closeContextMenu();
    setSelectedEdgeId(id);
    setSelectedNodeId(null);
  }

  // keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLinkStep("idle"); setLinkFrom(null); setHint(""); closeContextMenu();
        setSelectedEdgeId(null); setSelectedNodeId(null);
      }
      if (e.key === "Delete" && selectedEdgeId) deleteSelectedEdge();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedEdgeId]);

  // Regrouper les edges par paire directionnelle "from->to"
  const laneByEdgeId = useMemo(() => {
    const map = new Map<string, number>(); // edgeId -> laneIndex
    const groups = new Map<string, EdgeVM[]>();

    const keyOf = (e: EdgeVM) => `${e.from}→${e.to}`;

    for (const e of edges) {
      const k = keyOf(e);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(e);
    }

    // attribution des lanes : 0, +1, -1, +2, -2, ...
    const orderIdx = (i: number) => {
      // i = 0..n-1  =>  0, 1, -1, 2, -2, ...
      if (i === 0) return 0;
      const k = Math.ceil(i / 2);
      return (i % 2 === 1) ? k : -k;
    };

    for (const arr of groups.values()) {
      arr.forEach((e, i) => map.set(e.id, orderIdx(i)));
    }
    return map;
  }, [edges]);

  return (
    <div className="w-full h-full" style={{ background: "#1f1f1f", color: "white", userSelect: "none", position: "relative" }}>
      {/* Toolbar rapide */}
      <div style={{ display: "flex", gap: 8, padding: 8, borderBottom: "1px solid #333", alignItems: "center" }}>
        <button className="btn btn-dark btn-sm" onClick={addNode}>+ État</button>
        <button className="btn btn-outline-light btn-sm" onClick={() => beginCreateTransition()}>
          Créer une transition (guide)
        </button>
        <button className="btn btn-danger btn-sm" onClick={deleteSelectedEdge} disabled={!selectedEdgeId}>
          Supprimer transition
        </button>
        {hint && <div style={{ marginLeft: 12, color: "#9ad" }}>{hint}</div>}
      </div>

      {/* Graphe */}
      <div
        ref={viewportRef}
        // SUPPRIMER onWheel ici
        onMouseMove={(e) => { onMouseMove(e); onBackgroundMouseMove(e); }}
        onMouseUp={() => { onMouseUp(); onBackgroundMouseUp(); }}
        onMouseDown={onBackgroundMouseDown}
        onContextMenu={(e) => openContextMenu(e, undefined)}
        style={{ width: "100%", height: "calc(100% - 46px)" }}
      >
        <svg width="100%" height="60vh" style={{ cursor: draggingView.current ? "grabbing" : "default" }}>
          <svg width="100%" height="100%" style={{ cursor: draggingView.current ? "grabbing" : "default" }}>
            <defs>
              <marker id="fsm-arrow" markerWidth="10" markerHeight="8" refX="10" refY="4"
                orient="auto" markerUnits="strokeWidth">
                <path d="M 0 0 L 10 4 L 0 8 z" fill="#bbb" />
              </marker>
              <marker id="fsm-arrow-selected" markerWidth="10" markerHeight="8" refX="10" refY="4"
                orient="auto" markerUnits="strokeWidth">
                <path d="M 0 0 L 10 4 L 0 8 z" fill="#fff" />
              </marker>
            </defs>
            <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
              {/* ... */}
            </g>
          </svg>
          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
            {/* edges */}
            {edges.map(e => {
              const a = nodesById[e.from], b = nodesById[e.to];
              if (!a || !b) return null;
              return (
                <TransitionEdge
                  key={e.id}
                  edge={e}
                  a={a}
                  b={b}
                  selected={e.id === selectedEdgeId}
                  onClick={onEdgeClick}
                  laneIndex={laneByEdgeId.get(e.id) ?? 0}
                />
              );
            })}
            {/* nodes */}
            {nodes.map(n => (
              <StateNode
                key={n.id}
                node={n}
                selected={n.id === selectedNodeId}
                onMouseDown={onMouseDownNode}
                onClick={onNodeClick}
                onContextMenu={(id, ev) => openContextMenu(ev, id)}
              />
            ))}
            {/* message du wizard près de la source */}
            {linkStep !== "idle" && linkFrom && nodesById[linkFrom] && (
              <text
                x={nodesById[linkFrom].x}
                y={nodesById[linkFrom].y - 22}
                fontSize={11}
                fill="#9ad"
                textAnchor="middle"
              >
                {hint}
              </text>
            )}
          </g>
        </svg>
      </div>

      {/* Menu contextuel (style react-bootstrap) */}
      {ctxMenu?.show && (
        <div
          className="dropdown-menu show"
          style={{ position: "fixed", top: ctxMenu.y, left: ctxMenu.x, zIndex: 1000 }}
          onMouseLeave={closeContextMenu}
        >
          <button
            className="dropdown-item"
            onClick={() => { closeContextMenu(); beginCreateTransition(ctxMenu.onNodeId); }}
          >
            Créer une transition
          </button>
          {selectedEdgeId && (
            <button className="dropdown-item text-danger" onClick={() => { closeContextMenu(); deleteSelectedEdge(); }}>
              Supprimer la transition sélectionnée
            </button>
          )}
        </div>
      )}
    </div>
  );
}