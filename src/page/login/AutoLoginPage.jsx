import React, { useEffect, useState } from "react";
import { authService } from "../../api/api.service";
import { wipeApiCache } from "../../api/api.client";
import Auth from "../util/auth";
import { homePathFor } from "../util/permission";
import "./login.style.css";

// The token is read ONCE from the address (#t=...) and removed from it right away, so it never stays in the
// browser history or a screenshot. It is kept here, so React's double render and the "open in the app" choice
// cannot lose it — and a one-time link is only used when the user really signs in.
let token = null;
let attempt = null;

function readToken() {
  if (token !== null) return token;
  const match = /[#&]t=([^&]+)/.exec(window.location.hash || "");
  token = match ? decodeURIComponent(match[1]) : "";
  try {
    window.history.replaceState(null, document.title, window.location.pathname);
  } catch {
    /* ignore */
  }
  return token;
}

function signIn() {
  if (!attempt) {
    const t = readToken();
    attempt = t ? authService.exchangeLink(t) : Promise.reject(new Error("Link មិនត្រឹមត្រូវ (គ្មាន Token)!"));
  }
  return attempt;
}

// phone or tablet (iPadOS reports itself as a Mac but has a touch screen)
const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "") ||
  (/Mac/i.test(navigator.platform || "") && navigator.maxTouchPoints > 1);

// /auto-login#t=<token> — the personal link is opened and the user is signed in at once.
// On a phone he may choose to open the SDMS app instead (sdms://auto-login?t=<token>); the same token works in both.
function AutoLoginPage() {
  const [error, setError] = useState("");
  const [mode, setMode] = useState(() => (readToken() && isMobileDevice() ? "choose" : "web"));
  const [appTried, setAppTried] = useState(false);

  useEffect(() => {
    if (mode !== "web") return undefined;
    let alive = true;
    signIn()
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
  }, [mode]);

  const openApp = () => {
    setAppTried(true);
    window.location.href = `sdms://auto-login?t=${encodeURIComponent(readToken())}`;
  };

  const card = { maxWidth: 440, minHeight: 0, display: "block", padding: 32, textAlign: "center" };
  const btn = { display: "block", width: "100%", textDecoration: "none", padding: "12px 20px", marginTop: 12 };

  return (
    <div className="sdms-login">
      <div className="login-card" style={card}>
        <h2 style={{ marginTop: 0 }}>Smart Document Management System</h2>

        {mode === "choose" && (
          <>
            <p>សូមជ្រើសរើសរបៀបចូល</p>
            <button type="button" className="login-button" style={btn} onClick={openApp}>
              បើកក្នុង App
            </button>
            {appTried && (
              <p style={{ fontSize: 13, opacity: 0.75, marginTop: 12 }}>
                បើ App មិនបើក សូមពិនិត្យថាបានដំឡើង App SDMS រួចហើយ ឬបន្តក្នុង Web ខាងក្រោម។
              </p>
            )}
            <button type="button" className="login-button" style={{ ...btn, opacity: 0.85 }} onClick={() => setMode("web")}>
              បន្តក្នុង Web
            </button>
          </>
        )}

        {mode === "web" && !error && <p>កំពុងចូលប្រព័ន្ធ...</p>}
        {mode === "web" && error && (
          <>
            <div className="error-message" role="alert" style={{ margin: "16px 0" }}>
              {error}
            </div>
            <p style={{ fontSize: 14, opacity: 0.8 }}>សូមប្រើ Link ថ្មី ឬចូលដោយអ៊ីមែល និងពាក្យសម្ងាត់។</p>
            <a className="login-button" href="/login" style={{ ...btn, display: "inline-block", width: "auto" }}>
              ចូលដោយពាក្យសម្ងាត់
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default AutoLoginPage;
