import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Search, X } from "lucide-react";
import "../master_data/masterdata.style.css";
import "./document.style.css";

const LEVEL_LABEL = {
  unit: "អង្គភាព",
  general_directorate: "អគ្គនាយកដ្ឋាន",
  department: "នាយកដ្ឋាន",
  office: "ការិយាល័យ",
};

// Give every node the list of selectable office ids below it (its own id for an office)
function annotate(node, excludeId) {
  const children = (node.children || []).map((c) => annotate(c, excludeId));
  const own = node.level === "office" && node._id !== excludeId ? [node._id] : [];
  const leaves = own.concat(...children.map((c) => c._leaves));
  return { ...node, children, _leaves: leaves };
}

// Keep nodes that match the keyword. A matching node keeps its whole subtree;
// a node kept only because a descendant matches is marked _ctx (context, not selectable here).
function filterTree(nodes, kw) {
  if (!kw) return nodes;
  const out = [];
  nodes.forEach((n) => {
    if (`${n.name} ${n.name_in_eng || ""}`.toLowerCase().includes(kw)) {
      out.push(n);
      return;
    }
    const kids = filterTree(n.children, kw);
    if (kids.length) out.push({ ...n, children: kids, _ctx: true });
  });
  return out;
}

function TreeRow({ node, depth, single, value, selectedSet, expanded, forceOpen, onToggleOpen, onToggleSelect }) {
  const selectedCount = node._leaves.filter((id) => selectedSet.has(id)).length;
  const checked = single
    ? value === node._id
    : node._leaves.length > 0 && selectedCount === node._leaves.length;
  const partial = !single && selectedCount > 0 && !checked;
  const hasChildren = node.children.length > 0;
  const open = forceOpen || expanded.has(node._id);
  const disabled = node._leaves.length === 0 || node._ctx;

  const checkRef = useRef(null);
  useEffect(() => {
    if (checkRef.current) checkRef.current.indeterminate = partial;
  }, [partial]);

  return (
    <>
      <div className="pick-tree-row" style={{ paddingLeft: 6 + depth * 20 }}>
        <button
          type="button"
          className="pick-tree-toggle"
          onClick={() => hasChildren && onToggleOpen(node._id)}
          tabIndex={-1}
          aria-label="Toggle"
          style={{ visibility: hasChildren ? "visible" : "hidden" }}
        >
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <label className={`pick-tree-label ${disabled ? "pick-tree-label-disabled" : ""}`}>
          <input
            ref={checkRef}
            type={single ? "radio" : "checkbox"}
            checked={checked}
            disabled={disabled}
            onChange={() => onToggleSelect(node, checked)}
          />
          <span className="pick-tree-name">{node.name}</span>
          <span className="pick-tree-level">{LEVEL_LABEL[node.level] || ""}</span>
          {node.level !== "office" && node._leaves.length > 0 && (
            <span className="pick-tree-count">{node._leaves.length}</span>
          )}
        </label>
      </div>

      {open &&
        node.children.map((child) => (
          <TreeRow
            key={child._id}
            node={child}
            depth={depth + 1}
            single={single}
            value={value}
            selectedSet={selectedSet}
            expanded={expanded}
            forceOpen={forceOpen}
            onToggleOpen={onToggleOpen}
            onToggleSelect={onToggleSelect}
          />
        ))}
    </>
  );
}

/**
 * Tree select: pick any level (unit / general directorate / department / office).
 * Picking a higher level selects every office below it — the API only accepts office ids.
 *
 * props:
 *   tree      - root nodes [{ _id, name, level, children }] (from GET /master-data/unit-tree)
 *   excludeId - an office that can't be selected (your own office)
 *   single    - pick ONE node (radio). Use value + onPick. Otherwise multiple: selected + onChange
 *   value     - (single) id of the chosen node
 *   onPick    - (single) (node | null) => void — node has _leaves (the office ids below it)
 *   selected  - (multiple) selected OFFICE ids (array)
 *   onChange  - (multiple) (officeIds[]) => void
 */
function OrgTreeSelect({
  tree,
  excludeId,
  single,
  value,
  onPick,
  selected = [],
  onChange,
  placeholder,
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [expanded, setExpanded] = useState(() => new Set());
  const rootRef = useRef(null);

  const annotated = useMemo(() => tree.map((n) => annotate(n, excludeId)), [tree, excludeId]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  // open the top level once the tree arrives
  useEffect(() => {
    setExpanded(new Set(annotated.map((n) => n._id)));
  }, [annotated]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const kw = keyword.trim().toLowerCase();
  const visibleTree = useMemo(() => filterTree(annotated, kw), [annotated, kw]);

  const toggleOpen = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Select / unselect every office below the node
  const toggleSelect = (node, checked) => {
    if (single) {
      onPick(node);
      setOpen(false);
      setKeyword("");
      return;
    }
    const next = new Set(selectedSet);
    node._leaves.forEach((id) => (checked ? next.delete(id) : next.add(id)));
    onChange([...next]);
  };

  // Chips: the highest nodes that are fully selected (partial nodes show their children instead)
  const chips = useMemo(() => {
    if (single) {
      // the one chosen node
      let found = null;
      const find = (nodes) =>
        nodes.forEach((n) => {
          if (n._id === value) found = n;
          else find(n.children);
        });
      find(annotated);
      return found ? [found] : [];
    }
    const list = [];
    const walk = (nodes) =>
      nodes.forEach((n) => {
        if (n._leaves.length === 0) return;
        const count = n._leaves.filter((id) => selectedSet.has(id)).length;
        if (count === n._leaves.length) list.push(n);
        else if (count > 0) walk(n.children);
      });
    walk(annotated);
    return list;
  }, [annotated, selectedSet, single, value]);

  const removeChip = (node) => {
    if (single) {
      onPick(null);
      return;
    }
    const drop = new Set(node._leaves);
    onChange(selected.filter((id) => !drop.has(id)));
  };

  return (
    <div className="pick" ref={rootRef}>
      <div
        className={`pick-control ${open ? "pick-control-open" : ""} ${disabled ? "pick-control-disabled" : ""}`}
        onClick={() => !disabled && setOpen((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
      >
        <div className="pick-chips">
          {chips.length === 0 && <span className="pick-placeholder">{placeholder}</span>}
          {chips.map((n) => (
            <span key={n._id} className="pick-chip" title={LEVEL_LABEL[n.level]}>
              {n.name}
              {n.level !== "office" && <em>{n._leaves.length} ការិយាល័យ</em>}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeChip(n);
                }}
                disabled={disabled}
                aria-label="Remove"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <ChevronDown size={16} className="pick-arrow" />
      </div>

      {open && (
        <div className="pick-panel">
          <div className="pick-search">
            <Search size={14} />
            <input
              type="text"
              autoFocus
              placeholder="ស្វែងរកអង្គភាព អគ្គនាយកដ្ឋាន នាយកដ្ឋាន ឬការិយាល័យ..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="pick-options pick-tree">
            {visibleTree.length === 0 && <div className="pick-empty">មិនមានទិន្នន័យ</div>}
            {visibleTree.map((n) => (
              <TreeRow
                key={n._id}
                node={n}
                depth={0}
                single={single}
                value={value}
                selectedSet={selectedSet}
                expanded={expanded}
                forceOpen={!!kw}
                onToggleOpen={toggleOpen}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>

          {!single && selected.length > 0 && (
            <div className="pick-foot">
              <span>បានជ្រើសរើស {selected.length} ការិយាល័យ</span>
              <button type="button" onClick={() => onChange([])}>
                សម្អាត
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OrgTreeSelect;
