import { Card } from "@/Component/UI/card";
import { Button } from "@/Component/UI/Button";
import { cn } from "@/Library/Utility";
import { Class_Meta, Class_Order, type Class_Kind, type Per_Move, type Player_Summary } from "./Classification";
import { Eval_Chart } from "./Eval_Chart";

interface Properties {
  Per_Move: Per_Move[];
  fens: string[];
  white: Player_Summary;
  black: Player_Summary;
  Current_Index: number;
  On_Select?: (i: number) => void;
  On_Review: () => void;
}

function pct(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${n.toFixed(0)}%`;
}

export function Analysis_Report({
  Per_Move, fens, white, black, Current_Index, On_Select, On_Review,
}: Properties) {
  return (
    <div className="space-y-3 overflow-y-auto pr-1 max-h-full">
      {/* Accuracy */}
      <Card className="p-3">
        <p className="text-[10px] uppercase tracking-wider opacity-60 text-center mb-1">Accuracy</p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider opacity-60">White</p>
            <p className="font-bold text-lg">{white?.Accuracy != null ? white.Accuracy.toFixed(1) : "—"}</p>
          </div>
          <span className="opacity-40">vs</span>
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-wider opacity-60">Black</p>
            <p className="font-bold text-lg">{black?.Accuracy != null ? black.Accuracy.toFixed(1) : "—"}</p>
          </div>
        </div>
        <div className="mt-2 space-y-0.5 text-xs">
          {(["opening","middlegame","endgame"] as const).map(p => (
            <div key={p} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <span className="text-right tabular-nums opacity-80">{pct(white.phases?.[p])}</span>
              <span className="text-[9px] uppercase tracking-wider opacity-50 px-2">{p}</span>
              <span className="text-left tabular-nums opacity-80">{pct(black.phases?.[p])}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Rating */}
      <Card className="p-3">
        <p className="text-[10px] uppercase tracking-wider opacity-60 text-center mb-1">Estimated Rating</p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
          <span className="text-right font-bold text-lg">{white?.Estimated_Rating ?? "—"}</span>
          <span className="opacity-40">vs</span>
          <span className="text-left font-bold text-lg">{black?.Estimated_Rating ?? "—"}</span>
        </div>
      </Card>

      {/* Move classification breakdown */}
      <Card className="p-3">
        <p className="text-[10px] uppercase tracking-wider opacity-60 text-center mb-2">Move Classification</p>
        <div className="space-y-0.5">
          {Class_Order.map(k => {
            const meta = Class_Meta[k];
            const w = white?.counts?.[k] ?? 0;
            const b = black?.counts?.[k] ?? 0;
            return (
              <div key={k} className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-1 text-sm">
                <span className={cn("text-right tabular-nums font-mono font-semibold", meta.text)}>{w}</span>
                <span className={cn("text-center text-xs font-medium", meta.text)}>
                  <span className="mr-1">{meta.glyph}</span>{meta.label}
                </span>
                <span className={cn("text-left tabular-nums font-mono font-semibold", meta.text)}>{b}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Eval chart */}
      <Card className="p-2">
        <p className="text-[10px] uppercase tracking-wider opacity-60 text-center mb-1">Evaluation</p>
        <Eval_Chart fens={fens} Per_Move={Per_Move} Current_Index={Current_Index} On_Select={On_Select} />
      </Card>

      <Button variant="outline" className="w-full" onClick={On_Review}>
        Review Game
      </Button>
    </div>
  );
}