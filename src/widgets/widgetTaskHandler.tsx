import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { PrayerTimesWidget } from './PrayerTimesWidget';
import { getWidgetData } from './widgetStorage';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const data = await getWidgetData();
      props.renderWidget(<PrayerTimesWidget data={data} />);
      break;
    }
    default:
      // Tıklama "OPEN_APP" ile native tarafta açılıyor
      break;
  }
}
