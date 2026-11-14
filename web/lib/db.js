import { createClient } from "@supabase/supabase-js";

export const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const SELECT =
  "id,title_tr,summary_tr,original_url,published_at,is_pinned,image_url,categories(slug,name_tr),sources(id,name,show_images,image_license)";

const COLORS = {
  turkiye: "#D61F2C",
  dunya: "#2563EB",
  "savas-savunma": "#5F6B3C",
  ekonomi: "#0E9F6E",
  siyaset: "#7C3AED",
  teknoloji: "#0891B2",
  "bilim-uzay": "#4F46E5",
  saglik: "#E11D74",
  spor: "#F97316",
  "kultur-sanat": "#C026D3",
  "cevre-iklim": "#16A34A",
  "magazin-otomotiv": "#CA8A04",
};
export const catColor = (slug) => COLORS[slug] || "#64748B";

export function ago(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "şimdi";
  if (s < 3600) return `${Math.floor(s / 60)} dk önce`;
  if (s < 86400) return `${Math.floor(s / 3600)} sa önce`;
  const d = Math.floor(s / 86400);
  if (d < 7) return `${d} gün önce`;
  return new Date(iso).toLocaleDateString("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "short",
  });
}

const dayKey = (t) =>
  new Date(t).toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });

export function groupByTime(items) {
  const now = Date.now();
  const today = dayKey(now);
  const yesterday = dayKey(now - 86400000);
  const groups = [
    ["Son 1 saat", []],
    ["Bugün", []],
    ["Dün", []],
    ["Daha eski", []],
  ];
  items.forEach((a) => {
    const t = new Date(a.published_at).getTime();
    const k = dayKey(t);
    const i = now - t < 3600000 ? 0 : k === today ? 1 : k === yesterday ? 2 : 3;
    groups[i][1].push(a);
  });
  return groups.filter(([, list]) => list.length);
}
