# Mobil Uygulama Yayınlama Rehberi

> Proje Expo (prebuild) kullanır. `android/` ve `ios/` klasörleri git'te tutulmaz;
> `app.json`, `plugins/` ve `targets/` içeriğinden `npx expo prebuild --clean` ile üretilir.
> Native klasörlerde elle yapılan değişiklikler bir sonraki prebuild'de silinir.

## Sürüm Numaraları

Hepsi `app.json` içinden yönetilir:
- `expo.version`: Kullanıcıya görünen sürüm (örn. `1.1`), iOS ve Android ortak
- `expo.android.versionCode`: Play Store'a her yüklemede **artırılmalı**
- `expo.ios.buildNumber`: App Store'a her yüklemede **artırılmalı**

## Android

### 1. İmzalama Gizli Bilgileri (Signing Secrets)
- Keystore dosyası: `credentials/android/release.keystore`
- Giriş bilgileri: `credentials/android/key.properties`

`plugins/withAndroidReleaseSigning.js` prebuild sırasında bu dosyaları Gradle'a bağlar.
`credentials/` klasörü git'e girmez.

> [!IMPORTANT]
> **ÖNEMLİ:** `release.keystore`, `key.properties` dosyalarını ve şifrelerinizi güvenli bir yere yedekleyin. Eğer `release.keystore` dosyasını kaybederseniz, uygulamanızı Play Store'da güncelleyemezsiniz.

### 2. Release Bundle (.aab) Oluşturun
```sh
npm run android:bundle
```
Oluşan dosya: `android/app/build/outputs/bundle/release/app-release.aab`

**Google Play Console** -> **Production** (veya Testing) kanalına yüklemeniz gereken dosya budur.

## iOS

### 1. Native Projeyi Üretin
```sh
npx expo prebuild -p ios --clean
```
Ardından Xcode ile açın: `xed ios`

### 2. İmzalama (Signing)
Team ID (`Y5K2497B6G`) `app.json` içinde tanımlıdır. **Signing & Capabilities** sekmesinde
hem `NamazVaktim` hem `PrayerTimesWidget` hedefleri için **Automatically manage signing**
seçeneğinin işaretli olduğundan emin olun.

### 3. Arşivleme ve Yükleme (Archive & Upload)
1. Xcode üst çubuğundaki cihaz listesinden **Any iOS Device (arm64)** seçeneğini seçin.
2. Menüden **Product** > **Archive** seçeneğine tıklayın.
3. Arşivleme işlemi bittiğinde **Organizer** penceresi açılacaktır.
4. **Distribute App** > **App Store Connect** > **Upload** seçeneklerine tıklayın ve ekrandaki yönergeleri izleyin.
