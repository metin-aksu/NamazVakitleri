import Foundation
import React
import WidgetKit

@objc(IOSWidgetModule)
class IOSWidgetModule: NSObject {
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc
    func updateWidgetData(_ data: [String: Any]) {
        let userDefaults = UserDefaults(suiteName: "group.com.namazvakitleri.widget") ?? UserDefaults.standard
        
        // Store prayer times data
        if let timings = data["timings"] as? [String: String] {
            userDefaults.set(timings["Imsak"], forKey: "imsak")
            userDefaults.set(timings["Sunrise"], forKey: "sunrise")
            userDefaults.set(timings["Dhuhr"], forKey: "dhuhr")
            userDefaults.set(timings["Asr"], forKey: "asr")
            userDefaults.set(timings["Maghrib"], forKey: "maghrib")
            userDefaults.set(timings["Isha"], forKey: "isha")
        }
        
        if let cityName = data["cityName"] as? String {
            userDefaults.set(cityName, forKey: "cityName")
        }
        
        userDefaults.synchronize()
        
        // Trigger widget update
        DispatchQueue.main.async {
            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadAllTimelines()
            }
        }
    }
}