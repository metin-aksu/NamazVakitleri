# Mobil Uygulama Yayınlama Rehberi

## Android

### 1. Release Bundle (.aab) Dosyasını Alın
Release bundle dosyanız şu konumda oluşturulmuştur:
`android/app/build/outputs/bundle/release/app-release.aab`

**Google Play Console** -> **Production** (veya Testing) kanalına yüklemeniz gereken dosya budur.

### 2. İmzalama Gizli Bilgileri (Signing Secrets)
- Keystore dosyası: `android/app/release.keystore`
- Giriş bilgileri: `android/key.properties`

> [!IMPORTANT]
> **ÖNEMLİ:** `release.keystore`, `key.properties` dosyalarını ve şifrelerinizi güvenli bir yere yedekleyin. Eğer `release.keystore` dosyasını kaybederseniz, uygulamanızı Play Store'da güncelleyemezsiniz.

## iOS

### 1. Sürümleme (Versioning)
Projeyi Xcode ile açın (`ios/NamazVakitleri.xcworkspace`).
`NamazVakitleri` hedefi (target) için **General** sekmesinde:
- **Version**: örn. `1.0.0`
- **Build**: örn. `1` (App Store'a her yeni yüklemede bu sayıyı artırmalısınız)

### 2. İmzalama (Signing)
**Signing & Capabilities** sekmesinde:
- **Automatically manage signing** seçeneğinin işaretli olduğundan emin olun.
- **Team** kısmından Apple Developer hesabınızı seçin.

### 3. Arşivleme ve Yükleme (Archive & Upload)
1. Xcode üst çubuğundaki cihaz listesinden **Any iOS Device (arm64)** seçeneğini seçin.
2. Menüden **Product** > **Archive** seçeneğine tıklayın.
3. Arşivleme işlemi bittiğinde **Organizer** penceresi açılacaktır.
4. **Distribute App** > **App Store Connect** > **Upload** seçeneklerine tıklayın ve ekrandaki yönergeleri izleyin.
