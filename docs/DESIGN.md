# Tasarım kararları — 6 Eylül 2026

## MotionSites
İncelenen katalog: https://motionsites.ai/
Seçilen gerçek örnek: **Glow Features**, açık önizleme: https://motionsites.ai/assets/features-glow-poster-CmUBaPAq.png
Görsel yerelde `references/motionsites-glow.png` olarak incelendi. Koyu zeminde üç ayrı kart, çizgisel ikon, başlık/açıklama hiyerarşisi ve renk geçişli kenarlık kullanıyor. Giriş ekranında üç çalışma adımına, lacivert zemin üstünde turkuaz kenar ışığına ve sade ikonlara uyarlanacak. İç sayfalarda aynı kart ritmi açık zeminde uygulanacak. Büyük neon çerçeveler metin çalışmasına uygun incelikte azaltılacak. Ücretli prompt/kod alınmadı; örnek görsel ürün varlığı olarak dağıtılmayacak.

## 21st.dev
Katalog: https://21st.dev/@shadcn/library/shadcn-ui
Seçilen bileşen: https://21st.dev/community/components/shadcn/button/default
Katalog sayfası erişilebilir fakat dinamik önizleme metin tarayıcısında boş. Bileşenin resmî kaynak kodu ayrıca incelendi: https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/button.tsx
MIT lisansı: https://raw.githubusercontent.com/shadcn-ui/ui/main/LICENSE.md — tam bildirim `references/shadcn-LICENSE.md` içinde korunur.
Button bileşeninin varyant/size, Slot ile asChild, data-slot ve erişilebilir disabled yaklaşımı `src/components/Button.tsx` içinde uyarlanacak. CSS sınıfları ürünün tasarım sistemine çevrilecek. Bağımlılıklar: React, @radix-ui/react-slot, class-variance-authority, clsx. Tüm temel eylemlerde kullanılacak.

## Ortak sistem
Lacivert #102d40, turkuaz #087f83, kırık beyaz #f5f7f7. 44px dokunma hedefleri, görünür odak, durumların metinle açıklanması, 180ms geçiş ve reduced-motion desteği. Giriş, panel, yükleme, değerlendirme/atölye masaüstü ve 390px telefonda gerçek tarayıcıyla doğrulanacak.
