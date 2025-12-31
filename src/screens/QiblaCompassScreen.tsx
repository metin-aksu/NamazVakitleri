import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { accelerometer, magnetometer, SensorTypes, setUpdateIntervalForType } from 'react-native-sensors';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Subscription } from 'rxjs';
import StorageService from '../services/StorageService';
import QiblaService from '../services/QiblaService';
import { City } from '../types';

const { width } = Dimensions.get('window');
const COMPASS_SIZE = width * 0.8;

// Magnetometer data smoothing
const LPF = 0.5; // Low Pass Filter coefficient (0.1 - 0.9)

const QiblaCompassScreen = ({ navigation }: { navigation: any }) => {
  const [qiblaAngle, setQiblaAngle] = useState(0);
  const [heading, setHeading] = useState(0);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isCalibrated, setIsCalibrated] = useState(false);

  // Animation values
  const rotateValue = useSharedValue(0);
  const qiblaIndicatorValue = useSharedValue(0);

  useEffect(() => {
    loadSettings();
    setupCompass();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    // Smooth rotation animation
    rotateValue.value = withSpring(-heading, {
      damping: 20,
      stiffness: 90,
    });
  }, [heading]);

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
      const angle = QiblaService.calculateQiblaAngle(
        settings.selectedCity.latitude,
        settings.selectedCity.longitude
      );
      setQiblaAngle(angle);
    } else {
      Alert.alert('Hata', 'Konum bilgisi bulunamadı. Lütfen önce şehir seçiniz.', [
        { text: 'Tamam', onPress: () => navigation.goBack() }
      ]);
    }
  };

  const setupCompass = () => {
    setUpdateIntervalForType(SensorTypes.magnetometer, 100); // 100ms update rate

    let lastHeading = 0;

    const sub = magnetometer.subscribe(({ x, y, z }) => {
      // Calculate heading
      let magHeading = Math.atan2(y, x) * (180 / Math.PI);

      // Normalize to 0-360
      if (magHeading < 0) {
        magHeading += 360;
      }

      // Adjust for true north (magnetic declination) - Simplified for now, assuming roughly aligned
      // For more precision, we'd need Geolocation to get declination.
      // But purely magnetic north is usually fine for basic compasses.

      // Low Pass Filter for smoothing
      // newHeading = lastHeading + LPF * (currentHeading - lastHeading)
      // We need to handle the 360-0 transition carefully

      let diff = magHeading - lastHeading;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;

      const smoothedHeading = lastHeading + LPF * diff;

      // Normalize again
      let finalHeading = (smoothedHeading + 360) % 360;

      lastHeading = finalHeading;
      setHeading(finalHeading);
    });

    setSubscription(sub);
  };

  const compassStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotateValue.value}deg` }],
    };
  });

  const qiblaPointerStyle = useAnimatedStyle(() => {
    // The qibla pointer logic:
    // If the compass image rotates to show North at top, 
    // the Qibla pointer should point to the Qibla angle relative to North.
    // So if Qibla is 150 deg, and Compass is rotated by -Heading.
    // We just need to place the indicator at 150 deg on the dial?
    // Yes, if the dial rotates, the children of the dial rotate with it.
    // So we just place the marker at `qiblaAngle` degrees relative to the dial's 12 o'clock.
    return {
      transform: [{ rotate: `${qiblaIndicatorValue.value}deg` }]
    };
  });


  // Calculate difference to show alignment feedback
  const getDeviation = () => {
    let diff = Math.abs(heading - qiblaAngle);
    if (diff > 180) diff = 360 - diff;
    return diff;
  };

  const isAligned = getDeviation() < 5; // 5 degrees tolerance

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'< Geri'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kıble Pusulası</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.cityName}>{selectedCity?.name}</Text>
        <Text style={styles.angleText}>Kıble Açısı: {Math.round(qiblaAngle)}°</Text>
        {isAligned && <Text style={styles.alignedText}>Kıble Yönündesiniz!</Text>}
      </View>

      <View style={styles.compassContainer}>
        {/* Compass Dial */}
        <Animated.View style={[styles.compassDial, compassStyle]}>
          {/* North Indicator */}
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

          {/* Qibla Indicator on the Dial */}
          <Animated.View style={[styles.qiblaIndicatorContainer, qiblaPointerStyle]}>
            <View style={styles.qiblaPointer} />
            <Image
              source={require('../assets/kaaba_icon.png')} // We need an icon ideally, but I'll use a View for now if missing
              style={styles.kaabaIcon}
            />
          </Animated.View>
        </Animated.View>

        {/* Fixed Arrow pointing Up (Phone Header) */}
        <View style={styles.fixedPointer} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Telefonunuzu yere paralel tutun ve metal eşyalardan uzak durun.
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 50 : 60,
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
    marginLeft: 70,
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
    borderColor: '#3282B8', // Blue theme border
    backgroundColor: '#1e2d34ff', // User's preferred dial color
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
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
    marginBottom: 90,
  },
  footerText: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    fontSize: 12,
  },
});

export default QiblaCompassScreen;
