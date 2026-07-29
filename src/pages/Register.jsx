import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ErrorState from "@/components/shared/ErrorState";
import PasswordStrengthMeter from "@/components/shared/PasswordStrengthMeter";
import { authApi } from "@/services/authApi";
import { validateRegisterForm } from "@/lib/validation";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const errors = validateRegisterForm({ name, email, password, confirmPassword, role });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const result = await authApi.register({ name, email, password, confirmPassword, role });
      navigate("/verify-otp", { state: { email, expiresInSeconds: result.expiresInSeconds } });
    } catch (err) {
      if (err.fields) setFieldErrors(err.fields);
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Sign up to start booking chargers.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            {error && (
              <ErrorState title="Registration failed" message={error} />
            )}

            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium">
                Full name
              </label>
              <Input
                id="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={Boolean(fieldErrors.name)}
              />
              {fieldErrors.name && (
                <p className="text-xs text-destructive">{fieldErrors.name}</p>
              )}
            </div>

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
                aria-invalid={Boolean(fieldErrors.email)}
              />
              {fieldErrors.email && (
                <p className="text-xs text-destructive">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
              />
              <PasswordStrengthMeter password={password} />
              {fieldErrors.password && (
                <p className="text-xs text-destructive">{fieldErrors.password}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm password
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

            <div className="space-y-1.5">
              <label htmlFor="role" className="text-sm font-medium">
                Account type
              </label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role" className="w-full">
                  <SelectValue placeholder="Select account type">
                    {(value) => (value === "OWNER" ? "Station Owner" : "Customer")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Customer</SelectItem>
                  <SelectItem value="OWNER">Station Owner</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.role && (
                <p className="text-xs text-destructive">{fieldErrors.role}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex-col items-stretch gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Sending code..." : "Create account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
