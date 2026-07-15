"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export default function AdminSecurityPage() {
  const { data: session, update } = useSession();
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/security/totp")
      .then((r) => r.json())
      .then((d) => {
        if (d.totpEnabled != null) setTotpEnabled(Boolean(d.totpEnabled));
      })
      .catch(() => null);
  }, []);

  async function beginSetup() {
    setError("");
    setMsg("");
    const res = await fetch("/api/admin/security/totp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "begin" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not start 2FA setup");
      return;
    }
    setQr(data.qrDataUrl);
    setSecret(data.secret);
  }

  async function confirmSetup() {
    setError("");
    const res = await fetch("/api/admin/security/totp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "confirm", code }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Invalid code");
      return;
    }
    setTotpEnabled(true);
    setQr(null);
    setSecret(null);
    setCode("");
    setMsg("Two-factor authentication is now enabled.");
    await update({ totpEnabled: true });
  }

  async function disable() {
    setError("");
    const res = await fetch("/api/admin/security/totp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "disable", code }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not disable 2FA");
      return;
    }
    setTotpEnabled(false);
    setCode("");
    setMsg("Two-factor authentication disabled.");
    await update({ totpEnabled: false });
  }

  if (session?.user?.role !== "SUPER_ADMIN") {
    return (
      <div className="admin-panel p-6">
        <p className="text-sm text-[var(--admin-muted)]">Security settings are Super Admin only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <h1 className="admin-panel-title">Super Admin security</h1>
        <p className="admin-panel-sub">
          Enable two-factor authentication so a stolen password alone cannot access the most powerful
          account in the system.
        </p>
      </div>

      <div className="admin-panel space-y-3 p-5">
        <p className="text-sm">
          Status:{" "}
          <strong className={totpEnabled ? "text-emerald-800" : "text-amber-800"}>
            {totpEnabled ? "2FA enabled" : "2FA not enabled"}
          </strong>
        </p>

        {!totpEnabled && !qr && (
          <Button type="button" onClick={beginSetup}>
            Set up authenticator app
          </Button>
        )}

        {qr && (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="2FA QR code" className="mx-auto h-48 w-48 rounded-xl border" />
            <p className="break-all text-xs text-[var(--admin-muted)]">Manual secret: {secret}</p>
            <input
              className="admin-input"
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Button type="button" onClick={confirmSetup}>
              Confirm and enable
            </Button>
          </div>
        )}

        {totpEnabled && (
          <div className="space-y-2">
            <input
              className="admin-input"
              placeholder="Code to disable 2FA"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Button type="button" variant="ghost" onClick={disable}>
              Disable 2FA
            </Button>
          </div>
        )}

        {msg && <p className="text-sm text-emerald-800">{msg}</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>
    </div>
  );
}
