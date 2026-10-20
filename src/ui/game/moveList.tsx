import { useRef } from "react";
import { ScrollView, Text, View } from "react-native";

type Props = { moves: { san: string }[] };

type Scroller = { scrollToEnd: (options?: { animated?: boolean }) => void };

/** One-line scrolling move list: "1. e4 e5  2. Nf3 Nc6". Always scrolls to the latest move. */
export function MoveList({ moves }: Props) {
  "use no memo";
  const scroll = useRef<Scroller | null>(null);

  const rows: { n: number; white: string; black?: string }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({ n: i / 2 + 1, white: moves[i].san, black: moves[i + 1]?.san });
  }

  return (
    <View className="mx-3 h-10 justify-center rounded-xl bg-bar">
      {rows.length === 0 ? (
        <Text className="px-3 text-sm text-ink opacity-60">No moves yet</Text>
      ) : (
        <ScrollView
          ref={(node) => {
            scroll.current = node;
          }}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="items-center px-3"
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
        >
          {rows.map((r) => (
            <Text key={r.n} className="mr-4 text-sm text-ink">
              <Text className="opacity-50">{r.n}. </Text>
              <Text className="font-bold">{r.white}</Text>
              {r.black ? ` ${r.black}` : ""}
            </Text>
          ))}
        </ScrollView>
      )}
    </View>
  );
}