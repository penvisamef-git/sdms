import React from "react";
import { ArrowRight, CornerUpLeft, Send, Share2 } from "lucide-react";
import {
  TRANSFER_ACTION,
  TRANSFER_STATUS,
  formatDateTime,
  formatHours,
  personName,
} from "./documentHelpers";
import "../master_data/masterdata.style.css";
import "./document.style.css";
import "./documentView.style.css";

const ACTION_ICON = {
  send: <Send size={14} />,
  forward: <Share2 size={14} />,
  return: <CornerUpLeft size={14} />,
};

// "office · user" of one side of a hop
const placeText = (office, user) =>
  [office?.name, personName(user)].filter(Boolean).join(" · ") || "-";

function Tile({ label, value }) {
  return (
    <div className="trk-tile">
      <div className="trk-tile-value">{value}</div>
      <div className="trk-tile-label">{label}</div>
    </div>
  );
}

/**
 * Tracking of a document: summary + who holds it now + the timeline of every hop.
 * props: data = response.data of GET /document/:id/tracking → { document, summary, timeline }
 */
function TrackingPanel({ data }) {
  if (!data) return <div className="md-hint">មិនមានទិន្នន័យតាមដាន</div>;

  const { summary = {}, timeline = [] } = data;
  const holders = summary.current_holders || [];

  return (
    <div className="trk">
      {/* ===== Summary ===== */}
      <div className="trk-summary">
        <Tile label="ជំហានសរុប" value={summary.total_steps ?? 0} />
        <Tile label="ការផ្ទេរសរុប" value={summary.total_transfers ?? 0} />
        <Tile label="អង្គភាពឆ្លងកាត់" value={summary.offices_passed ?? 0} />
        <Tile label="អ្នកពាក់ព័ន្ធ" value={summary.users_involved ?? 0} />
        <Tile label="រុញត្រឡប់" value={summary.returns ?? 0} />
        <Tile label="រយៈពេលសរុប" value={formatHours(summary.total_hours)} />
      </div>

      <div className="trk-dates">
        <span>ផ្ញើដំបូង: {formatDateTime(summary.first_sent)}</span>
        <span>សកម្មភាពចុងក្រោយ: {formatDateTime(summary.last_action)}</span>
      </div>

      {/* ===== Current holders ===== */}
      <div className="doc-section-title">កំពុងស្ថិតនៅ</div>
      {holders.length === 0 ? (
        <div className="md-hint">មិនមានអ្នកកាន់ឯកសារនៅពេលនេះទេ (ដំណើរការបានបញ្ចប់ ឬមិនទាន់ផ្ញើ)</div>
      ) : (
        <div className="trk-holders">
          {holders.map((h) => (
            <div key={h.transfer_id} className="trk-holder">
              <strong>{placeText(h.office, h.user)}</strong>
              <span className={`md-badge ${TRANSFER_STATUS[h.status]?.badge || ""}`}>
                {TRANSFER_STATUS[h.status]?.label || h.status}
              </span>
              <small>តាំងពី {formatDateTime(h.since)}</small>
            </div>
          ))}
        </div>
      )}

      {/* ===== Timeline ===== */}
      <div className="doc-section-title">ដំណើរការឯកសារ</div>
      {timeline.length === 0 ? (
        <div className="md-hint">ឯកសារនេះមិនទាន់ត្រូវបានផ្ញើនៅឡើយទេ</div>
      ) : (
        <ol className="trk-timeline">
          {timeline.map((t) => {
            const st = TRANSFER_STATUS[t.status];
            return (
              <li key={t._id} className={`trk-item trk-item-${t.action}`}>
                <div className="trk-dot">{ACTION_ICON[t.action]}</div>
                <div className="trk-body">
                  <div className="trk-head">
                    <span className="trk-step">ជំហាន {t.step}</span>
                    <strong>{TRANSFER_ACTION[t.action] || t.action}</strong>
                    {st && <span className={`md-badge ${st.badge}`}>{st.label}</span>}
                    {t.status_of_process_id?.name && (
                      <span className="trk-flow">{t.status_of_process_id.name}</span>
                    )}
                  </div>

                  <div className="trk-route">
                    <span>{placeText(t.from_office_id, t.from_user_id)}</span>
                    <ArrowRight size={14} />
                    <span>{placeText(t.to_office_id, t.to_user_id)}</span>
                  </div>

                  <div className="trk-times">
                    <span>ផ្ញើ: {formatDateTime(t.date_sent)}</span>
                    {t.date_received && (
                      <span>
                        ទទួល: {formatDateTime(t.date_received)}
                        {t.received_by ? ` (${personName(t.received_by)})` : ""}
                      </span>
                    )}
                    {t.date_done && <span>បញ្ចប់: {formatDateTime(t.date_done)}</span>}
                  </div>

                  <div className="trk-times">
                    <span>រង់ចាំទទួល: {formatHours(t.waiting_hours)}</span>
                    <span>ស្ថិតនៅ: {formatHours(t.holding_hours)}</span>
                  </div>

                  {t.note && <div className="trk-note">ការណែនាំ: {t.note}</div>}
                  {t.done_note && <div className="trk-note">កំណត់ចំណាំបញ្ចប់: {t.done_note}</div>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export default TrackingPanel;
