import { adminDb, isAdmin } from "../../../lib/admin";
import Nav from "../Nav";

export const dynamic = "force-dynamic";

export default async function Gunluk() {
  if (!isAdmin()) {
    return (
      <div className="adm-login">
        <p>Giriş gerekli.</p>
        <a href="/yonetim">Giriş yap</a>
      </div>
    );
  }
  const { data } = await adminDb()
    .from("admin_log")
    .select("created_at,action")
    .order("created_at", { ascending: false })
    .limit(100);
  return (
    <div className="adm">
      <Nav />
      <h1>Etkinlik günlüğü</h1>
      <div className="adm-card">
        {(data || []).map((l, i) => (
          <div className="kv" key={i}>
            <span>{l.action}</span>
            <span className="meta">
              {new Date(l.created_at).toLocaleString("tr-TR", {
                timeZone: "Europe/Istanbul",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}
        {!data?.length && <p className="meta">Henüz kayıt yok.</p>}
      </div>
      <p className="adm-note">Kayıtlar 90 gün sonra otomatik silinir.</p>
    </div>
  );
}
