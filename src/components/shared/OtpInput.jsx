import { useRef } from "react";
import { cn } from "@/lib/utils";

const LENGTH = 6;

// Controlled 6-box OTP entry shared by VerifyOtp and ResetPassword
// (COMPONENT_ARCHITECTURE.md's "second consumer known upfront" rule —
// built shared from the start, see AUTHENTICATION_DESIGN.md section 8).
// Behaves like a normal text field: `value` is the joined digit string,
// `onChange` receives the same.
export default function OtpInput({ value, onChange, disabled, error }) {
  const inputRefs = useRef([]);
  const digits = value.padEnd(LENGTH, " ").split("").slice(0, LENGTH);

  function setDigit(index, char) {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join("").replace(/ /g, ""));
  }

  function handleChange(index, e) {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setDigit(index, "");
      return;
    }

    // Handles both a single keystroke and a full paste landing in one box.
    const chars = raw.split("");
    chars.forEach((char, offset) => {
      const target = index + offset;
      if (target < LENGTH) setDigit(target, char);
    });

    const nextIndex = Math.min(index + chars.length, LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !digits[index].trim() && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(index, e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH - index);
    handleChange(index, { target: { value: pasted } });
  }

  return (
    <div className="flex justify-center gap-2" role="group" aria-label="6-digit verification code">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={LENGTH}
          value={digit.trim()}
          disabled={disabled}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePaste(index, e)}
          aria-label={`Digit ${index + 1}`}
          className={cn(
            "h-12 w-10 rounded-lg border border-input bg-transparent text-center text-lg font-medium outline-none transition-colors",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive ring-3 ring-destructive/20"
          )}
        />
      ))}
    </div>
  );
}
