/**
 * Portal alert chime (Web Audio — no asset file).
 * Browsers often block audio until the user clicks once in the tab.
 *
 * Sound plays for ops/customer events listed in the Notification Audit.
 */

/** Admin / employee portal alerts that should chime */
export const ADMIN_SOUND_ALERT_TYPES = new Set([
  "ORDER_CONFIRMATION",
  "PAYMENT_CONFIRMATION",
  "NEW_SUPPLIER",
  "LOW_STOCK",
  "RESTOCK_REQUEST",
  "PO_RECEIVED",
  "HARVEST_ALERT",
  "SUPPLIER_STATUS",
]);

/** Farmer portal alerts */
export const FARMER_SOUND_ALERT_TYPES = new Set([
  "SUPPLIER_STATUS",
  "PAYMENT_PROCESSED",
  "PO_RECEIVED",
  "DELIVERY_SCHEDULE",
]);

/** Customer storefront / account alerts */
export const CUSTOMER_SOUND_ALERT_TYPES = new Set([
  "ORDER_CONFIRMATION",
  "PAYMENT_CONFIRMATION",
  "ORDER_PACKED",
  "DELIVERY_UPDATE",
  "ORDER_OUT_FOR_DELIVERY",
  "ORDER_DELIVERED",
]);

export type AlertPortal = "admin" | "farmer" | "customer";

const TYPE_SETS: Record<AlertPortal, Set<string>> = {
  admin: ADMIN_SOUND_ALERT_TYPES,
  farmer: FARMER_SOUND_ALERT_TYPES,
  customer: CUSTOMER_SOUND_ALERT_TYPES,
};

export function isSoundAlertType(type: string | null | undefined, portal: AlertPortal): boolean {
  return Boolean(type && TYPE_SETS[portal].has(type));
}

/** @deprecated use isSoundAlertType(type, "admin") */
export function isOrderAlertType(type?: string | null): boolean {
  return isSoundAlertType(type, "admin");
}

const STORAGE_KEY: Record<AlertPortal, string> = {
  admin: "huza-admin-alert-sound",
  farmer: "huza-farmer-alert-sound",
  customer: "huza-customer-alert-sound",
};

export function isAlertSoundEnabled(portal: AlertPortal = "admin"): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY[portal]) !== "off";
}

export function setAlertSoundEnabled(on: boolean, portal: AlertPortal = "admin") {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY[portal], on ? "on" : "off");
}

/** @deprecated */
export function isAdminAlertSoundEnabled(): boolean {
  return isAlertSoundEnabled("admin");
}

/** @deprecated */
export function setAdminAlertSoundEnabled(on: boolean) {
  setAlertSoundEnabled(on, "admin");
}

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  return audioCtx;
}

/** Call on a user gesture so later alerts can play without being blocked. */
export function unlockAlertAudio() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => undefined);
  }
}

/** @deprecated */
export function unlockAdminAlertAudio() {
  unlockAlertAudio();
}

function tone(
  ctx: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  gainPeak = 0.08
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(gainPeak, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

/** Soft two-note chime for new alerts. */
export async function playAlertSound(portal: AlertPortal = "admin") {
  if (!isAlertSoundEnabled(portal)) return;
  const ctx = getCtx();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") await ctx.resume();
    const t = ctx.currentTime;
    if (portal === "farmer") {
      tone(ctx, 698.5, t, 0.14, 0.07);
      tone(ctx, 880, t + 0.11, 0.16, 0.06);
    } else if (portal === "customer") {
      tone(ctx, 784, t, 0.12, 0.06);
      tone(ctx, 1046.5, t + 0.1, 0.16, 0.05);
    } else {
      tone(ctx, 880, t, 0.14, 0.07);
      tone(ctx, 1174.7, t + 0.12, 0.18, 0.06);
    }
  } catch {
    /* ignore autoplay / context errors */
  }
}

/** @deprecated */
export async function playAdminOrderAlertSound() {
  return playAlertSound("admin");
}

export function showBrowserAlertNotification(title: string, body: string, tag = "huza-alert") {
  if (typeof window === "undefined" || typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    // Keep the browser toast quiet — we already play our own alert chime.
    const n = new Notification(title, {
      body,
      tag,
      silent: true,
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    /* ignore */
  }
}

/** @deprecated */
export function showAdminOrderBrowserNotification(title: string, body: string) {
  showBrowserAlertNotification(title, body, "huza-admin-order");
}

export function requestAlertNotificationPermission() {
  if (typeof window === "undefined" || typeof Notification === "undefined") return;
  if (Notification.permission === "default") {
    void Notification.requestPermission().catch(() => undefined);
  }
}

/** @deprecated */
export function requestAdminNotificationPermission() {
  requestAlertNotificationPermission();
}
