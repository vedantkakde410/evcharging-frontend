import { cn } from "@/lib/utils";

export default function EmptyState({
  icon: Icon,
  title = "Nothing here yet",
  message,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center",
        className
      )}
    >
      {Icon && (
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Icon className="text-muted-foreground" size={24} />
        </div>
      )}
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {message && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{message}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
