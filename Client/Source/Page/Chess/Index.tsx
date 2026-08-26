import { useNavigate } from "react-router-dom";
import { Button } from "@/Component/UI/Button";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";

export type International_Language = "Dutch" | "English" | "Arabic";

const CHESS_MENU_LABELS: Record<string, Record<International_Language, string>> = {
  lesson: { Dutch: "Les",    English: "Lesson", Arabic: "درس"  },
  puzzle: { Dutch: "Puzzel", English: "Puzzle", Arabic: "لغز"  },
  play:   { Dutch: "Spelen", English: "Play",   Arabic: "العب" },
};

const GRID_CLASS = "grid grid-cols-2 gap-3 w-full px-4";
const CARD_CLASS = "min-h-[64px] py-3 px-3 flex items-center justify-center text-center text-base";

export default function Chess_Index() {
  const navigate = useNavigate(); // Hook to change browser URL
  const { International_Language } = Use_Course_Language();

  const Handle_Menu_Click = (id: string) => {
    // Capitalized to match your React Router path definitions (/Chess/Play, /Chess/Puzzle, /Chess/Lesson)
    const route = id.charAt(0).toUpperCase() + id.slice(1);
    navigate(`/Chess/${route}`);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className={GRID_CLASS}>
        {Object.entries(CHESS_MENU_LABELS).map(([id, labels]) => (
          <Button 
            key={id} 
            onClick={() => Handle_Menu_Click(id)} 
            className={CARD_CLASS}
          >
            <span className="font-semibold">{labels[International_Language] ?? labels.English}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}