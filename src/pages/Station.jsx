import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { MapPin, Zap, ArrowLeft } from "lucide-react";
import { stationApi } from "@/services/stationApi";
import { ROOT_URL } from "@/services/api";
import { useFetch } from "@/hooks/useFetch";
import { useAuth } from "@/hooks/useAuth";
import { ListSkeleton } from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import AsyncSection from "@/components/shared/AsyncSection";
import RatingStars from "@/components/shared/RatingStars";
import ChargerCard from "@/features/stations/ChargerCard";
import ReviewList from "@/features/stations/ReviewList";

export default function Station() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  // No single-station GET endpoint exists (API_REFERENCE.md only documents
  // the list endpoint) — reuse it here and find this station client-side
  // rather than inventing a new backend endpoint.
  const { data: stations, loading: stationLoading } = useFetch(stationApi.getStations, []);

  const {
    data: chargers,
    loading: chargersLoading,
    error: chargersError,
    refetch: refetchChargers,
  } = useFetch(() => stationApi.getChargers(id), [id]);

  const {
    data: reviews,
    loading: reviewsLoading,
    error: reviewsError,
    refetch: refetchReviews,
  } = useFetch(() => stationApi.getReviews(id), [id]);

  const [bookingChargerId, setBookingChargerId] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  const station = stations?.find((s) => String(s.id) === id);

  async function handleBook(chargerId) {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }

    setBookingChargerId(chargerId);

    try {
      const response = await fetch(`${ROOT_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId,
          vehicleId: 1,
          chargerId,
        }),
      });

      if (!response.ok) throw new Error("Booking failed");
      await response.json();

      alert("Booking created successfully");
      refetchChargers();
    } catch {
      alert("Booking failed");
    } finally {
      setBookingChargerId(null);
    }
  }

  async function handleAddReview({ rating, comment }) {
    setSubmittingReview(true);
    setReviewError(null);

    try {
      const result = await stationApi.addReview(id, {
        userId: user.userId,
        stationId: Number(id),
        rating,
        comment,
      });

      if (result.ok) {
        refetchReviews();
      } else {
        setReviewError("Couldn't submit your review. Please try again.");
      }
    } catch {
      setReviewError("Couldn't submit your review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Back to stations
      </Link>

      <div className="mt-4">
        {stationLoading ? (
          <div className="space-y-2">
            <div className="h-9 w-64 animate-pulse rounded-md bg-muted" />
            <div className="h-5 w-40 animate-pulse rounded-md bg-muted" />
          </div>
        ) : station ? (
          <>
            <h1 className="text-4xl font-bold">{station.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin size={16} />
                {station.location}
              </span>
              <RatingStars rating={station.rating} size={16} />
            </div>
          </>
        ) : (
          <h1 className="text-4xl font-bold">Station #{id}</h1>
        )}
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Chargers</h2>

        <div className="mt-6 space-y-4">
          <AsyncSection
            loading={chargersLoading}
            error={chargersError}
            empty={chargers?.length === 0}
            onRetry={refetchChargers}
            errorTitle="Couldn't load chargers"
            errorMessage="Please check your connection and try again."
            skeleton={<ListSkeleton rows={3} />}
            emptyState={
              <EmptyState
                icon={Zap}
                title="No chargers at this station"
                message="Check back later or explore another station."
              />
            }
          >
            {chargers?.map((charger) => (
              <ChargerCard
                key={charger.id}
                charger={charger}
                onBook={() => handleBook(charger.id)}
                booking={bookingChargerId === charger.id}
              />
            ))}
          </AsyncSection>
        </div>
      </section>

      <section className="mt-16">
        <AsyncSection
          loading={reviewsLoading}
          error={reviewsError}
          onRetry={refetchReviews}
          errorTitle="Couldn't load reviews"
          errorMessage="Please check your connection and try again."
          skeleton={<ListSkeleton rows={2} />}
        >
          <ReviewList
            reviews={reviews ?? []}
            isAuthenticated={isAuthenticated}
            onSubmit={handleAddReview}
            submitting={submittingReview}
            submitError={reviewError}
          />
        </AsyncSection>
      </section>
    </div>
  );
}
