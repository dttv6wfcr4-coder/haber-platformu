import { adminDb, isAdmin } from "../../../lib/admin";
import { updateCategory } from "../actions";
import Nav from "../Nav";

export const dynamic = "force-dynamic";

export default async function Kategoriler({ searchParams }) {
  if (!isAdmin()) {
    return (
      <div className="adm-login">
        <p>Giriş gerekli.</p>
        <a href="/yonetim">Giriş yap</a>
      </div>
    );
  }
  const { data } = await adminDb()
    .from("categories")
    .select("id,slug,name_tr,sort_order")
    .order("sort_order");
  return (
    <div className="adm">
      <Nav />
      <h1>Kategoriler</h1>
      {searchParams.msg && <p className="adm-msg">{searchParams.msg}</p>}
      <p className="adm-note">Sıra küçükten büyüğe dizilir. Adres kısmı (slug) değişmez.</p>
      {(data || []).map((c) => (
        <form key={c.id} action={updateCategory} className="adm-item">
          <input type="hidden" name="id" value={c.id} />
          <span className="meta">/{c.slug}</span>
          <input name="name" defaultValue={c.name_tr} required />
          <input name="order" type="number" defaultValue={c.sort_order} required />
          <button type="submit">Kaydet</button>
        </form>
      ))}
    </div>
  );
}
