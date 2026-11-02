import React, { useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { authService } from "../../../api/api.service";
import "../master_data/masterdata.style.css";

/**
 * A session opened with a deep link must confirm the password before it signs or returns a document.
 * onDone() is called after the server accepted the password (good for 10 minutes); onCancel() closes it.
 */
function ConfirmPasswordModal({ onDone, onCancel }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError("សូមបញ្ចូលពាក្យសម្ងាត់");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await authService.confirmPassword(password);
      onDone();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="md-modal-backdrop" onMouseDown={() => !busy && onCancel()}>
      <form className="md-modal md-modal-sm" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
        <div className="md-modal-header">
          <h3>
            <ShieldCheck size={18} style={{ verticalAlign: "-3px", marginRight: 6 }} />
            បញ្ជាក់ពាក្យសម្ងាត់
          </h3>
          <button type="button" className="md-icon-btn" onClick={onCancel} disabled={busy} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="md-modal-body">
          <p>សូមបញ្ចូលពាក្យសម្ងាត់ មុនចុះហត្ថលេខា ឬត្រឡប់ឯកសារ (ចូលតាម Link)។ ការបញ្ជាក់មានសុពលភាព ១០ នាទី។</p>
          <div className="md-field">
            <label htmlFor="confirm-password">ពាក្យសម្ងាត់</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              autoFocus
            />
          </div>
          {error && <div className="md-form-error">{error}</div>}
        </div>
        <div className="md-modal-footer">
          <button type="button" className="md-btn md-btn-ghost" onClick={onCancel} disabled={busy}>
            បោះបង់
          </button>
          <button type="submit" className="md-btn md-btn-primary" disabled={busy}>
            {busy ? "កំពុងពិនិត្យ..." : "បញ្ជាក់"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ConfirmPasswordModal;
