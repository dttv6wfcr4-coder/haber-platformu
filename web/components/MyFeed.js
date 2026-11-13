"use client";
import { useEffect, useState } from "react";
import { sb, SELECT, catColor } from "../lib/db";
import Card from "./Card";

const KEY = "favkat";

export default function MyFeed({ cats }) {
  const [favs, setFavs] = useState(null);
  const [items, setItems] = useState(null);

  useEffect(() => {
    let f = [];
    try {
      f = JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {}
    setFavs(f);
  }, []);

  useEffect(() => {
    if (favs === null) return;
    if (!favs.length) {
      setItems([]);
      return;
    }
    let live = true;
    setItems(null);
    sb.from("articles")
      .select(SELECT)
      .in("category_id", favs)
      .order("published_at", { ascending: false })
      .limit(40)
      .then(({ data }) => live && setItems(data || []));
    return () => {
      live = false;
    };
  }, [favs]);

  function toggle(id) {
    const next = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id];
    setFavs(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }

  if (favs === null) return <p className="empty">Yükleniyor…</p>;

  return (
    <>
      <div className="favs">
        {cats.map((c) => (
          <button
            key={c.id}
            type="button"
            className={favs.includes(c.id) ? "on" : ""}
            style={{ "--c": catColor(c.slug) }}
            onClick={() => toggle(c.id)}
          >
            <i />
            {c.name_tr}
          </button>
        ))}
      </div>
      {items === null && <p className="empty">Yükleniyor…</p>}
      {items && !favs.length && (
        <p className="empty">Yukarıdan ilgilendiğin kategorileri seç, akışın burada oluşsun.</p>
      )}
      {items && favs.length > 0 && !items.length && (
        <p className="empty">Seçtiğin kategorilerde haber yok.</p>
      )}
      {items && items.length > 0 && (
        <div className="feed">{items.map((a) => <Card key={a.id} a={a} />)}</div>
      )}
    </>
  );
}
