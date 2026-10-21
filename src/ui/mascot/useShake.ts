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
    return null;
  }
}

// Tuning. Gravity alone reads about 1 g. A real shake easily goes past 2 g.
const THRESHOLD_G = 2.2; // how hard a jolt has to be
const MIN_GAP_MS = 140; // two readings closer than this count as the same jolt
const WINDOW_MS = 1000; // the jolts must happen within this time
const JOLTS_NEEDED = 3; // a single bump or a dropped phone is not a shake
const COOLDOWN_MS = 2500; // after a shake, ignore new ones for a bit
const UPDATE_MS = 60;

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
        if (!(await accel.isAvailableAsync())) return;
      } catch {
        return;
      }
      if (sub || cancelled) return;
      try {
        accel.setUpdateInterval(UPDATE_MS);
        sub = accel.addListener(({ x, y, z }) => {
          const g = Math.sqrt(x * x + y * y + z * z);
          if (g < THRESHOLD_G) return;

          const now = Date.now();
          if (now - lastFiredAt < COOLDOWN_MS) return;
          if (now - lastJoltAt > WINDOW_MS) jolts = 0;
          if (jolts > 0 && now - lastJoltAt < MIN_GAP_MS) return;

          jolts += 1;
          lastJoltAt = now;
          if (jolts >= JOLTS_NEEDED) {
            jolts = 0;
            lastFiredAt = now;
            handler.current();
          }
        });
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
