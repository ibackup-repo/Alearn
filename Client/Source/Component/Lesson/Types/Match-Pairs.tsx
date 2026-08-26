import { useEffect, useState } from "react";
import { cn } from "@/Library/Utility";
import { shuffle, type Exercise_Properties } from "./Shared";

export function Match_Pairs_Exercise({ step, onResult }: Exercise_Properties) {
  const pairs: [string, string][] = step.pairs;
  const [left] = useState(() => pairs.map(p => p[0]));
  const [right, setRight] = useState(() => shuffle(pairs.map(p => p[1])));
  const [Sel_Left, Set_Sel_Left] = useState<number | null>(null);
  const [Sel_Right, Set_Sel_Right] = useState<number | null>(null);
  const [matched, Set_Matched] = useState<Set<string>>(new Set());
  const [Wrong, Set_Wrong] = useState(0);

  useEffect(() => {
    if (Sel_Left === null || Sel_Right === null) return;
    const l = left[Sel_Left];
    const r = right[Sel_Right];
    const Is_Match = pairs.some(p => p[0] === l && p[1] === r);
    if (Is_Match) {
      Set_Matched(m => new Set([...m, l, r]));
    } else {
      Set_Wrong(w => w + 1);
    }
    setTimeout(() => { Set_Sel_Left(null); Set_Sel_Right(null); }, 300);
  }, [Sel_Left, Sel_Right, left, right, pairs]);

  useEffect(() => {
    if (matched.size === pairs.length * 2) {
      setTimeout(() => onResult(Wrong <= 1), 400);
    }
  }, [matched, pairs.length, Wrong, onResult]);

  const cell = (text: string, selected: boolean, done: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      disabled={done}
      className={cn(
        "px-3 py-3 rounded-[12px] border-2 font-semibold text-sm transition-all",
        done && "opacity-30 border-border",
        !done && selected && "border-foreground bg-muted",
        !done && !selected && "border-border hover:bg-muted",
      )}
    >{text}</button>
  );

  return (
    <div className="space-y-4 pb-24">
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          {left.map((t, i) => cell(t, Sel_Left === i, matched.has(t), () => Set_Sel_Left(i)))}
        </div>
        <div className="grid gap-2">
          {right.map((t, i) => cell(t, Sel_Right === i, matched.has(t), () => Set_Sel_Right(i)))}
        </div>
      </div>
    </div>
  );
}