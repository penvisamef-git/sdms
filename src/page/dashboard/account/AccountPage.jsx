import React, { useEffect, useMemo, useState } from "react";
import { Building2, Eye, EyeOff, KeyRound, Mail, Phone, Shield, User } from "lucide-react";
import { homeService, userService } from "../../../api/api.service";
import Auth from "../../util/auth";
import { roleText } from "../user/userRoles";
import "../master_data/masterdata.style.css";
import "./account.style.css";

const LEVELS = [
  { key: "unit", label: "អង្គភាព" },
  { key: "general_directorate", label: "អគ្គនាយកដ្ឋាន" },
  { key: "department", label: "នាយកដ្ឋាន" },
  { key: "office", label: "ការិយាល័យ" },
];

// the profile endpoint may answer { data: user } or { data: { user } } — accept both
const unwrapUser = (res) => {
  const d = res?.data ?? res ?? {};
  const u = d.user || d.profile || d;
  return u && typeof u === "object" ? u : {};
};

const nameOf = (v) => (v && typeof v === "object" ? v.name : "") || "";

function InfoRow({ icon, label, value }) {
  return (
    <div className="ac-row">
      <span className="ac-row-icon">{icon}</span>
      <div className="ac-row-text">
        <dt>{label}</dt>
        <dd>{value || "-"}</dd>
      </div>
    </div>
  );
}

function PasswordField({ id, label, value, onChange, show, autoComplete, className = "" }) {
  return (
    <div className={`md-field ${className}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
      />
    </div>
  );
}

function AccountPage() {
  const login = useMemo(() => new Auth().getClientLogin() || {}, []);

  const [profile, setProfile] = useState({});
  const [chain, setChain] = useState(null);
  const [loading, setLoading] = useState(true);

  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.allSettled([userService.profile(), homeService.myOffice()]).then(([p, o]) => {
      if (!alive) return;
      if (p.status === "fulfilled") setProfile(unwrapUser(p.value));
      if (o.status === "fulfilled") setChain(o.value?.data || null);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  // saved login info is the base; the live profile fills in / overrides
  const me = { ...login, ...profile };
  const fullName = `${me.firstname || ""} ${me.lastname || ""}`.trim();
  const initial = Array.from(me.firstname || me.email || "?")[0].toUpperCase();
  const officeName = chain?.office?.name || nameOf(me.office_id);
  const groupName = roleText(me.role) || nameOf(me.group_user_id) || nameOf(me.group);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!oldPassword) {
      setError("សូមបញ្ចូលពាក្យសម្ងាត់ចាស់");
      return;
    }
    if (!password) {
      setError("សូមបញ្ចូលពាក្យសម្ងាត់ថ្មី");
      return;
    }
    if (password.length < 8) {
      setError("ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៨ តួអក្សរ");
      return;
    }
    if (password !== confirm) {
      setError("ពាក្យសម្ងាត់បញ្ជាក់មិនត្រូវគ្នា");
      return;
    }
    setSaving(true);
    try {
      const res = await userService.changePassword({ old_password: oldPassword, new_password: password });
      setNotice(res?.message || "បានប្តូរពាក្យសម្ងាត់ថ្មី!");
      setOldPassword("");
      setPassword("");
      setConfirm("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="md-page ac-page">
      {notice && <div className="md-notice md-notice-success">{notice}</div>}

      {/* ---------- who am I ---------- */}
      <section className="md-card ac-hero">
        <div className="ac-avatar" aria-hidden="true">
          {initial}
        </div>
        <div className="ac-hero-text">
          <h2>{fullName || "គណនីរបស់ខ្ញុំ"}</h2>
          <p>{me.email || "-"}</p>
          <div className="ac-chips">
            {groupName && (
              <span className="ac-chip">
                <Shield size={13} />
                {groupName}
              </span>
            )}
            {officeName && (
              <span className="ac-chip">
                <Building2 size={13} />
                {officeName}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="ac-grid">
        {/* ---------- personal info ---------- */}
        <section className="md-card ac-card">
          <header className="ac-card-head">
            <h3>ព័ត៌មានផ្ទាល់ខ្លួន</h3>
          </header>
          <dl className="ac-rows">
            <InfoRow icon={<User size={16} />} label="គោត្តនាម" value={me.firstname} />
            <InfoRow icon={<User size={16} />} label="នាម" value={me.lastname} />
            <InfoRow icon={<Mail size={16} />} label="អ៊ីមែល" value={me.email} />
            <InfoRow icon={<Phone size={16} />} label="លេខទំនាក់ទំនង" value={me.contact} />
            <InfoRow icon={<Shield size={16} />} label="ក្រុមសិទ្ធិ" value={groupName} />
          </dl>
        </section>

        {/* ---------- where I work ---------- */}
        <section className="md-card ac-card">
          <header className="ac-card-head">
            <h3>ទីតាំងការងារ</h3>
          </header>
          {loading && !chain ? (
            <p className="ac-muted">កំពុងផ្ទុក...</p>
          ) : (
            <ol className="ac-chain">
              {LEVELS.map((l, i) => {
                const node = chain?.[l.key];
                return (
                  <li key={l.key} className={i === LEVELS.length - 1 ? "is-current" : ""} style={{ "--indent": `${i * 14}px` }}>
                    <span className="ac-chain-dot" />
                    <span className="ac-chain-text">
                      <small>{l.label}</small>
                      <b>{node?.name || "-"}</b>
                      {node?.name_in_eng && <em>{node.name_in_eng}</em>}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* ---------- password ---------- */}
        <section className="md-card ac-card ac-wide">
          <header className="ac-card-head">
            <h3>ប្តូរពាក្យសម្ងាត់</h3>
            <p>ឧបករណ៍ផ្សេងទៀតនឹងត្រូវចូលគណនីម្តងទៀត (យ៉ាងតិច ៨ តួអក្សរ)</p>
          </header>
          <form className="ac-form" onSubmit={submit} noValidate>
            <PasswordField
              id="ac-old"
              label="ពាក្យសម្ងាត់ចាស់"
              value={oldPassword}
              onChange={setOldPassword}
              show={showPwd}
              autoComplete="current-password"
              className="ac-wide"
            />
            <PasswordField
              id="ac-new"
              label="ពាក្យសម្ងាត់ថ្មី"
              value={password}
              onChange={setPassword}
              show={showPwd}
              autoComplete="new-password"
            />
            <PasswordField
              id="ac-confirm"
              label="បញ្ជាក់ពាក្យសម្ងាត់ថ្មី"
              value={confirm}
              onChange={setConfirm}
              show={showPwd}
              autoComplete="new-password"
            />
            <div className="ac-form-actions">
              <button type="button" className="md-btn md-btn-ghost" onClick={() => setShowPwd((v) => !v)}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                {showPwd ? "លាក់" : "បង្ហាញ"}
              </button>
              <button type="submit" className="md-btn md-btn-primary" disabled={saving}>
                <KeyRound size={16} />
                {saving ? "កំពុងរក្សាទុក..." : "ប្តូរពាក្យសម្ងាត់"}
              </button>
            </div>
            {error && <div className="md-form-error ac-form-error">{error}</div>}
          </form>
        </section>
      </div>
    </div>
  );
}

export default AccountPage;
