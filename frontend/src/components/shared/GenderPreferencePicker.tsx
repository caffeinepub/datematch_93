import { cn } from "@/lib/utils";

export const GENDER_PREF_OPTIONS = [
  { value: "male", label: "Men", symbol: "♂" },
  { value: "female", label: "Women", symbol: "♀" },
  { value: "other", label: "Non-binary", symbol: "⚧" },
];

export const GENDER_PREF_LABELS: Record<string, string> = {
  male: "Men",
  female: "Women",
  other: "Non-binary people",
};

interface GenderPreferencePickerProps {
  value: string[];
  onChange: (genders: string[]) => void;
}

export function GenderPreferencePicker({
  value,
  onChange,
}: GenderPreferencePickerProps) {
  const toggle = (g: string) => {
    if (value.includes(g)) {
      onChange(value.filter((v) => v !== g));
    } else {
      onChange([...value, g]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {GENDER_PREF_OPTIONS.map((g) => (
          <button
            key={g.value}
            type="button"
            onClick={() => toggle(g.value)}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl border-2 transition-all active:scale-95",
              value.includes(g.value)
                ? "border-primary bg-primary/8 text-primary"
                : "border-border bg-background text-foreground hover:border-primary/40",
            )}
          >
            <span className="text-2xl leading-none">{g.symbol}</span>
            <span className="text-sm font-medium">{g.label}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        Select all that apply. Leave empty to connect with everyone.
      </p>
    </div>
  );
}
