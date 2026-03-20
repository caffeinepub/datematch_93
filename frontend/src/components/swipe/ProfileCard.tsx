import { useState } from "react";
import {
  MapPin,
  User,
  Heart,
  BadgeCheck,
  ChevronUp,
  Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateAge, kmToMiles } from "../../utils/formatting";
import { CompatibilityBadge } from "../quiz/CompatibilityBadge";

export interface DiscoveryProfile {
  profile: {
    principal: any;
    name: string;
    birthday: bigint;
    bio: string;
    gender: string;
    genderPreference: string[];
    interests: string[];
    location: { lat: number; lng: number; city: string } | null;
    photos: { getDirectURL(): string }[];
    isVerified: boolean;
    icebreakers: { prompt: string; answer: string }[];
  };
  distanceKm?: number | null;
  likedMe: boolean;
}

// Configuration for which field to show on each image index
const FIELD_ORDER = ["tags", "bio", "distance", "icebreaker"];

interface ProfileCardProps {
  profile: DiscoveryProfile;
  myInterests?: string[];
  dragOffset?: number;
  dragOffsetY?: number;
  isDragging?: boolean;
  exitDirection?: "left" | "right" | null;
  isBackground?: boolean;
  hideOverlay?: boolean;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: () => void;
  onPointerCancel?: () => void;
  onViewProfile?: () => void;
  onLike?: () => void;
  onPass?: () => void;
}

export function ProfileCard({
  profile,
  myInterests = [],
  dragOffset = 0,
  dragOffsetY = 0,
  isDragging = false,
  exitDirection = null,
  isBackground = false,
  hideOverlay = false,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onViewProfile,
  onLike,
}: ProfileCardProps) {
  const { profile: user, distanceKm, likedMe } = profile;
  const [photoIndex, setPhotoIndex] = useState(0);

  const photos = user.photos ?? [];
  const photoUrl = photos[photoIndex]?.getDirectURL() ?? null;
  const age = calculateAge(user.birthday);

  // Capitalize first letter of name
  const displayName = user.name.charAt(0).toUpperCase() + user.name.slice(1);

  const getCardTransform = () => {
    if (isBackground) return undefined;

    if (exitDirection === "left") {
      return "translateX(-150%) rotate(-30deg)";
    }
    if (exitDirection === "right") {
      return "translateX(150%) rotate(30deg)";
    }

    return `translateX(${dragOffset}px) translateY(${dragOffsetY}px) rotate(${dragOffset * 0.04}deg)`;
  };

  const cardTransition = isDragging
    ? "none"
    : "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease-out, filter 0.3s ease-out";

  // Interests capped for the overlay
  const displayedInterests = user.interests.slice(0, 5);

  const handleTap = (e: React.MouseEvent | React.PointerEvent) => {
    if (isDragging || dragOffset !== 0 || dragOffsetY !== 0) return;
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ("clientX" in e ? e.clientX : (e as any).pageX) - rect.left;

    // Left 50%: Previous, Right 50%: Next
    if (x < rect.width / 2) {
      setPhotoIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else {
      setPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : prev));
    }
  };

  const handleLike = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    onLike?.();
  };

  const handleOpenInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewProfile?.();
  };

  // Determine what field to show in the overlay based on current photo index
  const activeField = FIELD_ORDER[photoIndex] || "bio";

  return (
    <div
      className={cn(
        "absolute inset-0 rounded-[40px] overflow-hidden bg-card shadow-xl select-none flex flex-col",
        "lg:relative lg:inset-auto lg:w-full lg:max-w-[420px] lg:aspect-[9/14] lg:mx-auto lg:shrink-0",
        isBackground && "pointer-events-none lg:absolute lg:inset-0",
        !isBackground &&
          !exitDirection &&
          !hideOverlay &&
          "cursor-grab active:cursor-grabbing",
        !isBackground && !exitDirection && hideOverlay && "cursor-pointer",
      )}
      style={{
        transform: isBackground ? "scale(1)" : getCardTransform(),
        transition: cardTransition,
        opacity: exitDirection ? 0 : isBackground ? 0.8 : 1,
        filter: "none",
        touchAction: hideOverlay || isBackground ? "pan-y" : "none",
        zIndex: exitDirection ? 100 : isBackground ? 5 : 10,
      }}
      onPointerDown={isBackground ? undefined : onPointerDown}
      onPointerMove={isBackground ? undefined : onPointerMove}
      onPointerUp={isBackground ? undefined : onPointerUp}
      onPointerCancel={isBackground ? undefined : onPointerCancel}
    >
      {/* Navigation Layer - handles taps without blocking buttons */}
      {!isBackground && !exitDirection && (
        <div
          className="absolute inset-0 z-20 cursor-pointer"
          onClick={handleTap}
        />
      )}

      {/* Photo */}
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={user.name}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
          <User className="w-20 h-20 text-muted-foreground/40" />
        </div>
      )}

      {/* Segmented progress lines at the top */}
      {photos.length > 1 && (
        <div className="absolute top-3 inset-x-3 flex gap-1 z-30 px-1">
          {photos.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-all",
                i === photoIndex ? "bg-white shadow-sm" : "bg-white/30",
              )}
            />
          ))}
        </div>
      )}

      {/* Liked You badge — top right, angled stamp
        {!isBackground && likedMe && (
          <div
            className="absolute top-6 right-4 z-30 animate-fade-in"
            style={{ transform: "rotate(15deg)", transformOrigin: "center" }}
          >
            <div className="flex flex-col items-center justify-center w-[72px] h-[72px] rounded-full bg-primary shadow-xl border-[3px] border-white/25">
              <Heart className="w-7 h-7 fill-white text-white" />
              <span className="text-[8px] font-black uppercase tracking-[0.12em] text-white leading-none mt-0.5">
                liked you
              </span>
            </div>
          </div>
        )} */}

      {/* Overlays - hidden when expanded */}
      {!hideOverlay && (
        <>
          {/* Top Gradient - lighter than bottom */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent pointer-events-none z-10" />

          {/* Bottom Gradient - heavy for text readability */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

          <div className="flex-1" />

          {/* Bottom Identity Overlay */}
          <div className="relative z-30 px-5 pb-6 space-y-3">
            <div>
              {/* Identity Line + Info Button (same row) */}
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-white text-3xl font-bold tracking-tight leading-none drop-shadow-lg font-serif italic">
                      {displayName}
                    </h2>
                    <span className="text-white text-2xl font-light opacity-90 drop-shadow-lg font-sans not-italic">
                      {age}
                    </span>
                  </div>
                  {user.isVerified && (
                    <BadgeCheck className="w-5 h-5 fill-primary text-white drop-shadow-md shrink-0" />
                  )}
                </div>

                {/* Info Button - level with name/age */}
                {!isBackground && (
                  <button
                    onClick={handleOpenInfo}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="relative z-40 w-10 h-10 rounded-full border-2 border-white/60 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90 shadow-lg shrink-0"
                  >
                    <ChevronUp className="w-6 h-6 text-white stroke-[2.5px]" />
                  </button>
                )}
              </div>

              {/* Dynamic Content Area (based on FIELD_ORDER) */}
              <div className="min-h-[24px]">
                {activeField === "tags" && displayedInterests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 animate-fade-in">
                    {displayedInterests.map((interest) => (
                      <span
                        key={interest}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-black/40 text-white/90 border border-white/10 backdrop-blur-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                )}

                {activeField === "bio" && user.bio && (
                  <p className="text-white text-sm font-medium leading-snug line-clamp-2 drop-shadow-md animate-fade-in">
                    {user.bio}
                  </p>
                )}

                {activeField === "distance" && (
                  <div className="flex items-center gap-1.5 text-white/90 font-bold text-sm animate-fade-in">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>
                      {distanceKm != null
                        ? (() => {
                            const mi = kmToMiles(distanceKm);
                            return mi < 1
                              ? "Less than 1 mi away"
                              : `${Math.round(mi)} mi away`;
                          })()
                        : user.location?.city || "Nearby"}
                    </span>
                  </div>
                )}

                {activeField === "icebreaker" &&
                  user.icebreakers.length > 0 && (
                    <div className="animate-fade-in max-w-[90%]">
                      <p className="text-white text-sm font-semibold leading-snug drop-shadow-md">
                        <span className="text-white/60 mr-1.5 italic">
                          "{user.icebreakers[0].prompt}"
                        </span>
                        {user.icebreakers[0].answer}
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
