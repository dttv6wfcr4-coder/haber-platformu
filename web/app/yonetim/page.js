import Link from "next/link";
import { adminDb, isAdmin } from "../../lib/admin";
import { updateArticle, setHidden, togglePin, bulkAction } from "./actions";
import { loginSafe } from "./auth";
import Nav from "./Nav";
import SelectAll from "./SelectAll";

export const dynamic = "force-dynamic";
const PER = 20;

export default async function Yonetim({ searchParams }) {
  if (!isAdmin()) {
    const hata = searchParams.hata;
    return (
      <div className="adm-login">
        <h1>Yönetim</h1>
        {hata === "kilit" && (
          <p className="adm-msg">Çok fazla yanlış deneme. 15 dakika sonra tekrar dene.</p>
        )}
        {hata === "sifre" && <p className="adm-msg">Şifre yanlış.</p>}
        <form action={loginSafe}>
          <input type="password" name="pw" placeholder="Şifre" autoComplete="current-password" required />
          <button type="submit">Giriş</button>
        </form>
      </div>
    );
  }

  const db = adminDb();
  const durum = searchParams.durum || "gorunen";
  const kat = searchParams.kat || "";
  const kaynak = searchParams.kaynak || "";
  const sure = searchParams.sure || "";
  const q = (searchParams.q || "").replace(/[%,()]/g, " ").trim();
  const page = Math.max(1, Number(searchParams.sayfa) || 1);
  const from = (page - 1) * PER;

  const [{ data: cats }, { data: srcs }, { count: newReports }] = await Promise.all([
    db.from("categories").select("id,name_tr").order("sort_order"),
    db.from("sources").select("id,name").order("name"),
    db.from("reports").select("id", { count: "exact", head: true }).eq("status", "yeni"),
  ]);

  let query = db
    .from("articles")
    .select(
      "id,title_tr,summary_tr,category_id,is_hidden,is_pinned,published_at,original_url,categories(name_tr),sources(name)",
      { count: "exact" }
    )
    .order("published_at", { ascending: false })
    .range(from, from + PER - 1);
  if (durum === "gizli") query = query.eq("is_hidden", true);
  else if (durum === "sabit") query = query.eq("is_pinned", true);
  else if (durum !== "hepsi") query = query.eq("is_hidden", false);
  if (kat) query = query.eq("category_id", Number(kat));
  if (kaynak) query = query.eq("source_id", Number(kaynak));
  if (Number(sure) > 0) {
    query = query.gte("published_at", new Date(Date.now() - Number(sure) * 86400000).toISOString());
  }
  if (q) query = query.or(`title_tr.ilike.%${q}%,summary_tr.ilike.%${q}%`);

  const { data, count } = await query;
  const pages = Math.max(1, Math.ceil((count || 0) / PER));
  const link = (p) =>
    `/yonetim?${new URLSearchParams({ durum, kat, kaynak, sure, q, sayfa: String(p) })}`;

  const views = {};
  const paths = (data || []).map((a) => `/haber/${a.id}`);
  if (paths.length) {
    const { data: v } = await db.rpc("article_views", { p_ids: paths });
    (v || []).forEach((r) => (views[r.path] = r.n));
  }

  const catOptions = (cats || []).map((c) => (
    <option key={c.id} value={c.id}>{c.name_tr}</option>
  ));

  return (
    <div className="adm">
      <Nav />
      <h1>Haberler ({count || 0})</h1>

      {newReports > 0 && (
        <Link href="/yonetim/bildirimler" className="adm-msg" style={{ display: "block" }}>
          {newReports} yeni bildirim var. Görmek için dokun.
        </Link>
      )}

      <form method="get" action="/yonetim" className="adm-form">
        <input name="q" defaultValue={q} placeholder="Ara…" />
        <select name="durum" defaultValue={durum}>
          <option value="gorunen">Görünenler</option>
          <option value="gizli">Gizlenenler</option>
          <option value="sabit">Sabitlenenler</option>
          <option value="hepsi">Hepsi</option>
        </select>
        <select name="kat" defaultValue={kat}>
          <option value="">Tüm kategoriler</option>
          {catOptions}
        </select>
        <select name="kaynak" defaultValue={kaynak}>
          <option value="">Tüm kaynaklar</option>
          {(srcs || []).map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select name="sure" defaultValue={sure}>
          <option value="">Tüm zamanlar</option>
          <option value="1">Son 24 saat</option>
          <option value="7">Son 7 gün</option>
          <option value="30">Son 30 gün</option>
        </select>
        <button type="submit">Filtrele</button>
      </form>

      <form id="bulk" action={bulkAction} className="adm-bulk">
        <SelectAll />
        <select name="op">
          <option value="hide">Seçilenleri gizle</option>
          <option value="show">Geri getir</option>
          <option value="pin">Sabitle</option>
          <option value="unpin">Sabitlemeyi kaldır</option>
          <option value="cat">Kategoriyi değiştir</option>
        </select>
        <select name="category_id">{catOptions}</select>
        <button type="submit">Uygula</button>
      </form>

      {(data || []).map((a) => (
        <div key={a.id} className={`adm-item${a.is_hidden ? " off" : ""}`}>
          <label className="adm-all">
            <input type="checkbox" name="ids" value={a.id} form="bulk" /> Seç
          </label>
          <span className="tag">{a.categories?.name_tr}</span>
          <strong>{a.is_pinned ? "📌 " : ""}{a.title_tr}</strong>
          <div className="adm-row meta">
            <span>{a.sources?.name}</span>
            <span>
              {new Date(a.published_at).toLocaleString("tr-TR", {
                timeZone: "Europe/Istanbul",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span>{views[`/haber/${a.id}`] || 0} okunma</span>
            {a.is_hidden && <span>GİZLİ</span>}
          </div>
          <div className="adm-row">
            <Link href={`/haber/${a.id}`}>Sitede aç</Link>
            <a href={a.original_url} target="_blank" rel="noopener noreferrer">Kaynak</a>
            <form action={setHidden}>
              <input type="hidden" name="id" value={a.id} />
              <input type="hidden" name="hide" value={a.is_hidden ? "0" : "1"} />
              <button type="submit">{a.is_hidden ? "Geri getir" : "Gizle"}</button>
            </form>
            <form action={togglePin}>
              <input type="hidden" name="id" value={a.id} />
              <input type="hidden" name="pin" value={a.is_pinned ? "0" : "1"} />
              <button type="submit">{a.is_pinned ? "Sabiti kaldır" : "Sabitle"}</button>
            </form>
          </div>
          <details>
            <summary>Düzenle</summary>
            <form action={updateArticle} className="adm-form">
              <input type="hidden" name="id" value={a.id} />
              <label>Başlık</label>
              <input name="title_tr" defaultValue={a.title_tr} required />
              <label>Özet</label>
              <textarea name="summary_tr" rows={4} defaultValue={a.summary_tr || ""} />
              <label>Kategori</label>
              <select name="category_id" defaultValue={String(a.category_id)}>
                {catOptions}
              </select>
              <button type="submit">Kaydet</button>
            </form>
          </details>
        </div>
      ))}

      {!data?.length && <p className="empty">Haber bulunamadı.</p>}

      <div className="adm-row adm-pager">
        {page > 1 && <Link href={link(page - 1)}>Önceki</Link>}
        <span>{page} / {pages}</span>
        {page < pages && <Link href={link(page + 1)}>Sonraki</Link>}
      </div>
    </div>
  );
}
