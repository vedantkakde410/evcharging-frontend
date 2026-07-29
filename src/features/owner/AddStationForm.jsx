import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AddStationForm({ onSubmit }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;

    setSubmitting(true);
    setResult(null);

    const outcome = await onSubmit({ id: 0, name: name.trim(), location: location.trim() });
    setResult(outcome);
    setSubmitting(false);

    if (outcome.ok) {
      setName("");
      setLocation("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="station-name" className="text-sm font-medium">
          Station name
        </label>
        <Input id="station-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="station-location" className="text-sm font-medium">
          Location
        </label>
        <Input
          id="station-location"
          required
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      {result && (
        <p className={result.ok ? "text-sm text-primary" : "text-sm text-destructive"}>
          {result.message}
        </p>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Adding..." : "Add station"}
      </Button>
    </form>
  );
}
