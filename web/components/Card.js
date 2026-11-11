export default function Card({ a }) {
  const date = new Date(a.published_at).toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <a className="card" href={a.original_url} target="_blank" rel="noopener noreferrer">
      {a.image_url && <img src={a.image_url} alt="" loading="lazy" />}
      <div className="body">
        <span className="tag">{a.categories?.name_tr}</span>
        <h2>{a.title_tr}</h2>
        {a.summary_tr && <p>{a.summary_tr}</p>}
        <span className="meta">
          {a.sources?.name} · {date}
        </span>
      </div>
    </a>
  );
}
