import { adminDb, isAdmin } from "../../../lib/admin";
import { addWord, delWord, saveBanner, cleanup, runWorker } from "../actions";
import Nav from "../Nav";
import { applyBlocked } from "../actions";


export const dynamic = "force-dynamic";

export default async function Araclar({ searchParams }) {
  if (!isAdmin()) {
    return (
      <div className="adm-login">
        <p>Giriş gerekli.</p>
        <a href="/yonetim">Giriş yap</a>
      </div>
    );
  }
  const db = adminDb();
  const { data: bn } = await db.from("settings").select("value").eq("key", "banner").single();
  const { data: words } = await db.from("blocked_words").select("id,word").order("word");

  return (
    <div className="adm">
      <Nav />
      <h1>Araçlar</h1>
      {searchParams.msg && <p className="adm-msg">{searchParams.msg}</p>}

      <div className="adm-sec">
        <h2>Şimdi haber çek</h2>
        <form action={runWorker}>
          <button type="submit">Worker'ı başlat</button>
        </form>
      </div>

      <div className="adm-sec">
        <h2>Duyuru bandı</h2>
        <form action={saveBanner} className="adm-form">
          <input name="banner" defaultValue={bn?.value || ""} maxLength={200} placeholder="Boş bırakırsan kaldırılır" />
          <button type="submit">Kaydet</button>
        </form>
      </div>

      <div className="adm-sec">
        <h2>Yasaklı kelimeler</h2>
        <form action={applyBlocked}>
          <button type="submit">Mevcut haberlere uygula</button>
        </form>

        <p className="meta">Başlık veya özetinde geçen haberler hiç kaydedilmez. Küçük harfle yazın.</p>
        <form action={addWord} className="adm-form">
          <input name="word" placeholder="kelime" required />
          <button type="submit">Ekle</button>
        </form>
        {(words || []).map((w) => (
          <form key={w.id} action={delWord} className="adm-row">
            <input type="hidden" name="id" value={w.id} />
            <span>{w.word}</span>
            <button type="submit">Sil</button>
          </form>
        ))}
      </div>

      <div className="adm-sec">
        <h2>Eski haberleri temizle</h2>
        <form action={cleanup} className="adm-form">
          <input name="days" type="number" min="7" defaultValue="30" />
          <label className="adm-all">
            <input type="checkbox" name="ok" value="1" /> Bu kadar günden eski haberlerin kalıcı silineceğini onaylıyorum (sabitler hariç)
          </label>
          <button type="submit">Sil</button>
        </form>
      </div>

      <div className="adm-sec">
        <h2>Yedek</h2>
        <a href="/yonetim/disa-aktar">Tüm haberleri CSV indir</a>
      </div>
    </div>
  );
}
