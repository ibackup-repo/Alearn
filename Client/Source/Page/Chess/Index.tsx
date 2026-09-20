import { Button } from "@/Component/UI/button";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";

export type International_Language = "Dutch" | "English" | "Arabic";

const CHESS_MENU_LABELS: Record<string, Record<International_Language, string>> = {
  lesson: { Dutch: "Les",    English: "Lesson", Arabic: "درس"  },
  puzzle: { Dutch: "Puzzel", English: "Puzzle", Arabic: "لغز"  },
  play:   { Dutch: "Spelen", English: "Play",   Arabic: "العب" },
};

const GRID_CLASS = "grid grid-cols-2 gap-3 w-full px-4";

export default function Chess_Index() {
  const { International_Language } = Use_Course_Language();

  return (
    <div className="w-full py-4 px-4 flex flex-col gap-4 relative z-[49]">
      <div className={GRID_CLASS}>
        {Object.entries(CHESS_MENU_LABELS).map(([id, labels]) => {
          const route = id.charAt(0).toUpperCase() + id.slice(1);
          const labelText = labels[International_Language] ?? labels.English;

          return (
            <Button
              key={id}
              Label={labelText}
              NavigateTo={`/Chess/${route}`}
              Height={64}
              Color="#000000"
              TextColor="#ffffff"
            />
          );
        })}
      </div>
    </div>
  );
}