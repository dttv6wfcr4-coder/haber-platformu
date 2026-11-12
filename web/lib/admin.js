import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import crypto from "crypto";

export const adminDb = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false } }
  );

const sign = (v) =>
  crypto.createHmac("sha256", process.env.ADMIN_SECRET || "x").update(v).digest("hex");

export function makeToken() {
  const exp = String(Date.now() + 7 * 24 * 3600 * 1000);
  return `${exp}.${sign(exp)}`;
}

export function isAdmin() {
  if (!process.env.ADMIN_SECRET || !process.env.ADMIN_PASSWORD) return false;
  const t = cookies().get("adm")?.value;
  if (!t) return false;
  const [exp, sig] = t.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(exp));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function safeEqual(a, b) {
  const x = crypto.createHash("sha256").update(a).digest();
  const y = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(x, y);
}
