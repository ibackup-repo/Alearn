// Tiny single-slot caches keyed by FEN so expensive engine calls don't
// re-run on every render (e.g. clock ticks).
import type { Find_Best_Move, Find_Threat } from "@/Library/Chess-Engine";

class Fen_Cache<T> {
  private key: string | null = null;
  private val: T | null = null;
  get(k: string): T | null { return this.key === k ? this.val : null; }
  set(k: string, v: T): T { this.key = k; this.val = v; return v; }
}

export const Eval_Cache = new Fen_Cache<number>();
export const Best_Cache = new Fen_Cache<ReturnType<typeof Find_Best_Move>["move"]>();
export const Threat_Cache = new Fen_Cache<ReturnType<typeof Find_Threat>>();

export const Engine_Reply_Delay_MS = 50;