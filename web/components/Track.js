"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

let first = true;

export default function Track() {
  const path = usePathname();
  useEffect(() => {
    if (!path || path.startsWith("/yonetim")) return;
    if (navigator.doNotTrack === "1") return;
    const body = JSON.stringify({
      path,
      ref: first ? document.referrer || "" : "",
    });
    first = false;
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/ziyaret", new Blob([body], { type: "application/json" }));
      } else {
        fetch("/api/ziyaret", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        });
      }
    } catch {}
  }, [path]);
  return null;
}
