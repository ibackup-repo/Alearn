import { useEffect, useState } from "react";
import { Container } from "@/Component/UI/container";
import { Fetch_Chess_Levels } from "@/Library/Chess-API";
import { Chess_Level } from "@/Library/Chess-Types";

export type International_Language = "Dutch" | "English" | "Arabic";

export const Grid_Class = "grid grid-cols-2 gap-3 w-full px-5 pt-2 z-50";
export const Card_Class = "min-h-[64px] py-3 px-3 flex items-center justify-center text-center text-base";

export type Empty_Kind = "subcategories" | "words" | "groups" | "lessons" | "puzzles";

const Empty_Messages: Record<Empty_Kind, Record<International_Language, string>> = {
  subcategories: {
    Dutch: "Deze categorie is leeg. Voeg subcategorieën of woorden toe.",
    English: "This Category is empty. Add subcategories or words.",
    Arabic: "هذه الفئة فارغة. أضف فئات فرعية أو كلمات.",
  },
  words: {
    Dutch: "Geen woorden hier. Tik op + om er een toe te voegen.",
    English: "No words here. Tap + to add one.",
    Arabic: "لا توجد كلمات هنا. اضغط + للإضافة.",
  },
  groups: {
    Dutch: "Dit niveau is nog leeg. Binnenkort meer lessen.",
    English: "This level is empty. More lessons coming soon.",
    Arabic: "هذا المستوى فارغ. قريباً المزيد من الدروس.",
  },
  lessons: {
    Dutch: "Deze groep is nog leeg. Binnenkort meer lessen.",
    English: "This group is empty. More lessons coming soon.",
    Arabic: "هذه المجموعة فارغة. قريباً المزيد من الدروس.",
  },
  puzzles: {
    Dutch: "Geen tactische puzzels gevonden.",
    English: "No tactical puzzles found.",
    Arabic: "لم يتم العثور على ألعاب ألغاز.",
  }
};

export function Clean_Display_Name(Name: string | undefined): string {
  if (!Name) return "";
  return Name.replace(/^\d+[\s_-]*/, "");
}

export function Empty_State({ UI_Language, Kind }: { UI_Language: International_Language; Kind: Empty_Kind }) {
  return (
    <div className="px-4 w-full">
      <Container className="p-6 text-center text-sm opacity-70">
        {Empty_Messages[Kind][UI_Language] ?? Empty_Messages[Kind].English}
      </Container>
    </div>
  );
}

export function useChessData() {
  const [Corpus_Levels, Set_Corpus_Levels] = useState<Chess_Level[]>([]);
  const [Loading, Set_Loading] = useState<boolean>(true);

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
        if (Array.isArray(Levels)) Set_Corpus_Levels(Levels);
      })
      .catch((Error) => console.error("Corpus error:", Error))
      .finally(() => Set_Loading(false));
  }, []);

  return { Corpus_Levels, Loading, Completed_Lessons, Mark_Lesson_Complete };
}