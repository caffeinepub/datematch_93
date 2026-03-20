import { User, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useCompatibilityScore } from "../../hooks/useQueries";
import { fromNanoseconds } from "../../utils/formatting";
import { CompatibilityBadge } from "../quiz/CompatibilityBadge";

interface ConvoItem {
  withPrincipal: { toString(): string };
  profile: {
    name: string;
    photos?: { getDirectURL(): string }[] | null;
  };
  lastMessage?: {
    sentAt: bigint;
    text: string;
  } | null;
  unreadCount: bigint | number;
}

interface MatchListItemProps {
  convo: ConvoItem;
  onSelect: () => void;
  onViewProfile: () => void;
}

export function MatchListItem({
  convo,
  onSelect,
  onViewProfile,
}: MatchListItemProps) {
  const principal = String(convo.withPrincipal);
  const { data: score, isLoading: isLoadingScore } =
    useCompatibilityScore(principal);

  const photoUrl = convo.profile.photos?.[0]?.getDirectURL() ?? null;
  const hasUnread = Number(convo.unreadCount) > 0;
  const lastMsgText = convo.lastMessage?.text ?? null;
  const lastMsgTime = convo.lastMessage
    ? formatDistanceToNow(fromNanoseconds(convo.lastMessage.sentAt), {
        addSuffix: false,
      })
    : null;

  const showScore = isLoadingScore || (score !== null && score !== undefined);

  const isNewMatch = !convo.lastMessage;

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-hover active:bg-muted transition-colors text-left border-b border-border last:border-0"
    >
      {/* Avatar — tap to view profile */}
      <div
        className="relative shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onViewProfile();
        }}
      >
        <div
          className={cn(
            "w-14 h-14 rounded-full overflow-hidden bg-muted flex items-center justify-center active:opacity-75 transition-opacity ring-2",
            isNewMatch ? "ring-primary/40" : "ring-transparent",
          )}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={convo.profile.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-7 h-7 text-muted-foreground" />
          )}
        </div>
        {isNewMatch && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary border-2 border-background shadow-sm" />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              "text-sm truncate font-serif italic",
              hasUnread
                ? "font-bold text-foreground"
                : "font-semibold text-foreground",
            )}
          >
            {convo.profile.name}
          </span>
          {lastMsgTime && (
            <span
              className={cn(
                "text-[11px] shrink-0",
                hasUnread
                  ? "text-primary font-semibold"
                  : "text-muted-foreground",
              )}
            >
              {lastMsgTime}
            </span>
          )}
        </div>
        <p
          className={cn(
            "text-xs truncate mt-0.5 leading-relaxed",
            hasUnread
              ? "text-foreground/80 font-medium"
              : "text-muted-foreground",
            isNewMatch && "text-primary/70 font-medium",
          )}
        >
          {lastMsgText ?? "New match! Say hello 👋"}
        </p>
        {showScore && (
          <div className="mt-1.5">
            <CompatibilityBadge score={score} loading={isLoadingScore} />
          </div>
        )}
      </div>

      {/* Unread dot / chevron */}
      <div className="shrink-0">
        {hasUnread ? (
          <div className="w-3 h-3 rounded-full bg-primary shadow-sm shadow-primary/30" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
        )}
      </div>
    </button>
  );
}
