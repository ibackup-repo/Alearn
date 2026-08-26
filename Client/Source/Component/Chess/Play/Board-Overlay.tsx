import { useMemo } from "react";
import { Chess } from "chess.js";
import { Piece_Tracker } from "@/Component/Chess/Chess-Helpers";
import { Is_Premove_Legal, Board_From_FEN, SQ_To_RC, Apply_Premove_To_FEN } from "@/Component/Chess/Play/Chessboard-FEN";
import { evaluate, Find_Best_Move, Find_Threat } from "@/Library/Chess-Engine";
import { Eval_Cache, Best_Cache, Threat_Cache } from "@/Component/Chess/Play/Engine-Cache";
import type { Play_State, Premove } from "@/Component/Chess/Play/Types";

interface Use_Board_Overlay_Properties {
  s: Play_State | null;
  live: boolean;
  reviewing: boolean;
  View_Game: Chess;
  selected: string | null;
  Premoves: Premove[];
  Hint_Arrow: { from: string; to: string } | null;
  Eval_Bar_Config?: boolean;
  Suggestion_Arrows_Config?: boolean;
  Threat_Arrows_Config?: boolean;
  Idle_Pieces: any[];
}

export function Use_Board_Overlay({
  s,
  live,
  reviewing,
  View_Game,
  selected,
  Premoves,
  Hint_Arrow,
  Eval_Bar_Config,
  Suggestion_Arrows_Config,
  Threat_Arrows_Config,
  Idle_Pieces,
}: Use_Board_Overlay_Properties) {
  const Premove_Key = useMemo(
    () => Premoves.map((pm) => `${pm.from}${pm.to}${pm.promotion ?? ""}`).join(","),
    [Premoves]
  );

  const Live_Fen_For_Pieces = s?.game.fen() ?? "";

  // 1. Pieces array for current live/reviewing board state
  const pieces = useMemo(() => {
    if (!s) return Idle_Pieces;
    if (reviewing) {
      const t = new Piece_Tracker();
      t.reset(View_Game);
      return t.With_Ids(View_Game);
    }
    return s.tracker.With_Ids(s.game);
  }, [s, reviewing, View_Game, Live_Fen_For_Pieces, Idle_Pieces]);

  // 2. Projected board pieces when Premoves are queued
  const Projected_Pieces = useMemo(() => {
    if (!s || !live || Premoves.length === 0) return null;
    let fen = s.game.fen();
    const t = s.tracker.clone();
    const hiddenSquares = new Set<string>();

    for (const pm of Premoves) {
      if (!Is_Premove_Legal(fen, pm.from, pm.to, s.Player_Color)) return null;
      const before = Board_From_FEN(fen);
      const { file: fFile, rank: fRank } = SQ_To_RC(pm.from);
      const { file: tFile, rank: tRank } = SQ_To_RC(pm.to);
      const moving = before[fRank][fFile];
      const targetBefore = before[tRank][tFile];
      const isEnPassant = moving?.type === "p" && fFile !== tFile && !targetBefore;
      const { fen: nextFen, Hidden_King_Square } = Apply_Premove_To_FEN(
        fen,
        pm.from,
        pm.to,
        pm.promotion ?? "q",
        s.Player_Color
      );

      if (Hidden_King_Square) hiddenSquares.add(Hidden_King_Square);

      if (isEnPassant) {
        const Cap_SQ = `${"abcdefgh"[tFile]}${pm.from[1]}`;
        (t as any).ids.delete(Cap_SQ);
      } else if (targetBefore) {
        (t as any).ids.delete(pm.to);
      }
      const id = (t as any).ids.get(pm.from);
      (t as any).ids.delete(pm.from);
      if (id) (t as any).ids.set(pm.to, id);
      if (moving?.type === "k" && Math.abs(tFile - fFile) === 2) {
        const kingside = tFile > fFile;
        const rank = pm.from[1];
        const Rook_From = kingside ? `h${rank}` : `a${rank}`;
        const Rook_To = kingside ? `f${rank}` : `d${rank}`;
        const rid = (t as any).ids.get(Rook_From);
        (t as any).ids.delete(Rook_From);
        if (rid) (t as any).ids.set(Rook_To, rid);
      }

      fen = nextFen;
    }

    const board = Board_From_FEN(fen);
    const outPieces: any[] = [];
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const p = board[rank][file];
        if (!p) continue;
        const square = `${"abcdefgh"[file]}${rank + 1}`;
        if (hiddenSquares.has(square)) continue;
        if (!(t as any).ids.has(square)) (t as any).ids.set(square, `p${(t as any).Next_ID++}`);
        outPieces.push({ square, color: p.color, type: p.type.toUpperCase(), id: (t as any).ids.get(square) });
      }
    }
    return outPieces;
  }, [s, live, Premove_Key, Live_Fen_For_Pieces]);

  // Helper calculation for projected board instance
  const Projected_Board = useMemo(() => {
    if (!s || Premoves.length === 0) return null;
    let fen = s.game.fen();
    for (const pm of Premoves) {
      if (!Is_Premove_Legal(fen, pm.from, pm.to, s.Player_Color)) return null;
      fen = Apply_Premove_To_FEN(fen, pm.from, pm.to, pm.promotion ?? "q", s.Player_Color).fen;
    }
    try {
      return new Chess(fen);
    } catch {
      return null;
    }
  }, [s, Premove_Key]);

  // 3. Highlighted legal target squares
  const legal: string[] = useMemo(() => {
    if (!s || !selected) return [];
    if (live && s.game.turn() !== s.Player_Color) {
      const proj = Projected_Board;
      if (!proj) return [];
      const fen = proj.fen();
      const parts = fen.split(" ");
      parts[1] = s.Player_Color;
      parts[3] = "-";
      try {
        const g = new Chess(parts.join(" "));
        const normal = (g.moves({ square: selected as any, verbose: true }) as any[]).map((m: any) => m.to);
        const ownSquares = (proj.board().flat().filter(Boolean) as any[])
          .filter((p) => p.color === s.Player_Color)
          .map((p) => p.square)
          .filter((sq) => sq !== selected && !normal.includes(sq))
          .filter((sq) => Is_Premove_Legal(fen, selected, sq, s.Player_Color));
        return [...normal, ...ownSquares];
      } catch {
        return [];
      }
    }
    return (View_Game.moves({ square: selected as any, verbose: true }) as any[]).map((m: any) => m.to);
  }, [s, selected, live, View_Game, Premove_Key, Projected_Board]);

  // 4. Highlighted premove squares
  const Premove_Squares = useMemo(
    () => (live ? Premoves.flatMap((pm) => [pm.from, pm.to]) : []),
    [live, Premove_Key]
  );

  // 5. Engine / Analysis overlay arrows and evaluation score
  const Live_Fen_For_Arrows = s?.game.fen() ?? "";
  const View_Fen = s ? View_Game.fen() : "";

  const Eval_Score = s && Eval_Bar_Config
    ? Eval_Cache.get(View_Fen) ?? Eval_Cache.set(View_Fen, evaluate(View_Game))
    : null;

  const suggestion = s && live && Suggestion_Arrows_Config
    ? Best_Cache.get(Live_Fen_For_Arrows) ?? Best_Cache.set(Live_Fen_For_Arrows, Find_Best_Move(s.game, 2).move)
    : null;

  const threat = s && live && Threat_Arrows_Config
    ? Threat_Cache.get(Live_Fen_For_Arrows) ?? Threat_Cache.set(Live_Fen_For_Arrows, Find_Threat(s.game))
    : null;

  const Analysis_Arrows = useMemo(
    () => [
      ...(suggestion ? [{ from: suggestion.from, to: suggestion.to, color: "hsl(142 70% 45% / 0.85)" }] : []),
      ...(threat ? [{ from: threat.from, to: threat.to, color: "hsl(0 75% 55% / 0.85)" }] : []),
      ...(Hint_Arrow ? [{ from: Hint_Arrow.from, to: Hint_Arrow.to, color: "hsl(48 96% 53% / 0.9)" }] : []),
    ],
    [suggestion, threat, Hint_Arrow]
  );

  return {
    pieces,
    Projected_Pieces,
    Projected_Board,
    legal,
    Premove_Squares,
    Eval_Score,
    Analysis_Arrows,
  };
}