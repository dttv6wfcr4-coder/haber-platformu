export const metadata = {
  title: "Telif ve İletişim",
  description: "İçerik politikamız, telif hakkı bildirimi ve iletişim bilgileri.",
};

export default function Telif() {
  return (
    <article className="detail">
      <h1>Telif ve İletişim</h1>

      <h2>Bu site nedir?</h2>
      <p>
        Bu site, Türkiye ve dünyadan haberlerin başlıklarını ve kısa özetlerini
        tek yerde toplayan bir haber derleme hizmetidir. Kendi muhabir kadromuz
        yoktur, haberleri üretmiyoruz.
      </p>

      <h2>İçerikler nasıl hazırlanıyor?</h2>
      <p>
        Kaynakların herkese açık RSS yayınlarından alınan başlık ve kısa
        bilgiler, otomatik olarak yapay zekâ ile Türkçeye çevrilir, kısaltılır
        ve kategorilere ayrılır. Çeviri ve özetlerde hata olabilir. Haberin
        doğru ve eksiksiz hâli için her zaman kaynağa bakın.
      </p>

      <h2>Telif hakları</h2>
      <p>
        Haberlerin tüm hakları ilgili yayıncılara aittir. Sitemizde haberlerin
        tam metni ve görselleri yayımlanmaz; yalnızca kısa özet gösterilir ve
        her haberde kaynağın adı ile asıl habere bağlantı verilir.
      </p>

            <h2>Gizlilik</h2>
      <p>
        Site, ziyaretçi sayısını ölçmek için anonim istatistik tutar: sayfa adresi,
        ülke, cihaz türü ve günlük değişen anonim bir kod kaydedilir. IP adresi
        saklanmaz, çerez kullanılmaz.
      </p>


      <h2>İçerik kaldırma talebi</h2>
      <p>
        Bir içeriğin hak sahibiyseniz ve sitemizde yer almasını istemiyorsanız
        lütfen aşağıdaki adrese, ilgili sayfanın bağlantısı ve hak sahipliğinizi
        gösteren kısa bir açıklama ile yazın. Talepler en kısa sürede
        değerlendirilir ve uygun görülen içerikler kaldırılır.
      </p>
      <p>
        <strong>E-posta:</strong> iletisim@ornek.com
      </p>
      
    </article>
  );
}
