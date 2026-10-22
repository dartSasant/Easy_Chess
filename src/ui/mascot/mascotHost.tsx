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
  type GestureResponderHandlers,
} from "react-native";

import { haptics, playStartup } from "@/core/feedback";
import {
  updateSettings,
  useSettings,
  type ThemeId,
} from "@/core/storage/settings";
import { MASCOT_SIZE, MascotFigure } from "@/ui/home/mascot";
import { ThemePicker } from "@/ui/home/themePicker";
import { THEMES } from "@/ui/theme/themes";
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

// The jump: now and then a random visit leaps to the opposite edge of the screen.
const JUMP_CHANCE = 0.3; // chance that a random visit includes a jump
const JUMP_AFTER_MS: [number, number] = [2200, 3800]; // how long into the visit it jumps
const JUMP_MS = 460; // flight time
const JUMP_ARC_PX = 70; // how high / wide the arc bows

/** The drawing is upright. Turn it so its head always points into the screen. */
const ROTATE: Record<Edge, string> = {
  bottom: "0deg",
  top: "180deg",
  left: "90deg",
  right: "-90deg",
};
const ROTATE_DEG: Record<Edge, number> = {
  bottom: 0,
  top: 180,
  left: 90,
  right: -90,
};

const OPPOSITE: Record<Edge, Edge> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
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

/** A spot on the given edge. */
function placeOnEdge(edge: Edge, w: number, h: number): Place {
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

/** A random edge (never the same twice in a row) and a spot on it. */
function pickPlace(previous: Edge | null, w: number, h: number): Place {
  const options = EDGES.filter((e) => e !== previous);
  const edge = options[Math.floor(Math.random() * options.length)];
  return placeOnEdge(edge, w, h);
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

/** The flight from one landing spot to the other: a bowed arc plus a turn in the air. */
function jumpMotion(
  t: Animated.Value,
  from: Place,
  to: Place,
  w: number,
  h: number,
) {
  const a = boxFor(from, w, h);
  const b = boxFor(to, w, h);
  const vertical = from.edge === "top" || from.edge === "bottom";
  // Bow toward the middle of the screen so the arc never leaves it.
  const side = (a.left + b.left) / 2 + SIZE / 2 < w / 2 ? 1 : -1;

  const steps = [0, 0.25, 0.5, 0.75, 1];
  const arc = (s: number) => JUMP_ARC_PX * 4 * s * (1 - s);
  const xs = steps.map(
    (s) => a.left + (b.left - a.left) * s + (vertical ? side * arc(s) : 0),
  );
  const ys = steps.map(
    (s) => a.top + (b.top - a.top) * s + (vertical ? 0 : -arc(s)),
  );

  const startDeg = ROTATE_DEG[from.edge];
  // Top to bottom keeps turning the same way and lands upright (360 = 0).
  const endDeg = from.edge === "top" ? 360 : ROTATE_DEG[to.edge];

  return {
    translateX: t.interpolate({ inputRange: steps, outputRange: xs }),
    translateY: t.interpolate({ inputRange: steps, outputRange: ys }),
    rotate: t.interpolate({
      inputRange: [0, 1],
      outputRange: [`${startDeg}deg`, `${endDeg}deg`],
    }),
  };
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
  drag: Animated.Value;
  color: string;
  /** The same swipe handlers as the mascot: swiping the bubble sends both away. */
  panHandlers: GestureResponderHandlers;
};

/**
 * The speech bubble. It always stays upright and sits on the screen side of the mascot.
 * It follows the mascot while it is pushed back, and only the bubble itself (not the empty
 * space around it) takes touches.
 */
function SpeechBubble({
  place,
  line,
  w,
  progress,
  drag,
  color,
  panHandlers,
}: BubbleProps) {
  "use no memo";
  const out = OUTWARD[place.edge];

  const appear = progress.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0, 1],
    extrapolate: "clamp",
  });
  const fade = drag.interpolate({
    inputRange: [0, OUT_PX],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const opacity = Animated.multiply(appear, fade);
  const follow = [
    {
      translateX: drag.interpolate({
        inputRange: [0, OUT_PX],
        outputRange: [0, out.x * OUT_PX],
      }),
    },
    {
      translateY: drag.interpolate({
        inputRange: [0, OUT_PX],
        outputRange: [0, out.y * OUT_PX],
      }),
    },
  ];

  const bubble = (
    <View {...panHandlers} className="rounded-2xl bg-bar px-4 py-2">
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
        pointerEvents="none"
        style={[
          tailStyle(place.edge === "bottom" ? "down" : "up", color),
          { transform: [{ translateX: shift }] },
        ]}
      />
    );
    return (
      <Animated.View
        pointerEvents="box-none"
        style={[
          {
            position: "absolute",
            left,
            width: bw,
            alignItems: "center",
            opacity,
            transform: follow,
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
      pointerEvents="box-none"
      style={[
        {
          position: "absolute",
          top: place.along,
          height: SIZE,
          width: bw,
          flexDirection: "row",
          alignItems: "center",
          opacity,
          transform: follow,
        },
        onLeft
          ? { left: VISIBLE_PX + GAP }
          : { right: VISIBLE_PX + GAP, justifyContent: "flex-end" },
      ]}
    >
      {onLeft ? (
        <View pointerEvents="none" style={tailStyle("left", color)} />
      ) : null}
      <View style={{ flexShrink: 1 }}>{bubble}</View>
      {!onLeft ? (
        <View pointerEvents="none" style={tailStyle("right", color)} />
      ) : null}
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
 *  - Now and then a random visit jumps across the screen to the opposite edge.
 *  - Push the mascot or its bubble back toward the edge (or flick it): both go away.
 *  - Tap it: the theme menu floats in from the mascot's side. Tap outside it or the mascot to close.
 *  - Picking a theme reveals it as a circle growing from the mascot.
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
  const [jump, setJump] = useState<{ from: Place; to: Place } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [menuFrom, setMenuFrom] = useState<Edge>("bottom");
  const [progress] = useState(() => new Animated.Value(0)); // 0 hidden, 1 peeking
  const [menuAnim] = useState(() => new Animated.Value(0)); // 0 closed, 1 open
  const [drag] = useState(() => new Animated.Value(0)); // how far it has been pushed back
  const [jumpT] = useState(() => new Animated.Value(0)); // 0 takeoff, 1 landed
  const [reveal, setReveal] = useState<{
    color: string;
    cx: number;
    cy: number;
    r: number;
  } | null>(null);
  const [revealScale] = useState(() => new Animated.Value(0));
  const [revealOpacity] = useState(() => new Animated.Value(1));
  const revealing = useRef(false);
  const draggingRef = useRef(false);
  const edgeRef = useRef<Edge | null>(null);
  const menuOpenRef = useRef(false);
  const ctl = useRef<Controller>(NO_CONTROLLER);

  // ---- the schedule: random visits, requests from screens, hiding again ----------------
  useEffect(() => {
    if (!active) return;

    let alive = true;
    let visible = false;
    let jumping = false;
    let lastEdge: Edge | null = null;
    let current: { place: Place; line: string } | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    let nextTimer: ReturnType<typeof setTimeout> | undefined;
    let jumpTimer: ReturnType<typeof setTimeout> | undefined;
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

    /** Stops a jump that is planned or in the air. */
    function cancelJump() {
      clearTimeout(jumpTimer);
      if (!jumping) return;
      jumping = false;
      jumpT.stopAnimation();
      setJump(null);
    }

    function hide() {
      clearTimeout(hideTimer);
      if (!visible) return;
      if (jumping) {
        // Never hide while it is in the air: try again right after landing.
        hideTimer = setTimeout(hide, 250);
        return;
      }
      clearTimeout(jumpTimer);
      Animated.timing(progress, {
        toValue: 0,
        duration: 320,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!alive || !finished) return; // interrupted by a new visit
        visible = false;
        current = null;
        setPeek(null);
        scheduleNext(NEXT_PEEK_MS);
      });
    }

    function holdThenHide(ms: number) {
      clearTimeout(hideTimer);
      if (menuOpenRef.current) return; // it stays while the theme menu is open
      hideTimer = setTimeout(hide, ms);
    }

    /** Leap to the opposite edge. No stop in the middle. */
    function jumpAcross() {
      if (!alive || !visible || jumping || !current) return;
      if (menuOpenRef.current || draggingRef.current || isMascotBlocked()) return;
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) return;

      const from = current.place;
      const to = placeOnEdge(OPPOSITE[from.edge], w, h);
      jumping = true;
      clearTimeout(hideTimer); // it must not hide while in the air
      jumpT.setValue(0);
      setJump({ from, to });
      haptics.pop();

      Animated.timing(jumpT, {
        toValue: 1,
        duration: JUMP_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!alive || !finished || !jumping) return;
        jumping = false;
        lastEdge = to.edge;
        const line = current ? current.line : "";
        current = { place: to, line };
        // Landed: the normal peeking mascot takes over at exactly this spot.
        setPeek({ place: to, line });
        setJump(null);
        haptics.peek();
        holdThenHide(3500);
      });
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
        if (current) current = { ...current, line };
        setPeek((p) => (p ? { ...p, line } : p));
        haptics.bubble();
        progress.stopAnimation();
        springIn();
        holdThenHide(hold);
        return;
      }

      const place = pickPlace(lastEdge, w, h);
      lastEdge = place.edge;
      current = { place, line };
      visible = true;
      progress.stopAnimation();
      progress.setValue(0);
      drag.setValue(0);
      setPeek({ place, line });
      haptics.peek();
      springIn();
      holdThenHide(hold);

      // Only the random visits jump, never shake or game-result visits.
      if (kind === "peek" && forcedLine === undefined && Math.random() < JUMP_CHANCE) {
        clearTimeout(jumpTimer);
        jumpTimer = setTimeout(jumpAcross, rand(JUMP_AFTER_MS[0], JUMP_AFTER_MS[1]));
      }
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
        cancelJump();
        visible = false;
        current = null;
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
      cancelJump();
      if (visible) {
        progress.stopAnimation();
        progress.setValue(0);
        visible = false;
        current = null;
        setPeek(null);
      }
    });

    return () => {
      alive = false;
      visible = false;
      jumping = false;
      clearTimeout(hideTimer);
      clearTimeout(nextTimer);
      clearTimeout(jumpTimer);
      requestTimers.forEach(clearTimeout);
      offRequest();
      appSub.remove();
      progress.stopAnimation();
      jumpT.stopAnimation();
      ctl.current = NO_CONTROLLER;
      setJump(null);
      setPeek(null);
    };
  }, [active, progress, drag, jumpT]);

  // Shake the phone: the mascot peeks in.
  useShake(active, () => ctl.current.show("shake"));

  // ---- push it back to make it go away (the mascot or its bubble) ------------------------
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
        draggingRef.current = true;
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
            draggingRef.current = false;
            drag.setValue(0);
          });
        } else {
          Animated.spring(drag, {
            toValue: 0,
            friction: 7,
            tension: 120,
            useNativeDriver: true,
          }).start();
          draggingRef.current = false;
          ctl.current.resume();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start();
        draggingRef.current = false;
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

  // ---- theme reveal: a circle in the new theme's color grows from the mascot -----------------
  const pickTheme = (id: ThemeId) => {
    if (revealing.current) return;
    revealing.current = true;

    const { w, h } = sizeRef.current;
    const b = peek ? boxFor(peek.place, w, h) : null;
    const cx = b ? b.left + SIZE / 2 : w / 2;
    const cy = b ? b.top + SIZE / 2 : h / 2;
    const r = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));

    revealScale.setValue(0);
    revealOpacity.setValue(1);
    setReveal({ color: THEMES[id].colors.canvas, cx, cy, r });
    haptics.pick();

    Animated.timing(revealScale, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        setReveal(null);
        revealing.current = false;
        return;
      }
      // The circle now covers the screen: swap the theme underneath it.
      updateSettings({ themeId: id });
      playStartup(id);
      Animated.timing(revealOpacity, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start(() => {
        setReveal(null);
        revealing.current = false;
      });
    });
  };

  useEffect(
    () => () => {
      revealScale.stopAnimation();
      revealOpacity.stopAnimation();
    },
    [revealScale, revealOpacity],
  );

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
  const flight = jump ? jumpMotion(jumpT, jump.from, jump.to, w, h) : null;

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
      {reveal ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: reveal.cx - reveal.r,
            top: reveal.cy - reveal.r,
            width: reveal.r * 2,
            height: reveal.r * 2,
            borderRadius: reveal.r,
            backgroundColor: reveal.color,
            opacity: revealOpacity,
            transform: [{ scale: revealScale }],
          }}
        />
      ) : null}

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

      {peek && place && box && !jump ? (
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

          {!menuOpen ? (
            <SpeechBubble
              place={place}
              line={peek.line}
              w={w}
              progress={progress}
              drag={drag}
              color={bar}
              panHandlers={pan.panHandlers}
            />
          ) : null}
        </>
      ) : null}

      {flight ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: SIZE,
            height: SIZE,
            transform: [
              { translateX: flight.translateX },
              { translateY: flight.translateY },
              { rotate: flight.rotate },
            ],
          }}
        >
          <MascotFigure />
        </Animated.View>
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
              <ThemePicker showTitle={false} onPick={pickTheme} />
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