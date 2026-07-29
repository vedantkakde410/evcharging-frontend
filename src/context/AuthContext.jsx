import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthContext } from "@/context/auth-context";
import { authApi } from "@/services/authApi";
import { navigate } from "@/lib/navigation";

function readStoredSession() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  if (!token || !userId) return { token: null, user: null };

  return {
    token,
    user: {
      userId,
      name: localStorage.getItem("name"),
      role: localStorage.getItem("role"),
    },
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession);

  const login = useCallback((loginResponse) => {
    const userId = String(loginResponse.userId);
    const { token, name, role } = loginResponse;

    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
    localStorage.setItem("name", name);
    localStorage.setItem("role", role);

    setSession({ token, user: { userId, name, role } });
  }, []);

  const logout = useCallback(() => {
    // Fire-and-forget: revokes the token server-side (Module 9) but must
    // never block clearing the local session on network latency/failure -
    // see authApi.logout()'s own comment for why this bypasses doFetch.
    authApi.logout();

    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("name");
    localStorage.removeItem("role");

    setSession({ token: null, user: null });
  }, []);

  // Reacts to the global events services/api.js dispatches when any
  // authenticated API call comes back 401/403 (Module 9 - "automatically
  // logout when JWT expires" / "handle 401 and 403 responses globally").
  // A 401 means the token itself is no longer valid (expired, malformed, or
  // revoked by a logout elsewhere) - the session is cleared and the user is
  // sent to /login. A 403 means the session is still valid but the resource
  // isn't permitted for this role - no logout, just a redirect.
  useEffect(() => {
    function handleUnauthorized() {
      logout();
      toast.error("Your session has expired. Please log in again.");
      navigate("/login", { replace: true });
    }

    function handleForbidden() {
      navigate("/unauthorized", { replace: true });
    }

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    window.addEventListener("auth:forbidden", handleForbidden);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
      window.removeEventListener("auth:forbidden", handleForbidden);
    };
  }, [logout]);

  const value = {
    token: session.token,
    user: session.user,
    isAuthenticated: Boolean(session.token),
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
