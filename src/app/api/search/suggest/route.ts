import { NextResponse } from "next/server";
import { getSearchSuggestions } from "@/lib/recommendations";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") || "";
  const suggestions = await getSearchSuggestions(q);
  return NextResponse.json({ suggestions });
}
