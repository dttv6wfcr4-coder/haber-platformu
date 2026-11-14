import { adminDb, isAdmin } from "../../../../lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) return new Response("Yetkisiz", { status: 401 });
  const { data } = await adminDb()
    .from("sources")
    .select("name,rss_url,language,default_category_slug")
    .order("name");
  const text = (data || [])
    .filter((s) => /^https?:/i.test(s.rss_url))
    .map((s) => `${s.name} | ${s.rss_url} | ${s.language} | ${s.default_category_slug}`)
    .join("\n");
  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="kaynaklar.txt"',
    },
  });
}
