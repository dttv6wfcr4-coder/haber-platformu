import { adminDb, isAdmin } from "../../../lib/admin";

export const dynamic = "force-dynamic";
const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export async function GET() {
  if (!isAdmin()) return new Response("Yetkisiz", { status: 401 });
  const db = adminDb();
  const rows = [];
  for (let from = 0; from < 20000; from += 1000) {
    const { data } = await db
      .from("articles")
      .select(
        "published_at,title_tr,summary_tr,original_url,is_hidden,is_pinned,categories(name_tr),sources(name)"
      )
      .order("published_at", { ascending: false })
      .range(from, from + 999);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  const head = "tarih,kaynak,kategori,baslik,ozet,baglanti,gizli,sabit";
  const lines = rows.map((a) =>
    [a.published_at, a.sources?.name, a.categories?.name_tr, a.title_tr, a.summary_tr, a.original_url, a.is_hidden, a.is_pinned]
      .map(esc)
      .join(",")
  );
  return new Response("\uFEFF" + [head, ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="haberler.csv"',
    },
  });
}
