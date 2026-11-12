import { catColor } from "../lib/db";

const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export const hasPhoto = (a) =>
  Boolean(a.sources?.show_images && a.image_url && /^https:\/\//i.test(a.image_url));

function Cover({ id, slug, className }) {
  let s = hash(String(id));
  const rnd = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r1 = (n) => Math.round(n * 10) / 10;
  const shapes = [];
  const n = 3 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {
    const kind = Math.floor(rnd() * 3);
    const x = r1(rnd() * 120);
    const y = r1(rnd() * 120);
    const r = r1(18 + rnd() * 42);
    const fill = rnd() > 0.45 ? "#fff" : "#000";
    const op = Math.round((0.1 + rnd() * 0.22) * 100) / 100;
    if (kind === 0) {
      shapes.push(<circle key={i} cx={x} cy={y} r={r} fill={fill} fillOpacity={op} />);
    } else if (kind === 1) {
      const rot = Math.floor(rnd() * 180);
      shapes.push(
        <rect
          key={i}
          x={r1(x - r)}
          y={r1(y - r / 2)}
          width={r1(r * 2)}
          height={r}
          rx={r1(r / 4)}
          fill={fill}
          fillOpacity={op}
          transform={`rotate(${rot} ${x} ${y})`}
        />
      );
    } else {
      shapes.push(
        <path
          key={i}
          d={`M${x} ${y}h${r}a${r} ${r} 0 0 1-${r} ${r}z`}
          fill={fill}
          fillOpacity={op}
        />
      );
    }
  }
  return (
    <svg
      className={`cover ${className || ""}`}
      viewBox="0 0 120 120"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width="120" height="120" fill={catColor(slug)} />
      {shapes}
    </svg>
  );
}

export default function Visual({ a, className = "" }) {
  if (hasPhoto(a)) {
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
  return <Cover id={a.id} slug={a.categories?.slug} className={className} />;
}
