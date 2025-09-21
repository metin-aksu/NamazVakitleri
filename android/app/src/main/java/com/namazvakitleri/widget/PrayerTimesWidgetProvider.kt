package com.namazvakitleri.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.namazvakitleri.R
import com.namazvakitleri.MainActivity
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

class PrayerTimesWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        super.onEnabled(context)
    }

    override fun onDisabled(context: Context) {
        super.onDisabled(context)
    }

    companion object {
        fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val views = RemoteViews(context.packageName, R.layout.prayer_times_widget)
            
            // Namaz vakitlerini al ve güncelle
            val prayerTimes = getStoredPrayerTimes(context)
            val cityName = getStoredCityName(context)
            
            // Şehir ismini güncelle
            views.setTextViewText(R.id.widget_city_name, cityName)
            
            if (prayerTimes != null) {
                views.setTextViewText(R.id.widget_fajr, formatTime(prayerTimes.getString("fajr")))
                views.setTextViewText(R.id.widget_sunrise, formatTime(prayerTimes.getString("sunrise")))
                views.setTextViewText(R.id.widget_dhuhr, formatTime(prayerTimes.getString("dhuhr")))
                views.setTextViewText(R.id.widget_asr, formatTime(prayerTimes.getString("asr")))
                views.setTextViewText(R.id.widget_maghrib, formatTime(prayerTimes.getString("maghrib")))
                views.setTextViewText(R.id.widget_isha, formatTime(prayerTimes.getString("isha")))
            } else {
                // Veri yoksa placeholder göster
                views.setTextViewText(R.id.widget_city_name, "Şehir Seçilmedi")
                views.setTextViewText(R.id.widget_fajr, "--:--")
                views.setTextViewText(R.id.widget_sunrise, "--:--")
                views.setTextViewText(R.id.widget_dhuhr, "--:--")
                views.setTextViewText(R.id.widget_asr, "--:--")
                views.setTextViewText(R.id.widget_maghrib, "--:--")
                views.setTextViewText(R.id.widget_isha, "--:--")
            }
            
            // Widget'a tıklandığında uygulamayı aç
            val intent = Intent(context, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(
                context, 0, intent, 
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)
            
            // Widget'ı güncelle
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
        
        fun updateAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(
                ComponentName(context, PrayerTimesWidgetProvider::class.java)
            )
            
            for (appWidgetId in appWidgetIds) {
                updateAppWidget(context, appWidgetManager, appWidgetId)
            }
        }
        
        private fun getStoredCityName(context: Context): String {
            val sharedPrefs = context.getSharedPreferences("WidgetPrefs", Context.MODE_PRIVATE)
            return sharedPrefs.getString("cityName", "Şehir Seçilmedi") ?: "Şehir Seçilmedi"
        }
        
        private fun getStoredPrayerTimes(context: Context): JSONObject? {
            val sharedPrefs = context.getSharedPreferences("WidgetPrefs", Context.MODE_PRIVATE)
            val prayerTimesJson = sharedPrefs.getString("prayerTimes", null)
            return if (prayerTimesJson != null) {
                try {
                    JSONObject(prayerTimesJson)
                } catch (e: Exception) {
                    null
                }
            } else {
                null
            }
        }
        
        private fun formatTime(time: String?): String {
            return time?.substring(0, 5) ?: "--:--"
        }
        
        private fun getNextPrayer(prayerTimes: JSONObject): Pair<String, String> {
            val now = Calendar.getInstance()
            val currentTime = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE)
            
            val prayers = listOf(
                "İmsak" to prayerTimes.getString("fajr"),
                "Öğle" to prayerTimes.getString("dhuhr"),
                "İkindi" to prayerTimes.getString("asr"),
                "Akşam" to prayerTimes.getString("maghrib"),
                "Yatsı" to prayerTimes.getString("isha")
            )
            
            for (prayer in prayers) {
                val timeParts = prayer.second.split(":")
                val prayerMinutes = timeParts[0].toInt() * 60 + timeParts[1].toInt()
                
                if (prayerMinutes > currentTime) {
                    return prayer
                }
            }
            
            // Eğer günün son namazı geçtiyse, ertesi gün İmsak
            return "İmsak" to prayerTimes.getString("fajr")
        }
    }
}