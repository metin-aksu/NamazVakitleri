import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { WidgetStoredData } from './widgetStorage';

export const PRAYER_TIMES_WIDGET_NAME = 'PrayerTimesWidgetProvider';

interface PrayerTimesWidgetProps {
  data: WidgetStoredData | null;
}

// Widget yüksekliği sabit (1 satır); yazılar sistem yazı boyutuyla büyürse taşar
const formatTime = (time?: string): string => time?.substring(0, 5) ?? '--:--';

function PrayerTimeColumn({ name, time }: { name: string; time?: string }) {
  return (
    <FlexWidget
      style={{
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <TextWidget
        allowFontScaling={false}
        text={name}
        style={{ color: '#BBE1FA', fontSize: 10, fontWeight: 'bold' }}
      />
      <TextWidget
        allowFontScaling={false}
        text={formatTime(time)}
        style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}
      />
    </FlexWidget>
  );
}

export function PrayerTimesWidget({ data }: PrayerTimesWidgetProps) {
  const prayerTimes = data?.prayerTimes;
  const title = data ? `${data.cityName} - ${data.date}` : 'Şehir Seçilmedi';

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        width: 'match_parent',
        height: 'match_parent',
        flexDirection: 'column',
        alignItems: 'center',
        // Tek satırlık widget'ta içerik dikeyde ortalanır, kenarlara taşmaz
        justifyContent: 'center',
        paddingHorizontal: 2,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BBE1FA',
        backgroundGradient: {
          from: '#0F4C75',
          to: '#3282B8',
          orientation: 'BR_TL',
        },
      }}
    >
      {/* Şehir Adı */}
      <TextWidget
        allowFontScaling={false}
        text={title}
        style={{
          color: '#FFFFFF',
          fontSize: 14,
          fontWeight: 'bold',
          marginBottom: 2,
          textAlign: 'center',
        }}
        maxLines={1}
        truncate="END"
      />

      {/* Namaz Vakitleri Satırı */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <PrayerTimeColumn name="İmsak" time={prayerTimes?.fajr} />
        <PrayerTimeColumn name="Güneş" time={prayerTimes?.sunrise} />
        <PrayerTimeColumn name="Öğle" time={prayerTimes?.dhuhr} />
        <PrayerTimeColumn name="İkindi" time={prayerTimes?.asr} />
        <PrayerTimeColumn name="Akşam" time={prayerTimes?.maghrib} />
        <PrayerTimeColumn name="Yatsı" time={prayerTimes?.isha} />
      </FlexWidget>
    </FlexWidget>
  );
}
