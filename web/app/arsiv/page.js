import Link from "next/link";
import { sb, SELECT } from "../../lib/db";
import Card from "../../components/Card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Arşiv" };

const istDate = (d) =>
  new Date(d).toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
const shift = (day, n) => {
  const d = new Date(`${day}T12:00:00+03:00`);
  d.setDate(d.getDate() + n);
  return istDate(d);
};

export default async function Arsiv({ searchParams }) {
  const today = istDate(Date.now());
  const raw = String(searchParams.gun || "");
  const ok =
    /^\d{4}-\d{2}-\d{2}$/.test(raw) &&
    raw <= today &&
    !isNaN(new Date(`${raw}T00:00:00+03:00`));
  const day = ok ? raw : today;
  const start = new Date(`${day}T00:00:00+03:00`);
  const { data } = await sb
    .from("articles")
    .select(SELECT)
    .gte("published_at", start.toISOString())
    .lt("published_at", new Date(start.getTime() + 86400000).toISOString())
    .order("published_at", { ascending: false })
    .limit(200);
  const list = data || [];
  const label = new Date(`${day}T12:00:00+03:00`).toLocaleDateString("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  });

  return (
    <>
      <h1 className="page-title">Arşiv</h1>
      <form action="/arsiv" method="get" className="day-form">
        <input type="date" name="gun" defaultValue={day} max={today} />
        <button type="submit">Git</button>
      </form>
      <div className="day-nav">
        <Link href={`/arsiv?gun=${shift(day, -1)}`}>Önceki gün</Link>
        <strong>{label}</strong>
        {day < today ? (
          <Link href={`/arsiv?gun=${shift(day, 1)}`}>Sonraki gün</Link>
        ) : (
          <span />
        )}
      </div>
      {list.length ? (
        <div className="feed">{list.map((a) => <Card key={a.id} a={a} />)}</div>
      ) : (
        <p className="empty">Bu tarihte kayıtlı haber yok.</p>
      )}
    </>
  );
}
