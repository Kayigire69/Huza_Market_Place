"use client";

import { useEffect, useRef } from "react";

type Props = {
  lat: number | null;
  lng: number | null;
  onMove: (lat: number, lng: number) => void;
};

const KIGALI = { lat: -1.9441, lng: 30.0619 };

type LeafletNS = {
  map: (el: HTMLElement, opts?: object) => LeafletMap;
  tileLayer: (url: string, opts?: object) => { addTo: (m: LeafletMap) => void };
  marker: (latlng: [number, number], opts?: object) => LeafletMarker;
};

type LeafletMap = {
  setView: (latlng: [number, number], zoom: number) => LeafletMap;
  invalidateSize: () => void;
  getZoom: () => number;
  on: (event: string, fn: (e: { latlng: { lat: number; lng: number } }) => void) => void;
  remove: () => void;
};

type LeafletMarker = {
  addTo: (m: LeafletMap) => LeafletMarker;
  setLatLng: (latlng: [number, number] | { lat: number; lng: number }) => void;
  getLatLng: () => { lat: number; lng: number };
  on: (event: string, fn: () => void) => void;
};

declare global {
  interface Window {
    L?: LeafletNS;
  }
}

function loadLeaflet(): Promise<LeafletNS> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    if (window.L) return resolve(window.L);

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const done = () => {
      if (window.L) resolve(window.L);
      else reject(new Error("Leaflet missing"));
    };

    const existing = document.getElementById("leaflet-js") as HTMLScriptElement | null;
    if (existing) {
      if (window.L) return done();
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

/** Interactive delivery pin — GPS / search place it; customer can drag to refine. */
export function DeliveryMapPin({ lat, lng, onMove }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const mapRef = useRef<{ map: LeafletMap; marker: LeafletMarker } | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const L = await loadLeaflet();
        if (cancelled || !containerRef.current || mapRef.current) return;

        // Fix default marker icons when loading Leaflet from CDN
        const IconDefault = (L as unknown as { Icon: { Default: { prototype: { _getIconUrl?: unknown }; mergeOptions: (o: object) => void } } }).Icon?.Default;
        if (IconDefault) {
          delete IconDefault.prototype._getIconUrl;
          IconDefault.mergeOptions({
            iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          });
        }

        const startLat = lat ?? KIGALI.lat;
        const startLng = lng ?? KIGALI.lng;
        const map = L.map(containerRef.current, { zoomControl: true }).setView(
          [startLat, startLng],
          14
        );

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap",
        }).addTo(map);

        const marker = L.marker([startLat, startLng], { draggable: true }).addTo(map);
        marker.on("dragend", () => {
          const p = marker.getLatLng();
          onMoveRef.current(p.lat, p.lng);
        });
        map.on("click", (e) => {
          marker.setLatLng(e.latlng);
          onMoveRef.current(e.latlng.lat, e.latlng.lng);
        });

        mapRef.current = { map, marker };
        setTimeout(() => map.invalidateSize(), 120);
      } catch {
        /* map optional */
      }
    })();

    return () => {
      cancelled = true;
    };
    // intentionally mount once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const refs = mapRef.current;
    if (!refs || lat == null || lng == null) return;
    refs.marker.setLatLng([lat, lng]);
    refs.map.setView([lat, lng], Math.max(refs.map.getZoom(), 15));
  }, [lat, lng]);

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--huza-line)] bg-[var(--huza-mint)]">
      <div ref={containerRef} className="h-56 w-full sm:h-64" />
      <p className="px-3 py-2 text-xs text-[var(--huza-muted)]">
        Drag the pin or tap the map to set your exact drop-off point.
      </p>
    </div>
  );
}
