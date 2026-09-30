import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Landmark,
  Building2,
  Briefcase,
  Users,
  User,
  ChevronRight,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import UserDetailModal from "./UserDetailModal";
import "./masterdata.style.css";

const LEVELS = {
  unit: { label: "អង្គភាព", Icon: Landmark },
  general_directorate: { label: "អគ្គនាយកដ្ឋាន", Icon: Building2 },
  department: { label: "នាយកដ្ឋាន", Icon: Briefcase },
  office: { label: "ការិយាល័យ", Icon: Users },
};

const matches = (parts, keyword) =>
  parts.filter(Boolean).join(" ").toLowerCase().includes(keyword);

const userText = (u) => [u.firstname, u.lastname, u.email, u.contact, u.job_title];

const userName = (u) => `${u.firstname || ""} ${u.lastname || ""}`.trim();

// The API returns users as children with level "user".
// Split them from the org children and count the users below every node.
function normalize(node) {
  const kids = node.children || [];
  const users = kids.filter((k) => k.level === "user");
  const children = kids.filter((k) => k.level !== "user").map(normalize);
  const userCount = users.length + children.reduce((sum, c) => sum + c.userCount, 0);
  return { ...node, users, children, userCount };
}

// Keep only what matches the keyword (a matching node keeps its whole subtree)
function filterNode(node, keyword) {
  if (!keyword) return node;

  if (matches([node.name, node.name_in_eng], keyword)) return node;

  const children = node.children.map((c) => filterNode(c, keyword)).filter(Boolean);
  const users = node.users.filter((u) => matches(userText(u), keyword));

  if (children.length === 0 && users.length === 0) return null;
  return { ...node, children, users };
}

function collectIds(nodes, ids = []) {
  nodes.forEach((n) => {
    if (n.children.length > 0 || n.users.length > 0) ids.push(n._id);
    collectIds(n.children, ids);
  });
  return ids;
}

function TreeNode({ node, depth, expanded, forceOpen, onToggle, onUserClick }) {
  const { label, Icon } = LEVELS[node.level] || LEVELS.unit;
  const hasChildren = node.children.length > 0 || node.users.length > 0;
  const open = forceOpen || expanded.has(node._id);

  return (
    <div className="md-tree-node">
      <div
        className={`md-tree-row md-tree-row-${node.level}`}
        style={{ paddingLeft: 10 + depth * 24 }}
        onClick={() => hasChildren && onToggle(node._id)}
        role={hasChildren ? "button" : undefined}
      >
        <span className="md-tree-toggle">
          {hasChildren ? open ? <ChevronDown size={16} /> : <ChevronRight size={16} /> : null}
        </span>
        <span className={`md-tree-icon md-tree-icon-${node.level}`}>
          <Icon size={16} />
        </span>
        <span className="md-tree-name">{node.name}</span>
        {node.name_in_eng && <span className="md-tree-sub">{node.name_in_eng}</span>}
        <span className="md-tree-level">{label}</span>
        {node.userCount > 0 && (
          <span className="md-tree-count" title="ចំនួនអ្នកប្រើប្រាស់">
            <User size={12} />
            {node.userCount}
          </span>
        )}
        {node.status === false && <span className="md-badge md-badge-off">អសកម្ម</span>}
      </div>

      {open && (
        <div className="md-tree-children">
          {node.children.map((child) => (
            <TreeNode
              key={child._id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              forceOpen={forceOpen}
              onToggle={onToggle}
              onUserClick={onUserClick}
            />
          ))}

          {node.users.map((u) => (
            <div
              key={u._id}
              className="md-tree-row md-tree-user"
              style={{ paddingLeft: 10 + (depth + 1) * 24 }}
              onClick={() => onUserClick(u)}
              role="button"
              title="មើលព័ត៌មានលម្អិត"
            >
              <span className="md-tree-toggle" />
              <span className="md-tree-icon md-tree-icon-user">
                <User size={15} />
              </span>
              <span className="md-tree-name">{userName(u)}</span>
              {u.job_title && <span className="md-tree-sub">{u.job_title}</span>}
              <span className="md-tree-contact">{u.email}</span>
              {u.contact && <span className="md-tree-contact">{u.contact}</span>}
              {u.status === false && <span className="md-badge md-badge-off">អសកម្ម</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Generic org tree (Unit → General Directorate → Department → Office → Users).
 * props:
 *   fetchTree - async () => ({ data: [rootNodes] }); nodes are { _id, name, name_in_eng, level, status, children }
 *               and users are children with level "user"
 */
function OrgTree({ fetchTree }) {
  const [tree, setTree] = useState([]);
  const [expanded, setExpanded] = useState(new Set());
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const firstLoad = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchTree();
      const data = (res.data || []).map(normalize);
      setTree(data);
      // open the top level by default (only the first time, so a reload keeps your place)
      if (firstLoad.current) {
        firstLoad.current = false;
        setExpanded(new Set(data.map((node) => node._id)));
      }
    } catch (err) {
      setError(err.message);
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, [fetchTree]);

  useEffect(() => {
    load();
  }, [load]);

  const kw = keyword.trim().toLowerCase();

  const visibleTree = useMemo(
    () => tree.map((root) => filterNode(root, kw)).filter(Boolean),
    [tree, kw],
  );

  const toggle = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const expandAll = () => setExpanded(new Set(collectIds(tree)));
  const collapseAll = () => setExpanded(new Set());

  return (
    <div className="md-page">
      <div className="md-toolbar">
        <div className="md-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="ស្វែងរកអង្គភាព នាយកដ្ឋាន ការិយាល័យ ឬអ្នកប្រើប្រាស់..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          {keyword && (
            <button type="button" onClick={() => setKeyword("")} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="md-toolbar-actions">
          <button type="button" className="md-btn md-btn-ghost" onClick={expandAll} title="ពង្រីកទាំងអស់">
            <ChevronsUpDown size={16} />
          </button>
          <button type="button" className="md-btn md-btn-ghost" onClick={collapseAll} title="បង្រួមទាំងអស់">
            <ChevronsDownUp size={16} />
          </button>
          <button
            type="button"
            className="md-btn md-btn-ghost"
            onClick={load}
            disabled={loading}
            title="ផ្ទុកឡើងវិញ"
          >
            <RefreshCw size={16} className={loading ? "md-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="md-card md-tree">
        {loading && tree.length === 0 && <div className="md-empty">កំពុងផ្ទុកទិន្នន័យ...</div>}

        {!loading && error && <div className="md-empty md-empty-error">{error}</div>}

        {!loading && !error && visibleTree.length === 0 && (
          <div className="md-empty">
            {kw ? "រកមិនឃើញទិន្នន័យដែលត្រូវនឹងការស្វែងរក" : "មិនទាន់មានទិន្នន័យ"}
          </div>
        )}

        {visibleTree.map((root) => (
          <TreeNode
            key={root._id}
            node={root}
            depth={0}
            expanded={expanded}
            forceOpen={!!kw}
            onToggle={toggle}
            onUserClick={setSelectedUser}
          />
        ))}
      </div>

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}

export default OrgTree;
