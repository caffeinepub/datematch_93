import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  usePublicProfile,
  useMyProfile,
  useCompatibilityScore,
} from "../../hooks/useQueries";
import { ProfileCard } from "../swipe/ProfileCard";
import { FullProfileDetail } from "../swipe/FullProfileDetail";

interface ProfileViewProps {
  principal: string;
  onBack: () => void;
}

export function ProfileView({ principal, onBack }: ProfileViewProps) {
  const { data: profile, isLoading, isError } = usePublicProfile(principal);
  const { data: myProfile } = useMyProfile();
  const { data: compatibilityScore } = useCompatibilityScore(principal);

  const discoveryProfile = profile ? { profile, distanceKm: null } : null;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="shrink-0 h-14 flex items-center gap-3 px-4 border-b border-border bg-background z-10">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-hover transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold">{profile?.name ?? "Profile"}</h1>
      </div>

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-destructive">Failed to load profile.</p>
        </div>
      )}

      {!isLoading && !isError && discoveryProfile && (
        <div className="flex-1 overflow-y-auto">
          <div
            className={cn(
              "flex flex-col items-center max-w-full mx-auto",
              "lg:flex-row lg:items-start lg:gap-8 lg:max-w-[1000px] lg:px-8 py-4",
            )}
          >
            {/* Photo card */}
            <div
              className={cn(
                "relative aspect-[9/14] shrink-0 w-[99vw] max-w-[420px]",
                "mb-6 lg:mb-0 lg:sticky lg:top-4",
              )}
            >
              <ProfileCard
                profile={discoveryProfile as any}
                myInterests={myProfile?.interests ?? []}
                hideOverlay
              />
            </div>

            {/* Detail cards */}
            <div className="w-full lg:flex-1 px-1 lg:px-0">
              <FullProfileDetail
                profile={discoveryProfile as any}
                compatibilityScore={compatibilityScore}
                onClose={onBack}
                detailsOnly
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
