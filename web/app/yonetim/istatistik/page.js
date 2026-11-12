import { adminDb, isAdmin } from "../../../lib/admin";
import Nav from "../Nav";

export const dynamic = "force-dynamic";

export default async function Istatistik() {
  if (!isAdmin()) {
    return (
      <div className="adm-login">
        <p>Giriş gerekli.</p>
        <a href="/yonetim">Giriş yap</a>
      </div>
    );
  }
  const db = adminDb();
  const count = async (f) => {
    const { count: n } = await f(
      db.from("articles").select("id", { count: "exact", head: true })
    );
    return n || 0;
  };
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const [total, hidden, pinned, last24] = await Promise.all([
    count((q) => q),
    count((q) => q.eq("is_hidden", true)),
    count((q) => q.eq("is_pinned", true)),
    count((q) => q.gte("published_at", since)),
  ]);
  const { data: cats } = await db.from("categories").select("id,name_tr").order("sort_order");
  const perCat = await Promise.all(
    (cats || []).map(async (c) => ({
      name: c.name_tr,
      n: await count((q) => q.eq("category_id", c.id).eq("is_hidden", false)),
    }))
  );
  const maxCat = Math.max(1, ...perCat.map((c) => c.n));
  const { data: recent } = await db
    .from("articles")
    .select("sources(name)")
    .order("published_at", { ascending: false })
    .limit(1000);
  const bySrc = {};
  (recent || []).forEach((r) => {
    const n = r.sources?.name || "?";
    bySrc[n] = (bySrc[n] || 0) + 1;
  });
  const top = Object.entries(bySrc).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const { data: last } = await db
    .from("articles")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1);
  const { count: srcOn } = await db
    .from("sources")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  return (
    <div className="adm">
      <Nav />
      <h1>İstatistik</h1>
      <div className="adm-stat">
        <div><b>{total}</b>Toplam haber</div>
        <div><b>{last24}</b>Son 24 saat</div>
        <div><b>{hidden}</b>Gizli</div>
        <div><b>{pinned}</b>Sabit</div>
        <div><b>{srcOn || 0}</b>Aktif kaynak</div>
        <div>
          <b style={{ fontSize: 15 }}>
            {last?.[0]
              ? new Date(last[0].created_at).toLocaleString("tr-TR", {
                  timeZone: "Europe/Istanbul",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-"}
          </b>
          Worker son kayıt
        </div>
      </div>

      <h2>Kategoriler (görünen)</h2>
      {perCat.map((c) => (
        <div key={c.name} className="adm-item">
          <span>{c.name}: <strong>{c.n}</strong></span>
          <div className="adm-bar" style={{ width: `${(c.n / maxCat) * 100}%` }} />
        </div>
      ))}

      <h2>Kaynaklar (son 1000 haber)</h2>
      {top.map(([name, n]) => (
        <div key={name} className="adm-item">
          <span>{name}: <strong>{n}</strong></span>
        </div>
      ))}
    </div>
  );
}
