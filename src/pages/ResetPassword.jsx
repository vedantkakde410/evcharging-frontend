import { useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ErrorState from "@/components/shared/ErrorState";
import OtpInput from "@/components/shared/OtpInput";
import PasswordStrengthMeter from "@/components/shared/PasswordStrengthMeter";
import { authApi } from "@/services/authApi";
import { validateNewPasswordForm } from "@/lib/validation";

const STEP_OTP = "otp";
const STEP_PASSWORD = "password";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const [step, setStep] = useState(STEP_OTP);
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  if (!email) {
    return <Navigate to="/forgot-password" replace />;
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.verifyResetOtp({ email, otp });
      setResetToken(result.resetToken);
      setStep(STEP_PASSWORD);
    } catch (err) {
      setError(err.message || "Verification failed.");
      setOtp("");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setResending(true);
    try {
      await authApi.resendResetOtp({ email });
      setOtp("");
    } catch (err) {
      setError(err.message || "Could not resend the code.");
    } finally {
      setResending(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError("");

    const errors = validateNewPasswordForm({ newPassword, confirmPassword });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      await authApi.resetPassword({ resetToken, newPassword, confirmPassword });
      toast.success("Password updated. Log in with your new password.");
      navigate("/login", { replace: true });
    } catch (err) {
      if (err.fields) setFieldErrors(err.fields);
      setError(err.message || "Could not reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        {step === STEP_OTP ? (
          <>
            <CardHeader>
              <CardTitle>Check your email</CardTitle>
              <CardDescription>
                Enter the 6-digit code sent to <span className="font-medium">{email}</span>.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleVerifyOtp}>
              <CardContent className="space-y-4">
                {error && <ErrorState title="Verification failed" message={error} />}
                <OtpInput value={otp} onChange={setOtp} disabled={loading} error={Boolean(error)} />
              </CardContent>

              <CardFooter className="flex-col items-stretch gap-3">
                <Button type="submit" disabled={loading || otp.length !== 6}>
                  {loading ? "Verifying..." : "Continue"}
                </Button>
                <Button type="button" variant="outline" onClick={handleResend} disabled={resending}>
                  {resending ? "Resending..." : "Resend code"}
                </Button>
              </CardFooter>
            </form>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Set a new password</CardTitle>
              <CardDescription>Choose a new password for your account.</CardDescription>
            </CardHeader>

            <form onSubmit={handleResetPassword} noValidate>
              <CardContent className="space-y-4">
                {error && <ErrorState title="Couldn't reset password" message={error} />}

                <div className="space-y-1.5">
                  <label htmlFor="newPassword" className="text-sm font-medium">
                    New password
                  </label>
                  <Input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    aria-invalid={Boolean(fieldErrors.newPassword)}
                  />
                  <PasswordStrengthMeter password={newPassword} />
                  {fieldErrors.newPassword && (
                    <p className="text-xs text-destructive">{fieldErrors.newPassword}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm new password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    aria-invalid={Boolean(fieldErrors.confirmPassword)}
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Updating..." : "Update password"}
                </Button>
              </CardFooter>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
