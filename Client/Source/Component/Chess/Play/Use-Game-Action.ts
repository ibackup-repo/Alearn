import { useCallback } from "react";
import { Chess } from "chess.js";
import { Piece_Tracker } from "../Chess-Helpers";
import { Random960_FEN } from "@/Library/Chess960";
import { Play_Move_Sound } from "./Use-Audio";
import type { Game_Config } from "../Chess_Setup_Panel";
import type { Per_Move } from "../Analysis/Classification";
import type { Variation_Cursor } from "../Moves-List";
import type { Play_State } from "./Types";
import type { Premove } from "./Use-Premove";

interface UseGameActionsArgs {
  State_Reference: React.MutableRefObject<Play_State | null>;
  Last_Tick_Reference: React.MutableRefObject<number>;
  force: React.Dispatch<React.SetStateAction<number>>;
  setCfg: (cfg: Game_Config | null) => void;
  Set_Selected: (sq: string | null) => void;
  Set_View_Index: (i: number) => void;
  Set_Variable_Cursor: (c: Variation_Cursor | null) => void;
  Set_Hint_Arrow: (a: { from: string; to: string } | null) => void;
  Set_Analysis_View: (v: "play" | "analysis" | "review") => void;
  Set_Per_Move: (p: Per_Move[] | null) => void;
  Set_No_Animate_Once: (v: boolean) => void;
  setPremoves: React.Dispatch<React.SetStateAction<Premove[]>>;
  /** Called right after a new game is set up, so the caller can kick off the engine's opening move if the player is Black. */
  On_Game_Started: (Player_Color: "w" | "b") => void;
}

/**
 * Owns the actions that mutate `Play_State` wholesale or reset UI view state
 * around it: starting a new game, returning to setup, rematching, undoing
 * a move pair, resigning, and recording a move that was actually played on
 * the live game (used by both the player's own moves and the engine's).
 */
export function Use_Game_Actions({
  State_Reference,
  Last_Tick_Reference,
  force,
  setCfg,
  Set_Selected,
  Set_View_Index,
  Set_Variable_Cursor,
  Set_Hint_Arrow,
  Set_Analysis_View,
  Set_Per_Move,
  Set_No_Animate_Once,
  setPremoves,
  On_Game_Started,
}: UseGameActionsArgs) {
  const Record_Mainline_Move = useCallback((mv: any) => {
    const s = State_Reference.current;
    if (!s) return;
    const now = performance.now();
    const seconds = (now - s.Last_Move_At) / 1000;
    s.Last_Move_At = now;
    s.tracker.Apply_Move(mv);
    s.sans.push(mv.san);
    s.Move_Times.push(seconds);
    s.FEN_History.push(s.game.fen());
    s.Last_Moves.push({ from: mv.from, to: mv.to });
    if (s.cfg.timer.Inc_MS && s.cfg.timer.Base_MS > 0) {
      if (mv.color === "w") s.White_MS += s.cfg.timer.Inc_MS;
      else s.Black_MS += s.cfg.timer.Inc_MS;
    }
    Play_Move_Sound(mv.Captured ? "capture" : "move");
  }, [State_Reference]);

  const startGame = useCallback((gc: Game_Config) => {
    const fen = gc.variant === "960" ? Random960_FEN() : undefined;
    const game = fen ? new Chess(fen) : new Chess();
    const tracker = new Piece_Tracker();
    tracker.reset(game);
    const Player_Color: "w" | "b" =
      gc.color === "random" ? (Math.random() < 0.5 ? "w" : "b") : gc.color === "white" ? "w" : "b";
    const now = performance.now();
    State_Reference.current = {
      game, tracker, Player_Color, sans: [], Move_Times: [],
      FEN_History: [game.fen()], Last_Moves: [],
      White_MS: gc.timer.Base_MS, Black_MS: gc.timer.Base_MS, cfg: gc,
      Started_At: now, Last_Move_At: now,
      variations: [],
    };
    Last_Tick_Reference.current = now;
    setCfg(gc);
    Set_Selected(null);
    Set_View_Index(-1);
    Set_Variable_Cursor(null);
    Set_Hint_Arrow(null);
    Set_Analysis_View("play");
    Set_Per_Move(null);
    setPremoves([]);
    Set_No_Animate_Once(true);
    force(n => n + 1);
    On_Game_Started(Player_Color);
  }, [State_Reference, Last_Tick_Reference, force, setCfg, Set_Selected, Set_View_Index, Set_Variable_Cursor, Set_Hint_Arrow, Set_Analysis_View, Set_Per_Move, setPremoves, Set_No_Animate_Once, On_Game_Started]);

  const Reset_To_Setup = useCallback(() => {
    State_Reference.current = null;
    setCfg(null);
    Set_Selected(null);
    Set_View_Index(-1);
    Set_Variable_Cursor(null);
    Set_Hint_Arrow(null);
    Set_Analysis_View("play");
    Set_Per_Move(null);
    setPremoves([]);
  }, [State_Reference, setCfg, Set_Selected, Set_View_Index, Set_Variable_Cursor, Set_Hint_Arrow, Set_Analysis_View, Set_Per_Move, setPremoves]);

  const rematch = useCallback(() => {
    const s = State_Reference.current;
    if (s) startGame(s.cfg);
  }, [State_Reference, startGame]);

  const Undo_Move = useCallback(() => {
    const s = State_Reference.current;
    if (!s || s.sans.length === 0) return;
    const target = s.game.turn() === s.Player_Color ? 2 : 1;
    for (let i = 0; i < target && s.sans.length > 0; i++) {
      s.game.undo();
      s.sans.pop();
      s.Move_Times.pop();
      s.FEN_History.pop();
      s.Last_Moves.pop();
    }
    const t = new Piece_Tracker();
    t.reset(s.game);
    s.tracker = t;
    Set_Selected(null);
    Set_Hint_Arrow(null);
    Set_No_Animate_Once(true);
    force(n => n + 1);
  }, [State_Reference, Set_Selected, Set_Hint_Arrow, Set_No_Animate_Once, force]);

  const resign = useCallback(() => {
    const s = State_Reference.current;
    if (!s || s.game.isGameOver()) return;
    s.resigned = true;
    force(n => n + 1);
  }, [State_Reference, force]);

  return {
    Record_Mainline_Move,
    startGame,
    Reset_To_Setup,
    rematch,
    Undo_Move,
    resign,
  };
}