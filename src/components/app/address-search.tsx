"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  getDevicePosition,
  isMapboxConfigured,
  retrieveAddress,
  suggestAddresses,
  type MapboxSelectedAddress,
  type MapboxSuggestion,
} from "@/lib/mapbox";
import { cn } from "@/lib/utils";

type AddressSearchProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: MapboxSelectedAddress) => void;
  selected: boolean;
  className?: string;
};

export function AddressSearch({
  value,
  onChange,
  onSelect,
  selected,
  className,
}: AddressSearchProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [suggestions, setSuggestions] = useState<MapboxSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [proximity, setProximity] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [nearBanner, setNearBanner] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const configured = isMapboxConfigured();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const runSuggest = useCallback(
    async (q: string, prox = proximity) => {
      if (!configured) return;
      if (q.trim().length < 2) {
        setSuggestions([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const list = await suggestAddresses(q, prox);
        setSuggestions(list);
        setOpen(list.length > 0);
      } catch (err) {
        setSuggestions([]);
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setLoading(false);
      }
    },
    [configured, proximity],
  );

  function handleInput(next: string) {
    onChange(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSuggest(next);
    }, 280);
  }

  async function pickSuggestion(s: MapboxSuggestion) {
    setLoading(true);
    setError(null);
    try {
      const place = await retrieveAddress(s.mapboxId);
      if (!place) {
        setError("Could not load that location.");
        return;
      }
      onSelect(place);
      setSuggestions([]);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not select location");
    } finally {
      setLoading(false);
    }
  }

  async function useMyLocation() {
    setLocating(true);
    setNearBanner(true);
    setError(null);
    try {
      const pos = await getDevicePosition();
      if (!pos) {
        setError("Location permission denied or unavailable.");
        setNearBanner(false);
        return;
      }
      setProximity(pos);
      if (value.trim().length >= 2) {
        await runSuggest(value, pos);
      } else {
        await runSuggest("Tuobodom", pos);
      }
      setTimeout(() => setNearBanner(false), 1800);
    } finally {
      setLocating(false);
    }
  }

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        <Input
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          placeholder="Search delivery location"
          className="bg-bg pl-10 pr-11"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => void useMyLocation()}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-primary transition hover:bg-primary-light"
          aria-label="Use current location"
          title="Use current location"
        >
          {locating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
        </button>
      </div>

      {nearBanner && (
        <p className="mt-1.5 text-[11px] font-medium text-primary animate-fade-up">
          Searching near your location...
        </p>
      )}

      {!configured && (
        <p className="mt-1.5 text-[11px] text-muted">
          Add NEXT_PUBLIC_MAPBOX_TOKEN to enable address search.
        </p>
      )}

      {error && (
        <p className="mt-1.5 text-[11px] text-danger">{error}</p>
      )}

      {selected && value && (
        <p className="mt-1.5 text-[11px] font-medium text-accent">
          Delivery location selected
        </p>
      )}

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-40 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-border/70 bg-white py-1.5 shadow-float animate-fade-up"
        >
          {suggestions.map((s) => (
            <li key={s.mapboxId} role="option">
              <button
                type="button"
                className="flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition hover:bg-primary-light/60 active:bg-primary-light"
                onClick={() => void pickSuggestion(s)}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-secondary">
                    {s.name}
                  </span>
                  {(s.placeFormatted || s.fullAddress) && (
                    <span className="mt-0.5 block text-xs text-muted line-clamp-2">
                      {s.placeFormatted || s.fullAddress}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {loading && !open && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted">
          <Loader2 className="h-3 w-3 animate-spin" />
          Finding places...
        </p>
      )}
    </div>
  );
}
