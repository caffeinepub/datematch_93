import { useState, useEffect } from "react";
import { Compass, User, ChevronLeft, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useMyProfile,
  useConversations,
  useSetProfile,
  usePreferences,
  useGetLikesReceived,
} from "../hooks/useQueries";
import { MatchListItem } from "./chat/MatchListItem";
import {
  EditProfilePage,
  type EditPreviewProfile,
} from "./profile/EditProfilePage";
import { ProfilePage } from "./profile/ProfilePage";
import { QuizView } from "./quiz/QuizView";
import { SettingsPage } from "./settings/SettingsPage";
import { BlockedList } from "./settings/BlockedList";
import { LocationPicker } from "./shared/LocationPicker";
import { RadarScreen } from "./RadarScreen";

type Tab = "swipe" | "likes" | "matches" | "profile";

interface DesktopSidebarProps {
  activeTab: Tab;
  activeChatPrincipal: string | null;
  showEditProfile?: boolean;
  showQuiz?: boolean;
  showSettings?: boolean;
  onBackFromEdit?: () => void;
  onBackFromQuiz?: () => void;
  onBackFromSettings?: () => void;
  onOpenQuiz: () => void;
  onOpenSettings: () => void;
  onEditProfile: () => void;
  onOpenBlockedList: () => void;
  onOpenLocationPicker: () => void;
  onClickSwipe: () => void;
  onClickLikes: () => void;
  onClickProfile: () => void;
  onSelectConversation: (principal: string) => void;
  onViewProfile: (principal: string) => void;
  onPreviewChange?: (preview: EditPreviewProfile) => void;
}

export function DesktopSidebar({
  activeTab,
  activeChatPrincipal,
  showEditProfile,
  showQuiz,
  showSettings,
  onBackFromEdit,
  onBackFromQuiz,
  onBackFromSettings,
  onOpenQuiz,
  onOpenSettings,
  onEditProfile,
  onOpenBlockedList,
  onOpenLocationPicker,
  onClickSwipe,
  onClickLikes,
  onClickProfile,
  onSelectConversation,
  onViewProfile,
  onPreviewChange,
}: DesktopSidebarProps) {
  const { data: myProfile } = useMyProfile();
  const { data: conversations = [] } = useConversations();
  const { mutate: setProfile } = useSetProfile();
  const { data: preferences } = usePreferences();
  const { data: likesReceived = [] } = useGetLikesReceived();
  const pendingLikesCount = likesReceived.filter((e) => !e.isMatched).length;

  const [showSidebarLocation, setShowSidebarLocation] = useState(false);
  const [showSidebarBlockedList, setShowSidebarBlockedList] = useState(false);
  const [showSidebarRadar, setShowSidebarRadar] = useState(false);
  const [sidebarRadarLoc, setSidebarRadarLoc] = useState<{
    lat: number;
    lng: number;
    city: string;
  } | null>(null);
  useEffect(() => {
    if (!showSettings) {
      setShowSidebarLocation(false);
      setShowSidebarBlockedList(false);
    }
  }, [showSettings]);

  const photoUrl = myProfile?.photos?.[0]?.getDirectURL() ?? null;
  const isSwiping = activeTab === "swipe" && !activeChatPrincipal;

  const handleSidebarSaveLocation = (loc: any) => {
    if (!myProfile) return;
    setProfile(
      {
        name: myProfile.name,
        birthday: myProfile.birthday,
        bio: myProfile.bio,
        gender: myProfile.gender ?? "",
        genderPreference: (myProfile as any).genderPreference ?? [],
        interests: myProfile.interests,
        location: loc,
        icebreakers: myProfile.icebreakers ?? [],
        photos: (myProfile.photos ?? []) as any,
      },
      {
        onSuccess: () => {
          setShowSidebarLocation(false);
          setSidebarRadarLoc(loc);
          setShowSidebarRadar(true);
        },
      },
    );
  };

  const renderContent = () => {
    if (showEditProfile && onBackFromEdit) {
      return (
        <EditProfilePage
          onBack={onBackFromEdit}
          onPreviewChange={onPreviewChange}
        />
      );
    }
    if (showQuiz && onBackFromQuiz) {
      return <QuizView onBack={onBackFromQuiz} />;
    }
    if (showSettings && onBackFromSettings) {
      if (showSidebarBlockedList) {
        return <BlockedList onBack={() => setShowSidebarBlockedList(false)} />;
      }
      if (showSidebarLocation) {
        return (
          <LocationPicker
            initialLocation={myProfile?.location}
            onSave={handleSidebarSaveLocation}
            onBack={() => setShowSidebarLocation(false)}
          />
        );
      }
      return (
        <SettingsPage
          onBack={onBackFromSettings}
          onOpenBlockedList={() => setShowSidebarBlockedList(true)}
          onOpenLocationPicker={() => setShowSidebarLocation(true)}
        />
      );
    }
    if (activeTab === "profile") {
      return (
        <div className="flex flex-col h-full">
          {/* Gradient header with back button */}
          <div
            className="px-5 py-4 flex items-center gap-3 shrink-0"
            style={{
              background: "linear-gradient(135deg, #E83C91 0%, #FF8FB7 100%)",
            }}
          >
            <button
              onClick={onClickSwipe}
              className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0 ring-2 ring-white/30 hover:bg-white/30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <span className="font-bold text-white text-base truncate font-serif italic">
              {myProfile?.name ?? "My Profile"}
            </span>
          </div>

          <div className="flex-1 overflow-hidden">
            <ProfilePage
              onOpenQuiz={onOpenQuiz}
              onOpenSettings={onOpenSettings}
              onEditProfile={onEditProfile}
              onOpenPreview={() => {}}
            />
          </div>
        </div>
      );
    }

    return (
      <>
        {/* Gradient header */}
        <div
          className="px-5 py-4 flex items-center justify-between shrink-0"
          style={{
            background: "linear-gradient(135deg, #E83C91 0%, #FF8FB7 100%)",
          }}
        >
          <button
            onClick={onClickProfile}
            className="flex items-center gap-3 min-w-0 text-left"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden bg-white/20 flex items-center justify-center shrink-0 ring-2 ring-white/30">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={myProfile?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>
            <span className="font-bold text-white text-base truncate font-serif italic">
              {myProfile?.name ?? "My Profile"}
            </span>
          </button>
        </div>

        {/* Discover New Matches */}
        <button
          onClick={onClickSwipe}
          className={cn(
            "flex items-center gap-4 px-5 py-4 border-b border-border hover:bg-hover transition-colors text-left shrink-0",
            isSwiping && "bg-muted/30",
          )}
        >
          <div
            className={cn(
              "rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
              isSwiping
                ? "border-primary bg-primary/10"
                : "border-border bg-transparent",
            )}
            style={{ width: 52, height: 52 }}
          >
            <Compass
              className={cn(
                "w-6 h-6 transition-colors",
                isSwiping ? "text-primary" : "text-muted-foreground",
              )}
            />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">
              Swipe & Match
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Start swiping to connect with new people!
            </p>
          </div>
        </button>

        {/* Likes */}
        <button
          onClick={onClickLikes}
          className={cn(
            "flex items-center gap-4 px-5 py-4 border-b border-border hover:bg-hover transition-colors text-left shrink-0",
            activeTab === "likes" && "bg-muted/30",
          )}
        >
          <div
            className={cn(
              "rounded-full border-2 flex items-center justify-center shrink-0 transition-colors relative",
              activeTab === "likes"
                ? "border-primary bg-primary/10"
                : "border-border bg-transparent",
            )}
            style={{ width: 52, height: 52 }}
          >
            <Heart
              className={cn(
                "w-6 h-6 transition-colors",
                activeTab === "likes"
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
              fill={activeTab === "likes" ? "currentColor" : "none"}
            />
            {pendingLikesCount > 0 && activeTab !== "likes" && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {pendingLikesCount > 9 ? "9+" : pendingLikesCount}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">Likes</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pendingLikesCount > 0
                ? `${pendingLikesCount} ${pendingLikesCount === 1 ? "person" : "people"} liked you`
                : "See who liked your profile"}
            </p>
          </div>
        </button>

        {/* Messages section */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-3">
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest font-sans">
              Messages
            </h3>
          </div>

          {conversations.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <p className="text-sm text-muted-foreground">No matches yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start swiping to find your first match
              </p>
            </div>
          ) : (
            conversations.map((convo) => {
              const principal = String(convo.withPrincipal);
              return (
                <div
                  key={principal}
                  className={cn(
                    activeChatPrincipal === principal && "bg-muted/40",
                  )}
                >
                  <MatchListItem
                    convo={convo}
                    onSelect={() => onSelectConversation(principal)}
                    onViewProfile={() => onViewProfile(principal)}
                  />
                </div>
              );
            })
          )}
        </div>
      </>
    );
  };

  return (
    <aside className="hidden lg:flex flex-col w-[430px] border-r border-border shrink-0 bg-background overflow-hidden relative">
      {renderContent()}
      {showSidebarRadar && sidebarRadarLoc && (
        <RadarScreen
          location={sidebarRadarLoc}
          radius={Number(preferences?.radiusKm ?? 50)}
          onFinish={() => {
            setShowSidebarRadar(false);
            setSidebarRadarLoc(null);
          }}
        />
      )}
    </aside>
  );
}
