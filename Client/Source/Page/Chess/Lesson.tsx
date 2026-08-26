import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Chessboard } from "@/Component/Chess/Chessboard";
import { Button } from "@/Component/UI/Button";
import { Container } from "@/Component/UI/container";
import { ChevronRight, Lock, Star } from "lucide-react";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { Use_Chess_Settings } from "@/Library/Chess-Settings";
import { Fetch_Chess_Levels } from "@/Library/Chess-API";
import {
  Chess_Level,
  Chess_Group,
  Chess_Lesson,
  Placed_Piece,
  Piece_Color,
  Piece_Type,
  Arrow
} from "@/Library/Chess-Types";
import { Parse_Lesson_Step } from "@/Component/Parser/Chess/Learn-To-Play";

export type International_Language = "Dutch" | "English" | "Arabic";

// Client-side local engines / ambient definitions
declare const isLegalMove: (type: Piece_Type, from: string, to: string, Would_Capture: boolean) => boolean;
declare const reachableSquares: (type: Piece_Type, square: string) => string[];

const Grid_Class = "grid grid-cols-2 gap-3 w-full px-4";
const Card_Class = "min-h-[64px] py-3 px-3 flex items-center justify-center text-center text-base";

type Empty_Kind = "subcategories" | "words" | "groups" | "lessons" | "puzzles";

const Empty_Messages: Record<Empty_Kind, Record<International_Language, string>> = {
  subcategories: {
    Dutch:   "Deze categorie is leeg. Voeg subcategorieën of woorden toe.",
    English: "This Category is empty. Add subcategories or words.",
    Arabic:  "هذه الفئة فارغة. أضف فئات فرعية أو كلمات.",
  },
  words: {
    Dutch:   "Geen woorden hier. Tik op + om er een toe te voegen.",
    English: "No words here. Tap + to add one.",
    Arabic:  "لا توجد كلمات هنا. اضغط + للإضافة.",
  },
  groups: {
    Dutch:   "Dit niveau is nog leeg. Binnenkort meer lessen.",
    English: "This level is empty. More lessons coming soon.",
    Arabic:  "هذا المستوى فارغ. قريباً المزيد من الدروس.",
  },
  lessons: {
    Dutch:   "Deze groep is nog leeg. Binnenkort meer lessen.",
    English: "Deze groep is leeg. More lessons coming soon.",
    Arabic:  "هذه المجموعة فارغة. قريباً المزيد من الدروس.",
  },
  puzzles: {
    Dutch:   "Geen tactische puzzels gevonden.",
    English: "No tactical puzzles found.",
    Arabic:  "لم يتم العثور على ألعاب ألغاز.",
  }
};

function Empty_State({ UI_Language, Kind }: { UI_Language: International_Language; Kind: Empty_Kind }) {
  return (
    <div className="px-4 w-full">
      <Container className="p-6 text-center text-sm opacity-70">
        {Empty_Messages[Kind][UI_Language] ?? Empty_Messages[Kind].English}
      </Container>
    </div>
  );
}

/**
 * Strips leading ordering prefixes like "1-", "02-", "3_" from names
 * e.g., "3-The-Bishop" => "The-Bishop"
 */
function Clean_Display_Name(Name: string | undefined): string {
  if (!Name) return "";
  return Name.replace(/^\d+[\s_-]*/, "");
}

function Resolve_Lesson_Text(Key_Or_Text: string | undefined, _Lang: string): string {
  if (!Key_Or_Text) return "";
  return Key_Or_Text;
}

type Lesson_Phase = "intro" | "play" | "done";

export function Chess_Lesson_View() {
  const { Category, subcategory, Lesson_ID } = useParams();
  const Navigate = useNavigate();
  const { UI_Language, International_Language, t } = Use_Course_Language();
  const [Settings] = Use_Chess_Settings();

  const [Corpus_Levels, Set_Corpus_Levels] = useState<Chess_Level[]>([]);
  const [Loading, Set_Loading] = useState<boolean>(true);

  // Completed lessons tracker stored in local state/storage
  const [Completed_Lessons, Set_Completed_Lessons] = useState<Set<string>>(() => {
    try {
      const Saved = localStorage.getItem("chess_completed_lessons");
      return Saved ? new Set(JSON.parse(Saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const Mark_Lesson_Complete = (ID: string) => {
    Set_Completed_Lessons((Prev) => {
      const Updated = new Set(Prev).add(ID);
      try {
        localStorage.setItem("chess_completed_lessons", JSON.stringify([...Updated]));
      } catch (Error) {
        console.error("Failed to persist lesson progress:", Error);
      }
      return Updated;
    });
  };

  useEffect(() => {
    Fetch_Chess_Levels()
      .then((Levels) => {
        if (Array.isArray(Levels)) {
          Set_Corpus_Levels(Levels);
        }
      })
      .catch((Error) => console.error("Corpus error:", Error))
      .finally(() => Set_Loading(false));
  }, []);

  const Current_Lvl = useMemo(() => Corpus_Levels.find((L) => L.id === Category?.toLowerCase()), [Corpus_Levels, Category]);
  const Current_Grp = useMemo(() => Current_Lvl?.groups?.find((G: Chess_Group) => G.id === subcategory), [Current_Lvl, subcategory]);
  const Lesson_Entry = useMemo(() => Current_Grp?.lessons?.find((L: Chess_Lesson) => L.id === Lesson_ID), [Current_Grp, Lesson_ID]);

  const Parsed_Lesson = useMemo(() => {
    if (!Category || !subcategory || !Lesson_ID || !Lesson_Entry) return null;
    const Raw = Lesson_Entry?.steps?.[0];
    return Parse_Lesson_Step(Raw);
  }, [Category, subcategory, Lesson_ID, Lesson_Entry]);

  const [Phase, Set_Phase] = useState<Lesson_Phase>("intro");
  const [Piece, Set_Piece] = useState<Placed_Piece | null>(null);
  const [Extras, Set_Extras] = useState<Placed_Piece[]>([]);
  const [Stars, Set_Stars] = useState<string[]>([]);
  const [Captured, Set_Captured] = useState<Set<string>>(new Set());
  const [Selected, Set_Selected] = useState<string | null>(null);
  const [Last_Move, Set_Last_Move] = useState<{ from: string; to: string } | null>(null);
  const [Can_Advance, Set_Can_Advance] = useState(false);
  const [Pulse, Set_Pulse] = useState(1);

  // Target sequence calculations for next step/lesson
  const Next_Lesson_Route = useMemo(() => {
    if (!Current_Grp || !Lesson_Entry) return null;
    const Current_Index = Current_Grp.lessons.findIndex((L: Chess_Lesson) => L.id === Lesson_Entry.id);
    const Next = Current_Grp.lessons[Current_Index + 1];
    return Next ? `/Chess/Lesson/${Category}/${subcategory}/${Next.id}` : null;
  }, [Current_Grp, Lesson_Entry, Category, subcategory]);

  useEffect(() => {
    if (!Parsed_Lesson) return;
    Set_Phase("intro");
    Set_Piece({ ...Parsed_Lesson.piece });
    Set_Extras((Parsed_Lesson.Extras ?? []).map((P: Placed_Piece) => ({ ...P })));
    Set_Captured(new Set());
    Set_Selected(null);
    Set_Last_Move(null);
    Set_Can_Advance(false);

    if (Parsed_Lesson.Random_Stars && Parsed_Lesson.Random_Stars > 0 && typeof reachableSquares === "function") {
      const Reach = reachableSquares(Parsed_Lesson.piece.type, Parsed_Lesson.piece.square).filter((S) => S !== Parsed_Lesson.piece.square);
      const Picked: string[] = [];
      const Pool = [...Reach];
      const N = Math.min(Parsed_Lesson.Random_Stars, Pool.length);
      for (let I = 0; I < N; I++) {
        const Index = Math.floor(Math.random() * Pool.length);
        Picked.push(Pool.splice(Index, 1)[0]);
      }
      Set_Stars(Picked);
    } else {
      Set_Stars([...(Parsed_Lesson.Stars ?? [])]);
    }
  }, [Parsed_Lesson]);

  // Handle immediate navigation on lesson completion
  useEffect(() => {
    if (Phase !== "done" || !Lesson_Entry) return;

    Mark_Lesson_Complete(Lesson_Entry.id);

    // Skip completion modal: go directly to next lesson or subcategory slug
    if (Next_Lesson_Route) {
      Navigate(Next_Lesson_Route, { replace: true });
    } else {
      Navigate(`/Chess/Lesson/${Category}/${subcategory}`, { replace: true });
    }
  }, [Phase, Lesson_Entry, Next_Lesson_Route, Navigate, Category, subcategory]);

  // Arrow animation Pulse logic
  useEffect(() => {
    if (Phase !== "intro" || !Parsed_Lesson) return;
    let Frame_ID = 0;
    const Start = performance.now();
    const Tick = (Time: number) => {
      const Progress = ((Time - Start) % 1200) / 1200;
      Set_Pulse(0.45 + 0.55 * (0.5 - 0.5 * Math.cos(Progress * Math.PI * 2)));
      Frame_ID = requestAnimationFrame(Tick);
    };
    Frame_ID = requestAnimationFrame(Tick);
    return () => cancelAnimationFrame(Frame_ID);
  }, [Phase, Parsed_Lesson]);

  // Intro narration handler
  useEffect(() => {
    if (Phase !== "intro" || !Parsed_Lesson) return;
    Set_Can_Advance(false);
    const Text_Content = Resolve_Lesson_Text(Parsed_Lesson.intro, UI_Language);
    if (Settings.Speak_Narration && typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const Utterance = new SpeechSynthesisUtterance(Text_Content);
        Utterance.lang = UI_Language === "nl" ? "nl-NL" : UI_Language === "ar" ? "ar-SA" : "en-US";
        Utterance.rate = 0.95;
        Utterance.onend = () => Set_Can_Advance(true);
        Utterance.onerror = () => Set_Can_Advance(true);
        window.speechSynthesis.speak(Utterance);
        const Timeout = window.setTimeout(() => Set_Can_Advance(true), Math.max(1200, Text_Content.length * 60));
        return () => window.clearTimeout(Timeout);
      } catch {
        Set_Can_Advance(true);
      }
    } else {
      const Timeout = window.setTimeout(() => Set_Can_Advance(true), 500);
      return () => window.clearTimeout(Timeout);
    }
  }, [Phase, Parsed_Lesson, UI_Language, Settings.Speak_Narration]);

  const Active_Stars = useMemo(() => {
    if (Phase !== "play") return [];
    const Next_Index = Stars.findIndex((S) => !Captured.has(S));
    return Next_Index === -1 ? [] : [Stars[Next_Index]];
  }, [Phase, Stars, Captured]);

  const Intro_Arrows: Arrow[] = useMemo(() => {
    if (Phase !== "intro" || !Parsed_Lesson || !Parsed_Lesson.Intro_Arrows) return [];
    return Parsed_Lesson.Intro_Arrows.map((A: Arrow) => ({ ...A, color: "hsl(var(--primary))" }));
  }, [Phase, Parsed_Lesson]);

  const Handle_Continue = () => {
    if (Phase === "intro") {
      Set_Phase("play");
      Set_Can_Advance(false);
    }
  };

  const Try_Move = (From: string, To: string) => {
    if (Phase !== "play" || !Piece) return;
    if (From !== Piece.square || From === To) return;
    const Target_Extra = Extras.find((E) => E.square === To);
    const Would_Capture = !!Target_Extra || Stars.includes(To);

    if (typeof isLegalMove === "function" && !isLegalMove(Piece.type, From, To, Would_Capture)) return;

    Set_Piece((P) => (P ? { ...P, square: To } : null));
    if (Target_Extra) Set_Extras((ES) => ES.filter((E) => E !== Target_Extra));
    Set_Last_Move({ from: From, to: To });

    if (Stars.includes(To)) {
      const Next_Set = new Set(Captured);
      Next_Set.add(To);
      Set_Captured(Next_Set);

      // Trigger completion phase immediately once all sequence Stars are Captured
      if (Stars.every((S) => Next_Set.has(S))) {
        Set_Phase("done");
      }
    }
  };

  const Handle_Square = (Square: string) => {
    if (Phase !== "play" || !Piece) return;
    if (!Selected) {
      if (Piece.square === Square) Set_Selected(Square);
      return;
    }
    if (Square === Selected) return;
    Try_Move(Selected, Square);
    Set_Selected(null);
  };

  const Legal_Squares = useMemo(() => {
    if (Phase !== "play" || !Selected || !Piece || Selected !== Piece.square) return [];
    if (typeof reachableSquares !== "function" || typeof isLegalMove !== "function") return [];
    return reachableSquares(Piece.type, Piece.square).filter((To) => {
      const Target_Extra = Extras.find((E) => E.square === To);
      const Would_Capture = !!Target_Extra || Stars.includes(To);
      return isLegalMove(Piece.type, Piece.square, To, Would_Capture);
    });
  }, [Phase, Selected, Piece, Extras, Stars]);

  if (Loading) {
    return <div className="text-sm py-12 text-center opacity-60">Synchronizing lessons...</div>;
  }

  // ── VIEW 1: Pick Category Level ──
  if (!Category) {
    if (Corpus_Levels.length === 0) return <Empty_State UI_Language={International_Language} Kind="groups" />;

    return (
      <div className={Grid_Class}>
        {Corpus_Levels.map((Lvl, Index) => {
          const Is_Unlocked = Index === 0 || Completed_Lessons.size > 0;
          const Raw_Name = Lvl.name[International_Language] ?? Lvl.name.English ?? Lvl.id;
          const Display_Name = Clean_Display_Name(Raw_Name);

          return (
            <Button
              key={Lvl.id}
              disabled={!Is_Unlocked}
              onClick={() => Is_Unlocked && Navigate(`/Chess/Lesson/${Lvl.id}`)}
              className={Card_Class}
            >
              <span className="font-semibold">{Display_Name}</span>
              {!Is_Unlocked && <Lock className="h-4 w-4 ml-1.5 shrink-0 opacity-70" />}
            </Button>
          );
        })}
      </div>
    );
  }

  // ── VIEW 2: Pick Subcategory ──
  if (!subcategory) {
    if (!Current_Lvl) return <div className="px-4 text-sm py-6 text-center opacity-60">{t("notFound")}</div>;
    if (!Current_Lvl.groups || Current_Lvl.groups.length === 0) return <Empty_State UI_Language={International_Language} Kind="groups" />;

    return (
      <div className={Grid_Class}>
        {Current_Lvl.groups.map((G: Chess_Group, Index: number) => {
          const Is_Unlocked = Index === 0 || Completed_Lessons.size > 0;
          const Raw_Name = G.name[International_Language] ?? G.name.English ?? G.id;
          const Display_Name = Clean_Display_Name(Raw_Name);

          return (
            <Button
              key={G.id}
              disabled={!Is_Unlocked}
              onClick={() => Is_Unlocked && Navigate(`/Chess/Lesson/${Category}/${G.id}`)}
              className={Card_Class}
            >
              <span className="font-semibold">{Display_Name}</span>
              {!Is_Unlocked && <Lock className="h-4 w-4 ml-1.5 shrink-0 opacity-70" />}
            </Button>
          );
        })}
      </div>
    );
  }

  // ── VIEW 3: Pick Lesson ──
  if (!Lesson_ID) {
    if (!Current_Grp) return <div className="px-4 text-sm py-6 text-center opacity-60">{t("notFound")}</div>;
    if (!Current_Grp.lessons || Current_Grp.lessons.length === 0) return <Empty_State UI_Language={International_Language} Kind="lessons" />;

    return (
      <div className={Grid_Class}>
        {Current_Grp.lessons.map((LS: Chess_Lesson, Index: number) => {
          const Prev_Lesson = Current_Grp.lessons[Index - 1];
          // Unlock rule: First lesson is unlocked; otherwise previous lesson must be completed
          const Is_Unlocked = Index === 0 || (Prev_Lesson && Completed_Lessons.has(Prev_Lesson.id));
          const Raw_Name = LS.name[International_Language] ?? LS.name.English ?? LS.id;
          const Display_Name = Clean_Display_Name(Raw_Name);

          return (
            <Button
              key={LS.id}
              disabled={!Is_Unlocked}
              onClick={() => Is_Unlocked && Navigate(`/Chess/Lesson/${Category}/${subcategory}/${LS.id}`)}
              className={Card_Class}
            >
              <span className="font-semibold">{Display_Name}</span>
              {!Is_Unlocked && <Lock className="h-4 w-4 ml-1.5 shrink-0 opacity-70" />}
            </Button>
          );
        })}
      </div>
    );
  }

  // ── VIEW 4: Interactive Lesson Engine ──
  if (!Parsed_Lesson || !Piece) {
    return (
      <div className="px-4 text-center p-8 space-y-3">
        <p className="text-sm text-destructive">Could not load lesson.</p>
      </div>
    );
  }

  const Continue_Label = UI_Language === "nl" ? "Doorgaan" : UI_Language === "ar" ? "متابعة" : "Continue";
  const Total_Stars = Stars.length;
  const Done_Count = Captured.size;
  const All_Pieces = [Piece, ...Extras];

  return (
    <div className="px-4 w-full">
      <div className="grid gap-3 md:grid-cols-[1fr_320px] md:items-stretch max-w-5xl mx-auto">
        <div className="w-full mx-auto md:mx-0 flex justify-center">
          <Container className="p-2 rounded-[20px] w-full max-w-[min(100%,calc(100svh-22rem))] md:max-w-none">
            <div className="relative">
              <Chessboard
                pieces={All_Pieces}
                Stars={Active_Stars}
                orientation={Parsed_Lesson.orientation ?? "white"}
                selected={Selected}
                Legal_Squares={Legal_Squares}
                Last_Move={Last_Move}
                arrows={Intro_Arrows}
                arrowLengthScale={Phase === "intro" ? Pulse : 1}
                onSquareClick={Handle_Square}
                onPieceDrop={(From, To) => Try_Move(From, To)}
                onDragBegin={(Square) => {
                  if (Piece && Square === Piece.square) Set_Selected(Square);
                }}
                onClearSelection={() => Set_Selected(null)}
                interactiveColor={Piece.color as Piece_Color}
                Input_Mode={Settings.Input_Mode}
                animate={Settings.Animate_Pieces}
                animationMs={Settings.Animation_Speed}
              />
            </div>
          </Container>
        </div>

        <div className="flex flex-col gap-3 md:justify-between">
          <Container className="p-3 text-sm leading-relaxed min-h-[88px]">
            {Resolve_Lesson_Text(Parsed_Lesson.intro, UI_Language)}
          </Container>

          <div className="flex items-center gap-2 justify-center flex-wrap">
            {Phase === "play" && (
              <span className="text-xs px-3 py-2 rounded-full border border-border bg-background font-mono flex items-center gap-1.5 whitespace-nowrap">
                <Star className="h-3.5 w-3.5 fill-current" />
                {Done_Count}/{Total_Stars}
              </span>
            )}
            {Phase === "intro" && (
              <Button
                onClick={Handle_Continue}
                disabled={!Can_Advance}
                aria-label={Continue_Label}
                title={Continue_Label}
                className="flex-1 max-w-[200px] gap-2"
              >
                <span className="font-semibold">{Continue_Label}</span>
                <ChevronRight className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}