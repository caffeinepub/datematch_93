import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useMyProfile,
  useGetLikesReceived,
  useGetLikesSent,
} from "../../hooks/useQueries";
import { LikeItem } from "./LikeItem";
import { MatchOverlay } from "../swipe/MatchOverlay";

interface LikesListProps {
  onViewProfile: (principal: string) => void;
  onOpenChat: (principal: string) => void;
}

export function LikesList({ onViewProfile, onOpenChat }: LikesListProps) {
  const { data: myProfile } = useMyProfile();
  const {
    data: received = [],
    isLoading: loadingReceived,
    isError: errReceived,
  } = useGetLikesReceived();
  const {
    data: sent = [],
    isLoading: loadingSent,
    isError: errSent,
  } = useGetLikesSent();
  const [matchedEntry, setMatchedEntry] = useState<{
    name: string;
    principal: string;
    photo?: { getDirectURL(): string } | null;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");

  const isLoading = loadingReceived || loadingSent;
  const isError = errReceived || errSent;

  // Separate matched from pending in received
  const pendingReceived = received.filter((e) => !e.isMatched);
  const matchedReceived = received.filter((e) => e.isMatched);

  const pendingSent = sent.filter((e) => !e.isMatched);
  const matchedSent = sent.filter((e) => e.isMatched);

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="px-5 pt-6 pb-0 shrink-0 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">
            Likes
          </h1>
          {pendingReceived.length > 0 && (
            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {pendingReceived.length} new
            </span>
          )}
        </div>
        {/* Tabs */}
        <div className="flex gap-0">
          <button
            onClick={() => setActiveTab("received")}
            className={cn(
              "flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors",
              activeTab === "received"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            Liked You
            {received.length > 0 && (
              <span
                className={cn(
                  "ml-1.5 text-xs font-bold",
                  activeTab === "received"
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                {received.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={cn(
              "flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors",
              activeTab === "sent"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            You Liked
            {sent.length > 0 && (
              <span
                className={cn(
                  "ml-1.5 text-xs font-bold",
                  activeTab === "sent"
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                {sent.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {isError && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-destructive">Failed to load likes.</p>
        </div>
      )}

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && !isError && (
        <div className="flex-1 overflow-y-auto">
          {activeTab === "received" && (
            <>
              {received.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-5 text-center px-8 h-full min-h-[300px]">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Heart
                      className="w-10 h-10 text-primary/60"
                      fill="currentColor"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-foreground">
                      No likes yet
                    </p>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-[220px] mx-auto">
                      Keep swiping — your first like is just around the corner
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {pendingReceived.map((entry) => (
                    <LikeItem
                      key={String(entry.profile.principal)}
                      entry={entry}
                      direction="received"
                      onViewProfile={onViewProfile}
                      onMatch={() => {
                        setMatchedEntry({
                          name: entry.profile.name,
                          principal: String(entry.profile.principal),
                          photo: entry.profile.photos?.[0] ?? null,
                        });
                      }}
                    />
                  ))}
                  {matchedReceived.map((entry) => (
                    <LikeItem
                      key={String(entry.profile.principal)}
                      entry={entry}
                      direction="received"
                      onViewProfile={onViewProfile}
                    />
                  ))}
                </>
              )}
            </>
          )}

          {activeTab === "sent" && (
            <>
              {sent.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-5 text-center px-8 h-full min-h-[300px]">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Heart
                      className="w-10 h-10 text-primary/60"
                      fill="currentColor"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-foreground">
                      No likes sent
                    </p>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-[220px] mx-auto">
                      Swipe right on someone you like to send them a like
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {matchedSent.map((entry) => (
                    <LikeItem
                      key={String(entry.profile.principal)}
                      entry={entry}
                      direction="sent"
                      onViewProfile={onViewProfile}
                    />
                  ))}
                  {pendingSent.map((entry) => (
                    <LikeItem
                      key={String(entry.profile.principal)}
                      entry={entry}
                      direction="sent"
                      onViewProfile={onViewProfile}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Match overlay when "Like back" results in a match */}
      {matchedEntry && (
        <MatchOverlay
          me={
            myProfile
              ? { name: myProfile.name, photo: myProfile.photos?.[0] ?? null }
              : null
          }
          them={matchedEntry}
          onClose={() => setMatchedEntry(null)}
          onOpenChat={(p) => {
            setMatchedEntry(null);
            onOpenChat(p);
          }}
        />
      )}
    </div>
  );
}
