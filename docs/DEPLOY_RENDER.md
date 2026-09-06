# Render ile yayınlama

Bu uygulama yüklenen belgeleri ve SQLite veritabanını `data/` altında tutar.
Render'da kalıcı disk bu klasöre bağlanmalıdır; `render.yaml` bunu
`/opt/app/data` yolu için tanımlar.

1. Bu klasörü özel bir GitHub deposuna gönderin.
2. Render hesabında **New + > Blueprint** seçin ve depoyu bağlayın.
3. `erasmus-proje-atolyesi` hizmetini oluşturun. Blueprint Dockerfile'ı,
   kalıcı diski ve `/api/health` sağlık kontrolünü kullanır.
4. İlk dağıtımdan önce veya sonra hizmetin Environment bölümüne güçlü,
   rastgele bir `SETUP_TOKEN` değeri ekleyin.
5. Dağıtım tamamlandığında verilen `onrender.com` adresini açın; kurulum
   ekranında `SETUP_TOKEN` ile ilk sahip hesabını oluşturun.
6. İsterseniz Settings > Custom Domains bölümünden kendi alan adınızı
   bağlayın ve DNS kaydını Render'ın gösterdiği hedefe yönlendirin.

## Operasyon notları

- Kalıcı disk tek uygulama örneğine bağlıdır. Bu SQLite sürümü için tek
  örnek kullanın.
- Güncellemeden önce Ayarlar ekranındaki SQLite yedeğini indirin.
- `COOKIE_SECURE=true` yalnızca HTTPS üzerinde oturum çerezlerini gönderir;
  Render'ın varsayılan adresi ve özel alan adları HTTPS kullanır.
