
// Kabe'nin koordinatları
const KAABA_LATITUDE = 21.4225;
const KAABA_LONGITUDE = 39.8262;

export const calculateQiblaAngle = (latitude: number, longitude: number): number => {
  const PI = Math.PI;
  const latk = (KAABA_LATITUDE * PI) / 180.0;
  const longk = (KAABA_LONGITUDE * PI) / 180.0;
  const phi = (latitude * PI) / 180.0;
  const lambda = (longitude * PI) / 180.0;

  const y = Math.sin(longk - lambda);
  const x =
    Math.cos(phi) * Math.tan(latk) -
    Math.sin(phi) * Math.cos(longk - lambda);

  let qiblaAngle = Math.atan2(y, x);
  qiblaAngle = (qiblaAngle * 180.0) / PI;

  // Açı 0-360 arasına normalizasyon
  qiblaAngle = (qiblaAngle + 360) % 360;

  return qiblaAngle;
};

export default {
  calculateQiblaAngle,
};
