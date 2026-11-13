import Link from "next/link";
import { sb, SELECT, groupByTime } from "../lib/db";
import { trending } from "../lib/trend";
import Card, { TopCard } from "../components/Card";
import { LoadMore } from "../components/Client";
import Fresh from "../components/Fresh";
import Markets from "../components/Markets";
import Popular from "../components/Popular";

export const dynamic = "force-dynamic";

export default async function Home() {
  const since = new Date(Date.now() - 36 * 3600 * 1000).toISOString();
  const [{ data }, { data: lastRow }, { data: titles }] = await Promise.all([
    sb
      .from("articles")
      .select(SELECT)
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(41),
    sb
      .from("articles")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1),
    sb.from("articles").select("title_tr").gte("published_at", since).limit(500),
  ]);
  const all = data || [];
  const top = all.slice(0, 5);
  const rest = all.slice(5);
  const groups = groupByTime(rest);
  const before = all.length === 41 ? rest[rest.length - 1].published_at : null;
  const newest = [...all].sort(
    (x, y) => new Date(y.published_at) - new Date(x.published_at)
  )[0];
  const hot = newest && Date.now() - new Date(newest.published_at).getTime() < 3 * 3600 * 1000;
  const words = trending((titles || []).map((t) => t.title_tr));

  return (
    <>
      <h1 className="sr">Türkiye ve dünyadan son haberler</h1>
      <Fresh latest={lastRow?.[0]?.created_at} />

      {newest && (
        <Link href={`/haber/${newest.id}`} className="flash">
          <span className="flash-tag">
            <i />
            {hot ? "Son dakika" : "Son haber"}
          </span>
          <span className="flash-text">{newest.title_tr}</span>
        </Link>
      )}

      <Markets />

      {words.length > 0 && (
        <div className="trend" aria-label="Gündemde">
          <span>Gündemde</span>
          {words.map((w) => (
            <Link key={w} href={`/ara?q=${encodeURIComponent(w)}`}>
              {w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1)}
            </Link>
          ))}
        </div>
      )}

      {top.length > 0 && (
        <section aria-label="Manşet">
          <div className="lead-rail">
            {top.map((a) => <TopCard key={a.id} a={a} />)}
          </div>
        </section>
      )}

      <Popular />

      {groups.map(([label, list]) => (
        <section key={label}>
          <h2 className="day">
            {label}
            <b>{list.length}</b>
          </h2>
          <div className="feed">
            {list.map((a) => <Card key={a.id} a={a} />)}
          </div>
        </section>
      ))}

      {before && <LoadMore before={before} />}
      {!all.length && (
        <p className="empty">Henüz haber yok. Kaynaklar yenilendikçe haberler burada görünecek.</p>
      )}
    </>
  );
}
