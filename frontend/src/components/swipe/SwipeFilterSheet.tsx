import { useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Search, X, ChevronsDown, ChevronsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { INTEREST_CATEGORIES, MIN_AGE, MAX_AGE } from "../../utils/constants";
import { kmToMiles, milesToKm } from "../../utils/formatting";

export type SwipeFilters = {
  interests: string[];
  // null = no override, use saved prefs
  ageRange: [number, number] | null;
  radiusKm: number | null;
};

interface SwipeFilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: SwipeFilters;
  onApply: (filters: SwipeFilters) => void;
  savedAgeMin: number;
  savedAgeMax: number;
  savedRadiusKm: number;
  hasLocation: boolean;
}

type SheetDraft = {
  interests: string[];
  ageMin: number;
  ageMax: number;
  radiusMi: number;
};

export function SwipeFilterSheet({
  open,
  onClose,
  filters,
  onApply,
  savedAgeMin,
  savedAgeMax,
  savedRadiusKm,
  hasLocation,
}: SwipeFilterSheetProps) {
  const savedRadiusMi = Math.round(kmToMiles(savedRadiusKm));
  const filterRadiusMi =
    filters.radiusKm != null ? Math.round(kmToMiles(filters.radiusKm)) : null;

  const [draft, setDraft] = useState<SheetDraft>({
    interests: filters.interests,
    ageMin: filters.ageRange?.[0] ?? savedAgeMin,
    ageMax: filters.ageRange?.[1] ?? savedAgeMax,
    radiusMi: filterRadiusMi ?? savedRadiusMi,
  });
  const [search, setSearch] = useState("");
  const isDesktop = !useIsMobile(1024);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 10);
    setCanScrollDown(el.scrollTop < el.scrollHeight - el.clientHeight - 10);
  };

  // Sync draft when sheet opens
  useEffect(() => {
    if (open) {
      setDraft({
        interests: filters.interests,
        ageMin: filters.ageRange?.[0] ?? savedAgeMin,
        ageMax: filters.ageRange?.[1] ?? savedAgeMax,
        radiusMi: filterRadiusMi ?? savedRadiusMi,
      });
      setSearch("");
      // Re-check scroll after content settles
      setTimeout(checkScroll, 50);
    }
  }, [open]);

  const toggleInterest = (interest: string) => {
    setDraft((d) => ({
      ...d,
      interests: d.interests.includes(interest)
        ? d.interests.filter((i) => i !== interest)
        : [...d.interests, interest],
    }));
  };

  const handleReset = () => {
    setDraft({
      interests: [],
      ageMin: savedAgeMin,
      ageMax: savedAgeMax,
      radiusMi: savedRadiusMi,
    });
  };

  const handleApply = () => {
    onApply({
      interests: draft.interests,
      ageRange:
        draft.ageMin !== savedAgeMin || draft.ageMax !== savedAgeMax
          ? [draft.ageMin, draft.ageMax]
          : null,
      radiusKm:
        draft.radiusMi !== savedRadiusMi
          ? Math.round(milesToKm(draft.radiusMi))
          : null,
    });
    onClose();
  };

  const visibleCategories = search.trim()
    ? INTEREST_CATEGORIES.map((cat) => ({
        ...cat,
        items: cat.items.filter((item) =>
          item.toLowerCase().includes(search.toLowerCase()),
        ),
      })).filter((cat) => cat.items.length > 0)
    : INTEREST_CATEGORIES;

  const activeCount =
    (draft.interests.length > 0 ? 1 : 0) +
    (draft.ageMin !== savedAgeMin || draft.ageMax !== savedAgeMax ? 1 : 0) +
    (hasLocation && draft.radiusMi !== savedRadiusMi ? 1 : 0);

  const filterHeader = (isMobile: boolean) => (
    <div
      className={cn(
        "flex items-center shrink-0",
        isMobile ? "px-5 pt-2 pb-4" : "px-6 py-4",
      )}
    >
      <button
        onClick={handleReset}
        className="text-sm font-semibold text-primary hover:text-primary/70 transition-colors w-14 text-left"
      >
        Reset
      </button>
      {isMobile ? (
        <SheetTitle className="flex-1 text-center text-base font-bold">
          Filters
        </SheetTitle>
      ) : (
        <DialogTitle className="flex-1 text-center text-base font-bold">
          Filters
        </DialogTitle>
      )}
      <button
        onClick={onClose}
        className="w-14 flex justify-end text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );

  const filterBody = (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
      {/* Top scroll indicator */}
      {canScrollUp && (
        <div className="absolute top-0 left-0 right-0 h-12 pointer-events-none z-10 flex items-start justify-center pt-1.5 bg-gradient-to-b from-background to-transparent">
          <ChevronsUp className="w-4 h-4 text-muted-foreground/40" />
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex-1 overflow-y-auto px-6 pb-4"
      >
        {/* Interests */}
        <section className="pt-5 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/70">
              Interests
            </h3>
            {draft.interests.length > 0 && (
              <span className="text-xs font-semibold text-primary">
                {draft.interests.length} selected
              </span>
            )}
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              placeholder="Search interests…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 h-10 rounded-xl !bg-muted text-foreground placeholder:text-muted-foreground border-0 outline-none focus:ring-1 focus:ring-primary/30 text-sm"
            />
          </div>
          <div className="space-y-5">
            {visibleCategories.map((cat) => (
              <div key={cat.name}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-2.5 pl-0.5">
                  {cat.name}
                </p>
                <div className="flex flex-wrap gap-2">
                  {cat.items.map((interest) => {
                    const isSelected = draft.interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={cn(
                          "px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 active:scale-95",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-primary/5",
                        )}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {visibleCategories.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No interests match "{search}"
              </p>
            )}
          </div>
        </section>

        {/* Age range */}
        <section className="pb-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/70">
              Age Range
            </h3>
            <span className="text-sm font-black text-foreground bg-muted px-3 py-1 rounded-full tabular-nums">
              {draft.ageMin} – {draft.ageMax}
            </span>
          </div>
          <Slider
            min={MIN_AGE}
            max={MAX_AGE}
            step={1}
            value={[draft.ageMin, draft.ageMax]}
            onValueChange={([min, max]) =>
              setDraft((d) => ({ ...d, ageMin: min, ageMax: max }))
            }
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2.5">
            <span>{MIN_AGE} yrs</span>
            <span>{MAX_AGE} yrs</span>
          </div>
        </section>

        {/* Radius — only if user has a location set */}
        {hasLocation && (
          <section className="pb-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/70">
                Distance
              </h3>
              <span className="text-sm font-black text-foreground bg-muted px-3 py-1 rounded-full tabular-nums">
                {draft.radiusMi} mi
              </span>
            </div>
            <Slider
              min={1}
              max={100}
              step={1}
              value={[draft.radiusMi]}
              onValueChange={([v]) => setDraft((d) => ({ ...d, radiusMi: v }))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2.5">
              <span>1 mi</span>
              <span>100 mi</span>
            </div>
          </section>
        )}
      </div>

      {/* Bottom scroll indicator + gradient blur */}
      {canScrollDown && (
        <div className="absolute bottom-0 left-0 right-0 h-14 pointer-events-none z-10 flex items-end justify-center pb-2 bg-gradient-to-t from-background to-transparent">
          <ChevronsDown className="w-4 h-4 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );

  const filterFooter = (
    <div className="shrink-0 px-5 py-4 bg-background">
      <Button
        onClick={handleApply}
        className="w-full h-12 rounded-2xl text-base font-bold shadow-sm shadow-primary/20"
      >
        {activeCount > 0
          ? `Apply · ${activeCount} filter${activeCount > 1 ? "s" : ""} active`
          : "Apply Filters"}
      </Button>
    </div>
  );

  // Mobile: bottom sheet
  if (!isDesktop) {
    return (
      <Sheet
        open={open}
        onOpenChange={(v) => {
          if (!v) onClose();
        }}
      >
        <SheetContent
          side="bottom"
          className="rounded-t-3xl max-h-[85vh] flex flex-col p-0 gap-0 [&>button]:hidden"
        >
          <div className="w-10 h-1 rounded-full bg-border mx-auto mt-4 mb-0 shrink-0" />
          <div className="shrink-0">{filterHeader(true)}</div>
          {filterBody}
          {filterFooter}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: centered Dialog modal
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="border-border max-w-[500px] h-[82vh] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl"
      >
        <div className="shrink-0">{filterHeader(false)}</div>
        {filterBody}
        {filterFooter}
      </DialogContent>
    </Dialog>
  );
}
