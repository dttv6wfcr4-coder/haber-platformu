import { adminDb, isAdmin } from "../../../lib/admin";
import { ago } from "../../../lib/db";
import { toggleSource, addSource, setSourceCategory, toggleImages } from "../actions";
import Nav from "../Nav";
import { hideSource } from "../actions";


export const dynamic = "force-dynamic";

function health(s, last) {
  if (!s.is_active) return ["Kapalı", "gray"];
  if (!last) return ["Sessiz", "red"];
  const h = (Date.now() - new Date(last).getTime()) / 3600000;
  if (h < 24) return ["Çalışıyor", "green"];
  if (h < 24 * 7) return ["Yavaş", "amber"];
  return ["Sessiz", "red"];
}

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
  const { data: cats } = await db
    .from("categories")
    .select("slug,name_tr")
    .order("sort_order");
  const { data } = await db
    .from("sources")
    .select("id,name,language,is_active,default_category_slug,show_images")

    .order("name");
  const { data: recent } = await db
    .from("articles")
    .select("source_id,published_at")
    .order("published_at", { ascending: false })
    .limit(1000);
  const last = {};
  (recent || []).forEach((r) => {
    if (!last[r.source_id]) last[r.source_id] = r.published_at;
  });

  const rows = (data || []).map((s) => {
    const [label, tone] = health(s, last[s.id]);
    return { ...s, label, tone, last: last[s.id] };
  });
  const rank = { red: 0, amber: 1, green: 2, gray: 3 };
  rows.sort((a, b) => rank[a.tone] - rank[b.tone] || a.name.localeCompare(b.name));
  const n = (t) => rows.filter((r) => r.tone === t).length;

  const opts = (cats || []).map((c) => (
    <option key={c.slug} value={c.slug}>{c.name_tr}</option>
  ));

  return (
    <div className="adm">
      <Nav />
      <h1>Kaynaklar ({rows.length})</h1>
      {searchParams.msg && <p className="adm-msg">{searchParams.msg}</p>}

      <div className="adm-stat">
        <div><b>{n("green")}</b>Çalışıyor</div>
        <div><b>{n("amber")}</b>Yavaş</div>
        <div><b>{n("red")}</b>Sessiz</div>
        <div><b>{n("gray")}</b>Kapalı</div>
      </div>

      <details className="adm-item">
        <summary>Yeni kaynak ekle</summary>
        <form action={addSource} className="adm-form">
          <input name="name" placeholder="Kaynak adı" required />
          <input name="url" type="url" placeholder="RSS adresi (https://...)" required />
          <select name="language">
            <option value="tr">Türkçe (çeviri yok)</option>
            <option value="en">Yabancı (çevrilecek)</option>
          </select>
          <select name="slug">{opts}</select>
          <button type="submit">Kaynağı ekle</button>
        </form>
      </details>

      {rows.map((s) => (
        <div key={s.id} className={`adm-item${s.is_active ? "" : " off"}`}>
          <strong>{s.name}</strong>
          <span className={`chip ${s.tone}`}>{s.label}</span>
          <span className="meta">
            {s.language.toUpperCase()} dili, son haber:{" "}
            {s.last ? ago(s.last) : "yok"}
          </span>
          <form action={setSourceCategory} className="adm-row">
            <input type="hidden" name="id" value={s.id} />
            <select name="slug" defaultValue={s.default_category_slug}>{opts}</select>
            <button type="submit">Kategoriyi kaydet</button>
          </form>
                    <form action={toggleImages}>
            <input type="hidden" name="id" value={s.id} />
            <input type="hidden" name="on" value={s.show_images ? "0" : "1"} />
            <button type="submit">{s.show_images ? "Görselleri gizle" : "Görselleri göster"}</button>
          </form>
          <form action={toggleSource}>

            <input type="hidden" name="id" value={s.id} />
            <input type="hidden" name="active" value={s.is_active ? "0" : "1"} />
            <button type="submit">{s.is_active ? "Kaynağı kapat" : "Kaynağı aç"}</button>
          </form>
        </div>
      ))}
    </div>
  );
}
