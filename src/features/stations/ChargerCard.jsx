import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import StatusBadge from "@/components/shared/StatusBadge";

export default function ChargerCard({ charger, onBook, booking }) {
  const { power, pricePerKwh, status } = charger;
  const isAvailable = status === "AVAILABLE";

  return (
    <Card className="py-0">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="text-primary" size={22} />
          </div>
          <div>
            <p className="font-semibold">{power} kW Charger</p>
            <p className="text-sm text-muted-foreground">₹{pricePerKwh} / kWh</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          {isAvailable && (
            <Button size="sm" onClick={onBook} disabled={booking}>
              {booking ? "Booking..." : "Book Charger"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
