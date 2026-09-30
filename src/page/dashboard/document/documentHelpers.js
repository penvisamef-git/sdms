// Shared labels / formatters for the document pages

export const DOC_STATUS = {
  new: { label: "ថ្មី", badge: "md-badge-info" },
  process: { label: "កំពុងដំណើរការ", badge: "md-badge-warn" },
  close: { label: "បិទ", badge: "md-badge-done" },
};

export const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-GB");
};

export const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString("en-GB", { hour12: false });
};

export const formatBytes = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export const personName = (u) => (u ? `${u.firstname || ""} ${u.lastname || ""}`.trim() : "");

export const idOf = (v) => (v && typeof v === "object" ? v._id : v);

// ---------- Transfers (one hop of a document to one receiver) ----------
export const TRANSFER_STATUS = {
  pending: { label: "រង់ចាំទទួល", badge: "md-badge-warn" },
  received: { label: "បានទទួល", badge: "md-badge-info" },
  forwarded: { label: "បានបញ្ជូនបន្ត", badge: "md-badge-done" },
  returned: { label: "បានរុញត្រឡប់", badge: "md-badge-danger" },
  done: { label: "បានបញ្ចប់", badge: "md-badge-done" },
};

export const TRANSFER_ACTION = {
  send: "ផ្ញើ",
  forward: "បញ្ជូនបន្ត",
  return: "រុញត្រឡប់",
};

// Is `me` (Auth.getClientLogin()) the receiver of this transfer row?
export const isTransferReceiver = (t, me) => {
  if (!t || !me) return false;
  if (t.to_user_id) return String(idOf(t.to_user_id)) === String(me._id);
  return !!me.office_id && String(idOf(t.to_office_id)) === String(me.office_id);
};

// hours (number) → "45 នាទី" / "3.5 ម៉ោង" / "2.1 ថ្ងៃ"
export const formatHours = (h) => {
  if (h === null || h === undefined) return "-";
  if (h < 1) return `${Math.round(h * 60)} នាទី`;
  if (h < 24) return `${h.toFixed(1)} ម៉ោង`;
  return `${(h / 24).toFixed(1)} ថ្ងៃ`;
};
