import React, { useEffect, useState } from "react";
import { X, Paperclip } from "lucide-react";
import { documentService } from "../../../api/api.service";
import {
  DOC_STATUS,
  formatBytes,
  formatDate,
  formatDateTime,
  personName,
} from "./documentHelpers";
import "../master_data/masterdata.style.css";
import "./document.style.css";

function FileList({ files }) {
  if (!files || files.length === 0) return <span className="md-hint">គ្មានឯកសារ</span>;
  return (
    <div className="doc-files">
      {files.map((f, i) => (
        <a key={f.public_id || i} className="doc-file" href={f.url} target="_blank" rel="noreferrer">
          <Paperclip size={14} />
          <span>{f.original_name || f.public_id}</span>
          <small>{[f.format, formatBytes(f.bytes)].filter(Boolean).join(" · ")}</small>
        </a>
      ))}
    </div>
  );
}

/**
 * Read-only document detail popup.
 * props: document (row from the list), onClose
 */
function DocumentDetailModal({ document: row, onClose }) {
  const [doc, setDoc] = useState(row);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await documentService.get(row._id);
        if (alive) setDoc(res.data);
      } catch (err) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [row._id]);

  const status = DOC_STATUS[doc.status];

  const fields = [
    ["លេខឯកសារ", doc.number_document],
    ["កាលបរិច្ឆេទចុះហត្ថលេខា", formatDate(doc.date_sign)],
    ["កម្មវត្ថុ", doc.objective, true],
    ["ប្រភេទឯកសារ", doc.document_type_id?.name],
    ["ក្របខណ្ឌឯកសារ", doc.framework_id?.name],
    ["លំហូរឯកសារ", doc.status_of_process_id?.name],
    ["អង្គភាពផ្ញើ", doc.send_from_office_id?.name || doc.office_id_open?.name],
    ["អ្នកផ្ញើ", personName(doc.send_from_user_id)],
    ["កាលបរិច្ឆេទផ្ញើ", formatDateTime(doc.date_sent)],
    ["កាលបរិច្ឆេទចូល", formatDate(doc.date_in)],
    ["ចុះលេខចេញ", formatDate(doc.date_registration_document)],
    ["បង្កើតដោយ", personName(doc.created_by)],
    ["បង្កើតនៅ", formatDateTime(doc.created_date)],
    ["កែប្រែចុងក្រោយ", formatDateTime(doc.updated_date)],
    ["កំណត់សម្គាល់", doc.note_from_user, true],
  ];

  return (
    <div className="md-page">
      <div className="md-modal-backdrop" onMouseDown={onClose}>
        <div className="md-modal md-modal-wide" onMouseDown={(e) => e.stopPropagation()}>
          <div className="md-modal-header">
            <h3>ព័ត៌មានលម្អិតឯកសារ</h3>
            <button type="button" className="md-icon-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <div className="md-modal-body">
            {loading && <div className="md-hint">កំពុងផ្ទុកទិន្នន័យ...</div>}
            {error && <div className="md-form-error">{error}</div>}

            <div className="doc-detail-head">
              <div className="doc-detail-code">{doc.code_of_document || "-"}</div>
              {status && <span className={`md-badge ${status.badge}`}>{status.label}</span>}
            </div>

            <dl className="doc-detail">
              {fields.map(([label, value, full]) => (
                <div key={label} className={`doc-detail-row ${full ? "doc-detail-row-full" : ""}`}>
                  <dt>{label}</dt>
                  <dd>{value || "-"}</dd>
                </div>
              ))}
            </dl>

            <div className="doc-section-title">ឯកសារគោល</div>
            <FileList files={doc.document_main_url} />

            <div className="doc-section-title">ឯកសារយោង</div>
            {(doc.reference_document || []).length === 0 && (
              <span className="md-hint">គ្មានឯកសារយោង</span>
            )}
            {(doc.reference_document || []).map((ref, i) => (
              <div key={ref._id || i} className="doc-ref">
                <div>
                  <strong>{ref.number_document || "-"}</strong>
                  {ref.date_sign && <span className="md-hint"> · {formatDate(ref.date_sign)}</span>}
                </div>
                {ref.objective && <div>{ref.objective}</div>}
                <FileList files={ref.files} />
              </div>
            ))}

            <div className="doc-section-title">អ្នកទទួល</div>
            {(doc.send_to_office_id || []).length === 0 && (doc.send_to_user_id || []).length === 0 ? (
              <span className="md-hint">មិនទាន់បានផ្ញើ</span>
            ) : (
              <div className="doc-detail">
                <div className="doc-detail-row">
                  <dt>អង្គភាពទទួល</dt>
                  <dd>
                    {(doc.send_to_office_id || []).map((o) => o?.name).filter(Boolean).join(", ") || "-"}
                  </dd>
                </div>
                <div className="doc-detail-row">
                  <dt>អ្នកប្រើប្រាស់ទទួល</dt>
                  <dd>
                    {(doc.send_to_user_id || [])
                      .map((u) => personName(u))
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </dd>
                </div>
              </div>
            )}
          </div>

          <div className="md-modal-footer">
            <button type="button" className="md-btn md-btn-ghost" onClick={onClose}>
              បិទ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentDetailModal;
