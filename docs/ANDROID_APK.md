# Android APK

Bu proje Capacitor ile Android uygulamasına dönüştürülür. APK, uygulamanın
Tailscale özel ağdaki HTTPS adresini açar.

## Telefonda ön koşul

1. Telefona Tailscale'i yükleyin.
2. Telefonu `omercelik2022` Tailscale ağına davet bağlantısıyla ekleyin.
3. Tailscale uygulamasında bağlantıyı etkinleştirin.

## APK üretimi

Windows'ta Java 21 ve Android SDK kurulu olmalıdır. Android Studio'nun
Settings > Build, Execution, Deployment > Build Tools > Gradle bölümünde
Gradle JDK olarak Java 21 seçin. Ardından proje klasöründe aşağıdaki komutu
çalıştırın:

```powershell
npm run android:apk
```

APK çıktısı:

```text
android\app\build\outputs\apk\debug\app-debug.apk
```

Bu dosyayı telefona aktarın ve Android'in soracağı "bu kaynaktan yüklemeye
izin ver" seçeneğini onaylayın. Bu, test amaçlı imzasız geliştirme APK'sıdır.

## Çalışma koşulu

Telefon uygulamasını açmadan önce Tailscale bağlantısı ve bilgisayardaki
Erasmus+ sunucusu çalışıyor olmalıdır. Kalıcı bulut sunucusuna taşındığında
aynı APK'daki adres yeni alan adıyla güncellenebilir.
