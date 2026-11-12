import "./globals.css";
import { Inter, Source_Serif_4 } from "next/font/google";
import { sb } from "../lib/db";
import { Chrome, BottomNav, Footer } from "../components/Client";

const sans = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});
const serif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  variable: "--font-serif",
  display: "swap",
});

export const revalidate = 60;

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Haber Platformu", template: "%s | Haber Platformu" },
  description: "Türkiye ve dünyadan son dakika haberleri, Türkçe ve kategorilere ayrılmış.",
    openGraph: { type: "website", locale: "tr_TR", siteName: "Haber Platformu" },
  appleWebApp: { capable: true, title: "Haber", statusBarStyle: "default" },

};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2F4F7" },
    { media: "(prefers-color-scheme: dark)", color: "#0B111B" },
  ],
};

const THEME = `try{var t=localStorage.getItem("tema");if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children }) {
  const { data: cats } = await sb
    .from("categories")
    .select("slug,name_tr")
    .order("sort_order");
  const { data: bn } = await sb
    .from("settings")
    .select("value")
    .eq("key", "banner")
    .single();
  return (
    <html lang="tr" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME }} />
      </head>
      <body>
        <Chrome cats={cats || []} banner={bn?.value || ""} />
        <main className="wrap">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
