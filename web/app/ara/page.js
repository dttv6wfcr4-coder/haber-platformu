import { sb, SELECT } from "../../lib/db";
import Card from "../../components/Card";
import RecentSearches from "../../components/RecentSearches";

export const dynamic = "force-dynamic";
export const metadata = { title: "Arama", robots: { index: false } };

export default async function Ara({ searchParams }) {
  const q = (searchParams.q || "").replace(/[%,()]/g, " ").trim();
  const kat = String(searchParams.kat || "");
  const sure = String(searchParams.sure || "");
  const { data: cats } = await sb
    .from("categories")
    .select("id,name_tr")
    .order("sort_order");

  let data = [];
  if (q) {
    let query = sb
      .from("articles")
      .select(SELECT)
      .or(`title_tr.ilike.%${q}%,summary_tr.ilike.%${q}%`)
      .order("published_at", { ascending: false })
      .limit(60);
    if (kat) query = query.eq("category_id", Number(kat));
    if (sure === "24") {
      query = query.gte("published_at", new Date(Date.now() - 86400000).toISOString());
    } else if (sure === "7") {
      query = query.gte("published_at", new Date(Date.now() - 7 * 86400000).toISOString());
    }
    const r = await query;
    data = r.data || [];
  }

  return (
    <>
      <form action="/ara" method="get" className="search">
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Haber, kişi veya yer ara"
          autoFocus={!q}
        />
        <button type="submit">Ara</button>
      </form>
      <form action="/ara" method="get" className="filters">
        <input type="hidden" name="q" value={q} />
        <select name="kat" defaultValue={kat}>
          <option value="">Tüm kategoriler</option>
          {(cats || []).map((c) => (
            <option key={c.id} value={c.id}>{c.name_tr}</option>
          ))}
        </select>
        <select name="sure" defaultValue={sure}>
          <option value="">Tüm zamanlar</option>
          <option value="24">Son 24 saat</option>
          <option value="7">Son 7 gün</option>
        </select>
        <button type="submit" className="set-btn">Filtrele</button>
      </form>

      <RecentSearches q={q} />

      {q && <h1 className="sec-title">“{q}” için {data.length} sonuç</h1>}
      {data.length ? (
        <div className="feed">{data.map((a) => <Card key={a.id} a={a} />)}</div>
      ) : (
        <p className="empty">
          {q ? "Sonuç bulunamadı. Başka bir kelime dene." : "Aramak için bir kelime yaz."}
        </p>
      )}
    </>
  );
}
