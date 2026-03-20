import { Heart, Smile, Hand, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandingPageProps {
  onLogin: () => void;
  isLoggingIn?: boolean;
}

const GUIDELINES = [
  {
    icon: Smile,
    title: "Be authentic.",
    desc: "Your photos and bio should represent the real you.",
  },
  {
    icon: Heart,
    title: "Stay kind.",
    desc: "Treat others the way you'd want to be treated.",
  },
  {
    icon: Hand,
    title: "Respect boundaries.",
    desc: "Take no for an answer, always.",
  },
  {
    icon: Lock,
    title: "Keep it safe.",
    desc: "Never share personal info too early.",
  },
];

export function LandingPage({ onLogin, isLoggingIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-6 py-12 overflow-y-auto">
      {/* Spacer */}
      <div className="flex-1 min-h-[40px]" />

      {/* Center content */}
      <div className="flex flex-col items-center text-center gap-8 lg:gap-10 w-full max-w-[360px] lg:max-w-2xl">
        {/* App icon + name */}
        <div className="flex items-center gap-2.5 lg:gap-3">
          <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-[13px] lg:rounded-[18px] bg-primary flex items-center justify-center shadow-md shadow-primary/30">
            <Heart className="w-5 h-5 lg:w-7 lg:h-7 text-white fill-white" />
          </div>
          <span className="text-lg lg:text-2xl font-bold text-foreground tracking-tight">
            DateMatch
          </span>
        </div>

        {/* Headline */}
        <div className="space-y-1 lg:space-y-2">
          <h1 className="text-4xl lg:text-7xl font-black text-foreground leading-[1.1] tracking-tight">
            Find your perfect
          </h1>
          <h1 className="text-4xl lg:text-7xl font-bold text-primary leading-[1.1] font-serif italic">
            match.
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-sm lg:text-lg text-muted-foreground leading-relaxed max-w-[240px] lg:max-w-none lg:whitespace-nowrap">
          Real people, real connections. Swipe, match, and chat.
        </p>

        {/* CTA */}
        <Button
          onClick={onLogin}
          disabled={isLoggingIn}
          className="w-full lg:w-auto lg:px-12 h-12 lg:h-14 rounded-2xl text-sm lg:text-base font-bold shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoggingIn ? "Signing in…" : "Sign in with Internet Identity"}
        </Button>

        {/* Guidelines — secondary section */}
        <div className="w-full pt-6 lg:pt-8 border-t border-border">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.18em] mb-5 lg:mb-6">
            Community guidelines
          </p>
          <ul className="flex flex-col gap-4 text-left lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-5">
            {GUIDELINES.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3.5">
                <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm lg:text-base font-semibold text-foreground leading-snug">
                    {title}
                  </p>
                  <p className="text-xs lg:text-sm text-muted-foreground leading-relaxed mt-0.5">
                    {desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1 min-h-[40px]" />

      {/* Caffeine footer */}
      <footer className="pt-8 pb-2">
        <p className="text-[11px] lg:text-xs text-muted-foreground text-center">
          © 2026. Built with{" "}
          <Heart className="inline-block w-3 h-3 text-primary fill-primary align-middle mx-0.5" />{" "}
          using{" "}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline underline-offset-2"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
