import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, X, RefreshCw, ChevronLeft, ChevronRight, Plus, Pencil, Eye } from "lucide-react";
import { documentService, documentTransferService } from "../../../api/api.service";
import { TRANSFER_STATUS, formatDate, personName } from "./documentHelpers";
import "../master_data/masterdata.style.css";
import "./document.style.css";
import "./documentView.style.css";

const PAGE_SIZES = [10, 20, 50];
const SEARCH_KEYS = ["code_of_document", "number_document", "objective"];

/**
 * Documents of my office.
 *   box="in"  → transfers addressed to me / my office (GET /document-transfer/inbox) — ចូល
 *   box="out" → documents my office created (GET /document?box=out) — ចេញ
 * Every row opens the detail page (…/view/:id): receive · forward · return · done · tracking.
 */
function DocumentListPage({ box }) {
  const isIn = box === "in";
  const navigate = useNavigate();
  const location = useLocation();

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZES[0]);
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(""); // (in) transfer status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // e.g. "saved" message coming back from another page
  const [notice, setNotice] = useState(location.state?.notice || null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = isIn
        ? await documentTransferService.inbox({ page, limit, status: status || undefined })
        : await documentService.list({
            box: "out",
            page,
            limit,
            q: search,
            q_key: search ? SEARCH_KEYS : undefined,
          });
      setRows(res.data || []);
      setPagination(res.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [isIn, page, limit, search, status]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!notice) return;
    // clear the router state so a refresh doesn't show the message again
    window.history.replaceState({}, document.title);
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  // Debounce the search box
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(keyword.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  // The inbox API has no search → filter the loaded page
  const visibleRows = useMemo(() => {
    if (!isIn || !search) return rows;
    const kw = search.toLowerCase();
    return rows.filter((t) =>
      SEARCH_KEYS.some((k) => String(t.document_id?.[k] || "").toLowerCase().includes(kw)),
    );
  }, [rows, isIn, search]);

  // Receivers of a document: offices + users
  const receiverText = (row) => {
    const names = [
      ...(row.send_to_office_id || []).map((o) => o?.name),
      ...(row.send_to_user_id || []).map((u) => personName(u)),
    ].filter(Boolean);
    return names.length ? names.join(", ") : "-";
  };

  const badge = (map, key) => {
    const item = map[key];
    return item ? <span className={`md-badge ${item.badge}`}>{item.label}</span> : "-";
  };

  const openDetail = (docId) => {
    if (docId) navigate(`/document/${box}/view/${docId}`);
  };

  const totalPages = Math.max(pagination.totalPages || 1, 1);
  const startIndex = (page - 1) * limit;
  const colSpan = isIn ? 8 : 6;

  return (
    <div className="md-page">
      {notice && <div className="md-notice md-notice-success">{notice}</div>}

      {/* ===== Toolbar ===== */}
      <div className="md-toolbar">
        <div className="md-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="ស្វែងរកលេខកូដ លេខឯកសារ ឬកម្មវត្ថុ..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          {keyword && (
            <button type="button" onClick={() => setKeyword("")} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="doc-filters">
          {isIn && (
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              aria-label="Transfer status"
            >
              <option value="">ស្ថានភាពទាំងអស់</option>
              {Object.entries(TRANSFER_STATUS).map(([key, v]) => (
                <option key={key} value={key}>
                  {v.label}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            className="md-btn md-btn-ghost"
            onClick={loadData}
            disabled={loading}
            title="ផ្ទុកឡើងវិញ"
          >
            <RefreshCw size={16} className={loading ? "md-spin" : ""} />
          </button>

          {!isIn && (
            <button
              type="button"
              className="md-btn md-btn-primary"
              onClick={() => navigate("/document/out/create")}
            >
              <Plus size={16} />
              ឯកសារចេញ
            </button>
          )}
        </div>
      </div>

      {/* ===== Table ===== */}
      <div className="md-card">
        <div className="md-table-scroll">
          <table className="md-table">
            <thead>
              <tr>
                <th className="md-col-no">ល.រ</th>
                <th>លេខកូដ</th>
                <th>លេខឯកសារ</th>
                <th>ប្រភេទឯកសារ</th>
                <th>{isIn ? "អង្គភាពផ្ញើ" : "អង្គភាពទទួល"}</th>
                {isIn && <th>កាលបរិច្ឆេទផ្ញើ</th>}
                {isIn && <th>ស្ថានភាព</th>}
                <th className="md-col-actions">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 && (
                <tr>
                  <td colSpan={colSpan} className="md-empty">
                    កំពុងផ្ទុកទិន្នន័យ...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={colSpan} className="md-empty md-empty-error">
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && visibleRows.length === 0 && (
                <tr>
                  <td colSpan={colSpan} className="md-empty">
                    {search || status
                      ? "រកមិនឃើញទិន្នន័យដែលត្រូវនឹងការស្វែងរក"
                      : "មិនទាន់មានឯកសារ"}
                  </td>
                </tr>
              )}

              {isIn &&
                visibleRows.map((t, i) => {
                  const d = t.document_id;
                  return (
                    <tr key={t._id} className="doc-row" onClick={() => openDetail(d?._id)}>
                      <td className="md-col-no">{startIndex + i + 1}</td>
                      <td className="doc-code">{d?.code_of_document || "-"}</td>
                      <td>{d?.number_document || "-"}</td>
                      <td>{d?.document_type_id?.name || "-"}</td>
                      <td>{t.from_office_id?.name || d?.office_id_open?.name || "-"}</td>
                      <td>{formatDate(t.date_sent)}</td>
                      <td>{badge(TRANSFER_STATUS, t.status)}</td>
                      <td className="md-col-actions" onClick={(e) => e.stopPropagation()}>
                        {/* pending = not received yet → "ពិនិត្យ" (review), otherwise just view */}
                        <button
                          type="button"
                          className={`md-btn doc-btn-sm ${
                            t.status === "pending" ? "md-btn-primary" : "md-btn-ghost"
                          }`}
                          onClick={() => openDetail(d?._id)}
                          disabled={!d}
                        >
                          <Eye size={14} />
                          {t.status === "pending" ? "ពិនិត្យ" : "មើល"}
                        </button>
                      </td>
                    </tr>
                  );
                })}

              {!isIn &&
                visibleRows.map((row, i) => (
                  <tr key={row._id} className="doc-row" onClick={() => openDetail(row._id)}>
                    <td className="md-col-no">{startIndex + i + 1}</td>
                    <td className="doc-code">{row.code_of_document || "-"}</td>
                    <td>{row.number_document || "-"}</td>
                    <td>{row.document_type_id?.name || "-"}</td>
                    <td>{receiverText(row)}</td>
                    <td className="md-col-actions" onClick={(e) => e.stopPropagation()}>
                      {/* detail + tracking */}
                      <button
                        type="button"
                        className="md-icon-btn"
                        onClick={() => openDetail(row._id)}
                        title="មើល និងតាមដាន"
                        aria-label="View and track document"
                      >
                        <Eye size={15} />
                      </button>
                      {/* the edit page is locked once someone has received the document */}
                      <button
                        type="button"
                        className="md-icon-btn"
                        onClick={() => navigate(`/document/out/edit/${row._id}`)}
                        title="កែប្រែ"
                        aria-label="Edit document"
                      >
                        <Pencil size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* ===== Pagination ===== */}
        <div className="md-pagination">
          <div className="md-page-size">
            បង្ហាញ
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            / សរុប {pagination.total || 0}
          </div>

          <div className="md-pager">
            <button
              type="button"
              className="md-icon-btn"
              disabled={page <= 1 || loading}
              onClick={() => setPage(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              ទំព័រ {page} / {totalPages}
            </span>
            <button
              type="button"
              className="md-icon-btn"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(page + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentListPage;
