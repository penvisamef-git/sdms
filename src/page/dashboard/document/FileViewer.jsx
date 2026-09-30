import React, { useState } from "react";
import { Download, ExternalLink, FileWarning, PenLine, X } from "lucide-react";
import { formatBytes } from "./documentHelpers";
import PdfAnnotator from "./PdfAnnotator";
import "../master_data/masterdata.style.css";
import "./document.style.css";
import "./documentView.style.css";

const IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"];

// "pdf" / "png" / "docx" … from the file object (format → original name → url)
export const fileExtension = (file) => {
  const fromFormat = String(file?.format || "").toLowerCase();
  if (fromFormat) return fromFormat;
  const source = String(file?.original_name || file?.url || "").split("?")[0];
  const match = source.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : "";
};

/**
 * Opens a document file inside the page (no new tab).
 *   PDF   → page viewer with text box / pen / signature tools (falls back to the browser's own viewer
 *           when the file can't be loaded by pdf.js) · images → <img> · other types can't be shown
 *
 * props: file ({ url, original_name, format, bytes }) · onClose
 *        onSave(blob) · saveBlockedReason · notice → the "save" button of the PDF tools (see PdfAnnotator)
 */
function FileViewer({ file, onClose, onSave, saveBlockedReason, notice }) {
  // remember which url switched to the browser's own viewer (so opening another file starts fresh)
  const [plainUrl, setPlainUrl] = useState(null);
  const [failedUrl, setFailedUrl] = useState(null);

  if (!file) return null;

  const ext = fileExtension(file);
  const isPdf = ext === "pdf";
  const isImage = IMAGE_EXT.includes(ext) || file.resource_type === "image";
  const name = file.original_name || file.public_id || "ឯកសារ";
  const plain = plainUrl === file.url || failedUrl === file.url;

  return (
    <section className="md-card doc-section doc-viewer">
      <div className="doc-viewer-head">
        <div className="doc-viewer-title">
          <strong title={name}>{name}</strong>
          <small>{[ext.toUpperCase(), formatBytes(file.bytes)].filter(Boolean).join(" · ")}</small>
        </div>
        <div className="doc-viewer-tools">
          <a
            className="md-icon-btn"
            href={file.url}
            target="_blank"
            rel="noreferrer"
            title="បើកក្នុងផ្ទាំងថ្មី"
          >
            <ExternalLink size={16} />
          </a>
          <a className="md-icon-btn" href={file.url} download={name} title="ទាញយក">
            <Download size={16} />
          </a>
          <button type="button" className="md-icon-btn" onClick={onClose} title="បិទ" aria-label="Close viewer">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="doc-viewer-body">
        {isPdf && !plain && (
          <PdfAnnotator
            key={file.url}
            file={file}
            onError={() => setFailedUrl(file.url)}
            onPlain={() => setPlainUrl(file.url)}
            onSave={onSave}
            saveBlockedReason={saveBlockedReason}
            notice={notice}
          />
        )}
        {isPdf && plain && (
          <>
            <div className="pdfa-plainbar">
              <span>
                {failedUrl === file.url
                  ? "មិនអាចបើកឧបករណ៍ចុះហត្ថលេខាបានទេ — កំពុងបង្ហាញជាមួយកម្មវិធីរបស់ browser"
                  : "កំពុងមើលដោយកម្មវិធីរបស់ browser"}
              </span>
              <button
                type="button"
                className="md-btn md-btn-ghost doc-btn-sm"
                onClick={() => {
                  setPlainUrl(null);
                  setFailedUrl(null);
                }}
              >
                <PenLine size={14} />
                សរសេរ / ចុះហត្ថលេខា
              </button>
            </div>
            <iframe key={file.url} className="doc-viewer-frame" src={file.url} title={name} />
          </>
        )}

        {!isPdf && isImage && (
          <div className="doc-viewer-image">
            <img src={file.url} alt={name} />
          </div>
        )}

        {!isPdf && !isImage && (
          <div className="doc-viewer-fallback">
            <FileWarning size={28} />
            <div>ប្រភេទឯកសារនេះមិនអាចបង្ហាញក្នុងទំព័របានទេ</div>
            <a className="md-btn md-btn-primary" href={file.url} target="_blank" rel="noreferrer">
              <ExternalLink size={16} />
              បើកឯកសារ
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

export default FileViewer;
