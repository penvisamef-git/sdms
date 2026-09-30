import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, Clock, CornerUpLeft, FileText, Inbox, RefreshCw, Send } from "lucide-react";
import { homeService } from "../../../api/api.service";
import Auth from "../../util/auth";
import { ACCESS, canAccess, docBoxFor } from "../../util/permission";
import { DOC_STATUS, formatDate, personName } from "../document/documentHelpers";
import { ChartCard, DayColumns, Sparkline, StackBar } from "./homeCharts";
import {
  DATE_FIELDS,
  currentMonthValue,
  formatNumber,
  monthLabel,
  shiftMonth,
} from "./homeHelpers";
import "../master_data/masterdata.style.css";
import "./home.style.css";

// series colours — categorical slots 1-3 (validated set), status of a document: new · process · close
const STATUS_COLORS = { new: "var(--hm-c1)", process: "var(--hm-c2)", close: "var(--hm-c3)" };

/* ------------------------------------------------------------------ stat tile */

function Tile({ label, value, sub, icon, hero, onClick, spark }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag type={onClick ? "button" : undefined} className={`hm-tile ${hero ? "hm-tile-hero" : ""} ${onClick ? "is-link" : ""}`} onClick={onClick}>
      <span className="hm-tile-top">
        <span className="hm-tile-icon">{icon}</span>
        <span className="hm-tile-label">{label}</span>
      </span>
      <span className="hm-tile-main">
        <span className="hm-tile-value">{formatNumber(value)}</span>
        {spark}
      </span>
      {sub && <span className="hm-tile-sub">{sub}</span>}
    </Tag>
  );
}

/* ------------------------------------------------------------------ small list rows */

function EmptyState({ children }) {
  return <div className="hm-empty">{children}</div>;
}

// my office → department → general directorate → unit
function OfficeChain({ me }) {
  const levels = [
    { key: "unit", label: "អង្គភាព" },
    { key: "general_directorate", label: "អគ្គនាយកដ្ឋាន" },
    { key: "department", label: "នាយកដ្ឋាន" },
    { key: "office", label: "ការិយាល័យ" },
  ];
  return (
    <ol className="hm-chain">
      {levels.map((l, i) => {
        const node = me?.[l.key];
        return (
          <li key={l.key} className={i === levels.length - 1 ? "is-current" : ""} style={{ paddingLeft: i * 14, "--indent": `${i * 14}px` }}>
            <span className="hm-chain-dot" />
            <span className="hm-chain-text">
              <small>{l.label}</small>
              <b>{node?.name || "-"}</b>
              {node?.name_in_eng && <em>{node.name_in_eng}</em>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ latest new documents (paged) */

const BOXES = [
  { value: "all", label: "ទាំងអស់" },
  { value: "out", label: "ចេញ" },
  { value: "in", label: "ចូល" },
];

function NewDocumentsCard({ month, dateField, refreshKey }) {
  const navigate = useNavigate();
  const user = new Auth().getClientLogin();
  const [box, setBox] = useState("all");
  const [allTime, setAllTime] = useState(false);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const seq = useRef(0);

  // any filter change → back to page 1
  useEffect(() => {
    setPage(1);
  }, [month, dateField, box, allTime]);

  useEffect(() => {
    const mine = ++seq.current;
    setLoading(true);
    setError("");
    homeService
      .newDocuments({ month, date_field: dateField, box, page, limit: 5, all_time: allTime ? "true" : undefined })
      .then((res) => {
        if (mine !== seq.current) return;
        setRows(res.data || []);
        setPagination(res.pagination || { total: 0, totalPages: 1 });
      })
      .catch((err) => {
        if (mine === seq.current) setError(err.message);
      })
      .finally(() => {
        if (mine === seq.current) setLoading(false);
      });
  }, [month, dateField, box, allTime, page, refreshKey]);

  const totalPages = Math.max(1, pagination.totalPages || 1);

  return (
    <section className="hm-card">
      <header className="hm-card-head">
        <div className="hm-card-titles">
          <h3>ឯកសារថ្មី</h3>
          <p>{allTime ? "គ្រប់ពេលវេលា" : monthLabel(month)} · {formatNumber(pagination.total)} ឯកសារ</p>
        </div>
        <div className="hm-card-tools">
          <div className="hm-seg" role="group" aria-label="ប្រអប់">
            {BOXES.map((b) => (
              <button key={b.value} type="button" className={box === b.value ? "is-active" : ""} onClick={() => setBox(b.value)}>
                {b.label}
              </button>
            ))}
          </div>
          <label className="hm-check">
            <input type="checkbox" checked={allTime} onChange={(e) => setAllTime(e.target.checked)} />
            <span>គ្រប់ខែ</span>
          </label>
        </div>
      </header>

      <div className={`hm-card-body hm-list-body ${loading ? "is-loading" : ""}`}>
        {error && <EmptyState>{error}</EmptyState>}
        {!error && rows.length === 0 && !loading && <EmptyState>គ្មានឯកសារថ្មី</EmptyState>}
        {!error && rows.length > 0 && (
          <ul className="hm-list">
            {rows.map((d) => (
              <li key={d._id}>
                <button type="button" className="hm-row" onClick={() => {
                    // open it in a list this role may use (an "in" user can't use /document/out …)
                    const target = docBoxFor(user, d.document_progress);
                    if (target) navigate(`/document/${target}/view/${d._id}`);
                  }}>
                  <span className="hm-row-main">
                    <span className="hm-row-title">
                      <b>{d.code_of_document || "-"}</b>
                      <span className={`hm-pill ${d.document_progress === "out" ? "hm-pill-out" : "hm-pill-in"}`}>
                        {d.document_progress === "out" ? "ចេញ" : "ចូល"}
                      </span>
                    </span>
                    <span className="hm-row-sub" title={d.objective}>
                      {d.objective || "-"}
                    </span>
                    <span className="hm-row-meta">
                      {[d.document_type_id?.name, d.status_of_process_id?.name, d.office_id_open?.name].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="hm-row-side">{formatDate(d.created_date)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {totalPages > 1 && (
        <footer className="hm-pager">
          <button type="button" className="md-icon-btn" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)} aria-label="មុន">
            <ChevronLeft size={16} />
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button type="button" className="md-icon-btn" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)} aria-label="បន្ទាប់">
            <ChevronRight size={16} />
          </button>
        </footer>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ page */

function HomeComponent() {
  const navigate = useNavigate();
  const canIn = canAccess(new Auth().getClientLogin(), ACCESS.DOC_IN);
  const [month, setMonth] = useState(currentMonthValue());
  const [dateField, setDateField] = useState("created_date");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const seq = useRef(0);

  const nowMonth = currentMonthValue();

  useEffect(() => {
    const mine = ++seq.current;
    setLoading(true);
    setError("");
    homeService
      .summary({ month, date_field: dateField })
      .then((res) => {
        if (mine === seq.current) setData(res.data);
      })
      .catch((err) => {
        if (mine === seq.current) setError(err.message);
      })
      .finally(() => {
        if (mine === seq.current) setLoading(false);
      });
  }, [month, dateField, refreshKey]);

  const docs = data?.documents;
  const transfers = data?.transfers;
  const me = data?.me;

  const statusParts = useMemo(
    () =>
      ["new", "process", "close"].map((k) => ({
        key: k,
        label: DOC_STATUS[k].label,
        count: docs?.by_status?.[k] || 0,
        color: STATUS_COLORS[k],
      })),
    [docs],
  );
  const sourceParts = useMemo(
    () => [
      { key: "out", label: "ចេញ · បង្កើតដោយការិយាល័យខ្ញុំ", count: docs?.out || 0, color: "var(--hm-accent)" },
      { key: "in", label: "ចូល · ទទួលបាន", count: docs?.in || 0, color: "var(--hm-other)" },
    ],
    [docs],
  );
  const dayValues = useMemo(() => (docs?.by_day || []).map((d) => d.count), [docs]);

  const goInbox = useCallback(() => navigate("/document/in"), [navigate]);

  const fullName = personName(me?.user);
  const chainText = [me?.unit?.name, me?.general_directorate?.name, me?.department?.name, me?.office?.name].filter(Boolean).join(" › ");

  return (
    <div className="md-page hm-page">
      {/* ---------- title + filters (one row, scopes everything below) ---------- */}
      <div className="hm-top">
        <div className="hm-hello">
          <h2>{fullName ? `សួស្តី ${fullName}` : "ទិន្នន័យសង្ខេប"}</h2>
          <p>{chainText || "ទិន្នន័យសង្ខេបនៃឯកសាររបស់អ្នក"}</p>
        </div>

        <div className="hm-filters">
          <div className="hm-month">
            <button type="button" className="md-icon-btn" onClick={() => setMonth((m) => shiftMonth(m, -1))} aria-label="ខែមុន">
              <ChevronLeft size={18} />
            </button>
            <label className="hm-month-pick">
              <span>{monthLabel(month)}</span>
              <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="ជ្រើសរើសខែ" />
            </label>
            <button type="button" className="md-icon-btn" onClick={() => setMonth((m) => shiftMonth(m, 1))} aria-label="ខែបន្ទាប់">
              <ChevronRight size={18} />
            </button>
          </div>
          <button type="button" className="md-btn md-btn-ghost hm-btn" onClick={() => setMonth(nowMonth)} disabled={month === nowMonth}>
            ខែនេះ
          </button>
          <label className="hm-select">
            <span>រាប់តាម</span>
            <select value={dateField} onChange={(e) => setDateField(e.target.value)}>
              {DATE_FIELDS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="md-btn md-btn-ghost hm-btn" onClick={() => setRefreshKey((k) => k + 1)} disabled={loading} aria-label="ផ្ទុកឡើងវិញ">
            <RefreshCw size={16} className={loading ? "md-spin" : ""} />
          </button>
        </div>
      </div>

      {error && !data && (
        <div className="hm-card hm-error">
          <p>{error}</p>
          <button type="button" className="md-btn md-btn-primary" onClick={() => setRefreshKey((k) => k + 1)}>
            ព្យាយាមម្តងទៀត
          </button>
        </div>
      )}

      {!data && !error && <div className="hm-loading">កំពុងផ្ទុក...</div>}

      {data && (
        <div className={`hm-body ${loading ? "is-loading" : ""}`}>
          {error && <div className="hm-banner">{error}</div>}

         

          {/* ---------- needs action now (not limited to the month) ---------- */}
       
          <div className="hm-tiles hm-tiles-now">

              
            <Tile
              hero
              label="រង់ចាំទទួល"
              value={transfers.waiting_to_receive}
              sub={transfers.waiting_to_receive > 0 ? "ចុចដើម្បីពិនិត្យឯកសារចូល" : "គ្មានឯកសារត្រូវទទួល"}
              icon={<Inbox size={18} />}
              onClick={canIn ? goInbox : undefined}
            />

            
            <Tile
              label="កំពុងកាន់"
              value={transfers.on_hand}
              sub="បានទទួល មិនទាន់បញ្ជូនបន្ត"
              icon={<Clock size={18} />}
              onClick={canIn ? goInbox : undefined}
            />
          </div>

          

          {/* ---------- the selected month ---------- */}
  
          <div className="hm-tiles">
            <Tile
              label="ឯកសារសរុប"
              value={docs.total}
              sub={`ចេញ ${formatNumber(docs.out)} · ចូល ${formatNumber(docs.in)}`}
              icon={<FileText size={18} />}
              spark={<Sparkline values={dayValues} color="var(--hm-accent)" />}
            />
            <Tile label="ឯកសារថ្មី" value={data.new_documents.total} sub="ស្ថានភាព ថ្មី" icon={<FileText size={18} />} />
            <Tile label="បានផ្ញើ" value={transfers.sent_this_month} sub="ការផ្ញើ/បញ្ជូនបន្ត" icon={<Send size={18} />} />
            <Tile label="រុញត្រឡប់មកខ្ញុំ" value={transfers.returned_to_me_this_month} icon={<CornerUpLeft size={18} />} />
            <Tile label="បានបញ្ចប់" value={transfers.done_this_month} icon={<Check size={18} />} />
          </div>

          {/* ---------- charts ---------- */}
          <div className="hm-layout">
            <ChartCard
              className="hm-span-8"
              title="ឯកសារតាមថ្ងៃ"
              subtitle={`${monthLabel(month)} · សរុប ${formatNumber(docs.total)} ឯកសារ`}
              table={{
                columns: ["ថ្ងៃ", "ចំនួន"],
                rows: docs.by_day.map((d) => [d.date.split("-").reverse().join("/"), d.count]),
              }}
            >
              {docs.total === 0 ? (
                <EmptyState>គ្មានឯកសារក្នុងខែនេះ</EmptyState>
              ) : (
                <DayColumns days={docs.by_day} color="var(--hm-accent)" />
              )}
            </ChartCard>

            <div className="hm-span-4 hm-stack-cards">
              <ChartCard
                title="ស្ថានភាពឯកសារ"
                subtitle="ចែកតាមស្ថានភាព"
                table={{ columns: ["ស្ថានភាព", "ចំនួន"], rows: statusParts.map((p) => [p.label, p.count]) }}
              >
                <StackBar parts={statusParts} />
              </ChartCard>
              <ChartCard
                title="ចូល និង ចេញ"
                subtitle="ប្រភពឯកសារ"
                table={{ columns: ["ប្រភព", "ចំនួន"], rows: sourceParts.map((p) => [p.label, p.count]) }}
              >
                <StackBar parts={sourceParts} />
              </ChartCard>
            </div>

            {/* ---------- lists ---------- */}
            <div className="hm-span-8">
              <NewDocumentsCard month={month} dateField={dateField} refreshKey={refreshKey} />
            </div>

            <section className="hm-card hm-span-4">
              <header className="hm-card-head">
                <div className="hm-card-titles">
                  <h3>ទីតាំងរបស់ខ្ញុំ</h3>
                  <p>ការិយាល័យ → អង្គភាព</p>
                </div>
              </header>
              <div className="hm-card-body">
                <OfficeChain me={me} />
              </div>
            </section>

          </div>
        </div>
      )}
    </div>
  );
}

export default HomeComponent;
