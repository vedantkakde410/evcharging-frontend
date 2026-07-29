// VITE_API_BASE_URL (Module P0) - falls back to localhost so `npm run dev`
// keeps working with zero setup; set for real in .env for other
// environments (see .env.example / DEPLOYMENT.md). Vite only exposes
// import.meta.env.VITE_* vars to client code, and only inlines them at
// build time - this is the single place the backend's origin is defined,
// consumed by every services/*Api.js file via ROOT_URL/BASE_URL.
export const ROOT_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8801";
const BASE_URL = `${ROOT_URL}/api`;

function authHeaders(options) {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
}

// A 401 here means "the token this request carried is no longer valid"
// (expired, malformed, or revoked by logout) - not a login-form-style wrong
// password, which never flows through this wrapper (authApi.js's /auth/**
// calls use their own plain fetch). AuthContext listens for these events
// and reacts: 401 -> clear session + redirect to /login, 403 -> redirect to
// /unauthorized without logging out (the session is still valid, just not
// permitted for this resource).
function dispatchAuthEvent(response) {
  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
  } else if (response.status === 403) {
    window.dispatchEvent(new CustomEvent("auth:forbidden"));
  }
}

async function doFetch(baseUrl, url, options) {
  const response = await fetch(baseUrl + url, {
    ...options,
    headers: authHeaders(options),
  });

  dispatchAuthEvent(response);

  return response;
}

async function request(url, options = {}) {
  const response = await doFetch(BASE_URL, url, options);

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

// For endpoints that return a plain-text success/"Error: ..." message with a
// 200 status either way (see API_REFERENCE.md's error-handling summary) —
// callers inspect the text themselves instead of relying on response.ok.
export async function requestText(url, options = {}) {
  const response = await doFetch(BASE_URL, url, options);
  const text = await response.text();
  return response.ok ? text : `Error: ${text || response.statusText}`;
}

// For controllers with no /api prefix (/owner, /owner/reports — see
// API_REFERENCE.md: "no common /api prefix across all controllers").
export async function requestRoot(url, options = {}) {
  const response = await doFetch(ROOT_URL, url, options);

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

// Combines the two quirks above: /owner's write endpoints (addStation,
// addCharger, updatePrice) are both un-prefixed and plain-text-response.
export async function requestTextRoot(url, options = {}) {
  const response = await doFetch(ROOT_URL, url, options);
  const text = await response.text();
  return response.ok ? text : `Error: ${text || response.statusText}`;
}

export default request;
