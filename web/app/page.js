import { sb, SELECT, groupByTime } from "../lib/db";
import Card, { TopCard } from "../components/Card";
import { LoadMore } from "../components/Client";

export const revalidate = 60;

export default async function Home() {
  const { data } = await sb
    .from("articles")
    .select(SELECT)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(41);
  const all = data || [];
  const top = all.slice(0, 5);
  const rest = all.slice(5);
  const groups = groupByTime(rest);
  const before = all.length === 41 ? rest[rest.length - 1].published_at : null;

  return (
    <>
      {top.length > 0 && (
        <section aria-label="Manşet">
          <h1 className="sec-title">Manşet</h1>
          <div className="top-rail">
            {top.map((a) => <TopCard key={a.id} a={a} />)}
          </div>
        </section>
      )}
      {groups.map(([label, list]) => (
        <section key={label}>
          <h2 className="sec-title">{label}</h2>
          <div className="feed">{list.map((a) => <Card key={a.id} a={a} />)}</div>
        </section>
      ))}
      {before && <LoadMore before={before} />}
      {!all.length && (
        <p className="empty">Henüz haber yok. Kaynaklar yenilendikçe haberler burada görünecek.</p>
      )}
    </>
  );
}
