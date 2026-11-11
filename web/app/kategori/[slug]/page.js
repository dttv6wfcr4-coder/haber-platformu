import { sb, SELECT } from "../../../lib/db";
import Card from "../../../components/Card";

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const { data: c } = await sb
    .from("categories")
    .select("name_tr")
    .eq("slug", params.slug)
    .single();
  const name = c?.name_tr || "Kategori";
  return {
    title: name,
    description: `${name} kategorisindeki son haberler.`,
    openGraph: { title: name },
  };
}

export default async function Kategori({ params }) {
  const { data: c } = await sb
    .from("categories")
    .select("id,name_tr")
    .eq("slug", params.slug)
    .single();
  if (!c) return <p className="empty">Kategori bulunamadı.</p>;
  const { data } = await sb
    .from("articles")
    .select(SELECT)
    .eq("category_id", c.id)
    .order("published_at", { ascending: false })
    .limit(40);
  return (
    <>
      <h1>{c.name_tr}</h1>
      {data?.length ? (
        <div className="grid">{data.map((a) => <Card key={a.id} a={a} />)}</div>
      ) : (
        <p className="empty">Bu kategoride henüz haber yok.</p>
      )}
    </>
  );
}
