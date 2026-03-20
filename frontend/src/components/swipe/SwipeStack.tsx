import { useState, useRef, useEffect } from "react";
import {
  Heart,
  X,
  SlidersHorizontal,
  Loader2,
  ChevronDown,
  MapPin,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useDiscovery,
  useSwipe,
  useMyProfile,
  useCompatibilityScore,
  usePreferences,
} from "../../hooks/useQueries";
import { ProfileCard } from "./ProfileCard";
import { MatchOverlay } from "./MatchOverlay";
import { SwipeFilterSheet, type SwipeFilters } from "./SwipeFilterSheet";
import { FullProfileDetail } from "./FullProfileDetail";
import { RadarScreen } from "../RadarScreen";
import { calculateAge } from "../../utils/formatting";

const SWIPE_THRESHOLD = 80;

interface SwipeStackProps {
  onOpenChat: (principal: string) => void;
  onViewProfile: (principal: string) => void;
  onOpenLocationPicker?: () => void;
  showFilters: boolean;
  onShowFilters: (open: boolean) => void;
}

export function SwipeStack({
  onOpenChat,
  onViewProfile,
  onOpenLocationPicker,
  showFilters,
  onShowFilters,
}: SwipeStackProps) {
  const { data: allProfiles = [], isLoading } = useDiscovery(50);
  const { data: myProfile } = useMyProfile();
  const { data: preferences } = usePreferences();
  const { mutate: swipe } = useSwipe();

  const [filters, setFilters] = useState<SwipeFilters>({
    interests: [],
    ageRange: null,
    radiusKm: null,
  });
  const [showFilterRadar, setShowFilterRadar] = useState(false);
  const [filterRadarRadius, setFilterRadarRadius] = useState(50);

  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(
    null,
  );
  const [matchedProfile, setMatchedProfile] = useState<
    (typeof allProfiles)[number] | null
  >(null);
  const [expandedPrincipal, setExpandedPrincipal] = useState<string | null>(
    null,
  );

  const [showTutorial, setShowTutorial] = useState(() => {
    try {
      return !localStorage.getItem("datamatch_swipe_tutorial_seen");
    } catch {
      return false;
    }
  });
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialDragOffset, setTutorialDragOffset] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const [dragOffsetY, setDragOffsetY] = useState(0);

  const advanceTutorial = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tutorialStep === 0) setTutorialStep(1);
    else {
      try {
        localStorage.setItem("datamatch_swipe_tutorial_seen", "1");
      } catch {}
      setShowTutorial(false);
      setTutorialDragOffset(0);
    }
  };

  useEffect(() => {
    if (!showTutorial) return;
    const TARGET = 65;
    const PERIOD = 2400;
    const easeInOut = (t: number) =>
      t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const direction = tutorialStep === 0 ? -1 : 1;
    let startTime: number | null = null;
    let rafId: number;
    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const pct = ((now - startTime) % PERIOD) / PERIOD;
      let offset = 0;
      if (pct < 0.4) offset = easeInOut(pct / 0.4) * TARGET;
      else if (pct < 0.7) offset = TARGET;
      else if (pct < 0.9) offset = (1 - easeInOut((pct - 0.7) / 0.2)) * TARGET;
      setTutorialDragOffset(direction * offset);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      setTutorialDragOffset(0);
    };
  }, [showTutorial, tutorialStep]);

  const profiles = allProfiles.filter((dp) => {
    const p = dp.profile;
    const pid = String(p.principal);

    // Local filter for swiped items in this session
    if (swipedIds.has(pid)) return false;

    if (
      filters.interests.length > 0 &&
      !p.interests.some((i) => filters.interests.includes(i))
    )
      return false;
    if (filters.ageRange) {
      const age = calculateAge(p.birthday);
      if (age < filters.ageRange[0] || age > filters.ageRange[1]) return false;
    }
    if (filters.radiusKm !== null) {
      const dist = dp.distanceKm;
      if (dist != null && dist > filters.radiusKm) return false;
    }
    return true;
  });

  useEffect(() => {
    // Reset local swipe state when filters change to get a fresh list
    setSwipedIds(new Set());
    setExitDirection(null);
    setDragOffset(0);
    setExpandedPrincipal(null);
  }, [filters]);

  const activeFilterCount =
    (filters.interests.length > 0 ? 1 : 0) +
    (filters.ageRange !== null ? 1 : 0) +
    (filters.radiusKm !== null ? 1 : 0);

  const effectiveDragOffset = showTutorial ? tutorialDragOffset : dragOffset;
  const currentProfile = profiles[0] ?? null;
  const nextProfile = profiles[1] ?? null;
  const currentPrincipal = currentProfile
    ? String(currentProfile.profile.principal)
    : null;
  const { data: compatibilityScore, isLoading: isLoadingScore } =
    useCompatibilityScore(currentPrincipal);

  const handleSwipe = (action: "like" | "pass") => {
    if (!currentProfile || exitDirection) return;
    const dir = action === "like" ? "right" : "left";
    const profileSnapshot = currentProfile;
    const principalStr = String(profileSnapshot.profile.principal);

    // Start exit animation
    setExitDirection(dir);
    setExpandedPrincipal(null);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });

    // ADVANCE: Snap to next card after a short delay
    setTimeout(() => {
      setSwipedIds((prev) => {
        const next = new Set(prev);
        next.add(principalStr);
        return next;
      });
      setExitDirection(null);
      setDragOffset(0);
      setDragOffsetY(0);
    }, 250);

    // Fire and forget mutation (async)
    swipe(
      { target: principalStr, action },
      {
        onSuccess: (isMatch) => {
          if (isMatch) {
            setMatchedProfile(profileSnapshot);
          }
        },
        onError: (err) => {
          console.error("Swipe failed:", err);
        },
      },
    );
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (exitDirection || showTutorial) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setDragOffset(e.clientX - startXRef.current);
    setDragOffsetY(e.clientY - startYRef.current);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > SWIPE_THRESHOLD) handleSwipe("like");
    else if (dragOffset < -SWIPE_THRESHOLD) handleSwipe("pass");
    else {
      setDragOffset(0);
      setDragOffsetY(0);
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (!currentProfile || exitDirection) return;
      if (e.key === "ArrowLeft") handleSwipe("pass");
      else if (e.key === "ArrowRight") handleSwipe("like");
      else if (e.key.toLowerCase() === "i")
        setExpandedPrincipal((prev) => (prev ? null : currentPrincipal));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentProfile, exitDirection, currentPrincipal]);

  const cityLabel = myProfile?.location?.city ?? "Everywhere";
  const isExpanded = !!currentProfile && expandedPrincipal === currentPrincipal;

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-background">
      <div className="relative h-14 shrink-0 z-50 bg-background">
        <div
          className={cn(
            "flex items-center px-4 h-full gap-2 animate-fade-in",
            isExpanded && "max-lg:hidden",
          )}
        >
          <div className="w-10" />
          <button
            onClick={onOpenLocationPicker}
            className="flex-1 flex items-center justify-center"
          >
            <span className="flex items-center gap-1.5 bg-muted hover:bg-hover transition-colors rounded-full px-4 py-2 text-sm font-semibold">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate max-w-[140px]">{cityLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            </span>
          </button>
          <button
            onClick={() => onShowFilters(true)}
            className={cn(
              "relative w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              activeFilterCount > 0
                ? "bg-primary/10 text-primary"
                : "text-foreground/40 hover:bg-hover",
            )}
          >
            <SlidersHorizontal className="w-4.5 h-4.5" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-black flex items-center justify-center shadow-sm">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
        {isExpanded && currentProfile && (
          <div className="lg:hidden absolute inset-0 z-[60] animate-in slide-in-from-top duration-300">
            <FullProfileDetail
              profile={currentProfile as any}
              onClose={() => {
                setExpandedPrincipal(null);
                scrollContainerRef.current?.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
              identityOnly
            />
          </div>
        )}
      </div>

      {!isLoading && currentProfile && (
        <>
          <div
            className="fixed left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-[100] pointer-events-none lg:absolute"
            style={{
              opacity:
                exitDirection === "left"
                  ? 1
                  : Math.max(0, -effectiveDragOffset / SWIPE_THRESHOLD),
              transform: `scale(${0.8 + Math.min(1, Math.max(0, -effectiveDragOffset / SWIPE_THRESHOLD)) * 0.4}) translateX(${Math.min(80, Math.max(0, -effectiveDragOffset / 2))}px)`,
            }}
          >
            <div className="w-24 h-24 rounded-full bg-card flex items-center justify-center shadow-2xl border-4 border-destructive/20 ml-12">
              <X className="w-12 h-12 text-destructive" strokeWidth={3} />
            </div>
          </div>
          <div
            className="fixed right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-[100] pointer-events-none lg:absolute"
            style={{
              opacity:
                exitDirection === "right"
                  ? 1
                  : Math.max(0, effectiveDragOffset / SWIPE_THRESHOLD),
              transform: `scale(${0.8 + Math.min(1, Math.max(0, effectiveDragOffset / SWIPE_THRESHOLD)) * 0.4}) translateX(-${Math.min(80, Math.max(0, effectiveDragOffset / 2))}px)`,
            }}
          >
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center shadow-2xl border-4 border-white/20 mr-12">
              <Heart className="w-12 h-12 text-white" fill="currentColor" />
            </div>
          </div>
        </>
      )}

      <div
        ref={scrollContainerRef}
        className={cn(
          "flex-1 relative overflow-x-hidden transition-all",
          isExpanded ? "overflow-y-visible" : "overflow-y-hidden",
          isDragging && "overflow-visible z-50",
        )}
      >
        <div
          className={cn(
            "min-h-full flex flex-col items-center transition-all max-w-full mx-auto",
            isExpanded && currentProfile
              ? "lg:flex-row lg:items-start lg:gap-8 lg:max-w-[1000px] lg:px-8 py-4"
              : "px-0 pt-0 pb-4 h-full justify-center",
          )}
        >
          <div
            className={cn(
              "relative aspect-[9/14] transition-all shrink-0",
              "w-[99vw] max-w-[420px]",
              isExpanded
                ? "mb-6 lg:mb-0 lg:sticky lg:top-4"
                : "h-full lg:h-auto max-h-[85vh] lg:max-h-[calc(100vh-180px)]",
            )}
          >
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : currentProfile ? (
              <div className="relative w-full h-full">
                {nextProfile && !isExpanded && (
                  <ProfileCard
                    key={String(nextProfile.profile.principal) + "-next"}
                    profile={nextProfile as any}
                    myInterests={myProfile?.interests ?? []}
                    isBackground
                  />
                )}
                <ProfileCard
                  key={currentPrincipal}
                  profile={currentProfile as any}
                  myInterests={myProfile?.interests ?? []}
                  dragOffset={effectiveDragOffset}
                  dragOffsetY={showTutorial ? 0 : dragOffsetY}
                  isDragging={showTutorial ? false : isDragging}
                  exitDirection={exitDirection}
                  hideOverlay={isExpanded}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onViewProfile={() =>
                    setExpandedPrincipal(
                      String(currentProfile.profile.principal),
                    )
                  }
                  onLike={() => handleSwipe("like")}
                  onPass={() => handleSwipe("pass")}
                />
                {showTutorial && (
                  <div
                    className="absolute inset-0 z-[70] cursor-pointer select-none bg-transparent"
                    onClick={advanceTutorial}
                  >
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {[0, 1].map((i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-1.5 rounded-full transition-all",
                            tutorialStep === i
                              ? "w-6 bg-white shadow-sm"
                              : "w-1.5 bg-white/40",
                          )}
                        />
                      ))}
                    </div>
                    <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-max px-5 py-3 rounded-2xl bg-black/50 backdrop-blur-sm text-center pointer-events-none">
                      <p className="text-white font-bold text-[15px]">
                        {tutorialStep === 0
                          ? "← Swipe left to pass"
                          : "Swipe right to like →"}
                      </p>
                      <p className="text-white/60 text-xs mt-0.5">
                        {tutorialStep === 0
                          ? "Tap to continue"
                          : "Tap to begin"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-8">
                <SlidersHorizontal className="w-8 h-8 text-muted-foreground/50" />
                <p className="font-semibold text-muted-foreground">
                  No more profiles found
                </p>
              </div>
            )}
          </div>
          {isExpanded && currentProfile && (
            <div className="w-full lg:flex-1 animate-in slide-in-from-bottom lg:slide-in-from-right px-1 lg:px-0 mt-0 lg:max-w-none">
              <FullProfileDetail
                profile={currentProfile as any}
                compatibilityScore={compatibilityScore}
                onClose={() => {
                  setExpandedPrincipal(null);
                  scrollContainerRef.current?.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }}
                onLike={() => handleSwipe("like")}
                inline
                detailsOnly
              />
            </div>
          )}
        </div>
      </div>

      {!isLoading && currentProfile && !isExpanded && (
        <div className="hidden lg:flex items-center justify-center gap-5 pb-8 pt-2 shrink-0">
          <button
            onClick={() => handleSwipe("pass")}
            className="w-16 h-16 rounded-full bg-card border-2 border-destructive flex items-center justify-center shadow-lg hover:bg-destructive/5 hover:border-destructive active:scale-95 transition-all"
          >
            <X className="w-7 h-7 text-destructive" strokeWidth={2.5} />
          </button>
          <button
            onClick={() =>
              setExpandedPrincipal(String(currentProfile.profile.principal))
            }
            className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center shadow-md hover:bg-hover hover:border-foreground/20 transition-all"
          >
            <Info className="w-4.5 h-4.5 text-foreground/50" />
          </button>
          <button
            onClick={() => handleSwipe("like")}
            className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-primary/40 active:scale-95 transition-all"
          >
            <Heart className="text-white w-7 h-7" fill="currentColor" />
          </button>
        </div>
      )}

      {matchedProfile && (
        <MatchOverlay
          me={myProfile ?? null}
          them={matchedProfile.profile as any}
          onClose={() => setMatchedProfile(null)}
          onOpenChat={onOpenChat}
        />
      )}
      {showFilterRadar && myProfile?.location && (
        <RadarScreen
          location={myProfile.location}
          radius={filterRadarRadius}
          onFinish={() => setShowFilterRadar(false)}
          scanningText="Applying your filters..."
          foundText="Filters applied!"
        />
      )}
      <SwipeFilterSheet
        open={showFilters}
        onClose={() => onShowFilters(false)}
        filters={filters}
        onApply={(f) => {
          setFilters(f);
          if (myProfile?.location) {
            setFilterRadarRadius(
              f.radiusKm ?? Number(preferences?.radiusKm ?? 50),
            );
            setShowFilterRadar(true);
          }
        }}
        savedAgeMin={18}
        savedAgeMax={99}
        savedRadiusKm={Number(preferences?.radiusKm ?? 50)}
        hasLocation={!!myProfile?.location}
      />
    </div>
  );
}
