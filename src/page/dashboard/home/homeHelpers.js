// Small helpers for the Home (summary) page

export const KH_MONTHS = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];
export const KH_WEEKDAYS = ["អាទិត្យ", "ច័ន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍"];

// which date of the document decides the month it is counted in
export const DATE_FIELDS = [
  { value: "created_date", label: "ថ្ងៃបង្កើត" },
  { value: "date_in", label: "ថ្ងៃចូល" },
  { value: "date_registration_document", label: "ថ្ងៃចុះបញ្ជី" },
  { value: "date_sign", label: "ថ្ងៃចុះហត្ថលេខា" },
  { value: "date_sent", label: "ថ្ងៃផ្ញើ" },
];

// "2026-09" for right now in Phnom Penh time (UTC+7) — the same clock the API uses
export function currentMonthValue() {
  const d = new Date(Date.now() + 7 * 3600 * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// "2026-09" + 1 → "2026-10"
export function shiftMonth(value, delta) {
  const [y, m] = value.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// "2026-09" → "កញ្ញា 2026"
export function monthLabel(value) {
  const [y, m] = String(value || "").split("-").map(Number);
  if (!y || !m) return "";
  return `${KH_MONTHS[m - 1]} ${y}`;
}

// "2026-09-05" → "ថ្ងៃសុក្រ 05/09/2026"
export function dayLabel(date) {
  const [y, m, d] = String(date).split("-").map(Number);
  if (!y) return "";
  const weekday = KH_WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${weekday} ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

// 1284 → "1,284" · 12900 → "12.9K"
export function formatNumber(n) {
  const v = Number(n) || 0;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1e4) return `${(v / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return v.toLocaleString("en-US");
}

export const percent = (part, total) => (total > 0 ? Math.round((part / total) * 1000) / 10 : 0);

// round the top of an axis up to a clean number → { max, ticks }
export function niceScale(maxValue, tickCount = 4) {
  const m = Math.max(1, maxValue);
  const rough = m / tickCount;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const frac = rough / pow;
  const step = (frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10) * pow;
  const max = Math.ceil(m / step) * step;
  const ticks = [];
  for (let v = 0; v <= max + 1e-9; v += step) ticks.push(v);
  return { max, ticks };
}

// keep the biggest `limit` rows, fold the tail into one "Other" row
export function topWithOther(rows, limit = 6, otherLabel = "ផ្សេងៗ") {
  const list = (rows || []).filter((r) => r.count > 0);
  if (list.length <= limit) return list.map((r) => ({ ...r }));
  const head = list.slice(0, limit - 1).map((r) => ({ ...r }));
  const tail = list.slice(limit - 1);
  head.push({ _id: "other", name: otherLabel, count: tail.reduce((s, r) => s + r.count, 0), other: true });
  return head;
}
