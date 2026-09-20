import { useCallback, useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Apply_Premove_To_FEN, Is_Premove_Legal } from "./Chessboard-FEN";
import type { Play_State } from "./Types";

export interface Premove {
  from: string;
  to: string;
  promotion?: string;
}

interface UsePremovesArgs {
  State_Reference: React.MutableRefObject<Play_State | null>;
  /** Records a move that has actually been played on the live game. */
  Record_Mainline_Move: (mv: any) => void;
  /** Forces a re-render (bumps the refresh counter). */
  force: React.Dispatch<React.SetStateAction<number>>;
  /** Schedules the engine's reply after our move, if configured. */
  Schedule_Engine_Reply: () => void;
  /** True while a piece is being dragged, to suppress move animation. */
  Set_No_Animate_Once: (v: boolean) => void;
}

/**
 * FIFO premove queue, validated against the projected (post-premove) board
 * rather than the live game — this is what lets Premoves chain correctly
 * (e.g. queuing a second premove for a piece that only "exists" on its
 * destination square because of an earlier queued premove).
 */
export function Use_Premoves({
  State_Reference,
  Record_Mainline_Move,
  force,
  Schedule_Engine_Reply,
  Set_No_Animate_Once,
}: UsePremovesArgs) {
  const [Premoves, setPremoves] = useState<Premove[]>([]);
  const Premoves_Reference = useRef<Premove[]>([]);
  useEffect(() => { Premoves_Reference.current = Premoves; }, [Premoves]);

  const Projected_Board = useCallback((extra?: Premove) => {
    const st = State_Reference.current;
    if (!st) return null;

    let fen = st.game.fen();
    const steps = [...Premoves, ...(extra ? [extra] : [])];

    for (const pm of steps) {
      if (!Is_Premove_Legal(fen, pm.from, pm.to, st.Player_Color)) return null;
      const result = Apply_Premove_To_FEN(fen, pm.from, pm.to, pm.promotion ?? "q", st.Player_Color);
      fen = result.fen;
    }

    try { return new Chess(fen); } catch { return null; }
  }, [Premoves, State_Reference]);

  const Queue_Premove = useCallback((from: string, to: string, viaDrag = false) => {
    const s = State_Reference.current;
    if (!s) return;
    const projected = Projected_Board();
    if (!projected) return;
    const piece = projected.get(from as any);
    if (!piece || piece.color !== s.Player_Color) return;
    if (!Is_Premove_Legal(projected.fen(), from, to, s.Player_Color)) return;
    setPremoves(prev => [...prev, { from, to }]);
    if (viaDrag) Set_No_Animate_Once(true);
  }, [State_Reference, Projected_Board, Set_No_Animate_Once]);

  const Cancel_Premoves = useCallback(() => setPremoves([]), []);

  const Try_Play_Premove = useCallback(() => {
    const s = State_Reference.current;
    const queue = Premoves_Reference.current;
    if (!s || queue.length === 0) return;
    if (s.game.isGameOver() || s.game.turn() !== s.Player_Color) return;
    const [head, ...rest] = queue;
    try {
      const mv = s.game.move({ from: head.from, to: head.to, promotion: head.promotion ?? "q" });
      if (!mv) { setPremoves([]); return; }
      Record_Mainline_Move(mv);
      setPremoves(rest);
      Set_No_Animate_Once(true);
      force(n => n + 1);
      if (!s.game.isGameOver() && s.cfg.engine) Schedule_Engine_Reply();
    } catch { setPremoves([]); }
  }, [State_Reference, Record_Mainline_Move, Set_No_Animate_Once, force, Schedule_Engine_Reply]);

  return {
    Premoves,
    Premoves_Reference,
    setPremoves,
    Projected_Board,
    Queue_Premove,
    Cancel_Premoves,
    Try_Play_Premove,
  };
}