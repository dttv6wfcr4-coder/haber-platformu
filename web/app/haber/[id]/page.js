import Link from "next/link";
import { notFound } from "next/navigation";
import { sb, SELECT, catColor } from "../../../lib/db";
import { keywords } from "../../../lib/trend";
import Card from "../../../components/Card";
import Visual, { hasPhoto } from "../../../components/Visual";
import { SaveButton, ShareButton } from "../../../components/Actions";
import { ListenButton, ReportForm } from "../../../components/DetailTools";

export const revalidate = 300;
const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

async function getArticle(id) {
  const { data } = await sb
    .from("articles")
    .select(`${SELECT},category_id`)
    .eq("id", id)
    .single();
  return data;
}

export async function generateMetadata({ params }) {
  const a = await getArticle(params.id);
  if (!a) return { title: "Haber bulunamadı" };
  const desc = a.summary_tr || a.title_tr;
  return {
    title: a.title_tr,
    description: desc,
    alternates: { canonical: `${BASE}/haber/${a.id}` },
    openGraph: {
      type: "article",
      title: a.title_tr,
      description: desc,
      url: `${BASE}/haber/${a.id}`,
      publishedTime: a.published_at,
    },
    twitter: { card: "summary", title: a.title_tr, description: desc },
  };
}

export default async function Haber({ params }) {
  const a = await getArticle(params.id);
  if (!a) notFound();

  const kw = keywords(a.title_tr);
  const [{ data: related }, same] = await Promise.all([
    sb
      .from("articles")
      .select(SELECT)
      .eq("category_id", a.category_id)
      .neq("id", a.id)
      .order("published_at", { ascending: false })
      .limit(6),
    kw.length
      ? sb
          .from("articles")
          .select(SELECT)
          .neq("id", a.id)
          .or(kw.map((w) => `title_tr.ilike.%${w}%`).join(","))
          .order("published_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
  ]);
  const sameList = same.data || [];
  const relatedList = (related || []).filter((r) => !sameList.some((s) => s.id === r.id));

  const when = new Date(a.published_at).toLocaleString("tr-TR", {
    timeZone: "Europe/Istanbul",
    dateStyle: "long",
    timeStyle: "short",
  });
  const wa = `https://wa.me/?text=${encodeURIComponent(`${a.title_tr} ${BASE}/haber/${a.id}`)}`;

  const ld = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: a.title_tr,
    description: a.summary_tr || undefined,
    datePublished: a.published_at,
    mainEntityOfPage: `${BASE}/haber/${a.id}`,
    publisher: { "@type": "Organization", name: "Haber Platformu" },
  };

  return (
    <article className="detail" style={{ "--c": catColor(a.categories?.slug) }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(ld).replace(/</g, "\\u003c"),
        }}
      />
      {a.categories && (
        <Link className="row-cat" href={`/kategori/${a.categories.slug}`}>
          <i />
          {a.categories.name_tr}
        </Link>
      )}
      <h1>{a.title_tr}</h1>
      <p className="byline">
        {a.sources && (
          <Link className="src" href={`/kaynak/${a.sources.id}`}>
            {a.sources.name}
          </Link>
        )}
        <time dateTime={a.published_at}>{when}</time>
      </p>
      <Visual a={a} className="hero-img" />
      {hasPhoto(a) && <p className="credit">Görsel: {a.sources.name}</p>}
      {a.summary_tr && <p className="lead">{a.summary_tr}</p>}

      <div className="actions">
        <a
          className="btn"
          href={a.original_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          Haberin tamamını kaynakta oku
        </a>
        <ShareButton title={a.title_tr} path={`/haber/${a.id}`} />
        <a className="pill" href={wa} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
        <ListenButton text={`${a.title_tr}. ${a.summary_tr || ""}`} />
        <SaveButton id={a.id} />
      </div>
      <p className="notice">
        Bu özet yapay zekâ ile çevrilip kısaltılmıştır ve hata içerebilir. Doğru ve eksiksiz bilgi için kaynağa bakın.
      </p>

      <ReportForm articleId={a.id} />

      {sameList.length > 0 && (
        <>
          <h2>Aynı konuda</h2>
          <div className="feed">
            {sameList.map((r) => <Card key={r.id} a={r} />)}
          </div>
        </>
      )}

      {relatedList.length > 0 && (
        <>
          <h2>Aynı kategoriden</h2>
          <div className="feed">
            {relatedList.map((r) => <Card key={r.id} a={r} />)}
          </div>
        </>
      )}
    </article>
  );
}
