import { cn } from "@/lib/utils";

const GENDERS = [
  { value: "male", label: "Man", symbol: "♂" },
  { value: "female", label: "Woman", symbol: "♀" },
  { value: "other", label: "Other", symbol: "⚧" },
];

interface GenderPickerProps {
  value: string;
  onChange: (gender: string) => void;
}

export function GenderPicker({ value, onChange }: GenderPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {GENDERS.map((g) => (
        <button
          key={g.value}
          type="button"
          onClick={() => onChange(g.value)}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl border-2 transition-all active:scale-95",
            value === g.value
              ? "border-primary bg-primary/8 text-primary"
              : "border-border bg-background text-foreground hover:border-primary/40",
          )}
        >
          <span className="text-2xl leading-none">{g.symbol}</span>
          <span className="text-sm font-medium">{g.label}</span>
        </button>
      ))}
    </div>
  );
}
