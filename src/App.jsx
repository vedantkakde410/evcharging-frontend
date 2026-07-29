import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";
import { setNavigate } from "@/lib/navigation";

import Home from "./pages/Home";
import Station from "./pages/Station";
import History from "./pages/History";
import OwnerDashboard from "./pages/OwnerDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

// Captures react-router's real navigate() into lib/navigation.js once, so
// AuthContext (mounted above <BrowserRouter> in main.jsx) can redirect
// imperatively in response to a global 401/403 without needing to be a
// route-aware component itself. Renders nothing.
function NavigationBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    // Respects the OS-level prefers-reduced-motion setting for every
    // Framer Motion animation in the app automatically (UI_DESIGN_SYSTEM.md),
    // rather than retrofitting useReducedMotion() into each animated
    // component individually.
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <NavigationBridge />
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/station/:id" element={<Station />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/history" element={<History />} />
            </Route>

            <Route element={<ProtectedRoute role="OWNER" />}>
              <Route path="/owner" element={<OwnerDashboard />} />
            </Route>
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>

      <Toaster />
    </MotionConfig>
  );
}