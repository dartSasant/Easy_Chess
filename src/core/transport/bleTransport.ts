import {
  BleManager,
  type Advertisement,
  type GattServer,
  type Peripheral,
  type ScanResult,
  type ScanSession,
} from "expo-ble-kit";

import type { Color } from "@/core/game";
import {
  PROTOCOL_VERSION,
  decode,
  encode,
  makePeerId,
  pickColor,
  randomRoll,
  type GameMsg,
  type Msg,
} from "@/core/protocol";

const SERVICE = "6e8f0001-5a1c-4c3e-9b57-0e5c3a1d7a01";
const RX = "6e8f0002-5a1c-4c3e-9b57-0e5c3a1d7a01"; // the other phone writes here
const TX = "6e8f0003-5a1c-4c3e-9b57-0e5c3a1d7a01"; // we notify here

const PING_EVERY_MS = 4000;
const DEAD_AFTER_MS = 12000;

export type TransportEvent =
  | { kind: "log"; text: string }
  | { kind: "found"; devices: ScanResult[] }
  | { kind: "ready"; localColor: Color; opponentName: string }
  | { kind: "closed"; reason: string };

type Phase = "idle" | "handshake" | "ready";

export class BleTransport {
  readonly peerId = makePeerId();

  private phase: Phase = "idle";
  private myRoll = randomRoll();
  private opponent: { peerId: string; name: string; roll: number } | null = null;

  private server: GattServer | null = null;
  private advertisement: Advertisement | null = null;
  private scanSession: ScanSession | null = null;
  private outbound: Peripheral | null = null; // a phone we connected to
  private subscribers = new Set<string>(); // phones subscribed to our TX
  private found = new Map<string, ScanResult>();

  private listeners = new Set<(e: TransportEvent) => void>();
  private msgHandler: ((m: GameMsg) => void) | null = null;
  private pending: GameMsg[] = [];

  private lastSeen = 0;
  private heartbeat: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly playerName: string) {}

  // ---- events ----

  onEvent(listener: (e: TransportEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Game messages. Anything that arrived before the first subscriber is replayed. */
  onMessage(handler: (m: GameMsg) => void): () => void {
    this.msgHandler = handler;
    this.pending.splice(0).forEach(handler);
    return () => {
      if (this.msgHandler === handler) this.msgHandler = null;
    };
  }

  private emit(e: TransportEvent) {
    this.listeners.forEach((l) => l(e));
  }
  private log(text: string) {
    this.emit({ kind: "log", text });
  }

  // ---- lifecycle ----

  async start(): Promise<void> {
    if (this.phase !== "idle") return;
    this.phase = "handshake";
    try {
      const perms = await BleManager.requestPermissionsAsync({
        scan: true,
        connect: true,
        advertise: true,
      });
      this.log(
        `permissions: scan ${perms.scan}, connect ${perms.connect}, advertise ${perms.advertise}`,
      );

      const srv = await BleManager.openGattServer([
        {
          uuid: SERVICE,
          characteristics: [
            { uuid: RX, properties: ["write"], permissions: ["writeable"] },
            { uuid: TX, properties: ["notify"], permissions: [] },
          ],
        },
      ]);
      srv.onWriteRequest((request) => {
        if (request.characteristic === RX) this.handleIncoming(request.value);
      });
      srv.addSubscriptionListener((event) => {
        if (event.subscribed) {
          this.subscribers.add(event.centralId);
          void this.sendHello();
        } else {
          this.subscribers.delete(event.centralId);
        }
        this.log(`${event.centralId} ${event.subscribed ? "subscribed to" : "left"} our TX`);
      });
      this.server = srv;

      this.advertisement = await BleManager.startAdvertising({
        serviceUUIDs: [SERVICE],
        localName: "EasyChess",
      });

      this.scanSession = BleManager.startScan(
        { services: [SERVICE] },
        (results) => {
          results.forEach((r) => this.found.set(r.id, r)); // same id = same entry
          this.emit({ kind: "found", devices: [...this.found.values()] });
        },
        (error) => this.log(`scan error: ${String(error)}`),
      );
      this.log("advertising and scanning");
    } catch (error) {
      this.log(`start failed: ${String(error)}`);
      await this.teardown();
      throw error;
    }
  }

  async connect(id: string): Promise<void> {
    if (this.phase !== "handshake") return;
    try {
      const peripheral = BleManager.getPeripheral(id);
      this.log(`connecting to ${id}`);
      await peripheral.connect();
      this.log(`connected, MTU ${peripheral.mtu}`);
      peripheral.addConnectionStateListener((state) => this.log(`link state: ${state}`));
      await peripheral.subscribe(SERVICE, TX, (value) => this.handleIncoming(value));
      this.outbound = peripheral;
      this.log("subscribed to their TX");
      await this.sendHello();
    } catch (error) {
      this.log(`connect failed: ${String(error)}`);
    }
  }

  async stop(): Promise<void> {
    await this.teardown();
  }

  private close(reason: string) {
    if (this.phase === "idle") return;
    this.emit({ kind: "closed", reason });
    void this.teardown();
  }

  private async teardown() {
    this.phase = "idle";
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = null;

    const steps: (() => unknown)[] = [
      () => this.scanSession?.stop(),
      () => this.advertisement?.stop(),
      () => this.outbound?.disconnect(),
      () => this.server?.close(),
    ];
    for (const step of steps) {
      try {
        await step();
      } catch (error) {
        this.log(`stop error: ${String(error)}`);
      }
    }
    this.scanSession = null;
    this.advertisement = null;
    this.outbound = null;
    this.server = null;
    this.subscribers.clear();
    this.found.clear();
    this.opponent = null;
    this.myRoll = randomRoll();
    this.pending = [];
  }

  // ---- sending ----

  /** Sends on one link only: our outbound link if we have one, else notify. */
  async send(msg: Msg): Promise<boolean> {
    const data = encode(msg);
    if (this.outbound) {
      try {
        await this.outbound.write(SERVICE, RX, data);
        return true;
      } catch (error) {
        this.log(`write failed: ${String(error)}`);
        return false;
      }
    }
    if (this.server && this.subscribers.size > 0) {
      try {
        await this.server.notify(TX, data);
        return true;
      } catch (error) {
        this.log(`notify failed: ${String(error)}`);
        return false;
      }
    }
    return false;
  }

  private sendHello() {
    return this.send({
      t: "hello",
      v: PROTOCOL_VERSION,
      peerId: this.peerId,
      name: this.playerName,
      roll: this.myRoll,
    });
  }

  // ---- receiving ----

  private handleIncoming(bytes: Uint8Array) {
    const msg = decode(bytes);
    if (!msg) {
      this.log("ignored a malformed message");
      return;
    }
    this.lastSeen = Date.now();

    switch (msg.t) {
      case "hello":
        this.onHello(msg);
        return;
      case "ping":
        void this.send({ t: "pong" });
        return;
      case "pong":
        return;
      default:
        if (this.phase !== "ready") return; // game messages before the handshake are dropped
        if (this.msgHandler) this.msgHandler(msg);
        else this.pending.push(msg);
    }
  }

  private onHello(msg: Extract<Msg, { t: "hello" }>) {
    if (this.phase !== "handshake") return; // repeats over a second link land here
    if (msg.peerId === this.peerId) return;
    if (msg.v !== PROTOCOL_VERSION) {
      this.close("The other phone runs a different version of the app");
      return;
    }

    const first = this.opponent === null;
    this.opponent = { peerId: msg.peerId, name: msg.name, roll: msg.roll };
    if (first) void this.sendHello(); // answer once, so nobody ping-pongs hellos

    const color = pickColor(this.myRoll, msg.roll);
    if (color === null) {
      this.myRoll = randomRoll(); // tie: roll again and wait for their new roll
      void this.sendHello();
      return;
    }

    this.phase = "ready";
    this.lastSeen = Date.now();
    this.heartbeat = setInterval(() => {
      if (Date.now() - this.lastSeen > DEAD_AFTER_MS) {
        this.close("Opponent disconnected");
        return;
      }
      void this.send({ t: "ping" });
    }, PING_EVERY_MS);
    this.emit({ kind: "ready", localColor: color, opponentName: msg.name });
  }
}