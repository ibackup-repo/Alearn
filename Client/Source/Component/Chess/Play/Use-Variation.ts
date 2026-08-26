import { useCallback, useState } from "react";
import { Chess } from "chess.js";
import type { Move_Variation, Variation_Cursor } from "./Moves-List";
import type { Play_State, Variation_Data } from "./Types";

interface UseVariationsArgs {
  State_Reference: React.MutableRefObject<Play_State | null>;
  /** Current mainline viewing index (-1 = live), needed when branching off the mainline. */
  View_Index: number;
  force: React.Dispatch<React.SetStateAction<number>>;
  Set_Selected: (sq: string | null) => void;
  Set_Hint_Arrow: (a: { from: string; to: string } | null) => void;
  Set_No_Animate_Once: (v: boolean) => void;
  Play_Move_Sound: (kind: "move" | "capture") => void;
}

export function useVariations({
  State_Reference,
  View_Index,
  force,
  Set_Selected,
  Set_Hint_Arrow,
  Set_No_Animate_Once,
  Play_Move_Sound,
}: UseVariationsArgs) {
  const [Var_Cursor, Set_Variable_Cursor] = useState<Variation_Cursor | null>(null);

  // Try to make a move during review (creates / extends a variation).
  const Try_Variation_Move = useCallback((from: string, to: string, viaDrag = false): boolean => {
    const s = State_Reference.current;
    if (!s) return false;

    // Ensure array exists
    if (!s.variations) {
      s.variations = [];
    }

    // Determine base FEN and current variation context.
    let baseFen: string;
    let Parent_Index: number;
    if (Var_Cursor) {
      const v = s.variations[Var_Cursor.varIndex];
      if (!v) return false;
      baseFen = v.fens[Var_Cursor.step + 1];
      Parent_Index = v.Parent_Index;
    } else {
      // Mainline review at View_Index.
      baseFen = s.FEN_History[View_Index + 1];
      Parent_Index = View_Index;
    }

    let g: Chess;
    try { g = new Chess(baseFen); } catch { return false; }
    let mv: any;
    try { mv = g.move({ from, to, promotion: "q" }); } catch { return false; }
    if (!mv) return false;

    if (Var_Cursor) {
      const v = s.variations[Var_Cursor.varIndex];
      // If next step already matches, just advance.
      const existingNext = v.sans[Var_Cursor.step + 1];
      if (existingNext === mv.san) {
        Set_Variable_Cursor({ varIndex: Var_Cursor.varIndex, step: Var_Cursor.step + 1 });
      } else {
        // Truncate variation past current step and append.
        v.sans = v.sans.slice(0, Var_Cursor.step + 1);
        v.fens = v.fens.slice(0, Var_Cursor.step + 2);
        v.Last_Moves = v.Last_Moves.slice(0, Var_Cursor.step + 1);
        v.sans.push(mv.san);
        v.fens.push(g.fen());
        v.Last_Moves.push({ from: mv.from, to: mv.to });
        Set_Variable_Cursor({ varIndex: Var_Cursor.varIndex, step: v.sans.length - 1 });
      }
    } else {
      // Mainline branch: check if a variation already exists at this parent with same first san.
      const existing = s.variations.findIndex(
        v => v.Parent_Index === Parent_Index && v.sans[0] === mv.san
      );
      if (existing >= 0) {
        Set_Variable_Cursor({ varIndex: existing, step: 0 });
      } else {
        const v: Variation_Data = {
          Parent_Index,
          sans: [mv.san],
          fens: [baseFen, g.fen()],
          Last_Moves: [{ from: mv.from, to: mv.to }],
        };
        s.variations.push(v);
        Set_Variable_Cursor({ varIndex: s.variations.length - 1, step: 0 });
      }
    }
    Play_Move_Sound(mv.Captured ? "capture" : "move");
    Set_Selected(null);
    Set_Hint_Arrow(null);
    if (viaDrag) Set_No_Animate_Once(true);
    force(n => n + 1);
    return true;
  }, [State_Reference, Var_Cursor, View_Index, force, Set_Selected, Set_Hint_Arrow, Set_No_Animate_Once, Play_Move_Sound]);

  const Compute_Variation_View = useCallback(() => {
    const s = State_Reference.current;
    if (!s || !Var_Cursor || !s.variations) return null;
    const v = s.variations[Var_Cursor.varIndex];
    if (!v) return null;
    return { fen: v.fens[Var_Cursor.step + 1], Last_Move: v.Last_Moves[Var_Cursor.step] };
  }, [State_Reference, Var_Cursor]);

  return {
    Var_Cursor,
    Set_Variable_Cursor,
    Try_Variation_Move,
    Compute_Variation_View,
  };
}

export type { Move_Variation, Variation_Cursor };