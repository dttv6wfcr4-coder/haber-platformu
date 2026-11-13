import Link from "next/link";
import { sb, SELECT, catColor, ago } from "../../lib/db";

export const revalidate = 120;
export const metadata = { title: "Tüm kategoriler" };

export default async function Kategoriler() {
  const [{ data: cats }, { data: recent }] = await Promise.all([
    sb.from("categories").select("id,slug,name_tr").order("sort_order"),
    sb
      .from("articles")
      .select(SELECT)
      .order("published_at", { ascending: false })
      .limit(240),
  ]);
  const by = {};
  (recent || []).forEach((a) => {
    const s = a.categories?.slug;
    if (!s) return;
    if (!by[s]) by[s] = [];
    if (by[s].length < 3) by[s].push(a);
  });

  return (
    <>
      <h1 className="page-title">Kategoriler</h1>
      {(cats || []).map((c) => (
        <section key={c.id} className="cat-block" style={{ "--c": catColor(c.slug) }}>
          <h2>
            <Link href={`/kategori/${c.slug}`}>{c.name_tr}</Link>
          </h2>
          {(by[c.slug] || []).map((a) => (
            <Link key={a.id} href={`/haber/${a.id}`} className="cat-line">
              <span>{a.title_tr}</span>
              <time dateTime={a.published_at}>{ago(a.published_at)}</time>
            </Link>
          ))}
          {!by[c.slug] && <p className="meta">Yakın zamanda haber yok.</p>}
        </section>
      ))}
    </>
  );
}
