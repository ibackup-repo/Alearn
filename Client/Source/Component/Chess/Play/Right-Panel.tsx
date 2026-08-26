import React, { useEffect, useRef } from "react";
import { Container } from "@/Component/UI/container";
import { Button } from "@/Component/UI/Button";
import { Analysis_Report } from "@/Component/Chess/Analysis/Analysis_Report";
import type { Game_Config } from "@/Component/Chess/Chess-Setup-Panel";
import type { Play_State } from "@/Component/Chess/Play/Types";
import type { Per_Move } from "@/Component/Chess/Analysis/Classification";
import { RotateCcw, Sparkles, Eye, Lightbulb, Flag } from "lucide-react";

interface Right_Panel_Properties {
  cfg: Game_Config;
  s: Play_State;
  Show_Clocks: boolean;
  orientation: "white" | "black";
  Is_Game_Over: boolean;
  turn: "w" | "b";
  Clock_MS: (c: "w" | "b") => number;
  Top_Clock_Color: "w" | "b";
  Bottom_Clock_Color: "w" | "b";
  Analysis_View: "play" | "analysis" | "review";
  Per_Move: Per_Move[] | null;
  Current_Ply: number;
  live: boolean;
  View_Index: number;
  Var_Cursor: any;
  Analysing: { done: number; total: number } | null;
  Set_Analysis_View: (v: "play" | "analysis" | "review") => void;
  Set_Variable_Cursor_External: (cursor: any) => void;
  Set_No_Animate_Once: (v: boolean) => void;
  Set_View_Index: (i: number) => void;
  Set_Per_Move: (moves: Per_Move[] | null) => void;
  Set_Analysing: (a: { done: number; total: number } | null) => void;
  Analyse_Game: (
    sans: string[],
    FEN_History: string[],
    onProgress: (done: number, total: number) => void
  ) => Promise<{ Per_Move: Per_Move[]; white: any; black: any }>;
  rematch: () => void;
  Reset_To_Setup: () => void;
  resign: () => void;
  Undo_Move: () => void;
  Show_Hint: () => void;
  Layout_Mode?: "vertical" | "horizontal";
}

export const Right_Panel: React.FC<Right_Panel_Properties> = ({
  cfg,
  s,
  Is_Game_Over,
  Analysis_View,
  Per_Move,
  Current_Ply,
  View_Index,
  Var_Cursor,
  Analysing,
  Set_Analysis_View,
  Set_Variable_Cursor_External,
  Set_No_Animate_Once,
  Set_View_Index,
  Set_Per_Move,
  Set_Analysing,
  Analyse_Game,
  rematch,
  resign,
  Undo_Move,
  Show_Hint,
  Layout_Mode = "vertical",
}) => {
  const Desktop_Moves_End_Reference = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (Desktop_Moves_End_Reference.current) {
      Desktop_Moves_End_Reference.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [s.sans?.length, s.variations?.length]);

  const Handle_Start_Analysis = async () => {
    Set_Analysing({ done: 0, total: s.sans.length });
    const result = await Analyse_Game(s.sans, s.FEN_History, (done, total) => {
      Set_Analysing({ done, total });
    });
    Set_Per_Move(result.Per_Move);
    Set_Analysing(null);
    Set_Analysis_View("analysis");
  };

  const Render_Buttons = () => {
    const isHoriz = Layout_Mode === "horizontal";
    const btnClass = isHoriz ? "flex-1 text-xs gap-1.5 py-1 h-8" : "w-full gap-2";
    const iconClass = isHoriz ? "w-3.5 h-3.5 shrink-0" : "w-4 h-4 shrink-0";

    if (Is_Game_Over) {
      return (
        <>
          <Button variant="default" onClick={rematch} className={btnClass}>
            <RotateCcw className={iconClass} />
            Rematch
          </Button>
          {s.sans.length > 0 && !Per_Move && (
            <Button
              variant="outline"
              onClick={Handle_Start_Analysis}
              disabled={!!Analysing}
              className={btnClass}
            >
              <Sparkles className={iconClass} />
              {Analysing ? `(${Analysing.done}/${Analysing.total})` : "Analyze Game"}
            </Button>
          )}
          {Per_Move && Analysis_View !== "review" && (
            <Button
              variant="outline"
              onClick={() => Set_Analysis_View("review")}
              className={btnClass}
            >
              <Eye className={iconClass} />
              Review Game
            </Button>
          )}
        </>
      );
    }

    return (
      <>
        {cfg.engine && (
          <Button variant="outline" onClick={Show_Hint} className={btnClass}>
            <Lightbulb className={iconClass} />
            Hint
          </Button>
        )}
        {s.sans.length > 0 && (
          <Button variant="outline" onClick={Undo_Move} className={btnClass}>
            <RotateCcw className={iconClass} />
            Undo
          </Button>
        )}
        <Button variant="destructive" onClick={resign} className={btnClass}>
          <Flag className={iconClass} />
          Resign
        </Button>
      </>
    );
  };

  if (Layout_Mode === "horizontal") {
    return (
      <div className="flex items-center gap-1.5 w-full overflow-x-auto">
        {Render_Buttons()}
      </div>
    );
  }

  const Get_Move_Button_Class = (isSelected: boolean) =>
    `justify-center h-8 text-xs font-normal border transition-colors ${
      isSelected
        ? "bg-black text-white border-white dark:bg-white dark:text-black dark:border-black font-semibold"
        : "border-border hover:bg-accent"
    }`;

  const Get_Move_SAN = (m: any): string => {
    if (!m) return "";
    if (typeof m === "string") return m;
    if (typeof m === "object" && m.san) return m.san;
    return String(m);
  };

  const variations = s.variations || [];

  return (
    <div className="flex flex-col h-full justify-between gap-3 overflow-hidden">
      {Analysis_View === "analysis" && Per_Move ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <Analysis_Report
            Per_Move={Per_Move}
            fens={s.FEN_History}
            white={{ Accuracy: 85, Estimated_Rating: 1500, counts: {}, phases: {} } as any}
            black={{ Accuracy: 80, Estimated_Rating: 1450, counts: {}, phases: {} } as any}
            Current_Index={Current_Ply}
            On_Select={(i) => {
              Set_No_Animate_Once(true);
              Set_View_Index(i);
            }}
            On_Review={() => Set_Analysis_View("review")}
          />
        </div>
      ) : (
        <Container className="flex-1 min-h-0 p-2 overflow-y-auto text-xs">
          {s.sans.length === 0 ? (
            <p className="opacity-50 italic">No moves yet</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: Math.ceil(s.sans.length / 2) }).map((_, i) => {
                const Move_Number = i + 1;
                const wIdx = i * 2;
                const bIdx = i * 2 + 1;
                const wMove = s.sans[wIdx];
                const bMove = s.sans[bIdx];

                const wSelected =
                  Var_Cursor == null &&
                  (View_Index === wIdx || (View_Index === -1 && wIdx === s.sans.length - 1));
                const bSelected =
                  Var_Cursor == null &&
                  (View_Index === bIdx || (View_Index === -1 && bIdx === s.sans.length - 1));

                const whiteVars = variations.filter((v) => v && v.Parent_Index === wIdx);
                const blackVars = variations.filter((v) => v && v.Parent_Index === bIdx);
                const activeVars = [...whiteVars, ...blackVars];

                return (
                  <React.Fragment key={i}>
                    {/* Mainline Move Row */}
                    <div className="grid grid-cols-[32px_1fr_1fr] gap-1.5 items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="h-8 px-1 text-xs font-semibold opacity-60 border-border shrink-0 cursor-default justify-center"
                      >
                        {Move_Number}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          Set_No_Animate_Once(true);
                          Set_Variable_Cursor_External(null);
                          Set_View_Index(wIdx === s.sans.length - 1 ? -1 : wIdx);
                        }}
                        className={Get_Move_Button_Class(wSelected)}
                      >
                        {wMove}
                      </Button>

                      {bMove ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            Set_No_Animate_Once(true);
                            Set_Variable_Cursor_External(null);
                            Set_View_Index(bIdx === s.sans.length - 1 ? -1 : bIdx);
                          }}
                          className={Get_Move_Button_Class(bSelected)}
                        >
                          {bMove}
                        </Button>
                      ) : (
                        <span />
                      )}
                    </div>

                    {/* Variations Container without side border or background color */}
                    {activeVars.length > 0 && (
                      <div className="ml-7 my-1 flex flex-col gap-1">
                        {activeVars.map((v, vIdx) => {
                          const Moves_List = v.sans || v.moves || [];
                          const Var_Idx_In_State = variations.indexOf(v);
                          const varPairsCount = Math.ceil(Moves_List.length / 2);

                          return (
                            <div
                              key={vIdx}
                              className="p-1.5 flex flex-col gap-1 bg-transparent"
                            >
                              {Array.from({ length: varPairsCount }).map((_, pIdx) => {
                                const wVarIdx = pIdx * 2;
                                const bVarIdx = pIdx * 2 + 1;

                                const wVarMove = Moves_List[wVarIdx];
                                const bVarMove = Moves_List[bVarIdx];

                                const startPly = v.Parent_Index + 1;
                                const wPly = startPly + wVarIdx;
                                const wNum = Math.floor(wPly / 2) + 1;

                                const Active_Step = Var_Cursor?.step ?? Var_Cursor?.ply;

                                const isWVarSelected =
                                  Var_Cursor &&
                                  Var_Cursor.varIndex === Var_Idx_In_State &&
                                  Active_Step === wVarIdx;

                                const isBVarSelected =
                                  Var_Cursor &&
                                  Var_Cursor.varIndex === Var_Idx_In_State &&
                                  Active_Step === bVarIdx;

                                return (
                                  <div
                                    key={pIdx}
                                    className="grid grid-cols-[28px_1fr_1fr] gap-1.5 items-center"
                                  >
                                    {/* Variation Move Number */}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled
                                      className="h-7 text-[10px] font-semibold opacity-50 border-border cursor-default p-0 flex items-center justify-center"
                                    >
                                      {wNum}
                                    </Button>

                                    {/* White Variation Move */}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        Set_No_Animate_Once(true);
                                        Set_Variable_Cursor_External({
                                          varIndex: Var_Idx_In_State,
                                          step: wVarIdx,
                                        });
                                      }}
                                      className={Get_Move_Button_Class(!!isWVarSelected) + " h-7 text-xs"}
                                    >
                                      {Get_Move_SAN(wVarMove)}
                                    </Button>

                                    {/* Black Variation Move (if available) */}
                                    {bVarMove ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          Set_No_Animate_Once(true);
                                          Set_Variable_Cursor_External({
                                            varIndex: Var_Idx_In_State,
                                            step: bVarIdx,
                                          });
                                        }}
                                        className={Get_Move_Button_Class(!!isBVarSelected) + " h-7 text-xs"}
                                      >
                                        {Get_Move_SAN(bVarMove)}
                                      </Button>
                                    ) : (
                                      <div />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
              <div ref={Desktop_Moves_End_Reference} />
            </div>
          )}
        </Container>
      )}

      <div className="shrink-0 flex flex-col gap-2">
        {Render_Buttons()}
      </div>
    </div>
  );
};