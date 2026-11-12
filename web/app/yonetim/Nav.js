import { logout } from "./actions";

export default function Nav() {
  return (
    <div className="adm-nav">
      <a href="/yonetim">Haberler</a>
      <a href="/yonetim/ekle">Ekle</a>
      <a href="/yonetim/istatistik">İstatistik</a>
      <a href="/yonetim/kaynaklar">Kaynaklar</a>
      <a href="/yonetim/araclar">Araçlar</a>
      <form action={logout}>
        <button type="submit">Çıkış</button>
      </form>
    </div>
  );
}
