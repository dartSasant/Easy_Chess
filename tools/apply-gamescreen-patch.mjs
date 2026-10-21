// Applies the small edits to src/ui/game/gameScreen.tsx.
// Run from the project root:  node tools/apply-gamescreen-patch.mjs
// Every "find" text must match exactly once. If one does not, nothing is written
// and the script prints the edit so you can apply it by hand.

import { readFileSync, writeFileSync, copyFileSync } from "node:fs";

const FILE = "src/ui/game/gameScreen.tsx";

const EDITS = [
  {
    name: "1. remove the useSettings import (language is gone)",
    find: `import { useSettings } from "@/core/storage/settings";\n`,
    replace: ``,
  },
  {
    name: "2. import the mascot helpers",
    find: `import { useTheme } from "@/ui/theme/useTheme";`,
    replace:
      `import { pickMascotLine } from "@/ui/mascot/mascotLines";\n` +
      `import { requestMascotPeek, useMascotBlockedWhile } from "@/ui/mascot/mascotStore";\n` +
      `import { useTheme } from "@/ui/theme/useTheme";`,
  },
  {
    name: "3. playMoveSound gets a 'remote' flag",
    find:
      `function playMoveSound(session: GameSession, san: string) {\n` +
      `  if (session.status().kind !== "playing") return;\n` +
      `  moveFeedback({ capture: san.includes("x"), check: san.includes("+") });\n` +
      `}`,
    replace:
      `function playMoveSound(session: GameSession, san: string, remote = false) {\n` +
      `  if (session.status().kind !== "playing") return;\n` +
      `  moveFeedback({ capture: san.includes("x"), check: san.includes("+"), remote });\n` +
      `}`,
  },
  {
    name: "4. bot move: opponent haptic",
    find:
      `        if (result.ok) {\n` +
      `          playMoveSound(session, result.move.san);\n` +
      `          setTick((t) => t + 1);\n` +
      `        } else Alert.alert("Bot error", result.error);`,
    replace:
      `        if (result.ok) {\n` +
      `          playMoveSound(session, result.move.san, true);\n` +
      `          setTick((t) => t + 1);\n` +
      `        } else Alert.alert("Bot error", result.error);`,
  },
  {
    name: "5. Bluetooth move: opponent haptic",
    find:
      `          if (result.ok) {\n` +
      `            playMoveSound(session, result.move.san);\n` +
      `            setDrawState("none");`,
    replace:
      `          if (result.ok) {\n` +
      `            playMoveSound(session, result.move.san, true);\n` +
      `            setDrawState("none");`,
  },
  {
    name: "6. remove the language setting",
    find: `  const { language } = useSettings();\n`,
    replace: ``,
  },
  {
    name: "7. remove language from useBotChatter",
    find: `    outcome,\n    language,\n  });`,
    replace: `    outcome,\n  });`,
  },
  {
    name: "8. mascot: stay away during the game, roast at the end",
    find: `  // Tell the campaign once when a bot game is over.`,
    replace:
      `  // The mascot stays away while a game is in progress, then peeks in with a line when it ends.\n` +
      `  useMascotBlockedWhile(!isOver);\n` +
      `  const mascotSpoke = useRef(false);\n` +
      `  useEffect(() => {\n` +
      `    if (!outcome || mascotSpoke.current) return;\n` +
      `    mascotSpoke.current = true;\n` +
      `    requestMascotPeek({ line: pickMascotLine(outcome), delayMs: 1200 });\n` +
      `  }, [outcome]);\n` +
      `\n` +
      `  // Tell the campaign once when a bot game is over.`,
  },
];

const raw = readFileSync(FILE, "utf8");
const crlf = raw.includes("\r\n");
let text = crlf ? raw.replace(/\r\n/g, "\n") : raw;

const failed = [];
for (const e of EDITS) {
  const count = text.split(e.find).length - 1;
  if (count !== 1) {
    failed.push({ e, count });
    continue;
  }
  text = text.replace(e.find, () => e.replace);
}

if (failed.length) {
  console.error(`\nNothing was written. ${failed.length} edit(s) did not match exactly once:\n`);
  for (const { e, count } of failed) {
    console.error(`--- ${e.name} (found ${count} times) ---`);
    console.error(`FIND:\n${e.find}\nREPLACE WITH:\n${e.replace}\n`);
  }
  process.exit(1);
}

copyFileSync(FILE, `${FILE}.bak`);
writeFileSync(FILE, crlf ? text.replace(/\n/g, "\r\n") : text);
console.log(`Patched ${FILE} (${EDITS.length} edits). Backup: ${FILE}.bak  (delete it before committing)`);
