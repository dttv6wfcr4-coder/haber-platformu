import { adminDb, isAdmin } from "../../../lib/admin";
import { toggleSource } from "../actions";

export const dynamic = "force-dynamic";

export default async function Kaynaklar() {
  if (!isAdmin()) {
    return (
      <div className="adm-login">
        <p>Giriş gerekli.</p>
        <a href="/yonetim">Giriş yap</a>
      </div>
    );
  }
  const { data } = await adminDb()
    .from("sources")
    .select("id,name,language,is_active,default_category_slug")
    .order("name");

  return (
    <div className="adm">
      <div className="adm-top">
        <h1>Kaynaklar ({data?.length || 0})</h1>
        <a href="/yonetim">← Haberler</a>
      </div>
      {(data || []).map((s) => (
        <div key={s.id} className={`adm-item${s.is_active ? "" : " off"}`}>
          <strong>{s.name}</strong>
          <span className="meta">
            {s.language.toUpperCase()} · {s.default_category_slug}
            {s.is_active ? "" : " · KAPALI"}
          </span>
          <form action={toggleSource}>
            <input type="hidden" name="id" value={s.id} />
            <input type="hidden" name="active" value={s.is_active ? "0" : "1"} />
            <button type="submit">{s.is_active ? "Kapat" : "Aç"}</button>
          </form>
        </div>
      ))}
    </div>
  );
}
