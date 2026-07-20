"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  MapPin,
  Navigation,
  PencilLine,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DeliveryMapPreview } from "@/components/checkout/DeliveryMapPreview";
import {
  detectDeliveryZone,
  estimateArrivalWindow,
} from "@/lib/geo/delivery-zone";
import type { GeocodedPlace, PlaceSuggestion } from "@/lib/geo/delivery-location";
import { formatRwf, FLAT_DELIVERY_FEE_RWF, type DeliveryZoneKey } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type ConfirmedDelivery = {
  address: string;
  houseDetail: string;
  notes: string;
  gpsLat: string;
  gpsLng: string;
  zone: DeliveryZoneKey | null;
  available: boolean;
};

type Props = {
  confirmed: ConfirmedDelivery | null;
  slot: "TODAY" | "TOMORROW";
  onConfirm: (data: ConfirmedDelivery) => void;
  onClear: () => void;
  /** When true, show Save address after confirm (logged-in customers). */
  canSaveAddress?: boolean;
  savedAddresses?: {
    id: string;
    label: string;
    fullAddress: string;
    gpsLat: number | null;
    gpsLng: number | null;
  }[];
};

type Stage = "choose" | "gps-loading" | "gps-confirm" | "confirmed";

export function DeliveryAddressStep({
  confirmed,
  slot,
  onConfirm,
  onClear,
  canSaveAddress = false,
  savedAddresses = [],
}: Props) {
  const [stage, setStage] = useState<Stage>(confirmed ? "confirmed" : "choose");
  const [place, setPlace] = useState<GeocodedPlace | null>(null);
  const [notes, setNotes] = useState(confirmed?.notes || "");
  const [error, setError] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [saveLabel, setSaveLabel] = useState("Home");
  const [savingAddress, setSavingAddress] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [localSaved, setLocalSaved] = useState(savedAddresses);

  useEffect(() => {
    setLocalSaved(savedAddresses);
  }, [savedAddresses]);

  const pickSaved = async (a: (typeof savedAddresses)[number]) => {
    setError("");
    setStage("gps-loading");
    try {
      if (a.gpsLat != null && a.gpsLng != null) {
        const res = await fetch(`/api/geo?action=reverse&lat=${a.gpsLat}&lng=${a.gpsLng}`);
        const data = await res.json();
        const p: GeocodedPlace = res.ok
          ? data
          : {
              formattedAddress: a.fullAddress,
              line1: a.label,
              line2: a.fullAddress,
              lat: a.gpsLat,
              lng: a.gpsLng,
            };
        setPlace(p);
        setStage("gps-confirm");
        return;
      }
      // No coords. Try autocomplete geocode of the stored address text
      const res = await fetch(
        `/api/geo?action=autocomplete&q=${encodeURIComponent(a.fullAddress)}`
      );
      const data = await res.json();
      const first = (data.suggestions || [])[0] as PlaceSuggestion | undefined;
      if (first) {
        const det = await fetch(`/api/geo?action=details&id=${encodeURIComponent(first.id)}`);
        const placeData = await det.json();
        if (det.ok) {
          setPlace(placeData as GeocodedPlace);
          setStage("gps-confirm");
          return;
        }
      }
      setError("Could not load that saved address. Add a new one with map location.");
      setStage("choose");
    } catch {
      setError("Could not load that saved address.");
      setStage("choose");
    }
  };

  const saveCurrentAddress = async () => {
    if (!confirmed || !canSaveAddress) return;
    setSavingAddress(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: saveLabel.trim() || "Home",
          fullAddress: confirmed.address,
          gpsLat: confirmed.gpsLat || undefined,
          gpsLng: confirmed.gpsLng || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setSaveMsg("Address saved for next time.");
      if (data.address) {
        setLocalSaved((prev) => [data.address, ...prev.filter((x) => x.id !== data.address.id)]);
      }
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : "Could not save address");
    } finally {
      setSavingAddress(false);
    }
  };

  useEffect(() => {
    if (confirmed) setStage("confirmed");
  }, [confirmed]);

  const coverage = useMemo(() => {
    if (!place) return null;
    return detectDeliveryZone(place.formattedAddress, place.lat, place.lng);
  }, [place]);

  const arrival = useMemo(
    () => estimateArrivalWindow(coverage?.zone ?? confirmed?.zone ?? null, slot),
    [coverage?.zone, confirmed?.zone, slot]
  );

  const startGps = () => {
    setError("");
    setStage("gps-loading");
    if (!navigator.geolocation) {
      setError("Location is not supported on this device. Enter your address manually.");
      setStage("choose");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const res = await fetch(`/api/geo?action=reverse&lat=${lat}&lng=${lng}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Could not find address");
          setPlace(data as GeocodedPlace);
          setStage("gps-confirm");
        } catch (e) {
          setError(e instanceof Error ? e.message : "Could not find address");
          setStage("choose");
        }
      },
      () => {
        setError("Location access denied. You can enter your address manually instead.");
        setStage("choose");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const confirmPlace = (p: GeocodedPlace, houseDetail = "", extraNotes = notes) => {
    const cover = detectDeliveryZone(p.formattedAddress, p.lat, p.lng);
    const fullAddress = [p.formattedAddress, houseDetail.trim()].filter(Boolean).join(" · ");
    onConfirm({
      address: fullAddress,
      houseDetail: houseDetail.trim(),
      notes: extraNotes.trim(),
      gpsLat: String(p.lat),
      gpsLng: String(p.lng),
      zone: cover.zone,
      available: cover.available,
    });
    setPlace(p);
    setNotes(extraNotes.trim());
    setStage("confirmed");
    setManualOpen(false);
  };

  if (stage === "confirmed" && confirmed) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-[var(--huza-green)] bg-[var(--huza-mint)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--huza-green-dark)]">
                <MapPin className="size-3.5" aria-hidden />
                Delivery location
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--huza-ink)]">{confirmed.address}</p>
              {confirmed.notes ? (
                <p className="mt-1 text-xs text-[var(--huza-muted)]">Notes: {confirmed.notes}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                onClear();
                setPlace(null);
                setStage("choose");
              }}
              className="shrink-0 text-xs font-semibold text-[var(--huza-green-dark)] underline"
            >
              Change
            </button>
          </div>
        </div>

        {confirmed.available && confirmed.zone ? (
          <div className="rounded-xl border border-[var(--huza-line)] bg-white p-4">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[var(--huza-green-dark)]">
              <CheckCircle2 className="size-4" aria-hidden />
              Delivery available
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-[var(--huza-muted)]">Estimated arrival</p>
                <p className="font-semibold">{arrival.dayLabel}</p>
                <p className="text-xs font-medium text-[var(--huza-ink)]">{arrival.windowLabel}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--huza-muted)]">Delivery fee</p>
                <p className="font-semibold text-[var(--huza-green-dark)]">
                  {formatRwf(FLAT_DELIVERY_FEE_RWF)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Sorry.</p>
            <p className="mt-1">Delivery is currently unavailable in your area.</p>
            <p className="mt-2 text-xs">
              HUZA delivers to Kigali, Kamonyi, and Bugesera. Change location or contact support.
            </p>
          </div>
        )}

        {canSaveAddress && confirmed.available ? (
          <div className="rounded-xl border border-dashed border-[var(--huza-line)] bg-white p-4">
            <p className="text-sm font-semibold">Save for next time</p>
            <div className="mt-2 flex gap-2">
              <input
                value={saveLabel}
                onChange={(e) => setSaveLabel(e.target.value)}
                placeholder="Home, Work…"
                className="min-w-0 flex-1 rounded-xl border border-[var(--huza-line)] px-3 py-2.5 text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                disabled={savingAddress}
                onClick={() => void saveCurrentAddress()}
              >
                {savingAddress ? <Loader2 className="size-4 animate-spin" /> : "Save"}
              </Button>
            </div>
            {saveMsg ? <p className="mt-2 text-xs text-[var(--huza-muted)]">{saveMsg}</p> : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--huza-muted)]">
        Choose how you would like to provide your delivery location.
      </p>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {stage === "choose" || stage === "gps-loading" ? (
        <>
          {localSaved.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--huza-muted)]">
                Saved addresses
              </p>
              <ul className="space-y-2">
                {localSaved.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      disabled={stage === "gps-loading"}
                      onClick={() => void pickSaved(a)}
                      className="flex w-full items-start gap-3 rounded-xl border border-[var(--huza-line)] bg-white px-4 py-3 text-left transition hover:border-[var(--huza-green)]"
                    >
                      <MapPin className="mt-0.5 size-4 shrink-0 text-[var(--huza-green)]" />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[var(--huza-ink)]">
                          {a.label || "Address"}
                        </span>
                        <span className="mt-0.5 block text-xs text-[var(--huza-muted)] line-clamp-2">
                          {a.fullAddress}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={stage === "gps-loading"}
                onClick={() => setManualOpen(true)}
                className="w-full rounded-xl border border-dashed border-[var(--huza-green)] bg-[var(--huza-mint)]/40 px-4 py-3 text-sm font-semibold text-[var(--huza-green-dark)]"
              >
                + Add New Address
              </button>
            </div>
          ) : null}

          <div className="rounded-xl border border-[var(--huza-line)] bg-white p-4">
            <p className="text-sm font-semibold text-[var(--huza-ink)]">📍 Use My Current Location</p>
            <p className="mt-1 text-xs text-[var(--huza-muted)]">Fastest and most accurate option.</p>
            <Button
              type="button"
              className="mt-3 w-full"
              size="lg"
              onClick={startGps}
              disabled={stage === "gps-loading"}
            >
              {stage === "gps-loading" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Finding location…
                </>
              ) : (
                <>
                  <Navigation className="size-4" />
                  Use My Current Location
                </>
              )}
            </Button>
          </div>

          <div className="rounded-xl border border-[var(--huza-line)] bg-white p-4">
            <p className="text-sm font-semibold text-[var(--huza-ink)]">✍️ Enter Address Manually</p>
            <Button
              type="button"
              variant="ghost"
              className="mt-3 w-full"
              size="lg"
              onClick={() => setManualOpen(true)}
              disabled={stage === "gps-loading"}
            >
              <PencilLine className="size-4" />
              {localSaved.length > 0 ? "Enter a different address" : "Enter Address Manually"}
            </Button>
          </div>
        </>
      ) : null}

      {stage === "gps-confirm" && place ? (
        <div className="space-y-3 rounded-xl border border-[var(--huza-line)] bg-white p-4">
          <p className="text-sm font-semibold text-[var(--huza-green-dark)]">Location found</p>
          <div className="flex gap-2 text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0 text-[var(--huza-green)]" aria-hidden />
            <div>
              <p className="font-semibold">{place.line1}</p>
              {place.line2 ? <p className="text-[var(--huza-muted)]">{place.line2}</p> : null}
              {place.area ? <p className="text-[var(--huza-muted)]">{place.area}</p> : null}
            </div>
          </div>

          <DeliveryMapPreview lat={place.lat} lng={place.lng} />

          {coverage && !coverage.available ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
              This pin may be outside Kigali, Kamonyi, or Bugesera. You can still confirm. We will
              show availability next.
            </p>
          ) : null}

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">
              Delivery notes <span className="font-normal text-[var(--huza-muted)]">(optional)</span>
            </span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Blue gate · Near BK Arena · Call when you arrive · 2nd floor"
              className="w-full rounded-xl border border-[var(--huza-line)] px-3 py-2.5 text-base"
            />
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" className="w-full sm:flex-1" size="lg" onClick={() => confirmPlace(place)}>
              Confirm location
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={() => {
                setPlace(null);
                setStage("choose");
              }}
            >
              Back
            </Button>
          </div>
        </div>
      ) : null}

      {manualOpen ? (
        <ManualAddressSheet
          onClose={() => setManualOpen(false)}
          onSave={(p, house, note) => confirmPlace(p, house, note)}
        />
      ) : null}
    </div>
  );
}

function ManualAddressSheet({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (place: GeocodedPlace, house: string, notes: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<GeocodedPlace | null>(null);
  const [house, setHouse] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geo?action=autocomplete&q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  const pickSuggestion = async (s: PlaceSuggestion) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/geo?action=details&id=${encodeURIComponent(s.id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load place");
      setSelected(data as GeocodedPlace);
      setQuery(s.label);
      setSuggestions([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load place");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="manual-address-title"
        className="relative z-[81] flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--huza-line)] px-4 py-3">
          <h3 id="manual-address-title" className="font-semibold text-[var(--huza-ink)]">
            Enter delivery address
          </h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-[var(--huza-mint)]">
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto px-4 py-4">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Search address</span>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(null);
              }}
              placeholder="Kimironko, KG 11 Ave…"
              className="w-full rounded-xl border border-[var(--huza-line)] px-3 py-3 text-base"
              autoFocus
            />
          </label>

          {loading ? (
            <p className="flex items-center gap-2 text-xs text-[var(--huza-muted)]">
              <Loader2 className="size-3.5 animate-spin" /> Searching…
            </p>
          ) : null}

          {suggestions.length > 0 ? (
            <ul className="overflow-hidden rounded-xl border border-[var(--huza-line)]">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => pickSuggestion(s)}
                    className={cn(
                      "w-full border-b border-[var(--huza-line)] px-3 py-2.5 text-left text-sm last:border-0 hover:bg-[var(--huza-mint)]"
                    )}
                  >
                    <span className="font-semibold">{s.label}</span>
                    {s.secondary ? (
                      <span className="mt-0.5 block text-xs text-[var(--huza-muted)]">{s.secondary}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {selected ? (
            <div className="rounded-xl bg-[var(--huza-mint)] px-3 py-2 text-sm">
              <p className="font-semibold text-[var(--huza-green-dark)]">{selected.line1}</p>
              <p className="text-xs text-[var(--huza-muted)]">{selected.formattedAddress}</p>
              <div className="mt-2">
                <DeliveryMapPreview lat={selected.lat} lng={selected.lng} />
              </div>
            </div>
          ) : null}

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">House / apartment</span>
            <input
              value={house}
              onChange={(e) => setHouse(e.target.value)}
              placeholder="House number, apartment, floor…"
              className="w-full rounded-xl border border-[var(--huza-line)] px-3 py-3 text-base"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">
              Delivery notes <span className="font-normal text-[var(--huza-muted)]">(optional)</span>
            </span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Blue gate · Call when you arrive"
              className="w-full rounded-xl border border-[var(--huza-line)] px-3 py-2.5 text-base"
            />
          </label>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </div>

        <div className="border-t border-[var(--huza-line)] p-4">
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={!selected}
            onClick={() => selected && onSave(selected, house, notes)}
          >
            Save address
          </Button>
        </div>
      </div>
    </div>
  );
}
