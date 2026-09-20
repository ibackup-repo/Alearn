import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/Component/UI/Button";
import { Lock } from "lucide-react";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { Chess_Group, Chess_Lesson } from "@/Library/Chess-Types";
import { useChessData, Clean_Display_Name, Empty_State, Grid_Class, Card_Class } from "./Shared";

export function Chess_Lesson_List_View() {
  const { Category, subcategory } = useParams();
  const Navigate = useNavigate();
  const { International_Language, t } = Use_Course_Language();
  const { Corpus_Levels, Loading, Completed_Lessons } = useChessData();

  const Current_Lvl = useMemo(
    () => Corpus_Levels.find((L) => L.id === Category?.toLowerCase()),
    [Corpus_Levels, Category]
  );
  const Current_Grp = useMemo(
    () => Current_Lvl?.groups?.find((G: Chess_Group) => G.id === subcategory),
    [Current_Lvl, subcategory]
  );

  if (Loading) {
    return <div className="text-sm py-12 text-center opacity-60">Synchronizing lessons...</div>;
  }

  if (!Current_Grp) {
    return <div className="px-4 text-sm py-6 text-center opacity-60">{t("notFound")}</div>;
  }

  if (!Current_Grp.lessons || Current_Grp.lessons.length === 0) {
    return <Empty_State UI_Language={International_Language} Kind="lessons" />;
  }

  return (
    <div className={Grid_Class}>
      {Current_Grp.lessons.map((LS: Chess_Lesson, Index: number) => {
        const Prev_Lesson = Current_Grp.lessons[Index - 1];
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