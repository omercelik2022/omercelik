# Erasmus+ Proje Atölyesi

İki kişilik özel çalışma alanında Erasmus+ başvurusunu kanıt, resmî kural sürümü ve sürümlü düzeltmelerle incelemek için Türkçe öncelikli uygulama. Bu ürün resmî değerlendirme kurumu veya başvuru portalı değildir; eşiği geçmek fonlama ya da hibe garantisi vermez.

## Başlatma

Node.js 24+ gerekir.

```powershell
npm install
npm run sources:fetch
npm run build
npm run start
```

İlk başlatmada sunucu, yalnızca yerel `data/setup-token.txt` dosyasına bir kurulum kodu yazar. Tarayıcıda `http://127.0.0.1:4310` adresini açıp bu kodla ilk sahip hesabını oluşturun. İkinci hesabı sahip, Ayarlar ekranından ekler. Üçüncü hesap oluşturma, herkese açık kayıt ve sabit parola yoktur.

Geliştirme için `npm run dev`; test için `npm test`; tarayıcı testi için `npm run test:e2e` kullanılır. `DATA_DIR`, `PORT`, `HOST`, `COOKIE_SECURE`, `OCR_ENABLED`, `OCR_CACHE`, `PDF_FONT`, `OLLAMA_URL`, `AI_JSON_ENDPOINT`, `AI_API_KEY` ortam değişkenleri sunucu tarafında okunur. Anahtarlar arayüzde veya veritabanında saklanmaz.

## Çalışan kapsam

- 2026 kural paketi, indirilen kaynak hash'i, kontrol tarihi, resmî URL/bölüm ve geriye dönük sabit değerlendirme koşusu.
- KA122-SCH/VET/ADU; KA121 SCH/VET/ADU; KA151-YOU; KA152/153/154-YOU; KA210; KA220; KA240 için ayrı paketler. KA121/151 standart 100 puan kartı üretmez.
- PDF, DOCX, XLSX, CSV yükleme; gerçek içerik doğrulama, makro/dış bağlantı çalıştırmama, izole çıkarım, PDF sayfa/DOCX paragraf-XLSX hücre konumu, formül-önbellek ayrımı, OCR durumu ve tüm bölüm kapsamı.
- Kanıta bağlı yerel bulgular, uygunluk kontrolleri, bağımsız tam sayı eşik motoru, AI maskesi/önizlemesi ve yapılandırılmış AI yanıtı doğrulaması.
- İki hesap, tek kalıcı SQLite çalışma alanı, oturum/CSRF/origin koruması, sürüm çakışması, görev, yorum, faaliyet/bütçe, geçmiş uzman sonucu ve kalibrasyon.
- PDF/DOCX/XLSX raporu; kaynak, belge, kural, analiz ve puan sürümünü rapora sabitler.

## Kaynak güncelleme

`npm run sources:fetch` yalnızca izinli resmî HTTPS kaynaklarını indirir; yönlendirme, özel ağ ve boyut sınırlarını uygular. `sources/manifest.json` içerik hash'ini tutar. Uygulamadaki Kaynak Merkezi'nde yapılan kontrol önce taslak değişiklik üretir. Sahip doğrulamadan sayısal kural etkinleşmez. Eski analizler kendi kural kopyalarını korur.

Program Rehberi 2026 V1 (12 Kasım 2025), eylem sayfaları, ilgili form şablonları, uzman rehberi ve Türkiye Ulusal Ajansı kaynakları yerelde `sources/raw` ve `sources/text` altında sabitlenir. Kural paketleri `rules/2026.json` içindedir.

## Bilinen sınırlar

KA120 ve KA150 için 2026 form şablonu resmî katalogdan doğrulanamadığı için paketler bilgi amaçlıdır; otomatik değerlendirme açık değildir. Türkiye'ye özgü tahsis oranı bulunmayan alanlarda başka ülke oranı taşınmaz ve kesin hibe tutarı hesaplanmaz. OCR'nin ilk çalıştırmada dil varlıklarını indirmesi gerekebilir; başarısız OCR eksiklik puanı değildir. AI bağlantısı kapalı varsayılandır; kalite puanı uydurulmaz. Dinamik başvuru formundaki karakter sınırları resmî platformdan ayrıca kontrol edilmelidir.

## Tasarım kaynakları

MotionSites Glow Features önizlemesi, girişteki koyu zemin/kart ritmi ve kontrollü renk ışığına uyarlandı. 21st.dev üzerinden incelenen shadcn/ui Button bileşeninin MIT lisanslı yaklaşımı ürün düğmelerinde uyarlandı. Ayrıntılar, URL'ler, lisans metni ve yerel inceleme varlığı [docs/DESIGN.md](docs/DESIGN.md) içindedir. Gerçek masaüstü ve telefon doğrulama görüntüleri `docs/screenshots` içindedir.
