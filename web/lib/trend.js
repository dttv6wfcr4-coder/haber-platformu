const STOP = new Set(
  ("ve bir bu da de için ile ama gibi çok daha en kadar sonra önce yeni son ilk iki üç dört beş her tüm olarak olan oldu olduğu etti ediyor eden diye ise veya ancak bile hem nasıl neden hangi bunu şunu onun bunun haber haberi yıl yılı gün hafta dünya türkiye ancak sonucu ardından göre karşı yönelik üzerine hakkında olarak başladı yaptı yapıldı açıkladı dedi söyledi the and for with after before over into about says said from that this are was were has have not you your how what why who when more").split(" ")
);

export function trending(titles, limit = 10) {
  const counts = new Map();
  for (const t of titles) {
    const words = new Set(
      (String(t).toLocaleLowerCase("tr-TR").match(/\p{L}{4,}/gu) || []).filter(
        (w) => !STOP.has(w)
      )
    );
    words.forEach((w) => counts.set(w, (counts.get(w) || 0) + 1));
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}
