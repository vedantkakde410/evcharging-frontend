import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import EmptyState from "@/components/shared/EmptyState";
import RatingStars from "@/components/shared/RatingStars";
import { cn } from "@/lib/utils";

export default function ReviewList({ reviews, isAuthenticated, onSubmit, submitting, submitError }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!comment.trim()) return;

    await onSubmit({ rating, comment: comment.trim() });
    setComment("");
    setRating(5);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Reviews</h2>

      {reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No reviews yet"
          message="Be the first to share your experience at this station."
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <RatingStars rating={review.rating} size={14} />
                <p className="mt-2 text-sm">{review.comment}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border p-5">
          <p className="text-sm font-medium">Leave a review</p>

          <div
            role="radiogroup"
            aria-label="Rating"
            className="flex items-center gap-1"
            onMouseLeave={() => setHoverRating(0)}
          >
            {Array.from({ length: 5 }).map((_, i) => {
              const value = i + 1;
              const filled = value <= (hoverRating || rating);

              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${value} star${value > 1 ? "s" : ""}`}
                  onMouseEnter={() => setHoverRating(value)}
                  onFocus={() => setHoverRating(value)}
                  onBlur={() => setHoverRating(0)}
                  onClick={() => setRating(value)}
                  className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Star
                    size={22}
                    className={cn(filled ? "fill-primary text-primary" : "text-muted-foreground")}
                  />
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="review-comment" className="text-sm font-medium">
              Your review
            </label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details about your charging experience..."
              required
            />
          </div>

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit review"}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>{" "}
          to leave a review.
        </p>
      )}
    </div>
  );
}
