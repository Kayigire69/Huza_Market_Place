/**
 * Subtle Admin alert chime (Web Audio — no asset file).
 * Browsers often block audio until the user clicks once in the tab.
 */

const ORDER_ALERT_TYPES = new Set([
  "ORDER_CONFIRMATION",
  "PAYMENT_CONFIRMATION",
]);

export function isOrderAlertType(type?: string | null): boolean {
  return Boolean(type && ORDER_ALERT_TYPES.has(type));
}

export function isAdminAlertSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("huza-admin-alert-sound") !== "off";
}

export function setAdminAlertSoundEnabled(on: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem("huza-admin-alert-sound", on ? "on" : "off");
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
export function unlockAdminAlertAudio() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => undefined);
  }
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

/** Soft two-note chime for new customer orders. */
export async function playAdminOrderAlertSound() {
  if (!isAdminAlertSoundEnabled()) return;
  const ctx = getCtx();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") await ctx.resume();
    const t = ctx.currentTime;
    tone(ctx, 880, t, 0.14, 0.07);
    tone(ctx, 1174.7, t + 0.12, 0.18, 0.06);
  } catch {
    /* ignore autoplay / context errors */
  }
}

export function showAdminOrderBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined" || typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, {
      body,
      tag: "huza-admin-order",
      silent: false,
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    /* ignore */
  }
}

export function requestAdminNotificationPermission() {
  if (typeof window === "undefined" || typeof Notification === "undefined") return;
  if (Notification.permission === "default") {
    void Notification.requestPermission().catch(() => undefined);
  }
}
