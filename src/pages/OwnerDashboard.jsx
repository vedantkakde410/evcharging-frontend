import { ClipboardList, TriangleAlert } from "lucide-react";
import { ownerApi } from "@/services/ownerApi";
import { stationApi } from "@/services/stationApi";
import { useFetch } from "@/hooks/useFetch";
import { useAuth } from "@/hooks/useAuth";
import { CardSkeleton, ListSkeleton } from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import AsyncSection from "@/components/shared/AsyncSection";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import RevenueSummaryCards from "@/features/owner/RevenueSummaryCards";
import BookingsTable from "@/features/owner/BookingsTable";
import AddStationForm from "@/features/owner/AddStationForm";
import AddChargerForm from "@/features/owner/AddChargerForm";
import UpdatePriceDialog from "@/features/owner/UpdatePriceDialog";

export default function OwnerDashboard() {
  const { user } = useAuth();

  const {
    data: revenue,
    loading: revenueLoading,
    error: revenueError,
    refetch: refetchRevenue,
  } = useFetch(() => ownerApi.getRevenue(user.userId), [user.userId]);

  const {
    data: energy,
    loading: energyLoading,
    error: energyError,
    refetch: refetchEnergy,
  } = useFetch(() => ownerApi.getEnergy(user.userId), [user.userId]);

  const {
    data: bookings,
    loading: bookingsLoading,
    error: bookingsError,
    refetch: refetchBookings,
  } = useFetch(() => ownerApi.getBookings(user.userId), [user.userId]);

  const { data: stations } = useFetch(stationApi.getStations, []);

  // No "chargers by owner" endpoint exists — fetch every station's chargers
  // and flatten client-side. Fine at this app's current data volume; would
  // need a real backend endpoint to scale further (can't invent one here,
  // per CLAUDE.md — the frontend doesn't redesign backend APIs).
  const { data: chargers, refetch: refetchChargers } = useFetch(async () => {
    if (!stations || stations.length === 0) return [];

    const perStation = await Promise.all(
      stations.map((station) =>
        stationApi
          .getChargers(station.id)
          .then((list) => list.map((charger) => ({ ...charger, stationName: station.name })))
      )
    );

    return perStation.flat();
  }, [stations]);

  const summaryLoading = revenueLoading || energyLoading || bookingsLoading;
  const summaryError = revenueError || energyError || bookingsError;

  function retryAll() {
    refetchRevenue();
    refetchEnergy();
    refetchBookings();
  }

  async function handleAddStation(station) {
    try {
      return await ownerApi.addStation(station);
    } catch {
      return { ok: false, message: "Something went wrong. Please try again." };
    }
  }

  async function handleAddCharger(charger) {
    try {
      const result = await ownerApi.addCharger(charger);
      if (result.ok) refetchChargers();
      return result;
    } catch {
      return { ok: false, message: "Something went wrong. Please try again." };
    }
  }

  async function handleUpdatePrice(chargerId, pricePerKwh) {
    try {
      const result = await ownerApi.updatePrice(chargerId, pricePerKwh);
      if (result.ok) refetchChargers();
      return result;
    } catch {
      return { ok: false, message: "Something went wrong. Please try again." };
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-bold">Owner Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Revenue, energy delivered, and bookings across your stations.
      </p>

      <div className="mt-8">
        <AsyncSection
          loading={summaryLoading}
          error={summaryError}
          onRetry={retryAll}
          errorTitle="Couldn't load your dashboard"
          errorMessage="Please check your connection and try again."
          skeleton={
            <div className="grid gap-6 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <RevenueSummaryCards
            totalRevenue={revenue?.totalRevenue ?? 0}
            totalEnergy={energy?.totalEnergyDelivered ?? 0}
            totalBookings={bookings?.length ?? 0}
          />
        </AsyncSection>
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">All Charging Sessions</h2>

        <div className="mt-6">
          <AsyncSection
            loading={bookingsLoading}
            error={bookingsError}
            empty={bookings?.length === 0}
            onRetry={refetchBookings}
            errorTitle="Couldn't load bookings"
            errorMessage="Please check your connection and try again."
            skeleton={<ListSkeleton rows={4} />}
            emptyState={
              <EmptyState
                icon={ClipboardList}
                title="No bookings yet"
                message="Once customers book your chargers, sessions will show up here."
              />
            }
          >
            <BookingsTable bookings={bookings ?? []} />
          </AsyncSection>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Manage Stations &amp; Chargers</h2>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add a station</CardTitle>
              <CardDescription>Create a new station under your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <TriangleAlert />
                <AlertTitle>Known backend issue</AlertTitle>
                <AlertDescription>
                  Station creation currently fails with a database error on the
                  backend (an unbound owner_id column) — this is a known,
                  documented issue and isn't something this form can work around.
                </AlertDescription>
              </Alert>
              <AddStationForm onSubmit={handleAddStation} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add a charger</CardTitle>
              <CardDescription>Add a new charger to one of your stations.</CardDescription>
            </CardHeader>
            <CardContent>
              <AddChargerForm stations={stations ?? []} onSubmit={handleAddCharger} />
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          {chargers?.length > 0 ? (
            <UpdatePriceDialog chargers={chargers} onSubmit={handleUpdatePrice} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Add a charger above to update its price.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
