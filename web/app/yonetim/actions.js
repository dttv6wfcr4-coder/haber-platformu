"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminDb, isAdmin } from "../../lib/admin";

const done = () => revalidatePath("/", "layout");
const back = (path, msg) => redirect(`${path}?msg=${encodeURIComponent(msg)}`);
const isUrl = (u) => /^https?:\/\//i.test(u);

async function log(db, text) {
  try {
    await db.from("admin_log").insert({ action: String(text).slice(0, 300) });
  } catch {}
}

export async function logout() {
  cookies().set("adm", "", { path: "/yonetim", maxAge: 0 });
  redirect("/yonetim");
}

export async function updateArticle(formData) {
  if (!isAdmin()) return;
  const title = String(formData.get("title_tr") || "").trim();
  if (!title) return;
  const db = adminDb();
  await db
    .from("articles")
    .update({
      title_tr: title,
      summary_tr: String(formData.get("summary_tr") || "").trim() || null,
      category_id: Number(formData.get("category_id")),
    })
    .eq("id", String(formData.get("id")));
  await log(db, `Haber düzenlendi: ${title}`);
  done();
}

export async function setHidden(formData) {
  if (!isAdmin()) return;
  const hide = formData.get("hide") === "1";
  const db = adminDb();
  await db
    .from("articles")
    .update({ is_hidden: hide })
    .eq("id", String(formData.get("id")));
  await log(db, `Haber ${hide ? "gizlendi" : "geri getirildi"}: ${String(formData.get("id")).slice(0, 8)}`);
  done();
}

export async function togglePin(formData) {
  if (!isAdmin()) return;
  const pin = formData.get("pin") === "1";
  const db = adminDb();
  await db
    .from("articles")
    .update({ is_pinned: pin })
    .eq("id", String(formData.get("id")));
  await log(db, `Haber ${pin ? "sabitlendi" : "sabiti kaldırıldı"}: ${String(formData.get("id")).slice(0, 8)}`);
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
  await log(db, `Toplu işlem (${op}): ${ids.length} haber`);
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
  await log(db, `Haber eklendi: ${title}`);
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
  const db = adminDb();
  const { error } = await db.from("sources").insert({
    name,
    rss_url: url,
    language: lang,
    default_category_slug: slug,
  });
  await log(db, `Kaynak eklendi: ${name}`);
  back("/yonetim/kaynaklar", error ? "Eklenemedi (adres zaten kayıtlı olabilir)" : "Kaynak eklendi");
}

export async function toggleSource(formData) {
  if (!isAdmin()) return;
  const on = formData.get("active") === "1";
  const db = adminDb();
  await db.from("sources").update({ is_active: on }).eq("id", Number(formData.get("id")));
  await log(db, `Kaynak ${on ? "açıldı" : "kapatıldı"}: #${formData.get("id")}`);
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

export async function toggleImages(formData) {
  if (!isAdmin()) return;
  const on = formData.get("on") === "1";
  const db = adminDb();
  await db.from("sources").update({ show_images: on }).eq("id", Number(formData.get("id")));
  await log(db, `Kaynak görselleri ${on ? "açıldı" : "kapatıldı"}: #${formData.get("id")}`);
  revalidatePath("/yonetim/kaynaklar");
  done();
}

export async function hideSource(formData) {
  if (!isAdmin()) return;
  const hide = formData.get("hide") === "1";
  const db = adminDb();
  await db
    .from("articles")
    .update({ is_hidden: hide })
    .eq("source_id", Number(formData.get("id")));
  await log(db, `Kaynağın tüm haberleri ${hide ? "gizlendi" : "geri getirildi"}: #${formData.get("id")}`);
  done();
  back(
    "/yonetim/kaynaklar",
    hide ? "Kaynağın tüm haberleri gizlendi" : "Kaynağın haberleri geri getirildi"
  );
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
  await log(db, "Yasaklı kelimeler mevcut haberlere uygulandı");
  done();
  back("/yonetim/araclar", "Yasaklı kelimeler mevcut haberlere uygulandı");
}

export async function saveBanner(formData) {
  if (!isAdmin()) return;
  const v = String(formData.get("banner") || "").trim().slice(0, 200);
  const db = adminDb();
  await db.from("settings").upsert({ key: "banner", value: v });
  await log(db, v ? `Duyuru yayınlandı: ${v}` : "Duyuru kaldırıldı");
  done();
  back("/yonetim/araclar", v ? "Duyuru yayında" : "Duyuru kaldırıldı");
}

export async function cleanup(formData) {
  if (!isAdmin()) return;
  const days = Number(formData.get("days"));
  if (!(days >= 7) || formData.get("ok") !== "1")
    return back("/yonetim/araclar", "En az 7 gün girin ve onay kutusunu işaretleyin");
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  const db = adminDb();
  const { count, error } = await db
    .from("articles")
    .delete({ count: "exact" })
    .lt("published_at", cutoff)
    .eq("is_pinned", false);
  await log(db, `${days} günden eski haberler silindi: ${count ?? 0}`);
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

export async function reportAction(formData) {
  if (!isAdmin()) return;
  const id = Number(formData.get("id"));
  const op = String(formData.get("op") || "");
  const db = adminDb();
  if (op === "done") await db.from("reports").update({ status: "çözüldü" }).eq("id", id);
  else if (op === "reopen") await db.from("reports").update({ status: "yeni" }).eq("id", id);
  else if (op === "delete") await db.from("reports").delete().eq("id", id);
  else if (op === "hide") {
    const { data: r } = await db.from("reports").select("article_id").eq("id", id).single();
    if (r?.article_id) await db.from("articles").update({ is_hidden: true }).eq("id", r.article_id);
    await db.from("reports").update({ status: "çözüldü" }).eq("id", id);
    done();
  }
  await log(db, `Bildirim #${id}: ${op}`);
  revalidatePath("/yonetim/bildirimler");
}

export async function updateCategory(formData) {
  if (!isAdmin()) return;
  const name = String(formData.get("name") || "").trim().slice(0, 60);
  const order = Number(formData.get("order"));
  if (!name || !Number.isFinite(order))
    return back("/yonetim/kategoriler", "Ad ve sıra gerekli");
  const db = adminDb();
  await db
    .from("categories")
    .update({ name_tr: name, sort_order: order })
    .eq("id", Number(formData.get("id")));
  await log(db, `Kategori güncellendi: ${name}`);
  done();
  back("/yonetim/kategoriler", "Kaydedildi");
}

export async function bulkAddSources(formData) {
  if (!isAdmin()) return;
  const db = adminDb();
  const { data: cats } = await db.from("categories").select("slug");
  const slugs = new Set((cats || []).map((c) => c.slug));
  const rows = [];
  let bad = 0;
  String(formData.get("lines") || "")
    .split("\n")
    .forEach((line) => {
      if (!line.trim()) return;
      const p = line.split("|").map((x) => x.trim());
      if (p.length < 4 || !p[0] || !isUrl(p[1]) || !slugs.has(p[3])) {
        bad++;
        return;
      }
      rows.push({
        name: p[0].slice(0, 80),
        rss_url: p[1],
        language: p[2] === "tr" ? "tr" : "en",
        default_category_slug: p[3],
      });
    });
  if (!rows.length) return back("/yonetim/araclar", `Geçerli satır yok (${bad} hatalı)`);
  const { error } = await db
    .from("sources")
    .upsert(rows.slice(0, 100), { onConflict: "rss_url", ignoreDuplicates: true });
  await log(db, `Toplu kaynak ekleme: ${rows.length} satır`);
  back(
    "/yonetim/araclar",
    error
      ? "Eklenemedi"
      : `${rows.length} kaynak işlendi (var olanlar atlandı), ${bad} hatalı satır`
  );
}

export async function testFeed(formData) {
  if (!isAdmin()) return;
  const url = String(formData.get("url") || "").trim();
  if (!isUrl(url)) return back("/yonetim/araclar", "Geçerli bir adres gir");
  let msg;
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Mozilla/5.0 (haber-test)" },
      redirect: "follow",
    });
    const x = await r.text();
    const count = (x.match(/<item[\s>]/g) || []).length + (x.match(/<entry[\s>]/g) || []).length;
    const m = /<(?:item|entry)[\s>][\s\S]*?<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/.exec(x);
    msg =
      r.ok && count
        ? `Çalışıyor: ${count} haber. İlk başlık: ${(m?.[1] || "").trim().slice(0, 90)}`
        : `Sorunlu: HTTP ${r.status}, ${count} haber bulundu`;
  } catch (e) {
    msg = `Ulaşılamadı: ${e.message || e}`;
  }
  back("/yonetim/araclar", msg);
}

export async function resetVisits(formData) {
  if (!isAdmin()) return;
  if (formData.get("ok") !== "1") return back("/yonetim/araclar", "Onay kutusunu işaretle");
  const db = adminDb();
  await db.from("visits").delete().gte("id", 0);
  await log(db, "Ziyaret kayıtları sıfırlandı");
  back("/yonetim/araclar", "Ziyaret kayıtları silindi");
}
