import { calculateQiblaAngle } from '../src/services/QiblaService';

test('İstanbul için kıble açısı yaklaşık 151°', () => {
  expect(calculateQiblaAngle(41.0082, 28.9784)).toBeCloseTo(151.6, 0);
});

test('açı 0-360 aralığında', () => {
  const angle = calculateQiblaAngle(-33.87, 151.21); // Sidney
  expect(angle).toBeGreaterThanOrEqual(0);
  expect(angle).toBeLessThan(360);
});
