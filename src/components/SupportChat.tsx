"use client";

import { FormEvent, useEffect, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/locale-context";

type Msg = { id: string; sender: string; body: string; createdAt: string };

export function SupportChat() {
  const { locale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("huza-support-thread");
    if (saved) {
      setThreadId(saved);
      setStarted(true);
      fetch(`/api/support?threadId=${saved}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.messages) setMessages(d.messages);
        })
        .catch(() => undefined);
    }
  }, []);

  const startChat = async (e: FormEvent) => {
    e.preventDefault();
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
    const data = await res.json();
    if (res.ok) {
      setThreadId(data.threadId);
      localStorage.setItem("huza-support-thread", data.threadId);
      setMessages(data.messages || []);
      setText("");
      setStarted(true);
    }
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!threadId || !text.trim()) return;
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "message", threadId, body: text, locale }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessages(data.messages || []);
      setText("");
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
          <div className="bg-[var(--huza-green-dark)] px-4 py-3 text-white">
            <p className="font-semibold">Youth Huza Support</p>
            <p className="text-xs text-[#C8E8D4]">
              EN · FR · RW — products, orders, delivery, payments
            </p>
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
              <Button type="submit" className="mt-auto">
                Start chat
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
              </div>
              <form onSubmit={send} className="flex gap-2 border-t border-[var(--huza-line)] p-3">
                <input
                  className="input-field"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..."
                />
                <Button type="submit" size="sm" aria-label="Send">
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
