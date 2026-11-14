import { createClient } from "@supabase/supabase-js";
import Parser from "rss-parser";

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "HaberPlatformu/1.0 (RSS okuyucu; +https://haberplatformu.xyz)" },
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumb"],
    ],
  },
});

const MODELS = (process.env.GEMINI_MODELS || "gemini-3.5-flash-lite,gemini-3.6-flash").split(",");
const METHOD = "rss-ozet-v2";
const PER_SOURCE = 5;
const BATCH = 10;
const START = Date.now();
const DEADLINE = START + 9 * 60 * 1000;
const left = () => DEADLINE - Date.now();
setTimeout(() => {
  console.log("Zaman aşımı, kapatılıyor");
  process.exit(0);
}, 10 * 60 * 1000);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (s) => (s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const getImage = (it) =>
  it.enclosure?.url || it.mediaContent?.$?.url || it.mediaThumb?.$?.url || null;
const photoOk = (s) => Boolean(s.show_images && s.image_license && s.image_license !== "yok");

const errors = [];
const failedSources = [];
const fail = (source, message) => {
  const m = String(message?.message || message).slice(0, 300);
  console.error(`${source} HATA:`, m);
  errors.push({ source: String(source).slice(0, 80), message: m });
};

function canon(u) {
  try {
    const x = new URL(u);
    x.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid", "ref", "ocid", "cmpid", "at_medium", "at_campaign"].forEach((k) =>
      x.searchParams.delete(k)
    );
    let s = x.toString();
    if (s.endsWith("/") && x.pathname !== "/") s = s.slice(0, -1);
    return s;
  } catch {
    return u;
  }
}
const words = (s) =>
  String(s || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
const normTitle = (s) => words(s).join(" ");
function shingles(w, n = 5) {
  const out = new Set();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(" "));
  return out;
}
function overlap(a, b) {
  const sb2 = shingles(words(b));
  let c = 0;
  for (const s of shingles(words(a))) if (sb2.has(s)) c++;
  return c;
}

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
          return { data: JSON.parse(j.candidates[0].content.parts[0].text), model };
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

async function summarize(items, slugs) {
  const prompt = `Sen tarafsız bir haber editörüsün. Aşağıdaki haberlerin her biri yalnızca kaynağın başlığı ve kısa RSS açıklamasıdır (tam metin yok).
Her haber için:
1. Yalnızca verilen bilgilerdeki doğrulanabilir olguları belirle: kim, ne, nerede, ne zaman, sayılar.
2. Bu olgulardan KENDİ CÜMLELERİNLE özgün bir Türkçe başlık (en fazla 80 karakter) ve özet (en fazla 2 kısa cümle) yaz.
Kurallar:
- Kaynaktaki cümleleri, ifade kalıplarını, deyimleri ve anlatım biçimini taklit etme; aynı kelime dizilerini kopyalama (özel adlar ve sayılar hariç). Yabancı dildeki metni sözcük sözcük çevirme.
- Verilmeyen hiçbir bilgiyi ekleme, tahmin yürütme, yorum katma.
- Doğrulanmamış iddiaları gerçek gibi yazma; "iddia edildi", "açıkladı" gibi atıf kullan.
- Bilgi yetersizse özeti kısa tut.
- İddia, suçlama, ölüm, cinsel saldırı, çocuk, savaş suçu ya da hukuki belirsizlik içeren hassas haberlerde "review": true yaz, diğerlerinde false.
Kategoriler: ${slugs.join(", ")}
Sadece şu biçimde JSON dizisi döndür:
[{"i":0,"title_tr":"...","summary_tr":"...","category":"...","review":false}]
Haberler:
${JSON.stringify(items.map((x, i) => ({ i, kaynak: x.s.name, baslik: x.title, aciklama: x.text.slice(0, 400) })))}`;
  return gemini(prompt);
}

const { data: cats, error: ce } = await sb.from("categories").select("id,slug");
if (ce || !cats?.length) {
  console.error("Kategoriler okunamadı:", ce?.message);
  process.exit(1);
}
const catId = Object.fromEntries(cats.map((c) => [c.slug, c.id]));
const slugs = Object.keys(catId);

const { data: sources, error: se } = await sb
  .from("sources")
  .select("*")
  .eq("is_active", true)
  .neq("license_status", "izin_yok");
if (se || !sources) {
  console.error("Kaynaklar okunamadı:", se?.message);
  process.exit(1);
}
const { data: bw } = await sb.from("blocked_words").select("word");
const blocked = (bw || []).map((b) => b.word.toLowerCase());
const { data: rem } = await sb.from("removed_urls").select("url");
const removed = new Set((rem || []).map((r) => r.url));

function toRow(x, o, model) {
  const title = String(o?.title_tr || "").trim().slice(0, 140);
  const summary = String(o?.summary_tr || "").trim().slice(0, 400);
  if (!title || !summary) return null;
  const d = new Date(x.date);
  const badDate = isNaN(d) || d.getTime() > Date.now() + 3600000;
  const ov = overlap(`${title} ${summary}`, `${x.title} ${x.text}`);
  const reasons = [];
  if (x.s.license_status !== "izinli") reasons.push("kaynak lisansı doğrulanmadı");
  if (ov > 0) reasons.push("kaynak metne benzerlik");
  if (o.review === true) reasons.push("hassas içerik");
  const slug = catId[o.category] ? o.category : x.s.default_category_slug;
  return {
    source_id: x.s.id,
    category_id: catId[slug] || catId[x.s.default_category_slug],
    original_url: x.link,
    original_title: x.title,
    original_language: x.s.language,
    title_tr: title,
    summary_tr: summary,
    image_url: x.image,
    image_license: x.image ? x.s.image_license : null,
    image_credit: x.image ? x.s.name : null,
    author: x.author,
    published_at: badDate ? new Date().toISOString() : d.toISOString(),
    review_status: reasons.length ? "beklemede" : "yayinda",
    review_reason: reasons.length ? reasons.join("; ") : null,
    ai_method: METHOD,
    ai_model: model,
    overlap: ov,
  };
}

async function save(rows) {
  if (!rows.length) return 0;
  const { error } = await sb
    .from("articles")
    .upsert(rows, { onConflict: "original_url", ignoreDuplicates: true });
  if (error) {
    fail("Kayıt", error.message);
    return 0;
  }
  return rows.length;
}

const active = sources.filter((s) => /^https?:\/\//i.test(s.rss_url));
const feeds = await pool(active, 10, async (s) => {
  try {
    const feed = await parser.parseURL(s.rss_url);
    return feed.items
      .filter((i) => i.link && i.title)
      .slice(0, PER_SOURCE)
      .map((i) => ({
        s,
        link: canon(i.link),
        rawLink: i.link,
        title: clean(i.title),
        text: clean(i.contentSnippet || i.content || i.summary),
        author: clean(i.creator || i.author || "").slice(0, 120) || null,
        image: photoOk(s) ? getImage(i) : null,
        date: i.isoDate || i.pubDate,
      }));
  } catch (e) {
    failedSources.push(s.name);
    fail(s.name, e);
    return [];
  }
});
console.log(`RSS tarama bitti: ${Math.round((Date.now() - START) / 1000)} sn`);

const all = feeds
  .flat()
  .filter(
    (x) =>
      !removed.has(x.link) &&
      !removed.has(x.rawLink) &&
      !blocked.some((w) => `${x.title} ${x.text}`.toLowerCase().includes(w))
  );

const urls = [...new Set(all.flatMap((x) => [x.link, x.rawLink]))];
const seen = new Set();
for (let i = 0; i < urls.length; i += 40) {
  const { data } = await sb
    .from("articles")
    .select("original_url")
    .in("original_url", urls.slice(i, i + 40));
  (data || []).forEach((r) => seen.add(r.original_url));
}
const { data: recent } = await sb
  .from("articles")
  .select("original_title")
  .order("created_at", { ascending: false })
  .limit(1000);
const titles = new Set((recent || []).map((r) => normTitle(r.original_title)));

const uniq = new Map();
all.forEach((x) => {
  const nt = normTitle(x.title);
  if (seen.has(x.link) || seen.has(x.rawLink) || titles.has(nt) || uniq.has(x.link)) return;
  titles.add(nt);
  uniq.set(x.link, x);
});
const fresh = [...uniq.values()].sort((a, b) => new Date(b.date) - new Date(a.date));
console.log(`Yeni haber adayı: ${fresh.length}`);

let published = 0;
let pending = 0;
for (let i = 0; i < fresh.length; i += BATCH) {
  if (left() < 30000) {
    console.log(`Süre doldu, ${fresh.length - i} haber sonraki tura kaldı`);
    break;
  }
  const chunk = fresh.slice(i, i + BATCH);
  try {
    const { data: out, model } = await summarize(chunk, slugs);
    const list = Array.isArray(out) ? out : [];
    const rows = [];
    chunk.forEach((x, k) => {
      const row = toRow(x, list.find((v) => v.i === k), model);
      if (row) rows.push(row);
      else fail(x.s.name, "Yapay zekâ geçerli özet üretmedi");
    });
    const n = await save(rows);
    if (n) {
      published += rows.filter((r) => r.review_status === "yayinda").length;
      pending += rows.filter((r) => r.review_status !== "yayinda").length;
    }
    console.log(`Parti ${Math.floor(i / BATCH) + 1}: ${rows.length} haber işlendi`);
  } catch (e) {
    fail("Yapay zekâ", e);
  }
  await sleep(2500);
}

await sb.from("worker_runs").insert({
  saved: published + pending,
  failed: failedSources.length,
  total: active.length,
  seconds: Math.round((Date.now() - START) / 1000),
  errors: failedSources.slice(0, 12).join(", ") || null,
});
if (errors.length) await sb.from("worker_errors").insert(errors.slice(0, 50));

console.log(
  `Bitti. Yayında: ${published}, incelemede: ${pending}, hatalı kaynak: ${failedSources.length}/${active.length}`
);
process.exit(active.length && failedSources.length === active.length ? 1 : 0);
