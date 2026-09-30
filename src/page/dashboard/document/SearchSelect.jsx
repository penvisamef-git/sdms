import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import "../master_data/masterdata.style.css";
import "./document.style.css";

/**
 * Single select with a search box.
 * props: options [{ value, label, sub? }] · value ("" = none) · onChange(value) · placeholder · disabled · clearable
 */
function SearchSelect({ options, value, onChange, placeholder, disabled, clearable = true }) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const rootRef = useRef(null);

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

  const current = options.find((o) => o.value === value);
  const kw = keyword.trim().toLowerCase();
  const visible = kw
    ? options.filter((o) => `${o.label} ${o.sub || ""}`.toLowerCase().includes(kw))
    : options;

  const choose = (v) => {
    onChange(v);
    setOpen(false);
    setKeyword("");
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
          {current ? (
            <span className="pick-value">{current.label}</span>
          ) : (
            <span className="pick-placeholder">{placeholder}</span>
          )}
        </div>

        {clearable && current && !disabled && (
          <button
            type="button"
            className="pick-clear"
            onClick={(e) => {
              e.stopPropagation();
              choose("");
            }}
            aria-label="Clear"
          >
            <X size={14} />
          </button>
        )}
        <ChevronDown size={16} className="pick-arrow" />
      </div>

      {open && (
        <div className="pick-panel">
          <div className="pick-search">
            <Search size={14} />
            <input
              type="text"
              autoFocus
              placeholder="ស្វែងរក..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="pick-options">
            {visible.length === 0 && <div className="pick-empty">មិនមានទិន្នន័យ</div>}
            {visible.map((o) => (
              <button
                type="button"
                key={o.value}
                className={`pick-item ${o.value === value ? "pick-item-active" : ""}`}
                onClick={() => choose(o.value)}
              >
                {o.label}
                {o.sub && <small>{o.sub}</small>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchSelect;
