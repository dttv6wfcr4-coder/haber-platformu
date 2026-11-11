import "./globals.css";
import { sb } from "../lib/db";

export const revalidate = 300;

export const metadata = {
  title: { default: "Haber Platformu", template: "%s | Haber Platformu" },
  description: "Türkiye ve dünyadan son dakika haberleri, Türkçe ve kategorilere ayrılmış.",
  openGraph: { type: "website", locale: "tr_TR", siteName: "Haber Platformu" },
};

export const viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }) {
  const { data: cats } = await sb
    .from("categories")
    .select("slug,name_tr")
    .order("sort_order");
  return (
    <html lang="tr">
      <body>
        <header>
          <div className="bar">
            <a className="logo" href="/">HABER</a>
            <form action="/ara" method="get">
              <input name="q" placeholder="Ara…" />
              <button type="submit">Ara</button>
            </form>
          </div>
          <nav>
            {(cats || []).map((c) => (
              <a key={c.slug} href={`/kategori/${c.slug}`}>{c.name_tr}</a>
            ))}
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
