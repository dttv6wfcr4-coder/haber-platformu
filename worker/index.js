import { createClient } from "@supabase/supabase-js";
import Parser from "rss-parser";

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const parser = new Parser({
  timeout: 15000,
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumb"],
    ],
  },
});

const MODELS = (process.env.GEMINI_MODELS || "gemini-3.5-flash-lite,gemini-3.6-flash").split(",");
const PER_SOURCE = 5;
const BATCH = 12;
const DEADLINE = Date.now() + 9 * 60 * 1000;
const left = () => DEADLINE - Date.now();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (s) => (s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const getImage = (it) =>
  it.enclosure?.url || it.mediaContent?.$?.url || it.mediaThumb?.$?.url || null;

async function pool(items, size, fn) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k]);
      }
    })
  );
  return out;
}

async function gemini(prompt) {
  let lastErr;
  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      if (left() < 20000) throw new Error("zaman doldu");
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": process.env.GEMINI_API_KEY,
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
            }),
            signal: AbortSignal.timeout(45000),
          }
        );
        if (r.ok) {
          const j = await r.json();
          return JSON.parse(j.candidates[0].content.parts[0].text);
        }
        lastErr = new Error(`Gemini ${model} ${r.status}: ${(await r.text()).slice(0, 160)}`);
        if ([400, 403, 404].includes(r.status)) break;
        await sleep(3000 * attempt);
      } catch (e) {
        lastErr = e;
        await sleep(2000);
      }
    }
  }
  throw lastErr || new Error("Gemini yanıt vermedi");
}

async function translateAndTag(items, slugs) {
  const prompt = `Aşağıdaki haberleri doğal ve akıcı Türkçeye çevir ve her birini verilen kategorilerden BİRİNE ata.
Kategoriler: ${slugs.join(", ")}
Kurallar: title_tr kısa bir haber başlığı olsun, summary_tr en fazla 2 cümle olsun. Sadece şu formatta JSON dizisi döndür:
[{"i":0,"title_tr":"...","summary_tr":"...","category":"..."}]
Haberler:
${JSON.stringify(items.map((x, i) => ({ i, title: x.title, text: x.text.slice(0, 400) })))}`;
  return gemini(prompt);
}

const { data: cats, error: ce } = await sb.from("categories").select("id,slug");
if (ce || !cats?.length) {
  console.error("Kategoriler okunamadı:", ce?.message);
  process.exit(1);
}
const catId = Object.fromEntries(cats.map((c) => [c.slug, c.id]));
const slugs = Object.keys(catId);

const { data: sources, error: se } = await sb.from("sources").select("*").eq("is_active", true);
if (se || !sources) {
  console.error("Kaynaklar okunamadı:", se?.message);
  process.exit(1);
}
const { data: bw } = await sb.from("blocked_words").select("word");
const blocked = (bw || []).map((b) => b.word.toLowerCase());

const toRow = (x, titleTr, summaryTr, slug) => {
  const d = new Date(x.date);
  const bad = isNaN(d) || d.getTime() > Date.now() + 3600000;
  return {
    source_id: x.s.id,
    category_id: catId[slug] || catId[x.s.default_category_slug],
    original_url: x.link,
    original_title: x.title,
    original_language: x.s.language,
    title_tr: titleTr || x.title,
    summary_tr: summaryTr || null,
    image_url: x.image,
    published_at: bad ? new Date().toISOString() : d.toISOString(),
  };
};

async function save(rows) {
  if (!rows.length) return 0;
  const { error } = await sb
    .from("articles")
    .upsert(rows, { onConflict: "original_url", ignoreDuplicates: true });
  if (error) {
    console.error("Kayıt HATA:", error.message);
    return 0;
  }
  return rows.length;
}

let failed = 0;
const active = sources.filter((s) => /^https?:\/\//i.test(s.rss_url));
const feeds = await pool(active, 10, async (s) => {
  try {
    const feed = await parser.parseURL(s.rss_url);
    return feed.items
      .filter((i) => i.link && i.title)
      .slice(0, PER_SOURCE)
      .map((i) => ({
        s,
        link: i.link,
        title: clean(i.title),
        text: clean(i.contentSnippet || i.content || i.summary),
        image: getImage(i),
        date: i.isoDate || i.pubDate,
      }));
  } catch (e) {
    failed++;
    console.error(`${s.name} HATA:`, e.message || e);
    return [];
  }
});

const all = feeds
  .flat()
  .filter((x) => !blocked.some((w) => `${x.title} ${x.text}`.toLowerCase().includes(w)));
const links = [...new Set(all.map((x) => x.link))];
const seen = new Set();
for (let i = 0; i < links.length; i += 50) {
  const { data } = await sb
    .from("articles")
    .select("original_url")
    .in("original_url", links.slice(i, i + 50));
  (data || []).forEach((r) => seen.add(r.original_url));
}
const uniq = new Map();
all.forEach((x) => {
  if (!seen.has(x.link) && !uniq.has(x.link)) uniq.set(x.link, x);
});
const fresh = [...uniq.values()].sort((a, b) => new Date(b.date) - new Date(a.date));

let saved = 0;
const tr = fresh.filter((x) => x.s.language === "tr");
const foreign = fresh.filter((x) => x.s.language !== "tr");

const trSaved = await save(
  tr.map((x) => toRow(x, x.title, x.text.slice(0, 220), x.s.default_category_slug))
);
saved += trSaved;
console.log(`Türkçe kaynaklar: ${trSaved} haber kaydedildi`);

let foreignSaved = 0;
for (let i = 0; i < foreign.length; i += BATCH) {
  if (left() < 30000) {
    console.log(`Süre doldu, ${foreign.length - i} haber sonraki tura kaldı`);
    break;
  }
  const chunk = foreign.slice(i, i + BATCH);
  try {
    const out = await translateAndTag(chunk, slugs);
    const rows = chunk
      .map((x, k) => {
        const o = out.find((v) => v.i === k);
        return o ? toRow(x, o.title_tr, o.summary_tr, o.category) : null;
      })
      .filter(Boolean);
    foreignSaved += await save(rows);
    console.log(`Yabancı kaynaklar: ${rows.length} haber çevrilip kaydedildi`);
  } catch (e) {
    console.error("Çeviri HATA:", e.message || e);
  }
  await sleep(2500);
}
saved += foreignSaved;

console.log(`Bitti. Kaydedilen: ${saved}, hatalı kaynak: ${failed}/${active.length}`);
if (active.length && failed === active.length) process.exit(1);
