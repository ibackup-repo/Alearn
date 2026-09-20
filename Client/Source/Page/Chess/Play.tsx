import React, { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "@/Component/Chess/Chessboard";
import { Container } from "@/Component/UI/container";
import { Button } from "@/Component/UI/button";
import { Chess_Setup_Panel, type Game_Config } from "@/Component/Chess/Chess-Setup-Panel";
import { Piece_Tracker } from "@/Component/Chess/Chess-Helpers";
import { Use_Chess_Settings } from "@/Library/Chess-Settings";
import { Analyse_Game, type Per_Move } from "../../Component/Chess/Analysis/Classification";
import { Eval_Bar } from "@/Component/Chess/Play/Evalbar";
import { Play_Move_Sound } from "@/Component/Chess/Play/Use-Audio";
import { Engine_Reply_Delay_MS } from "@/Component/Chess/Play/Engine-Cache";
import { Use_Premoves } from "@/Component/Chess/Play/Use-Premove";
import { useChessEngine } from "@/Component/Chess/Play/Use-Chess-Engine";
import { useVariations } from "@/Component/Chess/Play/Use-Variation";
import { Use_Game_Actions } from "@/Component/Chess/Play/Use-Game-Action";
import { Use_Board_Overlay } from "@/Component/Chess/Play/Board-Overlay";
import { Right_Panel } from "@/Component/Chess/Play/Right-Panel";
import { usePlayLogic } from "@/Component/Chess/Play/Use-Play-Logic";
import type { Play_State } from "@/Component/Chess/Play/Types";

function Format_Time(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function Chess_Play_View() {
  const [settings] = Use_Chess_Settings();
  const [cfg, setCfg] = useState<Game_Config | null>(null);
  const [, force] = useState(0);
  const State_Reference = useRef<Play_State | null>(null);
  const Last_Tick_Reference = useRef<number>(0);
  const Moves_End_Reference = useRef<HTMLDivElement | null>(null);

  const [selected, Set_Selected] = useState<string | null>(null);
  const [View_Index, Set_View_Index] = useState<number>(-1);
  const [Hint_Arrow, Set_Hint_Arrow] = useState<{ from: string; to: string } | null>(null);
  const [Analysis_View, Set_Analysis_View] = useState<"play" | "analysis" | "review">("play");
  const [Per_Move, Set_Per_Move] = useState<Per_Move[] | null>(null);
  const [Analysing, Set_Analysing] = useState<{ done: number; total: number } | null>(null);
  const [No_Animate_Once, Set_No_Animate_Once] = useState(false);

  const Idle_Pieces = useMemo(() => {
    const g = new Chess();
    const t = new Piece_Tracker();
    t.reset(g);
    return t.With_Ids(g);
  }, []);

  const Run_EngineRef = useRef<() => void>(() => {});

  const Game_Actions = Use_Game_Actions({
    State_Reference,
    Last_Tick_Reference,
    force,
    setCfg,
    Set_Selected,
    Set_View_Index,
    Set_Variable_Cursor: (c) => Set_Variable_Cursor_External(c),
    Set_Hint_Arrow,
    Set_Analysis_View,
    Set_Per_Move,
    Set_No_Animate_Once,
    setPremoves: (updater) => Set_Premoves_External(updater),
    On_Game_Started: (Player_Color) => {
      if (Player_Color === "b") setTimeout(() => Run_EngineRef.current(), 400);
    },
  });

  const {
    Premoves,
    Premoves_Reference,
    setPremoves: Set_Premoves_External,
    Queue_Premove,
    Cancel_Premoves,
  } = Use_Premoves({
    State_Reference,
    Record_Mainline_Move: Game_Actions.Record_Mainline_Move,
    force,
    Schedule_Engine_Reply: () => setTimeout(() => Run_EngineRef.current(), Engine_Reply_Delay_MS),
    Set_No_Animate_Once,
  });

  const { Run_Engine } = useChessEngine({
    State_Reference,
    Record_Mainline_Move: Game_Actions.Record_Mainline_Move,
    force,
    Premoves_Reference,
    Try_Play_Premove: () => {},
    setPremoves: Set_Premoves_External,
  });
  Run_EngineRef.current = Run_Engine;

  const {
    Var_Cursor,
    Set_Variable_Cursor: Set_Variable_Cursor_External,
    Try_Variation_Move,
    Compute_Variation_View,
  } = useVariations({
    State_Reference,
    View_Index,
    force,
    Set_Selected,
    Set_Hint_Arrow,
    Set_No_Animate_Once,
    Play_Move_Sound,
  });

  const { startGame, Reset_To_Setup, rematch, Undo_Move, resign } = Game_Actions;

  useEffect(() => {
    if (!cfg || cfg.timer.Base_MS === 0) return;
    const id = window.setInterval(() => {
      const s = State_Reference.current;
      if (!s || s.game.isGameOver()) return;
      const now = performance.now();
      const delta = now - Last_Tick_Reference.current;
      Last_Tick_Reference.current = now;
      if (s.game.turn() === "w") s.White_MS = Math.max(0, s.White_MS - delta);
      else s.Black_MS = Math.max(0, s.Black_MS - delta);
      force((n) => n + 1);
    }, 100);
    return () => window.clearInterval(id);
  }, [cfg]);

  useEffect(() => {
    if (No_Animate_Once) {
      const id = requestAnimationFrame(() => Set_No_Animate_Once(false));
      return () => cancelAnimationFrame(id);
    }
  }, [No_Animate_Once]);

  const s = State_Reference.current;
  const Has_Active_Game = !!cfg && !!s;
  const live = Has_Active_Game ? View_Index === -1 && Var_Cursor == null : true;
  const reviewing = Has_Active_Game ? !live : false;

  useEffect(() => {
    if (s && s.sans.length > 0 && View_Index !== -1 && !Var_Cursor) {
      Set_View_Index(-1);
    }
  }, [s?.sans.length]);

  const {
    Set_Container_Ref,
    Compute_View,
    On_Move,
    Handle_Square,
    Clear_Selection,
    Show_Hint,
  } = usePlayLogic({
    cfg,
    State_Reference,
    View_Index,
    Var_Cursor,
    selected,
    Set_Selected,
    Set_View_Index,
    Set_Hint_Arrow,
    Set_No_Animate_Once,
    Set_Variable_Cursor_External,
    Try_Variation_Move,
    Compute_Variation_View,
    Record_Mainline_Move: Game_Actions.Record_Mainline_Move,
    Queue_Premove,
    Run_EngineRef,
    Projected_Board: null,
    force,
  });

  const view = Has_Active_Game ? Compute_View() : null;

  const View_Game: Chess = useMemo(() => {
    if (!s || !view) return new Chess();
    try {
      return new Chess(view.fen);
    } catch {
      return s.game;
    }
  }, [s, view?.fen]);

  const {
    pieces,
    Projected_Pieces,
    Projected_Board,
    legal,
    Premove_Squares,
    Eval_Score,
    Analysis_Arrows,
  } = Use_Board_Overlay({
    s,
    live,
    reviewing,
    View_Game,
    selected,
    Premoves,
    Hint_Arrow,
    Eval_Bar_Config: cfg?.Eval_Bar,
    Suggestion_Arrows_Config: cfg?.Suggestion_Arrows,
    Threat_Arrows_Config: cfg?.Threat_Arrows,
    Idle_Pieces,
  });

  useEffect(() => {
    if (Moves_End_Reference.current) {
      Moves_End_Reference.current.scrollIntoView({ behavior: "smooth", inline: "end" });
    }
  }, [s?.sans.length, s?.variations?.length, Var_Cursor]);

  if (!cfg || !s) {
    return (
      <div className="w-full py-4 px-4 flex flex-col gap-4 relative z-[100] flex-1 items-center justify-center max-w-6xl mx-auto min-h-0 h-full overflow-hidden">
        <div className="w-full select-none max-h-full pr-1">
          <Chess_Setup_Panel onPlay={startGame} />
        </div>
      </div>
    );
  }

  const orientation = s.Player_Color === "w" ? "white" : "black";
  const isResigned = s.resigned === true;

  const Top_Clock_Color: "w" | "b" = orientation === "white" ? "b" : "w";
  const Bottom_Clock_Color: "w" | "b" = orientation === "white" ? "w" : "b";
  const Clock_MS = (c: "w" | "b") => (c === "w" ? s.White_MS : s.Black_MS);
  const Show_Clocks = cfg.timer.Base_MS > 0;
  const turn = s.game.turn();

  const Current_Ply = Var_Cursor
    ? s.variations?.[Var_Cursor.varIndex]?.Parent_Index ?? -1
    : View_Index === -1
    ? s.sans.length - 1
    : View_Index;

  const Last_Move = view?.Last_Move ?? null;
  const Review_Badge =
    Analysis_View === "review" && Per_Move && reviewing && !Var_Cursor && Last_Move
      ? { square: Last_Move.to, kind: Per_Move[View_Index].kind }
      : null;

  const variations = s.variations || [];

  const Handle_Drag_Begin = (sq: string) => {
    if (reviewing) {
      const Current_Piece = View_Game.get(sq as any);
      if (Current_Piece && Current_Piece.color === View_Game.turn()) {
        Set_Selected(sq);
      }
      return;
    }
    if (live && s.game.turn() !== s.Player_Color) {
      const proj = Projected_Board;
      const piece = proj?.get(sq as any);
      if (piece && piece.color === s.Player_Color) Set_Selected(sq);
      return;
    }
    const piece = s.game.get(sq as any);
    if (piece && piece.color === s.Player_Color) {
      Set_Selected(sq);
    }
  };

  const Common_Right_Panel_Properties = {
    cfg,
    s,
    Show_Clocks,
    orientation,
    Is_Game_Over: s.game.isGameOver() || isResigned,
    turn,
    Clock_MS,
    Top_Clock_Color,
    Bottom_Clock_Color,
    Analysis_View,
    Per_Move,
    Current_Ply,
    live,
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
    Reset_To_Setup,
    resign,
    Undo_Move,
    Show_Hint,
  };

  return (
    <div
      ref={(node) => {
        Set_Container_Ref(node);
      }}
      className="w-full pb-[16px] min-[960px]:pt-[0px] min-[960px]:pb-[16px] min-[960px]:px-[16px] flex flex-col relative z-[100] h-[calc(100dvh-72px)] max-h-[calc(100dvh-72px)] justify-center items-center overflow-hidden select-none min-h-0 min-w-0 box-border"
    >
      {/* ── 1. DESKTOP VIEW (>= 960px) ── */}
      <div className="hidden min-[960px]:flex flex-row items-center justify-center w-full h-full max-w-7xl mx-auto min-h-0 min-w-0 overflow-hidden">
        <div className="[container-type:size] h-full flex-1 min-h-0 min-w-0 flex items-center justify-center pl-2 py-2 overflow-hidden shrink">
          <div className="w-[min(100cqw,100cqh)] h-[min(100cqw,100cqh)] max-w-full max-h-full flex items-stretch gap-2 justify-center relative min-h-0 min-w-0 shrink">
            {Eval_Score !== null && Analysis_View !== "analysis" && <Eval_Bar score={Eval_Score} />}
            <div
              className={`p-0 rounded-[20px] h-full w-full max-h-full max-w-full aspect-square relative overflow-hidden transition-all shrink min-h-0 min-w-0 ${
                reviewing ? "brightness-105 contrast-[1.02]" : ""
              }`}
            >
              <Chessboard
                pieces={Projected_Pieces ?? pieces}
                orientation={orientation}
                selected={selected}
                Legal_Squares={legal}
                Last_Move={Last_Move}
                onSquareClick={Handle_Square}
                onPieceDrop={(from, to) => On_Move(from, to, true)}
                onDragBegin={Handle_Drag_Begin}
                Input_Mode={settings.Input_Mode}
                arrows={Analysis_Arrows}
                interactive={true}
                animate={settings.Animate_Pieces && !No_Animate_Once}
                animationMs={settings.Animation_Speed}
                moveBadge={Review_Badge}
                Premove_Squares={Premove_Squares}
                onCancelPremoves={Cancel_Premoves}
                onClearSelection={Clear_Selection}
                interactiveColor={live ? s.Player_Color : View_Game.turn()}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 max-w-[384px] h-full min-h-0 shrink overflow-hidden flex flex-col">
          <Right_Panel {...Common_Right_Panel_Properties} Layout_Mode="vertical" />
        </div>
      </div>

      {/* ── 2. MOBILE & TABLET VIEW (< 960px) ── */}
      <div className="flex max-[959px]:flex min-[960px]:hidden flex-col items-center w-full h-full min-h-0 min-w-0 gap-1.5 mx-auto overflow-hidden">
        
        {/* Opponent Clock (bovenaan indien klok actief is) */}
        {Show_Clocks && (
          <div className="w-full max-w-lg flex items-center justify-between px-3 py-1 shrink-0 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white">
            <span className="font-semibold">Opponent</span>
            <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-zinc-200 font-bold">
              {Format_Time(Clock_MS(Top_Clock_Color))}
            </span>
          </div>
        )}

        {/* Schaakbord wrapper: 
            items-end is de key hier! Dit duwt het hele vierkant naar de onderkant 
            van de beschikbare (flex-1) ruimte, in plaats van te centreren. 
        */}
        <div className="w-full max-w-lg flex-1 min-h-0 flex flex-row items-end justify-center relative">
          <div className="w-full aspect-square max-h-full flex flex-row items-stretch gap-1.5 justify-center relative shrink">
            {Eval_Score !== null && Analysis_View !== "analysis" && (
              <Eval_Bar score={Eval_Score} />
            )}
            <div
              className={`p-0 h-full w-full aspect-square relative overflow-hidden transition-all shrink ${
                reviewing ? "brightness-105 contrast-[1.02]" : ""
              }`}
            >
              <Chessboard
                pieces={Projected_Pieces ?? pieces}
                orientation={orientation}
                selected={selected}
                Legal_Squares={legal}
                Last_Move={Last_Move}
                onSquareClick={Handle_Square}
                onPieceDrop={(from, to) => On_Move(from, to, true)}
                onDragBegin={Handle_Drag_Begin}
                Input_Mode={settings.Input_Mode}
                arrows={Analysis_Arrows}
                interactive={true}
                animate={settings.Animate_Pieces && !No_Animate_Once}
                animationMs={settings.Animation_Speed}
                moveBadge={Review_Badge}
                Premove_Squares={Premove_Squares}
                onCancelPremoves={Cancel_Premoves}
                onClearSelection={Clear_Selection}
                interactiveColor={live ? s.Player_Color : View_Game.turn()}
              />
            </div>
          </div>
        </div>

        {/* You Panel (Bodem klokbalk) */}
        <div className="w-full max-w-lg flex items-center justify-between px-3 py-1 shrink-0 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white">
          <span className="font-semibold">You</span>
          {Show_Clocks && (
            <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-zinc-200 font-bold">
              {Format_Time(Clock_MS(Bottom_Clock_Color))}
            </span>
          )}
        </div>

        {/* Move History */}
        <Container className="w-full h-9 shrink-0 flex items-center gap-1.5 overflow-x-auto overflow-y-hidden px-2 py-1 text-xs whitespace-nowrap bg-black border-0">
          {s.sans.length === 0 ? (
            <span className="opacity-50 italic px-2 text-zinc-400">Game started</span>
          ) : (
            s.sans.map((move, Index) => {
              const Move_Numberber = Math.floor(Index / 2) + 1;
              const Is_White = Index % 2 === 0;
              const isSelected =
                Var_Cursor == null && (View_Index === Index || (View_Index === -1 && Index === s.sans.length - 1));

              const Node_Vars = variations.filter((v) => v && v.Parent_Index === Index);

              return (
                <React.Fragment key={Index}>
                  {Is_White && (
                    <span className="h-6 px-1 text-[10px] font-semibold text-zinc-500 shrink-0 flex items-center justify-center">
                      {Move_Numberber}.
                    </span>
                  )}
                  <Button
                    Label={move}
                    Color={isSelected ? "#ffffff" : "#18181b"}
                    TextColor={isSelected ? "#000000" : "#ffffff"}
                    Height={24}
                    OnClick={() => {
                      Set_No_Animate_Once(true);
                      Set_Variable_Cursor_External(null);
                      Set_View_Index(Index === s.sans.length - 1 ? -1 : Index);
                    }}
                    className="px-2 text-xs shrink-0 font-normal border-0"
                  />

                  {Node_Vars.length > 0 &&
                    Node_Vars.map((v, vIdx) => {
                      const Moves_List = v.sans || v.moves || [];
                      const Var_Idx_In_State = variations.indexOf(v);

                      return (
                        <div
                          key={vIdx}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 shrink-0"
                        >
                          {Moves_List.map((m, mIdx) => {
                            const Var_Ply = v.Parent_Index + 1 + mIdx;
                            const mNum = Math.floor(Var_Ply / 2) + 1;
                            const Is_W_Turn = Var_Ply % 2 === 0;

                            const Active_Step = Var_Cursor?.step ?? Var_Cursor?.ply;
                            const Is_Var_Selected =
                              Var_Cursor &&
                              Var_Cursor.varIndex === Var_Idx_In_State &&
                              Active_Step === mIdx;

                            const mSan = typeof m === "string" ? m : m?.san || String(m);

                            return (
                              <React.Fragment key={mIdx}>
                                {(mIdx === 0 || Is_W_Turn) && (
                                  <span className="h-5 px-1 text-[9px] font-semibold text-zinc-500 shrink-0 flex items-center justify-center">
                                    {mNum}.
                                  </span>
                                )}
                                <Button
                                  Label={mSan}
                                  Color={Is_Var_Selected ? "#ffffff" : "#27272a"}
                                  TextColor={Is_Var_Selected ? "#000000" : "#ffffff"}
                                  Height={20}
                                  OnClick={() => {
                                    Set_No_Animate_Once(true);
                                    Set_Variable_Cursor_External({
                                      varIndex: Var_Idx_In_State,
                                      step: mIdx,
                                    });
                                  }}
                                  className="px-1.5 text-[10px] shrink-0 font-normal border-0"
                                />
                              </React.Fragment>
                            );
                          })}
                        </div>
                      );
                    })}
                </React.Fragment>
              );
            })
          )}
          <div ref={Moves_End_Reference} />
        </Container>

        {/* Controls Panel */}
        <div className="w-full shrink-0">
          <Right_Panel {...Common_Right_Panel_Properties} Show_Clocks={false} Layout_Mode="horizontal" />
        </div>
      </div>
    </div>
  );
}