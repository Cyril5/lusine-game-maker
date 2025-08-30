import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { Virtuoso } from "react-virtuoso";

// Minimal row props (avoid relying on @types/react-window)
export type RowProps = { index: number };

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────
export type NodeId = string;           // Folder ids: string
export type UniqueGOId = number;       // BabylonJS uniqueId: number

export type FolderNode = {
  type: "folder";
  id: NodeId;
  name: string;
  children: Array<FolderNode | GameObjectNode>;
};

export type GameObjectNode = {
  type: "go";
  id: UniqueGOId; // BabylonJS uniqueId
  name: string;
  // GOs may contain GO children, but NEVER folders
  children?: GameObjectNode[];
};

export type TreeNode = FolderNode | GameObjectNode;

function isFolder(n: TreeNode): n is FolderNode { return n.type === "folder"; }
function isGO(n: TreeNode): n is GameObjectNode { return n.type === "go"; }

function assertNoFolderInGO(node: TreeNode) {
  if (isGO(node) && node.children) {
    for (const c of node.children) {
      if (!isGO(c)) throw new Error("Invalid tree: folders cannot be children of GameObjects.");
      assertNoFolderInGO(c);
    }
  } else if (isFolder(node)) {
    node.children.forEach(assertNoFolderInGO);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Flatten visible rows
// ──────────────────────────────────────────────────────────────────────────────
export type VisibleRow = { node: TreeNode; depth: number; parentPath: (NodeId | UniqueGOId)[] };

function flattenTree(roots: TreeNode[], expanded: Set<NodeId | UniqueGOId>): VisibleRow[] {
  const out: VisibleRow[] = [];
  const walk = (node: TreeNode, depth: number, parentPath: (NodeId | UniqueGOId)[]) => {
    out.push({ node, depth, parentPath });
    if (isFolder(node)) {
      if (expanded.has(node.id)) {
        for (const c of node.children) walk(c, depth + 1, [...parentPath, node.id]);
      }
    } else if (isGO(node)) {
      if (node.children && node.children.length && expanded.has(node.id)) {
        for (const c of node.children) walk(c, depth + 1, [...parentPath, node.id]);
      }
    }
  };
  for (const r of roots) walk(r, 0, []);
  return out;
}

// ──────────────────────────────────────────────────────────────────────────────
// Immutable ops for DnD
// ──────────────────────────────────────────────────────────────────────────────
function shallowCloneNode<T extends TreeNode>(n: T): T {
  if (isFolder(n)) return { ...n, children: n.children.map(shallowCloneNode) } as T;
  if (isGO(n)) return { ...n, children: n.children ? n.children.map(shallowCloneNode) : undefined } as T;
  return { ...n } as T;
}

function cloneTree<T extends TreeNode>(nodes: T[]): T[] { return nodes.map(shallowCloneNode) as T[]; }

function findNodePath(nodes: TreeNode[], id: NodeId | UniqueGOId): (NodeId | UniqueGOId)[] | null {
  const path: (NodeId | UniqueGOId)[] = [];
  const dfs = (list: TreeNode[], p: (NodeId | UniqueGOId)[]): boolean => {
    for (const n of list) {
      const np = [...p, n.id as any];
      if (n.id === id) { path.push(...np); return true; }
      const kids = isFolder(n) ? n.children : isGO(n) ? (n.children ?? []) : [];
      if (kids.length && dfs(kids, np)) return true;
    }
    return false;
  };
  return dfs(nodes, []) ? path : null;
}

function getByPath(nodes: TreeNode[], path: (NodeId | UniqueGOId)[]): TreeNode | null {
  let cur: TreeNode | null = null;
  let list: TreeNode[] = nodes;
  for (const id of path) {
    cur = list.find(n => n.id === id) ?? null;
    if (!cur) return null;
    list = isFolder(cur) ? cur.children : isGO(cur) ? (cur.children ?? []) : [];
  }
  return cur;
}

function removeById(nodes: TreeNode[], id: NodeId | UniqueGOId): { next: TreeNode[]; removed?: TreeNode; parentPath?: (NodeId | UniqueGOId)[] } {
  const path = findNodePath(nodes, id);
  if (!path) return { next: nodes };
  const parentPath = path.slice(0, -1);
  const next = cloneTree(nodes);
  let list: TreeNode[] = next;
  for (const pid of parentPath) {
    const parent = list.find(n => n.id === pid)!;
    list = isFolder(parent) ? parent.children : (parent as GameObjectNode).children!;
  }
  const idx = list.findIndex(n => n.id === id);
  const [removed] = list.splice(idx, 1);
  return { next, removed, parentPath };
}

function insertAt(nodes: TreeNode[], targetId: NodeId | UniqueGOId, item: TreeNode, position: "into" | "before" | "after"): TreeNode[] {
  const next = cloneTree(nodes);
  if (position === "into") {
    const tgtPath = findNodePath(next, targetId)!;
    const tgt = getByPath(next, tgtPath)!;
    if (isFolder(tgt)) {
      tgt.children.push(item);
    } else if (isGO(tgt)) {
      (tgt.children ?? (tgt.children = [])).push(item as GameObjectNode);
    }
    return next;
  }
  const tgtPath = findNodePath(next, targetId)!;
  const parentP = tgtPath.slice(0, -1);
  let list: TreeNode[] = parentP.length ? (isFolder(getByPath(next, parentP)!) ? (getByPath(next, parentP)! as FolderNode).children : ((getByPath(next, parentP)! as GameObjectNode).children!)) : next;
  const idx = list.findIndex(n => n.id === targetId);
  const insertIdx = position === "before" ? idx : idx + 1;
  list.splice(insertIdx, 0, item);
  return next;
}

function isAncestor(nodes: TreeNode[], maybeAncestor: NodeId | UniqueGOId, child: NodeId | UniqueGOId): boolean {
  const p = findNodePath(nodes, child);
  return !!p && p.includes(maybeAncestor) && p[p.length - 1] !== maybeAncestor;
}

function defaultAllowDrop(
  dragged: TreeNode,
  target: TreeNode,
  pos: "into" | "before" | "after",
  roots: TreeNode[]
) {
  if (dragged.id === target.id) return false; // cannot drop onto itself
  if (isAncestor(roots, dragged.id as any, target.id as any)) return false; // no parent into its descendant

  if (pos === "into") {
    if (isGO(target) && isFolder(dragged)) return false; // no folder into GO
    return true; // GO->GO or any->folder
  }
  return true; // before/after always ok
}
  return true; // before/after allowed
}

// ──────────────────────────────────────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────────────────────────────────────
export type TreeViewSelection = { type: "folder"; id: NodeId } | { type: "go"; id: UniqueGOId } | null;

export type TreeViewProps = {
  roots: TreeNode[];
  rowHeight?: number;
  indent?: number;
  selected?: TreeViewSelection;
  onSelect?: (sel: TreeViewSelection) => void;
  defaultExpandedIds?: Array<NodeId | UniqueGOId>;
  onToggleExpand?: (node: TreeNode, expanded: boolean) => void;
  onContextMenu?: (node: TreeNode, e: React.MouseEvent) => void;
  onDoubleClick?: (node: TreeNode) => void;
  renderRightAdornment?: (node: TreeNode) => React.ReactNode;
  onMoveNode?: (dragged: TreeNode, target: TreeNode, position: "into" | "before" | "after") => void;
  allowDrop?: (dragged: TreeNode, target: TreeNode, position: "into" | "before" | "after") => boolean;
  onTreeChange?: (nextRoots: TreeNode[]) => void;
  /**
   * Explicit height for the virtualized viewport. If not provided, the component
   * tries to fill parent (height: 100%) but needs the parent to be sized.
   */
  height?: number | string; // e.g., 480 or "100%"
};

// ──────────────────────────────────────────────────────────────────────────────
// TreeView Component
// ──────────────────────────────────────────────────────────────────────────────
export default function TreeView({
  roots,
  rowHeight = 28,
  indent = 16,
  selected = null,
  onSelect,
  defaultExpandedIds,
  onToggleExpand,
  onContextMenu,
  onDoubleClick,
  renderRightAdornment,
  onMoveNode,
  allowDrop,
  onTreeChange,
}: TreeViewProps) {
  // Structural guard (dev-time)
  useMemo(() => roots.forEach(assertNoFolderInGO), [roots]);

  // Expansion
  const [expanded, setExpanded] = useState<Set<NodeId | UniqueGOId>>(() => new Set(defaultExpandedIds ?? []));
  const toggle = useCallback((node: TreeNode) => {
    const id = node.id as NodeId | UniqueGOId;
    const next = new Set(expanded);
    const willExpand = !next.has(id);
    if (willExpand) next.add(id); else next.delete(id);
    setExpanded(next);
    onToggleExpand?.(node, willExpand);
  }, [expanded, onToggleExpand]);

  const visible = useMemo(() => flattenTree(roots, expanded), [roots, expanded]);

  // Selection
  const selectNode = useCallback((node: TreeNode) => {
    const payload: TreeViewSelection = isFolder(node)
      ? { type: "folder", id: node.id }
      : { type: "go", id: node.id as UniqueGOId };
    onSelect?.(payload);
  }, [onSelect]);

  // Refs
  const listRef = useRef<any>(null); // kept for API symmetry; not required by Virtuoso
  const containerRef = useRef<HTMLDivElement>(null);
  const focusIndexRef = useRef<number>(-1);

  const focusRow = useCallback((idx: number) => {
    if (idx < 0 || idx >= visible.length) return;
    focusIndexRef.current = idx;
    listRef.current?.scrollToItem?.(idx, "smart");
  }, [visible.length]);

  // Keyboard nav
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!visible.length) return;
    const currentIndex = focusIndexRef.current >= 0 ? focusIndexRef.current : 0;
    const current = visible[currentIndex]?.node;
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); focusRow(Math.min(currentIndex + 1, visible.length - 1)); break;
      case "ArrowUp": e.preventDefault(); focusRow(Math.max(currentIndex - 1, 0)); break;
      case "ArrowRight": {
        if (current) {
          const id = current.id as NodeId | UniqueGOId;
          if (!expanded.has(id)) { toggle(current); }
          else {
            const next = visible[currentIndex + 1];
            if (next && next.parentPath.includes(id)) focusRow(currentIndex + 1);
          }
        }
        break;
      }
      case "ArrowLeft": {
        if (current) {
          const id = current.id as NodeId | UniqueGOId;
          if (expanded.has(id)) { toggle(current); }
          else {
            const parentId = visible[currentIndex]?.parentPath.slice(-1)[0];
            if (parentId != null) {
              const parentIdx = visible.findIndex(v => v.node.id === parentId);
              if (parentIdx >= 0) focusRow(parentIdx);
            }
          }
        }
        break;
      }
      case "Enter":
      case " ":
        if (current) selectNode(current);
        break;
    }
  }, [visible, expanded, toggle, selectNode, focusRow]);

  // Sync focus to selection
  useEffect(() => {
    if (!selected) return;
    const idx = visible.findIndex(v => isFolder(v.node) ? (selected.type === "folder" && v.node.id === selected.id) : (selected.type === "go" && v.node.id === selected.id));
    if (idx >= 0) {
      focusIndexRef.current = idx;
      listRef.current?.scrollToItem?.(idx, "smart");
    }
  }, [selected, visible]);

  // DnD state
  const [draggingId, setDraggingId] = useState<NodeId | UniqueGOId | null>(null);
  const [dragOver, setDragOver] = useState<{ id: NodeId | UniqueGOId; pos: "into" | "before" | "after" } | null>(null);

  // Row renderer
  const Row = ({ index }: RowProps) => {
    const { node, depth } = visible[index];
    const id = node.id as NodeId | UniqueGOId;

    const isSelected = selected
      ? (isFolder(node) && selected.type === "folder" && selected.id === id) ||
        (isGO(node) && selected.type === "go" && selected.id === id)
      : false;

    const isExpanded = expanded.has(id);
    const canExpand = isFolder(node) ? node.children.length > 0 : Boolean(node.children?.length);

    const handleDragStart = (e: React.DragEvent) => {
      setDraggingId(id);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(id));
    };

    const handleDragOver = (e: React.DragEvent) => {
      if (draggingId == null || draggingId === id) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "none";
        return;
      }

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const y = e.clientY - rect.top;
      let pos: "into" | "before" | "after";
      if (e.altKey) pos = y < rect.height * 0.5 ? "before" : "after"; else pos = y < rect.height * 0.25 ? "before" : y > rect.height * 0.75 ? "after" : "into";

      const draggedNode = visible.find(v => v.node.id === draggingId)!.node;
      const ok = (allowDrop ? allowDrop(draggedNode, node, pos) : defaultAllowDrop(draggedNode, node, pos, roots));

      // Always preventDefault to stabilize cursor; control with dropEffect
      e.preventDefault();
      e.dataTransfer.dropEffect = ok ? "move" : "none";

      if (!ok) {
        setDragOver(null);
        if (hoverTimerRef.current) { window.clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null; }
        return;
      }

      setDragOver({ id, pos });

      // Auto-expand when hovering a folder in "into"
      if (pos === "into" && isFolder(node) && !expanded.has(id)) {
        if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = window.setTimeout(() => { toggle(node); }, 400);
      }
    };

    const handleDragLeave = () => {
      setDragOver(prev => (prev && prev.id === id ? null : prev));
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      if (draggingId == null || draggingId === id) return;
      const draggedNode = visible.find(v => v.node.id === draggingId)!.node;
      const pos = dragOver?.id === id ? dragOver.pos : "into";
      if (!(allowDrop ?? defaultAllowDrop)(draggedNode, node, pos)) return;

      onMoveNode?.(draggedNode, node, pos);
      if (onTreeChange) {
        const removed = removeById(roots, draggedNode.id as any);
        if (!removed.removed) return;
        const inserted = insertAt(removed.next, node.id as any, removed.removed, pos);
        onTreeChange(inserted);
      }
      setDragOver(null);
      setDraggingId(null);
    };

    const dropClass = dragOver && dragOver.id === id
      ? (dragOver.pos === "into" ? "ring-1 ring-blue-400/60" : dragOver.pos === "before" ? "border-t border-blue-400/60" : "border-b border-blue-400/60")
      : "";

    return (
      <div
        style={{ height: rowHeight, display: 'flex' }}
        className={`flex items-center text-sm select-none ${dropClass} ${isSelected ? "bg-blue-600/20" : "hover:bg-white/5"}`}
        onMouseDown={() => { focusIndexRef.current = index; }}
        onClick={() => selectNode(node)}
        onDoubleClick={() => onDoubleClick?.(node)}
        onContextMenu={(e) => { e.preventDefault(); onContextMenu?.(node, e); }}
        draggable
        onDragStart={handleDragStart}
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={() => { setDragOver(null); setDraggingId(null); if (hoverTimerRef.current) { window.clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null; } }}
      >
        <div className="flex-1 flex items-center gap-1" style={{ paddingLeft: depth * indent }}>
          {/* Expander */}
          <button
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10"
            onClick={(e) => { e.stopPropagation(); if (canExpand) toggle(node); }}
            aria-label={isExpanded ? "Collapse" : "Expand"}
            title={isExpanded ? "Réduire" : "Développer"}
          >
            {canExpand ? (
              <span className="inline-block" style={{ transform: `rotate(${isExpanded ? 90 : 0}deg)` }}>▶</span>
            ) : (
              <span className="opacity-20">•</span>
            )}
          </button>

          {/* Icon */}
          {isFolder(node) ? (
            <span className="w-4" role="img" aria-label="folder">📁</span>
          ) : (
            <span className="w-4" role="img" aria-label="go">🧊</span>
          )}

          {/* Label */}
          <div className="truncate" title={node.name}>
            {node.name}
            {isGO(node) && (
              <span className="ml-2 text-xs opacity-50">#{String(node.id)}</span>
            )}
          </div>
        </div>

        {/* Right adornment slot */}
        <div className="pr-2">
          {renderRightAdornment?.(node)}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="w-full outline-none bg-neutral-900 text-neutral-200 rounded-2xl border border-white/10"
      style={{ height: (typeof (arguments as any) !== 'undefined' && ({} as any)) ? undefined : undefined }}
    >
      <div style={{ height: (typeof (height) !== 'undefined' && height !== null ? height as any : '100%'), minHeight: 240 }}>
        <Virtuoso
          style={{ height: '100%' }}
          totalCount={visible.length /* debug: console.log('rows', visible.length) */}
          overscan={200}
          itemContent={(index) => <Row index={index} />}
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Demo
// ──────────────────────────────────────────────────────────────────────────────
export function DemoTreeView() {
  const [data, setData] = useState<TreeNode[]>([
    {
      type: "folder",
      id: "Environment",
      name: "Environment",
      children: [
        { type: "go", id: 101, name: "Terrain" },
        { type: "go", id: 102, name: "SkyDome" },
        {
          type: "folder",
          id: "Props",
          name: "Props",
          children: [
            { type: "go", id: 201, name: "Crate_A" },
            { type: "go", id: 202, name: "Lamp_Post" },
          ],
        },
      ],
    },
    {
      type: "folder",
      id: "Characters",
      name: "Characters",
      children: [
        {
          type: "go",
          id: 500,
          name: "Hero",
          children: [
            { type: "go", id: 501, name: "Weapon" },
            { type: "go", id: 502, name: "CameraRig" },
          ],
        },
        { type: "go", id: 600, name: "Enemy_Grunt" },
      ],
    },
    { type: "go", id: 42, name: "DirectionalLight" },
  ]);

  const [selected, setSelected] = useState<TreeViewSelection>(null);

  return (
    <div className="h-[540px] w-full p-3">
      <TreeView
        roots={data}
        selected={selected}
        defaultExpandedIds={["Environment", "Props", 500]}
        onSelect={(sel) => setSelected(sel)}
        onTreeChange={(next) => setData(next)}
        allowDrop={(dragged, target, pos) => {
          if (pos === "into" && isGO(target) && isFolder(dragged)) return false;
          return true;
        }}
      />
    </div>
  );
}
