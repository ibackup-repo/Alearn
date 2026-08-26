// Move-classification logic for the post-game analysis view.
// Powered by Stockfish.wasm (UCI) for accurate centipawn loss + best move.
import { Chess } from "chess.js";
import { SF_Evaluate } from "@/Library/Stockfish";

export type Class_Kind =
  | "brilliant" | "great" | "book" | "best" | "excellent"
  | "good" | "inaccuracy" | "mistake" | "miss" | "blunder";

export const Class_Order: Class_Kind[] = [
  "brilliant", "great", "book", "best", "excellent",
  "good", "inaccuracy", "mistake", "miss", "blunder",
];

export interface Class_Meta_Interface {
  label: string;
  short: string;
  glyph: string;     // text glyph used as the icon (emoji/symbol)
  color: string;     // HSL color used for backgrounds & dots
  text: string;      // matching tailwind text class
  bg: string;        // tinted tailwind bg class for cells
}

export const Class_Meta: Record<Class_Kind, Class_Meta_Interface> = {
  brilliant:  { label: "Brilliant",  short: "!!", glyph: "!!", color: "hsl(174 70% 45%)", text: "text-teal-400",    bg: "" },
  great:      { label: "Great",      short: "!",  glyph: "!",  color: "hsl(217 70% 55%)", text: "text-blue-400",    bg: "" },
  book:       { label: "Book",       short: "B",  glyph: "B",  color: "hsl(28 60% 55%)",  text: "text-amber-500",   bg: "" },
  best:       { label: "Best",       short: "*",  glyph: "*",  color: "hsl(142 65% 45%)", text: "text-emerald-500", bg: "" },
  excellent:  { label: "Excellent",  short: "+",  glyph: "+",  color: "hsl(142 55% 50%)", text: "text-emerald-400", bg: "" },
  good:       { label: "Good",       short: "✓",  glyph: "✓",  color: "hsl(150 50% 50%)", text: "text-green-400",   bg: "" },
  inaccuracy: { label: "Inaccuracy", short: "?!", glyph: "?!", color: "hsl(45 90% 55%)",  text: "text-yellow-500",  bg: "" },
  mistake:    { label: "Mistake",    short: "?",  glyph: "?",  color: "hsl(28 90% 55%)",  text: "text-orange-500",  bg: "" },
  miss:       { label: "Miss",       short: "x",  glyph: "x",  color: "hsl(0 70% 55%)",   text: "text-rose-500",    bg: "" },
  blunder:    { label: "Blunder",    short: "??", glyph: "??", color: "hsl(0 80% 50%)",   text: "text-red-500",     bg: "" },
};

// Tiny built-in opening book (first Plies in SAN). Anything matching counts as "book".
const Book_SAN: string[][] = [
  ["e4","e5","Nf3","Nc6","Bb5"],            // Ruy Lopez
  ["e4","e5","Nf3","Nc6","Bc4"],            // Italian
  ["e4","c5","Nf3","d6"],                    // Sicilian
  ["e4","c5","Nf3","Nc6"],                   // Sicilian
  ["e4","e6","d4","d5"],                     // French
  ["e4","c6","d4","d5"],                     // Caro-Kann
  ["d4","d5","c4"],                          // QGD
  ["d4","Nf6","c4","g6"],                    // KID
  ["d4","Nf6","c4","e6"],                    // Nimzo/QGD setups
  ["Nf3","d5","g3"],                         // Réti
  ["c4"],                                    // English
  ["e4","e5"], ["e4","c5"], ["e4","e6"], ["e4","c6"],
  ["d4","d5"], ["d4","Nf6"],
];

function Is_In_Book(SANs_So_Far: string[]): boolean {
  return Book_SAN.some(line =>
    line.length >= SANs_So_Far.length &&
    SANs_So_Far.every((s, i) => line[i] === s)
  );
}

export interface Per_Move {
  san: string;
  cpl: number;         // centipawn loss (mover's POV, >= 0)
  kind: Class_Kind;
  Accuracy: number;    // 0..100 for this move
  color: "w" | "b";
}

// Standard chess.com-style Accuracy mapping.
function Accuracy_From_CPL(cpl: number): number {
  // win% from cpl: simple sigmoid
  const winPct = 50 + 50 * (2 / (1 + Math.exp(-0.004 * -cpl)) - 1);
  return Math.max(0, Math.min(100, winPct));
}

function Classify_By_CPL(cpl: number): Class_Kind {
  if (cpl <= 10) return "best";
  if (cpl <= 25) return "excellent";
  if (cpl <= 50) return "good";
  if (cpl <= 100) return "inaccuracy";
  if (cpl <= 200) return "mistake";
  return "blunder";
}

/** Analyse a whole game using Stockfish.wasm. */
export async function Analyse_Game(
  fens: string[],
  sans: string[],
  opts: { depth?: number; onProgress?: (done: number, total: number) => void } = {},
): Promise<Per_Move[]> {
  const depth = opts.depth ?? 12;
  const out: Per_Move[] = [];
  const SANs_So_Far: string[] = [];
  for (let i = 0; i < sans.length; i++) {
    const before = new Chess(fens[i]);
    const mover: "w" | "b" = before.turn();

    // Best eval at position BEFORE move, from mover POV (Stockfish returns STM POV).
    let Best_CP = 0;
    try {
      const Eval_Before = await SF_Evaluate(fens[i], depth);
      Best_CP = Eval_Before.Score_CP;
    } catch { /* keep 0 */ }

    // Eval AFTER the played move; Stockfish returns POV of the new side-to-move
    // (= the opponent). Negate to get back to mover POV.
    let Played_CP = Best_CP;
    try {
      const Eval_After = await SF_Evaluate(fens[i + 1], Math.max(6, depth - 4));
      Played_CP = -Eval_After.Score_CP;
    } catch { /* keep Best_CP */ }

    const cpl = Math.max(0, Best_CP - Played_CP);
    let kind: Class_Kind = Classify_By_CPL(cpl);

    SANs_So_Far.push(sans[i]);
    if (i < 16 && Is_In_Book(SANs_So_Far)) kind = "book";

    out.push({
      san: sans[i],
      cpl,
      kind,
      Accuracy: Accuracy_From_CPL(cpl),
      color: mover,
    });
    opts.onProgress?.(i + 1, sans.length);
  }
  return out;
}

export interface Player_Summary {
  Accuracy: number;
  phases: { opening: number | null; middlegame: number | null; endgame: number | null };
  counts: Record<Class_Kind, number>;
  Estimated_Rating: number;
}

export function Summarise_Player(Per_Move: Per_Move[], color: "w" | "b"): Player_Summary {
  const own = Per_Move.filter(m => m.color === color);
  const avg = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;

  // Phase by ply index of the original Per_Move array.
  const open: number[] = [], mid: number[] = [], end: number[] = [];
  Per_Move.forEach((m, i) => {
    if (m.color !== color) return;
    if (i < 16) open.push(m.Accuracy);
    else if (i < 40) mid.push(m.Accuracy);
    else end.push(m.Accuracy);
  });

  const counts = Object.fromEntries(Class_Order.map(k => [k, 0])) as Record<Class_Kind, number>;
  own.forEach(m => { counts[m.kind] += 1; });

  const Accuracy = avg(own.map(m => m.Accuracy)) ?? 0;
  const blunders = counts.blunder ?? 0;
  const mistakes = counts.mistake ?? 0;
  const inacc = counts.inaccuracy ?? 0;
  const Raw_Rating = 400 + Accuracy * 28 - blunders * 80 - mistakes * 30 - inacc * 8;
  const Estimated_Rating = Math.max(100, Math.min(3200, Math.round(Raw_Rating)));

  return {
    Accuracy,
    phases: {
      opening: avg(open),
      middlegame: avg(mid),
      endgame: avg(end),
    },
    counts,
    Estimated_Rating,
  };
}

/**
 * Short human-readable explanation for a move based on its classification
 * and centipawn loss. Optionally suffixed with the engine's preferred move.
 */
export function Explain_Move(
  kind: Class_Kind,
  cpl: number,
  Best_SAN?: string,
): string {
  const lost = cpl >= 100 ? ` (lost ${(cpl / 100).toFixed(1)} pawns)` : "";
  const better = Best_SAN ? ` Engine preferred ${Best_SAN}.` : "";
  switch (kind) {
    case "brilliant": return "A brilliant move — finds the only winning idea.";
    case "great":     return "A great move — clearly the strongest continuation.";
    case "best":      return "The best move — matches the engine's top choice.";
    case "excellent": return "An excellent move — nearly engine-perfect.";
    case "good":      return "A good move — solid and safe.";
    case "book":      return "A known book move from theory.";
    case "inaccuracy":return `An inaccuracy${lost}.${better}`;
    case "mistake":   return `A mistake${lost}.${better}`;
    case "miss":      return `Missed a much stronger continuation${lost}.${better}`;
    case "blunder":   return `A blunder${lost}.${better}`;
  }
}
