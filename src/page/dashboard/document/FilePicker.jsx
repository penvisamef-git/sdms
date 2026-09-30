import React, { useRef, useState } from "react";
import { Paperclip, UploadCloud, X } from "lucide-react";
import { formatBytes } from "./documentHelpers";
import "../master_data/masterdata.style.css";
import "./document.style.css";

/**
 * Multiple file picker with drag & drop.
 * props: files (File[]) · onChange(File[]) · disabled · hint
 */
function FilePicker({ files, onChange, disabled, hint }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = (list) => {
    const incoming = Array.from(list || []);
    if (incoming.length === 0) return;
    // skip exact duplicates (same name + size)
    const known = new Set(files.map((f) => `${f.name}:${f.size}`));
    const fresh = incoming.filter((f) => !known.has(`${f.name}:${f.size}`));
    onChange([...files, ...fresh]);
  };

  const removeAt = (index) => onChange(files.filter((_, i) => i !== index));

  return (
    <div className="file-picker">
      <div
        className={`file-drop ${dragging ? "file-drop-active" : ""} ${disabled ? "file-drop-disabled" : ""}`}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) addFiles(e.dataTransfer.files);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <UploadCloud size={22} />
        <div>
          <strong>ចុចដើម្បីជ្រើសរើសឯកសារ</strong> ឬអូសមកទីនេះ
        </div>
        {hint && <div className="md-hint">{hint}</div>}
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          disabled={disabled}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = ""; // allow picking the same file again
          }}
        />
      </div>

      {files.length > 0 && (
        <div className="file-list">
          {files.map((f, i) => (
            <div key={`${f.name}:${f.size}:${i}`} className="file-item">
              <Paperclip size={14} />
              <span className="file-name" title={f.name}>
                {f.name}
              </span>
              <small>{formatBytes(f.size)}</small>
              <button
                type="button"
                className="md-icon-btn"
                onClick={() => removeAt(i)}
                disabled={disabled}
                aria-label="Remove file"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FilePicker;
