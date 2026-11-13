import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const REASONS = [
  "Yanlış çeviri",
  "Telif hakkı / kaldırma talebi",
  "Uygunsuz içerik",
  "Diğer",
];

export async function POST(req) {
  try {
    const b = await req.json();
    if (b.website) return Response.json({ ok: true });
    const reason = String(b.reason || "");
    if (!REASONS.includes(reason)) return Response.json({ ok: false }, { status: 400 });
    const id = String(b.article_id || "");
    const articleId = /^[0-9a-f-]{36}$/i.test(id) ? id : null;
    const message = String(b.message || "").trim().slice(0, 1000);
    const email = String(b.email || "").trim().slice(0, 120);

    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
    const ipHash = crypto
      .createHash("sha256")
      .update(`${ip}|${process.env.ADMIN_SECRET || ""}`)
      .digest("hex")
      .slice(0, 16);

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      { auth: { persistSession: false } }
    );
    const since = new Date(Date.now() - 10 * 60000).toISOString();
    const { count } = await db
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gt("created_at", since);
    if ((count || 0) >= 3) return Response.json({ ok: false }, { status: 429 });

    const { error } = await db.from("reports").insert({
      article_id: articleId,
      reason,
      message: message || null,
      email: email || null,
      ip_hash: ipHash,
    });
    return Response.json({ ok: !error }, { status: error ? 500 : 200 });
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
}
