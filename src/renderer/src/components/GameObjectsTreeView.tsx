import { useMemo, useRef, useCallback } from "react";
import {
  DndProvider, MultiBackend, Tree, getBackendOptions,
  type NodeModel, type DropOptions
} from "@minoru/react-dnd-treeview";
import { Button } from "react-bootstrap";
import { setGameObjects, useGameObjects } from "@renderer/editor/EditorStore";
import LGM3DEditor from "@renderer/editor/LGM3DEditor";

type TreeNodeData = { type: "folder" | "GameObject"; locked?: boolean; selected?: boolean };

function isAncestor(nodes: NodeModel<any>[], maybeAncestorId: any, childId: any) {
  let cur = nodes.find(n => n.id === childId);
  const seen = new Set<any>();
  while (cur && cur.parent !== 0 && !seen.has(cur.parent)) {
    seen.add(cur.parent);
    if (cur.parent === maybeAncestorId) return true;
    cur = nodes.find(n => n.id === cur!.parent);
  }
  return false;
}

function canDropRule(
  nodes: NodeModel<TreeNodeData>[],
  dragged?: NodeModel<TreeNodeData>,
  target?: NodeModel<TreeNodeData>
) {
  if (!dragged || !target) return false;
  if (dragged.id === target.id) return false;                          // pas sur soi-même
  if (isAncestor(nodes, dragged.id, target.id)) return false;          // parent → descendant interdit
  if (target.data?.type === "GameObject" && dragged.data?.type === "folder") return false; // pas de folder dans GO
  return true;
}

export default function GameObjectsTreeView() {
  const nodes = useGameObjects(); // ← lecture store (source de vérité)
  const editor = LGM3DEditor.getInstance();

  const byId = useMemo(() => {
    const m = new Map<any, NodeModel<TreeNodeData>>();
    for (const n of nodes) m.set(n.id, n);
    return m;
  }, [nodes]);

  // Auto-expand survol
  const hoverTimerRef = useRef<number | null>(null);
  const clearHover = () => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const handleDragOver = useCallback(
    (_: NodeModel<TreeNodeData>[], { dropTargetId }: DropOptions & any) => {
      clearHover();
      if (!dropTargetId) return;
      const target = byId.get(dropTargetId);
      if (!target || !target.droppable || (target as any).isOpen) return;

      hoverTimerRef.current = window.setTimeout(() => {
        // Ouvre visuellement la cible dans le STORE (pas d’état local)
        setGameObjects(prev =>
          prev.map(n => (n.id === dropTargetId ? { ...n, isOpen: true } : n))
        );
      }, 400);
    },
    [byId]
  );

  const handleDrop = useCallback(
    (_newTree: NodeModel<TreeNodeData>[], info: any) => {
      const { dragSourceId, dropTargetId } = info;

      // 1) appliquer au moteur (source de vérité du parentage)
      try {
        const child = editor.getGameObjectById(dragSourceId);
        const parent = dropTargetId ? editor.getGameObjectById(dropTargetId) : null;
        child?.setParent(parent ?? null);
      } catch {}

      // 2) rebuild propre depuis l’éditeur → pousse dans le store
      editor.updateObjectsTreeView();

      // 3) UX: si drop INTO, s’assurer que la cible reste ouverte
      if (dropTargetId) {
        setGameObjects(prev =>
          prev.map(n => (n.id === dropTargetId ? { ...n, isOpen: true } : n))
        );
      }
    },
    [editor]
  );

  return (
    <DndProvider backend={MultiBackend} options={getBackendOptions()}>
      <Tree<TreeNodeData>
        tree={nodes}
        rootId={0}
        canDrag={(node) => node.data?.locked !== true} // ex: Racine.locked = true
        canDrop={(tree, { dragSource, dropTarget }) =>
          canDropRule(tree as NodeModel<TreeNodeData>[], dragSource as any, dropTarget as any)
        }
        onDragOver={handleDragOver}
        onDragEnd={clearHover}
        onDrop={handleDrop}
        render={(node, { depth, isOpen, onToggle }) => {
          const isFolder = !!node.droppable;
          return (
            <div
              style={{
                marginLeft: depth * 12,
                display: "flex",
                alignItems: "center",
                height: 28,
                userSelect: "none",
              }}
              className="hover:bg-white/5"
            >
              {/* Expander */}
              <button
                onClick={isFolder ? onToggle : undefined}
                title={isFolder ? (isOpen ? "Réduire" : "Développer") : ""}
                style={{
                  width: 18, height: 18, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  marginRight: 6, opacity: isFolder ? 1 : 0.25,
                }}
              >
                {isFolder ? (isOpen ? "▾" : "▸") : "•"}
              </button>

              {/* Icône */}
              <span style={{ width: 16, marginRight: 6 }}>
                {node.data?.type === "GameObject" ? "🧊" : "📁"}
              </span>

              {/* Label / sélection */}
              <Button
                size="sm"
                variant={node.data?.selected ? "warning" : "secondary"}
                onClick={() => editor.selectGameObject(Number(node.id))}
                style={{ padding: "2px 8px" }}
              >
                {node.text}
              </Button>
            </div>
          );
        }}
        dragPreviewRender={(monitorProps) => (
          <div style={{ padding: "4px 8px", background: "#222", color: "#fff", borderRadius: 4, fontSize: 12 }}>
            {monitorProps.item.text}
          </div>
        )}
      />
    </DndProvider>
  );
}
