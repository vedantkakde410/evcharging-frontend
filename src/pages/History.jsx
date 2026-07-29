import { History as HistoryIcon } from "lucide-react";
import { bookingApi } from "@/services/bookingApi";
import { useFetch } from "@/hooks/useFetch";
import { useAuth } from "@/hooks/useAuth";
import { ListSkeleton } from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import AsyncSection from "@/components/shared/AsyncSection";
import BookingCard from "@/features/bookings/BookingCard";

export default function History() {
  const { user } = useAuth();

  const {
    data: bookings,
    loading,
    error,
    refetch,
  } = useFetch(() => bookingApi.getUserBookings(user.userId), [user.userId]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-4xl font-bold">My Charging History</h1>
      <p className="mt-2 text-muted-foreground">
        A record of every charging session you've booked.
      </p>

      <div className="mt-8 space-y-4">
        <AsyncSection
          loading={loading}
          error={error}
          empty={bookings?.length === 0}
          onRetry={refetch}
          errorTitle="Couldn't load your history"
          errorMessage="Please check your connection and try again."
          skeleton={<ListSkeleton rows={4} />}
          emptyState={
            <EmptyState
              icon={HistoryIcon}
              title="No charging history yet"
              message="Once you book a charger, your sessions will show up here."
            />
          }
        >
          {bookings?.map((booking) => (
            <BookingCard key={booking.bookingId} booking={booking} />
          ))}
        </AsyncSection>
      </div>
    </div>
  );
}
