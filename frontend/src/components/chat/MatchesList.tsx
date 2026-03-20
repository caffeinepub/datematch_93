import { Flame, Loader2 } from "lucide-react";
import { useConversations } from "../../hooks/useQueries";
import { MatchListItem } from "./MatchListItem";

interface MatchesListProps {
  onSelectMatch: (principal: string) => void;
  onViewProfile: (principal: string) => void;
}

export function MatchesList({
  onSelectMatch,
  onViewProfile,
}: MatchesListProps) {
  const { data: conversations = [], isLoading, isError } = useConversations();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 shrink-0 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">
            Matches
          </h1>
          {conversations.length > 0 && (
            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {conversations.length}
            </span>
          )}
        </div>
      </div>

      {isError && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-destructive">Failed to load matches.</p>
        </div>
      )}

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && !isError && conversations.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Flame className="w-10 h-10 text-primary/60" fill="currentColor" />
          </div>
          <div>
            <p className="font-bold text-lg text-foreground">No matches yet</p>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-[220px] mx-auto">
              Keep swiping to find people you connect with
            </p>
          </div>
        </div>
      )}

      {!isLoading && !isError && conversations.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          {[...conversations]
            .sort((a, b) => {
              const aTime = a.lastMessage ? Number(a.lastMessage.sentAt) : 0;
              const bTime = b.lastMessage ? Number(b.lastMessage.sentAt) : 0;
              return bTime - aTime;
            })
            .map((convo) => (
              <MatchListItem
                key={String(convo.withPrincipal)}
                convo={convo}
                onSelect={() => onSelectMatch(String(convo.withPrincipal))}
                onViewProfile={() => onViewProfile(String(convo.withPrincipal))}
              />
            ))}
        </div>
      )}
    </div>
  );
}
