"use client";

import { useEffect, useRef } from "react";

type Props = {
  lat: number;
  lng: number;
  className?: string;
};

const KIGALI = { lat: -1.9441, lng: 30.0619 };

type PreviewMap = {
  setView: (ll: [number, number], z: number) => PreviewMap;
  invalidateSize: () => void;
  remove: () => void;
};

/** Small confirmation-only map — no drag, no reposition. */
export function DeliveryMapPreview({ lat, lng, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: PreviewMap | null = null;
    let cancelled = false;

    (async () => {
      try {
        const L = (await loadLeaflet()) as {
          map: (el: HTMLElement, opts?: object) => PreviewMap;
          tileLayer: (url: string, opts?: object) => { addTo: (m: PreviewMap) => void };
          marker: (ll: [number, number], opts?: object) => { addTo: (m: PreviewMap) => void };
          Icon?: {
            Default: {
              prototype: { _getIconUrl?: unknown };
              mergeOptions: (o: object) => void;
            };
          };
        };
        if (cancelled || !containerRef.current) return;

        const IconDefault = L.Icon?.Default;
        if (IconDefault) {
          delete IconDefault.prototype._getIconUrl;
          IconDefault.mergeOptions({
            iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          });
        }

        const m = L.map(containerRef.current, {
          zoomControl: false,
          dragging: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          boxZoom: false,
          keyboard: false,
          touchZoom: false,
        }).setView([lat || KIGALI.lat, lng || KIGALI.lng], 16);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap",
        }).addTo(m);

        L.marker([lat, lng], { draggable: false }).addTo(m);
        map = m;
        setTimeout(() => m.invalidateSize(), 80);
      } catch {
        /* optional */
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lng]);

  return (
    <div className={className ?? "overflow-hidden rounded-xl border border-[var(--huza-line)]"}>
      <div ref={containerRef} className="h-40 w-full sm:h-44" />
    </div>
  );
}

function loadLeaflet(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    const w = window as Window & { L?: unknown };
    if (w.L) return resolve(w.L);

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const done = () => {
      if (w.L) resolve(w.L);
      else reject(new Error("Leaflet missing"));
    };

    const existing = document.getElementById("leaflet-js") as HTMLScriptElement | null;
    if (existing) {
      if (w.L) return done();
      existing.addEventListener("load", done);
      return;
    }

    const script = document.createElement("script");
    script.id = "leaflet-js";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = done;
    script.onerror = () => reject(new Error("Leaflet failed to load"));
    document.body.appendChild(script);
  });
}
