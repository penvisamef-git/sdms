import Auth from "../page/util/auth";

const API_HOST = process.env.REACT_APP_API_HOST || "http://localhost:8085";
const API_AUTH_KEY = process.env.REACT_APP_API_AUTH_KEY || "";
export const API_BASE = `${API_HOST}/api/admin`;

const auth = new Auth();

// Build "?a=1&b=2" from an object, skipping empty values
function toQueryString(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.append(key, typeof value === "object" ? JSON.stringify(value) : value);
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// ---------------------------------------------------------------------------
// Cache (stale-while-revalidate) for the lists every page asks for again and again.
//  - master data / users / roles: fresh for 2 minutes; dashboard and document lists: fresh for 20 seconds
//  - after ANY save / delete (POST, PUT, DELETE) everything is marked "stale": still good to SHOW right away
//    (see apiClient.peek) but always fetched again, and the server's own short cache is skipped (?_nc=1)
//  - the same request asked twice at the same time is sent only once
//  - a copy is kept in sessionStorage so a page refresh in the same tab can paint the last screen at once;
//    it is wiped at sign-out / session expiry
// To stop caching a path, remove it from LONG / SHORT.
// ---------------------------------------------------------------------------
const LONG_MS = 120 * 1000;
const SHORT_MS = 20 * 1000;
const LONG = [/^\/master-data\//, /^\/users-all/, /^\/users-roles/, /^\/group-user-permission-all/, /^\/home\/my-office/];
const SHORT = [/^\/home\/(summary|new-documents)/, /^\/document-transfer\/(inbox|sent)/, /^\/document$/, /^\/document\/[^/]+(\/tracking)?$/];
const STORE_PREFIX = "sdms:c:";
const MAX_ENTRIES = 80;
const cache = new Map(); // key -> { at, json, stale }
const inflight = new Map(); // key -> Promise
let serverFreshUntil = 0; // after a change, ask the server to skip its own cache for a while

const ttlFor = (path) => (LONG.some((re) => re.test(path)) ? LONG_MS : SHORT.some((re) => re.test(path)) ? SHORT_MS : 0);
const copy = (json) => (typeof structuredClone === "function" ? structuredClone(json) : JSON.parse(JSON.stringify(json)));

function readStored(key) {
  try {
    const raw = window.sessionStorage.getItem(STORE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStored(key, entry) {
  try {
    window.sessionStorage.setItem(STORE_PREFIX + key, JSON.stringify({ at: entry.at, json: entry.json }));
  } catch {
    /* storage full or blocked: the memory copy is enough */
  }
}

function wipeStored() {
  try {
    Object.keys(window.sessionStorage)
      .filter((k) => k.startsWith(STORE_PREFIX))
      .forEach((k) => window.sessionStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

// "Something changed": keep what we have for display, but fetch again next time.
export const clearApiCache = () => {
  cache.forEach((e) => {
    e.stale = true;
  });
  inflight.clear();
  serverFreshUntil = Date.now() + SHORT_MS;
};

// Sign-in / sign-out: forget everything, also in sessionStorage.
export const wipeApiCache = () => {
  cache.clear();
  inflight.clear();
  serverFreshUntil = 0;
  wipeStored();
};

// Session expired / invalid token → clear local login and go back to login page
function handleUnauthorized() {
  wipeApiCache();
  auth.removeClientLogin();
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

/**
 * Call the SDMS API.
 * Returns the JSON body ({ success, data, pagination, message }).
 * Throws an Error with the server message when the request fails.
 */
async function request(path, { method = "GET", body, params, skipAuth = false, bypassServerCache = false } = {}) {
  // FormData (file upload): let the browser set the multipart Content-Type + boundary
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  const headers = {
    "x-api-key": API_AUTH_KEY,
  };
  if (!isForm) headers["Content-Type"] = "application/json";

  const token = auth.getClientLogin()?.access_token;
  if (token && !skipAuth) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}${toQueryString(bypassServerCache ? { ...params, _nc: 1 } : params)}`, {
      method,
      headers,
      body: body !== undefined ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch (err) {
    throw new Error("មិនអាចភ្ជាប់ទៅម៉ាសុីនមេបានទេ!");
  }

  const json = await res.json().catch(() => ({}));

  if (res.status === 401 && !skipAuth) {
    handleUnauthorized();
  }

  if (!res.ok || json.success === false) {
    const error = new Error(json.message || `Request failed (${res.status})`);
    error.status = res.status;
    error.response = json;
    throw error;
  }

  return json;
}

const keyOf = (path, params) => `${path}${toQueryString(params)}`;

// The last answer we have for this call, however old (null if none). Use it to paint a screen at once.
function peek(path, params) {
  if (!ttlFor(path)) return null;
  const key = keyOf(path, params);
  let hit = cache.get(key);
  if (!hit) {
    const stored = readStored(key);
    if (stored) {
      // a copy from before a refresh is shown at once but never served as the final answer
      hit = { at: stored.at, json: stored.json, stale: true };
      cache.set(key, hit);
    }
  }
  return hit ? copy(hit.json) : null;
}

async function cachedGet(path, params) {
  const ttl = ttlFor(path);
  if (!ttl) return request(path, { params });

  const key = keyOf(path, params);
  const hit = cache.get(key);
  if (hit && !hit.stale && Date.now() - hit.at < ttl) return copy(hit.json);

  if (!inflight.has(key)) {
    const p = request(path, { params, bypassServerCache: Date.now() < serverFreshUntil })
      .then((json) => {
        if (cache.size > MAX_ENTRIES) cache.clear();
        const entry = { at: Date.now(), json, stale: false };
        cache.set(key, entry);
        writeStored(key, entry);
        return json;
      })
      .finally(() => {
        inflight.delete(key);
      });
    inflight.set(key, p);
  }
  return copy(await inflight.get(key));
}

// any change on the server → forget everything cached
async function mutate(path, options) {
  try {
    return await request(path, options);
  } finally {
    clearApiCache();
  }
}

const apiClient = {
  get: (path, params) => cachedGet(path, params),
  peek,
  post: (path, body, options) => mutate(path, { method: "POST", body, ...options }),
  put: (path, body) => mutate(path, { method: "PUT", body }),
  delete: (path) => mutate(path, { method: "DELETE" }),
};

export default apiClient;
