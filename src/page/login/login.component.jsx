import React, { useEffect, useRef, useState } from "react";
import "./login.style.css";
import Auth from "../util/auth";
import { authService } from "../../api/api.service";
import { APP_VERSION_TEXT } from "../../appInfo";
import { useNavigate } from "react-router-dom";

// Decide which field a server error message is about
function fieldsFromMessage(message = "") {
  const email = /អ៊ីមែល|email/i.test(message);
  const password = /ពាក្យសម្ងាត់|password/i.test(message);
  return { email, password };
}

function LoginComponent() {
  const auth = new Auth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [badFields, setBadFields] = useState({ email: false, password: false });
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const [focusField, setFocusField] = useState(null); // { name: "email" | "password" } (new object each time)

  useEffect(() => {
    document.title = "ចូលគណនី";
  }, []);

  // Focus the field that has the error (after inputs are enabled again)
  useEffect(() => {
    if (loading || !focusField) return;
    const el = focusField.name === "email" ? emailRef.current : passwordRef.current;
    el?.focus();
  }, [focusField, loading]);

  // Mark bad fields and focus the first one
  const markBad = (fields) => {
    setBadFields(fields);
    setFocusField(fields.email ? { name: "email" } : fields.password ? { name: "password" } : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    markBad({ email: false, password: false });

    // ---- Validate ----
    if (!email || !password) {
      setError("សូមបំពេញព័ត៌មានទាំងអស់");
      markBad({ email: !email, password: !password });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("អ៊ីមែលមិនត្រឹមត្រូវ");
      markBad({ email: true, password: false });
      return;
    }

    setLoading(true);

    try {
      const json = await authService.login(email, password);

      auth.setClientLogin(json.data);

      window.location.reload();
    } catch (err) {
      console.error("❌ Login error:", err);
      const message = err.message || "អ៊ីមែល ឬ ពាក្យសម្ងាត់មិនត្រឹមត្រូវ";
      setError(message);
      // Only the field named in the message gets the red border
      markBad(fieldsFromMessage(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sdms-login">
      {/* ===== Animated Bubbles Background ===== */}
      <div className="bubbles">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div className="login-card">
        {/* ===== LEFT: Brand Panel ===== */}
        <div className="brand-panel">
          <div className="brand-top">
            <h1>
              Smart Document
              <br />
              Management System
            </h1>
            <h1>
              ប្រព័ន្ធគ្រប់គ្រង
              <br />
              ទិន្នន័យឆ្លាតវៃ
            </h1>
          </div>

          <div className="brand-features">
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <div className="feature-text">
                <div className="feature-title">សុវត្ថិភាព</div>
                <div className="feature-desc">ការពារទិន្នន័យ 100%</div>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <div className="feature-text">
                <div className="feature-title">រហ័ស</div>
                <div className="feature-desc">ដំណើរការភ្លាមៗ</div>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <div className="feature-text">
                <div className="feature-title">ឆ្លាតវៃ</div>
                <div className="feature-desc">វិភាគទិន្នន័យឆ្លាតវៃ</div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== RIGHT: Login Form ===== */}
        <div className="form-panel">
          <div className="form-header">
            <h2>ចូលគណនី</h2>
            <p>បំពេញព័ត៌មានដើម្បីចូលគណនី</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {/* Email */}
            <div className="form-group">
              <p htmlFor="email">អ៊ីមែល</p>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  id="email"
                  ref={emailRef}
                  placeholder="បញ្ចូលអ៊ីមែលរបស់អ្នក"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setBadFields((b) => ({ ...b, email: false }));
                  }}
                  onKeyDown={(e) => {
                    // Enter in email: move to password (when email is filled)
                    if (e.key === "Enter" && email.trim()) {
                      e.preventDefault();
                      passwordRef.current?.focus();
                    }
                  }}
                  className={badFields.email ? "input-error" : ""}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <p htmlFor="password">ពាក្យសម្ងាត់</p>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  ref={passwordRef}
                  placeholder="បញ្ចូលពាក្យសម្ងាត់"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setBadFields((b) => ({ ...b, password: false }));
                  }}
                  className={badFields.password ? "input-error" : ""}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && <div className="error-message">{error}</div>}

            {/* Submit */}
            <button type="submit" className="login-button" disabled={loading}>
              {loading && <span className="btn-spinner" />}
              {loading ? "កំពុងចូលគណនី ..." : "ចូលប្រើប្រាស់"}
            </button>
          </form>

          <br />
          <div style={{ textAlign: "center", color: "gray", fontSize: "13px" }}>
            <label>© 2026 SDMS · ប្រព័ន្ធគ្រប់គ្រងទិន្នន័យឆ្លាតវៃ</label>
            <div style={{ marginTop: "4px", fontSize: "12px" }}>{APP_VERSION_TEXT}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginComponent;
