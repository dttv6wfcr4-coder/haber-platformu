"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sb, SELECT, catColor } from "../lib/db";
import Card from "./Card";

const isAdminPath = (p) => (p || "").startsWith("/yonetim");

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    setDark(
      t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }, []);
  function flip() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("tema", next);
    } catch {}
    setDark(!dark);
  }
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={flip}
      aria-label={dark ? "Açık temaya geç" : "Koyu temaya geç"}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z" />
        )}
      </svg>
    </button>
  );
}

export function Chrome({ cats, banner }) {
  const path = usePathname();
  if (isAdminPath(path)) return null;
  const active = path.startsWith("/kategori/")
    ? decodeURIComponent(path.split("/")[2] || "")
    : null;
  return (
    <>
      {banner ? <div className="banner">{banner}</div> : null}
      <header className="top">
        <div className="top-bar">
          <Link href="/" className="brand">
            <span className="live" aria-hidden="true" />
            Haber
          </Link>
          <div className="top-act">
            <Link href="/ara" className="icon-btn" aria-label="Ara">
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path d="M20 20l-4.2-4.2" />
              </svg>
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <nav className="chips" aria-label="Kategoriler">
          <Link href="/" className={path === "/" ? "on" : ""}>Tümü</Link>
          {cats.map((c) => (
            <Link
              key={c.slug}
              href={`/kategori/${c.slug}`}
              className={active === c.slug ? "on" : ""}
            >
              <i style={{ background: catColor(c.slug) }} />
              {c.name_tr}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}

export function BottomNav() {
  const path = usePathname();
  if (isAdminPath(path)) return null;
  const items = [
    ["/", "Gündem", "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"],
    ["/ara", "Ara", "M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM20 20l-4.2-4.2"],
    ["/kaydedilenler", "Kaydedilenler", "M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"],
  ];
  return (
    <nav className="tabbar" aria-label="Ana menü">
      {items.map(([href, label, d]) => (
        <Link key={href} href={href} className={path === href ? "on" : ""}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d={d} />
          </svg>
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function Footer() {
  const path = usePathname();
  if (isAdminPath(path)) return null;
  return (
    <footer className="foot">
      <Link href="/telif">Telif ve iletişim</Link>
      <p>İçerikler yapay zekâ ile çevrilip özetlenir. Haberin tamamı için kaynağa gidin.</p>
    </footer>
  );
}

export function LoadMore({ before, categoryId, sourceId }) {
  const [rows, setRows] = useState([]);
  const [cursor, setCursor] = useState(before);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function more() {
    setBusy(true);
    let q = sb
      .from("articles")
      .select(SELECT)
      .lt("published_at", cursor)
      .order("published_at", { ascending: false })
      .limit(30);
    if (categoryId) q = q.eq("category_id", categoryId);
    if (sourceId) q = q.eq("source_id", sourceId);
    const { data } = await q;
    const list = data || [];
    setRows((r) => [...r, ...list]);
    if (list.length) setCursor(list[list.length - 1].published_at);
    if (list.length < 30) setDone(true);
    setBusy(false);
  }

  return (
    <>
      {rows.length > 0 && (
        <div className="feed" style={{ marginTop: 12 }}>
          {rows.map((a) => <Card key={a.id} a={a} />)}
        </div>
      )}
      {!done && (
        <button type="button" className="more" onClick={more} disabled={busy}>
          {busy ? "Yükleniyor…" : "Daha eski haberler"}
        </button>
      )}
      {done && <p className="empty">Gösterilecek başka haber yok.</p>}
    </>
  );
}

export function SavedList() {
  const [items, setItems] = useState(null);
  useEffect(() => {
    let ids = [];
    try {
      ids = JSON.parse(localStorage.getItem("kayitli") || "[]");
    } catch {}
    if (!ids.length) {
      setItems([]);
      return;
    }
    sb.from("articles")
      .select(SELECT)
      .in("id", ids)
      .then(({ data }) => {
        const byId = Object.fromEntries((data || []).map((a) => [a.id, a]));
        setItems(ids.map((id) => byId[id]).filter(Boolean));
      });
  }, []);
  if (items === null) return <p className="empty">Yükleniyor…</p>;
  if (!items.length)
    return (
      <p className="empty">
        Henüz kayıtlı haber yok. Bir haberdeki işarete dokunarak sonra okumak için kaydedebilirsin.
      </p>
    );
  return <div className="feed">{items.map((a) => <Card key={a.id} a={a} />)}</div>;
}
