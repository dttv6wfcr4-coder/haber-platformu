"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminDb, isAdmin, makeToken, safeEqual } from "../../lib/admin";

const done = () => revalidatePath("/", "layout");
const back = (path, msg) => redirect(`${path}?msg=${encodeURIComponent(msg)}`);
const isUrl = (u) => /^https?:\/\//i.test(u);

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
  done();
}

export async function setHidden(formData) {
  if (!isAdmin()) return;
  await adminDb()
    .from("articles")
    .update({ is_hidden: formData.get("hide") === "1" })
    .eq("id", String(formData.get("id")));
  done();
}

export async function togglePin(formData) {
  if (!isAdmin()) return;
  await adminDb()
    .from("articles")
    .update({ is_pinned: formData.get("pin") === "1" })
    .eq("id", String(formData.get("id")));
  done();
}

export async function bulkAction(formData) {
  if (!isAdmin()) return;
  const ids = formData.getAll("ids").map(String);
  const op = String(formData.get("op") || "");
  if (!ids.length) return;
  const db = adminDb();
  const upd = (v) => db.from("articles").update(v).in("id", ids);
  if (op === "hide") await upd({ is_hidden: true });
  else if (op === "show") await upd({ is_hidden: false });
  else if (op === "pin") await upd({ is_pinned: true });
  else if (op === "unpin") await upd({ is_pinned: false });
  else if (op === "cat") {
    const c = Number(formData.get("category_id"));
    if (c) await upd({ category_id: c });
  }
  done();
}

export async function addArticle(formData) {
  if (!isAdmin()) return;
  const title = String(formData.get("title") || "").trim();
  const url = String(formData.get("url") || "").trim();
  const summary = String(formData.get("summary") || "").trim();
  const cat = Number(formData.get("category_id"));
  if (!title || !isUrl(url) || !cat)
    return back("/yonetim/ekle", "Başlık, geçerli bağlantı ve kategori gerekli");
  const db = adminDb();
  const { data: src } = await db
    .from("sources")
    .select("id")
    .eq("rss_url", "manual://editor")
    .single();
  const { error } = await db.from("articles").insert({
    source_id: src?.id ?? null,
    category_id: cat,
    original_url: url,
    original_title: title,
    original_language: "tr",
    title_tr: title,
    summary_tr: summary || null,
    published_at: new Date().toISOString(),
    is_pinned: formData.get("pin") === "1",
  });
  done();
  back("/yonetim/ekle", error ? "Eklenemedi (bu bağlantı zaten kayıtlı olabilir)" : "Haber eklendi");
}

export async function addSource(formData) {
  if (!isAdmin()) return;
  const name = String(formData.get("name") || "").trim();
  const url = String(formData.get("url") || "").trim();
  const slug = String(formData.get("slug") || "");
  const lang = formData.get("language") === "tr" ? "tr" : "en";
  if (!name || !isUrl(url) || !slug)
    return back("/yonetim/kaynaklar", "Ad, geçerli RSS adresi ve kategori gerekli");
  const { error } = await adminDb().from("sources").insert({
    name,
    rss_url: url,
    language: lang,
    default_category_slug: slug,
  });
  back("/yonetim/kaynaklar", error ? "Eklenemedi (adres zaten kayıtlı olabilir)" : "Kaynak eklendi");
}

export async function toggleSource(formData) {
  if (!isAdmin()) return;
  await adminDb()
    .from("sources")
    .update({ is_active: formData.get("active") === "1" })
    .eq("id", Number(formData.get("id")));
  revalidatePath("/yonetim/kaynaklar");
}

export async function setSourceCategory(formData) {
  if (!isAdmin()) return;
  await adminDb()
    .from("sources")
    .update({ default_category_slug: String(formData.get("slug")) })
    .eq("id", Number(formData.get("id")));
  revalidatePath("/yonetim/kaynaklar");
}

export async function addWord(formData) {
  if (!isAdmin()) return;
  const w = String(formData.get("word") || "").trim().toLowerCase();
  if (w.length < 3) return back("/yonetim/araclar", "En az 3 karakter girin");
  const { error } = await adminDb().from("blocked_words").insert({ word: w });
  back("/yonetim/araclar", error ? "Eklenemedi (zaten var olabilir)" : "Kelime eklendi");
}

export async function delWord(formData) {
  if (!isAdmin()) return;
  await adminDb().from("blocked_words").delete().eq("id", Number(formData.get("id")));
  back("/yonetim/araclar", "Kelime silindi");
}

export async function saveBanner(formData) {
  if (!isAdmin()) return;
  const v = String(formData.get("banner") || "").trim().slice(0, 200);
  await adminDb().from("settings").upsert({ key: "banner", value: v });
  done();
  back("/yonetim/araclar", v ? "Duyuru yayında" : "Duyuru kaldırıldı");
}

export async function cleanup(formData) {
  if (!isAdmin()) return;
  const days = Number(formData.get("days"));
  if (!(days >= 7) || formData.get("ok") !== "1")
    return back("/yonetim/araclar", "En az 7 gün girin ve onay kutusunu işaretleyin");
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  const { count, error } = await adminDb()
    .from("articles")
    .delete({ count: "exact" })
    .lt("published_at", cutoff)
    .eq("is_pinned", false);
  done();
  back("/yonetim/araclar", error ? "Silinemedi" : `${count ?? 0} haber silindi`);
}

export async function runWorker() {
  if (!isAdmin()) return;
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  let msg = "GITHUB_TOKEN veya GITHUB_REPO tanımlı değil";
  if (token && repo) {
    const r = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/fetch-news.yml/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ref: "main" }),
      }
    );
    msg =
      r.status === 204
        ? "Worker başlatıldı, 1-3 dakika içinde yeni haberler gelir"
        : `GitHub hatası: ${r.status}`;
  }
  back("/yonetim/araclar", msg);
}
export async function toggleImages(formData) {
  if (!isAdmin()) return;
  await adminDb()
    .from("sources")
    .update({ show_images: formData.get("on") === "1" })
    .eq("id", Number(formData.get("id")));
  revalidatePath("/yonetim/kaynaklar");
  done();
}
export async function hideSource(formData) {
  if (!isAdmin()) return;
  const hide = formData.get("hide") === "1";
  await adminDb()
    .from("articles")
    .update({ is_hidden: hide })
    .eq("source_id", Number(formData.get("id")));
  done();
  back(
    "/yonetim/kaynaklar",
    hide ? "Kaynağın tüm haberleri gizlendi" : "Kaynağın haberleri geri getirildi"
  );
}

export async function applyBlocked() {
  if (!isAdmin()) return;
  const db = adminDb();
  const { data: words } = await db.from("blocked_words").select("word");
  for (const w of words || []) {
    const p = w.word.replace(/[%,()]/g, " ").trim();
    if (p.length >= 3) {
      await db
        .from("articles")
        .update({ is_hidden: true })
        .or(`title_tr.ilike.%${p}%,summary_tr.ilike.%${p}%`);
    }
  }
  done();
  back("/yonetim/araclar", "Yasaklı kelimeler mevcut haberlere uygulandı");
}
