import { sb } from "../../lib/db";
import MyFeed from "../../components/MyFeed";

export const revalidate = 300;
export const metadata = { title: "Benim akışım", robots: { index: false } };

export default async function Benim() {
  const { data: cats } = await sb
    .from("categories")
    .select("id,slug,name_tr")
    .order("sort_order");
  return (
    <>
      <h1 className="page-title">Benim akışım</h1>
      <p className="meta">Seçimlerin yalnızca bu cihazda saklanır.</p>
      <MyFeed cats={cats || []} />
    </>
  );
}
