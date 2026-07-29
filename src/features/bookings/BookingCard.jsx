import { Zap, Clock3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Reused by History.jsx (no `user` field) and Module 5's owner bookings
// table (no `chargingTime` field, has `user`) — renders whichever fields
// are present on the booking rather than assuming one fixed shape.
export default function BookingCard({ booking }) {
  const { station, user, energyUsed, chargingTime, cost } = booking;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="font-semibold">{station}</p>
          {user && <p className="text-sm text-muted-foreground">{user}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Zap size={14} />
            {energyUsed} kWh
          </span>

          {chargingTime != null && (
            <span className="flex items-center gap-1">
              <Clock3 size={14} />
              {chargingTime} hr
            </span>
          )}

          <span className="font-semibold text-foreground">₹{cost}</span>
        </div>
      </CardContent>
    </Card>
  );
}
