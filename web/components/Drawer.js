"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { catColor } from "../lib/db";

export default function Drawer({ cats }) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const path = usePathname();

  useEffect(() => setReady(true), []);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const active = path.startsWith("/kategori/")
    ? decodeURIComponent(path.split("/")[2] || "")
    : null;

  return (
    <>
      <button
        type="button"
        className="icon-btn"
        onClick={() => setOpen(true)}
        aria-label="Menüyü aç"
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      {ready &&
        createPortal(
          <div className={`drawer${open ? " open" : ""}`}>
            <div className="drawer-scrim" onClick={() => setOpen(false)} />
            <aside className="drawer-panel" role="dialog" aria-modal="true" aria-label="Kategoriler">
              <div className="drawer-head">
                <strong>Kategoriler</strong>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setOpen(false)}
                  aria-label="Menüyü kapat"
                >
                  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <nav onClick={() => setOpen(false)}>
                <Link href="/" className={path === "/" ? "on" : ""}>
                  <i />
                  Tüm haberler
                </Link>
                {cats.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/kategori/${c.slug}`}
                    className={active === c.slug ? "on" : ""}
                    style={{ "--c": catColor(c.slug) }}
                  >
                    <i />
                    {c.name_tr}
                  </Link>
                ))}
              </nav>
              <div className="drawer-foot" onClick={() => setOpen(false)}>
                <Link href="/benim">Benim akışım</Link>
                <Link href="/kategoriler">Tüm kategoriler</Link>

                <Link href="/arsiv">Arşiv</Link>
                <Link href="/kaydedilenler">Kaydedilenler</Link>
                <Link href="/ayarlar">Ayarlar</Link>

                <Link href="/ara">Ara</Link>
                <Link href="/telif">Telif ve iletişim</Link>
              </div>
            </aside>
          </div>,
          document.body
        )}
    </>
  );
}
