import { useEffect, useRef, useState } from "react";
import {
  Animated,
  AppState,
  BackHandler,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { haptics } from "@/core/feedback";
import { useSettings } from "@/core/storage/settings";
import { MASCOT_SIZE, MascotFigure } from "@/ui/home/mascot";
import { ThemePicker } from "@/ui/home/themePicker";
import { useTheme } from "@/ui/theme/useTheme";

import { pickMascotLine, type MascotLineKind } from "./mascotLines";
import {
  isMascotBlocked,
  onMascotPeekRequest,
  takePendingPeek,
  useMascotBlocked,
} from "./mascotStore";
import { useShake } from "./useShake";

type Edge = "top" | "bottom" | "left" | "right";
/** `along` = where the mascot sits on its edge: its left (top/bottom edge) or top (left/right edge). */
type Place = { edge: Edge; along: number };

const EDGES: Edge[] = ["top", "bottom", "left", "right"];
const SIZE = MASCOT_SIZE;
const SHOWN = 0.62; // how much of the mascot sticks into the screen
const VISIBLE_PX = SIZE * SHOWN;
const OUT_PX = VISIBLE_PX + 6; // slide distance that hides it completely
const GAP = 8; // space between the mascot and its speech bubble
const MARGIN = 16;

const FIRST_PEEK_MS: [number, number] = [1500, 2500]; // first visit after the app opens
const NEXT_PEEK_MS: [number, number] = [20000, 20000]; // later random visits

/** The drawing is upright. Turn it so its head always points into the screen. */
const ROTATE: Record<Edge, string> = {
  bottom: "0deg",
  top: "180deg",
  left: "90deg",
  right: "-90deg",
};

/** Where the mascot waits, fully out of sight, before it slides in. */
const HIDDEN_SHIFT: Record<Edge, { x: number; y: number }> = {
  bottom: { x: 0, y: OUT_PX },
  top: { x: 0, y: -OUT_PX },
  left: { x: -OUT_PX, y: 0 },
  right: { x: OUT_PX, y: 0 },
};

/** The direction that pushes the mascot back out of the screen. */
const OUTWARD: Record<Edge, { x: number; y: number }> = {
  bottom: { x: 0, y: 1 },
  top: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** A random edge (never the same twice in a row) and a spot on it. */
function pickPlace(previous: Edge | null, w: number, h: number): Place {
  const options = EDGES.filter((e) => e !== previous);
  const edge = options[Math.floor(Math.random() * options.length)];

  if (edge === "top") {
    // Stay near the middle: the clock and battery sit in the corners of the status bar.
    const spread = Math.min(w * 0.08, 24);
    return { edge, along: (w - SIZE) / 2 + rand(-spread, spread) };
  }
  if (edge === "bottom") {
    return { edge, along: rand(MARGIN, Math.max(MARGIN, w - SIZE - MARGIN)) };
  }
  // Left / right: keep away from the very top and bottom of the screen.
  const min = h * 0.18;
  return { edge, along: rand(min, Math.max(min, h * 0.82 - SIZE)) };
}

/** Where the mascot's square sits once it has slid in. */
function boxFor(p: Place, w: number, h: number): { left: number; top: number } {
  switch (p.edge) {
    case "bottom":
      return { left: p.along, top: h - VISIBLE_PX };
    case "top":
      return { left: p.along, top: -(SIZE - VISIBLE_PX) };
    case "left":
      return { left: -(SIZE - VISIBLE_PX), top: p.along };
    case "right":
      return { left: w - VISIBLE_PX, top: p.along };
  }
}

function tailStyle(dir: "up" | "down" | "left" | "right", color: string) {
  const T = "transparent";
  const base = { width: 0, height: 0 } as const;
  switch (dir) {
    case "down":
      return {
        ...base,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 10,
        borderLeftColor: T,
        borderRightColor: T,
        borderTopColor: color,
      };
    case "up":
      return {
        ...base,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 10,
        borderLeftColor: T,
        borderRightColor: T,
        borderBottomColor: color,
      };
    case "left":
      return {
        ...base,
        borderTopWidth: 8,
        borderBottomWidth: 8,
        borderRightWidth: 10,
        borderTopColor: T,
        borderBottomColor: T,
        borderRightColor: color,
      };
    case "right":
      return {
        ...base,
        borderTopWidth: 8,
        borderBottomWidth: 8,
        borderLeftWidth: 10,
        borderTopColor: T,
        borderBottomColor: T,
        borderLeftColor: color,
      };
  }
}

type BubbleProps = {
  place: Place;
  line: string;
  w: number;
  progress: Animated.Value;
  color: string;
};

/** The speech bubble. It always stays upright and sits on the screen side of the mascot. */
function SpeechBubble({ place, line, w, progress, color }: BubbleProps) {
  "use no memo";
  const opacity = progress.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0, 1],
    extrapolate: "clamp",
  });

  const bubble = (
    <View className="rounded-2xl bg-bar px-4 py-2">
      <Text className="text-center text-sm text-ink">{line}</Text>
    </View>
  );

  if (place.edge === "top" || place.edge === "bottom") {
    const mid = place.along + SIZE / 2;
    const bw = Math.min(240, w - MARGIN * 2);
    const left = Math.min(Math.max(mid - bw / 2, MARGIN), w - bw - MARGIN);
    const limit = Math.max(0, bw / 2 - 24);
    const shift = Math.max(-limit, Math.min(limit, mid - (left + bw / 2)));
    const tail = (
      <View
        style={[
          tailStyle(place.edge === "bottom" ? "down" : "up", color),
          { transform: [{ translateX: shift }] },
        ]}
      />
    );
    return (
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            left,
            width: bw,
            alignItems: "center",
            opacity,
          },
          place.edge === "bottom"
            ? { bottom: VISIBLE_PX + GAP }
            : { top: VISIBLE_PX + GAP },
        ]}
      >
        {place.edge === "top" ? tail : null}
        {bubble}
        {place.edge === "bottom" ? tail : null}
      </Animated.View>
    );
  }

  const bw = Math.max(120, Math.min(230, w - VISIBLE_PX - GAP - MARGIN));
  const onLeft = place.edge === "left";
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top: place.along,
          height: SIZE,
          width: bw,
          flexDirection: "row",
          alignItems: "center",
          opacity,
        },
        onLeft
          ? { left: VISIBLE_PX + GAP }
          : { right: VISIBLE_PX + GAP, justifyContent: "flex-end" },
      ]}
    >
      {onLeft ? <View style={tailStyle("left", color)} /> : null}
      <View style={{ flexShrink: 1 }}>{bubble}</View>
      {!onLeft ? <View style={tailStyle("right", color)} /> : null}
    </Animated.View>
  );
}

type Controller = {
  show: (kind: MascotLineKind, line?: string) => void;
  pause: () => void;
  resume: () => void;
  dismiss: () => void;
};
const NO_CONTROLLER: Controller = {
  show: () => {},
  pause: () => {},
  resume: () => {},
  dismiss: () => {},
};

/**
 * The mascot overlay. Mounted once above all screens (see appFlow.tsx).
 *  - Peeks in from a random edge: when the phone is shaken and on a timer.
 *  - Says a line in a speech bubble.
 *  - Push it back toward its edge (or flick it): it goes away.
 *  - Tap it: the theme menu floats in from the mascot's side. Tap outside it or the mascot to close.
 *  - Stays away while a game is in progress (see mascotStore.ts) or when switched off.
 */
export function MascotHost() {
  "use no memo";
  const { mascotEnabled } = useSettings();
  const blocked = useMascotBlocked();
  const bar = useTheme().colors.bar;
  const active = mascotEnabled && !blocked;

  const [size, setSize] = useState({ w: 0, h: 0 });
  const sizeRef = useRef(size);
  const [peek, setPeek] = useState<{ place: Place; line: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [menuFrom, setMenuFrom] = useState<Edge>("bottom");
  const [progress] = useState(() => new Animated.Value(0)); // 0 hidden, 1 peeking
  const [menuAnim] = useState(() => new Animated.Value(0)); // 0 closed, 1 open
  const [drag] = useState(() => new Animated.Value(0)); // how far it has been pushed back
  const [dragging, setDragging] = useState(false);
  const edgeRef = useRef<Edge | null>(null);
  const menuOpenRef = useRef(false);
  const ctl = useRef<Controller>(NO_CONTROLLER);

  // ---- the schedule: random visits, requests from screens, hiding again ----------------
  useEffect(() => {
    if (!active) return;

    let alive = true;
    let visible = false;
    let lastEdge: Edge | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    let nextTimer: ReturnType<typeof setTimeout> | undefined;
    const requestTimers = new Set<ReturnType<typeof setTimeout>>();

    const springIn = () =>
      Animated.spring(progress, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }).start();

    function scheduleNext(range: [number, number]) {
      clearTimeout(nextTimer);
      nextTimer = setTimeout(() => show("peek"), rand(range[0], range[1]));
    }

    function hide() {
      clearTimeout(hideTimer);
      if (!visible) return;
      Animated.timing(progress, {
        toValue: 0,
        duration: 320,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!alive || !finished) return; // interrupted by a new visit
        visible = false;
        setPeek(null);
        scheduleNext(NEXT_PEEK_MS);
      });
    }

    function holdThenHide(ms: number) {
      clearTimeout(hideTimer);
      if (menuOpenRef.current) return; // it stays while the theme menu is open
      hideTimer = setTimeout(hide, ms);
    }

    function show(kind: MascotLineKind, forcedLine?: string) {
      if (!alive || isMascotBlocked()) return;
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) {
        scheduleNext([2000, 4000]); // not measured yet, try again soon
        return;
      }
      clearTimeout(nextTimer);

      const line = forcedLine ?? pickMascotLine(kind);
      const hold = Math.min(12000, 6000 + line.length * 60);

      if (visible) {
        // Already peeking: new line, stay a bit longer.
        setPeek((p) => (p ? { ...p, line } : p));
        haptics.bubble();
        progress.stopAnimation();
        springIn();
        holdThenHide(hold);
        return;
      }

      const place = pickPlace(lastEdge, w, h);
      lastEdge = place.edge;
      visible = true;
      progress.stopAnimation();
      progress.setValue(0);
      drag.setValue(0);
      setPeek({ place, line });
      haptics.peek();
      springIn();
      holdThenHide(hold);
    }

    function handlePending() {
      const p = takePendingPeek();
      if (!p) return;
      const t = setTimeout(() => {
        requestTimers.delete(t);
        show("peek", p.line);
      }, p.waitMs);
      requestTimers.add(t);
    }

    ctl.current = {
      show,
      pause: () => {
        clearTimeout(hideTimer);
        if (visible) {
          progress.stopAnimation();
          springIn();
        }
      },
      resume: () => holdThenHide(4000),
      dismiss: () => {
        clearTimeout(hideTimer);
        if (!visible) return;
        visible = false;
        progress.stopAnimation();
        progress.setValue(0);
        setPeek(null);
        scheduleNext(NEXT_PEEK_MS);
      },
    };

    scheduleNext(FIRST_PEEK_MS);
    handlePending(); // a game may have just ended and asked for a line
    const offRequest = onMascotPeekRequest(handlePending);

    // While the app is in the background nothing should run.
    const appSub = AppState.addEventListener("change", (s) => {
      if (s === "active") {
        if (!visible) scheduleNext(NEXT_PEEK_MS);
        return;
      }
      clearTimeout(nextTimer);
      clearTimeout(hideTimer);
      if (visible) {
        progress.stopAnimation();
        progress.setValue(0);
        visible = false;
        setPeek(null);
      }
    });

    return () => {
      alive = false;
      visible = false;
      clearTimeout(hideTimer);
      clearTimeout(nextTimer);
      requestTimers.forEach(clearTimeout);
      offRequest();
      appSub.remove();
      progress.stopAnimation();
      ctl.current = NO_CONTROLLER;
      setPeek(null);
    };
  }, [active, progress, drag]);

  // Shake the phone: the mascot peeks in.
  useShake(active, () => ctl.current.show("shake"));

  // ---- push it back to make it go away -------------------------------------------------
  useEffect(() => {
    edgeRef.current = peek?.place.edge ?? null;
  }, [peek]);
  /* eslint-disable react-hooks/refs -- these refs are only read inside gesture handlers, never during render */
  const [pan] = useState(() => {
    const pushOf = (dx: number, dy: number) => {
      const edge = edgeRef.current;
      if (!edge) return 0;
      const o = OUTWARD[edge];
      return dx * o.x + dy * o.y;
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_, g) =>
        !menuOpenRef.current && pushOf(g.dx, g.dy) > 6,
      onPanResponderGrant: () => {
        setDragging(true);
        ctl.current.pause();
      },
      onPanResponderMove: (_, g) => {
        drag.setValue(Math.max(0, Math.min(OUT_PX, pushOf(g.dx, g.dy))));
      },
      onPanResponderRelease: (_, g) => {
        const push = pushOf(g.dx, g.dy);
        const speed = pushOf(g.vx, g.vy);
        if (push > VISIBLE_PX * 0.4 || speed > 0.8) {
          haptics.pop();
          Animated.timing(drag, {
            toValue: OUT_PX,
            duration: 140,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }).start(() => {
            ctl.current.dismiss();
            setDragging(false);
            drag.setValue(0);
          });
        } else {
          Animated.spring(drag, {
            toValue: 0,
            friction: 7,
            tension: 120,
            useNativeDriver: true,
          }).start();
          setDragging(false);
          ctl.current.resume();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start();
        setDragging(false);
        ctl.current.resume();
      },
    });
  });
  /* eslint-enable react-hooks/refs */

  // ---- theme menu --------------------------------------------------------------------------
  const closeMenu = () => {
    if (!menuOpenRef.current) return;
    menuOpenRef.current = false;
    setMenuOpen(false);
    menuAnim.stopAnimation();
    Animated.timing(menuAnim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMenuMounted(false);
    });
    ctl.current.resume();
  };

  const openMenu = () => {
    if (!peek) return;
    menuOpenRef.current = true;
    setMenuFrom(peek.place.edge);
    setMenuOpen(true);
    setMenuMounted(true);
    ctl.current.pause();
    menuAnim.stopAnimation();
    Animated.spring(menuAnim, {
      toValue: 1,
      friction: 8,
      tension: 70,
      useNativeDriver: true,
    }).start();
  };

  const onMascotPress = () => {
    haptics.pop();
    if (menuOpenRef.current) closeMenu();
    else openMenu();
  };

  // If the mascot gets blocked or switched off while the menu is open, close it at once.
  useEffect(() => {
    if (active || !menuOpenRef.current) return;
    menuOpenRef.current = false;
    setMenuOpen(false);
    menuAnim.stopAnimation();
    menuAnim.setValue(0);
    setMenuMounted(false);
  }, [active, menuAnim]);

  // Android Back closes the menu first.
  useEffect(() => {
    if (!menuOpen) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      closeMenu();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen]);

  if (!mascotEnabled) return null;

  const { w, h } = size;
  const place = peek?.place ?? null;
  const box = place ? boxFor(place, w, h) : null;
  const hidden = place ? HIDDEN_SHIFT[place.edge] : { x: 0, y: 0 };
  const outward = place ? OUTWARD[place.edge] : { x: 0, y: 0 };

  const panelW = Math.min(w - 48, 360);
  const fromX =
    menuFrom === "left" ? -w * 0.7 : menuFrom === "right" ? w * 0.7 : 0;
  const fromY =
    menuFrom === "top" ? -h * 0.6 : menuFrom === "bottom" ? h * 0.6 : 0;

  return (
    <View
      pointerEvents="box-none"
      style={styles.root}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        sizeRef.current = { w: width, h: height };
        setSize((s) =>
          s.w === width && s.h === height ? s : { w: width, h: height },
        );
      }}
    >
      {menuMounted ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "rgba(0,0,0,0.4)",
              opacity: menuAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close theme menu"
            style={StyleSheet.absoluteFill}
            onPress={() => {
              haptics.tap();
              closeMenu();
            }}
          />
        </Animated.View>
      ) : null}

      {peek && place && box ? (
        <>
          <Animated.View
            {...pan.panHandlers}
            style={{
              position: "absolute",
              left: box.left,
              top: box.top,
              width: SIZE,
              height: SIZE,
              transform: [
                {
                  translateX: Animated.add(
                    progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [hidden.x, 0],
                    }),
                    drag.interpolate({
                      inputRange: [0, OUT_PX],
                      outputRange: [0, outward.x * OUT_PX],
                    }),
                  ),
                },
                {
                  translateY: Animated.add(
                    progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [hidden.y, 0],
                    }),
                    drag.interpolate({
                      inputRange: [0, OUT_PX],
                      outputRange: [0, outward.y * OUT_PX],
                    }),
                  ),
                },
              ],
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mascot. Opens the theme menu."
              hitSlop={10}
              onPress={onMascotPress}
            >
              <View style={{ transform: [{ rotate: ROTATE[place.edge] }] }}>
                <MascotFigure />
              </View>
            </Pressable>
          </Animated.View>

          {!menuOpen && !dragging ? (
            <SpeechBubble
              place={place}
              line={peek.line}
              w={w}
              progress={progress}
              color={bar}
            />
          ) : null}
        </>
      ) : null}

      {menuMounted ? (
        <View
          pointerEvents="box-none"
          style={[
            StyleSheet.absoluteFill,
            { alignItems: "center", justifyContent: "center" },
          ]}
        >
          <Animated.View
            style={{
              width: panelW,
              opacity: menuAnim.interpolate({
                inputRange: [0, 0.4, 1],
                outputRange: [0, 1, 1],
                extrapolate: "clamp",
              }),
              transform: [
                {
                  translateX: menuAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [fromX, 0],
                  }),
                },
                {
                  translateY: menuAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [fromY, 0],
                  }),
                },
                {
                  scale: menuAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            }}
          >
            <View
              className="rounded-3xl bg-bar p-4"
              style={{
                elevation: 8,
                shadowColor: "#000",
                shadowOpacity: 0.25,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
              }}
            >
              <Text className="mb-3 text-center text-base font-bold text-ink">
                Pick a theme
              </Text>
              <ThemePicker showTitle={false} />
            </View>
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
});
