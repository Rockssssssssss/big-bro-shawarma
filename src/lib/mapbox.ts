export type MapboxSuggestion = {
  mapboxId: string;
  name: string;
  fullAddress: string;
  placeFormatted: string;
};

export type MapboxSelectedAddress = {
  fullAddress: string;
  latitude: number;
  longitude: number;
  mapboxId?: string;
};

function getToken() {
  return process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() || "";
}

export function isMapboxConfigured() {
  return Boolean(getToken());
}

function newSessionToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `bb-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

let sessionToken = newSessionToken();

export function resetMapboxSession() {
  sessionToken = newSessionToken();
}

type SuggestFeature = {
  mapbox_id?: string;
  name?: string;
  full_address?: string;
  place_formatted?: string;
  feature_type?: string;
};

/**
 * Mapbox Search Box suggest — Ghana-biased, optional proximity.
 * Lazy-called only from checkout; no SDK bundle on homepage.
 */
export async function suggestAddresses(
  query: string,
  proximity?: { latitude: number; longitude: number } | null,
): Promise<MapboxSuggestion[]> {
  const token = getToken();
  if (!token || query.trim().length < 2) return [];

  const params = new URLSearchParams({
    q: query.trim(),
    access_token: token,
    session_token: sessionToken,
    country: "gh",
    language: "en",
    limit: "7",
    types: "poi,address,place,locality,neighborhood,street",
  });

  if (proximity) {
    params.set(
      "proximity",
      `${proximity.longitude},${proximity.latitude}`,
    );
  } else {
    // Tuobodom / Techiman area bias when GPS unavailable
    params.set("proximity", "-1.9395,7.5831");
  }

  const res = await fetch(
    `https://api.mapbox.com/search/searchbox/v1/suggest?${params.toString()}`,
  );
  if (!res.ok) {
    throw new Error("Address search failed. Please try again.");
  }

  const data = (await res.json()) as { suggestions?: SuggestFeature[] };
  return (data.suggestions ?? [])
    .filter((s) => s.mapbox_id && (s.name || s.full_address))
    .map((s) => ({
      mapboxId: s.mapbox_id as string,
      name: s.name || s.full_address || "",
      fullAddress:
        s.full_address ||
        [s.name, s.place_formatted].filter(Boolean).join(", "),
      placeFormatted: s.place_formatted || "",
    }));
}

export async function retrieveAddress(
  mapboxId: string,
): Promise<MapboxSelectedAddress | null> {
  const token = getToken();
  if (!token) return null;

  const params = new URLSearchParams({
    access_token: token,
    session_token: sessionToken,
  });

  const res = await fetch(
    `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(mapboxId)}?${params.toString()}`,
  );
  if (!res.ok) {
    throw new Error("Could not load that location.");
  }

  const data = (await res.json()) as {
    features?: Array<{
      properties?: {
        full_address?: string;
        name?: string;
        coordinates?: { latitude?: number; longitude?: number };
      };
      geometry?: { coordinates?: [number, number] };
    }>;
  };

  const feature = data.features?.[0];
  if (!feature) return null;

  const lon =
    feature.properties?.coordinates?.longitude ??
    feature.geometry?.coordinates?.[0];
  const lat =
    feature.properties?.coordinates?.latitude ??
    feature.geometry?.coordinates?.[1];

  if (typeof lat !== "number" || typeof lon !== "number") return null;

  resetMapboxSession();

  return {
    mapboxId,
    fullAddress:
      feature.properties?.full_address ||
      feature.properties?.name ||
      "Selected location",
    latitude: lat,
    longitude: lon,
  };
}

export function getDevicePosition(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}
