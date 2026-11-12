import { sb, SELECT } from "../../lib/db";
import Card from "../../components/Card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Arama", robots: { index: false } };

export default async function Ara({ searchParams }) {
  const q = (searchParams.q || "").replace(/[%,()]/g, " ").trim();
  let data = [];
  if (q) {
    const r = await sb
      .from("articles")
      .select(SELECT)
      .or(`title_tr.ilike.%${q}%,summary_tr.ilike.%${q}%`)
      .order("published_at", { ascending: false })
      .limit(40);
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
