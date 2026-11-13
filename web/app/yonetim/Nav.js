"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "./actions";

const TABS = [
  ["/yonetim", "Haberler", "M5 4h14v16H5zM8 9h8M8 13h8M8 17h5"],
  ["/yonetim/canli", "Canlı", "M3 12h4l3-8 4 16 3-8h4"],
  ["/yonetim/ekle", "Ekle", "M12 5v14M5 12h14"],
  ["/yonetim/istatistik", "Özet", "M5 20V10M12 20V4M19 20v-7"],
  ["/yonetim/kaynaklar", "Kaynaklar", "M5 12a7 7 0 0 1 7-7M5 18a13 13 0 0 1 13-13M6 18.5h.01"],
  ["/yonetim/araclar", "Araçlar", "M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M8 15v4"],
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
        {TABS.map(([href, label, d]) => (
          <Link key={href} href={href} className={path === href ? "on" : ""}>
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
