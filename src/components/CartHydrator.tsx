"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/lib/cart-store";

/** Hydrate Redis-backed cart for logged-in users; keep syncing on session. */
export function CartHydrator() {
  const { data: session, status } = useSession();
  const hydrateFromServer = useCart((s) => s.hydrateFromServer);
  const syncToServer = useCart((s) => s.syncToServer);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      void hydrateFromServer().then(() => syncToServer());
    }
  }, [status, session?.user?.id, hydrateFromServer, syncToServer]);

  return null;
}
