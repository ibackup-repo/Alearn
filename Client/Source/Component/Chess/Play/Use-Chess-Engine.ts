import { useCallback } from "react";
import { Chess } from "chess.js";
import { Pick_Engine_Move } from "@/Library/Chess-Engine";
import { SF_Best_Move } from "@/Library/Stockfish";
import type { Play_State } from "./Types";
import type { Premove } from "./Use_Premoves";

interface UseChessEngineArgs {
  State_Reference: React.MutableRefObject<Play_State | null>;
  Record_Mainline_Move: (mv: any) => void;
  force: React.Dispatch<React.SetStateAction<number>>;
  Premoves_Reference: React.MutableRefObject<Premove[]>;
  Try_Play_Premove: () => void;
  setPremoves: React.Dispatch<React.SetStateAction<Premove[]>>;
}

/**
 * Owns the "what does the bot play, and how strong is it" logic: maps the
 * configured ELO onto Stockfish skill/UCI_Elo/movetime settings, adds
 * beginner-level randomness below true engine strength, and falls back to
 * a local heuristic (`Pick_Engine_Move`) if Stockfish fails entirely.
 */
export function useChessEngine({
  State_Reference,
  Record_Mainline_Move,
  force,
  Premoves_Reference,
  Try_Play_Premove,
  setPremoves,
}: UseChessEngineArgs) {
  const Run_Engine = useCallback(async () => {
    const s = State_Reference.current;
    if (!s || s.game.isGameOver()) return;
    if (s.game.turn() === s.Player_Color) return;
    const FEN_Before = s.game.fen();
    const Elo = s.cfg.Elo;
    // Strength mapping: true beginner < 800; Stockfish UCI_Elo only from 1320.
    let SF_Options: { depth?: number; Movetime_MS?: number; skill?: number; Uci_Elo?: number };
    let Random_Chance = 0;
    if (Elo <= 400) {
      SF_Options = { skill: 0, Movetime_MS: 50, depth: 1 };
      Random_Chance = Elo <= 150 ? 0.55 : Elo <= 250 ? 0.35 : 0.18;
    } else if (Elo < 800) {
      SF_Options = { skill: Math.max(0, Math.round((Elo - 400) / 80)), Movetime_MS: 80 };
      Random_Chance = 0.08;
    } else if (Elo < 1320) {
      SF_Options = { skill: Math.round((Elo - 800) / 60), Movetime_MS: 150 };
    } else {
      SF_Options = { Uci_Elo: Math.min(3190, Elo), Movetime_MS: Math.min(1500, 200 + (Elo - 1320) * 0.6) };
    }
    let from: string | undefined, to: string | undefined, promotion: string | undefined;
    try {
      // Beginner randomness: sometimes play a random legal move.
      if (Random_Chance > 0 && Math.random() < Random_Chance) {
        const moves = s.game.moves({ verbose: true }) as Array<{ from: string; to: string; promotion?: string }>;
        if (moves.length) {
          const m = moves[Math.floor(Math.random() * moves.length)];
          from = m.from; to = m.to; promotion = m.promotion;
        }
      }
      if (!from) {
        const { Best_Move } = await SF_Best_Move(FEN_Before, SF_Options);
        if (!Best_Move) throw new Error("no bestmove");
        from = Best_Move.slice(0, 2);
        to = Best_Move.slice(2, 4);
        promotion = Best_Move.length > 4 ? Best_Move[4] : undefined;
      }
    } catch {
      const m = Pick_Engine_Move(s.game, s.cfg.Elo);
      if (!m) return;
      from = m.from; to = m.to; promotion = m.promotion;
    }
    // Position may have changed (player undo, new game, etc.) — bail out.
    if (s.game.fen() !== FEN_Before) return;
    let mv: any;
    try { mv = s.game.move({ from, to, promotion: promotion ?? "q" }); } catch { return; }
    if (!mv) return;
    Record_Mainline_Move(mv);
    force(n => n + 1);
    // Attempt to execute queued premove right after engine's response.
    // If it's now illegal, clear the whole queue.
    setTimeout(() => {
      const st = State_Reference.current;
      if (!st) return;
      const queue = Premoves_Reference.current;
      if (queue.length === 0) return;
      const head = queue[0];
      try {
        const test = new Chess(st.game.fen());
        const probe = test.move({ from: head.from, to: head.to, promotion: head.promotion ?? "q" });
        if (!probe) { setPremoves([]); return; }
      } catch { setPremoves([]); return; }
      Try_Play_Premove();
    }, 30);
  }, [State_Reference, Record_Mainline_Move, force, Premoves_Reference, Try_Play_Premove, setPremoves]);

  return { Run_Engine };
}