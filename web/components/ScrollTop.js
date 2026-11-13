"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function ScrollTop() {
  const [show, setShow] = useState(false);
  const path = usePathname();

  useEffect(() => {
    const on = () => setShow(window.scrollY > 900);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  if (!show || (path || "").startsWith("/yonetim")) return null;

  return (
    <button
      type="button"
      className="to-top"
      aria-label="Yukarı çık"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
