export type LineCategory = "start" | "hit" | "hurt" | "idle" | "botWins" | "botLoses";
type Personality = "funny" | "sassy" | "wise";

// start = game opens, hit = bot took your piece, hurt = you took its piece or gave check,
// idle = random chatter, botWins / botLoses = end of game.
const LINES: Record<Personality, Record<LineCategory, string[]>> = {
  funny: {
    start: ["Let's play! I promise to blunder only a little.", "Beep boop. Warming up my brain."],
    hit: ["Munch! Tasty piece.", "Oops, did I do that?"],
    hurt: ["Hey! I was saving that one!", "Ouch! My feelings!"],
    idle: ["Take your time, I brought snacks.", "Is it my turn yet? Kidding."],
    botWins: ["Good game! I'll pretend that was hard.", "Checkmate! Dance time!"],
    botLoses: ["You win! I let you. Maybe.", "Wow, okay, I did not see that coming."],
  },
  sassy: {
    start: ["Try to keep up.", "Hope you stretched. Losing is tiring."],
    hit: ["Thanks for the gift.", "Was that your plan? Bold."],
    hurt: ["Lucky. Don't get used to it.", "Hm. Fine. That was okay."],
    idle: ["Still thinking? Take a nap.", "The board is getting dusty."],
    botWins: ["Better luck next time. Or skill.", "That was cute. I won."],
    botLoses: ["Okay, you earned that one.", "Don't let it go to your head."],
  },
  wise: {
    start: ["Every game teaches something.", "Breathe. Think. Move."],
    hit: ["A piece is lost, but the game goes on.", "Patience wins more than speed."],
    hurt: ["Well seen. I learn from this.", "A fine move."],
    idle: ["Calm minds see more squares.", "No rush. The board waits."],
    botWins: ["Defeat is a good teacher. Try again.", "A good fight. Rest, then return."],
    botLoses: ["You have grown. Well played.", "I bow to your play."],
  },
};

const ORDER: Personality[] = ["funny", "sassy", "wise"];

export function pickLine(level: number, category: LineCategory): string {
  const lines = LINES[ORDER[(level - 1) % 3]][category];
  return lines[Math.floor(Math.random() * lines.length)];
}
