"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/lib/cart-store";

/** Hydrate Redis-backed cart for logged-in users. Deferred so it doesn't block first paint. */
export function CartHydrator() {
  const { data: session, status } = useSession();
  const hydrateFromServer = useCart((s) => s.hydrateFromServer);
  const syncToServer = useCart((s) => s.syncToServer);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      void hydrateFromServer().then(() => {
        if (!cancelled) return syncToServer();
      });
    };

    const ric = window.requestIdleCallback?.bind(window);
    if (ric) {
      const id = ric(run, { timeout: 2500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(id);
      };
    }

    const t = window.setTimeout(run, 600);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [status, session?.user?.id, hydrateFromServer, syncToServer]);

  return null;
}
