"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const KEY = "okunan";
const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

export default function ReadState() {
  const path = usePathname();
  useEffect(() => {
    const m = /^\/haber\/([0-9a-f-]{36})/i.exec(path || "");
    if (m) {
      const list = read();
      if (!list.includes(m[1])) {
        try {
          localStorage.setItem(KEY, JSON.stringify([m[1], ...list].slice(0, 500)));
        } catch {}
      }
    }
    let t;
    const mark = () => {
      const seen = new Set(read());
      document.querySelectorAll(".wire[data-id]").forEach((el) => {
        el.classList.toggle("read", seen.has(el.dataset.id));
      });
    };
    mark();
    const obs = new MutationObserver(() => {
      clearTimeout(t);
      t = setTimeout(mark, 120);
    });
    obs.observe(document.body, { childList: true, subtree: true });
    return () => {
      obs.disconnect();
      clearTimeout(t);
    };
  }, [path]);
  return null;
}
