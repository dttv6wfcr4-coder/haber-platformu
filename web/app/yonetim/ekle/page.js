import { adminDb, isAdmin } from "../../../lib/admin";
import { addArticle } from "../actions";
import Nav from "../Nav";

export const dynamic = "force-dynamic";

export default async function Ekle({ searchParams }) {
  if (!isAdmin()) {
    return (
      <div className="adm-login">
        <p>Giriş gerekli.</p>
        <a href="/yonetim">Giriş yap</a>
      </div>
    );
  }
  const { data: cats } = await adminDb()
    .from("categories")
    .select("id,name_tr")
    .order("sort_order");
  return (
    <div className="adm">
      <Nav />
      <h1>Haber ekle</h1>
      {searchParams.msg && <p className="adm-msg">{searchParams.msg}</p>}
      <form action={addArticle} className="adm-form">
        <label>Başlık</label>
        <input name="title" required />
        <label>Özet</label>
        <textarea name="summary" rows={4} />
        <label>Kaynak bağlantısı</label>
        <input name="url" type="url" placeholder="https://" required />
        <label>Kategori</label>
        <select name="category_id">
          {(cats || []).map((c) => (
            <option key={c.id} value={c.id}>{c.name_tr}</option>
          ))}
        </select>
        <label className="adm-all">
          <input type="checkbox" name="pin" value="1" /> Manşete sabitle
        </label>
        <button type="submit">Yayınla</button>
      </form>
    </div>
  );
}
