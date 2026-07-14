import { detectDeliveryZone } from "@/lib/geo/delivery-zone";

export type GeocodedPlace = {
  formattedAddress: string;
  lat: number;
  lng: number;
  line1?: string;
  line2?: string;
  area?: string;
};

export type PlaceSuggestion = {
  id: string;
  label: string;
  secondary?: string;
};

export { detectDeliveryZone };

function googleKey() {
  return process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodedPlace> {
  const key = googleKey();
  if (key) {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("latlng", `${lat},${lng}`);
    url.searchParams.set("key", key);
    url.searchParams.set("language", "en");
    url.searchParams.set("region", "rw");
    const res = await fetch(url.toString());
    const data = await res.json();
    const first = data.results?.[0];
    if (first) {
      return splitPlace(first.formatted_address as string, lat, lng);
    }
  }

  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "HUZA-FRESH-Checkout/1.0",
      },
      next: { revalidate: 0 },
    }
  );
  if (!res.ok) throw new Error("Could not resolve address");
  const data = await res.json();
  return splitPlace(data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng);
}

export async function autocompletePlaces(query: string): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const key = googleKey();
  if (key) {
    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    url.searchParams.set("input", q);
    url.searchParams.set("key", key);
    url.searchParams.set("components", "country:rw");
    url.searchParams.set("language", "en");
    const res = await fetch(url.toString());
    const data = await res.json();
    return (data.predictions || []).slice(0, 6).map(
      (p: { place_id: string; structured_formatting?: { main_text: string; secondary_text?: string }; description: string }) => ({
        id: p.place_id,
        label: p.structured_formatting?.main_text || p.description,
        secondary: p.structured_formatting?.secondary_text,
      })
    );
  }

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=rw&addressdetails=1&q=${encodeURIComponent(q)}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "HUZA-FRESH-Checkout/1.0",
      },
      next: { revalidate: 0 },
    }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as {
    place_id: number;
    display_name: string;
    name?: string;
    lat: string;
    lon: string;
  }[];
  return data.map((h) => ({
    id: `osm:${h.place_id}:${h.lat},${h.lon}`,
    label: h.name || h.display_name.split(",")[0],
    secondary: h.display_name,
  }));
}

export async function resolvePlace(id: string): Promise<GeocodedPlace> {
  if (id.startsWith("osm:")) {
    const coords = id.split(":").pop()!;
    const [latS, lngS] = coords.split(",");
    const lat = Number(latS);
    const lng = Number(lngS);
    return reverseGeocode(lat, lng);
  }

  const key = googleKey();
  if (!key) throw new Error("Place details unavailable");
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", id);
  url.searchParams.set("fields", "formatted_address,geometry,name");
  url.searchParams.set("key", key);
  const res = await fetch(url.toString());
  const data = await res.json();
  const r = data.result;
  if (!r?.geometry?.location) throw new Error("Place not found");
  const lat = r.geometry.location.lat as number;
  const lng = r.geometry.location.lng as number;
  return splitPlace(r.formatted_address || r.name, lat, lng);
}

function splitPlace(formatted: string, lat: number, lng: number): GeocodedPlace {
  const parts = formatted.split(",").map((p) => p.trim()).filter(Boolean);
  return {
    formattedAddress: formatted,
    lat,
    lng,
    line1: parts[0] || formatted,
    line2: parts[1],
    area: parts[2] || parts[parts.length - 2],
  };
}
