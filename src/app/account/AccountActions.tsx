"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";

export function AccountActions() {
  const [message, setMessage] = useState("");
  const [addressMsg, setAddressMsg] = useState("");

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
    if (res.ok) (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="space-y-6">
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
