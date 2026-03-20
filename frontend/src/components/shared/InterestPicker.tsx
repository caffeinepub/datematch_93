import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { INTEREST_CATEGORIES, MAX_INTERESTS } from "../../utils/constants";

interface InterestPickerProps {
  selected: string[];
  onChange: (interests: string[]) => void;
}

// Icons matching categories in constants.ts
const CATEGORY_ICONS: Record<string, string> = {
  Outdoors: "🏔️",
  "Sports & Fitness": "💪",
  "Team Sports": "⚽",
  "Mind Sports": "🧠",
  "Food & Drink": "🍱",
  "Arts & Culture": "🎨",
  Music: "🎵",
  Entertainment: "🕹️",
  Lifestyle: "🧘",
  Pets: "🐕",
};

export function InterestPicker({ selected, onChange }: InterestPickerProps) {
  const [expanded, setExpanded] = useState<string[]>([]);

  const toggleCategory = (name: string) => {
    setExpanded((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const toggleInterest = (interest: string) => {
    if (selected.includes(interest)) {
      onChange(selected.filter((i) => i !== interest));
    } else if (selected.length < MAX_INTERESTS) {
      onChange([...selected, interest]);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {INTEREST_CATEGORIES.map((category) => {
        const isExpanded = expanded.includes(category.name);
        // Show 2 rows initially (approx 8 items)
        const visibleItems = isExpanded
          ? category.items
          : category.items.slice(0, 8);
        const icon = CATEGORY_ICONS[category.name] || "✨";

        return (
          <div key={category.name} className="animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">{icon}</span>
              <p className="text-sm font-bold text-foreground">
                {category.name}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 transition-all">
              {visibleItems.map((interest) => {
                const isSelected = selected.includes(interest);
                const isDisabled =
                  !isSelected && selected.length >= MAX_INTERESTS;
                return (
                  <button
                    key={interest}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => toggleInterest(interest)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium border transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95",
                      isSelected
                        ? "bg-primary/5 text-primary border-primary shadow-sm"
                        : "bg-background text-foreground border-border hover:border-primary/40 hover:bg-primary/5",
                      isDisabled &&
                        "opacity-30 cursor-not-allowed active:scale-100",
                    )}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>

            {category.items.length > 8 && (
              <button
                onClick={() => toggleCategory(category.name)}
                className="mt-4 w-full flex items-center justify-center gap-2 py-1.5 border-b border-border text-xs font-bold text-muted-foreground hover:text-foreground transition-all group"
              >
                {isExpanded ? (
                  <>
                    <span>Show less</span>
                    <ChevronUp className="w-3 h-3 transition-transform group-hover:-translate-y-0.5" />
                  </>
                ) : (
                  <>
                    <span>Show more</span>
                    <ChevronDown className="w-3 h-3 transition-transform group-hover:translate-y-0.5" />
                  </>
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
