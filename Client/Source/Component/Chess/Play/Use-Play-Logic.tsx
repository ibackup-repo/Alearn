import { useState, useEffect, useCallback, type RefObject } from "react";
import { Chess } from "chess.js";
import { Find_Best_Move } from "@/Library/Chess-Engine";
import { Is_Premove_Legal } from "@/Component/Chess/Play/Chessboard-FEN";
import { Engine_Reply_Delay_MS } from "@/Component/Chess/Play/Engine-Cache";
import type { Play_State } from "@/Component/Chess/Play/Types";
import type { Game_Config } from "@/Component/Chess/Chess-Setup-Panel";

interface UsePlayLogicProperties {
  cfg: Game_Config | null;
  State_Reference: RefObject<Play_State | null>;
  View_Index: number;
  Var_Cursor: any;
  selected: string | null;
  Set_Selected: (sq: string | null) => void;
  Set_View_Index: (index: number) => void;
  Set_Hint_Arrow: (arrow: { from: string; to: string } | null) => void;
  Set_No_Animate_Once: (val: boolean) => void;
  Set_Variable_Cursor_External: (cursor: any) => void;
  Try_Variation_Move: (from: string, to: string, viaDrag?: boolean) => boolean;
  Compute_Variation_View: () => any;
  Record_Mainline_Move: (mv: any) => void;
  Queue_Premove: (from: string, to: string, viaDrag?: boolean) => void;
  Run_EngineRef: RefObject<() => void>;
  Projected_Board: Chess | null;
  force: (cb: (n: number) => number) => void;
}

export function usePlayLogic({
  cfg,
  State_Reference,
  View_Index,
  Var_Cursor,
  selected,
  Set_Selected,
  Set_View_Index,
  Set_Hint_Arrow,
  Set_No_Animate_Once,
  Set_Variable_Cursor_External,
  Try_Variation_Move,
  Compute_Variation_View,
  Record_Mainline_Move,
  Queue_Premove,
  Run_EngineRef,
  Projected_Board,
  force,
}: UsePlayLogicProperties) {
  // ── 1. Viewport-Based Board Sizing ────────────────────────────────────────
  const [Max_Board_Size, setMaxBoardSize] = useState<number>(500);

  const Calculate_Size = useCallback(() => {
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    if (vw >= 960) {
      const headerOffset = 64;
      const padding = 32;
      const sidebarWidth = vw >= 1280 ? 384 : vw >= 1024 ? 320 : 288;

      const availableHeight = vh - headerOffset - padding;
      const Available_Width = vw - sidebarWidth - padding;

      const target = Math.max(240, Math.min(availableHeight, Available_Width));
      setMaxBoardSize(target);
    } else {
      setMaxBoardSize(Math.max(200, vw - 32));
    }
  }, []);

  const Set_Container_Ref = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;

      Calculate_Size();
      window.addEventListener("resize", Calculate_Size);

      return () => {
        window.removeEventListener("resize", Calculate_Size);
      };
    },
    [Calculate_Size]
  );

  useEffect(() => {
    Calculate_Size();
  }, [Calculate_Size, cfg]);

  // ── 2. Keyboard Navigation Controls ──────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = State_Reference.current;
      if (!s) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (Var_Cursor) {
          if (Var_Cursor.step > 0) {
            Set_Variable_Cursor_External({ ...Var_Cursor, step: Var_Cursor.step - 1 });
          } else {
            Set_Variable_Cursor_External(null);
            Set_View_Index(s.variations[Var_Cursor.varIndex].Parent_Index);
          }
          Set_No_Animate_Once(true);
          return;
        }
        const current = View_Index === -1 ? s.sans.length - 1 : View_Index - 1;
        if (current >= -1) {
          Set_No_Animate_Once(true);
          Set_View_Index(current);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (Var_Cursor) {
          const v = s.variations[Var_Cursor.varIndex];
          if (Var_Cursor.step + 1 < v.sans.length) {
            Set_Variable_Cursor_External({ ...Var_Cursor, step: Var_Cursor.step + 1 });
            Set_No_Animate_Once(true);
          }
          return;
        }
        if (View_Index === -1) return;
        const next = View_Index + 1;
        Set_No_Animate_Once(true);
        Set_View_Index(next >= s.sans.length - 1 ? -1 : next);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [View_Index, Var_Cursor, State_Reference, Set_Variable_Cursor_External, Set_View_Index, Set_No_Animate_Once]);

  // ── 3. Move Logic & View Helpers ──────────────────────────────────────────
  const Compute_View = useCallback(() => {
    const s = State_Reference.current!;
    const varView = Compute_Variation_View();
    if (varView) return varView;
    if (View_Index === -1) {
      return {
        fen: s.game.fen(),
        Last_Move: s.Last_Moves.length ? s.Last_Moves[s.Last_Moves.length - 1] : null,
      };
    }
    return {
      fen: s.FEN_History[View_Index + 1],
      Last_Move: View_Index >= 0 ? s.Last_Moves[View_Index] : null,
    };
  }, [State_Reference, Compute_Variation_View, View_Index]);

  const On_Move = useCallback(
    (from: string, to: string, viaDrag = false) => {
      const s = State_Reference.current;
      if (!s) return;
      const live = View_Index === -1 && Var_Cursor == null;
      if (!live) {
        Try_Variation_Move(from, to, viaDrag);
        return;
      }
      if (s.game.isGameOver()) return;
      if (s.game.turn() !== s.Player_Color) {
        Queue_Premove(from, to, viaDrag);
        return;
      }
      try {
        const mv = s.game.move({ from, to, promotion: "q" });
        if (!mv) return;
        Record_Mainline_Move(mv);
        Set_Selected(null);
        Set_Hint_Arrow(null);
        if (viaDrag) Set_No_Animate_Once(true);
        force((n) => n + 1);
        if (!s.game.isGameOver() && s.cfg.engine) {
          setTimeout(() => Run_EngineRef.current?.(), Engine_Reply_Delay_MS);
        }
      } catch {
        /* illegal move */
      }
    },
    [
      State_Reference,
      View_Index,
      Var_Cursor,
      Try_Variation_Move,
      Queue_Premove,
      Record_Mainline_Move,
      Set_Selected,
      Set_Hint_Arrow,
      Set_No_Animate_Once,
      force,
      Run_EngineRef,
    ]
  );

  const Handle_Square = useCallback(
    (sq: string) => {
      const s = State_Reference.current;
      if (!s) return;
      const live = View_Index === -1 && Var_Cursor == null;
      const viewing = !live;

      if (viewing) {
        const viewData = Compute_View();
        let g: Chess;
        try {
          g = new Chess(viewData.fen);
        } catch {
          return;
        }
        const piece = g.get(sq as any);
        const currentTurn = g.turn();

        if (selected) {
          if (sq === selected) {
            Set_Selected(null);
            return;
          }
          const moves = g.moves({ square: selected as any, verbose: true }) as any[];
          if (moves.some((m) => m.to === sq)) {
            Set_No_Animate_Once(true);
            Try_Variation_Move(selected, sq, false);
            return;
          }
          if (piece && piece.color === currentTurn) {
            Set_Selected(sq);
          } else {
            Set_Selected(null);
          }
          return;
        }

        if (piece && piece.color === currentTurn) {
          Set_Selected(sq);
        }
        return;
      }

      if (s.game.isGameOver()) return;
      const myTurn = s.game.turn() === s.Player_Color;
      const proj = myTurn ? null : Projected_Board;
      const piece = myTurn ? s.game.get(sq as any) : proj?.get(sq as any);

      if (selected) {
        if (sq === selected) {
          Set_Selected(null);
          return;
        }
        if (myTurn) {
          const moves = s.game.moves({ square: selected as any, verbose: true }) as any[];
          if (moves.some((m) => m.to === sq)) {
            On_Move(selected, sq, false);
            return;
          }
          if (piece && piece.color === s.Player_Color) Set_Selected(sq);
          else Set_Selected(null);
          return;
        }
        const own = proj?.get(selected as any);
        if (own && own.color === s.Player_Color && sq !== selected) {
          let legalPremove = false;
          if (proj) {
            legalPremove = Is_Premove_Legal(proj.fen(), selected, sq, s.Player_Color);
          }
          if (legalPremove) {
            Queue_Premove(selected, sq);
            return;
          }
          if (piece && piece.color === s.Player_Color) {
            Set_Selected(sq);
            return;
          }
        }
        Set_Selected(null);
        return;
      }

      if (piece && piece.color === s.Player_Color) {
        Set_Selected(sq);
      }
    },
    [
      State_Reference,
      View_Index,
      Var_Cursor,
      Compute_View,
      selected,
      Set_Selected,
      Set_No_Animate_Once,
      Try_Variation_Move,
      Projected_Board,
      On_Move,
      Queue_Premove,
    ]
  );

  const Clear_Selection = useCallback(() => Set_Selected(null), [Set_Selected]);

  const Show_Hint = useCallback(() => {
    const s = State_Reference.current;
    if (!s || s.game.isGameOver() || s.game.turn() !== s.Player_Color) return;
    const best = Find_Best_Move(s.game, 2).move;
    if (best) Set_Hint_Arrow({ from: best.from, to: best.to });
  }, [State_Reference, Set_Hint_Arrow]);

  return {
    Set_Container_Ref,
    Max_Board_Size,
    Compute_View,
    On_Move,
    Handle_Square,
    Clear_Selection,
    Show_Hint,
  };
}