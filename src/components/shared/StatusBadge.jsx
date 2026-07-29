import { Badge } from "@/components/ui/badge";

export default function StatusBadge({ status, className }) {
  const isAvailable = status === "AVAILABLE";

  return (
    <Badge variant={isAvailable ? "default" : "destructive"} className={className}>
      {isAvailable ? "Available" : "Busy"}
    </Badge>
  );
}
