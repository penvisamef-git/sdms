import React, { useEffect, useState } from "react";
import { authService } from "../../api/api.service";
import { wipeApiCache } from "../../api/api.client";
import Auth from "../util/auth";
import { homePathFor } from "../util/permission";
import "./login.style.css";

// The token is read ONCE from the address (#t=...) and removed from it right away, so it never stays in the
// browser history or a screenshot. The promise is kept here so React's double render cannot use a one-time link twice.
let attempt = null;
function startOnce() {
  if (attempt) return attempt;
  const match = /[#&]t=([^&]+)/.exec(window.location.hash || "");
  const token = match ? decodeURIComponent(match[1]) : "";
  try {
    window.history.replaceState(null, document.title, window.location.pathname);
  } catch {
    /* ignore */
  }
  attempt = token
    ? authService.exchangeLink(token)
    : Promise.reject(new Error("Link មិនត្រឹមត្រូវ (គ្មាន Token)!"));
  return attempt;
}

// /auto-login#t=<token> — the Big Boss opens his personal link and is signed in at once
function AutoLoginPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    startOnce()
      .then((json) => {
        wipeApiCache(); // nothing of a previous user stays in the cache
        new Auth().setClientLogin(json.data);
        window.location.replace(homePathFor(json.data)); // Big Boss → /inbox, everybody else → /home
      })
      .catch((err) => {
        if (alive) setError(err.message || "Link នេះមិនអាចប្រើបានទេ!");
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="sdms-login">
      <div className="login-card" style={{ maxWidth: 440, minHeight: 0, display: "block", padding: 32, textAlign: "center" }}>
        <h2 style={{ marginTop: 0 }}>Smart Document Management System</h2>
        {!error && <p>កំពុងចូលប្រព័ន្ធ...</p>}
        {error && (
          <>
            <div className="error-message" role="alert" style={{ margin: "16px 0" }}>
              {error}
            </div>
            <p style={{ fontSize: 14, opacity: 0.8 }}>
              សូមប្រើ Link ថ្មី ឬចូលដោយអ៊ីមែល និងពាក្យសម្ងាត់។
            </p>
            <a className="login-button" href="/login" style={{ display: "inline-block", textDecoration: "none", padding: "10px 20px", width: "auto" }}>
              ចូលដោយពាក្យសម្ងាត់
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default AutoLoginPage;
