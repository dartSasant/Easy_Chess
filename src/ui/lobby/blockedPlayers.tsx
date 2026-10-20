import { Modal, Pressable, ScrollView, Text, View } from "react-native";

import type { BlockedPlayer } from "@/core/storage/blocked";

type Props = {
  visible: boolean;
  players: BlockedPlayer[];
  onUnblock: (id: string) => void;
  onClose: () => void;
};

export function BlockedPlayers({ visible, players, onUnblock, onClose }: Props) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-ink/60 px-8" onPress={onClose}>
        <Pressable className="max-h-[70%] w-full rounded-2xl bg-bar p-5">
          <Text className="text-lg font-bold text-ink">Blocked players</Text>
          {players.length === 0 ? (
            <Text className="mt-3 text-ink">Nobody is blocked.</Text>
          ) : (
            <ScrollView className="mt-3">
              {players.map((p) => (
                <View key={p.id} className="mb-2 flex-row items-center justify-between">
                  <Text className="flex-1 text-ink" numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Pressable
                    onPress={() => onUnblock(p.id)}
                    className="ml-3 rounded-lg bg-accent px-3 py-2"
                  >
                    <Text className="font-bold text-ink">Unblock</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
          <View className="mt-4 flex-row justify-end">
            <Pressable onPress={onClose} className="rounded-lg bg-canvas px-4 py-3">
              <Text className="font-bold text-ink">Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}