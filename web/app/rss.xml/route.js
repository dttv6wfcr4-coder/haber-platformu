import { sb } from "../../lib/db";

export const revalidate = 300;

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://haberplatformu.xyz";
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export async function GET() {
  const { data } = await sb
    .from("articles")
    .select("id,title_tr,summary_tr,published_at,categories(name_tr)")
    .order("published_at", { ascending: false })
    .limit(50);

  const items = (data || [])
    .map(
      (a) =>
        `<item><title>${esc(a.title_tr)}</title><link>${BASE}/haber/${a.id}</link><guid isPermaLink="true">${BASE}/haber/${a.id}</guid><pubDate>${new Date(a.published_at).toUTCString()}</pubDate>${a.categories ? `<category>${esc(a.categories.name_tr)}</category>` : ""}<description>${esc(a.summary_tr || "")}</description></item>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Haber Platformu</title><link>${BASE}</link><description>Türkiye ve dünyadan son haberler</description><language>tr</language>${items}</channel></rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
