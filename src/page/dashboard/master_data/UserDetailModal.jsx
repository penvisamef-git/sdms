import React, { useEffect, useState } from "react";
import { X, Pencil } from "lucide-react";
import {
  userService,
  officeService,
} from "../../../api/api.service";
import { USER_ROLES, roleText } from "../user/userRoles";
import "./masterdata.style.css";

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString("en-GB", { hour12: false });
};

// Unit › General directorate › Department › Office
const officePath = (office) => {
  if (!office) return "-";
  const dep = office.department_id;
  const gd = dep?.general_directorate_id;
  const unit = gd?.unit_id;
  return [unit?.name, gd?.name, dep?.name, office.name].filter(Boolean).join(" › ") || "-";
};

const toForm = (u) => ({
  firstname: u.firstname || "",
  lastname: u.lastname || "",
  email: u.email || "",
  contact: u.contact || "",
  organization: u.organization || "",
  job_title: u.job_title || "",
  office_id: u.office_id?._id || u.office_id || "",
  role: roleText(u.role),
  note: u.note || "",
  status: u.status !== false,
});

/**
 * User detail popup (view) with an edit mode.
 * props: user (row from the list/tree), onClose, onSaved (called after a successful update)
 */
function UserDetailModal({ user, onClose, onSaved }) {
  const [detail, setDetail] = useState(user);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [mode, setMode] = useState("view"); // "view" | "edit"
  const [form, setForm] = useState(() => toForm(user));
  const [offices, setOffices] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Load the full record (office chain + role)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await userService.get(user._id);
        if (alive) setDetail(res.data);
      } catch (err) {
        if (alive) setLoadError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user._id]);

  const startEdit = async () => {
    setForm(toForm(detail));
    setError("");
    setNotice("");
    setMode("edit");
    try {
      const o = await officeService.all().catch(() => ({ data: [] }));
      setOffices(o.data || []);
    } catch {
      /* dropdowns stay empty */
    }
  };

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const close = () => {
    if (!saving) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const required = [
      ["firstname", "គោត្តនាម"],
      ["lastname", "នាម"],
      ["email", "អ៊ីមែល"],
      ["contact", "លេខទំនាក់ទំនង"],
      ["organization", "ស្ថាប័ន/អង្គភាព"],
      ["office_id", "ការិយាល័យ"],
    ];
    const missing = required.find(([key]) => !String(form[key] ?? "").trim());
    if (missing) {
      setError(`សូមបញ្ចូល ${missing[1]}`);
      return;
    }

    const payload = { ...form };
    // the API ignores empty values on update, so don't send an empty role
    if (!payload.role) delete payload.role;

    setSaving(true);
    try {
      const res = await userService.update(detail._id, payload);
      const fresh = await userService.get(detail._id).catch(() => null);
      setDetail(fresh?.data || { ...detail, ...res.data });
      setNotice(res.message || "បានរក្សាទុក!");
      setMode("view");
      onSaved && onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const rows = [
    ["គោត្តនាម", detail.firstname],
    ["នាម", detail.lastname],
    ["អ៊ីមែល", detail.email],
    ["លេខទំនាក់ទំនង", detail.contact],
    ["ស្ថាប័ន/អង្គភាព", detail.organization],
    ["មុខតំណែង", detail.job_title],
    ["ការិយាល័យ", officePath(detail.office_id)],
    ["ក្រុមសិទ្ធិ", roleText(detail.role)],
    ["កំណត់សម្គាល់", detail.note],
    ["បង្កើតនៅ", formatDate(detail.created_date)],
    ["កែប្រែចុងក្រោយ", formatDate(detail.updated_date)],
  ];

  return (
    <div className="md-page md-modal-host">
      <div className="md-modal-backdrop" onMouseDown={close}>
        <div
          className="md-modal md-modal-wide"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="md-modal-header">
            <h3>
              {mode === "edit" ? "កែប្រែអ្នកប្រើប្រាស់" : "ព័ត៌មានលម្អិតអ្នកប្រើប្រាស់"}
            </h3>
            <button type="button" className="md-icon-btn" onClick={close} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          {mode === "view" ? (
            <>
              <div className="md-modal-body">
                {loading && <div className="md-hint">កំពុងផ្ទុកទិន្នន័យ...</div>}
                {loadError && <div className="md-form-error">{loadError}</div>}
                {notice && <div className="md-notice md-notice-success">{notice}</div>}

                <div className="md-detail-head">
                  <div className="md-detail-name">
                    {`${detail.firstname || ""} ${detail.lastname || ""}`.trim()}
                  </div>
                  <span
                    className={`md-badge ${detail.status !== false ? "md-badge-on" : "md-badge-off"}`}
                  >
                    {detail.status !== false ? "សកម្ម" : "អសកម្ម"}
                  </span>
                </div>

                <dl className="md-detail">
                  {rows.map(([label, value]) => (
                    <div key={label} className="md-detail-row">
                      <dt>{label}</dt>
                      <dd>{value || "-"}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="md-modal-footer">
                <button type="button" className="md-btn md-btn-ghost" onClick={close}>
                  បិទ
                </button>
                <button type="button" className="md-btn md-btn-primary" onClick={startEdit}>
                  <Pencil size={15} />
                  កែប្រែ
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "contents" }}>
              <div className="md-modal-body">
                <div className="md-fields md-fields-grid">
                  <div className="md-field">
                    <label htmlFor="ud-firstname">
                      គោត្តនាម<span className="md-required">*</span>
                    </label>
                    <input
                      id="ud-firstname"
                      type="text"
                      value={form.firstname}
                      onChange={(e) => handleChange("firstname", e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  <div className="md-field">
                    <label htmlFor="ud-lastname">
                      នាម<span className="md-required">*</span>
                    </label>
                    <input
                      id="ud-lastname"
                      type="text"
                      value={form.lastname}
                      onChange={(e) => handleChange("lastname", e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  <div className="md-field">
                    <label htmlFor="ud-email">
                      អ៊ីមែល<span className="md-required">*</span>
                    </label>
                    <input
                      id="ud-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  <div className="md-field">
                    <label htmlFor="ud-contact">
                      លេខទំនាក់ទំនង<span className="md-required">*</span>
                    </label>
                    <input
                      id="ud-contact"
                      type="tel"
                      value={form.contact}
                      onChange={(e) => handleChange("contact", e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  <div className="md-field">
                    <label htmlFor="ud-organization">
                      ស្ថាប័ន/អង្គភាព<span className="md-required">*</span>
                    </label>
                    <input
                      id="ud-organization"
                      type="text"
                      value={form.organization}
                      onChange={(e) => handleChange("organization", e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  <div className="md-field">
                    <label htmlFor="ud-job">មុខតំណែង</label>
                    <input
                      id="ud-job"
                      type="text"
                      value={form.job_title}
                      onChange={(e) => handleChange("job_title", e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  <div className="md-field">
                    <label htmlFor="ud-office">
                      ការិយាល័យ<span className="md-required">*</span>
                    </label>
                    <select
                      id="ud-office"
                      value={form.office_id}
                      onChange={(e) => handleChange("office_id", e.target.value)}
                      disabled={saving}
                    >
                      <option value="">-- ជ្រើសរើសការិយាល័យ --</option>
                      {offices.map((o) => (
                        <option key={o._id} value={o._id}>
                          {o.department_id?.name ? `${o.name} (${o.department_id.name})` : o.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md-field">
                    <label htmlFor="ud-group">ក្រុមសិទ្ធិ</label>
                    <select
                      id="ud-group"
                      value={form.role}
                      onChange={(e) => handleChange("role", e.target.value)}
                      disabled={saving}
                    >
                      <option value="">-- ជ្រើសរើសក្រុមសិទ្ធិ --</option>
                      {USER_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md-field md-field-full">
                    <label htmlFor="ud-note">កំណត់សម្គាល់</label>
                    <textarea
                      id="ud-note"
                      rows={3}
                      value={form.note}
                      onChange={(e) => handleChange("note", e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>

                <label className="md-switch">
                  <input
                    type="checkbox"
                    checked={!!form.status}
                    onChange={(e) => handleChange("status", e.target.checked)}
                    disabled={saving}
                  />
                  <span className="md-switch-track" />
                  {form.status ? "សកម្ម" : "អសកម្ម"}
                </label>

                {error && <div className="md-form-error">{error}</div>}
              </div>

              <div className="md-modal-footer">
                <button
                  type="button"
                  className="md-btn md-btn-ghost"
                  onClick={() => setMode("view")}
                  disabled={saving}
                >
                  បោះបង់
                </button>
                <button type="submit" className="md-btn md-btn-primary" disabled={saving}>
                  {saving ? "កំពុងរក្សាទុក..." : "រក្សាទុក"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDetailModal;
