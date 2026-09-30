import React, { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import "./masterdata.style.css";

const PAGE_SIZES = [10, 20, 50];

/**
 * Shared list + create/edit/delete page for sdms_api master-data resources.
 *
 * props:
 *   title      - Khmer name of the record, used in buttons and messages
 *   service    - resource from api.service.js (list, create, update, remove)
 *   fields     - form fields: { key, label, type: "text" | "email" | "tel" | "password" | "textarea" | "select" | "checkbox",
 *                  required, options, placeholder, createOnly (hidden when editing), full (spans the whole row in wide forms) }
 *   columns    - table columns: { key, label, render?(row) }
 *   searchKeys - fields searched by the keyword box (sent as q_key)
 *   onSaved    - optional callback after create/update/delete (e.g. reload select options)
 *   getName    - optional (row) => text shown in the delete confirmation (default: row.name)
 *   extraActions - optional (row) => extra buttons rendered in the actions column
 *   canDelete  - optional (row) => false hides the delete button for that row
 *   wide       - wider two-column form (for records with many fields)
 */
function MasterDataPage({
  title,
  service,
  fields,
  columns,
  searchKeys,
  onSaved,
  getName,
  extraActions,
  canDelete,
  wide,
}) {
  const emptyForm = () =>
    fields.reduce((acc, f) => ({ ...acc, [f.key]: f.type === "checkbox" ? false : "" }), {
      status: true,
    });

  // ---------------- List state ----------------
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZES[0]);
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [notice, setNotice] = useState(null);

  // ---------------- Form state ----------------
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setListError("");
    try {
      const res = await service.list({
        page,
        limit,
        q: search,
        q_key: search ? searchKeys : undefined,
      });
      setRows(res.data || []);
      setPagination(res.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      setListError(err.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [service, page, limit, search, searchKeys]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3000);
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

  // ---------------- Actions ----------------
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (row) => {
    const values = fields.reduce((acc, f) => {
      const value = row[f.key];
      // populated references come back as objects
      if (f.type === "checkbox") acc[f.key] = !!value;
      else acc[f.key] = value && typeof value === "object" ? value._id : value ?? "";
      return acc;
    }, {});
    setEditing(row);
    setForm({ ...values, status: row.status !== false });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const activeFields = fields.filter((f) => !(editing && f.createOnly));

    const missing = activeFields.find(
      (f) => f.required && f.type !== "checkbox" && !String(form[f.key] ?? "").trim(),
    );
    if (missing) {
      setFormError(`សូមបញ្ចូល ${missing.label}`);
      return;
    }

    // Empty select values must be null — the API can't store "" as an ObjectId
    const payload = { ...form };
    fields.forEach((f) => {
      if (f.type === "select" && !payload[f.key]) payload[f.key] = null;
      // e.g. password can only be set on create (edited through its own action)
      if (editing && f.createOnly) delete payload[f.key];
    });

    setSaving(true);
    try {
      const res = editing
        ? await service.update(editing._id, payload)
        : await service.create(payload);
      setNotice({ type: "success", text: res.message || "បានរក្សាទុក!" });
      setModalOpen(false);
      if (!editing) setPage(1);
      await loadData();
      onSaved && onSaved();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      const res = await service.remove(deleting._id);
      setNotice({ type: "success", text: res.message || "បានលុប!" });
      setDeleting(null);
      // step back a page when the last row of a page is removed
      if (rows.length === 1 && page > 1) setPage(page - 1);
      else await loadData();
      onSaved && onSaved();
    } catch (err) {
      setNotice({ type: "error", text: err.message });
      setDeleting(null);
    } finally {
      setSaving(false);
    }
  };

  // ---------------- Render helpers ----------------
  const totalPages = Math.max(pagination.totalPages || 1, 1);
  const startIndex = (page - 1) * limit;

  const renderField = (f) => {
    const common = {
      id: f.key,
      name: f.key,
      value: form[f.key] ?? "",
      onChange: (e) => handleChange(f.key, e.target.value),
      disabled: saving,
    };

    if (f.type === "textarea") {
      return <textarea rows={3} placeholder={f.placeholder} {...common} />;
    }

    if (f.type === "select") {
      const options = (f.options || []).filter(
        (opt) => !editing || opt.value !== editing._id,
      );
      return (
        <select {...common}>
          <option value="">{f.placeholder || "-- ជ្រើសរើស --"}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    if (f.type === "checkbox") {
      return (
        <label className="md-switch">
          <input
            type="checkbox"
            checked={!!form[f.key]}
            onChange={(e) => handleChange(f.key, e.target.checked)}
            disabled={saving}
          />
          <span className="md-switch-track" />
          {form[f.key] ? f.onLabel || "បាទ/ចាស" : f.offLabel || "ទេ"}
        </label>
      );
    }

    const inputType = ["email", "tel", "password"].includes(f.type) ? f.type : "text";
    return (
      <input
        type={inputType}
        placeholder={f.placeholder}
        autoComplete={inputType === "password" ? "new-password" : "off"}
        {...common}
      />
    );
  };

  const visibleFields = fields.filter((f) => !(editing && f.createOnly));

  return (
    <div className="md-page">
      {notice && <div className={`md-notice md-notice-${notice.type}`}>{notice.text}</div>}

      {/* ===== Toolbar ===== */}
      <div className="md-toolbar">
        <div className="md-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="ស្វែងរក..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          {keyword && (
            <button type="button" onClick={() => setKeyword("")} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="md-toolbar-actions">
          <button
            type="button"
            className="md-btn md-btn-ghost"
            onClick={loadData}
            disabled={loading}
            title="ផ្ទុកឡើងវិញ"
          >
            <RefreshCw size={16} className={loading ? "md-spin" : ""} />
          </button>
          <button type="button" className="md-btn md-btn-primary" onClick={openCreate}>
            <Plus size={16} />
            បង្កើត{title}
          </button>
        </div>
      </div>

      {/* ===== Table ===== */}
      <div className="md-card">
        <div className="md-table-scroll">
          <table className="md-table">
            <thead>
              <tr>
                <th className="md-col-no">ល.រ</th>
                {columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
                <th className="md-col-actions">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 2} className="md-empty">
                    កំពុងផ្ទុកទិន្នន័យ...
                  </td>
                </tr>
              )}

              {!loading && listError && (
                <tr>
                  <td colSpan={columns.length + 2} className="md-empty md-empty-error">
                    {listError}
                  </td>
                </tr>
              )}

              {!loading && !listError && rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 2} className="md-empty">
                    {search ? "រកមិនឃើញទិន្នន័យដែលត្រូវនឹងការស្វែងរក" : "មិនទាន់មានទិន្នន័យ"}
                  </td>
                </tr>
              )}

              {rows.map((row, i) => (
                <tr key={row._id}>
                  <td className="md-col-no">{startIndex + i + 1}</td>
                  {columns.map((c) => (
                    <td key={c.key}>{c.render ? c.render(row) : row[c.key] || "-"}</td>
                  ))}
                  <td className="md-col-actions">
                    {extraActions && extraActions(row)}
                    <button
                      type="button"
                      className="md-icon-btn"
                      onClick={() => openEdit(row)}
                      title="កែប្រែ"
                    >
                      <Pencil size={15} />
                    </button>
                    {(!canDelete || canDelete(row)) && (
                      <button
                        type="button"
                        className="md-icon-btn md-icon-btn-danger"
                        onClick={() => setDeleting(row)}
                        title="លុប"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
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

      {/* ===== Create / Edit modal ===== */}
      {modalOpen && (
        <div className="md-modal-backdrop" onMouseDown={closeModal}>
          <form
            className={`md-modal ${wide ? "md-modal-wide" : ""}`}
            onSubmit={handleSubmit}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="md-modal-header">
              <h3>{editing ? `កែប្រែ${title}` : `បង្កើត${title}ថ្មី`}</h3>
              <button type="button" className="md-icon-btn" onClick={closeModal} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="md-modal-body">
              <div className={wide ? "md-fields md-fields-grid" : "md-fields"}>
                {visibleFields.map((f) => (
                  <div
                    key={f.key}
                    className={`md-field ${f.full || f.type === "textarea" ? "md-field-full" : ""}`}
                  >
                    <label htmlFor={f.key}>
                      {f.label}
                      {f.required && <span className="md-required">*</span>}
                    </label>
                    {renderField(f)}
                  </div>
                ))}
              </div>

              <label className="md-switch">
                <input
                  type="checkbox"
                  checked={!!form.status}
                  onChange={(e) => handleChange("status", e.target.checked)}
                  disabled={saving}
                />
                <span className="md-switch-track" />
                {form.status ? "សកម្ម" : "អសកម្ម"}
              </label>

              {formError && <div className="md-form-error">{formError}</div>}
            </div>

            <div className="md-modal-footer">
              <button type="button" className="md-btn md-btn-ghost" onClick={closeModal} disabled={saving}>
                បោះបង់
              </button>
              <button type="submit" className="md-btn md-btn-primary" disabled={saving}>
                {saving ? "កំពុងរក្សាទុក..." : "រក្សាទុក"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===== Delete confirm ===== */}
      {deleting && (
        <div className="md-modal-backdrop" onMouseDown={() => !saving && setDeleting(null)}>
          <div className="md-modal md-modal-sm" onMouseDown={(e) => e.stopPropagation()}>
            <div className="md-modal-header">
              <h3>លុប{title}</h3>
            </div>
            <div className="md-modal-body">
              <p>
                តើអ្នកពិតជាចង់លុប <strong>{getName ? getName(deleting) : deleting.name}</strong> មែនទេ?
              </p>
            </div>
            <div className="md-modal-footer">
              <button
                type="button"
                className="md-btn md-btn-ghost"
                onClick={() => setDeleting(null)}
                disabled={saving}
              >
                បោះបង់
              </button>
              <button type="button" className="md-btn md-btn-danger" onClick={confirmDelete} disabled={saving}>
                {saving ? "កំពុងលុប..." : "លុប"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MasterDataPage;
