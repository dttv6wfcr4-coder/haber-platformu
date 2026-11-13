import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp|telegram|curl|wget|python|vercel/i;

export async function POST(req) {
  try {
    const ua = req.headers.get("user-agent") || "";
    if (!ua || BOT.test(ua)) return new Response(null, { status: 204 });
    const body = await req.json();
    const path = String(body.path || "").slice(0, 200);
    if (!path.startsWith("/") || path.startsWith("/yonetim") || path.startsWith("/api")) {
      return new Response(null, { status: 204 });
    }

    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
    const day = new Date().toISOString().slice(0, 10);
    const visitor = crypto
      .createHash("sha256")
      .update(`${ip}|${ua}|${day}|${process.env.ADMIN_SECRET || ""}`)
      .digest("hex")
      .slice(0, 16);

    let referrer = null;
    try {
      const h = new URL(String(body.ref || "")).hostname.replace(/^www\./, "");
      const self = (req.headers.get("host") || "").replace(/^www\./, "");
      if (h && h !== self) referrer = h.slice(0, 80);
    } catch {}

    const device = /ipad|tablet/i.test(ua)
      ? "tablet"
      : /mobi|iphone|android/i.test(ua)
      ? "mobil"
      : "masaüstü";
    const country = (req.headers.get("x-vercel-ip-country") || "").slice(0, 2) || null;

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      { auth: { persistSession: false } }
    );
    await db.from("visits").insert({ path, visitor, referrer, device, country });
  } catch {}
  return new Response(null, { status: 204 });
}
