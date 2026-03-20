import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormPageLayoutProps {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
  // Reset scroll to top when this key changes (e.g., step number)
  scrollKey?: unknown;
  // When true, fill parent height instead of using 100dvh (for desktop column layouts)
  fitted?: boolean;
}

export function FormPageLayout({
  header,
  footer,
  children,
  scrollKey,
  fitted,
}: FormPageLayoutProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showHint, setShowHint] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowHint(el.scrollHeight > el.clientHeight + el.scrollTop + 24);
  }, []);

  // Re-check whenever content or step changes
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = 0;
    }
    // Small delay so content has rendered before measuring
    const id = setTimeout(checkScroll, 50);
    return () => clearTimeout(id);
  }, [scrollKey]);

  useEffect(() => {
    checkScroll();
  });

  return (
    <div
      className="flex flex-col bg-background overflow-hidden"
      style={fitted ? { height: "100%" } : { height: "100dvh" }}
    >
      <div
        className={cn(
          "flex flex-col h-full w-full overflow-hidden bg-background",
          !fitted && "lg:max-w-[480px] lg:mx-auto lg:border-x lg:border-border",
        )}
      >
        {/* Fixed header */}
        <div className={cn("shrink-0 relative", !fitted ? "pt-6" : "pt-4")}>
          {header}
        </div>

        {/* Scrollable middle */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={scrollRef}
            className="h-full overflow-y-auto px-6 pb-6"
            onScroll={checkScroll}
          >
            {children}
          </div>

          {/* Scroll hint — fades out as user scrolls down */}
          {showHint && (
            <div className="absolute bottom-0 inset-x-0 pointer-events-none">
              <div className="h-14 bg-gradient-to-t from-background to-transparent" />
              <div className="absolute bottom-2 inset-x-0 flex justify-center animate-bounce">
                <div className="flex flex-col items-center gap-0 opacity-40">
                  <ChevronDown className="w-4 h-4" />
                  <ChevronDown className="w-4 h-4 -mt-2.5" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fixed footer */}
        <div className="shrink-0">{footer}</div>
      </div>
    </div>
  );
}
