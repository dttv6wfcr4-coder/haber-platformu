import Link from "next/link";
import { ago, catColor } from "../lib/db";
import { SaveButton } from "./Actions";
import Visual, { hasPhoto } from "./Visual";

const clock = (iso) =>
  new Date(iso).toLocaleTimeString("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function Card({ a }) {
  return (
        <article className="wire" data-id={a.id} style={{ "--c": catColor(a.categories?.slug) }}>

      <time className="wire-time" dateTime={a.published_at}>
        {clock(a.published_at)}
      </time>
      <span className="wire-rail" aria-hidden="true" />
      <div className="wire-body">
        <div className="wire-meta">
          {a.sources && (
            <Link className="src" href={`/kaynak/${a.sources.id}`}>
              {a.sources.name}
            </Link>
          )}
          {a.categories && (
            <Link className="wire-cat" href={`/kategori/${a.categories.slug}`}>
              {a.categories.name_tr}
            </Link>
          )}
        </div>
        <h2 className="wire-title">
          <Link href={`/haber/${a.id}`}>{a.title_tr}</Link>
        </h2>
        {a.summary_tr && <p className="wire-sum">{a.summary_tr}</p>}
        {hasPhoto(a) && (
          <div className="wire-photo">
            <Visual a={a} />
          </div>
        )}
      </div>
      <SaveButton id={a.id} />
    </article>
  );
}

export function TopCard({ a }) {
  return (
    <article className="lead-card" style={{ "--c": catColor(a.categories?.slug) }}>
      <div className="lead-meta">
        <span className="lead-cat">
          <i />
          {a.categories?.name_tr}
        </span>
        <time dateTime={a.published_at}>{ago(a.published_at)}</time>
      </div>
      <h2>
        <Link href={`/haber/${a.id}`}>{a.title_tr}</Link>
      </h2>
      {a.summary_tr && <p>{a.summary_tr}</p>}
      <div className="lead-foot">
        <span className="src">{a.sources?.name}</span>
        <SaveButton id={a.id} />
      </div>
    </article>
  );
}
