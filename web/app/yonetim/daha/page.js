import Link from "next/link";
import { isAdmin } from "../../../lib/admin";
import Nav from "../Nav";

export const dynamic = "force-dynamic";

const ITEMS = [
  ["/yonetim/istatistik", "Özet", "Haber sayıları ve kategori dağılımı"],
  ["/yonetim/kategoriler", "Kategoriler", "Ad ve sıra düzenle"],
  ["/yonetim/araclar", "Araçlar", "Duyuru, yasaklı kelime, toplu kaynak, RSS testi, temizlik"],
  ["/yonetim/sistem", "Sistem", "Veritabanı kotası ve worker hataları"],
  ["/yonetim/gunluk", "Etkinlik günlüğü", "Girişler ve yapılan işlemler"],
];

export default function Daha() {
  if (!isAdmin()) {
    return (
      <div className="adm-login">
        <p>Giriş gerekli.</p>
        <a href="/yonetim">Giriş yap</a>
      </div>
    );
  }
  return (
    <div className="adm">
      <Nav />
      <h1>Daha fazla</h1>
      {ITEMS.map(([href, title, text]) => (
        <Link key={href} href={href} className="adm-item">
          <strong>{title}</strong>
          <span>{text}</span>
        </Link>
      ))}
    </div>
  );
}
