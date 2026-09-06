# Kabul senaryosu kaydı

| Senaryo | Durum | Kanıt |
| --- | --- | --- |
| 1–5 | Geçti | `tests/rules.test.ts`: KA122, KA220, KA121/151, geçersiz paket |
| 6 | Geçti | API yalnızca proje yıl/eylem/ülke kuralını alır; uyarlama ayrı koşudur |
| 7–8 | Geçti | Tüm PDF sayfaları bölümlenir; okunamayan içerik tam toplamı kapatır |
| 9–11 | Geçti | Konumlu tutarsızlık, çalışma notu ayrımı, enjeksiyon testi |
| 12 | Geçti | AI kapalıyken yalnızca `partial` yerel koşu |
| 13, 20 | Geçti | API testinde öneri/sürüm ve 409 çakışma taslağı |
| 14, 19 | Geçti | Oturum, iki hesap sınırı, ortak kalıcı proje API testi |
| 15 | Geçti | XLSX dışa aktarma API testi; Unicode fontla PDF seçeneği |
| 16, 23 | Geçti | Playwright masaüstü/390px, menü-klavye odak stilleri, reduced motion CSS |
| 17 | Geçti | Koşuda kural paketi kopyalanır; yeni kaynak ayrı taslak sürümüdür |
| 18 | Geçti | Doğrulanmayan ulusal oranlarda kesin hibe yok |
| 21 | Geçti | Görev/yorum/audit API ve ekranı |
| 22 | Geçti | `docs/DESIGN.md`, lisans ve ekran görüntüleri |

`npm test`: 18 test geçti. `npx playwright test`: 1 tarayıcı senaryosu geçti. Bu sentetik testler gerçek kişisel veri içermez.
