"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ProductCard, type ProductCardData } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/Button";

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<ProductCardData[]>([]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((d) => setItems((d.items || []).map((i: { product: ProductCardData }) => i.product)));
  }, [status]);

  if (status === "loading") {
    return <div className="p-10 text-center">Loading…</div>;
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="section-title">Wishlist</h1>
        <p className="mt-4 text-[var(--huza-muted)]">Log in to save favorite products.</p>
        <Link href="/auth/login" className="inline-block mt-6">
          <Button>Log in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <h1 className="section-title mb-2">Wishlist</h1>
      <p className="text-[var(--huza-muted)] mb-8">Products you saved on HUZA FRESH</p>
      {items.length === 0 ? (
        <p className="text-[var(--huza-muted)]">
          No saved items yet. Tap the heart on a product to add it.{" "}
          <Link href="/products" className="text-[var(--huza-green)] font-semibold">
            Browse products
          </Link>
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
