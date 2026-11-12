import { notFound } from "next/navigation";
import { sb, SELECT } from "../../../lib/db";
import Card from "../../../components/Card";

export const revalidate = 600;
const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

async function getArticle(id) {
  const { data } = await sb.from("articles").select(SELECT).eq("id", id).single();
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
      images: a.image_url ? [a.image_url] : [],
    },
    twitter: {
      card: a.image_url ? "summary_large_image" : "summary",
      title: a.title_tr,
      description: desc,
    },
  };
}

export default async function Haber({ params }) {
  const a = await getArticle(params.id);
  if (!a) notFound();

  const { data: related } = await sb
    .from("articles")
    .select(SELECT)
    .eq("category_id", a.categories ? (await sb.from("categories").select("id").eq("slug", a.categories.slug).single()).data?.id : 0)
    .neq("id", a.id)
    .order("published_at", { ascending: false })
    .limit(6);

  const ld = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: a.title_tr,
    description: a.summary_tr || undefined,
    image: a.image_url ? [a.image_url] : undefined,
    datePublished: a.published_at,
    mainEntityOfPage: `${BASE}/haber/${a.id}`,
    publisher: { "@type": "Organization", name: "Haber Platformu" },
  };

  return (
    <article className="detail">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(ld).replace(/</g, "\\u003c"),
        }}
      />
      <a className="tag" href={`/kategori/${a.categories?.slug}`}>
        {a.categories?.name_tr}
      </a>
      <h1>{a.title_tr}</h1>
      <p className="meta">
        {a.sources?.name} ·{" "}
        {new Date(a.published_at).toLocaleString("tr-TR", {
          timeZone: "Europe/Istanbul",
          dateStyle: "long",
          timeStyle: "short",
        })}
      </p>
      {a.image_url && <img className="hero" src={a.image_url} alt="" />}
      {a.summary_tr && <p className="lead">{a.summary_tr}</p>}
      <a className="btn" href={a.original_url} target="_blank" rel="noopener noreferrer nofollow">
        Haberin tamamı için kaynağa git →
      </a>
      <p className="meta">Bu içerik yapay zekâ ile Türkçeye çevrilip özetlenmiştir.</p>

      {related?.length > 0 && (
        <>
          <h2>İlgili Haberler</h2>
          <div className="grid">
            {related.map((r) => <Card key={r.id} a={r} />)}
          </div>
        </>
      )}
    </article>
  );
}
