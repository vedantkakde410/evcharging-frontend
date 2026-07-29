import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { authApi } from "@/services/authApi";
import { isValidEmail } from "@/lib/validation";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.forgotPassword({ email });
      navigate("/reset-password", { state: { email, message: result.message } });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>
            Enter your account email and we&apos;ll send you a reset code.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            {error && <ErrorState title="Couldn't send code" message={error} />}

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </CardContent>

          <CardFooter className="flex-col items-stretch gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Sending code..." : "Send reset code"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Remembered it?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Back to log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
