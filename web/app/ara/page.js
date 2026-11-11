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
      <h1>{q ? `“${q}” sonuçları` : "Arama"}</h1>
      {data.length ? (
        <div className="grid">{data.map((a) => <Card key={a.id} a={a} />)}</div>
      ) : (
        <p className="empty">{q ? "Sonuç bulunamadı." : "Aramak için bir kelime yaz."}</p>
      )}
    </>
  );
}
