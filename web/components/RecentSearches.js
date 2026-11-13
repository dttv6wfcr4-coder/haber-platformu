"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "aramalar";

export default function RecentSearches({ q }) {
  const [list, setList] = useState([]);

  useEffect(() => {
    let l = [];
    try {
      l = JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {}
    if (q) {
      l = [q, ...l.filter((x) => x !== q)].slice(0, 8);
      try {
        localStorage.setItem(KEY, JSON.stringify(l));
      } catch {}
    }
    setList(l);
  }, [q]);

  if (!list.length) return null;

  return (
    <div className="recent">
      <div className="recent-head">
        <span>Son aramalar</span>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.removeItem(KEY);
            } catch {}
            setList([]);
          }}
        >
          Temizle
        </button>
      </div>
      <div className="chips-row">
        {list.map((w) => (
          <Link key={w} href={`/ara?q=${encodeURIComponent(w)}`}>
            {w}
          </Link>
        ))}
      </div>
    </div>
  );
}
