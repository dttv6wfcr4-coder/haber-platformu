import "./globals.css";
import { Inter, Barlow_Condensed } from "next/font/google";
import { sb } from "../lib/db";
import { Chrome, BottomNav, Footer } from "../components/Client";
import Track from "../components/Track";
import ReadState from "../components/ReadState";
import ScrollTop from "../components/ScrollTop";



const sans = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});
const head = Barlow_Condensed({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
  variable: "--font-head",
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
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0E0F12" },
  ],
};

const THEME = `try{var h=document.documentElement,t=localStorage.getItem("tema");if(t)h.dataset.theme=t;var p=JSON.parse(localStorage.getItem("tercih")||"{}");if(p.font&&p.font!=="m")h.dataset.font=p.font;if(p.compact)h.dataset.compact="1";if(p.nosum)h.dataset.nosum="1"}catch(e){}`;



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
    <html lang="tr" className={`${sans.variable} ${head.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME }} />
      </head>
      <body>
        <Track />
        <ReadState />
        <ScrollTop />

        <Chrome cats={cats || []} banner={bn?.value || ""} />
        <main className="wrap">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
