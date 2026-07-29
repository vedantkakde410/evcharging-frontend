import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// `status` is ignored by the backend — the insert always hardcodes
// "AVAILABLE" (API_REFERENCE.md) — so it isn't collected from the owner,
// just sent as the truthful constant the backend applies anyway.
export default function AddChargerForm({ stations, onSubmit }) {
  const [stationId, setStationId] = useState("");
  const [power, setPower] = useState("");
  const [pricePerKwh, setPricePerKwh] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stationId || Number(power) <= 0 || Number(pricePerKwh) <= 0) return;

    setSubmitting(true);
    setResult(null);

    const outcome = await onSubmit({
      id: 0,
      stationId: Number(stationId),
      power: Number(power),
      pricePerKwh: Number(pricePerKwh),
      status: "AVAILABLE",
    });
    setResult(outcome);
    setSubmitting(false);

    if (outcome.ok) {
      setPower("");
      setPricePerKwh("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="charger-station" className="text-sm font-medium">
          Station
        </label>
        <Select value={stationId} onValueChange={setStationId}>
          <SelectTrigger id="charger-station" className="w-full">
            <SelectValue placeholder="Select a station">
              {(value) => stations.find((s) => String(s.id) === value)?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {stations.map((station) => (
              <SelectItem key={station.id} value={String(station.id)}>
                {station.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="charger-power" className="text-sm font-medium">
            Power (kW)
          </label>
          <Input
            id="charger-power"
            type="number"
            min="0"
            step="0.1"
            required
            value={power}
            onChange={(e) => setPower(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="charger-price" className="text-sm font-medium">
            Price per kWh (₹)
          </label>
          <Input
            id="charger-price"
            type="number"
            min="0"
            step="0.01"
            required
            value={pricePerKwh}
            onChange={(e) => setPricePerKwh(e.target.value)}
          />
        </div>
      </div>

      {result && (
        <p className={result.ok ? "text-sm text-primary" : "text-sm text-destructive"}>
          {result.message}
        </p>
      )}

      <Button type="submit" disabled={submitting || !stationId}>
        {submitting ? "Adding..." : "Add charger"}
      </Button>
    </form>
  );
}
