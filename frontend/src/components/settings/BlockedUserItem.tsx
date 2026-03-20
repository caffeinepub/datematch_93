import { User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublicProfile, useUnblockUser } from "../../hooks/useQueries";

interface BlockedUserItemProps {
  principal: string;
}

export function BlockedUserItem({ principal }: BlockedUserItemProps) {
  const { data: profile } = usePublicProfile(principal);
  const { mutate: unblock, isPending } = useUnblockUser();

  const photoUrl = profile?.photos?.[0]?.getDirectURL() ?? null;
  const displayName = profile?.name ?? principal.slice(0, 12) + "…";

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
      <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-6 h-6 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {displayName}
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="rounded-xl shrink-0"
        disabled={isPending}
        onClick={() => unblock(principal)}
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          "Unblock"
        )}
      </Button>
    </div>
  );
}
