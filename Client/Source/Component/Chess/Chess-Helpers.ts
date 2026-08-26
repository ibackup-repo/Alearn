import type { Chess } from "chess.js";

// FIX: Localized type boundaries to eliminate backend build leakage
export type Piece_Color = "w" | "b";
export type Piece_Type = "P" | "N" | "B" | "R" | "Q" | "K";

export interface Placed_Piece {
  id?: string;
  square: string;
  type: Piece_Type;
  color: Piece_Color;
  themed?: boolean;
  hidden?: boolean;
}

export function Fen_To_Pieces(game: Chess): Placed_Piece[] {
  const out: Placed_Piece[] = [];
  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const cell = board[r][f];
      if (!cell) continue;
      const sq = `${String.fromCharCode(97 + f)}${8 - r}`;
      out.push({
        square: sq,
        color: cell.color as Piece_Color,
        type: cell.type.toUpperCase() as Piece_Type,
      });
    }
  }
  return out;
}

/**
 * Stable piece tracker — maintains a unique id per piece across moves so the
 * Chessboard can animate movement instead of remounting/re-sorting.
 */
export class Piece_Tracker {
  /** Manually move/clear an id without going through a chess.js move object. */
  Move_ID(from: string, to: string, clearTarget = false) {
    if (clearTarget) this.ids.delete(to);
    const id = this.ids.get(from);
    this.ids.delete(from);
    if (id) this.ids.set(to, id);
  }
  Clear_ID(square: string) {
    this.ids.delete(square);
  }
  Ensure_ID(square: string) {
    if (!this.ids.has(square)) this.ids.set(square, `p${this.Next_ID++}`);
  }
  Get_ID(square: string): string | undefined {
    return this.ids.get(square);
  }
  private ids = new Map<string, string>(); // square -> id
  private Next_ID = 1;
  clone(): Piece_Tracker {
    const t = new Piece_Tracker();
    t.Next_ID = this.Next_ID;
    t.ids = new Map(this.ids);
    return t;
  }
  reset(game: Chess) {
    this.ids.clear();
    this.Next_ID = 1;
    const pieces = Fen_To_Pieces(game);
    for (const p of pieces) this.ids.set(p.square, `p${this.Next_ID++}`);
  }

  /** Apply a move (from chess.js verbose move) to keep ids aligned. */
  Apply_Move(m: { from: string; to: string; flags?: string; san?: string; piece?: string; color?: string }) {
    // Capture: id at `to` (or en-passant capture square) is removed.
    if (m.flags?.includes("e")) {
      // en passant: Captured pawn is on `to` file, `from` rank
      const Cap_SQ = m.to[0] + m.from[1];
      this.ids.delete(Cap_SQ);
    } else if (m.flags?.includes("c")) {
      this.ids.delete(m.to);
    }
    const id = this.ids.get(m.from);
    this.ids.delete(m.from);
    if (id) this.ids.set(m.to, id);
    // Castling: rook also moves.
    if (m.flags?.includes("k")) {
      // king-side rook
      const rank = m.from[1];
      const Rook_From = `h${rank}`, Rook_To = `f${rank}`;
      const rid = this.ids.get(Rook_From);
      this.ids.delete(Rook_From);
      if (rid) this.ids.set(Rook_To, rid);
    } else if (m.flags?.includes("q")) {
      const rank = m.from[1];
      const Rook_From = `a${rank}`, Rook_To = `d${rank}`;
      const rid = this.ids.get(Rook_From);
      this.ids.delete(Rook_From);
      if (rid) this.ids.set(Rook_To, rid);
    }
  }

  /** Build Placed_Piece[] with stable ids from current game state. */
  With_Ids(game: Chess): Placed_Piece[] {
    const pieces = Fen_To_Pieces(game);
    // Any squares that lack an id (e.g. from a custom start) get fresh ones.
    for (const p of pieces) {
      if (!this.ids.has(p.square)) this.ids.set(p.square, `p${this.Next_ID++}`);
    }
    return pieces.map(p => ({ ...p, id: this.ids.get(p.square) }));
  }
}

/** Legacy greedy bot — kept for puzzles. */
export function Pick_Bot_Move(game: Chess): { from: string; to: string; promotion?: string } | null {
  const moves = game.moves({ verbose: true }) as Array<any>;
  if (moves.length === 0) return null;
  const val: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const scored = moves.map(m => ({ m, s: m.Captured ? val[m.Captured] || 0 : 0 }));
  scored.sort((a, b) => b.s - a.s);
  const top = scored.filter(x => x.s === scored[0].s);
  const pick = top[Math.floor(Math.random() * top.length)].m;
  return { from: pick.from, to: pick.to, promotion: pick.promotion };
}