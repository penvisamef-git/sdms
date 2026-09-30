import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CornerUpLeft,
  ExternalLink,
  Eye,
  Inbox,
  Paperclip,
  Pencil,
  Send,
  Share2,
} from "lucide-react";
import {
  documentService,
  documentTransferService,
  statusOfProcessService,
  unitService,
  uploadService,
  userService,
} from "../../../api/api.service";
import Auth from "../../util/auth";
import FileViewer from "./FileViewer";
import ReceiverCard from "./ReceiverCard";
import SearchSelect from "./SearchSelect";
import TrackingPanel from "./TrackingPanel";
import {
  DOC_STATUS,
  TRANSFER_STATUS,
  formatBytes,
  formatDate,
  formatDateTime,
  idOf,
  isTransferReceiver,
  personName,
} from "./documentHelpers";
import "../master_data/masterdata.style.css";
import "./document.style.css";
import "./documentView.style.css";

// A read-only "input": same look as a form field, but it only shows the value
function ViewField({ label, full, children }) {
  const empty = children === undefined || children === null || children === "" || children === "-";
  return (
    <div className={`md-field ${full ? "md-field-full" : ""}`}>
      <label>{label}</label>
      <div className={`doc-view-value ${empty ? "doc-view-value-empty" : ""}`}>
        {empty ? "-" : children}
      </div>
    </div>
  );
}

// Files of the document: click one to open it inside the page (FileViewer)
function FileLinks({ files, active, onOpen }) {
  if (!files || files.length === 0) return <div className="md-hint">គ្មានឯកសារ</div>;
  return (
    <div className="doc-files">
      {files.map((f, i) => (
        <div key={f.public_id || i} className="doc-file-row">
          <button
            type="button"
            className={`doc-file-btn ${active && active.public_id === f.public_id ? "doc-file-btn-active" : ""}`}
            onClick={() => onOpen(f)}
            title="បើកមើលក្នុងទំព័រ"
          >
            <Paperclip size={14} />
            <span>{f.original_name || f.public_id}</span>
            <small>{[f.format, formatBytes(f.bytes)].filter(Boolean).join(" · ")}</small>
          </button>
          <a
            className="md-icon-btn"
            href={f.url}
            target="_blank"
            rel="noreferrer"
            title="បើកក្នុងផ្ទាំងថ្មី"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      ))}
    </div>
  );
}

/**
 * Detail page of a document — /document/in/view/:id and /document/out/view/:id
 *   · read-only information (same layout as the create / edit page)
 *   · actions for me: receive · forward · return · finish (transfer API)
 *   · the creator office can send to more receivers, or edit while nobody has received it yet
 *   · tracking timeline of every hop
 */
function DocumentViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const box = location.pathname.startsWith("/document/out") ? "out" : "in";

  const me = new Auth().getClientLogin();
  const myOfficeId = me?.office_id;
  const myUserId = me?._id;

  const [doc, setDoc] = useState(null);
  const [tracking, setTracking] = useState(null); // { document, summary, timeline }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [notice, setNotice] = useState("");

  // options (loaded once)
  const [orgTree, setOrgTree] = useState([]);
  const [users, setUsers] = useState([]);
  const [statusOfProcess, setStatusOfProcess] = useState([]);

  // action form
  const [toOffice, setToOffice] = useState(null); // { id, offices: [officeId, ...] }
  const [toUserId, setToUserId] = useState("");
  const [note, setNote] = useState("");
  const [flowId, setFlowId] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  // file opened inside the page
  const [preview, setPreview] = useState(null);
  const viewerRef = useRef(null);
  const [viewerNotice, setViewerNotice] = useState("");
  const openFile = (file) => {
    setViewerNotice("");
    setPreview(file);
    // let the viewer render, then bring it into view
    setTimeout(() => viewerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };

  // ---------- load ----------
  useEffect(() => {
    const safe = (promise) => promise.then((r) => r.data || []).catch(() => []);
    (async () => {
      const [tree, allUsers, sop] = await Promise.all([
        safe(unitService.tree()),
        safe(userService.all()),
        safe(statusOfProcessService.all()),
      ]);
      setOrgTree(tree);
      setUsers(allUsers);
      setStatusOfProcess(sop);
    })();
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const [res, track] = await Promise.all([
          documentService.get(id),
          documentService
            .tracking(id)
            .then((r) => r.data)
            .catch(() => null),
        ]);
        if (!alive) return;
        setDoc(res.data);
        setTracking(track);
      } catch (err) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, reloadKey]);

  const timeline = useMemo(() => tracking?.timeline || [], [tracking]);

  // my transfer row: pending first, then received, then forwarded, else the latest one
  const mine = useMemo(() => {
    const rows = timeline.filter((t) => isTransferReceiver(t, me));
    const latest = (list) => list[list.length - 1];
    const pick = (status) => latest(rows.filter((t) => t.status === status));
    return pick("pending") || pick("received") || pick("forwarded") || latest(rows) || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeline, myOfficeId, myUserId]);

  const isOwner = !!doc && (!!me?.is_super_admin || idOf(doc.office_id_open) === myOfficeId);
  // one to one: I can pass the document on (or return / finish it) only once — right after receiving it
  const canAct = mine?.status === "received";
  const isPending = mine?.status === "pending";
  // the creator sends a document to ONE receiver only — once it has receivers, sending is hidden
  const alreadySent = !!doc && (doc.send_to_office_id || []).length + (doc.send_to_user_id || []).length > 0;
  // nobody has received the document yet → the creator may still edit it
  const editable = isOwner && timeline.every((t) => t.status === "pending");

  const hasReceiver = (toOffice?.offices || []).length > 0 || Boolean(toUserId);

  // when the signed PDF may replace the file:
  const wasSent = alreadySent || timeline.length > 0;
  // the creator: before sending · a receiver: while waiting to receive or after receiving (not once passed on)
  const holdsIt = mine?.status === "pending" || mine?.status === "received";
  const saveBlockedReason = holdsIt
    ? ""
    : isOwner
      ? wasSent
        ? mine
          ? `ឯកសារត្រូវបាន${mine.status === "forwarded" ? "បញ្ជូនបន្ត" : "ដំណើរការ"}រួចហើយ`
          : "ឯកសារត្រូវបានផ្ញើរួចហើយ"
        : ""
      : mine
        ? "ឯកសារត្រូវបានបញ្ជូនបន្តរួចហើយ"
        : "អ្នកមិនមានសិទ្ធិលើឯកសារនេះទេ";

  const flowOptions = useMemo(
    () => statusOfProcess.map((s) => ({ value: s._id, label: s.name })),
    [statusOfProcess],
  );

  // ---------- actions ----------
  const run = useCallback(async (fn, fallbackMessage) => {
    setActionError("");
    setNotice("");
    setBusy(true);
    try {
      const res = await fn();
      setNotice(res?.message || fallbackMessage);
      // clear the action form and reload the document + tracking
      setToOffice(null);
      setToUserId("");
      setNote("");
      setFlowId("");
      setReloadKey((k) => k + 1);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }, []);

  // "រក្សាទុក" in the PDF tools: upload the signed PDF and replace the old file of the document with it
  // (the API only lets the creator office change a document → same rule as the edit button)
  const MAX_UPLOAD_MB = 20;
  const saveSignedFile = async (blob) => {
    if (!preview || !doc) throw new Error("មិនមានឯកសារ");
    if (blob.size > MAX_UPLOAD_MB * 1024 * 1024) {
      throw new Error(`ឯកសារធំពេក! (អតិបរមា ${MAX_UPLOAD_MB}MB) — សូមទាញយកជំនួសវិញ`);
    }
    const oldId = preview.public_id;
    const mainList = doc.document_main_url || [];
    const mainIndex = mainList.findIndex((f) => f.public_id === oldId);
    const refList = doc.reference_document || [];
    const refIndex = refList.findIndex((r) => (r.files || []).some((f) => f.public_id === oldId));
    if (mainIndex < 0 && refIndex < 0) throw new Error("រកមិនឃើញឯកសារនេះក្នុងឯកសារដើមទេ");

    const name = preview.original_name || "document.pdf";

    // a receiver cannot edit the document → the API replaces the file for them
    // (the creator office / a super admin edits it directly, below)
    if (!isOwner) {
      const refFileIndex = refIndex >= 0 ? (refList[refIndex].files || []).findIndex((f) => f.public_id === oldId) : -1;
      const form = new FormData();
      form.append("public_id", oldId);
      form.append("file", new File([blob], name, { type: "application/pdf" }));
      const res = await documentService.replaceFile(id, form);
      const d = res.data || {};
      const fresh =
        res.file ||
        (mainIndex >= 0
          ? (d.document_main_url || [])[mainIndex]
          : ((d.reference_document || [])[refIndex]?.files || [])[refFileIndex]);
      if (!fresh?.url) throw new Error("រក្សាទុកមិនបានសម្រេច");
      setViewerNotice("បានរក្សាទុក — ឯកសារដើមត្រូវបានជំនួសដោយឯកសារដែលបានចុះហត្ថលេខា");
      setPreview(fresh);
      setReloadKey((k) => k + 1);
      return;
    }

    const fd = new FormData();
    fd.append("folder", mainIndex >= 0 ? "documents" : "references");
    fd.append("files", new File([blob], name, { type: "application/pdf" }));
    const uploaded = await uploadService.upload(fd);
    const saved = uploaded.data?.[0];
    if (!saved) throw new Error("Upload មិនបានសម្រេច");
    saved.original_name = saved.original_name || name;

    const body =
      mainIndex >= 0
        ? { document_main_url: mainList.map((f, i) => (i === mainIndex ? saved : f)) }
        : {
            reference_document: refList.map((r) => ({
              number_document: r.number_document || "",
              date_sign: r.date_sign || null,
              objective: r.objective || "",
              files: (r.files || []).map((f) => (f.public_id === oldId ? saved : f)),
            })),
          };
    await documentService.update(id, body);

    setViewerNotice("បានរក្សាទុក — ឯកសារដើមត្រូវបានជំនួសដោយឯកសារដែលបានចុះហត្ថលេខា");
    setPreview(saved);
    setReloadKey((k) => k + 1);
  };

  const receivers = () => ({
    send_to_office_id: toOffice?.offices || [],
    send_to_user_id: toUserId ? [toUserId] : [],
  });

  const needReceiver = () => {
    if (hasReceiver) return true;
    setActionError("សូមជ្រើសរើសអង្គភាព ឬអ្នកប្រើប្រាស់ទទួលយ៉ាងហោចណាស់មួយ");
    return false;
  };

  const doReceive = () => run(() => documentTransferService.receive(mine._id), "បានទទួលឯកសារ!");

  const doForward = () => {
    if (!needReceiver()) return;
    run(
      () =>
        documentTransferService.forward(mine._id, {
          ...receivers(),
          note,
          ...(flowId ? { status_of_process_id: flowId } : {}),
        }),
      "បានបញ្ជូនបន្ត!",
    );
  };

  const doReturn = () =>
    run(
      () =>
        documentTransferService.returnBack(mine._id, {
          note,
          ...(flowId ? { status_of_process_id: flowId } : {}),
        }),
      "បានរុញត្រឡប់!",
    );

  const doDone = () => run(() => documentTransferService.done(mine._id, { note }), "បានបញ្ចប់!");

  // creator office: send to more receivers (adds; receivers already sent are kept)
  const doSend = () => {
    if (!needReceiver()) return;
    run(() => documentService.send(id, { ...receivers(), note }), "បានផ្ញើ!");
  };

  // ---------- render ----------
  const receiverOffices = (doc?.send_to_office_id || []).map((o) => o?.name).filter(Boolean);
  const receiverUsers = (doc?.send_to_user_id || []).map((u) => personName(u)).filter(Boolean);
  const myStatus = mine ? TRANSFER_STATUS[mine.status] : null;
  const docStatus = doc ? DOC_STATUS[doc.status] : null;

  const noteAndFlow = (
    <>
      <div className="doc-grid doc-grid-2 doc-action-note">
        <div className="md-field">
          <label>លំហូរឯកសារ</label>
          <SearchSelect
            options={flowOptions}
            value={flowId}
            onChange={setFlowId}
            placeholder="-- ជ្រើសរើស --"
            disabled={busy}
          />
        </div>
        <div className="md-field md-field-full">
          <label>កំណត់ចំណាំ / ការណែនាំ</label>
          <textarea
            rows={2}
            placeholder="បញ្ចូលកំណត់ចំណាំ"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={busy}
          />
        </div>
      </div>
      {actionError && <div className="md-form-error">{actionError}</div>}
    </>
  );

  return (
    <div className="md-page doc-create">
      {/* ===== Header bar ===== */}
      <div className="doc-edit-bar doc-view-bar">
        <Eye size={16} />
        {doc && <strong>{doc.code_of_document || "-"}</strong>}
        {myStatus && <span className={`md-badge ${myStatus.badge}`}>{myStatus.label}</span>}
        {!myStatus && docStatus && <span className={`md-badge ${docStatus.badge}`}>{docStatus.label}</span>}
        {isOwner && (
          <div className="doc-view-bar-actions">
            <button
              type="button"
              className="md-btn md-btn-ghost doc-btn-sm"
              onClick={() => navigate(`/document/out/edit/${id}`)}
              title={editable ? "កែប្រែ" : "មិនអាចកែប្រែបានទេ ព្រោះមានអ្នកទទួលរួចហើយ"}
              disabled={!editable}
            >
              <Pencil size={14} />
              កែប្រែ
            </button>
          </div>
        )}
      </div>

      {notice && <div className="md-notice md-notice-success">{notice}</div>}
      {loading && !doc && <div className="md-hint">កំពុងផ្ទុកទិន្នន័យ...</div>}
      {error && <div className="md-form-error">{error}</div>}

      {doc && (
        <>
          {/* ===== 1. Received but not yet accepted ===== */}
          {isPending && (
            <section className="md-card doc-section">
              <div className="doc-received-banner">
                <div>
                  <h3 className="doc-section-heading">ឯកសារនេះកំពុងរង់ចាំការទទួលពីអ្នក</h3>
                  {mine.note && <div className="trk-note">ការណែនាំ: {mine.note}</div>}
                  <div className="md-hint">
                    សូមទទួលឯកសារជាមុនសិន ទើបអាចបញ្ជូនបន្ត រុញត្រឡប់ ឬបញ្ចប់បាន។
                  </div>
                </div>
                <button type="button" className="md-btn md-btn-primary" onClick={doReceive} disabled={busy}>
                  <Inbox size={16} />
                  {busy ? "កំពុងដំណើរការ..." : "ទទួលឯកសារ"}
                </button>
              </div>
              {actionError && <div className="md-form-error">{actionError}</div>}
            </section>
          )}

          {/* ===== 2. I hold the document: forward / return / finish ===== */}
          {canAct && (
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
              {noteAndFlow}
              <div className="doc-action-buttons">
                <button type="button" className="md-btn md-btn-ghost" onClick={doReturn} disabled={busy}>
                  <CornerUpLeft size={16} />
                  រុញត្រឡប់
                </button>
                {mine.status === "received" && (
                  <button type="button" className="md-btn md-btn-ghost" onClick={doDone} disabled={busy}>
                    <Check size={16} />
                    បញ្ចប់នៅអង្គភាពខ្ញុំ
                  </button>
                )}
                <button
                  type="button"
                  className="md-btn md-btn-primary"
                  onClick={doForward}
                  disabled={busy || !hasReceiver}
                >
                  <Share2 size={16} />
                  បញ្ជូនបន្ត
                </button>
              </div>
            </ReceiverCard>
          )}

          {/* ===== 3. Creator office: send (one receiver only — hidden once the document has been sent) ===== */}
          {isOwner && !canAct && !isPending && !alreadySent && (
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
                <div className="md-field md-field-full">
                  <label>ការណែនាំដល់អ្នកទទួល</label>
                  <textarea
                    rows={2}
                    placeholder="បញ្ចូលការណែនាំ"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={busy}
                  />
                </div>
              </div>
              {actionError && <div className="md-form-error">{actionError}</div>}
              <div className="doc-action-buttons">
                <button
                  type="button"
                  className="md-btn md-btn-primary"
                  onClick={doSend}
                  disabled={busy || !hasReceiver}
                >
                  <Send size={16} />
                  {busy ? "កំពុងផ្ញើ..." : "ផ្ញើ"}
                </button>
              </div>
            </ReceiverCard>
          )}

          {/* ===== File opened inside the page ===== */}
          <div ref={viewerRef}>
            {preview && (
              <FileViewer
                file={preview}
                onClose={() => {
                  setViewerNotice("");
                  setPreview(null);
                }}
                onSave={saveSignedFile}
                saveBlockedReason={saveBlockedReason}
                notice={viewerNotice}
              />
            )}
          </div>

          {/* ===== Sender / receivers ===== */}
          <section className="md-card doc-section">
            <h3 className="doc-section-heading">អ្នកផ្ញើ និងអ្នកទទួល</h3>
            <div className="doc-grid doc-grid-2">
              <ViewField label="អង្គភាពផ្ញើ">
                {doc.send_from_office_id?.name || doc.office_id_open?.name}
              </ViewField>
              <ViewField label="អ្នកផ្ញើ">{personName(doc.send_from_user_id)}</ViewField>
              <ViewField label="កាលបរិច្ឆេទផ្ញើ">{formatDateTime(doc.date_sent)}</ViewField>
              <ViewField label="បង្កើតដោយ">{personName(doc.created_by)}</ViewField>
              <ViewField label="អង្គភាពទទួល">{receiverOffices.join(", ")}</ViewField>
              <ViewField label="អ្នកប្រើប្រាស់ទទួល">{receiverUsers.join(", ")}</ViewField>
            </div>
          </section>

          {/* ===== Document information ===== */}
          <section className="md-card doc-section">
            <h3 className="doc-section-heading">ព័ត៌មានឯកសារ</h3>
            <div className="doc-grid">
              <ViewField label="កម្មវត្ថុ" full>
                {doc.objective}
              </ViewField>
              <ViewField label="លេខឯកសារ">{doc.number_document}</ViewField>
              <ViewField label="កាលបរិច្ឆេទចុះហត្ថលេខា">{formatDate(doc.date_sign)}</ViewField>
              <ViewField label="កាលបរិច្ឆេទចូល">{formatDate(doc.date_in)}</ViewField>
              <ViewField label="ចុះលេខចេញ">{formatDate(doc.date_registration_document)}</ViewField>
              <ViewField label="ប្រភេទឯកសារ">{doc.document_type_id?.name}</ViewField>
              <ViewField label="ក្របខណ្ឌឯកសារ">{doc.framework_id?.name}</ViewField>
              <ViewField label="លំហូរឯកសារ">{doc.status_of_process_id?.name}</ViewField>
              <ViewField label="កំណត់សម្គាល់" full>
                {doc.note_from_user}
              </ViewField>
            </div>
          </section>

          {/* ===== Main files ===== */}
          <section className="md-card doc-section">
            <h3 className="doc-section-heading">ឯកសារគោល</h3>
            <FileLinks files={doc.document_main_url} active={preview} onOpen={openFile} />
          </section>

          {/* ===== Reference documents ===== */}
          <section className="md-card doc-section">
            <h3 className="doc-section-heading">ឯកសារយោង</h3>
            {(doc.reference_document || []).length === 0 && (
              <div className="md-hint">គ្មានឯកសារយោង</div>
            )}
            {(doc.reference_document || []).map((r, i) => (
              <div key={r._id || i} className="doc-ref-card">
                <div className="doc-section-top">
                  <strong>ឯកសារយោងទី {i + 1}</strong>
                </div>
                <div className="doc-grid">
                  <ViewField label="លេខឯកសារ">{r.number_document}</ViewField>
                  <ViewField label="កាលបរិច្ឆេទចុះហត្ថលេខា">{formatDate(r.date_sign)}</ViewField>
                  <ViewField label="កម្មវត្ថុ" full>
                    {r.objective}
                  </ViewField>
                  <div className="md-field md-field-full">
                    <label>ឯកសារយោង</label>
                    <FileLinks files={r.files} active={preview} onOpen={openFile} />
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* ===== Tracking ===== */}
          <section className="md-card doc-section">
            <h3 className="doc-section-heading">ការតាមដានឯកសារ</h3>
            <TrackingPanel data={tracking} />
          </section>
        </>
      )}

      {/* ===== Actions ===== */}
      <div className="doc-actions">
        <button type="button" className="md-btn md-btn-ghost" onClick={() => navigate(`/document/${box}`)}>
          <ArrowLeft size={16} />
          ត្រឡប់ក្រោយ
        </button>
      </div>
    </div>
  );
}

export default DocumentViewPage;
