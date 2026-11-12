"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminDb, isAdmin, makeToken, safeEqual } from "../../lib/admin";

export async function login(formData) {
  const pw = String(formData.get("pw") || "");
  await new Promise((r) => setTimeout(r, 1000));
  if (process.env.ADMIN_PASSWORD && safeEqual(pw, process.env.ADMIN_PASSWORD)) {
    cookies().set("adm", makeToken(), {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/yonetim",
      maxAge: 7 * 24 * 3600,
    });
  }
  redirect("/yonetim");
}

export async function logout() {
  cookies().set("adm", "", { path: "/yonetim", maxAge: 0 });
  redirect("/yonetim");
}

export async function updateArticle(formData) {
  if (!isAdmin()) return;
  const title = String(formData.get("title_tr") || "").trim();
  if (!title) return;
  await adminDb()
    .from("articles")
    .update({
      title_tr: title,
      summary_tr: String(formData.get("summary_tr") || "").trim() || null,
      category_id: Number(formData.get("category_id")),
    })
    .eq("id", String(formData.get("id")));
  revalidatePath("/", "layout");
}

export async function setHidden(formData) {
  if (!isAdmin()) return;
  await adminDb()
    .from("articles")
    .update({ is_hidden: formData.get("hide") === "1" })
    .eq("id", String(formData.get("id")));
  revalidatePath("/", "layout");
}

export async function toggleSource(formData) {
  if (!isAdmin()) return;
  await adminDb()
    .from("sources")
    .update({ is_active: formData.get("active") === "1" })
    .eq("id", Number(formData.get("id")));
  revalidatePath("/yonetim/kaynaklar");
}
