import React, { useState } from "react";
import { List, FolderTree } from "lucide-react";
import "./masterdata.style.css";

const TABS = [
  { key: "list", label: "បញ្ជី", Icon: List },
  { key: "tree", label: "រចនាសម្ព័ន្ធ", Icon: FolderTree },
];

/**
 * Two tabs used by the organisation master data pages.
 * props: list - element for the list tab · tree - element for the tree tab
 */
function ListTreeTabs({ list, tree }) {
  const [tab, setTab] = useState("list");

  return (
    <div className="md-page">
      <div className="md-tabs" role="tablist">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`md-tab ${tab === key ? "md-tab-active" : ""}`}
            onClick={() => setTab(key)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {tab === "list" ? list : tree}
    </div>
  );
}

export default ListTreeTabs;
