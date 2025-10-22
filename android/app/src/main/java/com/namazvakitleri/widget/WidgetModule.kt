package com.namazvakitleri.widget

import android.content.Context
import android.util.Log
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
    fun updateWidget(prayerTimes: ReadableMap, cityName: String, date: String) {
        Log.d("WidgetModule", "updateWidget called with cityName: $cityName, date: $date")
        
        val context = reactApplicationContext
        val sharedPrefs = context.getSharedPreferences("WidgetPrefs", Context.MODE_PRIVATE)
        
        // Verileri kaydet
        sharedPrefs.edit().apply {
            putString("cityName", cityName)
            putString("date", date)
            putString("prayerTimes", JSONObject(prayerTimes.toHashMap()).toString())
            apply()
        }
        
        Log.d("WidgetModule", "Data saved to SharedPreferences")
        
        // Widget'ları güncelle
        PrayerTimesWidgetProvider.updateAllWidgets(context)
        
        Log.d("WidgetModule", "Widgets updated")
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