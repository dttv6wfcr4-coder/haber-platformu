"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { adminDb, makeToken, safeEqual } from "../../lib/admin";

export async function loginSafe(formData) {
  const pw = String(formData.get("pw") || "");
  const ip = (headers().get("x-forwarded-for") || "").split(",")[0].trim();
  const ipHash = crypto
    .createHash("sha256")
    .update(`${ip}|${process.env.ADMIN_SECRET || ""}`)
    .digest("hex")
    .slice(0, 16);
  const db = adminDb();

  const since = new Date(Date.now() - 15 * 60000).toISOString();
  const { count } = await db
    .from("login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gt("created_at", since);
  if ((count || 0) >= 5) redirect("/yonetim?hata=kilit");

  await new Promise((r) => setTimeout(r, 800));

  if (process.env.ADMIN_PASSWORD && safeEqual(pw, process.env.ADMIN_PASSWORD)) {
    cookies().set("adm", makeToken(), {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/yonetim",
      maxAge: 7 * 24 * 3600,
    });
    await db.from("login_attempts").delete().eq("ip_hash", ipHash);
    await db.from("admin_log").insert({ action: "Giriş yapıldı" });
    redirect("/yonetim");
  }

  await db.from("login_attempts").insert({ ip_hash: ipHash });
  await db.from("admin_log").insert({ action: "Başarısız giriş denemesi" });
  redirect("/yonetim?hata=sifre");
}
