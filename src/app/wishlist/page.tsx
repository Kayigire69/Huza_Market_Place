import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductCard, type ProductCardData } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/Button";
import { productCardSelect } from "@/repositories/product.repository";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
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

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: { product: { select: productCardSelect } },
    orderBy: { createdAt: "desc" },
    take: 48,
  });
  const items = favorites
    .map((f) => f.product)
    .filter((p): p is NonNullable<typeof p> => Boolean(p)) as ProductCardData[];

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
