//
//  PrayerTimesWidget.swift
//  PrayerTimesWidget
//
//  Created by Metin AKSU on 1.01.2026.
//

import WidgetKit
import SwiftUI

struct PrayerTimesEntry: TimelineEntry {
    let date: Date
    let prayerTimes: PrayerTimesData
}

struct PrayerTimesData {
    let imsak: String
    let gunes: String
    let ogle: String
    let ikindi: String
    let aksam: String
    let yatsi: String
    let cityName: String
    let dateStr: String
    
    static let placeholder = PrayerTimesData(
        imsak: "05:30",
        gunes: "07:00",
        ogle: "13:15",
        ikindi: "16:30",
        aksam: "19:45",
        yatsi: "21:15",
        cityName: "İstanbul",
        dateStr: "1 Ocak 2026"
    )
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> PrayerTimesEntry {
        PrayerTimesEntry(date: Date(), prayerTimes: PrayerTimesData.placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (PrayerTimesEntry) -> ()) {
        let entry = PrayerTimesEntry(date: Date(), prayerTimes: PrayerTimesData.placeholder)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        // Load prayer times from UserDefaults shared with main app
        let prayerTimes = loadPrayerTimesFromUserDefaults()
        let entry = PrayerTimesEntry(date: Date(), prayerTimes: prayerTimes)
        
        // Update timeline every hour
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    private func loadPrayerTimesFromUserDefaults() -> PrayerTimesData {
        guard let userDefaults = UserDefaults(suiteName: "group.com.metinaksu.namazvakitleri") else {
            print("❌ Widget: Failed to create UserDefaults with App Group")
            return PrayerTimesData(
                imsak: "05:30",
                gunes: "07:00",
                ogle: "13:15",
                ikindi: "16:30",
                aksam: "19:45",
                yatsi: "21:15",
                cityName: "App Group Hatası",
                dateStr: ""
            )
        }
        
        // Debug: Print all keys in UserDefaults
        let allKeys = userDefaults.dictionaryRepresentation().keys
        print("🕌 Widget: UserDefaults keys: \(allKeys)")
        
        let cityName = userDefaults.string(forKey: "cityName")
        print("🕌 Widget: cityName from UserDefaults: \(cityName ?? "nil")")
        
        return PrayerTimesData(
            imsak: userDefaults.string(forKey: "imsak") ?? "05:30",
            gunes: userDefaults.string(forKey: "sunrise") ?? "07:00",
            ogle: userDefaults.string(forKey: "dhuhr") ?? "13:15",
            ikindi: userDefaults.string(forKey: "asr") ?? "16:30",
            aksam: userDefaults.string(forKey: "maghrib") ?? "19:45",
            yatsi: userDefaults.string(forKey: "isha") ?? "21:15",
            cityName: cityName ?? "Şehir Seçilmedi",
            dateStr: userDefaults.string(forKey: "date") ?? ""
        )
    }
}

struct PrayerTimesWidgetEntryView: View {
    var entry: Provider.Entry

    var body: some View {
        VStack(spacing: 8) {
            // City and Date
            Text("\(entry.prayerTimes.cityName) - \(entry.prayerTimes.dateStr)")
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(.white)
                .multilineTextAlignment(.center)
                .padding(.top, 4)
            
            HStack(spacing: 4) {
                PrayerTimeColumn(name: "İmsak", time: entry.prayerTimes.imsak)
                PrayerTimeColumn(name: "Güneş", time: entry.prayerTimes.gunes)
                PrayerTimeColumn(name: "Öğle", time: entry.prayerTimes.ogle)
                PrayerTimeColumn(name: "İkindi", time: entry.prayerTimes.ikindi)
                PrayerTimeColumn(name: "Akşam", time: entry.prayerTimes.aksam)
                PrayerTimeColumn(name: "Yatsı", time: entry.prayerTimes.yatsi)
            }
            .frame(maxWidth: .infinity)
        }
        .padding()
        .background(Color(red: 0x0F/255.0, green: 0x4C/255.0, blue: 0x75/255.0))
    }
}

struct PrayerTimeColumn: View {
    let name: String
    let time: String
    
    var body: some View {
        VStack(spacing: 2) {
            Text(name)
                .font(.system(size: 9, weight: .semibold))
                .foregroundColor(Color(red: 0xBB/255.0, green: 0xE1/255.0, blue: 0xFA/255.0))
            Text(time)
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(.white)
        }
        .frame(maxWidth: .infinity)
    }
}

struct PrayerTimesWidget: Widget {
    let kind: String = "PrayerTimesWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                PrayerTimesWidgetEntryView(entry: entry)
                    .containerBackground(Color(red: 0x0F/255.0, green: 0x4C/255.0, blue: 0x75/255.0), for: .widget)
            } else {
                PrayerTimesWidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName("Namaz Vakitleri")
        .description("Günlük namaz vakitlerini gösterir")
        .supportedFamilies([.systemMedium, .systemSmall])
    }
}

#if swift(>=5.9)
@available(iOS 17.0, *)
#Preview(as: .systemMedium) {
    PrayerTimesWidget()
} timeline: {
    PrayerTimesEntry(date: .now, prayerTimes: PrayerTimesData.placeholder)
}
#endif
