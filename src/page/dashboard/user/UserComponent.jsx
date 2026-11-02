import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, KeyRound, Link2, UserCheck, X } from "lucide-react";
import MasterDataPage from "../master_data/MasterDataPage";
import "../master_data/masterdata.style.css";
import { authService, userService, officeService } from "../../../api/api.service";
import { ROLE, ROLE_OPTIONS, roleText } from "./userRoles";
import Auth from "../../util/auth";

const fullName = (row) => `${row.firstname || ""} ${row.lastname || ""}`.trim();

const COLUMNS = [
  { key: "name", label: "ឈ្មោះ", render: (row) => fullName(row) || "-" },
  { key: "email", label: "អ៊ីមែល" },
  {
    key: "office_id",
    label: "ការិយាល័យ",
    render: (row) => row.office_id?.name || "-",
  },
  {
    key: "role",
    label: "ក្រុមសិទ្ធិ",
    render: (row) => roleText(row.role) || "-",
  },
];

const SEARCH_KEYS = ["firstname", "lastname", "email", "contact"];

function UserComponent() {
  const currentUserId = new Auth().getClientLogin()?._id;

  const [offices, setOffices] = useState([]);

  // ---------------- Reset password dialog ----------------
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSaving, setResetSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  // ---------------- Big Boss: who may send to him ----------------
  const [senderTarget, setSenderTarget] = useState(null);
  const [senderUsers, setSenderUsers] = useState([]);
  const [senderPicked, setSenderPicked] = useState([]);
  const [senderSearch, setSenderSearch] = useState("");
  const [senderError, setSenderError] = useState("");
  const [senderSaving, setSenderSaving] = useState(false);

  const openSenders = async (row) => {
    setSenderTarget(row);
    setSenderPicked((row.allowed_sender_ids || []).map((x) => String(x?._id || x)));
    setSenderSearch("");
    setSenderError("");
    try {
      const res = await userService.all();
      setSenderUsers((res.data || []).filter((u) => u.role !== ROLE.BOSS && u._id !== row._id));
    } catch (err) {
      setSenderUsers([]);
      setSenderError(err.message);
    }
  };

  const toggleSender = (id) =>
    setSenderPicked((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  const saveSenders = async (e) => {
    e.preventDefault();
    setSenderError("");
    setSenderSaving(true);
    try {
      const res = await userService.update(senderTarget._id, { allowed_sender_ids: senderPicked });
      setNotice({ type: "success", text: res.message || "បានរក្សាទុកបញ្ជីអ្នកអាចផ្ញើ!" });
      setSenderTarget(null);
    } catch (err) {
      setSenderError(err.message);
    } finally {
      setSenderSaving(false);
    }
  };

  const shownSenders = senderUsers.filter((u) => {
    const kw = senderSearch.trim().toLowerCase();
    return !kw || `${fullName(u)} ${u.email || ""} ${u.office_id?.name || ""}`.toLowerCase().includes(kw);
  });

  // ---------------- Big Boss: new deep link (made by the admin) ----------------
  const [linkTarget, setLinkTarget] = useState(null);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkDays, setLinkDays] = useState(90);
  const [linkOnce, setLinkOnce] = useState(false);
  const [linkReset, setLinkReset] = useState(true);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkAppUrl, setLinkAppUrl] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [linkSaving, setLinkSaving] = useState(false);

  const openLink = (row) => {
    setLinkTarget(row);
    setLinkLabel("");
    setLinkDays(90);
    setLinkOnce(false);
    setLinkReset(true);
    setLinkUrl("");
    setLinkAppUrl("");
    setLinkCopied(false);
    setLinkError("");
  };

  const makeLink = async (e) => {
    e.preventDefault();
    setLinkError("");
    setLinkSaving(true);
    try {
      const res = await authService.createUserLink({
        user_id: linkTarget._id,
        label: linkLabel,
        days: linkDays,
        once: linkOnce,
        reset: linkReset,
      });
      setLinkUrl(res.url);
      setLinkAppUrl(res.app_url || "");
    } catch (err) {
      setLinkError(err.message);
    } finally {
      setLinkSaving(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(linkUrl);
      setLinkCopied(true);
    } catch {
      setLinkError("ចម្លងមិនបាន សូមជ្រើសអត្ថបទ រួចចម្លងដោយដៃ");
    }
  };

  const loadOptions = useCallback(async () => {
    try {
      const res = await officeService.all();
      setOffices(res.data || []);
    } catch {
      setOffices([]);
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const fields = useMemo(
    () => [
      { key: "firstname", label: "គោត្តនាម", required: true, placeholder: "បញ្ចូលគោត្តនាម" },
      { key: "lastname", label: "នាម", required: true, placeholder: "បញ្ចូលនាម" },
      { key: "email", label: "អ៊ីមែល", type: "email", required: true, placeholder: "name@example.com" },
      { key: "contact", label: "លេខទំនាក់ទំនង", type: "tel", required: true, placeholder: "012345678" },
      {
        key: "password",
        label: "ពាក្យសម្ងាត់",
        type: "password",
        required: true,
        createOnly: true,
        full: true,
        placeholder: "បញ្ចូលពាក្យសម្ងាត់",
      },
      { key: "organization", label: "ស្ថាប័ន/អង្គភាព", required: true, placeholder: "MEF" },
      { key: "job_title", label: "មុខតំណែង", placeholder: "បញ្ចូលមុខតំណែង" },
      {
        key: "office_id",
        label: "ការិយាល័យ (មិនត្រូវការសម្រាប់ថ្នាក់ដឹកនាំ)",
        type: "select",
        required: false,
        placeholder: "-- ជ្រើសរើសការិយាល័យ --",
        options: offices.map((o) => ({
          value: o._id,
          label: o.department_id?.name ? `${o.name} (${o.department_id.name})` : o.name,
        })),
      },
      {
        key: "role",
        label: "ក្រុមសិទ្ធិ",
        type: "select",
        required: true,
        placeholder: "-- ជ្រើសរើសក្រុមសិទ្ធិ --",
        options: ROLE_OPTIONS,
      },
      { key: "note", label: "កំណត់សម្គាល់", type: "textarea" },
    ],
    [offices],
  );

  const openReset = (row) => {
    setResetTarget(row);
    setResetPassword("");
    setResetConfirm("");
    setResetError("");
  };

  const closeReset = () => {
    if (resetSaving) return;
    setResetTarget(null);
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setResetError("");

    if (!resetPassword) {
      setResetError("សូមបញ្ចូលពាក្យសម្ងាត់ថ្មី");
      return;
    }
    if (resetPassword !== resetConfirm) {
      setResetError("ពាក្យសម្ងាត់បញ្ជាក់មិនត្រូវគ្នា");
      return;
    }

    setResetSaving(true);
    try {
      const res = await userService.resetPassword(resetTarget._id, { password: resetPassword });
      setNotice({ type: "success", text: res.message || "បានកំណត់ពាក្យសម្ងាត់ថ្មី!" });
      setResetTarget(null);
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetSaving(false);
    }
  };

  return (
    <div className="md-page">
      {notice && <div className={`md-notice md-notice-${notice.type}`}>{notice.text}</div>}

      <MasterDataPage
        title="អ្នកប្រើប្រាស់"
        service={userService}
        fields={fields}
        columns={COLUMNS}
        searchKeys={SEARCH_KEYS}
        getName={fullName}
        canDelete={(row) => row._id !== currentUserId}
        wide
        extraActions={(row) => (
          <>
            {roleText(row.role) !== ROLE.SUPER && !row.is_super_admin && (
              <button
                type="button"
                className="md-icon-btn"
                onClick={() => openLink(row)}
                title="បង្កើត Link ចូលថ្មី (Deep link)"
              >
                <Link2 size={15} />
              </button>
            )}
            {roleText(row.role) === ROLE.BOSS && (
              <button
                type="button"
                className="md-icon-btn"
                onClick={() => openSenders(row)}
                title="អ្នកដែលអាចផ្ញើមកថ្នាក់ដឹកនាំ"
              >
                <UserCheck size={15} />
              </button>
            )}
            <button
              type="button"
              className="md-icon-btn"
              onClick={() => openReset(row)}
              title="កំណត់ពាក្យសម្ងាត់ថ្មី"
            >
              <KeyRound size={15} />
            </button>
          </>
        )}
      />

      {linkTarget && (
        <div className="md-modal-backdrop" onMouseDown={() => !linkSaving && setLinkTarget(null)}>
          <form className="md-modal md-modal-sm" onSubmit={makeLink} onMouseDown={(e) => e.stopPropagation()}>
            <div className="md-modal-header">
              <h3>បង្កើត Link ចូលថ្មី (Deep link)</h3>
              <button type="button" className="md-icon-btn" onClick={() => setLinkTarget(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="md-modal-body">
              <p>
                <strong>{fullName(linkTarget)}</strong> ({linkTarget.email})
              </p>
              {!linkUrl && (
                <>
                  <div className="md-field">
                    <label htmlFor="bl-label">ឈ្មោះ Link (ឧ. iPhone)</label>
                    <input id="bl-label" type="text" maxLength={60} value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} disabled={linkSaving} />
                  </div>
                  <div className="md-field">
                    <label htmlFor="bl-days">សុពលភាព</label>
                    <select id="bl-days" value={linkDays} onChange={(e) => setLinkDays(Number(e.target.value))} disabled={linkSaving}>
                      <option value={7}>៧ ថ្ងៃ</option>
                      <option value={30}>៣០ ថ្ងៃ</option>
                      <option value={90}>៩០ ថ្ងៃ</option>
                    </select>
                  </div>
                  <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer", marginBottom: 8 }}>
                    <input type="checkbox" checked={linkOnce} onChange={(e) => setLinkOnce(e.target.checked)} style={{ width: "auto" }} />
                    ប្រើបានតែម្តង
                  </label>
                  <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
                    <input type="checkbox" checked={linkReset} onChange={(e) => setLinkReset(e.target.checked)} style={{ width: "auto" }} />
                    លុប Link ចាស់ទាំងអស់ (ឧបករណ៍ដែលចូលដោយ Link ចាស់នឹងត្រូវចាកចេញ)
                  </label>
                </>
              )}
              {linkUrl && (
                <div className="md-notice md-notice-success" style={{ wordBreak: "break-all" }}>
                  <strong>Link ថ្មី (បង្ហាញតែម្តងនេះប៉ុណ្ណោះ — សូមចម្លងឥឡូវ):</strong>
                  <div style={{ margin: "8px 0", fontFamily: "monospace", fontSize: 13, userSelect: "all" }}>{linkUrl}</div>
                  {linkAppUrl && (
                    <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
                      សម្រាប់ App (ត្រូវដំឡើង App SDMS រួច — ប្រើ Link https ខាងលើ ងាយស្រួលជាង): <span style={{ fontFamily: "monospace", userSelect: "all" }}>{linkAppUrl}</span>
                    </div>
                  )}
                  <button type="button" className="md-btn md-btn-ghost doc-btn-sm" onClick={copyLink}>
                    {linkCopied ? <Check size={14} /> : <Copy size={14} />}
                    {linkCopied ? "បានចម្លង" : "ចម្លង"}
                  </button>
                </div>
              )}
              <div className="md-hint">អ្នកណាមាន Link នេះ អាចចូលជាអ្នកប្រើប្រាស់នេះបាន។ សូមផ្ញើតាមបណ្តាញសុវត្ថិភាព។</div>
              {linkError && <div className="md-form-error">{linkError}</div>}
            </div>
            <div className="md-modal-footer">
              <button type="button" className="md-btn md-btn-ghost" onClick={() => setLinkTarget(null)} disabled={linkSaving}>
                {linkUrl ? "បិទ" : "បោះបង់"}
              </button>
              {!linkUrl && (
                <button type="submit" className="md-btn md-btn-primary" disabled={linkSaving}>
                  {linkSaving ? "កំពុងបង្កើត..." : "បង្កើត Link"}
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {senderTarget && (
        <div className="md-modal-backdrop" onMouseDown={() => !senderSaving && setSenderTarget(null)}>
          <form className="md-modal md-modal-sm" onSubmit={saveSenders} onMouseDown={(e) => e.stopPropagation()}>
            <div className="md-modal-header">
              <h3>អ្នកដែលអាចផ្ញើមកថ្នាក់ដឹកនាំ</h3>
              <button type="button" className="md-icon-btn" onClick={() => setSenderTarget(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="md-modal-body">
              <p>
                <strong>{fullName(senderTarget)}</strong> — មានតែអ្នកក្នុងបញ្ជីនេះទេ ដែលមើលឃើញ និងផ្ញើឯកសារមកគាត់បាន។
              </p>
              <div className="md-field">
                <input
                  type="text"
                  placeholder="ស្វែងរកឈ្មោះ អ៊ីមែល ឬការិយាល័យ..."
                  value={senderSearch}
                  onChange={(e) => setSenderSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div style={{ maxHeight: 280, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                {shownSenders.length === 0 && <div className="md-hint" style={{ padding: 12 }}>គ្មានអ្នកប្រើប្រាស់</div>}
                {shownSenders.map((u) => (
                  <label key={u._id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", cursor: "pointer" }}>
                    <input type="checkbox" checked={senderPicked.includes(u._id)} onChange={() => toggleSender(u._id)} />
                    <span>
                      {fullName(u) || u.email}
                      <small style={{ display: "block", opacity: 0.65 }}>
                        {[u.email, u.office_id?.name].filter(Boolean).join(" · ")}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
              <div className="md-hint">បានជ្រើសរើស {senderPicked.length} នាក់</div>
              {senderError && <div className="md-form-error">{senderError}</div>}
            </div>
            <div className="md-modal-footer">
              <button type="button" className="md-btn md-btn-ghost" onClick={() => setSenderTarget(null)} disabled={senderSaving}>
                បោះបង់
              </button>
              <button type="submit" className="md-btn md-btn-primary" disabled={senderSaving}>
                {senderSaving ? "កំពុងរក្សាទុក..." : "រក្សាទុក"}
              </button>
            </div>
          </form>
        </div>
      )}

      {resetTarget && (
        <div className="md-modal-backdrop" onMouseDown={closeReset}>
          <form
            className="md-modal md-modal-sm"
            onSubmit={submitReset}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="md-modal-header">
              <h3>កំណត់ពាក្យសម្ងាត់ថ្មី</h3>
              <button type="button" className="md-icon-btn" onClick={closeReset} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="md-modal-body">
              <p>
                <strong>{fullName(resetTarget)}</strong> ({resetTarget.email})
              </p>

              <div className="md-field">
                <label htmlFor="reset-password">
                  ពាក្យសម្ងាត់ថ្មី<span className="md-required">*</span>
                </label>
                <input
                  id="reset-password"
                  type="password"
                  autoComplete="new-password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  disabled={resetSaving}
                  autoFocus
                />
              </div>

              <div className="md-field">
                <label htmlFor="reset-confirm">
                  បញ្ជាក់ពាក្យសម្ងាត់<span className="md-required">*</span>
                </label>
                <input
                  id="reset-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={resetConfirm}
                  onChange={(e) => setResetConfirm(e.target.value)}
                  disabled={resetSaving}
                />
              </div>

              <div className="md-hint">
                អ្នកប្រើប្រាស់នឹងត្រូវចាកចេញពីគ្រប់ឧបករណ៍ ហើយត្រូវចូលគណនីម្តងទៀត។
              </div>

              {resetError && <div className="md-form-error">{resetError}</div>}
            </div>

            <div className="md-modal-footer">
              <button type="button" className="md-btn md-btn-ghost" onClick={closeReset} disabled={resetSaving}>
                បោះបង់
              </button>
              <button type="submit" className="md-btn md-btn-primary" disabled={resetSaving}>
                {resetSaving ? "កំពុងរក្សាទុក..." : "រក្សាទុក"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default UserComponent;
