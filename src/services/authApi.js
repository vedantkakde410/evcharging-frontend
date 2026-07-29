import { ROOT_URL } from "@/services/api";

// AuthApiError carries the backend's typed error code (e.g. "OTP_EXPIRED",
// "EMAIL_TAKEN") plus any extra context (field errors, attempts/seconds
// remaining) so pages can branch on `error.code` instead of parsing text.
// Replaces the old text-sniffing workaround now that /auth/** returns real
// status codes and JSON error bodies (AUTHENTICATION_DESIGN.md section 4).
export class AuthApiError extends Error {
  constructor(body, status) {
    super(body?.message || "Something went wrong. Please try again.");
    this.name = "AuthApiError";
    this.code = body?.error || "UNKNOWN_ERROR";
    this.status = status;
    this.fields = body?.fields;
    this.attemptsRemaining = body?.attemptsRemaining;
    this.retryAfterSeconds = body?.retryAfterSeconds;
  }
}

async function authRequest(path, payload) {
  const response = await fetch(`${ROOT_URL}/auth${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new AuthApiError(body, response.status);
  }

  return body;
}

function register({ name, email, password, confirmPassword, role }) {
  return authRequest("/register", { name, email, password, confirmPassword, role });
}

function verifyOtp({ email, otp }) {
  return authRequest("/verify-otp", { email, otp });
}

function resendOtp({ email }) {
  return authRequest("/resend-otp", { email });
}

function login({ email, password }) {
  return authRequest("/login", { email, password });
}

function forgotPassword({ email }) {
  return authRequest("/forgot-password", { email });
}

function verifyResetOtp({ email, otp }) {
  return authRequest("/forgot-password/verify-otp", { email, otp });
}

function resendResetOtp({ email }) {
  return authRequest("/forgot-password/resend-otp", { email });
}

function resetPassword({ resetToken, newPassword, confirmPassword }) {
  return authRequest("/reset-password", { resetToken, newPassword, confirmPassword });
}

// Best-effort server-side revocation (see AUTHENTICATION_DESIGN.md section 7,
// updated by Module 9: logout now actually invalidates the token, not just
// the client-side copy of it). Deliberately does not go through
// services/api.js's doFetch - a 401 here (token already expired/revoked) is
// expected and harmless, and must not re-trigger the global
// auth:unauthorized handler that doFetch dispatches, which would otherwise
// loop back into another logout attempt.
function logout() {
  const token = localStorage.getItem("token");
  if (!token) return Promise.resolve();

  return fetch(`${ROOT_URL}/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {
    // Network failure shouldn't block clearing the local session.
  });
}

export const authApi = {
  register,
  verifyOtp,
  resendOtp,
  login,
  logout,
  forgotPassword,
  verifyResetOtp,
  resendResetOtp,
  resetPassword,
};
