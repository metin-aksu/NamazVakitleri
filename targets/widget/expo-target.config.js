/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = config => ({
  type: 'widget',
  name: 'PrayerTimesWidget',
  bundleIdentifier: '.PrayerTimesWidget',
  deploymentTarget: '16.4',
  colors: {
    $widgetBackground: '#0F4C75',
    $accent: '#3282B8',
  },
  entitlements: {
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
});
