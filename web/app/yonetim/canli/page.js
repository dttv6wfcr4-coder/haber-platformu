import { adminDb, isAdmin } from "../../../lib/admin";
import { ago } from "../../../lib/db";
import Nav from "../Nav";
import LiveRefresh from "../LiveRefresh";

export const dynamic = "force-dynamic";

const flag = (c) =>
  c && /^[A-Za-z]{2}$/.test(c)
    ? String.fromCodePoint(...[...c.toUpperCase()].map((x) => 127397 + x.charCodeAt(0)))
    : "🌐";

const dayLabel = (d) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });

function List({ title, rows, label }) {
  return (
    <>
      <h2>{title}</h2>
      <div className="adm-card">
        {rows?.length ? (
          rows.map((r, i) => (
            <div className="kv" key={i}>
              <span>{label(r)}</span>
              <strong>{r.n}</strong>
            </div>
          ))
        ) : (
          <p className="meta">Henüz veri yok.</p>
        )}
      </div>
    </>
  );
}

export default async function Canli() {
  if (!isAdmin()) {
    return (
      <div className="adm-login">
        <p>Giriş gerekli.</p>
        <a href="/yonetim">Giriş yap</a>
      </div>
    );
  }
  const db = adminDb();
  const [stats, runs] = await Promise.all([
    db.rpc("visit_stats"),
    db
      .from("worker_runs")
      .select("created_at,saved,failed,total,seconds")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  const s = stats.data;
  const r = runs.data || [];
  const last = r[0];
  const stale = last && Date.now() - new Date(last.created_at).getTime() > 20 * 60000;
  const max = Math.max(1, ...(s?.series || []).map((d) => d.views));

  return (
    <div className="adm">
      <Nav />
      <LiveRefresh />
      <h1>Canlı</h1>

      {!s && (
        <p className="adm-msg">Ziyaret verisi okunamadı. SQL adımının çalıştığından emin ol.</p>
      )}

      {s && (
        <>
          <div className="live-card">
            <span className="meta">
              <span className="live" /> Şu an sitede (son 5 dakika)
            </span>
            <b>{s.live}</b>
            {s.live_pages?.map((p, i) => (
              <div className="kv" key={i}>
                <span>{p.page}</span>
                <strong>{p.n}</strong>
              </div>
            ))}
          </div>

          <div className="adm-stat">
            <div><b>{s.today.views}</b>Bugün görüntülenme</div>
            <div><b>{s.today.uniq}</b>Bugün ziyaretçi</div>
            <div><b>{s.yesterday.views}</b>Dün görüntülenme</div>
            <div><b>{s.yesterday.uniq}</b>Dün ziyaretçi</div>
          </div>

          <h2>Son 14 gün</h2>
          <div className="adm-card">
            {s.series.map((d) => (
              <div className="bar-row" key={d.day}>
                <span>{dayLabel(d.day)}</span>
                <div className="adm-bar" style={{ width: `${(d.views / max) * 100}%` }} />
                <span>{d.views} / {d.uniq}</span>
              </div>
            ))}
            <p className="meta">Görüntülenme / ziyaretçi (ziyaretçi her gün yeniden sayılır)</p>
          </div>

          <List title="En çok okunan (7 gün)" rows={s.pages} label={(x) => x.page} />
          <List title="Ülkeler (7 gün)" rows={s.countries} label={(x) => `${flag(x.c)} ${x.c}`} />
          <List title="Cihazlar (7 gün)" rows={s.devices} label={(x) => x.d} />
          <List title="Nereden geldiler (7 gün)" rows={s.referrers} label={(x) => x.ref} />
        </>
      )}

      <h2>Worker</h2>
      {stale && (
        <p className="adm-msg">
          Worker en son {ago(last.created_at)} çalıştı. 20 dakikadan uzun süredir kayıt yok, tetikleyiciyi kontrol et.
        </p>
      )}
      <div className="adm-card">
        {r.length ? (
          r.map((x, i) => (
            <div className="kv" key={i}>
              <span>{ago(x.created_at)}</span>
              <span>{x.saved} haber, {x.failed}/{x.total} hata, {x.seconds} sn</span>
            </div>
          ))
        ) : (
          <p className="meta">Henüz çalışma kaydı yok. Worker düzenlemesinden sonra burada görünür.</p>
        )}
      </div>
    </div>
  );
}
