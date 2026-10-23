import { useEffect, useRef } from "react";
import { AppState } from "react-native";

/** The small part of expo-sensors that we use. */
type Subscription = { remove: () => void };
type AccelerometerModule = {
  isAvailableAsync: () => Promise<boolean>;
  setUpdateInterval: (ms: number) => void;
  addListener: (cb: (d: { x: number; y: number; z: number }) => void) => Subscription;
};

/**
 * Loaded lazily and guarded: if this build does not contain the sensor module yet
 * (for example an old app binary), shake is simply off instead of crashing the app.
 */
function loadAccelerometer(): AccelerometerModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require("expo-sensors") as { Accelerometer: AccelerometerModule }).Accelerometer;
  } catch {
    if (__DEV__) console.warn("[shake] expo-sensors is not in this build. Rebuild the dev client.");
    return null;
  }
}

// Tuning. Gravity alone reads about 1 g. We look at how far a reading is from 1 g in EITHER
// direction, because a real shake pushes the reading above and below 1 g.
const THRESHOLD_G = 0.8; // how far from 1 g a reading must be to count as a jolt
const MIN_GAP_MS = 100; // two readings closer than this count as the same jolt
const WINDOW_MS = 1200; // the jolts must happen within this time
const JOLTS_NEEDED = 3; // a single bump or a dropped phone is not a shake
const COOLDOWN_MS = 2500; // after a shake, ignore new ones for a bit
const UPDATE_MS = 50;

/** Calls `onShake` when the phone is shaken. Only listens while `enabled` and the app is open. */
export function useShake(enabled: boolean, onShake: () => void) {
  const handler = useRef(onShake);
  useEffect(() => {
    handler.current = onShake;
  });

  useEffect(() => {
    if (!enabled) return;
    const accel = loadAccelerometer();
    if (!accel) return;

    let sub: Subscription | null = null;
    let cancelled = false;
    let jolts = 0;
    let lastJoltAt = 0;
    let lastFiredAt = 0;

    const start = async () => {
      if (sub || cancelled) return;
      try {
        if (!(await accel.isAvailableAsync())) {
          if (__DEV__) console.warn("[shake] no accelerometer on this device");
          return;
        }
      } catch {
        return;
      }
      if (sub || cancelled) return;
      try {
        accel.setUpdateInterval(UPDATE_MS);
        sub = accel.addListener(({ x, y, z }) => {
          const g = Math.sqrt(x * x + y * y + z * z);
          if (Math.abs(g - 1) < THRESHOLD_G) return;

          const now = Date.now();
          if (now - lastFiredAt < COOLDOWN_MS) return;
          if (now - lastJoltAt > WINDOW_MS) jolts = 0;
          if (jolts > 0 && now - lastJoltAt < MIN_GAP_MS) return;

          jolts += 1;
          lastJoltAt = now;
          if (__DEV__) console.log(`[shake] jolt ${jolts}/${JOLTS_NEEDED} (${g.toFixed(2)} g)`);
          if (jolts >= JOLTS_NEEDED) {
            jolts = 0;
            lastFiredAt = now;
            if (__DEV__) console.log("[shake] fired");
            handler.current();
          }
        });
        if (__DEV__) console.log("[shake] listening");
      } catch {
        sub = null;
      }
    };

    const stop = () => {
      sub?.remove();
      sub = null;
      jolts = 0;
    };

    if (AppState.currentState === "active") void start();
    const appSub = AppState.addEventListener("change", (s) => {
      if (s === "active") void start();
      else stop();
    });

    return () => {
      cancelled = true;
      appSub.remove();
      stop();
    };
  }, [enabled]);
}
