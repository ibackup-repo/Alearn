import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/Component/UI/Button";
import { Lock } from "lucide-react";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { Chess_Group } from "@/Library/Chess-Types";
import { useChessData, Clean_Display_Name, Empty_State, Grid_Class, Card_Class } from "./Shared";

export function Chess_Subcategory_View() {
  const { Category } = useParams();
  const Navigate = useNavigate();
  const { International_Language, t } = Use_Course_Language();
  const { Corpus_Levels, Loading, Completed_Lessons } = useChessData();

  const Current_Lvl = useMemo(
    () => Corpus_Levels.find((L) => L.id === Category?.toLowerCase()),
    [Corpus_Levels, Category]
  );

  if (Loading) {
    return <div className="text-sm py-12 text-center opacity-60">Synchronizing subcategories...</div>;
  }

  if (!Current_Lvl) {
    return <div className="px-4 text-sm py-6 text-center opacity-60">{t("notFound")}</div>;
  }

  if (!Current_Lvl.groups || Current_Lvl.groups.length === 0) {
    return <Empty_State UI_Language={International_Language} Kind="groups" />;
  }

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