import { User, Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type LikeEntry, useSwipe } from "../../hooks/useQueries";
import { calculateAge } from "../../utils/formatting";

interface LikeItemProps {
  entry: LikeEntry;
  direction: "received" | "sent";
  onViewProfile: (principal: string) => void;
  onMatch?: () => void;
}

export function LikeItem({
  entry,
  direction,
  onViewProfile,
  onMatch,
}: LikeItemProps) {
  const { profile, isMatched } = entry;
  const principal = String(profile.principal);
  const photoUrl = profile.photos?.[0]?.getDirectURL() ?? null;
  const age = calculateAge(profile.birthday);
  const { mutate: swipe, isPending } = useSwipe();

  const handleLikeBack = () => {
    swipe(
      { target: principal, action: "like" },
      {
        onSuccess: (didMatch) => {
          if (didMatch && onMatch) onMatch();
        },
      },
    );
  };

  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5 border-b border-border last:border-0">
      {/* Avatar */}
      <button
        onClick={() => onViewProfile(principal)}
        className="relative shrink-0 active:opacity-75 transition-opacity"
      >
        <div
          className={cn(
            "w-14 h-14 rounded-full overflow-hidden bg-muted flex items-center justify-center ring-2",
            isMatched ? "ring-primary/40" : "ring-transparent",
          )}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-7 h-7 text-muted-foreground" />
          )}
        </div>
        {isMatched && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary border-2 border-background shadow-sm" />
        )}
      </button>

      {/* Name + age */}
      <div className="flex-1 min-w-0">
        <button onClick={() => onViewProfile(principal)} className="text-left">
          <span className="text-sm font-semibold font-serif italic text-foreground truncate block">
            {profile.name}
            {age > 0 && (
              <span className="font-sans not-italic text-muted-foreground font-normal">
                , {age}
              </span>
            )}
          </span>
        </button>
        {isMatched && (
          <span className="text-xs font-semibold text-primary mt-0.5 block">
            Matched!
          </span>
        )}
        {!isMatched && direction === "sent" && (
          <span className="text-xs text-muted-foreground mt-0.5 block">
            Waiting...
          </span>
        )}
      </div>

      {/* Action */}
      {!isMatched && direction === "received" && (
        <button
          onClick={handleLikeBack}
          disabled={isPending}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Heart className="w-3.5 h-3.5" fill="currentColor" />
          )}
          Like back
        </button>
      )}
    </div>
  );
}
