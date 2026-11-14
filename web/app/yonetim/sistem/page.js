import { adminDb, isAdmin } from "../../../lib/admin";
import { ago } from "../../../lib/db";
import Nav from "../Nav";

export const dynamic = "force-dynamic";

const LIMIT = 500 * 1048576;
const mb = (b) => (b / 1048576).toFixed(1);

export default async function Sistem() {
  if (!isAdmin()) {
    return (
      <div className="adm-login">
        <p>Giriş gerekli.</p>
        <a href="/yonetim">Giriş yap</a>
      </div>
    );
  }
  const db = adminDb();
  const [{ data: s }, { data: runs }] = await Promise.all([
    db.rpc("db_stats"),
    db
      .from("worker_runs")
      .select("created_at,saved,failed,total,seconds,errors")
      .order("created_at", { ascending: false })
      .limit(15),
  ]);
  const pct = s ? Math.min(100, (s.size / LIMIT) * 100) : 0;
  const bad = {};
  (runs || []).forEach((r) =>
    (r.errors || "")
      .split(", ")
      .filter(Boolean)
      .forEach((n) => (bad[n] = (bad[n] || 0) + 1))
  );
  const badList = Object.entries(bad).sort((a, b) => b[1] - a[1]);

  return (
    <div className="adm">
      <Nav />
      <h1>Sistem</h1>

      {!s && <p className="adm-msg">Veri okunamadı. SQL adımının çalıştığından emin ol.</p>}
      {s && (
        <>
          <h2>Veritabanı kotası</h2>
          <div className="adm-card">
            <strong>{mb(s.size)} MB</strong> <span className="meta">/ yaklaşık 500 MB (ücretsiz plan)</span>
            <div className={`quota${pct > 80 ? " warn" : ""}`}>
              <i style={{ width: `${pct}%` }} />
            </div>
            {pct > 80 && (
              <p className="adm-note">Kota dolmak üzere. Araçlar sayfasından eski haberleri temizle.</p>
            )}
          </div>
          <div className="adm-stat">
            <div><b>{s.articles}</b>Haber</div>
            <div><b>{s.visits}</b>Ziyaret kaydı</div>
            <div><b>{s.reports}</b>Bildirim</div>
            <div><b>{s.runs}</b>Worker kaydı</div>
          </div>
        </>
      )}

      <h2>Hata veren kaynaklar (son 15 çalışma)</h2>
      <div className="adm-card">
        {badList.length ? (
          badList.map(([name, n]) => (
            <div className="kv" key={name}>
              <span>{name}</span>
              <strong>{n} kez</strong>
            </div>
          ))
        ) : (
          <p className="meta">Hata veren kaynak yok ya da henüz kayıt yok.</p>
        )}
      </div>
      {badList.length > 0 && (
        <p className="adm-note">Sürekli hata verenleri Kaynaklar sayfasından kapat.</p>
      )}

      <h2>Son çalışmalar</h2>
      <div className="adm-card">
        {(runs || []).map((r, i) => (
          <div className="kv" key={i}>
            <span>{ago(r.created_at)}</span>
            <span>{r.saved} haber, {r.failed}/{r.total} hata, {r.seconds} sn</span>
          </div>
        ))}
        {!runs?.length && <p className="meta">Henüz kayıt yok.</p>}
      </div>
    </div>
  );
}
