import { sb, SELECT } from "../lib/db";
import Card from "../components/Card";

export const revalidate = 300;

export default async function Home() {
  const { data } = await sb
    .from("articles")
    .select(SELECT)
    .order("published_at", { ascending: false })
    .limit(40);
  return (
    <>
      <h1>Son Haberler</h1>
      {data?.length ? (
        <div className="grid">{data.map((a) => <Card key={a.id} a={a} />)}</div>
      ) : (
        <p className="empty">Henüz haber yok.</p>
      )}
    </>
  );
}
