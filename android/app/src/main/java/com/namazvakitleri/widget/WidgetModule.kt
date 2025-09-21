package com.namazvakitleri.widget

import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import org.json.JSONObject

class WidgetModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "WidgetModule"
    }

    @ReactMethod
    fun updateWidget(prayerTimes: ReadableMap, cityName: String) {
        try {
            val context = reactApplicationContext
            
            // SharedPreferences'e veri kaydet
            val sharedPrefs = context.getSharedPreferences("WidgetPrefs", Context.MODE_PRIVATE)
            val editor = sharedPrefs.edit()
            
            // Şehir adını kaydet
            editor.putString("cityName", cityName)
            
            // Namaz vakitlerini JSON olarak kaydet
            val prayerTimesJson = JSONObject()
            prayerTimesJson.put("fajr", prayerTimes.getString("fajr"))
            prayerTimesJson.put("sunrise", prayerTimes.getString("sunrise"))
            prayerTimesJson.put("dhuhr", prayerTimes.getString("dhuhr"))
            prayerTimesJson.put("asr", prayerTimes.getString("asr"))
            prayerTimesJson.put("maghrib", prayerTimes.getString("maghrib"))
            prayerTimesJson.put("isha", prayerTimes.getString("isha"))
            
            editor.putString("prayerTimes", prayerTimesJson.toString())
            editor.apply()
            
            // Widget'ları güncelle
            PrayerTimesWidgetProvider.updateAllWidgets(context)
            
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @ReactMethod
    fun refreshWidget() {
        try {
            val context = reactApplicationContext
            PrayerTimesWidgetProvider.updateAllWidgets(context)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}