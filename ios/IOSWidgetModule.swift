import Foundation
import React
import WidgetKit
import os.log

@objc(IOSWidgetModule)
class IOSWidgetModule: NSObject {
    
    private let logger = Logger(subsystem: "com.metinaksu.namazvakitleri", category: "WidgetModule")
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc
    func updateWidgetData(_ data: [String: Any]) {
        logger.info("🕌 IOSWidgetModule.updateWidgetData called")
        NSLog("🕌 IOSWidgetModule.updateWidgetData called with data: %@", "\(data)")
        
        guard let userDefaults = UserDefaults(suiteName: "group.com.metinaksu.namazvakitleri") else {
            logger.error("❌ Failed to create UserDefaults with App Group")
            NSLog("❌ Failed to create UserDefaults with App Group")
            return
        }
        
        logger.info("✅ UserDefaults created successfully")
        NSLog("✅ UserDefaults created successfully")
        
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
        
        if let date = data["date"] as? String {
            userDefaults.set(date, forKey: "date")
        }
        
        userDefaults.synchronize()
        
        logger.info("✅ Widget data saved to UserDefaults")
        NSLog("✅ Widget data saved to UserDefaults")
        
        // Trigger widget update
        DispatchQueue.main.async {
            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadAllTimelines()
                self.logger.info("✅ Widget timeline reloaded")
                NSLog("✅ Widget timeline reloaded")
            }
        }
    }
}