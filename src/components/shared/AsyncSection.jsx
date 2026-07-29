import ErrorState from "./ErrorState";

// The loading/error/empty/data branching used by every page that fetches
// server data (Home, Station, History, OwnerDashboard) — extracted once it
// recurred a fourth time (see CHANGELOG.md Modules 4/5's known-issues notes).
export default function AsyncSection({
  loading,
  error,
  empty,
  skeleton,
  errorTitle,
  errorMessage,
  errorClassName,
  onRetry,
  emptyState,
  children,
}) {
  if (loading) return skeleton ?? null;

  if (error) {
    return (
      <ErrorState
        className={errorClassName}
        title={errorTitle}
        message={errorMessage}
        onRetry={onRetry}
      />
    );
  }

  if (empty) return emptyState ?? null;

  return children;
}
