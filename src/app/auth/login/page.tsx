"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/locale-context";

export default function LoginPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      phoneOrEmail: String(form.get("phoneOrEmail")),
      password: String(form.get("password")),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid credentials");
      return;
    }
    router.push("/account");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="section-title text-center">{t("login")}</h1>
      <p className="mt-2 text-center text-sm text-[var(--huza-muted)]">
        Demo: customer@example.com / password123
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-[var(--huza-line)] bg-white p-6">
        <div>
          <label className="label">{t("email")} / {t("phone")}</label>
          <input name="phoneOrEmail" required className="input-field" />
        </div>
        <div>
          <label className="label">{t("password")}</label>
          <input name="password" type="password" required className="input-field" />
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "..." : t("login")}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        No account?{" "}
        <Link href="/auth/register" className="text-[var(--huza-green)] font-semibold">
          {t("register")}
        </Link>
      </p>
    </div>
  );
}
