import { useNavigate } from "react-router-dom";
import { Button } from "@/Component/UI/Button";
import { Lock } from "lucide-react";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { useChessData, Clean_Display_Name, Empty_State, Grid_Class, Card_Class } from "./Shared";

export function Chess_Category_View() {
  const Navigate = useNavigate();
  const { International_Language } = Use_Course_Language();
  const { Corpus_Levels, Loading, Completed_Lessons } = useChessData();

  if (Loading) {
    return <div className="text-sm py-12 text-center opacity-60">Synchronizing categories...</div>;
  }

  if (Corpus_Levels.length === 0) {
    return <Empty_State UI_Language={International_Language} Kind="groups" />;
  }

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