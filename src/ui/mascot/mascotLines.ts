export type MascotLineKind = "peek" | "shake" | "win" | "loss" | "draw";

// English only. Sassy, a little rude, never mean about who you are.
const LINES: Record<MascotLineKind, string[]> = {
  // Random visits.
  peek: [
    "Oh, you're back. Did you miss losing?",
    "Welcome back! I rearranged the pieces so you can't blame them this time.",
    "Look who thinks they're a grandmaster today.",
    "Ready to lose with style? Let's go.",
    "Fresh day, same moves. Impressive consistency.",
    "Take your time. Not that it helps.",
    "I was just checking if anyone was still thinking. Nope.",
    "Psst. Your knight called. It wants a better player.",
    "I'd say good luck, but we both know.",
    "Your pawns are scared. I can see them shaking.",
    "Still here? Bold of you.",
    "I came to watch you blunder. Don't mind me.",
    "Hey, you. Yes, you with the questionable opening.",
    "Fun fact: the queen can move any number of squares. Try it sometime.",
    "The knight moves in an L. Not a Z. Not a vibe. An L.",
    "You look great today. Your chess, however...",
    "I'd flirt with you, but you keep hanging your pieces.",
    "Come here often? Wait, you do. That explains a lot.",
    "Even the bishops are bored. Make a move!",
    "Quick tip: the goal is to capture their king, not your own pride.",
    "I brought popcorn. Please, carry on.",
    "Are you playing chess or just moving wood around?",
  ],

  // Shaking the phone.
  shake: [
    "Earthquake! Oh, it's just you.",
    "Whoa! Careful, I just did my hair.",
    "Shake me again and I'm telling the bishops.",
    "Okay okay, I'm here! Stop rattling me.",
    "Was that a tantrum or a warm-up?",
    "I felt that in my vectors.",
    "Easy there. I'm made of pixels, not rubber.",
    "Did you lose a game, or just your patience?",
    "Shaking the phone won't make your rook any smarter.",
    "Yes, hello, I'm coming! Rude.",
  ],

  // You won.
  win: [
    "Okay, you won. I'm sure your opponent had an off day.",
    "A win! Frame it. It might not happen again.",
    "Not bad. For you.",
    "Even a broken clock is right twice a day. Congrats.",
    "Don't let it go to your head. There's not much room.",
    "Beginner's luck. Very experienced beginner's luck.",
    "I'd clap, but I have no hands. Imagine the clapping.",
    "Well played. I'd say it was skill, but I'd be lying a little.",
    "You won! Quick, screenshot it before it changes.",
    "I'm proud of you. Please don't make it weird.",
  ],

  // You lost.
  loss: [
    "Ouch. Even your pawns looked embarrassed.",
    "That was painful to watch. I watched anyway.",
    "You didn't lose, you just donated pieces very generously.",
    "Your king wants a word. And a new player.",
    "That wasn't chess. That was a very slow accident.",
    "Good news: you can only improve. Probably.",
    "Your opponent says thanks for the free pieces.",
    "I've seen better defense from a paper bag.",
    "Losing builds character. You must have so much by now.",
    "That's okay. Everyone starts somewhere. You've just been starting for a while.",
    "Hang in there. Even grandmasters lose. Not like that, but they lose.",
    "I'd say try again, but I'm not sure it helps. Try anyway.",
  ],

  // Draw.
  draw: [
    "A draw. The chess version of \"we don't talk about it\".",
    "Nobody won. Nobody lost. Nobody's happy.",
    "A draw: when both of you tried and neither succeeded.",
    "Peace treaty signed. The pieces are relieved.",
    "So close to winning, so close to losing. Mostly close to boring.",
    "A draw is just a loss that went to therapy.",
  ],
};

const lastShown: Partial<Record<MascotLineKind, string>> = {};

/** A random line of this kind, never the same one twice in a row. */
export function pickMascotLine(kind: MascotLineKind): string {
  const pool = LINES[kind];
  let line = pool[Math.floor(Math.random() * pool.length)];
  if (pool.length > 1) {
    while (line === lastShown[kind]) line = pool[Math.floor(Math.random() * pool.length)];
  }
  lastShown[kind] = line;
  return line;
}
