const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// At least 8 characters, one uppercase, one lowercase, one digit — mirrors
// the backend's ValidationUtil so client-side feedback never contradicts
// what the server will ultimately accept.
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function isValidEmail(email) {
  return EMAIL_PATTERN.test(String(email ?? "").trim());
}

export function passwordsMatch(password, confirmPassword) {
  return Boolean(password) && password === confirmPassword;
}

// Returns { valid, score, label } — score 0-4, used by PasswordStrengthMeter.
// `valid` reflects the server-enforced minimum bar; `score`/`label` are UX
// feedback only, not a separate validation rule.
export function validatePasswordStrength(password) {
  const value = String(password ?? "");
  const valid = PASSWORD_PATTERN.test(value);

  let score = 0;
  if (value.length >= 8) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value) && value.length >= 12) score++;

  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];

  return { valid, score, label: labels[score] };
}

export function validateRegisterForm({ name, email, password, confirmPassword, role }) {
  const errors = {};

  if (!name || !name.trim()) errors.name = "Name is required.";
  if (!isValidEmail(email)) errors.email = "Enter a valid email address.";
  if (!validatePasswordStrength(password).valid) {
    errors.password =
      "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a digit.";
  }
  if (!passwordsMatch(password, confirmPassword)) {
    errors.confirmPassword = "Passwords do not match.";
  }
  if (!role) errors.role = "Select an account type.";

  return errors;
}

export function validateNewPasswordForm({ newPassword, confirmPassword }) {
  const errors = {};

  if (!validatePasswordStrength(newPassword).valid) {
    errors.newPassword =
      "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a digit.";
  }
  if (!passwordsMatch(newPassword, confirmPassword)) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}
