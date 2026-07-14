"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Address = {
  id: string;
  label: string;
  fullAddress: string;
  district: string | null;
};

export function AccountActions({
  fullName,
  phone,
  loyaltyPoints,
  addresses,
}: {
  fullName: string;
  phone: string;
  loyaltyPoints: number;
  addresses: Address[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [addressMsg, setAddressMsg] = useState("");

  const saveProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.get("fullName"),
        phone: form.get("phone"),
      }),
    });
    const data = await res.json();
    setProfileMsg(res.ok ? "Profile updated" : data.error || "Failed");
    if (res.ok) router.refresh();
  };

  const changePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: form.get("currentPassword"),
        newPassword: form.get("newPassword"),
      }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Password updated" : data.error || "Failed");
  };

  const saveAddress = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: form.get("label"),
        fullAddress: form.get("fullAddress"),
        district: form.get("district"),
      }),
    });
    const data = await res.json();
    setAddressMsg(res.ok ? "Address saved" : data.error || "Failed");
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      router.refresh();
    }
  };

  const deleteAddress = async (id: string) => {
    const res = await fetch(`/api/account/addresses?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5">
        <h2 className="font-semibold">Loyalty points</h2>
        <p className="mt-2 text-3xl font-bold text-[var(--huza-green-dark)]">{loyaltyPoints}</p>
        <p className="mt-1 text-xs text-[var(--huza-muted)]">
          Earn 1 point per 1,000 RWF spent. Redeem with promo codes at checkout.
        </p>
      </div>

      <form
        onSubmit={saveProfile}
        className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3"
      >
        <h2 className="font-semibold">Profile</h2>
        <input name="fullName" defaultValue={fullName} className="input-field" required />
        <input name="phone" defaultValue={phone} className="input-field" required />
        {profileMsg && <p className="text-sm text-[var(--huza-green-dark)]">{profileMsg}</p>}
        <Button type="submit" size="sm" className="w-full">
          Save profile
        </Button>
      </form>

      <form
        onSubmit={saveAddress}
        className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3"
      >
        <h2 className="font-semibold">Save address</h2>
        <input name="label" placeholder="Home" className="input-field" required />
        <input name="fullAddress" placeholder="Full address" className="input-field" required />
        <input name="district" placeholder="District" className="input-field" />
        {addressMsg && <p className="text-sm text-[var(--huza-green-dark)]">{addressMsg}</p>}
        <Button type="submit" size="sm" className="w-full">
          Save address
        </Button>
      </form>

      {addresses.length > 0 && (
        <div className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3">
          <h2 className="font-semibold">Manage addresses</h2>
          {addresses.map((a) => (
            <div key={a.id} className="rounded-lg bg-[var(--huza-mint)] p-3 text-sm">
              <p className="font-medium">{a.label}</p>
              <p className="text-[var(--huza-muted)]">{a.fullAddress}</p>
              {a.district && <p className="text-xs text-[var(--huza-muted)]">{a.district}</p>}
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-red-700"
                onClick={() => deleteAddress(a.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={changePassword}
        className="rounded-2xl border border-[var(--huza-line)] bg-white p-5 space-y-3"
      >
        <h2 className="font-semibold">Change password</h2>
        <input
          name="currentPassword"
          type="password"
          placeholder="Current password"
          className="input-field"
          required
        />
        <input
          name="newPassword"
          type="password"
          placeholder="New password"
          className="input-field"
          required
          minLength={6}
        />
        {message && <p className="text-sm text-[var(--huza-green-dark)]">{message}</p>}
        <Button type="submit" size="sm" className="w-full">
          Update password
        </Button>
      </form>
    </div>
  );
}
