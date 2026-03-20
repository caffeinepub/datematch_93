import { useState } from "react";
import { Compass, Heart, Flame, User, ArrowLeft, Pencil } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  useMyProfile,
  useConversations,
  usePreferences,
  useSetProfile,
  useGetLikesReceived,
} from "../hooks/useQueries";
import { DesktopSidebar } from "./DesktopSidebar";
import { SwipeStack } from "./swipe/SwipeStack";
import { ProfileCard } from "./swipe/ProfileCard";
import { FullProfileDetail } from "./swipe/FullProfileDetail";
import { MatchesList } from "./chat/MatchesList";
import { LikesList } from "./likes/LikesList";
import { ProfilePage } from "./profile/ProfilePage";
import {
  EditProfilePage,
  type EditPreviewProfile,
} from "./profile/EditProfilePage";
import { ChatView } from "./chat/ChatView";
import { QuizView } from "./quiz/QuizView";
import { SettingsPage } from "./settings/SettingsPage";
import { BlockedList } from "./settings/BlockedList";
import { ProfileView } from "./profile/ProfileView";
import { LocationPicker } from "./shared/LocationPicker";
import { RadarScreen } from "./RadarScreen";
import { useNotifications } from "../hooks/useNotifications";

type Tab = "swipe" | "likes" | "matches" | "profile";

const TABS = [
  { id: "swipe" as Tab, label: "Swipe", Icon: Compass },
  { id: "likes" as Tab, label: "Likes", Icon: Heart },
  { id: "matches" as Tab, label: "Matches", Icon: Flame },
  { id: "profile" as Tab, label: "Profile", Icon: User },
];

export function MainApp() {
  const isDesktop = !useIsMobile(1024);

  const [activeTab, setActiveTab] = useState<Tab>("swipe");
  const [chatPrincipal, setChatPrincipal] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBlockedList, setShowBlockedList] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [viewProfilePrincipal, setViewProfilePrincipal] = useState<
    string | null
  >(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [radarData, setRadarData] = useState<{
    location: any;
    radius: number;
  } | null>(null);
  const [showSwipeFilter, setShowSwipeFilter] = useState(false);
  const [showSelfDetail, setShowSelfDetail] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [draftPreview, setDraftPreview] = useState<EditPreviewProfile | null>(
    null,
  );

  useNotifications(chatPrincipal);

  const { data: myProfile } = useMyProfile();
  const { data: conversations = [] } = useConversations();
  const { data: preferences } = usePreferences();
  const { mutate: setProfile } = useSetProfile();
  const { data: likesReceived = [] } = useGetLikesReceived();
  const pendingLikesCount = likesReceived.filter((e) => !e.isMatched).length;

  const myPrincipal = myProfile ? String(myProfile.principal) : "";

  const chatPartnerProfile = chatPrincipal
    ? (conversations.find((c) => String(c.withPrincipal) === chatPrincipal)
        ?.profile ?? null)
    : null;

  const handleSaveLocation = (loc: any) => {
    if (!myProfile) return;
    setProfile(
      {
        name: myProfile.name,
        birthday: myProfile.birthday,
        bio: myProfile.bio,
        gender: myProfile.gender,
        genderPreference: (myProfile as any).genderPreference ?? [],
        interests: myProfile.interests,
        location: loc,
        icebreakers: myProfile.icebreakers,
        photos: myProfile.photos ?? [],
      },
      {
        onSuccess: () => {
          setShowLocationPicker(false);
          setRadarData({
            location: loc,
            radius: Number(preferences?.radiusKm ?? 50),
          });
        },
      },
    );
  };

  // Navigate to a tab and clear all overlays (used by sidebar + mobile tabs)
  const navigateTo = (id: Tab) => {
    setActiveTab(id);
    setChatPrincipal(null);
    setShowQuiz(false);
    setShowSettings(false);
    setShowBlockedList(false);
    setShowEditProfile(false);
    setShowLocationPicker(false);
    setViewProfilePrincipal(null);
    setRadarData(null);
    setShowSelfDetail(false);
    setShowMobilePreview(false);
  };

  // Which overlay is currently active (order = priority)
  const overlay = radarData
    ? "radar"
    : showBlockedList
      ? "blocked"
      : showLocationPicker
        ? "location"
        : viewProfilePrincipal
          ? "profileView"
          : showEditProfile && !isDesktop
            ? "editProfile"
            : showMobilePreview && !isDesktop
              ? "mobilePreview"
              : showQuiz
                ? "quiz"
                : showSettings
                  ? "settings"
                  : chatPrincipal
                    ? "chat"
                    : null;

  const hideTabBar = overlay !== null || showSwipeFilter;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop left sidebar (Tinder-style) */}
      <DesktopSidebar
        activeTab={activeTab}
        activeChatPrincipal={chatPrincipal}
        showEditProfile={showEditProfile}
        showQuiz={showQuiz}
        showSettings={showSettings}
        onBackFromEdit={() => {
          setShowEditProfile(false);
          setDraftPreview(null);
        }}
        onBackFromQuiz={() => setShowQuiz(false)}
        onBackFromSettings={() => setShowSettings(false)}
        onOpenQuiz={() => setShowQuiz(true)}
        onOpenSettings={() => setShowSettings(true)}
        onEditProfile={() => setShowEditProfile(true)}
        onOpenBlockedList={() => setShowBlockedList(true)}
        onOpenLocationPicker={() => setShowLocationPicker(true)}
        onClickSwipe={() => navigateTo("swipe")}
        onClickLikes={() => navigateTo("likes")}
        onClickProfile={() => navigateTo("profile")}
        onSelectConversation={(p) => setChatPrincipal(p)}
        onViewProfile={(p) => setViewProfilePrincipal(p)}
        onPreviewChange={setDraftPreview}
      />

      {/* Content column — flex-1 on desktop fills remaining space */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Overlay / tab content */}
        <div className="flex-1 relative overflow-hidden">
          {overlay === "radar" ? (
            <RadarScreen
              location={radarData!.location}
              radius={radarData!.radius}
              onFinish={() => {
                setRadarData(null);
                setActiveTab("swipe");
              }}
            />
          ) : overlay === "blocked" ? (
            <BlockedList onBack={() => setShowBlockedList(false)} />
          ) : overlay === "location" ? (
            <div className="h-full flex flex-col overflow-hidden lg:max-w-[640px] lg:mx-auto">
              <LocationPicker
                initialLocation={myProfile?.location}
                onSave={handleSaveLocation}
                onBack={() => setShowLocationPicker(false)}
              />
            </div>
          ) : overlay === "profileView" ? (
            <ProfileView
              principal={viewProfilePrincipal!}
              onBack={() => setViewProfilePrincipal(null)}
            />
          ) : overlay === "editProfile" ? (
            <EditProfilePage onBack={() => setShowEditProfile(false)} />
          ) : overlay === "mobilePreview" ? (
            <div className="h-full flex flex-col bg-background overflow-hidden animate-in slide-in-from-right duration-300">
              <div className="shrink-0 flex items-center gap-3 px-4 py-4 border-b border-border bg-background">
                <button
                  onClick={() => setShowMobilePreview(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-hover transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-bold">Preview My Profile</h1>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col px-4 pt-4">
                  <div
                    className={cn(
                      "relative aspect-[9/14] w-full shrink-0 transition-all duration-300",
                    )}
                  >
                    <ProfileCard
                      profile={{
                        profile: {
                          principal: myProfile!.principal,
                          name: myProfile!.name,
                          birthday: myProfile!.birthday,
                          bio: myProfile!.bio,
                          gender: myProfile!.gender,
                          genderPreference:
                            (myProfile as any).genderPreference ?? [],
                          interests: myProfile!.interests,
                          location: myProfile!.location ?? null,
                          photos: (myProfile!.photos ?? []) as {
                            getDirectURL(): string;
                          }[],
                          isVerified: (myProfile as any).isVerified ?? false,
                          icebreakers: myProfile!.icebreakers ?? [],
                        },
                        distanceKm: null,
                        likedMe: false,
                      }}
                      myInterests={myProfile?.interests ?? []}
                      hideOverlay={showSelfDetail}
                      onViewProfile={() => setShowSelfDetail(!showSelfDetail)}
                    />
                  </div>
                  {showSelfDetail && (
                    <div className="w-full pb-8 mt-2 animate-in slide-in-from-bottom">
                      <FullProfileDetail
                        profile={{
                          profile: {
                            principal: myProfile!.principal,
                            name: myProfile!.name,
                            birthday: myProfile!.birthday,
                            bio: myProfile!.bio,
                            gender: myProfile!.gender,
                            genderPreference:
                              (myProfile as any).genderPreference ?? [],
                            interests: myProfile!.interests,
                            location: myProfile!.location ?? null,
                            photos: (myProfile!.photos ?? []) as {
                              getDirectURL(): string;
                            }[],
                            isVerified: (myProfile as any).isVerified ?? false,
                            icebreakers: myProfile!.icebreakers ?? [],
                          },
                          distanceKm: null,
                          likedMe: false,
                        }}
                        onClose={() => setShowSelfDetail(false)}
                        inline
                        detailsOnly
                        hideBlock
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : overlay === "quiz" && !isDesktop ? (
            <QuizView onBack={() => setShowQuiz(false)} />
          ) : overlay === "settings" && !isDesktop ? (
            <SettingsPage
              onBack={() => setShowSettings(false)}
              onOpenBlockedList={() => setShowBlockedList(true)}
              onOpenLocationPicker={() => setShowLocationPicker(true)}
            />
          ) : overlay === "chat" ? (
            <ChatView
              partnerPrincipal={chatPrincipal!}
              partnerProfile={chatPartnerProfile}
              myPrincipal={myPrincipal}
              onBack={() => setChatPrincipal(null)}
              onViewProfile={() => setViewProfilePrincipal(chatPrincipal!)}
            />
          ) : (
            <>
              {/* On desktop, show SwipeStack if on swipe tab; show self-preview card if on profile tab */}
              <div
                className={cn(
                  "absolute inset-0",
                  (activeTab === "matches" || activeTab === "likes") &&
                    "hidden",
                  activeTab === "profile" && !isDesktop && "hidden",
                )}
              >
                <div
                  className={cn(
                    "w-full h-full",
                    (activeTab === "matches" || activeTab === "likes") &&
                      "lg:hidden",
                  )}
                >
                  {activeTab === "profile" && isDesktop && myProfile ? (
                    (() => {
                      // Build preview data: use draft values when edit panel is open, saved values otherwise
                      const previewName =
                        showEditProfile && draftPreview
                          ? draftPreview.name
                          : myProfile.name;
                      const previewBio =
                        showEditProfile && draftPreview
                          ? draftPreview.bio
                          : myProfile.bio;
                      const previewBirthday =
                        showEditProfile && draftPreview
                          ? draftPreview.birthday
                          : myProfile.birthday;
                      const previewInterests =
                        showEditProfile && draftPreview
                          ? draftPreview.interests
                          : myProfile.interests;
                      const previewGenderPref =
                        showEditProfile && draftPreview
                          ? draftPreview.genderPreference
                          : ((myProfile as any).genderPreference ?? []);
                      const previewIcebreakers =
                        showEditProfile && draftPreview
                          ? draftPreview.icebreakers
                          : (myProfile.icebreakers ?? []);
                      const previewPhotos =
                        showEditProfile && draftPreview
                          ? draftPreview.photoUrls.map((url) => ({
                              getDirectURL: () => url,
                            }))
                          : ((myProfile.photos ?? []) as {
                              getDirectURL(): string;
                            }[]);

                      return (
                        <div className="flex flex-col h-full bg-background overflow-y-auto">
                          {/* Preview Label */}
                          <div className="pt-8 text-center shrink-0">
                            {showEditProfile ? (
                              <div className="inline-flex flex-col items-center gap-1.5">
                                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30">
                                  <Pencil className="w-3 h-3 text-amber-600" />
                                  <span className="text-xs font-black uppercase tracking-wider text-amber-600">
                                    Edit Preview
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                This is how others see you
                              </span>
                            )}
                          </div>

                          <div className="flex-1 flex items-center justify-center p-8">
                            <div
                              className={cn(
                                "w-full transition-all duration-300 mx-auto",
                                showSelfDetail
                                  ? "flex flex-col lg:flex-row lg:items-start lg:gap-8 lg:max-w-[1000px] lg:px-8 py-4"
                                  : "flex items-center justify-center h-full",
                              )}
                            >
                              <div
                                className={cn(
                                  "relative aspect-[9/14] shrink-0 transition-all duration-300",
                                  "w-[99vw] max-w-[420px]",
                                  showSelfDetail
                                    ? "mb-6 lg:mb-0 lg:sticky lg:top-4"
                                    : "",
                                )}
                              >
                                <ProfileCard
                                  profile={{
                                    profile: {
                                      principal: myProfile.principal,
                                      name: previewName,
                                      birthday: previewBirthday,
                                      bio: previewBio,
                                      gender: myProfile.gender,
                                      genderPreference: previewGenderPref,
                                      interests: previewInterests,
                                      location: myProfile.location ?? null,
                                      photos: previewPhotos,
                                      isVerified:
                                        (myProfile as any).isVerified ?? false,
                                      icebreakers: previewIcebreakers,
                                    },
                                    distanceKm: null,
                                    likedMe: false,
                                  }}
                                  myInterests={previewInterests}
                                  hideOverlay={showSelfDetail}
                                  onViewProfile={() =>
                                    setShowSelfDetail(!showSelfDetail)
                                  }
                                />
                              </div>
                              {showSelfDetail && (
                                <div className="w-full lg:flex-1 animate-in slide-in-from-bottom lg:slide-in-from-right px-1 lg:px-0 mt-0 lg:max-w-none">
                                  <FullProfileDetail
                                    profile={{
                                      profile: {
                                        principal: myProfile.principal,
                                        name: previewName,
                                        birthday: previewBirthday,
                                        bio: previewBio,
                                        gender: myProfile.gender,
                                        genderPreference: previewGenderPref,
                                        interests: previewInterests,
                                        location: myProfile.location ?? null,
                                        photos: previewPhotos,
                                        isVerified:
                                          (myProfile as any).isVerified ??
                                          false,
                                        icebreakers: previewIcebreakers,
                                      },
                                      distanceKm: null,
                                      likedMe: false,
                                    }}
                                    onClose={() => setShowSelfDetail(false)}
                                    inline
                                    detailsOnly
                                    hideBlock
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <SwipeStack
                      onOpenChat={(p) => setChatPrincipal(p)}
                      onViewProfile={(p) => setViewProfilePrincipal(p)}
                      onOpenLocationPicker={() => setShowLocationPicker(true)}
                      showFilters={showSwipeFilter}
                      onShowFilters={setShowSwipeFilter}
                    />
                  )}
                </div>
              </div>
              {/* Likes tab — mobile and desktop */}
              <div
                className={cn(
                  "absolute inset-0",
                  activeTab !== "likes" && "hidden",
                )}
              >
                <LikesList
                  onViewProfile={(p) => setViewProfilePrincipal(p)}
                  onOpenChat={(p) => setChatPrincipal(p)}
                />
              </div>
              {/* Matches tab — visible on mobile only; desktop uses the sidebar */}
              <div
                className={cn(
                  "absolute inset-0 lg:hidden",
                  activeTab !== "matches" && "hidden",
                )}
              >
                <MatchesList
                  onSelectMatch={(p) => setChatPrincipal(p)}
                  onViewProfile={(p) => setViewProfilePrincipal(p)}
                />
              </div>
              {/* Profile tab — visible on mobile only; desktop uses the sidebar */}
              <div
                className={cn(
                  "absolute inset-0 overflow-y-auto lg:hidden",
                  (activeTab !== "profile" || showEditProfile) && "hidden",
                )}
              >
                <ProfilePage
                  onOpenQuiz={() => setShowQuiz(true)}
                  onOpenSettings={() => setShowSettings(true)}
                  onEditProfile={() => setShowEditProfile(true)}
                  onOpenPreview={() => setShowMobilePreview(true)}
                />
              </div>
            </>
          )}
        </div>

        {/* Bottom tab bar — mobile only */}
        {!hideTabBar && (
          <div className="shrink-0 border-t border-border bg-background lg:hidden">
            <div className="flex">
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 pt-2 pb-3 transition-colors relative",
                    activeTab === id
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {activeTab === id && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
                  )}
                  <div className="relative">
                    <Icon
                      className="w-5 h-5"
                      fill={
                        activeTab === id && (id === "matches" || id === "likes")
                          ? "currentColor"
                          : "none"
                      }
                    />
                    {id === "likes" &&
                      pendingLikesCount > 0 &&
                      activeTab !== "likes" && (
                        <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                          {pendingLikesCount > 9 ? "9+" : pendingLikesCount}
                        </span>
                      )}
                  </div>
                  <span
                    className={cn(
                      "text-xs",
                      activeTab === id ? "font-bold" : "font-medium",
                    )}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
