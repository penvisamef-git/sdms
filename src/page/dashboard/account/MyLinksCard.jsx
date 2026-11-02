import React, { useCallback, useEffect, useState } from "react";
import { Check, Copy, Link2, Plus, Trash2 } from "lucide-react";
import { authService } from "../../../api/api.service";
import { formatDateTime } from "../document/documentHelpers";
import "../master_data/masterdata.style.css";

const STATUS = {
  active: { label: "កំពុងប្រើបាន", badge: "md-badge-done" },
  used: { label: "បានប្រើរួច", badge: "md-badge-info" },
  expired: { label: "ផុតកំណត់", badge: "md-badge-warn" },
  revoked: { label: "បានលុប", badge: "md-badge-danger" },
};
const DAYS = [
  { value: 7, label: "៧ ថ្ងៃ" },
  { value: 30, label: "៣០ ថ្ងៃ" },
  { value: 90, label: "៩០ ថ្ងៃ" },
];

const deviceText = (d) =>
  d ? [d.browser, d.os].filter((x) => x && !String(x).includes("undefined")).join(" · ") || "-" : "-";

/**
 * Big Boss · my personal deep links (https://<web>/auto-login#t=...).
 * The full link is shown ONCE right after it is made — the server keeps only a hash of it.
 */
function MyLinksCard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [label, setLabel] = useState("");
  const [days, setDays] = useState(30);
  const [once, setOnce] = useState(false);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [created, setCreated] = useState(null); // { url }
  const [copied, setCopied] = useState(false);
  const [sure, setSure] = useState(null); // id waiting for a second click to delete

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authService.links();
      setRows(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e) => {
    e.preventDefault();
    setFormError("");
    setCreated(null);
    if (!password) {
      setFormError("សូមបញ្ចូលពាក្យសម្ងាត់របស់លោក ដើម្បីបង្កើត Link");
      return;
    }
    setSaving(true);
    try {
      const res = await authService.createLink({ label, days, once, password });
      setCreated({ url: res.url });
      setCopied(false);
      setLabel("");
      setPassword("");
      setOnce(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(created.url);
      setCopied(true);
    } catch {
      setFormError("ចម្លងមិនបាន សូមជ្រើសអត្ថបទ រួចចម្លងដោយដៃ");
    }
  };

  const revoke = async (id) => {
    if (sure !== id) {
      setSure(id);
      return;
    }
    setSure(null);
    try {
      await authService.revokeLink(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="md-card ac-card ac-wide">
      <header className="ac-card-head">
        <h3>
          <Link2 size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />
          Link ចូលរបស់ខ្ញុំ (Deep link)
        </h3>
        <p>បើក Link នេះក្នុង Browser ដើម្បីចូលភ្លាមៗ ដោយមិនបាច់វាយពាក្យសម្ងាត់។ រក្សាជាសម្ងាត់ — អ្នកណាមាន Link អាចចូលជាលោកបាន។ ចុះហត្ថលេខា ឬត្រឡប់ឯកសារតាម Link ត្រូវបញ្ជាក់ពាក្យសម្ងាត់ម្តងទៀត។</p>
      </header>

      <form className="ac-form" onSubmit={create} noValidate>
        <div className="md-field">
          <label htmlFor="lk-label">ឈ្មោះ Link (ឧ. iPhone, Mac ការិយាល័យ)</label>
          <input id="lk-label" type="text" maxLength={60} value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div className="md-field">
          <label htmlFor="lk-days">សុពលភាព</label>
          <select id="lk-days" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div className="md-field">
          <label htmlFor="lk-pass">ពាក្យសម្ងាត់របស់ខ្ញុំ</label>
          <input
            id="lk-pass"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="md-field" style={{ justifyContent: "flex-end" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={once} onChange={(e) => setOnce(e.target.checked)} style={{ width: "auto" }} />
            ប្រើបានតែម្តង
          </label>
        </div>
        <div className="ac-form-actions">
          <button type="submit" className="md-btn md-btn-primary" disabled={saving}>
            <Plus size={16} />
            {saving ? "កំពុងបង្កើត..." : "បង្កើត Link ថ្មី"}
          </button>
        </div>
        {formError && <div className="md-form-error ac-form-error">{formError}</div>}
      </form>

      {created && (
        <div className="md-notice md-notice-success" style={{ marginTop: 16, wordBreak: "break-all" }}>
          <strong>Link ថ្មីរបស់លោក (បង្ហាញតែម្តងនេះប៉ុណ្ណោះ — សូមចម្លងឥឡូវ):</strong>
          <div style={{ margin: "8px 0", fontFamily: "monospace", fontSize: 13, userSelect: "all" }}>{created.url}</div>
          <button type="button" className="md-btn md-btn-ghost doc-btn-sm" onClick={copy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "បានចម្លង" : "ចម្លង"}
          </button>
        </div>
      )}

      {error && <div className="md-form-error" style={{ marginTop: 12 }}>{error}</div>}

      <div className="md-table-scroll" style={{ marginTop: 16 }}>
        <table className="md-table">
          <thead>
            <tr>
              <th>ឈ្មោះ</th>
              <th>ស្ថានភាព</th>
              <th>ផុតកំណត់</th>
              <th>ប្រើចុងក្រោយ</th>
              <th>ឧបករណ៍</th>
              <th className="md-col-actions"></th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="md-empty">កំពុងផ្ទុក...</td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="md-empty">មិនទាន់មាន Link</td>
              </tr>
            )}
            {rows.map((l) => {
              const st = STATUS[l.status] || STATUS.expired;
              return (
                <tr key={l._id}>
                  <td>
                    {l.label || "-"}
                    {l.once && <small style={{ display: "block", opacity: 0.65 }}>ប្រើបានតែម្តង</small>}
                  </td>
                  <td>
                    <span className={`md-badge ${st.badge}`}>{st.label}</span>
                  </td>
                  <td>{formatDateTime(l.expires_at)}</td>
                  <td>
                    {l.last_used_at ? formatDateTime(l.last_used_at) : "-"}
                    {l.used_count > 0 && <small style={{ display: "block", opacity: 0.65 }}>{l.used_count} ដង</small>}
                  </td>
                  <td>{deviceText(l.last_used_device)}</td>
                  <td className="md-col-actions">
                    {l.status !== "revoked" && (
                      <button
                        type="button"
                        className={sure === l._id ? "md-btn md-btn-danger doc-btn-sm" : "md-icon-btn"}
                        onClick={() => revoke(l._id)}
                        onBlur={() => setSure(null)}
                        title="លុប Link (ឧបករណ៍ដែលចូលដោយ Link នេះនឹងត្រូវចាកចេញ)"
                      >
                        <Trash2 size={15} />
                        {sure === l._id && " ចុចម្តងទៀតដើម្បីលុប"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default MyLinksCard;
