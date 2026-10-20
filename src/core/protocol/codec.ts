import type { Msg } from "./messages";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const SQUARE = /^[a-h][1-8]$/;
const PROMOTIONS = ["q", "r", "b", "n"];

export function encode(msg: Msg): Uint8Array {
  return encoder.encode(JSON.stringify(msg));
}

/** Returns null for anything malformed. Never throws. */
export function decode(bytes: Uint8Array): Msg | null {
  try {
    const raw: unknown = JSON.parse(decoder.decode(bytes));
    if (typeof raw !== "object" || raw === null) return null;
    const m = raw as Record<string, unknown>;

    switch (m.t) {
      case "hello":
        if (
          typeof m.v === "number" &&
          typeof m.peerId === "string" &&
          m.peerId.length > 0 &&
          m.peerId.length <= 64 &&
          typeof m.name === "string" &&
          typeof m.roll === "number" &&
          Number.isInteger(m.roll)
        ) {
          return {
            t: "hello",
            v: m.v,
            peerId: m.peerId,
            name: m.name.slice(0, 24),
            roll: m.roll,
          };
        }
        return null;
      case "move":
        if (
          typeof m.from === "string" &&
          SQUARE.test(m.from) &&
          typeof m.to === "string" &&
          SQUARE.test(m.to) &&
          typeof m.ply === "number" &&
          Number.isInteger(m.ply) &&
          m.ply >= 1 &&
          (m.promotion === undefined ||
            (typeof m.promotion === "string" &&
              PROMOTIONS.includes(m.promotion)))
        ) {
          return {
            t: "move",
            from: m.from,
            to: m.to,
            promotion: m.promotion as "q" | "r" | "b" | "n" | undefined,
            ply: m.ply,
          };
        }
        return null;
      case "resign":
      case "drawOffer":
      case "drawAccept":
      case "drawDecline":
      case "rematchOffer":
      case "rematchAccept":
      case "rematchDecline":
      case "leave":
      case "ping":
      case "pong":
        return { t: m.t };
      default:
        return null;
    }
  } catch {
    return null;
  }
}
