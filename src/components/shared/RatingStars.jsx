import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RatingStars({ rating = 0, size = 16, showValue = true, className }) {
  const rounded = Math.round(rating);

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={size}
            className={i < rounded ? "fill-primary text-primary" : "text-muted-foreground"}
          />
        ))}
      </span>
      {showValue && <span className="text-sm font-medium">{rating.toFixed(1)}</span>}
      <span className="sr-only">{rating.toFixed(1)} out of 5 stars</span>
    </span>
  );
}
