import { sb } from "../lib/db";

export const revalidate = 3600;
const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap() {
  const { data: cats } = await sb.from("categories").select("slug");
  const { data: arts } = await sb
    .from("articles")
    .select("id,published_at")
    .order("published_at", { ascending: false })
    .limit(1000);

  return [
    { url: BASE, changeFrequency: "always", priority: 1 },
    ...(cats || []).map((c) => ({
      url: `${BASE}/kategori/${c.slug}`,
      changeFrequency: "hourly",
      priority: 0.8,
    })),
    ...(arts || []).map((a) => ({
      url: `${BASE}/haber/${a.id}`,
      lastModified: a.published_at,
      changeFrequency: "never",
      priority: 0.6,
    })),
  ];
}
