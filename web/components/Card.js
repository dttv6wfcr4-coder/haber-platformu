import Link from "next/link";
import { ago, catColor } from "../lib/db";
import { SaveButton } from "./Actions";

export default function Card({ a }) {
  return (
    <article className="row" style={{ "--c": catColor(a.categories?.slug) }}>
      <div className="row-top">
        {a.sources && (
          <Link className="src" href={`/kaynak/${a.sources.id}`}>
            {a.sources.name}
          </Link>
        )}
        <time dateTime={a.published_at}>{ago(a.published_at)}</time>
        <SaveButton id={a.id} />
      </div>
      <h2 className="row-title">
        <Link href={`/haber/${a.id}`}>{a.title_tr}</Link>
      </h2>
      {a.summary_tr && <p className="row-sum">{a.summary_tr}</p>}
      {a.categories && (
        <Link className="row-cat" href={`/kategori/${a.categories.slug}`}>
          <i />
          {a.categories.name_tr}
        </Link>
      )}
    </article>
  );
}

export function TopCard({ a }) {
  return (
    <article className="top-card" style={{ "--c": catColor(a.categories?.slug) }}>
      {a.categories && (
        <Link className="row-cat" href={`/kategori/${a.categories.slug}`}>
          <i />
          {a.categories.name_tr}
        </Link>
      )}
      <h2>
        <Link href={`/haber/${a.id}`}>{a.title_tr}</Link>
      </h2>
      {a.summary_tr && <p>{a.summary_tr}</p>}
      <div className="row-top">
        <span className="src">{a.sources?.name}</span>
        <time dateTime={a.published_at}>{ago(a.published_at)}</time>
        <SaveButton id={a.id} />
      </div>
    </article>
  );
}
