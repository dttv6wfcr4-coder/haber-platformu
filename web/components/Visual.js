export const hasPhoto = (a) =>
  Boolean(a.sources?.show_images && a.image_url && /^https:\/\//i.test(a.image_url));

export default function Visual({ a, className = "" }) {
  if (!hasPhoto(a)) return null;
  return (
    <img
      className={className}
      src={a.image_url}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}
