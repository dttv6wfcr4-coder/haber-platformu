"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "./actions";

const MORE = [
  "/yonetim/daha",
  "/yonetim/istatistik",
  "/yonetim/kategoriler",
  "/yonetim/araclar",
  "/yonetim/sistem",
  "/yonetim/gunluk",
];

const TABS = [
  ["/yonetim", "Haberler", "M5 4h14v16H5zM8 9h8M8 13h8M8 17h5", ["/yonetim"]],
  ["/yonetim/canli", "Canlı", "M3 12h4l3-8 4 16 3-8h4", ["/yonetim/canli"]],
  ["/yonetim/ekle", "Ekle", "M12 5v14M5 12h14", ["/yonetim/ekle"]],
  ["/yonetim/kaynaklar", "Kaynaklar", "M5 12a7 7 0 0 1 7-7M5 18a13 13 0 0 1 13-13M6 18.5h.01", ["/yonetim/kaynaklar"]],
  ["/yonetim/bildirimler", "Bildirim", "M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M10 21a2 2 0 0 0 4 0", ["/yonetim/bildirimler"]],
  ["/yonetim/daha", "Daha", "M5 12h.01M12 12h.01M19 12h.01", MORE],
];

export default function Nav() {
  const path = usePathname();
  return (
    <>
      <div className="adm-bar-top">
        <strong>Yönetim</strong>
        <div className="adm-row">
          <Link href="/">Siteyi gör</Link>
          <form action={logout}>
            <button type="submit" className="ghost">Çıkış</button>
          </form>
        </div>
      </div>
      <nav className="adm-tabs" aria-label="Yönetim menüsü">
        {TABS.map(([href, label, d, match]) => (
          <Link key={href} href={href} className={match.includes(path) ? "on" : ""}>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d={d} />
            </svg>
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
