import { useIsMobile } from "@/hooks/use-mobile";
import {
  Pencil,
  Settings,
  ClipboardList,
  CheckCircle2,
  ChevronRight,
  Eye,
  User,
  Camera,
  AlignLeft,
  Tag,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMyProfile, useMyQuizAnswers } from "../../hooks/useQueries";

interface ProfilePageProps {
  onOpenQuiz: () => void;
  onOpenSettings: () => void;
  onEditProfile: () => void;
  onOpenPreview: () => void;
}

const CHECK_META: Record<
  string,
  { label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  photos: { label: "2+ photos uploaded", Icon: Camera },
  bio: { label: "Bio (20+ characters)", Icon: AlignLeft },
  interests: { label: "3+ interests selected", Icon: Tag },
  location: { label: "Location set", Icon: MapPin },
  icebreaker: { label: "Icebreaker added", Icon: MessageSquare },
  quiz: { label: "Quiz completed", Icon: ClipboardList },
};

export function ProfilePage({
  onOpenQuiz,
  onOpenSettings,
  onEditProfile,
  onOpenPreview,
}: ProfilePageProps) {
  const isDesktop = !useIsMobile(1024);
  const { data: profile, isError } = useMyProfile();
  const { data: quizAnswers } = useMyQuizAnswers();

  const hasCompletedQuiz =
    !!quizAnswers?.answers && quizAnswers.answers.length > 0;
  const photoUrl = profile?.photos?.[0]?.getDirectURL() ?? null;
  const isVerified = profile?.isVerified ?? false;

  const verificationChecks = profile
    ? [
        { id: "photos", met: (profile.photos?.length ?? 0) >= 2 },
        { id: "bio", met: profile.bio.length >= 20 },
        { id: "interests", met: profile.interests.length >= 3 },
        { id: "location", met: !!profile.location },
        { id: "icebreaker", met: (profile.icebreakers?.length ?? 0) >= 1 },
        { id: "quiz", met: hasCompletedQuiz },
      ]
    : [];

  const metCount = verificationChecks.filter((c) => c.met).length;
  const percentage =
    verificationChecks.length > 0
      ? Math.round((metCount / verificationChecks.length) * 100)
      : 0;
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive text-sm">Failed to load profile.</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background lg:min-h-0 lg:h-full lg:flex lg:flex-col">
      <div className="w-full lg:flex lg:flex-col lg:h-full">
        <div className="lg:flex-1 lg:overflow-y-auto">
          <div
            className={cn("w-full px-5 pt-6 pb-12 lg:px-6 lg:pt-4 lg:pb-16")}
          >
            {/* Avatar + Name */}
            <div className="flex flex-col items-center mb-6 animate-fade-in">
              <div className="relative mb-3">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-muted ring-4 ring-background shadow-lg">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif italic">
                {profile.name}
              </h1>
            </div>

            {/* Verification Section */}
            <section className="mb-3 animate-fade-in">
              {isVerified ? (
                <div className="w-full rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-emerald-700">
                      Profile Verified
                    </p>
                    <p className="text-xs text-emerald-600/70 mt-0.5">
                      Your profile is visible and trusted by others
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full rounded-2xl bg-card border border-border p-4">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        Get Verified
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Complete your profile to be seen by more people
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-sm font-black px-2 py-0.5 rounded-full",
                        metCount === verificationChecks.length
                          ? "bg-emerald-500/15 text-emerald-600"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      {percentage}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* Checklist */}
                  <div className="space-y-2 mb-3">
                    {verificationChecks.map(({ id, met }) => (
                      <div key={id} className="flex items-center gap-2.5">
                        {met ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span
                          className={cn(
                            "text-xs font-medium",
                            met
                              ? "text-foreground/50 line-through"
                              : "text-foreground",
                          )}
                        >
                          {CHECK_META[id].label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={onEditProfile}
                    className="w-full text-center text-xs font-bold text-primary py-1.5 rounded-xl hover:bg-black/[0.03] transition-colors duration-150"
                  >
                    Complete profile →
                  </button>
                </div>
              )}
            </section>

            {/* Profile Preview (Mobile Only) */}
            {!isDesktop && (
              <section className="mb-3 animate-fade-in">
                <button
                  onClick={onOpenPreview}
                  className="w-full rounded-2xl bg-card border border-border p-4 flex items-center gap-3 hover:bg-hover lg:hover:bg-hover lg:hover:border-border/60 lg:hover:shadow-sm transition-all duration-150 text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Eye className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      Profile Preview
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      See how your profile looks to others
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                </button>
              </section>
            )}

            {/* Edit Profile */}
            <section className="mb-3 animate-fade-in">
              <button
                onClick={onEditProfile}
                className="w-full rounded-2xl bg-card border border-border p-4 flex items-center gap-3 hover:bg-hover lg:hover:bg-hover lg:hover:border-border/60 lg:hover:shadow-sm transition-all duration-150 text-left"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Pencil className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Edit Profile
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Update your name, bio, interests, and photos
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
              </button>
            </section>

            {/* Compatibility Quiz */}
            <section className="mb-3 animate-fade-in">
              <button
                onClick={onOpenQuiz}
                className="w-full rounded-2xl bg-card border border-border p-4 flex items-center gap-3 hover:bg-hover lg:hover:bg-hover lg:hover:border-border/60 lg:hover:shadow-sm transition-all duration-150 text-left"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    hasCompletedQuiz ? "bg-primary/15" : "bg-muted",
                  )}
                >
                  {hasCompletedQuiz ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <ClipboardList className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {hasCompletedQuiz ? "Quiz completed" : "Compatibility Quiz"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {hasCompletedQuiz
                      ? "Tap to retake and update your answers"
                      : "Answer 10 questions to see how well you match with others"}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
              </button>
            </section>

            {/* Settings */}
            <section className="animate-fade-in">
              <button
                onClick={onOpenSettings}
                className="w-full rounded-2xl bg-card border border-border p-4 flex items-center gap-3 hover:bg-hover lg:hover:bg-hover lg:hover:border-border/60 lg:hover:shadow-sm transition-all duration-150 text-left"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Settings
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Preferences, privacy, blocked users
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
