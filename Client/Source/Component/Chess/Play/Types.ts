import type { Chess } from "chess.js";
import type { Piece_Tracker } from "./Chess-Helpers";
import type { Game_Config } from "./Chess_Setup_Panel";
import type { Move_Variation } from "./Moves-List";

export interface Variation_Data extends Move_Variation {
  fens: string[];               // fens from parent position onward; length = sans.length + 1
  Last_Moves: Array<{ from: string; to: string }>;
}

export interface Play_State {
  game: Chess;
  tracker: Piece_Tracker;
  Player_Color: "w" | "b";
  sans: string[];
  Move_Times: number[];
  FEN_History: string[];
  Last_Moves: Array<{ from: string; to: string }>;
  White_MS: number;
  Black_MS: number;
  cfg: Game_Config;
  Started_At: number;
  Last_Move_At: number;
  variations: Variation_Data[];
  /** Set once the player resigns; game-over state derives from this OR chess.js. */
  resigned?: boolean;
}