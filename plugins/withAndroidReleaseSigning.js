const { withAppBuildGradle } = require('expo/config-plugins');

// android/ klasörü prebuild ile yeniden üretildiği için imza bilgileri
// credentials/android altında tutulur (git'e girmez).
const KEY_PROPERTIES_LOADER = `
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file("../credentials/android/key.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
`;

const RELEASE_SIGNING_CONFIG = `
        release {
            if (keystoreProperties['storeFile']) {
                storeFile new File(keystorePropertiesFile.parentFile, keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }`;

function replaceOnce(contents, search, replacement) {
  if (!contents.includes(search)) {
    throw new Error(`withAndroidReleaseSigning: "${search.trim()}" bulunamadı`);
  }
  return contents.replace(search, replacement);
}

module.exports = function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, gradleConfig => {
    let contents = gradleConfig.modResults.contents;
    if (contents.includes('keystorePropertiesFile')) {
      return gradleConfig;
    }

    contents = replaceOnce(contents, '\nandroid {', `${KEY_PROPERTIES_LOADER}\nandroid {`);
    contents = replaceOnce(
      contents,
      "keyPassword 'android'\n        }",
      `keyPassword 'android'\n        }${RELEASE_SIGNING_CONFIG}`,
    );
    // Anahtar yoksa Expo'nun varsayılanı olan debug imzası kullanılır
    contents = contents.replace(
      /(release \{[^}]*?)signingConfig signingConfigs\.debug/,
      '$1signingConfig keystoreProperties[\'storeFile\'] ? signingConfigs.release : signingConfigs.debug',
    );

    gradleConfig.modResults.contents = contents;
    return gradleConfig;
  });
};
