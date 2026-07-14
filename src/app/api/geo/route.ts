import { NextResponse } from "next/server";
import {
  autocompletePlaces,
  resolvePlace,
  reverseGeocode,
} from "@/lib/geo/delivery-location";

/** Server proxy for reverse geocode / Places (keeps Google key off the client). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  try {
    if (action === "reverse") {
      const lat = Number(searchParams.get("lat"));
      const lng = Number(searchParams.get("lng"));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
      }
      const place = await reverseGeocode(lat, lng);
      return NextResponse.json(place);
    }

    if (action === "autocomplete") {
      const q = searchParams.get("q") || "";
      const suggestions = await autocompletePlaces(q);
      return NextResponse.json({ suggestions });
    }

    if (action === "details") {
      const id = searchParams.get("id") || "";
      if (!id) return NextResponse.json({ error: "Missing place id" }, { status: 400 });
      const place = await resolvePlace(id);
      return NextResponse.json(place);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Geo lookup failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
