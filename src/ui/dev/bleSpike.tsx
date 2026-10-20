import {
  BleManager,
  type Advertisement,
  type GattServer,
  type Peripheral,
  type ScanResult,
  type ScanSession,
} from "expo-ble-kit";
import { useRef, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SERVICE = "6e8f0001-5a1c-4c3e-9b57-0e5c3a1d7a01";
// The other phone writes here, and we receive it in onWriteRequest.
const RX = "6e8f0002-5a1c-4c3e-9b57-0e5c3a1d7a01";
// We notify here, and the other phone subscribes to it.
const TX = "6e8f0003-5a1c-4c3e-9b57-0e5c3a1d7a01";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function makeTag() {
  return Math.floor(Math.random() * 1000);
}

export function BleSpike() {
  "use no memo";
  const [logs, setLogs] = useState<string[]>([]);
  const [found, setFound] = useState<ScanResult[]>([]);
  const [started, setStarted] = useState(false);

  const server = useRef<GattServer | null>(null);
  const advertisement = useRef<Advertisement | null>(null);
  const scanSession = useRef<ScanSession | null>(null);
  const linked = useRef<Peripheral | null>(null); // a phone we connected to
  const subscribers = useRef(new Set<string>()); // phones subscribed to our TX

  const log = (message: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((old) => [`${time}  ${message}`, ...old].slice(0, 60));
  };

  const start = async () => {
    try {
      const perms = await BleManager.requestPermissionsAsync({
        scan: true,
        connect: true,
        advertise: true,
      });
      log(
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
        if (request.characteristic === RX) {
          log(`received (write): ${decoder.decode(request.value)}`);
        }
      });
      srv.addSubscriptionListener((event) => {
        if (event.subscribed) subscribers.current.add(event.centralId);
        else subscribers.current.delete(event.centralId);
        log(
          `${event.centralId} ${event.subscribed ? "subscribed to" : "left"} our TX`,
        );
      });
      server.current = srv;
      log("GATT server open");

      advertisement.current = await BleManager.startAdvertising({
        serviceUUIDs: [SERVICE],
        localName: "EasyChess",
      });
      log("advertising");

      scanSession.current = BleManager.startScan(
        { services: [SERVICE] },
        (results) => {
          setFound((old) => {
            const byId = new Map(old.map((r) => [r.id, r]));
            results.forEach((r) => byId.set(r.id, r));
            return [...byId.values()];
          });
        },
        (error) => log(`scan error: ${String(error)}`),
      );
      log("scanning");
      setStarted(true);
    } catch (error) {
      log(`start failed: ${String(error)}`);
    }
  };

  const connect = async (id: string) => {
    try {
      const peripheral = BleManager.getPeripheral(id);
      log(`connecting to ${id}`);
      await peripheral.connect();
      log(`connected, MTU ${peripheral.mtu}`);
      peripheral.addConnectionStateListener((state) =>
        log(`link state: ${state}`),
      );
      await peripheral.subscribe(SERVICE, TX, (value) => {
        log(`received (notify): ${decoder.decode(value)}`);
      });
      linked.current = peripheral;
      log("subscribed to their TX, ready to send");
    } catch (error) {
      log(`connect failed: ${String(error)}`);
    }
  };

  const send = async () => {
    const text = `hello from ${Platform.OS} #${makeTag()}`;
    const data = encoder.encode(text);
    let sent = false;

    if (linked.current) {
      try {
        await linked.current.write(SERVICE, RX, data);
        log(`sent (write): ${text}`);
        sent = true;
      } catch (error) {
        log(`write failed: ${String(error)}`);
      }
    }
    if (server.current && subscribers.current.size > 0) {
      try {
        await server.current.notify(TX, data);
        log(`sent (notify): ${text}`);
        sent = true;
      } catch (error) {
        log(`notify failed: ${String(error)}`);
      }
    }
    if (!sent) log("nothing sent: not connected and nobody subscribed yet");
  };

  const stop = async () => {
    try {
      scanSession.current?.stop();
      await advertisement.current?.stop();
      await linked.current?.disconnect();
      await server.current?.close();
    } catch (error) {
      log(`stop error: ${String(error)}`);
    }
    scanSession.current = null;
    advertisement.current = null;
    linked.current = null;
    server.current = null;
    subscribers.current.clear();
    setFound([]);
    setStarted(false);
    log("stopped");
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas px-4">
      <Text className="mt-4 text-xl font-bold text-ink">BLE test</Text>

      <View className="mt-3 flex-row">
        <Pressable
          onPress={start}
          disabled={started}
          className={`mr-2 rounded-lg px-4 py-3 ${started ? "bg-bar" : "bg-accent"}`}
        >
          <Text className="font-bold text-ink">Start</Text>
        </Pressable>
        <Pressable
          onPress={send}
          className="mr-2 rounded-lg bg-accent px-4 py-3"
        >
          <Text className="font-bold text-ink">Send hello</Text>
        </Pressable>
        <Pressable
          onPress={stop}
          className="rounded-lg border border-danger px-4 py-3"
        >
          <Text className="font-bold text-danger">Stop</Text>
        </Pressable>
      </View>

      <Text className="mt-4 font-bold text-ink">
        Nearby phones ({found.length})
      </Text>
      {found.map((r) => (
        <Pressable
          key={r.id}
          onPress={() => connect(r.id)}
          className="mt-2 rounded-lg bg-bar px-3 py-2"
        >
          <Text className="text-ink">
            {r.name ?? "unnamed"} · {r.id} · {r.rssi} dBm
          </Text>
          <Text className="text-ink">Tap to connect</Text>
        </Pressable>
      ))}

      <Text className="mt-4 font-bold text-ink">Log</Text>
      <ScrollView className="mt-1 flex-1 rounded-lg bg-bar p-2">
        {logs.map((line, i) => (
          <Text key={i} className="text-xs text-ink">
            {line}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
