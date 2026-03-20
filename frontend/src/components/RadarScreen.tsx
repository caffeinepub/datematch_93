import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { useMatchesCount } from "../hooks/useQueries";

interface RadarScreenProps {
  location: { lat: number; lng: number; city: string };
  radius: number;
  onFinish: () => void;
  scanningText?: string;
  foundText?: string;
}

export function RadarScreen({
  location,
  radius,
  onFinish,
  scanningText,
  foundText,
}: RadarScreenProps) {
  const { data: count, isLoading } = useMatchesCount(location, radius);
  const [phase, setPhase] = useState<"scanning" | "found">("scanning");
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase("found");
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (phase !== "found") return;
    const exitTimer = setTimeout(() => {
      onFinishRef.current();
    }, 2000);
    return () => clearTimeout(exitTimer);
  }, [phase]);

  return (
    <div className="absolute inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="relative w-64 h-64 mb-12 flex items-center justify-center">
        {/* Animated Radar Rings */}
        <div
          className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping"
          style={{ animationDuration: "3s" }}
        />
        <div
          className="absolute inset-0 rounded-full border-2 border-primary/10 animate-ping"
          style={{ animationDuration: "3s", animationDelay: "1s" }}
        />
        <div
          className="absolute inset-0 rounded-full border-2 border-primary/5 animate-ping"
          style={{ animationDuration: "3s", animationDelay: "2s" }}
        />

        {/* Radar Line Sweep (Simulated via rotating gradient) */}
        <div className="absolute inset-2 rounded-full border border-primary/30 overflow-hidden">
          <div
            className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0%,rgba(var(--primary),0.2)_100%)] animate-spin"
            style={{ animationDuration: "4s" }}
          />
        </div>

        {/* Center Point */}
        <div className="relative z-10 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.5)]">
          <MapPin className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>

      <div className="max-w-xs animate-slide-up">
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          {phase === "scanning"
            ? (scanningText ?? "Scanning your area...")
            : (foundText ?? "Discovery updated!")}
        </h2>

        <p className="text-muted-foreground mb-6">
          Searching within {radius}km of {location.city}
        </p>

        <div className="h-10 flex items-center justify-center">
          {phase === "scanning" || isLoading ? (
            <div className="flex items-center gap-2 text-primary font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking for singles...
            </div>
          ) : (
            <div className="text-xl font-bold text-primary animate-scale-in">
              {Number(count)} matches found nearby!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
