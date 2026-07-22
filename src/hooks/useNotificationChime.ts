"use client";

import { useEffect, useRef } from "react";
import {
  isAlertSoundEnabled,
  isSoundAlertType,
  playAlertSound,
  showBrowserAlertNotification,
  unlockAlertAudio,
  requestAlertNotificationPermission,
  type AlertPortal,
} from "@/lib/admin-alert-sound";

type LiveNotification = {
  id: string;
  title: string;
  body: string;
  type?: string;
  isRead?: boolean;
  createdAt?: string;
};

/**
 * Polls the user's notification feed and plays a chime for new audit events.
 * Call once per portal shell (Admin / Farmer / Customer header).
 */
export function useNotificationChime(opts: {
  portal: AlertPortal;
  /** When false, polling is skipped (e.g. logged-out customer). */
  enabled?: boolean;
  endpoint?: string;
  intervalMs?: number;
  browserNotify?: boolean;
}) {
  const {
    portal,
    enabled = true,
    endpoint = "/api/notifications/live",
    intervalMs = 12_000,
    browserNotify = portal === "admin",
  } = opts;

  const knownIds = useRef<Set<string> | null>(null);
  const unlocked = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const unlock = () => {
      if (unlocked.current) return;
      unlocked.current = true;
      unlockAlertAudio();
      if (browserNotify) requestAlertNotificationPermission();
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [enabled, browserNotify]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(endpoint);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const next = (data.notifications || []) as LiveNotification[];

        if (knownIds.current == null) {
          knownIds.current = new Set(next.map((n) => n.id));
          return;
        }

        const fresh = next.filter(
          (n) =>
            !knownIds.current!.has(n.id) &&
            !n.isRead &&
            isSoundAlertType(n.type, portal)
        );
        for (const n of next) knownIds.current.add(n.id);

        if (fresh.length > 0 && isAlertSoundEnabled(portal)) {
          void playAlertSound(portal);
          if (browserNotify) {
            showBrowserAlertNotification(fresh[0].title, fresh[0].body, `huza-${portal}`);
          }
        }
      } catch {
        /* ignore */
      }
    };

    void load();
    const id = setInterval(load, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled, endpoint, intervalMs, portal, browserNotify]);
}
