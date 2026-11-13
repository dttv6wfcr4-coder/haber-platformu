async function getRates() {
  try {
    const r = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
      next: { revalidate: 900 },
    });
    if (!r.ok) return null;
    const x = await r.text();
    const pick = (code) => {
      const m = new RegExp(
        `Kod="${code}"[\\s\\S]*?<ForexSelling>([\\d.]+)</ForexSelling>`
      ).exec(x);
      return m ? Number(m[1]) : null;
    };
    const rows = [["USD", pick("USD")], ["EUR", pick("EUR")], ["GBP", pick("GBP")]].filter(
      ([, v]) => v
    );
    return rows.length ? rows : null;
  } catch {
    return null;
  }
}

export default async function Markets() {
  const rates = await getRates();
  if (!rates) return null;
  return (
    <div className="mkt" aria-label="Piyasalar">
      <span>Piyasalar</span>
      {rates.map(([c, v]) => (
        <b key={c}>
          {c}
          <em>
            {v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </em>
        </b>
      ))}
      <a href="https://www.tcmb.gov.tr" target="_blank" rel="noopener noreferrer">
        TCMB
      </a>
    </div>
  );
}
