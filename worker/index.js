import { createClient } from "@supabase/supabase-js";
import Parser from "rss-parser";

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const parser = new Parser({
  timeout: 15000,
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumb"],
    ],
  },
});

const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const PER_SOURCE = 5;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (s) =>
  (s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const getImage = (it) =>
  it.enclosure?.url || it.mediaContent?.$?.url || it.mediaThumb?.$?.url || null;

async function translateAndTag(items, slugs) {
  const prompt = `Aşağıdaki haberleri doğal ve akıcı Türkçeye çevir (zaten Türkçeyse düzelt, aynen bırak) ve her birini verilen kategorilerden BİRİNE ata.
Kategoriler: ${slugs.join(", ")}
Kurallar: title_tr kısa bir haber başlığı olsun, summary_tr en fazla 2 cümle olsun. Sadece şu formatta JSON dizisi döndür:
[{"i":0,"title_tr":"...","summary_tr":"...","category":"..."}]
Haberler:
${JSON.stringify(
  items.map((x, i) => ({ i, title: x.title, text: x.text.slice(0, 500) }))
)}`;

  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
            signal: AbortSignal.timeout(120000),

      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
    }
  );
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  return JSON.parse(j.candidates[0].content.parts[0].text);
}

const { data: cats } = await sb.from("categories").select("id,slug");
const catId = Object.fromEntries(cats.map((c) => [c.slug, c.id]));
const slugs = Object.keys(catId);
const { data: sources } = await sb
  .from("sources")
  .select("*")
  .eq("is_active", true);

let saved = 0;
let failed = 0;

for (const s of sources) {
  try {
    const feed = await parser.parseURL(s.rss_url);
    const items = feed.items.filter((i) => i.link && i.title).slice(0, PER_SOURCE);
    if (!items.length) continue;

    const { data: existing } = await sb
      .from("articles")
      .select("original_url")
      .in("original_url", items.map((i) => i.link));
    const seen = new Set((existing || []).map((e) => e.original_url));

    const fresh = items
      .filter((i) => !seen.has(i.link))
      .map((i) => ({
        link: i.link,
        title: clean(i.title),
        text: clean(i.contentSnippet || i.content || i.summary),
        image: getImage(i),
        date: i.isoDate || i.pubDate,
      }));

    if (!fresh.length) {
      console.log(`${s.name}: yeni haber yok`);
      continue;
    }

    const out = await translateAndTag(fresh, slugs);

    const rows = fresh
      .map((f, i) => {
        const o = out.find((x) => x.i === i);
        if (!o) return null;
        const slug = catId[o.category] ? o.category : s.default_category_slug;
        const d = new Date(f.date);
        return {
          source_id: s.id,
          category_id: catId[slug],
          original_url: f.link,
          original_title: f.title,
          original_language: s.language,
          title_tr: o.title_tr || f.title,
          summary_tr: o.summary_tr || null,
          image_url: f.image,
          published_at: isNaN(d) ? new Date().toISOString() : d.toISOString(),
        };
      })
      .filter(Boolean);

    const { error } = await sb
      .from("articles")
      .upsert(rows, { onConflict: "original_url", ignoreDuplicates: true });
    if (error) throw error;

    saved += rows.length;
    console.log(`${s.name}: ${rows.length} haber kaydedildi`);
  } catch (e) {
    failed++;
        console.error(`${s.name} HATA:`, e.message || e, e.cause?.message || e.cause?.code || "");

  }
  await sleep(6000); // Gemini ücretsiz kota için bekleme
}

console.log(`Bitti. Kaydedilen: ${saved}, hatalı kaynak: ${failed}`);
if (saved === 0 && failed === sources.length) process.exit(1);
