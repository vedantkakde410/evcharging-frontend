import { createContext } from "react";

// Kept in its own file (no component export here) so AuthContext.jsx and
// hooks/useAuth.js can each export a single React-refresh-safe symbol.
export const AuthContext = createContext(null);
