import { useEffect, useRef } from "react";
import { Container } from "@/Component/UI/container";
import { cn } from "@/Library/Utility";
import { Class_Meta, type Class_Kind } from "./Analysis/Classification";

export interface Move_Variation {
  /** Mainline ply index this branch *replaces* (the move played instead of mainline[Parent_Index]). */
  Parent_Index: number;
  sans: string[];
}

export interface Variation_Cursor {
  varIndex: number; // index into variations[]
  step: number;     // ply within that variation
}

interface Properties {
  sans: string[];
  times?: number[];
  Show_Times?: boolean;
  Active_Index?: number;
  classifications?: (Class_Kind | undefined)[];
  variations?: Move_Variation[];
  Active_Cursor?: Variation_Cursor | null;
  On_Select?: (index: number) => void;
  On_SelectVariation?: (cursor: Variation_Cursor) => void;
}

export function Moves_List({
  sans, times = [], Show_Times = false, Active_Index = -1,
  classifications, variations = [], Active_Cursor, On_Select, On_SelectVariation,
}: Properties) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [sans.length, Active_Index, variations.length]);

  const Cell = ({
    san, Index, t, k, active,
  }: { san: string; Index: number; t?: number; k?: Class_Kind; active: boolean }) => {
    const meta = k ? Class_Meta[k] : null;
    return (
      <button
        type="button"
        onClick={() => On_Select?.(Index)}
        className={cn(
          "px-1.5 py-0.5 rounded text-left flex items-baseline justify-between gap-2 transition-colors w-full",
          meta?.text,
          !active && "hover:bg-muted/60",
          active && "ring-2 ring-foreground/70",
        )}
      >
        <span className="flex items-baseline gap-1">
          <span>{san}</span>
          {meta && <span aria-hidden className="text-xs leading-none">{meta.glyph}</span>}
        </span>
        {Show_Times && t != null && (
          <span className="text-[10px] opacity-60 tabular-nums">
            {Math.max(0, Math.round(t))}s
          </span>
        )}
      </button>
    );
  };

  // Build per-mainline-row buckets so variations render under the right pair.
  const rows: Array<{
    Move_Number: number;
    w?: { san: string; Index: number; t?: number; k?: Class_Kind };
    b?: { san: string; Index: number; t?: number; k?: Class_Kind };
  }> = [];
  for (let i = 0; i < sans.length; i += 2) {
    rows.push({
      Move_Number: i / 2 + 1,
      w: { san: sans[i], Index: i, t: times[i], k: classifications?.[i] },
      b: sans[i + 1] != null
        ? { san: sans[i + 1], Index: i + 1, t: times[i + 1], k: classifications?.[i + 1] }
        : undefined,
    });
  }

  const variationsByParent = new Map<number, { v: Move_Variation; varIndex: number }[]>();
  variations.forEach((v, vi) => {
    const arr = variationsByParent.get(v.Parent_Index) ?? [];
    arr.push({ v, varIndex: vi });
    variationsByParent.set(v.Parent_Index, arr);
  });

  const Render_Variation = (entry: { v: Move_Variation; varIndex: number }) => {
    const { v, varIndex } = entry;
    const Move_Number0 = Math.floor(v.Parent_Index / 2) + 1;
    const Starts_With_Black = v.Parent_Index % 2 === 1;
    return (
      <div key={`var-${varIndex}`} className="pl-6 py-0.5 text-xs font-mono opacity-90 flex flex-wrap items-baseline gap-x-1">
        <span className="opacity-60">|_</span>
        {v.sans.map((san, step) => {
          const ply = v.Parent_Index + step;
          const Is_Black_Move = ply % 2 === 1;
          const num = Move_Number0 + (Starts_With_Black ? Math.floor((step + 1) / 2) : Math.floor(step / 2));
          const label = Is_Black_Move ? `${num}...` : `${num}.`;
          const active = Active_Cursor?.varIndex === varIndex && Active_Cursor.step === step;
          return (
            <button
              key={step}
              onClick={() => On_SelectVariation?.({ varIndex, step })}
              className={cn(
                "px-1 rounded hover:bg-muted/60",
                active && "ring-2 ring-foreground/70 bg-muted/40",
              )}
            >
              <span className="opacity-60 mr-1">{label}</span>{san}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <Container className="p-2">
      <div ref={ref} className="max-h-[260px] overflow-y-auto font-mono text-sm">
        {rows.length === 0 && <p className="opacity-60 text-center py-4">—</p>}
        {rows.map((p, i) => {
          const whiteVars = variationsByParent.get(p.w!.Index) ?? [];
          const blackVars = p.b ? (variationsByParent.get(p.b.Index) ?? []) : [];
          const inMainline = Active_Cursor == null;
          return (
            <div key={i}>
              <div className="grid grid-cols-[2rem_1fr_1fr] gap-1 px-1 py-0.5 items-center">
                <span className="opacity-60">{p.Move_Number}.</span>
                <Cell {...p.w!} active={inMainline && Active_Index === p.w!.Index} />
                {p.b
                  ? <Cell {...p.b} active={inMainline && Active_Index === p.b.Index} />
                  : <span />}
              </div>
              {whiteVars.map(Render_Variation)}
              {blackVars.map(Render_Variation)}
            </div>
          );
        })}
      </div>
    </Container>
  );
}
