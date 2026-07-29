import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function UpdatePriceDialog({ chargers, onSubmit }) {
  const [open, setOpen] = useState(false);
  const [chargerId, setChargerId] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  function reset() {
    setChargerId("");
    setPrice("");
    setResult(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!chargerId || Number(price) <= 0) return;

    setSubmitting(true);
    setResult(null);

    const outcome = await onSubmit(Number(chargerId), Number(price));
    setResult(outcome);
    setSubmitting(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button variant="outline">Update charger price</Button>} />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update charger price</DialogTitle>
          <DialogDescription>
            Choose a charger and set its new price per kWh.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="update-price-charger" className="text-sm font-medium">
              Charger
            </label>
            <Select value={chargerId} onValueChange={setChargerId}>
              <SelectTrigger id="update-price-charger" className="w-full">
                <SelectValue placeholder="Select a charger">
                  {(value) => {
                    const charger = chargers.find((c) => String(c.id) === value);
                    return charger
                      ? `${charger.stationName} — ${charger.power} kW (₹${charger.pricePerKwh}/kWh)`
                      : null;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {chargers.map((charger) => (
                  <SelectItem key={charger.id} value={String(charger.id)}>
                    {charger.stationName} — {charger.power} kW (₹{charger.pricePerKwh}/kWh)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="new-price" className="text-sm font-medium">
              New price per kWh (₹)
            </label>
            <Input
              id="new-price"
              type="number"
              min="0"
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          {result && (
            <p className={result.ok ? "text-sm text-primary" : "text-sm text-destructive"}>
              {result.message}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={submitting || !chargerId || !price}>
              {submitting ? "Updating..." : "Update price"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
