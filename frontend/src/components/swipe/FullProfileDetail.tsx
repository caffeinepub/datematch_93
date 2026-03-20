import { useState } from "react";
import { toast } from "sonner";
import {
  MapPin,
  BadgeCheck,
  Heart,
  ChevronDown,
  Quote,
  Search,
  MessageSquare,
  Loader2,
  Users,
  Ban,
  Zap,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DiscoveryProfile } from "./ProfileCard";
import { CompatibilityBadge } from "../quiz/CompatibilityBadge";
import { GENDER_PREF_LABELS } from "../shared/GenderPreferencePicker";
import { useBlockUser, useFirstSharedAnswer } from "../../hooks/useQueries";
import { ReportDialog } from "../settings/ReportDialog";
import { calculateAge, kmToMiles } from "../../utils/formatting";
import { QUIZ_QUESTIONS } from "../../utils/constants";

interface FullProfileDetailProps {
  profile: DiscoveryProfile;
  compatibilityScore?: number | null;
  onClose: () => void;
  onLike?: () => void;
  inline?: boolean;
  identityOnly?: boolean;
  detailsOnly?: boolean;
  hideBlock?: boolean;
}

export function FullProfileDetail({
  profile,
  compatibilityScore,
  onClose,
  onLike,
  inline,
  identityOnly,
  detailsOnly,
  hideBlock,
}: FullProfileDetailProps) {
  const { profile: user, distanceKm } = profile;
  const principal = String(user.principal);
  const age = calculateAge(user.birthday);
  const displayName = user.name.charAt(0).toUpperCase() + user.name.slice(1);

  const { mutate: blockUser, isPending: isBlocking } = useBlockUser();
  const { data: sharedAnswer } = useFirstSharedAnswer(
    hideBlock ? null : principal,
  );
  const [showReport, setShowReport] = useState(false);

  const infoCardClass =
    "w-full rounded-[32px] bg-card border border-border p-6 space-y-4 shadow-sm mx-auto pointer-events-auto";
  const headerTextClass =
    "text-[11px] font-bold uppercase tracking-[0.15em] text-foreground/40 flex items-center gap-2";

  const handleBlock = () => {
    blockUser(principal, {
      onSuccess: () => {
        toast.success(`${displayName} blocked`);
        onClose();
      },
      onError: (err) => toast.error(err.message || "Failed to block"),
    });
  };

  const identityCard = (
    <div className="w-full h-14 flex items-center justify-between px-5 bg-background pointer-events-auto">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-serif italic">
          {displayName},&nbsp;
          <span className="font-sans not-italic font-bold">{age}</span>
        </h2>
        {user.isVerified && (
          <BadgeCheck className="w-5 h-5 fill-primary text-white" />
        )}
      </div>
      <button
        onClick={onClose}
        className="w-10 h-10 rounded-full flex items-center justify-center text-foreground/60 hover:bg-hover transition-all active:scale-90"
      >
        <ChevronDown className="w-6 h-6 stroke-[3px]" />
      </button>
    </div>
  );

  const detailCards = (
    <div className="space-y-4">
      {/* Desktop-only Identity Row (Inline above Bio) */}
      <div className="hidden lg:flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground font-serif italic">
            {displayName},&nbsp;
            <span className="font-sans not-italic font-bold">{age}</span>
          </h2>
          {user.isVerified && (
            <BadgeCheck className="w-5 h-5 fill-primary text-white" />
          )}
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-foreground/60 hover:bg-hover transition-all active:scale-90"
        >
          <ChevronDown className="w-6 h-6 stroke-[3px]" />
        </button>
      </div>

      {/* About Me Card */}
      {user.bio && (
        <div className={infoCardClass}>
          <div className={headerTextClass}>
            <Quote className="w-3.5 h-3.5" />
            <span>About me</span>
          </div>
          <p className="text-lg font-medium leading-relaxed text-foreground">
            {user.bio}
          </p>
        </div>
      )}

      {/* Interests Card */}
      {user.interests.length > 0 && (
        <div className={infoCardClass}>
          <div className={headerTextClass}>
            <Search className="w-3.5 h-3.5" />
            <span>Interests</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.interests.map((interest) => (
              <span
                key={interest}
                className="px-4 py-2 rounded-full text-sm font-bold bg-primary/[0.03] text-primary border border-primary/10"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Looking to Connect With Card */}
      {(user.genderPreference ?? []).length > 0 && (
        <div className={infoCardClass}>
          <div className={headerTextClass}>
            <Users className="w-3.5 h-3.5" />
            <span>Looking to connect with</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(user.genderPreference ?? []).map((g) => (
              <span
                key={g}
                className="px-4 py-2 rounded-full text-sm font-bold bg-primary/[0.03] text-primary border border-primary/10"
              >
                {GENDER_PREF_LABELS[g] ?? g}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Distance Card */}
      {distanceKm != null && (
        <div className={infoCardClass}>
          <div className={headerTextClass}>
            <MapPin className="w-3.5 h-3.5" />
            <span>Distance</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-foreground">Away</span>
            <span className="text-base font-bold text-foreground/60">
              {Math.round(kmToMiles(distanceKm))} mi away
            </span>
          </div>
        </div>
      )}

      {/* Icebreakers Card */}
      {user.icebreakers.length > 0 &&
        user.icebreakers.map((ib, i) => (
          <div key={i} className={cn(infoCardClass, "bg-muted border-border")}>
            <div className="flex items-center gap-2 text-foreground/40">
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-bold tracking-wide">
                {ib.prompt}
              </span>
            </div>
            <p className="text-2xl font-black text-foreground leading-tight italic pt-1">
              "{ib.answer}"
            </p>
          </div>
        ))}

      {/* Compatibility + Something in Common Card */}
      {(compatibilityScore != null || sharedAnswer) && (
        <div className={cn(infoCardClass, "bg-primary/[0.01]")}>
          <div className={headerTextClass}>
            <Heart className="w-3.5 h-3.5" />
            <span>Compatibility</span>
          </div>
          {compatibilityScore != null && (
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-foreground/70">
                Our match score
              </p>
              <CompatibilityBadge score={compatibilityScore} />
            </div>
          )}
          {compatibilityScore != null && sharedAnswer && (
            <div className="border-t border-border" />
          )}
          {sharedAnswer && (
            <div className="space-y-1.5">
              <div className={headerTextClass}>
                <Zap className="w-3.5 h-3.5" />
                <span>Something in common</span>
              </div>
              <p className="text-sm font-medium text-foreground/50 leading-snug">
                {QUIZ_QUESTIONS[sharedAnswer.questionIndex].question}
              </p>
              <p className="text-base font-black text-foreground leading-snug">
                "
                {
                  QUIZ_QUESTIONS[sharedAnswer.questionIndex].options[
                    sharedAnswer.answerIndex
                  ]
                }
                "
              </p>
            </div>
          )}
        </div>
      )}

      {/* Report + Block Actions */}
      {!hideBlock && (
        <div className="flex flex-col gap-3 pt-4 pb-2">
          <button
            onClick={() => setShowReport(true)}
            className={cn(
              "w-[99vw] lg:w-full h-14 rounded-2xl border-2 transition-all duration-150 active:scale-[0.98] mx-auto font-bold text-sm",
              "flex items-center justify-center gap-2",
              "border-destructive bg-destructive/[0.04] text-destructive",
              "hover:bg-destructive hover:text-white hover:border-destructive hover:shadow-md hover:shadow-destructive/20",
            )}
          >
            <ShieldAlert className="w-4 h-4" />
            {`Report ${displayName}`}
          </button>
          <button
            onClick={handleBlock}
            disabled={isBlocking}
            className={cn(
              "w-[99vw] lg:w-full h-14 rounded-2xl border-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 mx-auto font-bold text-sm",
              "flex items-center justify-center gap-2",
              "border-destructive bg-destructive/[0.04] text-destructive",
              "hover:bg-destructive hover:text-white hover:border-destructive hover:shadow-md hover:shadow-destructive/20",
            )}
          >
            {isBlocking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Ban className="w-4 h-4" />
                {`Block ${displayName}`}
              </>
            )}
          </button>
        </div>
      )}
      <ReportDialog
        open={showReport}
        onOpenChange={setShowReport}
        targetPrincipal={principal}
        targetName={displayName}
        onSuccess={onClose}
      />
    </div>
  );

  if (identityOnly) return identityCard;
  if (detailsOnly) return detailCards;

  return (
    <div className="flex flex-col">
      {identityCard}
      {detailCards}
    </div>
  );
}
