export default function manifest() {
  return {
    name: "Haber Platformu",
    short_name: "Haber",
    description: "Türkiye ve dünyadan son dakika haberleri",
    start_url: "/",
    display: "standalone",
    background_color: "#F2F4F7",
    theme_color: "#D61F2C",
    lang: "tr",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
