import { useEffect, useMemo, useRef, useState } from "react";
import { Chessboard } from "@/Component/Chess/Chessboard";
import { Container } from "@/Component/UI/container";
import { Button } from "@/Component/UI/Button";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { Use_Chess_Settings } from "@/Library/Chess-Settings";
import { Placed_Piece, Piece_Color, Piece_Type, Puzzle_Payload } from "@/Library/Chess-Types";
import { Fetch_Puzzle_By_FEN } from "@/Library/Chess-API";

/* ── Sound Synthesizer Fallback ──────────────────────────────────── */

type Sound_Type = "move" | "capture" | "illegal" | "victory";

function Play_Internal_Sound(Kind: Sound_Type, Enabled: boolean = true) {
  if (!Enabled || typeof window === "undefined") return;
  try {
    const Audio_Context_Class =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Audio_Context_Class) return;

    const Context = new Audio_Context_Class();
    const Oscillator = Context.createOscillator();
    const Gain = Context.createGain();

    Oscillator.connect(Gain);
    Gain.connect(Context.destination);

    const Current_Time = Context.currentTime;

    if (Kind === "move") {
      Oscillator.type = "sine";
      Oscillator.frequency.setValueAtTime(320, Current_Time);
      Oscillator.frequency.exponentialRampToValueAtTime(160, Current_Time + 0.08);
      Gain.gain.setValueAtTime(0.15, Current_Time);
      Gain.gain.exponentialRampToValueAtTime(0.01, Current_Time + 0.08);
      Oscillator.start(Current_Time);
      Oscillator.stop(Current_Time + 0.08);
    } else if (Kind === "capture") {
      Oscillator.type = "triangle";
      Oscillator.frequency.setValueAtTime(450, Current_Time);
      Oscillator.frequency.exponentialRampToValueAtTime(180, Current_Time + 0.1);
      Gain.gain.setValueAtTime(0.25, Current_Time);
      Gain.gain.exponentialRampToValueAtTime(0.01, Current_Time + 0.1);
      Oscillator.start(Current_Time);
      Oscillator.stop(Current_Time + 0.1);
    } else if (Kind === "illegal") {
      Oscillator.type = "sawtooth";
      Oscillator.frequency.setValueAtTime(150, Current_Time);
      Oscillator.frequency.setValueAtTime(110, Current_Time + 0.08);
      Gain.gain.setValueAtTime(0.2, Current_Time);
      Gain.gain.exponentialRampToValueAtTime(0.01, Current_Time + 0.18);
      Oscillator.start(Current_Time);
      Oscillator.stop(Current_Time + 0.18);
    } else if (Kind === "victory") {
      Oscillator.type = "sine";
      Oscillator.frequency.setValueAtTime(523.25, Current_Time); // C5
      Oscillator.frequency.setValueAtTime(659.25, Current_Time + 0.12); // E5
      Oscillator.frequency.setValueAtTime(783.99, Current_Time + 0.24); // G5
      Gain.gain.setValueAtTime(0.2, Current_Time);
      Gain.gain.exponentialRampToValueAtTime(0.01, Current_Time + 0.45);
      Oscillator.start(Current_Time);
      Oscillator.stop(Current_Time + 0.45);
    }
  } catch (Error) {
    console.error("Audio playback error:", Error);
  }
}

/* ── FEN Decoder Helper ────────────────────────────────────────────── */

export interface Decoded_FEN {
  pieces: Placed_Piece[];
  turn: Piece_Color;
  orientation: "white" | "black";
}

export function Decode_FEN_ID(ID: string): Decoded_FEN | null {
  if (!ID) return null;
  const Parts = ID.split("-");
  if (Parts.length < 9) return null;

  const Ranks = Parts.slice(0, 8);
  const Non_Empty = Parts.slice(8).filter(Boolean);
  const Turn = (Non_Empty[0] as Piece_Color) || "w";

  const Pieces: Placed_Piece[] = [];
  for (let R = 0; R < 8; R++) {
    const Rank = Ranks[R];
    let File = 0;
    for (const Ch of Rank) {
      if (/\d/.test(Ch)) {
        File += parseInt(Ch, 10);
        continue;
      }
      const Color: Piece_Color = Ch === Ch.toUpperCase() ? "w" : "b";
      const Type = Ch.toUpperCase() as Piece_Type;
      if (!"KQRBNP".includes(Type)) return null;
      const Square = "abcdefgh"[File] + String(8 - R);
      Pieces.push({
        square: Square,
        color: Color,
        type: Type,
        id: `${Square}-${Type}-${Color}`
      });
      File++;
    }
  }

  return {
    pieces: Pieces,
    turn: Turn,
    orientation: Turn === "w" ? "white" : "black"
  };
}

/* ── Component Properties ────────────────────────────────────────── */

export interface Chess_Puzzle_View_Props {
  puzzle?: string[] | Puzzle_Payload | unknown;
  FEN_ID?: string;
  On_Solved?: () => void;
}

/* ── Main Component ──────────────────────────────────────────────── */

export function Chess_Puzzle_View({ puzzle: Prop_Puzzle, FEN_ID, On_Solved }: Chess_Puzzle_View_Props) {
  const { UI_Language } = Use_Course_Language();
  const [Settings] = Use_Chess_Settings();

  const [Fetched_Payload, Set_Fetched_Payload] = useState<Puzzle_Payload | null>(null);
  const [Is_Loading, Set_Is_Loading] = useState<boolean>(false);

  // Reference for cleaning up timeouts on reset or unmount
  const Opponent_Timeout_Ref = useRef<number | null>(null);

  const Clear_Opponent_Timeout = () => {
    if (Opponent_Timeout_Ref.current !== null) {
      window.clearTimeout(Opponent_Timeout_Ref.current);
      Opponent_Timeout_Ref.current = null;
    }
  };

  useEffect(() => {
    return () => Clear_Opponent_Timeout();
  }, []);

  const Derived_ID = useMemo(() => {
    if (FEN_ID) return FEN_ID;
    if (typeof window !== "undefined") {
      const Segment = window.location.pathname.split("/").filter(Boolean).pop() ?? "";
      return decodeURIComponent(Segment);
    }
    return "";
  }, [FEN_ID]);

  // Fetch puzzle using Fetch_Puzzle_By_FEN
  useEffect(() => {
    if (!Derived_ID || Prop_Puzzle) return;

    let Is_Mounted = true;
    Set_Is_Loading(true);

    Fetch_Puzzle_By_FEN(Derived_ID)
      .then((Data) => {
        if (Is_Mounted && Data) {
          Set_Fetched_Payload(Data);
        }
      })
      .catch((Error) => {
        console.error("Error fetching puzzle by FEN:", Error);
      })
      .finally(() => {
        if (Is_Mounted) Set_Is_Loading(false);
      });

    return () => {
      Is_Mounted = false;
    };
  }, [Derived_ID, Prop_Puzzle]);

  const Active_Puzzle = Prop_Puzzle ?? Fetched_Payload;
  const Decoded = useMemo(() => Decode_FEN_ID(Derived_ID), [Derived_ID]);

  const Moves: string[] = useMemo(() => {
    if (Array.isArray(Active_Puzzle)) return Active_Puzzle as string[];
    if (Active_Puzzle && typeof Active_Puzzle === "object") {
      return (Active_Puzzle as Puzzle_Payload).moves ?? [];
    }
    return [];
  }, [Active_Puzzle]);

  const [Pieces, Set_Pieces] = useState<Placed_Piece[]>(Decoded?.pieces ?? []);
  const [Step, Set_Step] = useState(0);
  const [Wrong, Set_Wrong] = useState(false);
  const [Last_Move, Set_Last_Move] = useState<{ from: string; to: string } | null>(null);
  const [Selected, Set_Selected] = useState<string | null>(null);

  useEffect(() => {
    Clear_Opponent_Timeout();
    Set_Pieces(Decoded?.pieces ?? []);
    Set_Step(0);
    Set_Last_Move(null);
    Set_Selected(null);
    Set_Wrong(false);
  }, [Decoded]);

  const Apply_Uci = (UCI: string, Current_Pieces: Placed_Piece[]) => {
    const From = UCI.slice(0, 2);
    const To = UCI.slice(2, 4);
    const Promo = UCI.slice(4, 5);
    const Target_Captured = Current_Pieces.some((P) => P.square === To);

    const Next_Pieces = Current_Pieces
      .filter((P) => P.square !== To)
      .map((P) =>
        P.square === From
          ? { ...P, square: To, type: (Promo ? Promo.toUpperCase() : P.type) as Piece_Type }
          : P
      );

    return { pieces: Next_Pieces, from: From, to: To, capture: Target_Captured };
  };

  const Is_Solved = Step >= Moves.length && Moves.length > 0;

  const Attempt_Move = (From: string, To: string) => {
    if (Is_Solved) return;
    const Expected_UCI = Moves[Step];
    if (!Expected_UCI) return;

    const Attempted_UCI = `${From}${To}`;
    if (!Expected_UCI.startsWith(Attempted_UCI)) {
      Set_Wrong(true);
      Play_Internal_Sound("illegal", Settings?.Enable_Sound ?? true);
      window.setTimeout(() => Set_Wrong(false), 500);
      return;
    }

    const Player_Result = Apply_Uci(Expected_UCI, Pieces);
    Set_Pieces(Player_Result.pieces);
    Set_Last_Move({ from: Player_Result.from, to: Player_Result.to });
    Set_Selected(null);

    const Sound_Enabled = Settings?.Enable_Sound ?? true;

    if (Player_Result.capture) {
      Play_Internal_Sound("capture", Sound_Enabled);
    } else {
      Play_Internal_Sound("move", Sound_Enabled);
    }

    const Next_Step_Index = Step + 1;

    if (Next_Step_Index < Moves.length) {
      Clear_Opponent_Timeout();
      Opponent_Timeout_Ref.current = window.setTimeout(() => {
        Set_Pieces((Prev_Pieces) => {
          const Opponent_Result = Apply_Uci(Moves[Next_Step_Index], Prev_Pieces);
          Set_Last_Move({ from: Opponent_Result.from, to: Opponent_Result.to });

          if (Opponent_Result.capture) {
            Play_Internal_Sound("capture", Sound_Enabled);
          } else {
            Play_Internal_Sound("move", Sound_Enabled);
          }

          return Opponent_Result.pieces;
        });

        const Final_Step = Next_Step_Index + 1;
        Set_Step(Final_Step);

        if (Final_Step >= Moves.length) {
          Play_Internal_Sound("victory", Sound_Enabled);
          if (On_Solved) On_Solved();
        }
      }, 400);
    } else {
      Set_Step(Next_Step_Index);
      Play_Internal_Sound("victory", Sound_Enabled);
      if (On_Solved) On_Solved();
    }
  };

  const Reset_Puzzle = () => {
    Clear_Opponent_Timeout();
    Set_Pieces(Decoded?.pieces ?? []);
    Set_Step(0);
    Set_Last_Move(null);
    Set_Selected(null);
    Set_Wrong(false);
  };

  if (Is_Loading) {
    return (
      <div className="px-4 max-w-md mx-auto py-8 z-50">
        <Container className="p-6 text-center text-sm opacity-70">
          {UI_Language === "nl" ? "Laden..." : UI_Language === "ar" ? "جار التحميل..." : "Loading..."}
        </Container>
      </div>
    );
  }

  if (!Decoded) {
    return (
      <div className="px-4 max-w-md mx-auto py-8 z-50">
        <Container className="p-6 text-center text-sm opacity-70">
          {UI_Language === "nl" ? "Kon puzzel niet laden." : UI_Language === "ar" ? "تعذّر تحميل اللغز." : "Could not load puzzle."}
        </Container>
      </div>
    );
  }

  const Title_Text = UI_Language === "nl" ? "Puzzel" : UI_Language === "ar" ? "لغز" : "Puzzle";
  const Prompt_Text = Is_Solved
    ? (UI_Language === "nl" ? "Opgelost!" : UI_Language === "ar" ? "تم الحل!" : "Solved!")
    : Decoded.turn === "w"
    ? (UI_Language === "nl" ? "Wit aan zet — vind de beste zet." : UI_Language === "ar" ? "الأبيض يلعب — جد أفضل نقلة." : "White to move — find the best move.")
    : (UI_Language === "nl" ? "Zwart aan zet — vind de beste zet." : UI_Language === "ar" ? "الأسود يلعب — جد أفضل نقلة." : "Black to move — find the best move.");

  return (
    <div className="px-4 w-full my-4">
      <div className="grid gap-6 md:grid-cols-[1fr_280px] max-w-5xl mx-auto items-start">
        
        {/* Schaakbord Container met isolate & correcte z-index & desktop sizing */}
        <div className="flex justify-center isolate relative z-10 w-full min-w-0">
          <Container
            className={`p-2 rounded-[20px] w-full max-w-[min(100%,calc(100svh-18rem))] md:max-w-[560px] aspect-square transition-all duration-200 ${
              Wrong ? "ring-2 ring-destructive shadow-lg scale-[0.99]" : ""
            }`}
          >
            <Chessboard
              pieces={Pieces}
              orientation={Decoded.orientation}
              selected={Selected}
              Last_Move={Last_Move}
              onSquareClick={(Square) => {
                if (!Selected) {
                  const Piece_At_Square = Pieces.find((P) => P.square === Square);
                  if (Piece_At_Square && Piece_At_Square.color === Decoded.turn) {
                    Set_Selected(Square);
                  }
                  return;
                }
                if (Square === Selected) {
                  Set_Selected(null);
                  return;
                }
                Attempt_Move(Selected, Square);
              }}
              onPieceDrop={(From, To) => Attempt_Move(From, To)}
              onClearSelection={() => Set_Selected(null)}
              interactiveColor={Decoded.turn}
              Input_Mode={Settings?.Input_Mode}
              animate={Settings?.Animate_Pieces}
              animationMs={Settings?.Animation_Speed}
            />
          </Container>
        </div>

        {/* Zijpaneel met informatie en UI Buttons */}
        <div className="flex flex-col gap-3 relative z-0 w-full">
          <Container className="p-4 text-sm space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-base">{Title_Text}</p>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-muted font-medium">
                {Step}/{Moves.length}
              </span>
            </div>

            <p className={`text-sm transition-colors ${Is_Solved ? "text-emerald-600 font-medium" : "opacity-80"}`}>
              {Prompt_Text}
            </p>

            {/* Voortgangsbalk */}
            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-primary h-full transition-all duration-300 ease-out"
                style={{ width: `${Moves.length > 0 ? (Step / Moves.length) * 100 : 0}%` }}
              />
            </div>
          </Container>

          {/* Actie-knoppen */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="default"
              className="w-full justify-center"
              onClick={Reset_Puzzle}
            >
              {UI_Language === "nl" ? "Opnieuw proberen" : UI_Language === "ar" ? "إعادة المحاولة" : "Reset Puzzle"}
            </Button>

            {Is_Solved && On_Solved && (
              <Button
                variant="default"
                size="default"
                className="w-full justify-center animate-bounce"
                onClick={On_Solved}
              >
                {UI_Language === "nl" ? "Volgende Puzzel" : UI_Language === "ar" ? "اللغز التالي" : "Next Puzzle"}
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}