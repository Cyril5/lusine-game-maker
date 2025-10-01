// StateNode.tsx
import React from "react";
import { NodeVM } from "./SMEditorTypes";

type Props = {
  node: NodeVM;
  selected: boolean;
  onMouseDown: (id: string, e: React.MouseEvent) => void;
  onClick: (id: string, e: React.MouseEvent) => void;
  onContextMenu: (id: string, e: React.MouseEvent) => void;
};

export default function StateNode({ node, selected, onMouseDown, onClick, onContextMenu }: Props) {
  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      onMouseDown={(e)=>onMouseDown(node.id, e)}
      onClick={(e)=>onClick(node.id, e)}
      onContextMenu={(e)=>onContextMenu(node.id, e)}
      style={{ cursor: "pointer" }}
    >
      {/* indicateur sub-state */}
      {node.isSub && <circle r={20} fill="rgba(255,255,255,0.08)" />}
      {node.isSub ? (
        <>
          <circle r={16} fill="rgba(0,0,0,0.35)" stroke={selected ? "#fff" : "#aaa"} strokeWidth={selected ? 3 : 2}/>
          <circle r={12} fill="none" stroke={selected ? "#fff" : "#aaa"} strokeWidth={1} />
        </>
      ) : (
        <circle r={14} fill="rgba(0,0,0,0.35)" stroke={selected ? "#fff" : "#aaa"} strokeWidth={selected ? 3 : 2}/>
      )}
      <text y={26} fontSize={12} fill={selected ? "#ffd86b" : "#fff"} textAnchor="middle">{node.name}</text>
      {node.isSub && node.subId && (
        <text y={40} fontSize={10} fill="#9ad" textAnchor="middle">sub: {node.subId}</text>
      )}
    </g>
  );
}