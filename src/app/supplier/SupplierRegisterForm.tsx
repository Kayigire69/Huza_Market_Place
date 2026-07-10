"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function SupplierRegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, role: "SUPPLIER" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Registration failed");
      return;
    }
    await signIn("credentials", {
      phoneOrEmail: String(payload.phone),
      password: String(payload.password),
      redirect: false,
    });
    setLoading(false);
    router.push("/supplier");
    router.refresh();
  };

  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 space-y-4 rounded-2xl border border-[var(--huza-line)] bg-white p-6 text-left"
    >
      <h2 className="font-semibold text-lg">Supplier registration</h2>
      <p className="text-xs text-[var(--huza-muted)]">
        Apply to sell produce to Youth Huza. An admin will verify your documents before you can submit
        offers.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Full name / contact person</label>
          <input name="fullName" required className="input-field" />
        </div>
        <div>
          <label className="label">Business / farm name</label>
          <input name="businessName" required className="input-field" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input name="phone" required className="input-field" placeholder="078xxxxxxx" />
        </div>
        <div>
          <label className="label">Email (optional)</label>
          <input name="email" type="email" className="input-field" />
        </div>
        <div>
          <label className="label">Password</label>
          <input name="password" type="password" required minLength={6} className="input-field" />
        </div>
        <div>
          <label className="label">National ID or company reg. no.</label>
          <input name="nationalId" className="input-field" />
        </div>
        <div>
          <label className="label">Farm / business location</label>
          <input name="location" required className="input-field" />
        </div>
        <div>
          <label className="label">District</label>
          <input name="district" required className="input-field" />
        </div>
        <div>
          <label className="label">Sector</label>
          <input name="sector" className="input-field" />
        </div>
        <div>
          <label className="label">Product categories</label>
          <input
            name="productCategories"
            className="input-field"
            placeholder="Vegetables, fruits, dairy..."
          />
        </div>
        <div>
          <label className="label">Farm size / capacity (optional)</label>
          <input name="farmSize" className="input-field" placeholder="e.g. 2 hectares" />
        </div>
        <div>
          <label className="label">Production capacity (optional)</label>
          <input name="productionCapacity" className="input-field" />
        </div>
        <div>
          <label className="label">Mobile Money number</label>
          <input name="paymentMomo" className="input-field" placeholder="078xxxxxxx" />
        </div>
        <div>
          <label className="label">Bank account (optional)</label>
          <input name="bankAccount" className="input-field" />
        </div>
        <div>
          <label className="label">Bank name (optional)</label>
          <input name="bankName" className="input-field" />
        </div>
        <div>
          <label className="label">TIN (optional)</label>
          <input name="tin" className="input-field" />
        </div>
      </div>

      <div>
        <label className="label">About your farm / business</label>
        <textarea name="description" className="input-field min-h-20" />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">National ID document URL</label>
          <input name="nationalIdUrl" className="input-field" placeholder="https://..." />
        </div>
        <div>
          <label className="label">Business registration URL</label>
          <input name="businessCertUrl" className="input-field" placeholder="https://..." />
        </div>
        <div>
          <label className="label">Food safety / quality cert URL</label>
          <input name="foodSafetyUrl" className="input-field" />
        </div>
        <div>
          <label className="label">Organic certification URL</label>
          <input name="organicCertUrl" className="input-field" />
        </div>
        <div>
          <label className="label">Product photo URLs (comma or new line)</label>
          <textarea name="productPhotoUrls" className="input-field min-h-16" />
        </div>
        <div>
          <label className="label">Farm / facility photo URLs</label>
          <textarea name="farmPhotoUrls" className="input-field min-h-16" />
        </div>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Submitting..." : "Submit application"}
      </Button>
      <p className="text-center text-sm text-[var(--huza-muted)]">
        Already registered?{" "}
        <Link href="/auth/login" className="font-semibold text-[var(--huza-green)]">
          Log in
        </Link>
      </p>
    </form>
  );
}
