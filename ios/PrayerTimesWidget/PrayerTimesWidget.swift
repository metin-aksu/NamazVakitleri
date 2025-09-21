import WidgetKit
import SwiftUI
import Intents

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
    
    static let placeholder = PrayerTimesData(
        imsak: "05:30",
        gunes: "07:00",
        ogle: "13:15",
        ikindi: "16:30",
        aksam: "19:45",
        yatsi: "21:15",
        cityName: "İstanbul"
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
        let userDefaults = UserDefaults(suiteName: "group.com.namazvakitleri.widget") ?? UserDefaults.standard
        
        return PrayerTimesData(
            imsak: userDefaults.string(forKey: "imsak") ?? "05:30",
            gunes: userDefaults.string(forKey: "sunrise") ?? "07:00",
            ogle: userDefaults.string(forKey: "dhuhr") ?? "13:15",
            ikindi: userDefaults.string(forKey: "asr") ?? "16:30",
            aksam: userDefaults.string(forKey: "maghrib") ?? "19:45",
            yatsi: userDefaults.string(forKey: "isha") ?? "21:15",
            cityName: userDefaults.string(forKey: "cityName") ?? "İstanbul"
        )
    }
}

struct PrayerTimesWidgetEntryView: View {
    var entry: Provider.Entry

    var body: some View {
        HStack(spacing: 2) {
            // İmsak
            VStack(spacing: 1) {
                Text("İmsak")
                    .font(.system(size: 8, weight: .bold))
                    .foregroundColor(.white.opacity(0.8))
                Text(entry.prayerTimes.imsak)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.white)
            }
            .frame(maxWidth: .infinity)
            
            // Güneş
            VStack(spacing: 1) {
                Text("Güneş")
                    .font(.system(size: 8, weight: .bold))
                    .foregroundColor(.white.opacity(0.8))
                Text(entry.prayerTimes.gunes)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.white)
            }
            .frame(maxWidth: .infinity)
            
            // Öğle
            VStack(spacing: 1) {
                Text("Öğle")
                    .font(.system(size: 8, weight: .bold))
                    .foregroundColor(.white.opacity(0.8))
                Text(entry.prayerTimes.ogle)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.white)
            }
            .frame(maxWidth: .infinity)
            
            // İkindi
            VStack(spacing: 1) {
                Text("İkindi")
                    .font(.system(size: 8, weight: .bold))
                    .foregroundColor(.white.opacity(0.8))
                Text(entry.prayerTimes.ikindi)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.white)
            }
            .frame(maxWidth: .infinity)
            
            // Akşam
            VStack(spacing: 1) {
                Text("Akşam")
                    .font(.system(size: 8, weight: .bold))
                    .foregroundColor(.white.opacity(0.8))
                Text(entry.prayerTimes.aksam)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.white)
            }
            .frame(maxWidth: .infinity)
            
            // Yatsı
            VStack(spacing: 1) {
                Text("Yatsı")
                    .font(.system(size: 8, weight: .bold))
                    .foregroundColor(.white.opacity(0.8))
                Text(entry.prayerTimes.yatsi)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.white)
            }
            .frame(maxWidth: .infinity)
        }
        .padding(.horizontal, 4)
        .padding(.vertical, 2)
        .background(
            LinearGradient(
                gradient: Gradient(colors: [Color(red: 0.2, green: 0.4, blue: 0.8), Color(red: 0.1, green: 0.3, blue: 0.6)]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(8)
    }
}

struct PrayerTimesWidget: Widget {
    let kind: String = "PrayerTimesWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            PrayerTimesWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Namaz Vakitleri")
        .description("Günlük namaz vakitlerini gösterir")
        .supportedFamilies([.systemSmall])
    }
}

struct PrayerTimesWidget_Previews: PreviewProvider {
    static var previews: some View {
        PrayerTimesWidgetEntryView(entry: PrayerTimesEntry(date: Date(), prayerTimes: PrayerTimesData.placeholder))
            .previewContext(WidgetPreviewContext(family: .systemSmall))
    }
}