import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import { authApi } from "@/services/authApi";
import { useAuth } from "@/hooks/useAuth";

const DEFAULT_EXPIRY_SECONDS = 300;
const RESEND_COOLDOWN_SECONDS = 60;

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(
    location.state?.expiresInSeconds ?? DEFAULT_EXPIRY_SECONDS
  );
  const [cooldownLeft, setCooldownLeft] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (cooldownLeft <= 0) {
      setResendDisabled(false);
      return undefined;
    }
    const timer = setInterval(() => setCooldownLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldownLeft > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!email) {
    return <Navigate to="/register" replace />;
  }

  const expired = secondsLeft <= 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.verifyOtp({ email, otp });
      login(response);
      navigate("/", { replace: true });
    } catch (err) {
      if (err.code === "OTP_EXPIRED") setSecondsLeft(0);
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
      const result = await authApi.resendOtp({ email });
      setSecondsLeft(result.expiresInSeconds ?? DEFAULT_EXPIRY_SECONDS);
      setOtp("");
      setCooldownLeft(RESEND_COOLDOWN_SECONDS);
      setResendDisabled(true);
    } catch (err) {
      if (err.code === "RESEND_LIMIT_REACHED") {
        setResendDisabled(true);
        setCooldownLeft(0);
      }
      setError(err.message || "Could not resend the code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to <span className="font-medium">{email}</span>.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <ErrorState title="Verification failed" message={error} />}

            <OtpInput value={otp} onChange={setOtp} disabled={loading || expired} error={Boolean(error)} />

            <p className="text-center text-sm text-muted-foreground">
              {expired ? "Code expired." : `Expires in ${formatTime(secondsLeft)}`}
            </p>
          </CardContent>

          <CardFooter className="flex-col items-stretch gap-3">
            <Button type="submit" disabled={loading || expired || otp.length !== 6}>
              {loading ? "Verifying..." : "Verify"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleResend}
              disabled={resending || (resendDisabled && cooldownLeft > 0)}
            >
              {resending
                ? "Resending..."
                : cooldownLeft > 0 && resendDisabled
                  ? `Resend code (${cooldownLeft}s)`
                  : "Resend code"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
