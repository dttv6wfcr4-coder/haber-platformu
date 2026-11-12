import { notFound } from "next/navigation";
import { sb, SELECT, groupByTime, catColor } from "../../../lib/db";
import Card from "../../../components/Card";
import { LoadMore } from "../../../components/Client";

export const revalidate = 60;

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
    .select("id,slug,name_tr")
    .eq("slug", params.slug)
    .single();
  if (!c) notFound();
  const { data } = await sb
    .from("articles")
    .select(SELECT)
    .eq("category_id", c.id)
    .order("published_at", { ascending: false })
    .limit(30);
  const list = data || [];
  const groups = groupByTime(list);

  return (
    <>
      <h1 className="page-title cat-head" style={{ "--c": catColor(c.slug) }}>
        {c.name_tr}
      </h1>
      {groups.map(([label, items]) => (
        <section key={label}>
          <h2 className="sec-title">{label}</h2>
          <div className="feed">{items.map((a) => <Card key={a.id} a={a} />)}</div>
        </section>
      ))}
      {list.length === 30 && (
        <LoadMore before={list[29].published_at} categoryId={c.id} />
      )}
      {!list.length && <p className="empty">Bu kategoride henüz haber yok.</p>}
    </>
  );
}
