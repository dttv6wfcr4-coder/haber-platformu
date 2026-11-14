import Link from "next/link";
import { adminDb, isAdmin } from "../../../lib/admin";
import { ago } from "../../../lib/db";
import { reportAction } from "../actions";
import Nav from "../Nav";

export const dynamic = "force-dynamic";

export default async function Bildirimler({ searchParams }) {
  if (!isAdmin()) {
    return (
      <div className="adm-login">
        <p>Giriş gerekli.</p>
        <a href="/yonetim">Giriş yap</a>
      </div>
    );
  }
  const all = searchParams.durum === "hepsi";
  let q = adminDb()
    .from("reports")
    .select("id,created_at,reason,message,email,status,articles(id,title_tr,is_hidden)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (!all) q = q.eq("status", "yeni");
  const { data } = await q;

  return (
    <div className="adm">
      <Nav />
      <h1>Bildirimler</h1>
      <div className="adm-row">
        <Link href="/yonetim/bildirimler">Yeni olanlar</Link>
        <Link href="/yonetim/bildirimler?durum=hepsi">Hepsi</Link>
      </div>

      {(data || []).map((r) => (
        <div key={r.id} className={`adm-item${r.status === "yeni" ? "" : " off"}`}>
          <span className={`chip ${r.reason.startsWith("Telif") ? "red" : ""}`}>{r.reason}</span>
          <span className="meta">{ago(r.created_at)}, durum: {r.status}</span>
          {r.articles ? (
            <Link href={`/haber/${r.articles.id}`}>
              <strong>{r.articles.title_tr}</strong>
              {r.articles.is_hidden ? " (gizli)" : ""}
            </Link>
          ) : (
            <span className="meta">Haber silinmiş</span>
          )}
          {r.message && <p style={{ margin: 0 }}>{r.message}</p>}
          {r.email && <a href={`mailto:${r.email}`}>{r.email}</a>}
          <form action={reportAction} className="adm-row">
            <input type="hidden" name="id" value={r.id} />
            {r.articles && !r.articles.is_hidden && (
              <button type="submit" name="op" value="hide">Haberi gizle</button>
            )}
            {r.status === "yeni" ? (
              <button type="submit" name="op" value="done">Çözüldü</button>
            ) : (
              <button type="submit" name="op" value="reopen">Yeniden aç</button>
            )}
            <button type="submit" name="op" value="delete">Sil</button>
          </form>
        </div>
      ))}
      {!data?.length && <p className="empty">Bildirim yok.</p>}
    </div>
  );
}
