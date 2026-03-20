import { useState, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { FormPageLayout } from "./FormPageLayout";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronLeft,
  Heart,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  User,
  X,
  Check,
  Search,
  Info,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { GenderPicker } from "../shared/GenderPicker";
import { GenderPreferencePicker } from "../shared/GenderPreferencePicker";
import { InterestPicker } from "../shared/InterestPicker";
import { PhotoUpload } from "../shared/PhotoUpload";
import { LocationPicker } from "../shared/LocationPicker";
import { useSetProfile } from "../../hooks/useQueries";
import {
  MAX_ICEBREAKERS,
  MAX_NAME_LEN,
  MAX_BIO_LEN,
  MIN_AGE,
  MAX_AGE,
  MIN_INTERESTS,
  MAX_INTERESTS,
  INTERESTS_LIST,
  ICEBREAKER_PROMPTS,
} from "../../utils/constants";
import { detectInterestsFromBio } from "../../utils/interests";
import { ProfileCard, type DiscoveryProfile } from "../swipe/ProfileCard";

type Icebreaker = { prompt: string; answer: string };
type Location = { lat: number; lng: number; city: string };
type SubView = "none" | "location" | "bio" | "prompt-picker" | "answer-prompt";

const STEPS = [
  {
    heading: "What's your first name?",
    sub: "This is the name that'll appear on your profile.",
  },
  {
    heading: "How do you identify?",
    sub: "This helps people find you and shows on your profile.",
  },
  {
    heading: "Who are you hoping to connect with?",
    sub: "Choose all that apply. You can update this anytime in settings.",
  },
  {
    heading: "Your b-day?",
    sub: "Your profile shows your age, not your birth date.",
  },
  {
    heading: "Your location?",
    sub: "Use the slider to set the maximum distance you want potential matches to be.",
  },
  {
    heading: "What are you into?",
    sub: "Add up to 10 interests to your profile to help you find people who share what you love.",
  },
  {
    heading: "Share more about yourself",
    sub: "Write a bio and a prompt to help your profile stand out and spark conversations.",
  },
  {
    heading: "Add your photos",
    sub: "Profiles with photos get way more matches.",
  },
];

export function ProfileSetup() {
  const isDesktop = !useIsMobile(1024);

  const [step, setStep] = useState(0);
  const [subView, setSubView] = useState<SubView>("none");

  // Basics
  const [name, setName] = useState("");
  const [bDay, setBDay] = useState("");
  const [bMonth, setBMonth] = useState("");
  const [bYear, setBYear] = useState("");
  const [gender, setGender] = useState("");
  const [genderPreference, setGenderPreference] = useState<string[]>([]);

  // Location & Distance
  const [location, setLocation] = useState<Location | null>(null);
  const [distancePreference, setDistancePreference] = useState(50);

  // Interests
  const [interests, setInterests] = useState<string[]>([]);

  // Bio & Icebreakers
  const [bio, setBio] = useState("");
  const [icebreakers, setIcebreakers] = useState<Icebreaker[]>([]);
  const [editingPromptIndex, setEditingPromptIndex] = useState<number | null>(
    null,
  );
  const [promptSearch, setPromptSearch] = useState("");

  // Photos
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [error, setError] = useState<string | null>(null);

  const { mutate: setProfile, isPending } = useSetProfile();

  const getBirthdayTimestamp = (): bigint | null => {
    const d = parseInt(bDay, 10);
    const m = parseInt(bMonth, 10);
    const y = parseInt(bYear, 10);
    if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
    const date = new Date(y, m - 1, d);
    if (
      date.getFullYear() !== y ||
      date.getMonth() !== m - 1 ||
      date.getDate() !== d
    )
      return null;
    return BigInt(date.getTime()) * 1000000n;
  };

  const validate = (): boolean => {
    setError(null);
    if (step === 0) {
      if (!name.trim()) {
        setError("Enter your name to continue.");
        return false;
      }
      if (name.trim().length > MAX_NAME_LEN) {
        setError(`Name must be ${MAX_NAME_LEN} characters or fewer.`);
        return false;
      }
    }
    if (step === 1) {
      if (!gender) {
        setError("Select how you identify to continue.");
        return false;
      }
    }
    if (step === 3) {
      const ts = getBirthdayTimestamp();
      if (!ts) {
        setError("Enter a valid birthday.");
        return false;
      }
      const age = Number(
        (BigInt(Date.now()) * 1000000n - ts) /
          (1000000000n * 3600n * 24n * 365n),
      );
      if (age < MIN_AGE || age > MAX_AGE) {
        setError(`You must be between ${MIN_AGE} and ${MAX_AGE} years old.`);
        return false;
      }
    }
    if (step === 4) {
      if (!location) {
        setError("Please set your location to continue.");
        return false;
      }
    }
    if (step === 5 && interests.length < MIN_INTERESTS) {
      setError(`Pick at least ${MIN_INTERESTS} interests.`);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validate()) return;
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => s - 1);
  };

  const handleFinish = () => {
    const bdayTs = getBirthdayTimestamp();
    if (!bdayTs) return;
    setProfile(
      {
        name: name.trim(),
        birthday: bdayTs,
        bio: bio.trim(),
        gender,
        genderPreference,
        interests,
        location,
        icebreakers,
        photos: photoFiles,
        onProgress: setUploadProgress,
      },
      {
        onSuccess: () => toast.success("Profile created!"),
        onError: (err) => toast.error(err.message || "Failed to save profile."),
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isNextEnabled) {
      e.preventDefault();
      handleNext();
    }
  };

  const isLastStep = step === STEPS.length - 1;

  const birthdayHint = (() => {
    if (step !== 3) return null;
    if (!bDay || !bMonth || bYear.length < 3) return null;
    const ts = getBirthdayTimestamp();
    if (!ts) return "Enter a valid date.";
    const age = Number(
      (BigInt(Date.now()) * 1000000n - ts) / (1000000000n * 3600n * 24n * 365n),
    );
    if (age > MAX_AGE) return "That date looks too far in the past.";
    if (age < MIN_AGE)
      return `You must be at least ${MIN_AGE} to use DateMatch.`;
    return null;
  })();

  const isNextEnabled = (() => {
    if (step === 0)
      return name.trim().length > 0 && name.trim().length <= MAX_NAME_LEN;
    if (step === 1) return gender !== "";
    if (step === 2) return true; // genderPreference is optional
    if (step === 3) {
      const ts = getBirthdayTimestamp();
      if (!ts) return false;
      const age = Number(
        (BigInt(Date.now()) * 1000000n - ts) /
          (1000000000n * 3600n * 24n * 365n),
      );
      return age >= MIN_AGE && age <= MAX_AGE;
    }
    if (step === 4) return location !== null;
    if (step === 5) return interests.length >= MIN_INTERESTS;
    if (step === 6) return bio.trim().length > 0;
    return true;
  })();

  const progressDots = (
    <div className="flex items-center gap-1.5">
      {STEPS.map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            i === step
              ? "w-6 bg-primary"
              : i < step
                ? "w-1.5 bg-primary/50"
                : "w-1.5 bg-border",
          )}
        />
      ))}
    </div>
  );

  const header = (
    <div className="px-5 lg:px-6 pt-0 pb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-8 lg:mb-6">
        <button
          onClick={handleBack}
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center text-foreground/80 hover:bg-hover",
            step === 0 && "invisible",
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        {progressDots}
        <div className="w-9" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight leading-tight mb-2 text-left text-foreground">
        {STEPS[step].heading}
      </h1>
      <p className="text-muted-foreground text-sm font-medium leading-relaxed text-left">
        {STEPS[step].sub}
      </p>
    </div>
  );

  const footer = (
    <div className="px-6 pb-10 pt-3">
      {isLastStep ? (
        <Button
          onClick={handleFinish}
          disabled={isPending}
          className="w-full h-16 text-base font-bold rounded-full"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating profile...
            </>
          ) : (
            "Finish"
          )}
        </Button>
      ) : (
        <Button
          onClick={handleNext}
          disabled={!isNextEnabled}
          className="w-full h-16 text-base font-bold rounded-full"
        >
          Next
        </Button>
      )}
      {error && (
        <p className="mt-4 text-sm text-destructive font-medium animate-fade-in text-center">
          {error}
        </p>
      )}
    </div>
  );

  const bdayTs = getBirthdayTimestamp();
  const previewProfile: DiscoveryProfile = {
    profile: {
      principal: "",
      name: name || "Your Name",
      birthday: bdayTs || 0n,
      bio: bio || "",
      gender,
      genderPreference,
      interests,
      location,
      photos: photoPreviewUrls.map((url) => ({ getDirectURL: () => url })),
      isVerified: false,
      icebreakers,
    },
    distanceKm: null,
    likedMe: false,
  };

  const stepVisual = (
    <div className="flex flex-col items-center justify-center w-full animate-fade-in">
      <div className="w-full max-w-[380px] relative pointer-events-none">
        <ProfileCard profile={previewProfile} myInterests={interests} />
      </div>
      <p className="mt-6 text-xs text-muted-foreground font-medium flex items-center gap-2">
        <Heart className="w-3.5 h-3.5 text-primary" fill="currentColor" />
        This is how others will see you
      </p>
    </div>
  );

  // --- COLUMN-SPECIFIC EDITORS ---
  const renderBioEditor = () => {
    const isPrompt = subView === "answer-prompt";
    const currentAnswer = isPrompt
      ? icebreakers[editingPromptIndex!].answer
      : bio;
    return (
      <div className="absolute inset-0 z-[110] bg-background flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-6 py-5 shrink-0 border-b border-border">
          <button
            onClick={() => {
              setSubView("none");
              setEditingPromptIndex(null);
            }}
            className="text-muted-foreground"
          >
            <X className="w-6 h-6" />
          </button>
          <span className="text-base font-bold">
            {isPrompt ? "Answer prompt" : "Add bio"}
          </span>
          <button
            onClick={() => {
              setSubView("none");
              setEditingPromptIndex(null);
            }}
            className="text-primary font-bold text-sm"
          >
            <Check className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pt-8 space-y-8">
          {isPrompt && (
            <p className="text-xl font-bold text-foreground leading-tight">
              {icebreakers[editingPromptIndex!].prompt}
            </p>
          )}
          <div className="relative">
            <Textarea
              value={currentAnswer}
              onChange={(e) => {
                const val = e.target.value;
                if (isPrompt) {
                  setIcebreakers((prev) =>
                    prev.map((ib, i) =>
                      i === editingPromptIndex ? { ...ib, answer: val } : ib,
                    ),
                  );
                } else {
                  setBio(val);
                }
              }}
              placeholder={
                isPrompt
                  ? "Write something about me..."
                  : "Tell us about yourself..."
              }
              maxLength={MAX_BIO_LEN}
              autoFocus
              className="min-h-[160px] text-lg font-medium p-4 rounded-2xl border-2 border-border focus-visible:ring-0 focus-visible:border-primary transition-all resize-none bg-card text-foreground"
            />
            <span className="absolute bottom-4 right-4 text-[10px] font-bold text-muted-foreground/60">
              {currentAnswer.length}/{MAX_BIO_LEN}
            </span>
          </div>
          {!isPrompt && (
            <div className="rounded-2xl bg-secondary/10 p-5 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shrink-0 shadow-sm">
                <Lightbulb className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-foreground">
                  Bio tip
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Great bios are short and concise. Share your interests,
                  values, and what you are looking for.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPromptPicker = () => (
    <div className="absolute inset-0 z-[110] bg-background flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-6 py-5 shrink-0">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => setSubView("none")}
            className="text-muted-foreground"
          >
            <X className="w-6 h-6" />
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
            className="w-full pl-9 h-11 rounded-xl !bg-muted border-0 outline-none focus:ring-1 focus:ring-ring text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {ICEBREAKER_PROMPTS.filter((p) =>
          p.toLowerCase().includes(promptSearch.toLowerCase()),
        ).map((prompt) => (
          <button
            key={prompt}
            onClick={() => {
              const newIdx = icebreakers.length;
              setIcebreakers((prev) => [...prev, { prompt, answer: "" }]);
              setEditingPromptIndex(newIdx);
              setSubView("answer-prompt");
            }}
            className="w-full text-left p-4 rounded-xl hover:bg-hover transition-colors text-sm font-bold text-foreground"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background lg:bg-background lg:flex lg:items-center lg:justify-center relative overflow-hidden lg:p-10">
      <div className="hidden lg:block absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full bg-primary/15 blur-[120px] pointer-events-none" />
      <div className="hidden lg:block absolute bottom-1/4 -right-32 w-[500px] h-[500px] rounded-full bg-secondary/20 blur-[100px] pointer-events-none" />

      <div className="relative w-full h-full lg:h-[720px] lg:max-w-[900px] lg:rounded-3xl lg:shadow-2xl overflow-hidden flex bg-background lg:border lg:border-border">
        {/* Full-width Location View (900px container wide) */}
        {subView === "location" && (
          <div className="absolute inset-0 z-[100] bg-background">
            <LocationPicker
              initialLocation={location}
              onSave={(loc) => {
                setLocation(loc);
                setSubView("none");
              }}
              onBack={() => setSubView("none")}
            />
          </div>
        )}

        {/* Left column (420px fixed on desktop) */}
        <div className="w-full lg:w-[420px] shrink-0 overflow-hidden relative border-r border-border">
          {/* Column-restricted Editors */}
          {(subView === "bio" || subView === "answer-prompt") &&
            renderBioEditor()}
          {subView === "prompt-picker" && renderPromptPicker()}

          <FormPageLayout
            header={header}
            footer={footer}
            scrollKey={step}
            fitted={isDesktop}
          >
            <div className="px-1">
              {step === 0 && (
                <div className="animate-slide-up pt-4">
                  <Input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter first name"
                    maxLength={MAX_NAME_LEN}
                    autoFocus
                    className="h-14 text-2xl font-bold bg-transparent border-0 border-b-2 border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary transition-all placeholder:text-muted-foreground/30 text-foreground"
                  />
                </div>
              )}
              {step === 1 && (
                <div className="animate-slide-up pt-4">
                  <GenderPicker
                    value={gender}
                    onChange={(v) => {
                      setGender(v);
                      setError(null);
                    }}
                  />
                </div>
              )}
              {step === 2 && (
                <div className="animate-slide-up pt-4">
                  <GenderPreferencePicker
                    value={genderPreference}
                    onChange={setGenderPreference}
                  />
                </div>
              )}
              {step === 3 && (
                <div className="animate-slide-up pt-4">
                  <div className="flex items-center gap-4 text-2xl font-bold text-foreground">
                    <Input
                      value={bMonth}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                        setBMonth(v);
                        if (v.length === 2)
                          document.getElementById("bday-day")?.focus();
                      }}
                      onKeyDown={handleKeyDown}
                      id="bday-month"
                      placeholder="MM"
                      className="w-16 h-14 p-0 text-center bg-transparent border-0 border-b-2 border-border rounded-none focus-visible:ring-0 focus-visible:border-primary text-foreground"
                    />
                    <span className="opacity-20">/</span>
                    <Input
                      value={bDay}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                        setBDay(v);
                        if (v.length === 2)
                          document.getElementById("bday-year")?.focus();
                      }}
                      onKeyDown={handleKeyDown}
                      id="bday-day"
                      placeholder="DD"
                      className="w-16 h-14 p-0 text-center bg-transparent border-0 border-b-2 border-border rounded-none focus-visible:ring-0 focus-visible:border-primary text-foreground"
                    />
                    <span className="opacity-20">/</span>
                    <Input
                      value={bYear}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      onChange={(e) =>
                        setBYear(e.target.value.replace(/\D/g, "").slice(0, 4))
                      }
                      onKeyDown={handleKeyDown}
                      id="bday-year"
                      placeholder="YYYY"
                      className="w-24 h-14 p-0 text-center bg-transparent border-0 border-b-2 border-border rounded-none focus-visible:ring-0 focus-visible:border-primary text-foreground"
                    />
                  </div>
                  {birthdayHint && (
                    <p className="mt-3 text-sm text-destructive font-medium animate-fade-in">
                      {birthdayHint}
                    </p>
                  )}
                </div>
              )}
              {step === 4 && (
                <div className="flex flex-col gap-10 animate-slide-up pt-4">
                  <div className="space-y-3">
                    {location ? (
                      <div
                        className="flex items-center gap-2 h-14 border-b-2 border-primary/20 cursor-pointer"
                        onClick={() => setSubView("location")}
                      >
                        <MapPin className="w-5 h-5 text-primary" />
                        <span className="text-xl font-bold flex-1 truncate text-foreground">
                          {location.city}
                        </span>
                        <Check className="w-5 h-5 text-primary" />
                      </div>
                    ) : (
                      <button
                        onClick={() => setSubView("location")}
                        className="w-full h-14 border-b-2 border-border text-xl font-bold text-foreground/40 hover:text-primary transition-all flex items-center justify-start gap-3"
                      >
                        <MapPin className="w-5 h-5" />
                        Select your city
                      </button>
                    )}
                  </div>
                  <div className="space-y-8 px-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-bold text-foreground">
                        Distance Preference
                      </Label>
                      <span className="text-base font-bold text-primary">
                        {distancePreference} mi
                      </span>
                    </div>
                    <Slider
                      value={[distancePreference]}
                      onValueChange={([v]) => setDistancePreference(v)}
                      max={100}
                      min={2}
                      className="w-full"
                    />
                    <p className="text-center text-xs text-muted-foreground opacity-60">
                      You can change preferences later in Settings
                    </p>
                  </div>
                </div>
              )}
              {step === 5 && (
                <div className="pt-2">
                  <InterestPicker
                    selected={interests}
                    onChange={(v) => {
                      setInterests(v);
                      setError(null);
                    }}
                  />
                </div>
              )}
              {step === 6 && (
                <div className="flex flex-col gap-6 animate-slide-up pt-4">
                  <button
                    onClick={() => setSubView("bio")}
                    className={cn(
                      "w-full rounded-3xl border-2 border-dashed p-6 text-left transition-all relative group",
                      bio
                        ? "border-primary/30 bg-primary/5"
                        : "border-border hover:border-primary/20",
                    )}
                  >
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-bold text-foreground">
                        About me
                      </span>
                      <p
                        className={cn(
                          "text-sm leading-relaxed",
                          bio ? "text-foreground/70" : "text-foreground/30",
                        )}
                      >
                        {bio ||
                          "Share your interests, values, and what you are looking for."}
                      </p>
                    </div>
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-primary shadow-sm">
                      {bio ? (
                        <X
                          className="w-4 h-4 text-foreground/60"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBio("");
                          }}
                        />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                  {icebreakers.map((ib, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setEditingPromptIndex(i);
                        setSubView("answer-prompt");
                      }}
                      className="w-full rounded-3xl border-2 border-primary/30 bg-primary/5 p-6 text-left relative group"
                    >
                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm font-bold text-foreground">
                          {ib.prompt}
                        </span>
                        <p className="text-sm text-foreground/70 italic line-clamp-2 leading-relaxed">
                          "{ib.answer}"
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIcebreakers((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          );
                        }}
                        className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-foreground/60 shadow-sm hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </button>
                  ))}
                  {/* Show prompt selector only if we haven't reached the limit AND the last one is answered */}
                  {icebreakers.length < MAX_ICEBREAKERS &&
                    (icebreakers.length === 0 ||
                      icebreakers[icebreakers.length - 1].answer.trim() !==
                        "") && (
                      <button
                        onClick={() => setSubView("prompt-picker")}
                        className="w-full rounded-3xl border-2 border-dashed border-border p-6 text-left hover:border-primary/20 group relative"
                      >
                        <div className="flex flex-col gap-1.5">
                          <span className="text-sm font-bold text-foreground">
                            Select a prompt
                          </span>
                          <p className="text-sm text-foreground/30">
                            Answer a prompt to show off your personality.
                          </p>
                        </div>
                        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-primary shadow-sm">
                          <Plus className="w-4 h-4" />
                        </div>
                      </button>
                    )}
                </div>
              )}
              {step === 7 && (
                <div className="flex flex-col items-center gap-6 animate-slide-up">
                  <PhotoUpload
                    previewUrls={photoPreviewUrls}
                    onFilesSelected={(newFiles) => {
                      const urls = newFiles.map((f) => URL.createObjectURL(f));
                      setPhotoFiles((prev) => [...prev, ...newFiles]);
                      setPhotoPreviewUrls((prev) => [...prev, ...urls]);
                    }}
                    onRemove={(idx) => {
                      setPhotoFiles((prev) => prev.filter((_, i) => i !== idx));
                      setPhotoPreviewUrls((prev) => {
                        const url = prev[idx];
                        if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
                        return prev.filter((_, i) => i !== idx);
                      });
                    }}
                    isUploading={
                      isPending &&
                      photoFiles.length > 0 &&
                      uploadProgress > 0 &&
                      uploadProgress < 100
                    }
                  />
                  {isPending && photoFiles.length > 0 && (
                    <p className="text-sm text-muted-foreground font-medium">
                      Uploading {photoFiles.length} photos...{" "}
                      {Math.round(uploadProgress)}%
                    </p>
                  )}
                </div>
              )}
            </div>
          </FormPageLayout>
        </div>

        {/* Right Preview Column */}
        <div className="hidden lg:flex flex-1 bg-card items-center justify-center p-10">
          {stepVisual}
        </div>
      </div>
    </div>
  );
}
