type Props = {
  edge: EdgeVM;
  a: NodeVM;                 // node source
  b: NodeVM;                 // node target
  selected: boolean;
  onClick: (id: string, e: React.MouseEvent) => void;
  laneIndex?: number;        // index de voie pour arcs parallèles
};
// TransitionEdge.tsx (safe against NaN)
import React, { useMemo } from "react";
import { EdgeVM, NodeVM } from "./FSMGraphEditorTypes";

// ...imports & types inchangés

const LANE_GAP = 22;
const SELF_RADIUS = 28;
const NODE_R_FALLBACK = 24;

export default function TransitionEdge({
  edge, a, b, selected, onClick, laneIndex = 0
}: Props) {

  // ---------- RENDU SELF-TRANSITION ----------
// --- SELF LOOP (A -> A) : segments droits, départ bas -> arrivée haut ---
if (a?.id === b?.id) {
  const cx = Number.isFinite(a?.x) ? a.x : 0;
  const cy = Number.isFinite(a?.y) ? a.y : 0;

  // Rayon visuel du node (si dispo) sinon fallback
  const nodeR =
    Number((a as any)?.r) ||
    Number((a as any)?.radius) ||
    24;

  const lane = Math.abs(laneIndex ?? 0);

  // Dégagement par rapport au bord du node
  const padEdge = 1.5;

  // Points "bas" et "haut" du node (sur son cercle)
  const startX = cx;
  const startY = cy + (nodeR + padEdge); // bas du node
  const tipX   = cx;
  const tipY   = cy - (nodeR + padEdge); // haut du node (pointe de flèche)

  // Dimensions de la boucle "rectangulaire" à gauche
  const leftX = cx - (nodeR + 26 + lane * 10); // plus la valeur est grande, plus ça s'écarte à gauche
  const downGap = 10;                           // petit décroché vers le bas pour partir proprement
  const upGap   = 30;                           // petit alignement avant la flèche

  // Polyligne : bas du node -> descente -> à gauche -> remontée -> avant-haut du node
  const polyPath = [
    `M ${startX} ${startY}`,
    `L ${startX} ${startY + downGap}`,
    `L ${leftX} ${startY + downGap}`,
    `L ${leftX} ${tipY - upGap}`,
    `L ${tipX} ${tipY - upGap}`,
  ].join(" ");

  // Dernier petit segment avec flèche, collé en haut du node
  const arrowPath = `M ${tipX} ${tipY - upGap} L ${tipX} ${tipY}`;

  // Hit area qui couvre l’ensemble
  const hitPath = `${polyPath} ${arrowPath}`;

  // Dot + label au milieu de la colonne de gauche
  const mx = leftX;
  const my = cy;
  const label = (edge as any).conditionPreview ?? edge.event ?? "auto";

  const stroke = selected ? "#fff" : "#777";
  const wide   = selected ? 3 : 2;
  const marker = selected ? "url(#fsm-arrow-selected)" : "url(#fsm-arrow)";

  return (
    <g>
      {/* zone cliquable large */}
      <path
        d={hitPath}
        stroke="transparent"
        strokeWidth={18}
        fill="none"
        style={{ pointerEvents: "stroke", cursor: "pointer" }}
        onClick={(ev) => onClick(edge.id, ev)}
      />

      {/* polyligne visible */}
      <path
        d={polyPath}
        stroke={stroke}
        strokeWidth={wide}
        fill="none"
        strokeLinecap="round"
        onClick={(ev) => onClick(edge.id, ev)}
      />

      {/* petit segment final avec flèche, collé au haut du node */}
      <path
        d={arrowPath}
        stroke={stroke}
        strokeWidth={wide}
        fill="none"
        strokeLinecap="round"
        markerEnd={marker}
        onClick={(ev) => onClick(edge.id, ev)}
      />

      {/* label + dot à gauche */}
      <text x={mx - 6} y={my - 10} fontSize={12} fill="#bbb" textAnchor="end">
        {label}
      </text>
      <circle
        cx={mx}
        cy={my}
        r={6}
        fill={selected ? "#fff" : "#ccc"}
        stroke="#333"
        strokeWidth={1}
        style={{ cursor: "pointer" }}
        onClick={(ev) => onClick(edge.id, ev)}
      />
    </g>
  );
}

  // ---------- RENDU EDGE NORMAL (ton code existant, inchangé) ----------
  // (Quadratique avec lanes + mid node)
  const { d, mx, my } = React.useMemo(() => {
    const ax = a.x ?? 0, ay = a.y ?? 0, bx = b.x ?? 0, by = b.y ?? 0;
    const dx = bx - ax, dy = by - ay;
    const len = Math.max(1, Math.hypot(dx, dy));
    const nx = -dy / len, ny = dx / len;
    const offset = (laneIndex ?? 0) * LANE_GAP;
    const cxm = (ax + bx) / 2 + nx * offset;
    const cym = (ay + by) / 2 + ny * offset;
    const d = `M ${ax} ${ay} Q ${cxm} ${cym} ${bx} ${by}`;
    const mx = (ax + 2 * cxm + bx) / 4;
    const my = (ay + 2 * cym + by) / 4;
    return { d, mx, my };
  }, [a.x, a.y, b.x, b.y, laneIndex]);

  const stroke = selected ? "#fff" : "#777";
  const wide = selected ? 3 : 2;
  const marker = selected ? "url(#fsm-arrow-selected)" : "url(#fsm-arrow)";
  const label = (edge as any).conditionPreview ?? edge.event ?? "auto";

  return (
    <g>
      <path d={d} stroke="transparent" strokeWidth={18} fill="none"
        style={{ pointerEvents: "stroke", cursor: "pointer" }}
        onClick={(ev) => onClick(edge.id, ev)} />
      <path d={d} stroke={stroke} strokeWidth={wide} fill="none" markerEnd={marker}
        strokeLinecap="round"
        onClick={(ev) => onClick(edge.id, ev)} />
      <text x={mx} y={my - 10} fontSize={12} fill="#bbb" textAnchor="middle">
        {label}
      </text>
      <circle cx={mx} cy={my} r={6}
        fill={selected ? "#fff" : "#ccc"}
        stroke="#333" strokeWidth={1}
        style={{ cursor: "pointer" }}
        onClick={(ev) => onClick(edge.id, ev)} />
    </g>
  );
}
