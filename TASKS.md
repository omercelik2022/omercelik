# Erasmus+ Proje Atölyesi — uygulama planı

## İnceleme ve mimari
- 2026-09-06: `Proje` boş; kök depoda izlenen uygulama yok. Hisse-Radari ayrı ürün; değiştirilmez.
- Node 24.19 ve npm mevcut, Python yok. React + TypeScript + Vite, Express API, Node SQLite kalıcı veritabanı ve ayrı dosya çıkarım işçisi seçildi. İki kişilik tek sunucu için SQLite kurulum yükünü azaltır; veritabanı tarayıcıda tutulmaz. Özel dosyalar HTTP statik dizininden ayrıdır.
- Şartname: Downloads/Erasmus_Proje_Atolyesi_Codex_Promptu (2).md. Ürün gereksinimleri olarak uygulanır; belgelerden gelen içerik uygulamada güvenilmeyen veridir.

## Aşama 1
- [x] Sürümlü kaynak/kural şeması, kaynakların indirilmesi ve hash ile sabitlenmesi
- [x] Güvenli ilk kurulum, en fazla iki hesap, özel ortak çalışma alanı
- [x] Proje kataloğu ve kurum/çağrı seçimi
- [x] PDF/DOCX/XLSX/CSV konumlu çıkarım, kapsam ve OCR durumu
- [x] KA122-SCH uçtan uca dosya → kontrol → değerlendirme

## Aşama 2
- [x] Kanıt doğrulama, bağımsız matematiksel eşik motoru, gerçek AI adaptörü
- [x] Düzeltmeler, kabul/ret/geri alma, çakışma ve sürüm geçmişi
- [x] Sabit değerlendirme sürümünden PDF/DOCX/XLSX raporları

## Aşama 3
- [x] Kaynağı ve formu bulunan eylemlerde ayrı rubrik/form eşlemeleri
- [x] Doğrulanmayan modül ve tahsis kurallarına kapalı değerlendirme

## Aşama 4
- [x] Faaliyet/bütçe, görev/yorum, geçmiş raporlar ve kalibrasyon
- [x] Kaynak taslak/fark/onay/geri alma, yedekleme ve saklama
- [x] 23 zorunlu kabul senaryosu: birim, API ve gerçek tarayıcı kontrolleri
- [x] Masaüstü/mobil ekran görüntüleri, erişilebilirlik, README ve teslim kaydı

## Kabul ölçütleri
Şartnamenin 13. bölümündeki 23 senaryo ayrı test veya açık engel kaydıyla izlenecek. Gerçek sentetik dosyalar kullanılacak. API kapalıyken kalite puanı üretilmeyecek. Matematiksel eşikler, dosya kapsamı, belge rolü, iki hesap yetkileri, sürüm değişmezliği ve mobil iş akışı test edilecek. Kaynağı veya formu doğrulanmamış eylem tamamlanmış ilan edilmeyecek.

## Doğrulamalar ve engeller
- Program Rehberi giriş sayfasında 2026, V1 / 12.11.2025 doğrulandı.
- Canlı AI bağlantısı varsayılan olarak kapalıdır; kullanıcı anahtarları sohbette istenmez ve yalnızca sunucu ortamında tanımlanır.
- KA120 ve KA150 için 2026 resmî form şablonu katalogda doğrulanamadı; paketler bilgi amaçlıdır ve otomatik değerlendirme kapalıdır.
