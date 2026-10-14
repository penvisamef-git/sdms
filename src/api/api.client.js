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
// Small in-memory cache for lists that rarely change (master data, offices, users list, roles).
//  - kept 60 seconds, and thrown away at once after ANY save / delete (POST, PUT, DELETE)
//  - the same request asked twice at the same time is sent only once
//  - lives in memory only → a page refresh always starts fresh
// To stop caching a path, remove it from CACHEABLE.
// ---------------------------------------------------------------------------
const CACHE_MS = 60 * 1000;
const CACHEABLE = [/^\/master-data\//, /^\/users-all/, /^\/users-roles/, /^\/group-user-permission-all/, /^\/home\/my-office/];
const cache = new Map(); // key -> { at, json }
const inflight = new Map(); // key -> Promise

const isCacheable = (path) => CACHEABLE.some((re) => re.test(path));
const copy = (json) => (typeof structuredClone === "function" ? structuredClone(json) : JSON.parse(JSON.stringify(json)));
export const clearApiCache = () => {
  cache.clear();
  inflight.clear();
};

// Session expired / invalid token → clear local login and go back to login page
function handleUnauthorized() {
  clearApiCache();
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
async function request(path, { method = "GET", body, params, skipAuth = false } = {}) {
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
    res = await fetch(`${API_BASE}${path}${toQueryString(params)}`, {
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

async function cachedGet(path, params) {
  if (!isCacheable(path)) return request(path, { params });

  const key = `${path}${toQueryString(params)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return copy(hit.json);

  if (!inflight.has(key)) {
    const p = request(path, { params })
      .then((json) => {
        cache.set(key, { at: Date.now(), json });
        return json;
      })
      .finally(() => inflight.delete(key));
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
  post: (path, body, options) => mutate(path, { method: "POST", body, ...options }),
  put: (path, body) => mutate(path, { method: "PUT", body }),
  delete: (path) => mutate(path, { method: "DELETE" }),
};

export default apiClient;
