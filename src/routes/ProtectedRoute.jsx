import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// `role` guards against a specific role once one is actually established
// (see Module 5 in ROADMAP.md) — omit it for auth-only gating, as used by
// Module 1's /history and /owner routes.
export default function ProtectedRoute({ role }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
