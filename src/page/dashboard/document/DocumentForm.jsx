import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Save, ArrowLeft, Lock, Paperclip, X } from "lucide-react";
import {
  documentService,
  documentTypeService,
  frameworkService,
  statusOfProcessService,
  unitService,
  userService,
} from "../../../api/api.service";
import { needsDirectUpload, uploadDirect } from "../../../api/directUpload";
import Auth from "../../util/auth";
import FilePicker from "./FilePicker";
import SearchSelect from "./SearchSelect";
import ReceiverCard from "./ReceiverCard";
import { formatBytes, idOf } from "./documentHelpers";
import "../master_data/masterdata.style.css";
import "./document.style.css";
import "./documentView.style.css";

// Limits enforced by sdms_api (multer)
const MAX_FILE_MB = 20;
const MAX_FILES = 30;

const EMPTY_FORM = {
  objective: "",
  number_document: "",
  date_sign: "",
  date_in: "",
  date_registration_document: "",
  note_from_user: "",
  status_of_process_id: "",
  document_type_id: "",
  framework_id: "",
};

const ID_KEYS = ["status_of_process_id", "document_type_id", "framework_id"];
const DATE_KEYS = ["date_sign", "date_in", "date_registration_document"];

// `files` = new files to upload · `existing` = files already saved on the server (edit only)
let refCounter = 0;
const newRef = (extra = {}) => ({
  key: ++refCounter,
  number_document: "",
  date_sign: "",
  objective: "",
  files: [],
  existing: [],
  ...extra,
});

// ISO date → value of <input type="date">
const toDateInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

// Files already saved on the server — can be opened or removed
function SavedFiles({ files, onChange, disabled }) {
  if (!files || files.length === 0) return null;
  return (
    <div className="file-list">
      {files.map((f, i) => (
        <div key={f.public_id || i} className="file-item">
          <Paperclip size={14} />
          <a className="file-name" href={f.url} target="_blank" rel="noreferrer" title={f.original_name}>
            {f.original_name || f.public_id}
          </a>
          <small>{formatBytes(f.bytes)}</small>
          <button
            type="button"
            className="md-icon-btn"
            onClick={() => onChange(files.filter((_, idx) => idx !== i))}
            disabled={disabled}
            aria-label="Remove file"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function Field({ label, required, full, children, htmlFor }) {
  return (
    <div className={`md-field ${full ? "md-field-full" : ""}`}>
      <label htmlFor={htmlFor}>
        {label}
        {required && <span className="md-required">*</span>}
      </label>
      {children}
    </div>
  );
}

/**
 * Create / edit a document (ឯកសារចេញ).
 *   create → POST /document as multipart/form-data
 *            (fields · document_files · reference_document JSON · reference_files_N · send_to_office_id · send_to_user_id)
 *   edit   → (documentId given) PUT /document/:id — allowed only while nobody has received the document
 *            (every transfer still "pending", see GET /document/:id/tracking)
 *            1) JSON with the fields + the files to keep  2) multipart with the newly added files
 *            3) receivers chosen here are ADDED with POST /document/:id/send (receivers already sent stay)
 */
function DocumentForm({ documentId }) {
  const isEdit = Boolean(documentId);
  const navigate = useNavigate();
  const me = new Auth().getClientLogin();
  const myOfficeId = me?.office_id;
  const myUserId = me?._id;

  const [form, setForm] = useState(EMPTY_FORM);
  const [mainFiles, setMainFiles] = useState([]);
  const [refs, setRefs] = useState([]);
  const [toOffice, setToOffice] = useState(null); // chosen tree node: { id, offices: [officeId, ...] }
  const [toUserId, setToUserId] = useState("");

  const [statusOfProcess, setStatusOfProcess] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [frameworks, setFrameworks] = useState([]);
  const [orgTree, setOrgTree] = useState([]);
  const [users, setUsers] = useState([]);

  const [sendNote, setSendNote] = useState(""); // instruction for the receivers
  const [mainKept, setMainKept] = useState([]); // saved main files still kept (edit)
  const [doc, setDoc] = useState(null); // the document being edited
  const [tracking, setTracking] = useState(null); // its transfers (edit)

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const notOwner = isEdit && !!doc && !me?.is_super_admin && idOf(doc.office_id_open) !== myOfficeId;
  // once someone received it (or it moved on) the document can't be edited any more
  const alreadyReceived =
    isEdit &&
    !!doc &&
    (tracking ? (tracking.timeline || []).some((t) => t.status !== "pending") : doc.status !== "new");
  const locked = notOwner || alreadyReceived;
  const busy = saving || loading || locked;
  // names of the receivers the document was already sent to
  const sentNames = doc
    ? [
        ...(doc.send_to_office_id || []).map((o) => o?.name),
        ...(doc.send_to_user_id || []).map((u) => `${u?.firstname || ""} ${u?.lastname || ""}`.trim()),
      ].filter(Boolean)
    : [];

  // Load the dropdown options once
  useEffect(() => {
    const safe = (promise) => promise.then((r) => r.data || []).catch(() => []);
    (async () => {
      const [sp, dt, fw, of, us, docRes, trackRes] = await Promise.all([
        safe(statusOfProcessService.all()),
        safe(documentTypeService.all()),
        safe(frameworkService.all()),
        safe(unitService.tree()),
        safe(userService.all()),
        isEdit
          ? documentService.get(documentId).catch((err) => ({ failed: err.message }))
          : Promise.resolve(null),
        isEdit ? documentService.tracking(documentId).catch(() => null) : Promise.resolve(null),
      ]);
      setStatusOfProcess(sp);
      setDocumentTypes(dt);
      setFrameworks(fw);
      setOrgTree(of);
      setUsers(us);

      if (isEdit) {
        const d = docRes?.data;
        if (!d) {
          setError(docRes?.failed || "រកមិនឃើញឯកសារ");
        } else {
          setDoc(d);
          setTracking(trackRes?.data || null);
          setForm({
            objective: d.objective || "",
            number_document: d.number_document || "",
            date_sign: toDateInput(d.date_sign),
            date_in: toDateInput(d.date_in),
            date_registration_document: toDateInput(d.date_registration_document),
            note_from_user: d.note_from_user || "",
            status_of_process_id: idOf(d.status_of_process_id) || "",
            document_type_id: idOf(d.document_type_id) || "",
            framework_id: idOf(d.framework_id) || "",
          });
          setMainKept(d.document_main_url || []);
          setRefs(
            (d.reference_document || []).map((r) =>
              newRef({
                number_document: r.number_document || "",
                date_sign: toDateInput(r.date_sign),
                objective: r.objective || "",
                existing: r.files || [],
              }),
            ),
          );
        }
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const toOption = (item) => ({
    value: item._id,
    label: item.code ? `${item.code} - ${item.name}` : item.name,
  });
  const documentTypeOptions = useMemo(() => documentTypes.map(toOption), [documentTypes]);
  const frameworkOptions = useMemo(() => frameworks.map(toOption), [frameworks]);
  const statusOfProcessOptions = useMemo(() => statusOfProcess.map(toOption), [statusOfProcess]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // ---------------- References ----------------
  const addRef = () => setRefs((prev) => [...prev, newRef()]);
  const removeRef = (key) => setRefs((prev) => prev.filter((r) => r.key !== key));
  const setRefField = (key, field, value) =>
    setRefs((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));

  // ---------------- Submit ----------------
  const [uploadPct, setUploadPct] = useState(null); // 0..1 while big files upload straight to Cloudinary

  // upload every new file straight to Cloudinary → { main: [...], refs: [[...], ...] } (refs follow usedRefs order)
  const uploadAll = async (usedRefs) => {
    const groups = [
      { files: mainFiles, folder: "documents" },
      ...usedRefs.map((r) => ({ files: r.files, folder: "references" })),
    ];
    const total = groups.reduce((sum, g) => sum + g.files.reduce((s, f) => s + f.size, 0), 0) || 1;
    let before = 0;
    const results = [];
    setUploadPct(0);
    for (const g of groups) {
      const size = g.files.reduce((s, f) => s + f.size, 0);
      results.push(
        await uploadDirect(g.files, g.folder, (fraction) => setUploadPct((before + fraction * size) / total)),
      );
      before += size;
    }
    setUploadPct(null);
    return { main: results[0], refs: results.slice(1) };
  };

  const checkFiles = (files, label) => {
    const tooBig = files.find((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    if (tooBig) return `${label}: "${tooBig.name}" ធំពេក! (អតិបរមា ${MAX_FILE_MB}MB)`;
    return "";
  };

  // Edit: 1) JSON PUT with the fields and the saved files to keep, 2) multipart PUT with the new files
  // (the API appends uploaded files to the saved ones, so a removed saved file needs step 1 first)
  // `up` (big files only): files already uploaded straight to Cloudinary → { main: [...], refs: [[...], ...] }
  const submitEdit = async (usedRefs, up) => {
    const body = {};
    Object.entries(form).forEach(([key, value]) => {
      const text = String(value).trim();
      if (ID_KEYS.includes(key)) body[key] = text || null;
      else if (DATE_KEYS.includes(key)) body[key] = text || null;
      else body[key] = text;
    });
    body.document_main_url = [...mainKept, ...(up?.main || [])];
    body.reference_document = usedRefs.map((r, i) => ({
      number_document: r.number_document.trim(),
      date_sign: r.date_sign || null,
      objective: r.objective.trim(),
      files: [...r.existing, ...(up?.refs?.[i] || [])],
    }));

    let res = await documentService.update(documentId, body);

    const hasNewMain = !up && mainFiles.length > 0;
    const hasNewRef = !up && usedRefs.some((r) => r.files.length > 0);
    if (hasNewMain || hasNewRef) {
      const fd = new FormData();
      mainFiles.forEach((f) => fd.append("document_files", f));
      if (hasNewRef) {
        // keep the same order as step 1 so reference_files_N points to the right row
        const saved = res.data?.reference_document || [];
        fd.append(
          "reference_document",
          JSON.stringify(
            usedRefs.map((r, i) => ({
              number_document: saved[i]?.number_document ?? r.number_document.trim(),
              date_sign: saved[i]?.date_sign ?? (r.date_sign || null),
              objective: saved[i]?.objective ?? r.objective.trim(),
              files: saved[i]?.files || r.existing,
            })),
          ),
        );
        usedRefs.forEach((r, i) => r.files.forEach((f) => fd.append(`reference_files_${i}`, f)));
      }
      res = await documentService.update(documentId, fd);
    }

    // receivers chosen on this page are added (and get a transfer); the ones already sent stay
    const offices = toOffice?.offices || [];
    if (offices.length > 0 || toUserId) {
      res = await documentService.send(documentId, {
        send_to_office_id: offices,
        send_to_user_id: toUserId ? [toUserId] : [],
        note: sendNote,
      });
    }
    return res;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (locked || loading) return;

    if (!form.objective.trim()) {
      setError("សូមបញ្ចូល កម្មវត្ថុ");
      return;
    }

    // a reference row counts when it has text or files
    const usedRefs = refs.filter(
      (r) =>
        r.number_document.trim() ||
        r.objective.trim() ||
        r.date_sign ||
        r.files.length > 0 ||
        r.existing.length > 0,
    );

    const totalFiles =
      mainFiles.length +
      mainKept.length +
      usedRefs.reduce((sum, r) => sum + r.files.length + r.existing.length, 0);
    if (totalFiles > MAX_FILES) {
      setError(`អាចបញ្ចូលបានអតិបរមា ${MAX_FILES} ឯកសារ (បច្ចុប្បន្ន ${totalFiles})`);
      return;
    }
    const fileError =
      checkFiles(mainFiles, "ឯកសារគោល") ||
      usedRefs.map((r, i) => checkFiles(r.files, `ឯកសារយោងទី ${i + 1}`)).find(Boolean);
    if (fileError) {
      setError(fileError);
      return;
    }

    // big files go straight to Cloudinary (the API can't take more than ~4 MB per request on Vercel)
    const newFiles = [...mainFiles, ...usedRefs.flatMap((r) => r.files)];
    const direct = needsDirectUpload(newFiles);

    if (isEdit) {
      setSaving(true);
      try {
        const up = direct ? await uploadAll(usedRefs) : undefined;
        const res = await submitEdit(usedRefs, up);
        navigate("/document/out", { state: { notice: res.message || "បានរក្សាទុក!" } });
      } catch (err) {
        setError(err.message);
        setSaving(false);
        setUploadPct(null);
      }
      return;
    }

    if (direct) {
      setSaving(true);
      try {
        const up = await uploadAll(usedRefs);
        const body = {};
        Object.entries(form).forEach(([key, value]) => {
          if (String(value).trim() !== "") body[key] = value;
        });
        const offices = toOffice?.offices || [];
        if (offices.length > 0) body.send_to_office_id = offices;
        if (toUserId) body.send_to_user_id = [toUserId];
        if (sendNote.trim()) body.send_note = sendNote.trim();
        if (up.main.length > 0) body.document_main_url = up.main;
        if (usedRefs.length > 0) {
          body.reference_document = usedRefs.map((r, i) => ({
            number_document: r.number_document.trim(),
            date_sign: r.date_sign || null,
            objective: r.objective.trim(),
            files: up.refs[i] || [],
          }));
        }
        const res = await documentService.create(body);
        navigate("/document/out", { state: { notice: res.message || "បានរក្សាទុក!" } });
      } catch (err) {
        setError(err.message);
        setSaving(false);
        setUploadPct(null);
      }
      return;
    }

    const fd = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (String(value).trim() !== "") fd.append(key, value);
    });
    // picking a unit / directorate / department sends to every office below it
    (toOffice?.offices || []).forEach((id) => fd.append("send_to_office_id", id));
    if (toUserId) fd.append("send_to_user_id", toUserId);
    if (sendNote.trim()) fd.append("send_note", sendNote.trim());
    mainFiles.forEach((f) => fd.append("document_files", f));

    if (usedRefs.length > 0) {
      fd.append(
        "reference_document",
        JSON.stringify(
          usedRefs.map((r) => ({
            number_document: r.number_document.trim(),
            date_sign: r.date_sign || null,
            objective: r.objective.trim(),
          })),
        ),
      );
      // reference_files_N belongs to reference_document[N]
      usedRefs.forEach((r, index) => {
        r.files.forEach((f) => fd.append(`reference_files_${index}`, f));
      });
    }

    setSaving(true);
    try {
      const res = await documentService.create(fd);
      navigate("/document/out", { state: { notice: res.message || "បានរក្សាទុក!" } });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form className="md-page doc-create" onSubmit={handleSubmit}>
      {isEdit && doc && (
        <div className={`doc-edit-bar ${locked ? "doc-edit-bar-locked" : ""}`}>
          <strong>{doc.code_of_document}</strong>
          {locked && (
            <span className="doc-edit-lock">
              <Lock size={14} />
              {notOwner
                ? "អ្នកមិនមានសិទ្ធិកែប្រែឯកសារនេះទេ"
                : "មិនអាចកែប្រែបានទេ ព្រោះមានអ្នកទទួលឯកសារនេះរួចហើយ"}
            </span>
          )}
        </div>
      )}
      {isEdit && loading && <div className="md-hint">កំពុងផ្ទុកទិន្នន័យ...</div>}

      {/* ===== Receivers ===== */}
      {/* one to one: a document that already has a receiver can't be sent to another one */}
      {isEdit && sentNames.length > 0 ? (
        <section className="md-card doc-section">
          <h3 className="doc-section-heading">អ្នកទទួល</h3>
          <div className="md-hint">ឯកសារនេះត្រូវបានផ្ញើរួចហើយទៅ: {sentNames.join(", ")}</div>
        </section>
      ) : (
        <ReceiverCard
          orgTree={orgTree}
          users={users}
          myOfficeId={myOfficeId}
          myUserId={myUserId}
          toOffice={toOffice}
          onOfficeChange={setToOffice}
          toUserId={toUserId}
          onUserChange={setToUserId}
          disabled={busy}
        >
          <div className="doc-grid doc-action-note">
            <Field label="ការណែនាំដល់អ្នកទទួល" full htmlFor="send_note">
              <textarea
                id="send_note"
                rows={2}
                placeholder="បញ្ចូលការណែនាំ (មិនចាំបាច់)"
                value={sendNote}
                onChange={(e) => setSendNote(e.target.value)}
                disabled={busy}
              />
            </Field>
          </div>
        </ReceiverCard>
      )}

      {/* ===== 1. Document information ===== */}
      <section className="md-card doc-section">
        <h3 className="doc-section-heading">ព័ត៌មានឯកសារ</h3>

        <div className="doc-grid">
          <Field label="កម្មវត្ថុ" required full htmlFor="objective">
            <textarea
              id="objective"
              rows={3}
              placeholder="បញ្ចូលកម្មវត្ថុ"
              value={form.objective}
              onChange={(e) => setField("objective", e.target.value)}
              disabled={busy}
            />
          </Field>

          <Field label="លេខឯកសារ" htmlFor="number_document">
            <input
              id="number_document"
              type="text"
              placeholder="ឧ. ១២៣/២៦ សហវ"
              value={form.number_document}
              onChange={(e) => setField("number_document", e.target.value)}
              disabled={busy}
            />
          </Field>

          <Field label="កាលបរិច្ឆេទចុះហត្ថលេខា" htmlFor="date_sign">
            <input
              id="date_sign"
              type="date"
              value={form.date_sign}
              onChange={(e) => setField("date_sign", e.target.value)}
              disabled={busy}
            />
          </Field>

          <Field label="កាលបរិច្ឆេទចូល" htmlFor="date_in">
            <input
              id="date_in"
              type="date"
              value={form.date_in}
              onChange={(e) => setField("date_in", e.target.value)}
              disabled={busy}
            />
          </Field>

          <Field label="ចុះលេខចេញ" htmlFor="date_registration_document">
            <input
              id="date_registration_document"
              type="date"
              value={form.date_registration_document}
              onChange={(e) => setField("date_registration_document", e.target.value)}
              disabled={busy}
            />
          </Field>

          <Field label="ប្រភេទឯកសារ" htmlFor="document_type_id">
            <SearchSelect
              options={documentTypeOptions}
              value={form.document_type_id}
              onChange={(v) => setField("document_type_id", v)}
              placeholder="-- ជ្រើសរើស --"
              disabled={busy}
            />
          </Field>

          <Field label="ក្របខណ្ឌឯកសារ" htmlFor="framework_id">
            <SearchSelect
              options={frameworkOptions}
              value={form.framework_id}
              onChange={(v) => setField("framework_id", v)}
              placeholder="-- ជ្រើសរើស --"
              disabled={busy}
            />
          </Field>

          <Field label="លំហូរឯកសារ" htmlFor="status_of_process_id">
            <SearchSelect
              options={statusOfProcessOptions}
              value={form.status_of_process_id}
              onChange={(v) => setField("status_of_process_id", v)}
              placeholder="-- ជ្រើសរើស --"
              disabled={busy}
            />
          </Field>

          <Field label="កំណត់សម្គាល់" full htmlFor="note_from_user">
            <textarea
              id="note_from_user"
              rows={3}
              placeholder="បញ្ចូលកំណត់សម្គាល់"
              value={form.note_from_user}
              onChange={(e) => setField("note_from_user", e.target.value)}
              disabled={busy}
            />
          </Field>
        </div>
      </section>

      {/* ===== 2. Main files ===== */}
      <section className="md-card doc-section">
        <h3 className="doc-section-heading">ឯកសារគោល</h3>
        {isEdit && <SavedFiles files={mainKept} onChange={setMainKept} disabled={busy} />}
        <FilePicker
          files={mainFiles}
          onChange={setMainFiles}
          disabled={busy}
          hint={`អតិបរមា ${MAX_FILE_MB}MB ក្នុងមួយឯកសារ · សរុបមិនលើស ${MAX_FILES} ឯកសារ`}
        />
      </section>

      {/* ===== 3. Reference documents ===== */}
      <section className="md-card doc-section">
        <div className="doc-section-top">
          <h3 className="doc-section-heading">ឯកសារយោង</h3>
          <button type="button" className="md-btn md-btn-ghost" onClick={addRef} disabled={busy}>
            <Plus size={16} />
            បន្ថែមឯកសារយោង
          </button>
        </div>

        {refs.length === 0 && <div className="md-hint">មិនទាន់មានឯកសារយោង</div>}

        {refs.map((r, i) => (
          <div key={r.key} className="doc-ref-card">
            <div className="doc-section-top">
              <strong>ឯកសារយោងទី {i + 1}</strong>
              <button
                type="button"
                className="md-icon-btn md-icon-btn-danger"
                onClick={() => removeRef(r.key)}
                disabled={busy}
                title="លុប"
              >
                <Trash2 size={15} />
              </button>
            </div>

            <div className="doc-grid">
              <Field label="លេខឯកសារ" htmlFor={`ref-number-${r.key}`}>
                <input
                  id={`ref-number-${r.key}`}
                  type="text"
                  value={r.number_document}
                  onChange={(e) => setRefField(r.key, "number_document", e.target.value)}
                  disabled={busy}
                />
              </Field>

              <Field label="កាលបរិច្ឆេទចុះហត្ថលេខា" htmlFor={`ref-date-${r.key}`}>
                <input
                  id={`ref-date-${r.key}`}
                  type="date"
                  value={r.date_sign}
                  onChange={(e) => setRefField(r.key, "date_sign", e.target.value)}
                  disabled={busy}
                />
              </Field>

              <Field label="កម្មវត្ថុ" full htmlFor={`ref-objective-${r.key}`}>
                <textarea
                  id={`ref-objective-${r.key}`}
                  rows={2}
                  value={r.objective}
                  onChange={(e) => setRefField(r.key, "objective", e.target.value)}
                  disabled={busy}
                />
              </Field>

              <div className="md-field md-field-full">
                <label>ឯកសារយោង</label>
                {isEdit && (
                  <SavedFiles
                    files={r.existing}
                    onChange={(files) => setRefField(r.key, "existing", files)}
                    disabled={busy}
                  />
                )}
                <FilePicker
                  files={r.files}
                  onChange={(files) => setRefField(r.key, "files", files)}
                  disabled={busy}
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      {error && <div className="md-form-error">{error}</div>}

      {/* ===== Actions ===== */}
      <div className="doc-actions">
        <button
          type="button"
          className="md-btn md-btn-ghost"
          onClick={() => navigate("/document/out")}
          disabled={saving}
        >
          <ArrowLeft size={16} />
          បោះបង់
        </button>
        {!locked && (
          <button type="submit" className="md-btn md-btn-primary" disabled={busy}>
            <Save size={16} />
            {saving
              ? uploadPct !== null
                ? `កំពុង upload ${Math.round(uploadPct * 100)}%`
                : "កំពុងរក្សាទុក..."
              : "រក្សាទុក"}
          </button>
        )}
      </div>
    </form>
  );
}

export default DocumentForm;
