import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ErrorState({
  title = "Something went wrong",
  message = "Please try again in a moment.",
  onRetry,
  className,
}) {
  return (
    <Alert variant="destructive" className={cn(className)}>
      <AlertCircle />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {message}
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={onRetry}
          >
            Try again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
