import { SavedList } from "../../components/Client";

export const metadata = { title: "Kaydedilenler", robots: { index: false } };

export default function Kaydedilenler() {
  return (
    <>
      <h1 className="page-title">Kaydedilenler</h1>
      <SavedList />
    </>
  );
}
