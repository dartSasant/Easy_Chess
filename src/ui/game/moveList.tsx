import { useRef } from "react";
import { ScrollView, Text } from "react-native";

type Props = { moves: { san: string }[] };

type Scroller = { scrollToEnd: (options?: { animated?: boolean }) => void };

/** Compact one-line move list for inside a player bar: "1. e4 e5  2. Nf3 Nc6". */
export function MoveList({ moves }: Props) {
  "use no memo";
  const scroll = useRef<Scroller | null>(null);

  if (moves.length === 0) return null;

  const rows: { n: number; white: string; black?: string }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({ n: i / 2 + 1, white: moves[i].san, black: moves[i + 1]?.san });
  }

  return (
    <ScrollView
      ref={(node) => {
        scroll.current = node;
      }}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end", alignItems: "center" }}
      onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
    >
      {rows.map((r) => (
        <Text key={r.n} className="ml-3 text-sm text-ink">
          <Text className="opacity-50">{r.n}. </Text>
          <Text className="font-bold">{r.white}</Text>
          {r.black ? ` ${r.black}` : ""}
        </Text>
      ))}
    </ScrollView>
  );
}