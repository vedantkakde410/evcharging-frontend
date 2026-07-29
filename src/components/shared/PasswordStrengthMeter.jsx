import { validatePasswordStrength } from "@/lib/validation";
import { cn } from "@/lib/utils";

const BAR_COLORS = ["bg-destructive", "bg-destructive", "bg-amber-500", "bg-primary", "bg-primary"];

export default function PasswordStrengthMeter({ password }) {
  if (!password) return null;

  const { score, label } = validatePasswordStrength(password);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full bg-muted transition-colors",
              i < score && BAR_COLORS[score]
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
