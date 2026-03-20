import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Search,
  Loader2,
  X,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface Location {
  lat: number;
  lng: number;
  city: string;
}

interface LocationPickerProps {
  initialLocation?: Location | null;
  onSave: (location: Location) => void;
  onBack: () => void;
}

declare global {
  interface Window {
    L: any;
  }
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
  };
}

function cityFromResult(result: NominatimResult): string {
  return (
    result.address?.city ??
    result.address?.town ??
    result.address?.village ??
    result.display_name.split(",")[0]
  );
}

export function LocationPicker({
  initialLocation,
  onSave,
  onBack,
}: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isDesktop = !useIsMobile(1024);

  const [selectedLocation, setSelectedLocation] = useState<Location>(
    initialLocation || { lat: 40.7128, lng: -74.006, city: "New York" },
  );
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(!!window.L);

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  // Load Leaflet dynamically
  useEffect(() => {
    if (window.L) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setIsLeafletLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isLeafletLoaded || !mapContainerRef.current || mapRef.current) return;

    const L = window.L;
    const initialPos: [number, number] = [
      selectedLocation.lat,
      selectedLocation.lng,
    ];

    mapRef.current = L.map(mapContainerRef.current, {
      center: initialPos,
      zoom: 13,
      zoomControl: false,
    });

    const tileLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "© OpenStreetMap contributors",
      },
    ).addTo(mapRef.current);

    // Add dark mode filter if needed (simple CSS filter on the tile layer)
    const container = mapContainerRef.current;
    if (container) {
      container.classList.add(
        "dark:invert",
        "dark:grayscale",
        "dark:brightness-[0.7]",
        "dark:contrast-[0.9]",
      );
    }

    markerRef.current = L.marker(initialPos, {
      draggable: true,
      icon: L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    }).addTo(mapRef.current);

    markerRef.current.on("dragend", () => {
      const pos = markerRef.current.getLatLng();
      reverseGeocode(pos.lat, pos.lng);
    });

    mapRef.current.on("click", (e: any) => {
      const { lat, lng } = e.latlng;
      markerRef.current.setLatLng([lat, lng]);
      reverseGeocode(lat, lng);
    });

    L.control.zoom({ position: "bottomright" }).addTo(mapRef.current);
  }, [isLeafletLoaded]);

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { "Accept-Language": "en" } },
      );
      const data = await res.json();
      const city =
        data.address?.city ??
        data.address?.town ??
        data.address?.village ??
        data.address?.state ??
        "Selected Location";
      setSelectedLocation({ lat, lng, city });
    } catch {
      setSelectedLocation({ lat, lng, city: "Custom Location" });
    } finally {
      setIsGeocoding(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
          { headers: { "Accept-Language": "en" } },
        );
        const data: NominatimResult[] = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const openSearch = () => {
    setIsSearchOpen(true);
    setQuery("");
    setResults([]);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setQuery("");
    setResults([]);
  };

  const selectResult = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const city = cityFromResult(result);
    setSelectedLocation({ lat, lng, city });
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 13);
      markerRef.current?.setLatLng([lat, lng]);
    }
    closeSearch();
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 13);
          markerRef.current?.setLatLng([latitude, longitude]);
        }
        reverseGeocode(latitude, longitude);
        setIsDetecting(false);
        closeSearch();
      },
      () => setIsDetecting(false),
    );
  };

  const glassBase =
    "bg-background backdrop-blur-md border border-border shadow-lg rounded-2xl";

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div
        className={cn(
          "shrink-0 flex items-center gap-3 px-4 pb-4 border-b border-border bg-background z-20",
          "pt-4",
        )}
      >
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-hover transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold flex-1">Set Location</h1>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-secondary/10">
        {/* ... map content ... */}
        {!isLeafletLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10 bg-background/50">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              Loading Map...
            </p>
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Overlay: currently pointing to card / search */}
        <div className="absolute top-4 left-4 right-4 z-[1001] flex flex-col gap-1.5">
          {isSearchOpen ? (
            <>
              {/* Search input */}
              <div
                className={cn(glassBase, "flex items-center gap-2 px-3 h-12")}
              >
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for a city or place..."
                  className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                />
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
                ) : (
                  <button
                    type="button"
                    onClick={closeSearch}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Results list */}
              {(results.length > 0 || !query.trim()) && (
                <div className={cn(glassBase, "overflow-hidden")}>
                  {results.map((result, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectResult(result)}
                      className="w-full px-4 py-3 text-left hover:bg-primary/5 transition-colors border-b border-border last:border-0 flex items-start gap-3"
                    >
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-sm leading-snug line-clamp-2">
                        {result.display_name}
                      </span>
                    </button>
                  ))}
                  {/* Use current location */}
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={isDetecting}
                    className="w-full px-4 py-3 text-left hover:bg-primary/5 transition-colors flex items-center gap-3"
                  >
                    {isDetecting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                    ) : (
                      <Navigation className="w-4 h-4 text-primary shrink-0" />
                    )}
                    <span className="text-sm text-primary font-medium">
                      {isDetecting ? "Detecting..." : "Use my current location"}
                    </span>
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Currently pointing to — clickable to open search */
            <button
              type="button"
              onClick={openSearch}
              className={cn(
                glassBase,
                "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/5 transition-colors",
              )}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold leading-none mb-0.5">
                  Currently pointing to
                </p>
                <p className="text-sm font-semibold truncate leading-tight">
                  {isGeocoding ? "Identifying..." : selectedLocation.city}
                </p>
              </div>
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className={cn(
          "shrink-0 p-6 bg-background border-t border-border z-20",
          isDesktop ? "pb-6" : "pb-10",
        )}
      >
        <Button
          className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
          onClick={() => onSave(selectedLocation)}
          disabled={isGeocoding}
        >
          {isGeocoding ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Pinning Location...
            </>
          ) : (
            "Confirm Location"
          )}
        </Button>
      </div>
    </div>
  );
}
