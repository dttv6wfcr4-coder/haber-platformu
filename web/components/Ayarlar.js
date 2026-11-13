"use client";
import { useEffect, useState } from "react";

const KEY = "tercih";
const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
};

function apply(p) {
  const h = document.documentElement;
  if (p.font && p.font !== "m") h.dataset.font = p.font;
  else delete h.dataset.font;
  if (p.compact) h.dataset.compact = "1";
  else delete h.dataset.compact;
  if (p.nosum) h.dataset.nosum = "1";
  else delete h.dataset.nosum;
}

export default function Ayarlar() {
  const [p, setP] = useState({});
  const [theme, setTheme] = useState("auto");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setP(read());
    try {
      setTheme(localStorage.getItem("tema") || "auto");
    } catch {}
  }, []);

  function set(patch) {
    const next = { ...p, ...patch };
    setP(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    apply(next);
  }

  function pickTheme(t) {
    setTheme(t);
    const h = document.documentElement;
    try {
      if (t === "auto") {
        localStorage.removeItem("tema");
        delete h.dataset.theme;
      } else {
        localStorage.setItem("tema", t);
        h.dataset.theme = t;
      }
    } catch {}
  }

  function clear(key, text) {
    try {
      localStorage.removeItem(key);
    } catch {}
    setMsg(text);
    if (key === "okunan") {
      document.querySelectorAll(".wire.read").forEach((e) => e.classList.remove("read"));
    }
  }

  const sizes = [["s", "Küçük"], ["m", "Normal"], ["l", "Büyük"], ["xl", "Çok büyük"]];
  const themes = [["auto", "Otomatik"], ["light", "Açık"], ["dark", "Koyu"]];

  return (
    <>
      <h1 className="page-title">Ayarlar</h1>

      <div className="set-group">
        <h2>Yazı boyutu</h2>
        <div className="seg">
          {sizes.map(([k, l]) => (
            <button
              key={k}
              type="button"
              className={(p.font || "m") === k ? "on" : ""}
              onClick={() => set({ font: k })}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="set-group">
        <h2>Liste</h2>
        <label className="set-row">
          <input
            type="checkbox"
            checked={!!p.compact}
            onChange={(e) => set({ compact: e.target.checked })}
          />
          Kompakt liste
        </label>
        <label className="set-row">
          <input
            type="checkbox"
            checked={!!p.nosum}
            onChange={(e) => set({ nosum: e.target.checked })}
          />
          Özetleri gizle
        </label>
      </div>

      <div className="set-group">
        <h2>Tema</h2>
        <div className="seg">
          {themes.map(([k, l]) => (
            <button
              key={k}
              type="button"
              className={theme === k ? "on" : ""}
              onClick={() => pickTheme(k)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="set-group">
        <h2>Verilerim</h2>
        <p className="meta">Ayarlar ve listeler yalnızca bu cihazda saklanır.</p>
        <button type="button" className="set-btn" onClick={() => clear("kayitli", "Kaydedilenler temizlendi")}>
          Kaydedilenleri temizle
        </button>
        <button type="button" className="set-btn" onClick={() => clear("okunan", "Okundu işaretleri sıfırlandı")}>
          Okundu işaretlerini sıfırla
        </button>
        {msg && <p className="meta">{msg}</p>}
      </div>
    </>
  );
}
