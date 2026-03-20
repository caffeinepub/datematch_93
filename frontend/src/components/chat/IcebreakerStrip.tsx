import { MessageCircle } from "lucide-react";

interface Icebreaker {
  prompt: string;
  answer: string;
}

interface IcebreakerStripProps {
  icebreakers: Icebreaker[];
  onSelect: (text: string) => void;
  partnerName: string;
}

export function IcebreakerStrip({
  icebreakers,
  onSelect,
  partnerName,
}: IcebreakerStripProps) {
  if (icebreakers.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 px-4 py-4 animate-slide-up">
      <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
        <MessageCircle className="w-3.5 h-3.5" />
        Break the ice
      </div>

      <div className="flex flex-col gap-2">
        {icebreakers.map((ib, i) => (
          <button
            key={i}
            onClick={() => {
              const cleanedPrompt = ib.prompt.replace(/\.\.\.$/, "");
              onSelect(
                `Hey! Your answer to "${cleanedPrompt}" — ${ib.answer.slice(0, 30)}${ib.answer.length > 30 ? "..." : ""}... tell me more!`,
              );
            }}
            className="flex flex-col gap-1 text-left p-4 rounded-2xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors group active:scale-[0.98]"
          >
            <span className="text-[11px] text-muted-foreground leading-tight group-hover:text-primary/70 transition-colors">
              {ib.prompt}
            </span>
            <span className="text-sm font-medium text-foreground leading-tight">
              {ib.answer}
            </span>
          </button>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        Tapping a card will pre-fill your message
      </p>
    </div>
  );
}
