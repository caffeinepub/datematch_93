import { ArrowLeft, ShieldOff, Loader2 } from "lucide-react";
import { useBlockedUsers } from "../../hooks/useQueries";
import { BlockedUserItem } from "./BlockedUserItem";

interface BlockedListProps {
  onBack: () => void;
}

export function BlockedList({ onBack }: BlockedListProps) {
  const { data: blocked = [], isLoading, isError } = useBlockedUsers();

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 shrink-0 border-b border-border bg-background">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-hover transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Blocked Users</h1>
      </div>

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-destructive">
            Failed to load blocked users.
          </p>
        </div>
      )}

      {!isLoading && !isError && blocked.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <ShieldOff className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No blocked users</p>
            <p className="text-sm text-muted-foreground mt-1">
              Users you block won't appear in discovery or matches
            </p>
          </div>
        </div>
      )}

      {!isLoading && !isError && blocked.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          {blocked.map((principal) => (
            <BlockedUserItem
              key={String(principal)}
              principal={String(principal)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
