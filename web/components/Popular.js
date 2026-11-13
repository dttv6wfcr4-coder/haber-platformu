import Link from "next/link";
import { sb, SELECT } from "../lib/db";

export default async function Popular() {
  const { data: rows } = await sb.rpc("popular_articles", { p_hours: 24 });
  const ids = (rows || []).map((r) => r.id);
  if (ids.length < 3) return null;
  const { data } = await sb.from("articles").select(SELECT).in("id", ids);
  const byId = Object.fromEntries((data || []).map((a) => [a.id, a]));
  const list = ids.map((id) => byId[id]).filter(Boolean).slice(0, 5);
  if (list.length < 3) return null;
  return (
    <section>
      <h2 className="day">Çok okunanlar</h2>
      <ol className="pop">
        {list.map((a, i) => (
          <li key={a.id}>
            <span>{i + 1}</span>
            <Link href={`/haber/${a.id}`}>{a.title_tr}</Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
