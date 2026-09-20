// Custom chessboard renderer using Wikimedia Commons SVG pieces.
// Unified Pointer Events for click/drag:
//  - PointerDown on a piece: lift it centered at the cursor.
//  - Below DRAG_THRESHOLD movement → click-select (release on same square).
//  - Past threshold → drag mode; release on legal target plays the move.
// Right-click / right-drag handles arrows + highlights and (via callback)
// cancels queued Premoves when right-clicking on a premove square.
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/Library/Utility";
import { Class_Meta, type Class_Kind } from "./Analysis/Classification";

// FIX: Localized type boundaries to eliminate backend build leakage
export type Piece_Color = "w" | "b";
export type Piece_Type = "p" | "n" | "b" | "r" | "q" | "k" | "P" | "N" | "B" | "R" | "Q" | "K";

export interface Placed_Piece {
  id?: string;
  square: string;
  type: Piece_Type | string;
  color: Piece_Color;
  themed?: boolean;
  hidden?: boolean;
}

export interface Arrow {
  from: string;
  to: string;
  color?: string;
}

const DRAG_THRESHOLD = 6;     // px – distance before we treat as drag
const PREMOVE_TINT  = "rgba(220, 38, 38, 0.35)";

const PIECE_URL: Record<string, string> = {
  wK: "https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg",
  wQ: "https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg",
  wR: "https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg",
  wB: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg",
  wN: "https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg",
  wP: "https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg",
  bK: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg",
  bQ: "https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg",
  bR: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg",
  bB: "https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg",
  bN: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg",
  bP: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg",
};

interface Properties {
  pieces: Placed_Piece[];
  Stars?: string[];
  orientation?: "white" | "black";
  selected?: string | null;
  Legal_Squares?: string[];
  Last_Move?: { from: string; to: string } | null;
  arrows?: Arrow[];
  arrowLengthScale?: number;
  onSquareClick?: (square: string) => void;
  onPieceDrop?: (from: string, to: string) => void;
  onDragBegin?: (square: string) => void;
  interactive?: boolean;
  Input_Mode?: "click" | "drag" | "both";
  animate?: boolean;
  animationMs?: number;
  className?: string;
  moveBadge?: { square: string; kind: Class_Kind } | null;
  /** Squares involved in any queued premove (tinted red). */
  Premove_Squares?: string[];
  /** Called when user right-Clicks a premove square to cancel the queue. */
  onCancelPremoves?: () => void;
  /** Called on any right-click — used to clear current selection. */
  onClearSelection?: () => void;
  /** When set, only pieces of this color can be Picked up/dragged. */
  interactiveColor?: Piece_Color;
}

function Square_To_XY(sq: string, orientation: "white" | "black") {
  const file = sq.charCodeAt(0) - "a".charCodeAt(0);
  const rank = parseInt(sq[1], 10) - 1;
  const col = orientation === "white" ? file : 7 - file;
  const row = orientation === "white" ? 7 - rank : rank;
  return { col, row };
}

function Is_Dark_Theme(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

function Get_Piece_Color(p: Placed_Piece, dark: boolean): Piece_Color {
  if (!p.themed) return p.color;
  return dark ? "w" : "b";
}

interface Drag_State {
  pointerId: number;
  From_Square: string;
  startX: number; startY: number;
  curX: number; curY: number;
  isDragging: boolean;
}

// ── OPTIMIZED BACKGROUND LAYER SUB-COMPONENT ─────────────────
const Board_Grid = memo(({
  orientation, selected, Stars, highlights, Legal_Squares, pieces, Last_Move, Premove_Squares, clickEnabled, dragActive, onSquareClick, sq
}: {
  orientation: "white" | "black"; selected: string | null | undefined; Stars: string[]; highlights: Set<string>;
  Legal_Squares: string[]; pieces: Placed_Piece[]; Last_Move: any; Premove_Squares: string[]; clickEnabled: boolean; dragActive: boolean;
  onSquareClick: any; sq: number;
}) => {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const visualFiles = orientation === "white" ? files : [...files].reverse();
  const visualRanks = orientation === "white" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="absolute inset-0 grid" style={{ gridTemplateColumns: "repeat(8, 1fr)", gridTemplateRows: "repeat(8, 1fr)" }}>
      {visualRanks.map((rank, rIdx) =>
        visualFiles.map((file, fIdx) => {
          const square = `${file}${rank}`;
          const isLight = (rIdx + fIdx) % 2 === 0;
          const Is_Sel = selected === square;
          const hasStar = Stars.includes(square);
          const isHighlighted = highlights.has(square);
          const isLegal = Legal_Squares.includes(square);
          const hasPieceOnLegal = isLegal && pieces.some(p => p.square === square);
          const isLastMove = Last_Move && (Last_Move.from === square || Last_Move.to === square);
          const isPremove = Premove_Squares.includes(square);
          return (
            <button
              type="button"
              key={square}
              onClick={() => {
                if (dragActive) return;
                if (clickEnabled) onSquareClick?.(square);
              }}
              className={cn(
                "relative flex items-center justify-center p-0 m-0 outline-none",
                isLight ? "bg-[#f0d9b5]" : "bg-[#b58863]",
              )}
            >
              {isLastMove && !Is_Sel && (
                <span className="absolute inset-0 bg-sky-400/40 pointer-events-none" />
              )}
              {Is_Sel && (
                <span className="absolute inset-0 bg-sky-400/55 pointer-events-none" />
              )}
              {isHighlighted && (
                <span className="absolute inset-0 bg-red-500/55 pointer-events-none" />
              )}
              {isPremove && (
                <span
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: PREMOVE_TINT }}
                />
              )}
              {isLegal && !hasPieceOnLegal && (
                <span className="absolute rounded-full bg-black/30 pointer-events-none" style={{ width: "30%", height: "30%" }} />
              )}
              {isLegal && hasPieceOnLegal && (
                <span className="absolute inset-[6%] rounded-full pointer-events-none" style={{ boxShadow: "inset 0 0 0 4px rgba(0,0,0,0.35)" }} />
              )}
              {hasStar && (
                <svg viewBox="0 0 24 24" className="w-1/2 h-1/2 drop-shadow animate-scale-in" aria-hidden>
                  <polygon
                    points="12,2 14.9,9 22,9.3 16.5,13.9 18.4,21 12,16.9 5.6,21 7.5,13.9 2,9.3 9.1,9"
                    fill="#facc15"
                    stroke="#a16207"
                    strokeWidth="0.8"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {fIdx === 0 && (
                <span className="absolute top-0.5 left-1 opacity-60 font-mono text-black leading-none" style={{ fontSize: `${Math.max(8, sq * 0.18)}px` }}>
                  {rank}
                </span>
              )}
              {rIdx === 7 && (
                <span className="absolute bottom-0.5 right-1 opacity-60 font-mono text-black leading-none" style={{ fontSize: `${Math.max(8, sq * 0.18)}px` }}>
                  {file}
                </span>
              )}
            </button>
          );
        })
      )}
    </div>
  );
});
Board_Grid.Display_Name = "Board_Grid";


function Chessboard_Impl({
  pieces, Stars = [], orientation = "white", selected,
  Legal_Squares = [],
  Last_Move = null,
  arrows = [], arrowLengthScale = 1,
  onSquareClick, onPieceDrop, onDragBegin, interactive = true,
  Input_Mode = "both",
  animate = true, animationMs = 220, className,
  moveBadge = null,
  Premove_Squares = [],
  onCancelPremoves,
  onClearSelection,
  interactiveColor,
}: Properties) {

  const clickEnabled = interactive && (Input_Mode === "click" || Input_Mode === "both");
  const dragEnabled = interactive && !!onPieceDrop && (Input_Mode === "drag" || Input_Mode === "both");
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

  const [User_Arrows, Set_User_Arrows] = useState<Arrow[]>([]);
  const [highlights, setHighlights] = useState<Set<string>>(new Set());

  const [dark, setDark] = useState(Is_Dark_Theme);
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(Is_Dark_Theme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const Board_Reference = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);
  useEffect(() => {
    if (!Board_Reference.current) return;
    const ro = new ResizeObserver(es => {
      const r = es[0].contentRect;
      setSize(Math.min(r.width, r.height));
    });
    ro.observe(Board_Reference.current);
    return () => ro.disconnect();
  }, []);

  const Right_Down = useRef<string | null>(null);
  const onContextMenu = (e: React.MouseEvent) => e.preventDefault();

  const [drag, setDrag] = useState<Drag_State | null>(null);

  const SQ_At = (clientX: number, clientY: number): string | null => {
    if (!Board_Reference.current) return null;
    const r = Board_Reference.current.getBoundingClientRect();
    const x = clientX - r.left, y = clientY - r.top;
    if (x < 0 || y < 0 || x > r.width || y > r.height) return null;
    const col = Math.floor((x / r.width) * 8);
    const row = Math.floor((y / r.height) * 8);
    const file = orientation === "white" ? files[col] : files[7 - col];
    const rank = orientation === "white" ? 8 - row : row + 1;
    return `${file}${rank}`;
  };

  const Drag_Reference = useRef<Drag_State | null>(null);
  useEffect(() => { Drag_Reference.current = drag; }, [drag]);

  const Finish_Drag = (clientX: number, clientY: number) => {
    const d = Drag_Reference.current;
    if (!d) return;
    const target = SQ_At(clientX, clientY);
    setDrag(null);
    if (!target) return;
    if (!d.isDragging) {
      if (target !== d.From_Square && clickEnabled) onSquareClick?.(target);
      return;
    }
    if (target === d.From_Square) return;
    if (dragEnabled) onPieceDrop?.(d.From_Square, target);
    else if (clickEnabled) onSquareClick?.(target);
  };

  useEffect(() => {
    if (!drag) return;
    const onWinMove = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return;
      setDrag(d => {
        if (!d || d.pointerId !== e.pointerId) return d;
        const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
        const isDragging = d.isDragging || Math.hypot(dx, dy) >= DRAG_THRESHOLD;
        return { ...d, curX: e.clientX, curY: e.clientY, isDragging };
      });
    };
    const onWinUp = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return;
      Finish_Drag(e.clientX, e.clientY);
    };
    const onWinCancel = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return;
      setDrag(null);
    };
    window.addEventListener("pointermove", onWinMove);
    window.addEventListener("pointerup", onWinUp);
    window.addEventListener("pointercancel", onWinCancel);
    return () => {
      window.removeEventListener("pointermove", onWinMove);
      window.removeEventListener("pointerup", onWinUp);
      window.removeEventListener("pointercancel", onWinCancel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag?.pointerId]);

  useEffect(() => {
    if (!drag) return;
    const stillThere = pieces.some(p => p.square === drag.From_Square);
    if (!stillThere) setDrag(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieces, drag?.From_Square]);

  const Begin_Piece_Drag = (e: React.PointerEvent, square: string) => {
    if (e.button !== 0) return;
    if (!clickEnabled && !dragEnabled) return;

    if (interactiveColor) {
      const p = pieces.find(pp => pp.square === square);
      if (!p || p.color !== interactiveColor) return;
    }

    if (User_Arrows.length) Set_User_Arrows([]);
    if (highlights.size) setHighlights(new Set());

    setDrag({
      pointerId: e.pointerId,
      From_Square: square,
      startX: e.clientX, startY: e.clientY,
      curX: e.clientX, curY: e.clientY,
      isDragging: false,
    });
    onDragBegin?.(square);
  };

  const Move_Piece_Drag = (_e: React.PointerEvent) => {};
  const End_Piece_Drag = (_e: React.PointerEvent) => {};
  const Cancel_Piece_Drag = () => setDrag(null);

  const On_Board_Pointer_Down = (e: React.PointerEvent) => {
    if (e.button === 2) {
      const sq = SQ_At(e.clientX, e.clientY);
      onClearSelection?.();
      Right_Down.current = sq;
      return;
    }
    if (e.button !== 0) return;
    if (User_Arrows.length) Set_User_Arrows([]);
    if (highlights.size) setHighlights(new Set());
  };

  const On_Board_Pointer_Up = (e: React.PointerEvent) => {
    if (e.button !== 2) return;
    const from = Right_Down.current;
    const to = SQ_At(e.clientX, e.clientY);
    Right_Down.current = null;
    if (!from || !to) return;
    if (from === to) {
      if (Premove_Squares.length > 0) {
        onCancelPremoves?.();
        return;
      }
      setHighlights(prev => {
        const next = new Set(prev);
        if (next.has(from)) next.delete(from); else next.add(from);
        return next;
      });
      return;
    }
    Set_User_Arrows(prev => {
      const same = prev.find(x => x.from === from && x.to === to);
      if (same) return prev.filter(x => x !== same);
      return [...prev, { from, to, color: "hsl(var(--primary))" }];
    });
  };

  const sq = size / 8;
  const center = (s: string) => {
    const { col, row } = Square_To_XY(s, orientation);
    return { x: col * sq + sq / 2, y: row * sq + sq / 2 };
  };

  const Rendered_Arrows = useMemo(() => {
    if (size === 0) return null;
    const all: { a: Arrow; scale: number; userDrawn: boolean }[] = [
      ...arrows.map(a => ({ a, scale: arrowLengthScale, userDrawn: false })),
      ...User_Arrows.map(a => ({ a, scale: 1, userDrawn: true })),
    ];
    return all.map(({ a, scale, userDrawn }, i) => {
      const f = center(a.from), t = center(a.to);
      const dx = t.x - f.x, dy = t.y - f.y;
      const len = Math.hypot(dx, dy);
      if (len === 0) return null;
      const ux = dx / len, uy = dy / len;
      const tipX = t.x - ux * sq * 0.42;
      const tipY = t.y - uy * sq * 0.42;
      const startX = f.x + ux * sq * 0.35;
      const startY = f.y + uy * sq * 0.35;
      const eTipX = startX + (tipX - startX) * scale;
      const eTipY = startY + (tipY - startY) * scale;
      const color = a.color ?? "rgba(255,170,0,1)";
      const opacity = userDrawn ? 0.85 : 0.5;
      const width = sq * 0.22;
      const head = sq * 0.30;
      return (
        <g key={`${a.from}-${a.to}-${i}`} opacity={opacity}>
          <line x1={startX} y1={startY} x2={eTipX} y2={eTipY} stroke={color} strokeWidth={width} strokeLinecap="round" />
          <polygon
            points={[
              [eTipX + ux * head, eTipY + uy * head],
              [eTipX - uy * head * 0.8, eTipY + ux * head * 0.8],
              [eTipX + uy * head * 0.8, eTipY - ux * head * 0.8],
            ].map(p => p.join(",")).join(" ")}
            fill={color}
          />
        </g>
      );
    });
  }, [arrows, User_Arrows, arrowLengthScale, size, orientation]);

  const ghost = useMemo(() => {
    if (!drag || size === 0 || !Board_Reference.current) return null;
    const r = Board_Reference.current.getBoundingClientRect();
    return { x: drag.curX - r.left, y: drag.curY - r.top };
  }, [drag, size]);

  return (
    <div
      ref={Board_Reference}
      onContextMenu={onContextMenu}
      onPointerDown={On_Board_Pointer_Down}
      onPointerUp={On_Board_Pointer_Up}
      className={cn(
      // Change max dimensions so aspect-square never overflows height
      "relative w-full h-full max-w-full max-h-full aspect-square select-none overflow-hidden border-2 border-border",
      className,
    )}
      role="img"
      aria-label="Chess position"
    >
      <Board_Grid
        orientation={orientation} selected={selected} Stars={Stars} highlights={highlights}
        Legal_Squares={Legal_Squares} pieces={pieces} Last_Move={Last_Move} Premove_Squares={Premove_Squares}
        clickEnabled={clickEnabled} dragActive={!!drag} onSquareClick={onSquareClick} sq={sq}
      />

      {size > 0 && pieces.map((p) => {
        const { col, row } = Square_To_XY(p.square, orientation);
        const color = Get_Piece_Color(p, dark);
        const url = PIECE_URL[`${color}${p.type as Piece_Type}`];
        const key = p.id ?? `${p.color}-${p.type}-${p.square}`;
        const ownershipOk = !interactiveColor || p.color === interactiveColor;
        const pieceInteractive = (clickEnabled || dragEnabled) && ownershipOk;
        const isBeingHeld = !!drag && drag.From_Square === p.square;
        const isHidden = !!p.hidden;
        
        return (
          <img
            key={key}
            src={url}
            alt=""
            draggable={false}
            onPointerDown={pieceInteractive ? (e) => Begin_Piece_Drag(e, p.square) : undefined}
            onPointerMove={pieceInteractive ? Move_Piece_Drag : undefined}
            onPointerUp={pieceInteractive ? End_Piece_Drag : undefined}
            onPointerCancel={pieceInteractive ? Cancel_Piece_Drag : undefined}
            style={{
              position: "absolute",
              width: "12.5%",
              height: "12.5%",
              transform: `translate3d(${col * 100}%, ${row * 100}%, 0px)`,
              pointerEvents: pieceInteractive ? "auto" : "none",
              cursor: pieceInteractive ? (drag ? "grabbing" : "grab") : "default",
              opacity: isBeingHeld || isHidden ? 0 : 1,
              transition: animate && !isBeingHeld
                ? `transform ${animationMs}ms cubic-bezier(0.2, 0, 0, 1)`
                : undefined,
              touchAction: "none",
              zIndex: 1,
            }}
          />
        );
      })}

      {drag && ghost && (() => {
        const piece = pieces.find(p => p.square === drag.From_Square);
        if (!piece) return null;
        const color = Get_Piece_Color(piece, dark);
        const url = PIECE_URL[`${color}${piece.type as Piece_Type}`];
        return (
          <img
            src={url}
            alt=""
            style={{
              position: "absolute",
              left: 0, top: 0,
              width: sq,
              height: sq,
              transform: `translate3d(${ghost.x - sq / 2}px, ${ghost.y - sq / 2}px, 0px)`,
              pointerEvents: "none",
              zIndex: 10,
              filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.3))",
            }}
          />
        );
      })()}

      {size > 0 && (
        <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 6 }} viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
          {Rendered_Arrows}
        </svg>
      )}

      {size > 0 && moveBadge && (() => {
        const { col, row } = Square_To_XY(moveBadge.square, orientation);
        const meta = Class_Meta[moveBadge.kind];
        return (
          <div
            className="absolute pointer-events-none flex items-center justify-center rounded-full text-[11px] font-bold shadow-md ring-2 ring-background text-white"
            style={{
              transform: `translate3d(${col * sq + sq * 0.62}px, ${row * sq - sq * 0.10}px, 0px)`,
              width: sq * 0.42,
              height: sq * 0.42,
              background: meta.color,
            }}
            aria-hidden
          >
            {meta.glyph}
          </div>
        );
      })()}
    </div>
  );
}

export const Chessboard = memo(Chessboard_Impl);