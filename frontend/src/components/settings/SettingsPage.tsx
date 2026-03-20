import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronRight,
  LogOut,
  Trash2,
  Loader2,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  usePreferences,
  useSetPreferences,
  useDeleteProfile,
  useMyProfile,
} from "../../hooks/useQueries";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { MIN_AGE, MAX_AGE } from "../../utils/constants";
import { kmToMiles, milesToKm } from "../../utils/formatting";
import { RadarScreen } from "../RadarScreen";

interface SettingsPageProps {
  onBack: () => void;
  onOpenBlockedList: () => void;
  onOpenLocationPicker: () => void;
}

export function SettingsPage({
  onBack,
  onOpenBlockedList,
  onOpenLocationPicker,
}: SettingsPageProps) {
  const { data: myProfile } = useMyProfile();
  const { data: savedPrefs } = usePreferences();
  const { mutate: savePrefs, isPending: isSaving } = useSetPreferences();
  const { mutate: deleteProfile, isPending: isDeleting } = useDeleteProfile();
  const { clear: logout } = useInternetIdentity();
  const queryClient = useQueryClient();

  const [ageRange, setAgeRange] = useState<[number, number]>([18, 99]);
  const [radiusMi, setRadiusMi] = useState(50);
  const [incognito, setIncognito] = useState(false);
  const [notifyMatches, setNotifyMatches] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyLikes, setNotifyLikes] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showRadar, setShowRadar] = useState(false);

  // Sync from server once loaded
  useEffect(() => {
    if (savedPrefs) {
      setAgeRange([Number(savedPrefs.ageMin), Number(savedPrefs.ageMax)]);
      setRadiusMi(Math.round(kmToMiles(Number(savedPrefs.radiusKm))));
      setIncognito(savedPrefs.incognito);
      setNotifyMatches(savedPrefs.notifyMatches);
      setNotifyMessages(savedPrefs.notifyMessages);
      setNotifyLikes((savedPrefs as any).notifyLikes ?? true);
      setHasChanges(false);
    }
  }, [savedPrefs]);

  const handleLogout = () => {
    logout();
    queryClient.clear();
  };

  const handleAgeChange = (values: number[]) => {
    setAgeRange([values[0], values[1]]);
    setHasChanges(true);
  };

  const handleRadiusChange = (values: number[]) => {
    setRadiusMi(values[0]);
    setHasChanges(true);
  };

  const handleIncognitoChange = (checked: boolean) => {
    setIncognito(checked);
    setHasChanges(true);
  };

  const requestBrowserPermission = async () => {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      await Notification.requestPermission();
    }
  };

  const handleNotifyMatchesChange = async (checked: boolean) => {
    setNotifyMatches(checked);
    setHasChanges(true);
    if (checked) await requestBrowserPermission();
  };

  const handleNotifyMessagesChange = async (checked: boolean) => {
    setNotifyMessages(checked);
    setHasChanges(true);
    if (checked) await requestBrowserPermission();
  };

  const handleNotifyLikesChange = async (checked: boolean) => {
    setNotifyLikes(checked);
    setHasChanges(true);
    if (checked) await requestBrowserPermission();
  };

  const browserNotificationsBlocked =
    typeof Notification !== "undefined" && Notification.permission === "denied";

  const handleSave = () => {
    savePrefs(
      {
        ageMin: ageRange[0],
        ageMax: ageRange[1],
        incognito,
        radiusKm: Math.round(milesToKm(radiusMi)),
        notifyMatches,
        notifyMessages,
        notifyLikes,
      },
      {
        onSuccess: () => {
          setHasChanges(false);
          if (myProfile?.location) {
            setShowRadar(true);
          } else {
            toast.success("Settings saved");
          }
        },
        onError: (err) => toast.error(err.message || "Failed to save settings"),
      },
    );
  };

  const handleDelete = () => {
    deleteProfile(undefined, {
      onSuccess: () => logout(),
      onError: (err) => toast.error(err.message || "Failed to delete account"),
    });
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      {showRadar && myProfile?.location && (
        <RadarScreen
          location={myProfile.location}
          radius={Math.round(milesToKm(radiusMi))}
          onFinish={() => {
            setShowRadar(false);
            toast.success("Settings saved");
          }}
        />
      )}
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 shrink-0 border-b border-border bg-background">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-hover transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
        {/* Discovery Preferences */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Discovery Preferences
          </h2>
          <div className="rounded-2xl bg-card border border-border p-5 space-y-8">
            {/* Age range */}
            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <Label className="text-sm font-medium">Age range</Label>
                <span className="text-sm font-semibold text-primary">
                  {ageRange[0]}–{ageRange[1]}
                </span>
              </div>
              <Slider
                min={MIN_AGE}
                max={MAX_AGE}
                step={1}
                value={ageRange}
                onValueChange={handleAgeChange}
                className="w-full"
              />
            </div>

            {/* Radius */}
            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <Label className="text-sm font-medium">Search radius</Label>
                <span className="text-sm font-semibold text-primary">
                  {radiusMi} mi
                </span>
              </div>
              <Slider
                min={1}
                max={100}
                step={1}
                value={[radiusMi]}
                onValueChange={handleRadiusChange}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 mi</span>
                <span>100 mi</span>
              </div>
            </div>

            {/* Location entry */}
            <div className="pt-2">
              <button
                onClick={onOpenLocationPicker}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border hover:bg-hover transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-primary shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Current Location
                  </p>
                  <p className="text-sm font-medium truncate">
                    {myProfile?.location?.city ?? "Not set"}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
              </button>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Notifications
          </h2>
          <div className="rounded-2xl bg-card border border-border divide-y divide-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex-1 pr-4">
                <p className="text-sm font-medium text-foreground">
                  New Matches
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get notified when someone likes you back
                </p>
              </div>
              <Switch
                checked={notifyMatches}
                onCheckedChange={handleNotifyMatchesChange}
              />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex-1 pr-4">
                <p className="text-sm font-medium text-foreground">Messages</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get notified when you receive a message
                </p>
              </div>
              <Switch
                checked={notifyMessages}
                onCheckedChange={handleNotifyMessagesChange}
              />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex-1 pr-4">
                <p className="text-sm font-medium text-foreground">Likes</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get notified when someone likes your profile
                </p>
              </div>
              <Switch
                checked={notifyLikes}
                onCheckedChange={handleNotifyLikesChange}
              />
            </div>
          </div>
          {browserNotificationsBlocked && (
            <p className="text-xs text-destructive mt-2 px-1">
              Browser notifications are blocked. Enable them in your browser
              settings.
            </p>
          )}
        </section>

        {/* Privacy */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Privacy
          </h2>
          <div className="rounded-2xl bg-card border border-border divide-y divide-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex-1 pr-4">
                <p className="text-sm font-medium text-foreground">
                  Incognito mode
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Only visible to people you've already liked
                </p>
              </div>
              <Switch
                checked={incognito}
                onCheckedChange={handleIncognitoChange}
              />
            </div>
          </div>
        </section>

        {/* Save button */}
        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-12 rounded-2xl text-base font-semibold"
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        )}

        {/* Account */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Account
          </h2>
          <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
            <button
              onClick={onOpenBlockedList}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-hover/50 transition-colors"
            >
              <span className="text-sm font-medium text-foreground">
                Blocked users
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-hover/50 transition-colors"
            >
              <LogOut className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Log out
              </span>
            </button>

            <button
              onClick={() => setShowDeleteDialog(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-destructive/5 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                Delete account
              </span>
            </button>
          </div>
        </section>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your profile, matches, messages, and all
              data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isDeleting ? "Deleting..." : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
