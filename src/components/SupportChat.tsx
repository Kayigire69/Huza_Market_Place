"use client";

import { FormEvent, useEffect, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/locale-context";

type Msg = { id: string; sender: string; body: string; createdAt: string };

async function readJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text) {
    return { error: `Empty response (${res.status})`, messages: [] };
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { error: `Server returned non-JSON (${res.status})`, messages: [] };
  }
}

export function SupportChat() {
  const { locale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [started, setStarted] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const resetChat = () => {
    localStorage.removeItem("huza-support-thread");
    setThreadId(null);
    setMessages([]);
    setStarted(false);
    setText("");
    setError("");
  };

  useEffect(() => {
    const saved = localStorage.getItem("huza-support-thread");
    if (!saved) return;
    setThreadId(saved);
    setStarted(true);
    fetch(`/api/support?threadId=${encodeURIComponent(saved)}`)
      .then(async (r) => {
        const d = await readJson(r);
        if (!r.ok) {
          resetChat();
          return;
        }
        if (Array.isArray(d.messages)) setMessages(d.messages as Msg[]);
      })
      .catch(() => resetChat());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startChat = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          guestName: name,
          guestPhone: phone,
          locale,
          body: text || (locale === "fr" ? "Bonjour" : locale === "rw" ? "Muraho" : "Hello"),
        }),
      });
      const data = await readJson(res);
      if (!res.ok) {
        setError(String(data.error || "Could not start chat"));
        return;
      }
      const id = String(data.threadId || "");
      if (!id) {
        setError("Chat started but no session id was returned");
        return;
      }
      setThreadId(id);
      localStorage.setItem("huza-support-thread", id);
      setMessages(Array.isArray(data.messages) ? (data.messages as Msg[]) : []);
      setText("");
      setStarted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start chat");
    } finally {
      setSending(false);
    }
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!threadId || !text.trim() || sending) return;
    setError("");
    setSending(true);
    const outgoing = text.trim();
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "message", threadId, body: outgoing, locale }),
      });
      const data = await readJson(res);
      if (res.status === 404 || data.code === "THREAD_MISSING") {
        setError("Chat session expired. Starting a new chat…");
        resetChat();
        return;
      }
      if (!res.ok) {
        setError(String(data.error || "Failed to send message"));
        return;
      }
      setMessages(Array.isArray(data.messages) ? (data.messages as Msg[]) : []);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--huza-green)] text-white shadow-lg hover:bg-[var(--huza-green-dark)]"
        aria-label="Customer support chat"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[420px] w-[min(100vw-2rem,360px)] flex-col overflow-hidden rounded-2xl border border-[var(--huza-line)] bg-white shadow-2xl">
          <div className="bg-[var(--huza-green-dark)] px-4 py-3 text-white flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold">Youth Huza Support</p>
              <p className="text-xs text-[#C8E8D4]">EN · FR · RW — products, orders, delivery, payments</p>
            </div>
            {started && (
              <button
                type="button"
                onClick={resetChat}
                className="text-[10px] uppercase tracking-wide text-[#C8E8D4] hover:text-white"
              >
                New chat
              </button>
            )}
          </div>

          {!started ? (
            <form onSubmit={startChat} className="flex flex-1 flex-col gap-3 p-4">
              <p className="text-sm text-[var(--huza-muted)]">
                Ask in English, French, or Kinyarwanda about orders, delivery, payments, or products.
              </p>
              <input
                className="input-field"
                placeholder={t("fullName")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                className="input-field"
                placeholder={t("phone")}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <textarea
                className="input-field min-h-20"
                placeholder="How can we help? / Comment pouvons-nous aider ? / Twagufasha gute?"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              {error && <p className="text-sm text-red-700">{error}</p>}
              <Button type="submit" className="mt-auto" disabled={sending}>
                {sending ? "Starting…" : "Start chat"}
              </Button>
            </form>
          ) : (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                      m.sender === "CUSTOMER"
                        ? "ml-auto bg-[var(--huza-green)] text-white"
                        : "bg-[var(--huza-mint)] text-[var(--huza-ink)]"
                    }`}
                  >
                    {m.body}
                  </div>
                ))}
                {error && <p className="text-sm text-red-700">{error}</p>}
              </div>
              <form onSubmit={send} className="flex gap-2 border-t border-[var(--huza-line)] p-3">
                <input
                  className="input-field"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..."
                  disabled={sending}
                />
                <Button type="submit" size="sm" aria-label="Send" disabled={sending || !text.trim()}>
                  <Send className="size-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
