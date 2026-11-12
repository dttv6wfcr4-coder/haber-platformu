"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sb } from "../lib/db";

export default function Fresh({ latest, categoryId, sourceId }) {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const busy = useRef(false);

  useEffect(() => {
    setCount(0);
    if (!latest) return;

    async function check() {
      if (busy.current || document.visibilityState !== "visible") return;
      busy.current = true;
      let q = sb
        .from("articles")
        .select("id", { count: "exact", head: true })
        .gt("created_at", latest);
      if (categoryId) q = q.eq("category_id", categoryId);
      if (sourceId) q = q.eq("source_id", sourceId);
      const { count: n } = await q;
      busy.current = false;
      if (!n) return;
      if (window.scrollY < 120) router.refresh();
      else setCount(n);
    }

    const timer = setInterval(check, 45000);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
    };
  }, [latest, categoryId, sourceId, router]);

  if (!count) return null;
  return (
    <button
      type="button"
      className="fresh"
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        router.refresh();
        setCount(0);
      }}
    >
      {count} yeni haber
    </button>
  );
}
