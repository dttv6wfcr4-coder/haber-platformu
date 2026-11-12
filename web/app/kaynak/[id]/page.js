import { notFound } from "next/navigation";
import { sb, SELECT } from "../../../lib/db";
import Card from "../../../components/Card";
import { LoadMore } from "../../../components/Client";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { data: s } = await sb
    .from("sources")
    .select("name")
    .eq("id", Number(params.id))
    .single();
  return { title: s?.name || "Kaynak" };
}

export default async function Kaynak({ params }) {
  const id = Number(params.id);
  const { data: s } = await sb.from("sources").select("id,name").eq("id", id).single();
  if (!s) notFound();
  const { data } = await sb
    .from("articles")
    .select(SELECT)
    .eq("source_id", id)
    .order("published_at", { ascending: false })
    .limit(30);
  const list = data || [];
  return (
    <>
      <h1 className="page-title">{s.name}</h1>
      {list.length ? (
        <div className="feed">{list.map((a) => <Card key={a.id} a={a} />)}</div>
      ) : (
        <p className="empty">Bu kaynaktan henüz haber yok.</p>
      )}
      {list.length === 30 && <LoadMore before={list[29].published_at} sourceId={id} />}
    </>
  );
}
