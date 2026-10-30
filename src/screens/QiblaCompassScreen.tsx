import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Accelerometer, Magnetometer } from 'expo-sensors';
import * as Location from 'expo-location';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import StorageService from '../services/StorageService';
import QiblaService from '../services/QiblaService';
import GeomagneticDeclination from '../services/GeomagneticDeclination';
import { City } from '../types';

const { width } = Dimensions.get('window');
const COMPASS_SIZE = width * 0.8;

// Pusula verisi yumuşatma
const LPF = 0.5; // Low Pass Filter coefficient (0.1 - 0.9)

// expo-sensors ivmeyi g cinsinden verir, su terazisi eşikleri m/s² üzerine ayarlı
const GRAVITY = 9.81;

const QiblaCompassScreen = () => {
  const router = useRouter();
  const [qiblaAngle, setQiblaAngle] = useState(0);
  // Kadranın dönüş açısı; 359° → 1° geçişinde tam tur atmasın diye 0-360'a sıkıştırılmaz
  const [dialRotation, setDialRotation] = useState(0);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  // Kıble açısı GPS konumundan mı, seçili ilçeden mi hesaplandı
  const [isUsingGps, setIsUsingGps] = useState(false);
  const [isCalibrationLow, setIsCalibrationLow] = useState(false);
  // Pusula dinleyicileri mount anında kurulduğu için güncel değerleri ref'ten okur
  const declinationRef = useRef(0);
  const lastRotationRef = useRef<number | null>(null);
  // Su terazisi için
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Animation values
  const rotateValue = useSharedValue(0);
  const qiblaIndicatorValue = useSharedValue(0);

  useEffect(() => {
    let isActive = true;
    let compassSub: { remove: () => void } | null = null;

    const startCompass = async () => {
      await loadSettings();

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!isActive) return;

      if (status !== 'granted') {
        // İzin verilmezse ilçe koordinatı ve ham manyetometre ile devam et
        compassSub = setupMagnetometerCompass();
        return;
      }

      const headingSub = await setupSystemCompass();
      if (!isActive) {
        headingSub?.remove();
        return;
      }
      compassSub = headingSub;
      updateQiblaFromCurrentPosition();
    };

    startCompass();

    // Accelerometer (su terazisi) başlat
    Accelerometer.setUpdateInterval(100);
    const accelSub = Accelerometer.addListener(({ x, y }) => {
      setTilt({ x: x * GRAVITY, y: y * GRAVITY });
    });

    return () => {
      isActive = false;
      compassSub?.remove();
      accelSub.remove();
    };
  }, []);

  useEffect(() => {
    // Smooth rotation animation
    rotateValue.value = withSpring(dialRotation, {
      damping: 20,
      stiffness: 90,
    });
  }, [dialRotation, rotateValue]);

  useEffect(() => {
    qiblaIndicatorValue.value = withTiming(qiblaAngle, {
      duration: 1000,
      easing: Easing.out(Easing.exp),
    });
  }, [qiblaAngle]);

  const loadSettings = async () => {
    const settings = await StorageService.getUserSettings();
    if (settings && settings.selectedCity) {
      setSelectedCity(settings.selectedCity);
      applyLocation(settings.selectedCity.latitude, settings.selectedCity.longitude);
    } else {
      Alert.alert(
        'Hata',
        'Konum bilgisi bulunamadı. Lütfen önce şehir seçiniz.',
        [{ text: 'Tamam', onPress: () => router.back() }],
      );
    }
  };

  const applyLocation = (latitude: number, longitude: number) => {
    setQiblaAngle(QiblaService.calculateQiblaAngle(latitude, longitude));
    // Manyetik sapmayı hesapla (yalnızca ham manyetometre yönteminde kullanılır)
    declinationRef.current = GeomagneticDeclination.getDeclination(latitude, longitude);
  };

  // Seyahatteyken de doğru açı için kıbleyi GPS konumundan hesapla
  const updateQiblaFromCurrentPosition = async () => {
    try {
      const position =
        (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 })) ??
        (await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }));
      applyLocation(position.coords.latitude, position.coords.longitude);
      setIsUsingGps(true);
    } catch (err) {
      // Konum alınamazsa seçili ilçenin koordinatı kullanılmaya devam eder
      console.log('Konum alınamadı:', err);
    }
  };

  const updateDialRotation = (target: number) => {
    const last = lastRotationRef.current;
    if (last === null) {
      lastRotationRef.current = target;
      setDialRotation(target);
      return;
    }

    // Low Pass Filter for smoothing, en kısa yönden (-180..180)
    const diff = ((((target - last) % 360) + 540) % 360) - 180;
    const next = last + LPF * diff;

    lastRotationRef.current = next;
    setDialRotation(next);
  };

  // İşletim sisteminin pusulası: sensör füzyonu, eğim telafisi ve coğrafi kuzey
  const setupSystemCompass = async () => {
    try {
      return await Location.watchHeadingAsync(({ trueHeading, magHeading, accuracy }) => {
        const heading =
          trueHeading >= 0 ? trueHeading : magHeading + declinationRef.current;
        // Kadran ters yönde döner ki "N" işareti hep kuzeyi göstersin
        updateDialRotation(-heading);
        setIsCalibrationLow(accuracy <= 1);
      });
    } catch (err) {
      console.log('Sistem pusulası başlatılamadı:', err);
      return setupMagnetometerCompass();
    }
  };

  const setupMagnetometerCompass = () => {
    try {
      Magnetometer.isAvailableAsync().then(available => {
        if (!available) {
          console.log('Magnetometer not available');
          if (Platform.OS === 'ios' && __DEV__) {
            console.warn('Sensors not available on Simulator');
          }
        }
      });

      Magnetometer.setUpdateInterval(100); // 100ms update rate

      return Magnetometer.addListener(({ x, y }) => {
        // Calculate heading
        let magHeading = Math.atan2(y, x) * (180 / Math.PI);

        // Normalize to 0-360
        if (magHeading < 0) {
          magHeading += 360;
        }

        // Manyetik sapmayı uygula (true north düzeltmesi)
        let trueHeading = magHeading + declinationRef.current;
        if (trueHeading < 0) trueHeading += 360;
        if (trueHeading >= 360) trueHeading -= 360;

        updateDialRotation(trueHeading);
      });
    } catch (err) {
      console.log('Compass setup error:', err);
      return null;
    }
  };

  const compassStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotateValue.value}deg` }],
    };
  });

  const qiblaPointerStyle = useAnimatedStyle(() => {
    // Kıble işareti pusula ile birlikte döner, pusula üzerinde qiblaAngle derecesinde sabit kalır
    return {
      transform: [{ rotate: `${qiblaIndicatorValue.value}deg` }],
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>{'< Geri'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kıble Pusulası</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.cityName}>
          {isUsingGps ? 'Bulunduğunuz Konum' : selectedCity?.name}
        </Text>
        <Text style={styles.angleText}>
          Kıble Açısı: {Math.round(qiblaAngle)}°
        </Text>
        {isCalibrationLow && (
          <Text style={styles.calibrationText}>
            Pusula hassasiyeti düşük. Telefonunuzu havada 8 çizerek kalibre edin.
          </Text>
        )}
      </View>

      <View style={styles.compassContainer}>
        {/* Compass Dial */}
        <Animated.View style={[styles.compassDial, compassStyle]}>
          {/* Bubble Level (Su Terazisi) */}
          <View style={styles.bubbleLevelContainer} pointerEvents="none">
            {(() => {
              // x ve y değerlerini normalize et (max 1, min -1)
              const maxTilt = 7; // yaklaşık ±7 m/s² (daha fazla ise limit)
              const normX = Math.max(-1, Math.min(1, tilt.x / maxTilt));
              const normY = Math.max(-1, Math.min(1, tilt.y / maxTilt));
              // Bubble'ı ortada tutmak için çapı ve offset
              const radius = COMPASS_SIZE * 0.18;
              const offsetX = normY * radius; // y ekseni sağ-sol
              const offsetY = -normX * radius; // x ekseni yukarı-aşağı (telefon düz tutulunca x=0)
              const isFlat = Math.abs(tilt.x) < 1 && Math.abs(tilt.y) < 1;
              const bubbleSize = 30;
              return (
                <View style={styles.bubbleLevelOverlay}>
                  {/* Hedef çemberi */}
                  <View
                    style={{
                      position: 'absolute',
                      left: COMPASS_SIZE / 2 - bubbleSize / 2,
                      top: COMPASS_SIZE / 2 - bubbleSize / 2,
                      width: bubbleSize,
                      height: bubbleSize,
                      borderRadius: bubbleSize / 2,
                      borderWidth: 2,
                      borderColor: '#4CAF50',
                      backgroundColor: 'transparent',
                      zIndex: 10,
                    }}
                  />
                  {/* Baloncuk */}
                  <View
                    style={{
                      position: 'absolute',
                      left: COMPASS_SIZE / 2 + offsetX - bubbleSize / 2,
                      top: COMPASS_SIZE / 2 + offsetY - bubbleSize / 2,
                      width: bubbleSize,
                      height: bubbleSize,
                      borderRadius: bubbleSize / 2,
                      backgroundColor: isFlat
                        ? '#4CAF50'
                        : 'rgba(255,255,255,0.7)',
                      borderWidth: 2,
                      borderColor: '#888',
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 20,
                    }}
                  >
                    <Text
                      style={{
                        color: isFlat ? '#fff' : '#333',
                        fontWeight: 'bold',
                        fontSize: 12,
                      }}
                    >
                      {isFlat ? '' : ''}
                    </Text>
                  </View>
                </View>
              );
            })()}
          </View>
          {/* ...existing code... */}
          <View style={styles.northMarker}>
            <Text style={styles.directionText}>N</Text>
          </View>
          <View style={styles.eastMarker}>
            <Text style={styles.directionTextSmall}>E</Text>
          </View>
          <View style={styles.southMarker}>
            <Text style={styles.directionTextSmall}>S</Text>
          </View>
          <View style={styles.westMarker}>
            <Text style={styles.directionTextSmall}>W</Text>
          </View>
          <Animated.View
            style={[styles.qiblaIndicatorContainer, qiblaPointerStyle]}
          >
            <View style={styles.qiblaPointer} />
            <Image
              source={require('../assets/kaaba_icon.png')}
              style={styles.kaabaIcon}
            />
          </Animated.View>
        </Animated.View>
        <View style={styles.fixedPointer} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Telefonunuzu yere paralel tutun ve metal eşyalardan uzak durun.
          Telefonuzun pusulasının düzgün çalıştığından emin olun. Gerekirse
          fiziksel pusula ile doğrulayın.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F4C75', // Matching HomeScreen blue (Restored)
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 20,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: '#BBE1FA', // Blue theme accent
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: Platform.OS === 'android' ? 40 : 40,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  cityName: {
    color: '#BBE1FA',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  angleText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.8,
  },
  calibrationText: {
    color: '#FFD700',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  alignedText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  compassContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  compassDial: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    borderWidth: 4,
    borderColor: '#3282B8',
    backgroundColor: '#1e2d34ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  bubbleLevelContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    pointerEvents: 'none',
  },
  bubbleLevelOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  northMarker: {
    position: 'absolute',
    top: 10,
    alignItems: 'center',
  },
  eastMarker: {
    position: 'absolute',
    right: 15,
    alignItems: 'center',
  },
  southMarker: {
    position: 'absolute',
    bottom: 15,
    alignItems: 'center',
  },
  westMarker: {
    position: 'absolute',
    left: 15,
    alignItems: 'center',
  },
  directionText: {
    color: '#e94560',
    fontSize: 24,
    fontWeight: 'bold',
  },
  directionTextSmall: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    opacity: 0.5,
  },
  fixedPointer: {
    position: 'absolute',
    // Removed duplicate position/top
    // We want a fixed line? No, usually compass rotates so "North" matches North.
    // And we want to align the "Qibla pointer" to the "Phone Top".
    // Wait, standard compass app:
    // Top of phone is the direction you are facing.
    // Compass dial rotates so 'N' points to North.
    // So if I face East, 'N' should be at 9 o'clock (Left).
    // My code: rotateValue = -heading.
    // If heading is 90 (East), rotate is -90.
    // 12 o'clock (Top) rotates -90 to 9 o'clock (Left). CORRECT.

    // So if I want to align Qibla:
    // Qibla is at `qiblaAngle` degrees.
    // If Qibla is 150 (SE).
    // I need to turn until 150 aligns with TOP of phone.
    // The `qiblaIndicatorContainer` is a child of the dial.
    // It is rotated by `qiblaAngle`.
    // So it is fixed at 150 deg on the dial.
    // When 150 deg on the dial is at 12 o'clock, we are facing Qibla.
    // CORRECT.

    // I am adding a fixed red line at the top of the container to show "Current Heading".
    width: 4,
    height: 30,
    backgroundColor: '#fff',
    top: -20, // Outside the dial?
    zIndex: 10,
  },
  qiblaIndicatorContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    // justifyContent: 'flex-start', // Top is 0 degrees
  },
  qiblaPointer: {
    width: 6,
    height: 20,
    backgroundColor: '#FFD700', // Gold
    marginTop: 40, // Offset from edge
  },
  kaabaIcon: {
    width: 30,
    height: 30,
    marginTop: 5,
  },
  // tintColor removed to show original colors
  footer: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    fontSize: 12,
  },
});

export default QiblaCompassScreen;
