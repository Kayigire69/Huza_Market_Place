"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

/**
 * Minimal write-review form for PDP. Same chrome as existing review cards.
 * Guests keep the login prompt; signed-in customers can submit via /api/reviews.
 */
export function ProductReviewForm({
  productId,
  isLoggedIn,
}: {
  productId: string;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!isLoggedIn) {
    return (
      <p className="mt-4 text-sm">
        <Link href="/auth/login" className="text-[var(--huza-green)] font-semibold">
          Log in
        </Link>{" "}
        to write a review.
      </p>
    );
  }

  if (done) {
    return (
      <p className="mt-4 text-sm text-[var(--huza-green-dark)]">
        Thanks. Your review was submitted.
      </p>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          type: "PRODUCT",
          rating,
          comment: comment.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not submit review");
        return;
      }
      setDone(true);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 space-y-3 rounded-xl border border-[var(--huza-line)] bg-white p-4"
    >
      <p className="font-semibold text-sm">Write a review</p>
      <label className="block text-sm">
        <span className="mb-1 block text-[var(--huza-muted)]">Rating</span>
        <select
          className="input-field"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {"★".repeat(n)} ({n})
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-[var(--huza-muted)]">Comment (optional)</span>
        <textarea
          className="input-field min-h-20"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          placeholder="How was the product?"
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button type="submit" size="sm" disabled={busy}>
        {busy ? "Sending…" : "Submit review"}
      </Button>
    </form>
  );
}
