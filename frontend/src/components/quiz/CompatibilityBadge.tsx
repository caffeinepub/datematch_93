import { cn } from "@/lib/utils";

interface CompatibilityBadgeProps {
  score: number | null | undefined;
  loading?: boolean;
  variant?: "default" | "card";
}

export function CompatibilityBadge({
  score,
  loading = false,
  variant = "default",
}: CompatibilityBadgeProps) {
  const isCard = variant === "card";

  if (loading) {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
          isCard
            ? "bg-white/20 backdrop-blur-sm text-white/70"
            : "bg-muted text-muted-foreground",
        )}
      >
        ...
      </span>
    );
  }

  if (score === null || score === undefined) return null;

  if (score >= 71) {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
          isCard
            ? "bg-green-500/70 backdrop-blur-sm text-white"
            : "bg-primary/15 text-primary",
        )}
      >
        {score}% match
      </span>
    );
  }

  if (score >= 41) {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
          isCard
            ? "bg-amber-500/70 backdrop-blur-sm text-white"
            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        )}
      >
        {score}% match
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
        isCard
          ? "bg-white/20 backdrop-blur-sm text-white/80"
          : "bg-muted text-muted-foreground",
      )}
    >
      Low match
    </span>
  );
}
