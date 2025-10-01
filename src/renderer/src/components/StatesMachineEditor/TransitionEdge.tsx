// TransitionEdge.tsx
import React, { useMemo } from "react";
import { EdgeVM, NodeVM } from "./SMEditorTypes";

type Props = {
  edge: EdgeVM;
  a: NodeVM;
  b: NodeVM;
  selected: boolean;
  onClick: (id: string, e: React.MouseEvent) => void;
  laneIndex?: number;     // ← NOUVEAU
};

const LANE_GAP = 22;      // écart entre lanes
const SELF_RADIUS = 28;   // rayon de base pour self-loop

export default function TransitionEdge({ edge, a, b, selected, onClick, laneIndex = 0 }: Props) {
  const { d, mx, my } = useMemo(() => {
    // Self-loop
    if (a.id === b.id) {
      const r = SELF_RADIUS + Math.abs(laneIndex) * 10;
      const cx = a.x; const cy = a.y;
      // petit arc autour du nœud (en haut)
      const sx = cx;        const sy = cy - r;
      const ex = cx + 0.01; const ey = cy - r; // éviter path null
      // grand arc paramétré
      const d = `M ${sx} ${sy} a ${r} ${r} 0 1 1 ${r} ${r} a ${r} ${r} 0 1 1 ${-r} ${-r}`;
      const mx = cx; const my = cy - r*1.35; // milieu “visuel” pour le label/handle
      return { d, mx, my };
    }

    // Courbe quadratique avec déport perpendiculaire
    const ax = a.x, ay = a.y, bx = b.x, by = b.y;
    const dx = bx - ax, dy = by - ay;
    const len = Math.max(1, Math.hypot(dx, dy));
    const nx = -dy / len, ny = dx / len; // normale
    const offset = (laneIndex ?? 0) * LANE_GAP;
    const cx = (ax + bx) / 2 + nx * offset;
    const cy = (ay + by) / 2 + ny * offset;

    const d = `M ${ax} ${ay} Q ${cx} ${cy} ${bx} ${by}`;

    // point milieu de la quadratique (t=0.5)
    const mx = (ax + 2*cx + bx) / 4;
    const my = (ay + 2*cy + by) / 4;

    return { d, mx, my };
  }, [a, b, laneIndex]);

  const stroke = selected ? "#fff" : "#777";
  const marker = selected ? "url(#fsm-arrow-selected)" : "url(#fsm-arrow)";
  const wide = selected ? 3 : 2;

  return (
    <g>
      {/* hit area (invisible) */}
      <path d={d}
            stroke="transparent" strokeWidth={18} fill="none"
            style={{ pointerEvents: "stroke", cursor: "pointer" }}
            onClick={(ev)=>onClick(edge.id, ev)} />
      {/* visible path */}
      <path d={d}
            stroke={stroke} strokeWidth={wide} fill="none" markerEnd={marker}
            onClick={(ev)=>onClick(edge.id, ev)} />
      {/* label */}
      <text x={mx} y={my - 10} fontSize={12} fill="#bbb" textAnchor="middle">
        {edge.event ?? "auto"}
      </text>
      {/* handle central */}
      <circle cx={mx} cy={my} r={6}
              fill={selected ? "#fff" : "#ccc"}
              stroke="#333" strokeWidth={1}
              style={{ cursor: "pointer" }}
              onClick={(ev)=>onClick(edge.id, ev)} />
    </g>
  );
}
