# Oracle Cloud Always Free ile kalıcı yayın

Bu kurulum, uygulamayı Oracle Cloud Always Free Ubuntu VM üzerinde Docker ile
çalıştırır. Veritabanı ve yüklemeler VM'in kalıcı diskinde
`deploy/oci/data/` altında kalır.

## 1. OCI'da VM oluşturun

Oracle Cloud Console'da ana bölgenizde bir Ubuntu 24.04 VM oluşturun:

- Şekil: `VM.Standard.A1.Flex` (1 OCPU, 6 GB RAM yeterlidir).
- "Always Free eligible" etiketini doğrulayın.
- En az 50 GB önyükleme diski seçin.
- SSH anahtarınızı ekleyin ve genel IPv4 atayın.
- Ağ güvenlik kuralında TCP `80` ve `443` girişini açın.

## 2. Alan adını bağlayın

Alan adınızın DNS yönetiminde VM'in genel IPv4 adresine bir `A` kaydı ekleyin.
Örnek: `atolye.ornekalanadiniz.com`.

## 3. Sunucuyu hazırlayın

SSH ile bağlandıktan sonra:

```bash
sudo apt update
sudo apt install -y git docker.io docker-compose-plugin
sudo usermod -aG docker $USER
exit
```

Yeniden SSH ile bağlanın, sonra projeyi alın:

```bash
git clone https://github.com/omercelik2022/omercelik.git erasmus-proje-atolyesi
cd erasmus-proje-atolyesi/deploy/oci
cp .env.example .env
```

`.env` dosyasında gerçek alan adını ve güçlü, rastgele `SETUP_TOKEN` değerini
tanımlayın. Bu dosyayı Git'e göndermeyin.

## 4. Başlatın

```bash
docker compose up -d --build
docker compose ps
```

Caddy, DNS kaydı doğruysa otomatik HTTPS sertifikası alır. Uygulama
`https://alan-adiniz` üzerinden açılır.

## Yedek ve güncelleme

- Veri dizini: `deploy/oci/data/`
- Uygulama içinden Ayarlar > SQLite yedeğini indirerek ayrıca yedek alın.
- Güncelleme için: `git pull && docker compose up -d --build`

Oracle Always Free kota dışına çıkan kaynaklar ücretlendirilir. Oluştururken
"Always Free eligible" etiketini doğrulayın.
