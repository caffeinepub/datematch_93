import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  Camera,
  MapPin,
  Check,
  ChevronDown,
  X,
  Plus,
  User,
  Users,
  Search,
  Lightbulb,
  AlignLeft,
  Calendar,
  Tag,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ExternalBlob } from "../../backend";
import { GenderPicker } from "../shared/GenderPicker";
import {
  GenderPreferencePicker,
  GENDER_PREF_LABELS,
} from "../shared/GenderPreferencePicker";
import { InterestPicker } from "../shared/InterestPicker";
import { PhotoUpload } from "../shared/PhotoUpload";
import { LocationPicker } from "../shared/LocationPicker";
import { useMyProfile, useSetProfile } from "../../hooks/useQueries";
import {
  MAX_NAME_LEN,
  MAX_BIO_LEN,
  ICEBREAKER_PROMPTS,
  MAX_ICEBREAKERS,
} from "../../utils/constants";
import { calculateAge } from "../../utils/formatting";

type Location = { lat: number; lng: number; city: string };
type FieldType =
  | "photos"
  | "name"
  | "gender"
  | "genderPreference"
  | "bio"
  | "birthday"
  | "interests"
  | "icebreakers"
  | "location";

export interface EditPreviewProfile {
  name: string;
  bio: string;
  birthday: bigint;
  interests: string[];
  genderPreference: string[];
  icebreakers: { prompt: string; answer: string }[];
  photoUrls: string[];
}

function parseBirthdayDigits(digits: string[]): bigint | null {
  const m = parseInt(digits[0] + digits[1], 10);
  const d = parseInt(digits[2] + digits[3], 10);
  const y = parseInt(digits[4] + digits[5] + digits[6] + digits[7], 10);
  if (!m || !d || !y || y < 1900 || m > 12 || d > 31) return null;
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return null;
  return BigInt(date.getTime()) * 1000000n;
}

interface EditProfilePageProps {
  onBack: () => void;
  onPreviewChange?: (preview: EditPreviewProfile) => void;
}

export function EditProfilePage({
  onBack,
  onPreviewChange,
}: EditProfilePageProps) {
  const { data: profile } = useMyProfile();
  const { mutate: setProfile, isPending: isSaving } = useSetProfile();

  const [initialized, setInitialized] = useState(false);
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState<bigint>(0n);
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [genderPreference, setGenderPreference] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [icebreakers, setIcebreakers] = useState<
    { prompt: string; answer: string }[]
  >([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [photos, setPhotos] = useState<(File | ExternalBlob)[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (profile && !initialized) {
      setName(profile.name);
      setBirthday(profile.birthday);
      setBio(profile.bio);
      setGender(profile.gender ?? "");
      setGenderPreference([...((profile as any).genderPreference ?? [])]);
      setInterests([...profile.interests]);
      setIcebreakers([...(profile.icebreakers ?? [])]);
      setLocation(profile.location ?? null);
      const existing = profile.photos ?? [];
      setPhotos(existing);
      setPhotoPreviewUrls(existing.map((p) => p.getDirectURL()));
      setInitialized(true);
    }
  }, [profile, initialized]);

  const [editingField, setEditingField] = useState<FieldType | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const [draftName, setDraftName] = useState("");
  const [draftBio, setDraftBio] = useState("");
  const [draftGender, setDraftGender] = useState("");
  const [draftGenderPreference, setDraftGenderPreference] = useState<string[]>(
    [],
  );
  const [draftBdDigits, setDraftBdDigits] = useState<string[]>(
    Array(8).fill(""),
  );
  const [draftInterests, setDraftInterests] = useState<string[]>([]);
  const [draftIcebreakers, setDraftIcebreakers] = useState<
    { prompt: string; answer: string }[]
  >([]);
  const [draftPhotos, setDraftPhotos] = useState<(File | ExternalBlob)[]>([]);
  const [draftPhotoUrls, setDraftPhotoUrls] = useState<string[]>([]);

  // Internal state for prompt picking within sub-editor
  const [showPromptPicker, setShowPromptPicker] = useState(false);
  const [editingPromptIndex, setEditingPromptIndex] = useState<number | null>(
    null,
  );
  const [promptSearch, setPromptSearch] = useState("");

  const bdRefs = useRef<(HTMLInputElement | null)[]>(Array(8).fill(null));

  // Keep a stable ref to the callback so the effect doesn't re-run when the
  // parent re-renders — only when actual draft/saved values change.
  const onPreviewChangeRef = useRef(onPreviewChange);
  useEffect(() => {
    onPreviewChangeRef.current = onPreviewChange;
  });

  useEffect(() => {
    if (!onPreviewChangeRef.current || !initialized) return;
    onPreviewChangeRef.current({
      name: editingField === "name" ? draftName : name,
      bio: editingField === "bio" ? draftBio : bio,
      birthday:
        editingField === "birthday"
          ? (parseBirthdayDigits(draftBdDigits) ?? birthday)
          : birthday,
      interests: editingField === "interests" ? draftInterests : interests,
      genderPreference:
        editingField === "genderPreference"
          ? draftGenderPreference
          : genderPreference,
      icebreakers:
        editingField === "icebreakers" ? draftIcebreakers : icebreakers,
      photoUrls: editingField === "photos" ? draftPhotoUrls : photoPreviewUrls,
    });
  }, [
    initialized,
    editingField,
    draftName,
    name,
    draftBio,
    bio,
    draftBdDigits,
    birthday,
    draftInterests,
    interests,
    draftGenderPreference,
    genderPreference,
    draftIcebreakers,
    icebreakers,
    draftPhotoUrls,
    photoPreviewUrls,
  ]);

  const openEditor = (field: FieldType) => {
    setFieldError(null);
    if (field === "name") setDraftName(name);
    if (field === "bio") setDraftBio(bio);
    if (field === "gender") setDraftGender(gender);
    if (field === "genderPreference")
      setDraftGenderPreference([...genderPreference]);
    if (field === "birthday") {
      if (birthday > 0n) {
        const d = new Date(Number(birthday / 1000000n));
        const mStr = String(d.getMonth() + 1).padStart(2, "0");
        const dStr = String(d.getDate()).padStart(2, "0");
        const yStr = String(d.getFullYear());
        setDraftBdDigits((mStr + dStr + yStr).split(""));
      } else {
        setDraftBdDigits(Array(8).fill(""));
      }
    }
    if (field === "interests") setDraftInterests([...interests]);
    if (field === "icebreakers") setDraftIcebreakers([...icebreakers]);
    if (field === "photos") {
      setDraftPhotos([...photos]);
      setDraftPhotoUrls([...photoPreviewUrls]);
    }
    setEditingField(field);
  };

  const closeEditor = () => {
    setEditingField(null);
    setFieldError(null);
    setShowPromptPicker(false);
    setEditingPromptIndex(null);
  };

  const buildPayload = (override: any) => {
    return {
      name: override.name ?? name,
      birthday: override.birthday ?? birthday,
      bio: override.bio ?? bio,
      gender: override.gender ?? gender,
      genderPreference: override.genderPreference ?? genderPreference,
      interests: override.interests ?? interests,
      location: "location" in override ? (override.location ?? null) : location,
      icebreakers: override.icebreakers ?? icebreakers,
      photos: override.photos ?? photos,
      onProgress: setUploadProgress,
    };
  };

  const handleSave = (field: FieldType, override: any) => {
    setProfile(buildPayload(override), {
      onSuccess: () => {
        if (field === "name") setName(override.name);
        if (field === "bio") setBio(override.bio);
        if (field === "gender") setGender(override.gender);
        if (field === "genderPreference")
          setGenderPreference(override.genderPreference);
        if (field === "birthday") setBirthday(override.birthday);
        if (field === "interests") setInterests(override.interests);
        if (field === "icebreakers") setIcebreakers(override.icebreakers);
        if (field === "photos") {
          setPhotos(override.photos);
          setPhotoPreviewUrls(draftPhotoUrls);
        }
        toast.success(
          `${field.charAt(0).toUpperCase() + field.slice(1)} updated!`,
        );
        closeEditor();
      },
      onError: (err) => setFieldError(err.message || "Failed to save."),
    });
  };

  const FIELD_TEXTS: Record<FieldType, { title: string; sub: string }> = {
    name: {
      title: "What's your first name?",
      sub: "This is how it'll appear on your profile.",
    },
    birthday: {
      title: "Your b-day?",
      sub: "Your profile shows your age, not your birth date.",
    },
    gender: {
      title: "How do you identify?",
      sub: "This shows on your profile and helps others find you.",
    },
    genderPreference: {
      title: "Who are you hoping to connect with?",
      sub: "Select all that apply. Leave empty to connect with everyone.",
    },
    bio: {
      title: "About me",
      sub: "Tell people what you're about — hobbies, what you're looking for, anything.",
    },
    interests: {
      title: "What are you into?",
      sub: "Pick things that describe you.",
    },
    icebreakers: {
      title: "Share more about yourself",
      sub: "Answer prompts to show off your personality.",
    },
    photos: {
      title: "Add your photos",
      sub: "Profiles with photos get way more matches.",
    },
    location: {
      title: "Your location",
      sub: "Set your city manually on the map.",
    },
  };

  const renderSubEditor = () => {
    if (!editingField) return null;
    if (editingField === "location")
      return (
        <div className="absolute inset-0 z-[100] bg-background">
          <LocationPicker
            initialLocation={location}
            onSave={(loc) => handleSave("location", { location: loc })}
            onBack={closeEditor}
          />
        </div>
      );

    // Focused prompt answer screen
    if (editingField === "icebreakers" && editingPromptIndex !== null) {
      const ib = draftIcebreakers[editingPromptIndex];
      return (
        <div className="absolute inset-0 z-[120] bg-background flex flex-col animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <button
              onClick={() => setEditingPromptIndex(null)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-hover transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-base font-black">Answer prompt</span>
            <button
              onClick={() => setEditingPromptIndex(null)}
              className="text-primary font-black"
            >
              <Check className="w-6 h-6 stroke-[3px]" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-10 space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight">
                {ib.prompt}
              </h2>
            </div>
            <div className="relative">
              <Textarea
                value={ib.answer}
                onChange={(e) =>
                  setDraftIcebreakers((prev) =>
                    prev.map((item, idx) =>
                      idx === editingPromptIndex
                        ? { ...item, answer: e.target.value }
                        : item,
                    ),
                  )
                }
                placeholder="Write something about me..."
                maxLength={MAX_BIO_LEN}
                autoFocus
                className="min-h-[160px] text-lg font-medium p-4 rounded-2xl border-2 border-border focus-visible:ring-0 focus-visible:border-primary transition-all resize-none bg-card text-foreground"
              />{" "}
              <span className="absolute bottom-4 right-4 text-[10px] font-bold text-muted-foreground/60">
                {ib.answer.length}/{MAX_BIO_LEN}
              </span>
            </div>
          </div>
        </div>
      );
    }

    // Prompt picker
    if (editingField === "icebreakers" && showPromptPicker) {
      const usedPrompts = new Set(draftIcebreakers.map((ib) => ib.prompt));
      return (
        <div className="absolute inset-0 z-[120] bg-background flex flex-col animate-in slide-in-from-right duration-300">
          <div className="px-6 py-5 shrink-0">
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setShowPromptPicker(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-hover transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="text-base font-bold">Select a prompt</span>
              <div className="w-6" />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                placeholder="Search prompts..."
                value={promptSearch}
                onChange={(e) => setPromptSearch(e.target.value)}
                className="w-full pl-9 h-11 rounded-xl !bg-muted text-foreground placeholder:text-muted-foreground border-0 outline-none focus:ring-1 focus:ring-ring text-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {ICEBREAKER_PROMPTS.filter(
              (p) =>
                p.toLowerCase().includes(promptSearch.toLowerCase()) &&
                !usedPrompts.has(p),
            ).map((prompt) => (
              <button
                key={prompt}
                onClick={() => {
                  const newIdx = draftIcebreakers.length;
                  setDraftIcebreakers((prev) => [
                    ...prev,
                    { prompt, answer: "" },
                  ]);
                  setEditingPromptIndex(newIdx);
                  setShowPromptPicker(false);
                }}
                className="w-full text-left p-4 rounded-xl hover:bg-hover transition-colors text-sm font-bold text-foreground"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 z-[100] bg-background flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <button
            onClick={closeEditor}
            className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-hover transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-base font-black">
            Edit{" "}
            {editingField === "icebreakers"
              ? "Prompts"
              : FIELD_TEXTS[editingField].title.split("?")[0]}
          </span>
          <button
            onClick={() => {
              if (editingField === "name")
                handleSave("name", { name: draftName.trim() });
              if (editingField === "bio")
                handleSave("bio", { bio: draftBio.trim() });
              if (editingField === "gender")
                handleSave("gender", { gender: draftGender });
              if (editingField === "genderPreference")
                handleSave("genderPreference", {
                  genderPreference: draftGenderPreference,
                });
              if (editingField === "birthday") {
                const ts = parseBirthdayDigits(draftBdDigits);
                if (ts) handleSave("birthday", { birthday: ts });
              }
              if (editingField === "interests")
                handleSave("interests", { interests: draftInterests });
              if (editingField === "icebreakers")
                handleSave("icebreakers", { icebreakers: draftIcebreakers });
              if (editingField === "photos")
                handleSave("photos", { photos: draftPhotos });
            }}
            disabled={isSaving}
            className="w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-primary/10 disabled:opacity-40"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Check className="w-6 h-6 stroke-[3px]" />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-10 space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight">
              {FIELD_TEXTS[editingField].title}
            </h2>
            <p className="text-muted-foreground text-sm font-medium leading-relaxed">
              {FIELD_TEXTS[editingField].sub}
            </p>
          </div>

          {editingField === "name" && (
            <Input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={MAX_NAME_LEN}
              autoFocus
              className="h-14 text-2xl font-bold bg-transparent border-0 border-b-2 border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary text-foreground"
            />
          )}

          {editingField === "gender" && (
            <GenderPicker value={draftGender} onChange={setDraftGender} />
          )}

          {editingField === "genderPreference" && (
            <GenderPreferencePicker
              value={draftGenderPreference}
              onChange={setDraftGenderPreference}
            />
          )}

          {editingField === "bio" && (
            <div className="space-y-6">
              <div className="relative">
                <Textarea
                  value={draftBio}
                  onChange={(e) => setDraftBio(e.target.value)}
                  maxLength={MAX_BIO_LEN}
                  autoFocus
                  rows={6}
                  className="text-lg font-medium p-4 rounded-2xl border-2 border-border focus-visible:ring-0 focus-visible:border-primary resize-none bg-card text-foreground"
                />
                <span className="absolute bottom-4 right-4 text-[10px] font-bold text-muted-foreground/60">
                  {draftBio.length}/{MAX_BIO_LEN}
                </span>
              </div>
              <div className="rounded-2xl bg-secondary/10 p-5 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shrink-0 shadow-sm">
                  <Lightbulb className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-foreground">
                    Bio tip
                  </span>
                  <p className="text-xs text-foreground/60 leading-relaxed">
                    Great bios are short and concise. Share your interests,
                    values, and what you are looking for.
                  </p>
                </div>
              </div>
            </div>
          )}

          {editingField === "birthday" && (
            <div className="flex items-center gap-4 text-2xl font-bold text-foreground w-max max-w-full overflow-hidden">
              <Input
                value={draftBdDigits[0] + draftBdDigits[1]}
                onChange={(e) => {
                  const v = e.target.value.slice(0, 2);
                  const d = [...draftBdDigits];
                  d[0] = v[0] || "";
                  d[1] = v[1] || "";
                  setDraftBdDigits(d);
                  if (v.length === 2) bdRefs.current[2]?.focus();
                }}
                ref={(el) => {
                  bdRefs.current[0] = el;
                }}
                placeholder="MM"
                className="w-16 h-14 p-0 text-center bg-transparent border-0 border-b-2 border-border rounded-none focus-visible:ring-0 focus-visible:border-primary text-foreground"
              />
              <span className="opacity-20">/</span>
              <Input
                value={draftBdDigits[2] + draftBdDigits[3]}
                onChange={(e) => {
                  const v = e.target.value.slice(0, 2);
                  const d = [...draftBdDigits];
                  d[2] = v[0] || "";
                  d[3] = v[1] || "";
                  setDraftBdDigits(d);
                  if (v.length === 2) bdRefs.current[4]?.focus();
                }}
                ref={(el) => {
                  bdRefs.current[2] = el;
                }}
                placeholder="DD"
                className="w-16 h-14 p-0 text-center bg-transparent border-0 border-b-2 border-border rounded-none focus-visible:ring-0 focus-visible:border-primary text-foreground"
              />
              <span className="opacity-20">/</span>
              <Input
                value={
                  draftBdDigits[4] +
                  draftBdDigits[5] +
                  draftBdDigits[6] +
                  draftBdDigits[7]
                }
                onChange={(e) => {
                  const v = e.target.value.slice(0, 4);
                  const d = [...draftBdDigits];
                  d[4] = v[0] || "";
                  d[5] = v[1] || "";
                  d[6] = v[2] || "";
                  d[7] = v[3] || "";
                  setDraftBdDigits(d);
                }}
                ref={(el) => {
                  bdRefs.current[4] = el;
                }}
                placeholder="YYYY"
                className="w-24 h-14 p-0 text-center bg-transparent border-0 border-b-2 border-border rounded-none focus-visible:ring-0 focus-visible:border-primary text-foreground"
              />
            </div>
          )}

          {editingField === "interests" && (
            <InterestPicker
              selected={draftInterests}
              onChange={setDraftInterests}
            />
          )}

          {editingField === "icebreakers" && (
            <div className="flex flex-col gap-6 animate-slide-up pt-4">
              {draftIcebreakers.map((ib, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setEditingPromptIndex(i);
                  }}
                  className="w-full rounded-3xl border-2 border-primary/30 bg-primary/5 p-6 text-left transition-all relative group animate-fade-in"
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-bold text-foreground">
                      {ib.prompt}
                    </span>
                    <p className="text-sm text-foreground/70 line-clamp-2 leading-relaxed italic">
                      "{ib.answer}"
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDraftIcebreakers((prev) =>
                        prev.filter((_, idx) => idx !== i),
                      );
                    }}
                    className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-foreground/60 shadow-sm hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </button>
              ))}

              {draftIcebreakers.length < MAX_ICEBREAKERS && (
                <button
                  type="button"
                  onClick={() => setShowPromptPicker(true)}
                  className="w-full rounded-3xl border-2 border-dashed border-border p-6 text-left transition-all hover:border-primary/20 group relative"
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-bold text-foreground">
                      Select a prompt
                    </span>
                    <p className="text-sm text-foreground/30">
                      Answer a prompt to show off your personality.
                    </p>
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                    <Plus className="w-4 h-4" />
                  </div>
                </button>
              )}
            </div>
          )}

          {editingField === "photos" && (
            <PhotoUpload
              previewUrls={draftPhotoUrls}
              onFilesSelected={(newFiles) => {
                const urls = newFiles.map((f) => URL.createObjectURL(f));
                setDraftPhotos((prev) => [...prev, ...newFiles]);
                setDraftPhotoUrls((prev) => [...prev, ...urls]);
              }}
              onRemove={(idx) => {
                setDraftPhotos((prev) => prev.filter((_, i) => i !== idx));
                setDraftPhotoUrls((prev) => {
                  const url = prev[idx];
                  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
                  return prev.filter((_, i) => i !== idx);
                });
              }}
              isUploading={
                isSaving &&
                draftPhotos.some((p) => p instanceof File) &&
                uploadProgress > 0 &&
                uploadProgress < 100
              }
            />
          )}

          {fieldError && (
            <p className="text-sm text-destructive font-bold">{fieldError}</p>
          )}
        </div>
      </div>
    );
  };

  const GENDER_LABELS: Record<string, string> = {
    male: "Man",
    female: "Woman",
    other: "Other",
  };

  const genderPrefDisplay =
    genderPreference.length === 0
      ? "Everyone"
      : genderPreference.map((g) => GENDER_PREF_LABELS[g] ?? g).join(" · ");

  const fieldRows = [
    {
      id: "photos" as const,
      label: "Photos",
      value: `${photoPreviewUrls.length} photo${photoPreviewUrls.length === 1 ? "" : "s"}`,
      preview: photoPreviewUrls[0],
      Icon: Camera,
    },
    {
      id: "name" as const,
      label: "Name",
      value: name || "Add name",
      Icon: User,
    },
    {
      id: "gender" as const,
      label: "Gender",
      value: gender ? (GENDER_LABELS[gender] ?? gender) : "Not set",
      Icon: User,
    },
    {
      id: "genderPreference" as const,
      label: "Looking to connect with",
      value: genderPrefDisplay,
      Icon: Users,
    },
    {
      id: "bio" as const,
      label: "Bio",
      value: bio
        ? bio.length > 40
          ? bio.slice(0, 37) + "..."
          : bio
        : "Add bio",
      Icon: AlignLeft,
    },
    {
      id: "birthday" as const,
      label: "Birthday",
      value:
        birthday > 0n ? `${calculateAge(birthday)} years old` : "Add birthday",
      Icon: Calendar,
    },
    {
      id: "interests" as const,
      label: "Interests",
      value: `${interests.length} selected`,
      Icon: Tag,
    },
    {
      id: "icebreakers" as const,
      label: "Icebreakers",
      value:
        icebreakers.length > 0
          ? `${icebreakers.length} prompt${icebreakers.length === 1 ? "" : "s"}`
          : "Add prompt",
      Icon: MessageSquare,
    },
    {
      id: "location" as const,
      label: "Location",
      value: location?.city || "Set location",
      Icon: MapPin,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 py-4 shrink-0 border-b border-border bg-background">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-hover transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Edit Profile</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {fieldRows.map(({ id, label, value, preview, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => openEditor(id)}
              className={cn(
                "flex items-center gap-4 px-5 py-4 border-b border-border w-full text-left hover:bg-hover transition-colors active:bg-muted",
                editingField === id && "bg-primary/[0.03]",
              )}
            >
              {preview ? (
                <img
                  src={preview as string}
                  className="w-10 h-10 rounded-xl object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <p className="text-sm font-medium text-foreground truncate mt-0.5">
                  {value}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            </button>
          ))}
        </div>
      </div>
      {editingField && renderSubEditor()}
    </div>
  );
}
