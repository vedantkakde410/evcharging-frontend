import { Wallet, Zap, ListChecks } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function RevenueSummaryCards({ totalRevenue, totalEnergy, totalBookings }) {
  const stats = [
    {
      icon: Wallet,
      label: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString("en-IN")}`,
    },
    {
      icon: Zap,
      label: "Energy Delivered",
      value: `${totalEnergy.toFixed(1)} kWh`,
    },
    {
      icon: ListChecks,
      label: "Total Bookings",
      value: totalBookings,
    },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {stats.map(({ icon: Icon, label, value }) => (
        <Card key={label}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="text-primary" size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
