import type { Language } from "@/core/storage/settings";

export type LineCategory = "start" | "hit" | "hurt" | "idle" | "botWins" | "botLoses";
type Personality = "funny" | "sassy" | "wise";
type Pair = [en: string, ne: string];

// start = game opens, hit = bot took your piece, hurt = you took its piece or gave check,
// idle = random chatter, botWins / botLoses = end of game.
const LINES: Record<Personality, Record<LineCategory, Pair[]>> = {
  funny: {
    start: [
      ["Let's play! I promise to blunder only a little.", "खेलौं! म अलिअलि मात्र गल्ती गर्छु है।"],
      ["Beep boop. Warming up my brain.", "बिप बुप। दिमाग तताउँदै छु।"],
    ],
    hit: [
      ["Munch! Tasty piece.", "म्याम्! मीठो मोहोरा।"],
      ["Oops, did I do that?", "ओहो, यो मैले गरें?"],
    ],
    hurt: [
      ["Hey! I was saving that one!", "ए! त्यो त मैले जोगाएको थिएँ!"],
      ["Ouch! My feelings!", "आउच! मेरो मन दुख्यो!"],
    ],
    idle: [
      ["Take your time, I brought snacks.", "आरामले सोच, मैले खाजा ल्याएको छु।"],
      ["Is it my turn yet? Kidding.", "मेरो पालो आयो? ठट्टा गरेको।"],
    ],
    botWins: [
      ["Good game! I'll pretend that was hard.", "राम्रो खेल! गाह्रो थियो जस्तो गर्छु।"],
      ["Checkmate! Dance time!", "मात! नाच्ने बेला!"],
    ],
    botLoses: [
      ["You win! I let you. Maybe.", "तिमी जित्यौ! मैले दिएको हो। शायद।"],
      ["Wow, okay, I did not see that coming.", "वाह, यो त सोचेकै थिइनँ।"],
    ],
  },
  sassy: {
    start: [
      ["Try to keep up.", "सक्छौ भने मसँग टिक।"],
      ["Hope you stretched. Losing is tiring.", "तयार छौ? हार्नु थकाउने हुन्छ।"],
    ],
    hit: [
      ["Thanks for the gift.", "उपहारको लागि धन्यवाद।"],
      ["Was that your plan? Bold.", "यही तिम्रो योजना थियो? साहसी।"],
    ],
    hurt: [
      ["Lucky. Don't get used to it.", "भाग्य हो। बानी नपार।"],
      ["Hm. Fine. That was okay.", "हम्म। ठीक छ। त्यो ठिकै थियो।"],
    ],
    idle: [
      ["Still thinking? Take a nap.", "अझै सोच्दै? अलि सुत्न पनि सक्छौ।"],
      ["The board is getting dusty.", "बोर्डमा धुलो जम्न थाल्यो।"],
    ],
    botWins: [
      ["Better luck next time. Or skill.", "अर्को पटक भाग्य राम्रो होला। वा सीप।"],
      ["That was cute. I won.", "राम्रो प्रयास थियो। मैले जितें।"],
    ],
    botLoses: [
      ["Okay, you earned that one.", "ठिक छ, यो जित तिम्रै हो।"],
      ["Don't let it go to your head.", "टाउकोमा नचढाउ है।"],
    ],
  },
  wise: {
    start: [
      ["Every game teaches something.", "हरेक खेलले केही सिकाउँछ।"],
      ["Breathe. Think. Move.", "सास ले। सोच। चाल।"],
    ],
    hit: [
      ["A piece is lost, but the game goes on.", "एउटा मोहोरा गयो, खेल बाँकी छ।"],
      ["Patience wins more than speed.", "हतारभन्दा धैर्यले बढी जिताउँछ।"],
    ],
    hurt: [
      ["Well seen. I learn from this.", "राम्रो देख्यौ। म यसबाट सिक्छु।"],
      ["A fine move.", "राम्रो चाल।"],
    ],
    idle: [
      ["Calm minds see more squares.", "शान्त मनले धेरै घर देख्छ।"],
      ["No rush. The board waits.", "हतार छैन। बोर्ड कुरिरहन्छ।"],
    ],
    botWins: [
      ["Defeat is a good teacher. Try again.", "हार राम्रो गुरु हो। फेरि प्रयास गर।"],
      ["A good fight. Rest, then return.", "राम्रो लडाइँ। आराम गर, अनि फर्क।"],
    ],
    botLoses: [
      ["You have grown. Well played.", "तिमी बढ्यौ। राम्रो खेल्यौ।"],
      ["I bow to your play.", "तिम्रो खेलमा म नतमस्तक छु।"],
    ],
  },
};

const ORDER: Personality[] = ["funny", "sassy", "wise"];

export function pickLine(level: number, category: LineCategory, language: Language): string {
  const pairs = LINES[ORDER[(level - 1) % 3]][category];
  const pair = pairs[Math.floor(Math.random() * pairs.length)];
  return language === "ne" ? pair[1] : pair[0];
}