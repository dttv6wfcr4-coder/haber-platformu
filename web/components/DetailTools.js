"use client";
import { useEffect, useState } from "react";

export function ListenButton({ text }) {
  const [on, setOn] = useState(false);
  const [ok, setOk] = useState(true);

  useEffect(() => {
    setOk("speechSynthesis" in window);
    return () => window.speechSynthesis?.cancel();
  }, []);

  if (!ok) return null;

  function toggle() {
    const s = window.speechSynthesis;
    if (on) {
      s.cancel();
      setOn(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "tr-TR";
    u.onend = () => setOn(false);
    u.onerror = () => setOn(false);
    s.cancel();
    s.speak(u);
    setOn(true);
  }

  return (
    <button type="button" className="pill" onClick={toggle}>
      {on ? "Durdur" : "Dinle"}
    </button>
  );
}

const REASONS = [
  "Yanlış çeviri",
  "Telif hakkı / kaldırma talebi",
  "Uygunsuz içerik",
  "Diğer",
];

export function ReportForm({ articleId }) {
  const [state, setState] = useState("idle");

  async function send(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("busy");
    try {
      const r = await fetch("/api/bildir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_id: articleId,
          reason: f.get("reason"),
          message: f.get("message"),
          email: f.get("email"),
          website: f.get("website"),
        }),
      });
      setState(r.ok ? "done" : "err");
    } catch {
      setState("err");
    }
  }

  if (state === "done") return <p className="notice">Bildirimin alındı, teşekkürler.</p>;

  return (
    <details className="report">
      <summary>Bu haberi bildir</summary>
      <form onSubmit={send} className="report-form">
        <select name="reason" defaultValue={REASONS[0]}>
          {REASONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <textarea name="message" rows={3} maxLength={1000} placeholder="Ayrıntı (isteğe bağlı)" />
        <input name="email" type="email" maxLength={120} placeholder="E-posta (yanıt istersen)" />
        <input name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
        <button type="submit" disabled={state === "busy"}>
          {state === "busy" ? "Gönderiliyor…" : "Gönder"}
        </button>
        {state === "err" && <p className="notice">Gönderilemedi, biraz sonra tekrar dene.</p>}
      </form>
    </details>
  );
}
