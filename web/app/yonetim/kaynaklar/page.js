import { adminDb, isAdmin } from "../../../lib/admin";
import { toggleSource, addSource, setSourceCategory } from "../actions";
import Nav from "../Nav";

export const dynamic = "force-dynamic";

export default async function Kaynaklar({ searchParams }) {
  if (!isAdmin()) {
    return (
      <div className="adm-login">
        <p>Giriş gerekli.</p>
        <a href="/yonetim">Giriş yap</a>
      </div>
    );
  }
  const db = adminDb();
  const { data: cats } = await db.from("categories").select("slug,name_tr").order("sort_order");
  const { data } = await db
    .from("sources")
    .select("id,name,language,is_active,default_category_slug")
    .order("name");
  const opts = (cats || []).map((c) => (
    <option key={c.slug} value={c.slug}>{c.name_tr}</option>
  ));

  return (
    <div className="adm">
      <Nav />
      <h1>Kaynaklar ({data?.length || 0})</h1>
      {searchParams.msg && <p className="adm-msg">{searchParams.msg}</p>}

      <details className="adm-item">
        <summary>+ Yeni kaynak ekle</summary>
        <form action={addSource} className="adm-form">
          <input name="name" placeholder="Kaynak adı" required />
          <input name="url" type="url" placeholder="RSS adresi (https://...)" required />
          <select name="language">
            <option value="tr">Türkçe (çeviri yok)</option>
            <option value="en">Yabancı (çevrilecek)</option>
          </select>
          <select name="slug">{opts}</select>
          <button type="submit">Ekle</button>
        </form>
      </details>

      {(data || []).map((s) => (
        <div key={s.id} className={`adm-item${s.is_active ? "" : " off"}`}>
          <strong>{s.name}</strong>
          <span className="meta">
            {s.language.toUpperCase()}{s.is_active ? "" : " · KAPALI"}
          </span>
          <form action={setSourceCategory} className="adm-row">
            <input type="hidden" name="id" value={s.id} />
            <select name="slug" defaultValue={s.default_category_slug}>{opts}</select>
            <button type="submit">Kategori kaydet</button>
          </form>
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
