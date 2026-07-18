"use client";

import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { isWhatsAppConfigured } from "@/lib/brand-contact";

export function WhatsAppFab({ href = "" }: { href?: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;
  if (!isWhatsAppConfigured(href)) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with HUZA on WhatsApp"
      className="fixed bottom-[5.5rem] right-4 z-[70] flex size-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:bg-[#1ebe57] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] md:bottom-6 md:right-6 md:size-14"
    >
      <MessageCircle className="size-6 md:size-7" />
    </a>
  );
}
