"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LiveRefresh({ every = 10000 }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, every);
    return () => clearInterval(t);
  }, [router, every]);
  return null;
}
