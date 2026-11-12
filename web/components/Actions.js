"use client";
import { useEffect, useState } from "react";

const KEY = "kayitli";
const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

export function SaveButton({ id }) {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(read().includes(id)), [id]);
  function toggle() {
    const list = read();
    const next = list.includes(id)
      ? list.filter((x) => x !== id)
      : [id, ...list].slice(0, 200);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    setOn(next.includes(id));
  }
  return (
    <button
      type="button"
      className={`save${on ? " on" : ""}`}
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Kaydedilenlerden çıkar" : "Kaydet"}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
      </svg>
    </button>
  );
}

export function ShareButton({ title, path }) {
  const [msg, setMsg] = useState("");
  async function share() {
    const url = window.location.origin + path;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        setMsg("Bağlantı kopyalandı");
        setTimeout(() => setMsg(""), 2000);
      }
    } catch {}
  }
  return (
    <button type="button" className="pill" onClick={share}>
      {msg || "Paylaş"}
    </button>
  );
}
