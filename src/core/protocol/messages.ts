import type { PromotionPiece, Square } from "@/core/game";

export const PROTOCOL_VERSION = 1;

export type HelloMsg = {
  t: "hello";
  v: number;
  peerId: string;
  name: string;
  roll: number;
};
export type MoveMsg = {
  t: "move";
  from: Square;
  to: Square;
  promotion?: PromotionPiece;
  /** Ply number of this move (1 = White's first move). */
  ply: number;
};
export type ResignMsg = { t: "resign" };
export type DrawOfferMsg = { t: "drawOffer" };
export type DrawAcceptMsg = { t: "drawAccept" };
export type DrawDeclineMsg = { t: "drawDecline" };
export type RematchOfferMsg = { t: "rematchOffer" };
export type RematchAcceptMsg = { t: "rematchAccept" };
export type RematchDeclineMsg = { t: "rematchDecline" };
/** Sent when a player goes back to the home screen. */
export type LeaveMsg = { t: "leave" };
export type PingMsg = { t: "ping" };
export type PongMsg = { t: "pong" };

export type Msg =
  | HelloMsg
  | MoveMsg
  | ResignMsg
  | DrawOfferMsg
  | DrawAcceptMsg
  | DrawDeclineMsg
  | RematchOfferMsg
  | RematchAcceptMsg
  | RematchDeclineMsg
  | LeaveMsg
  | PingMsg
  | PongMsg;

/** Messages the game screen cares about (handshake and heartbeat stay inside the transport). */
export type GameMsg = Exclude<Msg, { t: "hello" | "ping" | "pong" }>;