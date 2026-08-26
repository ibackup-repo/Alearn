import { useNavigate } from "react-router-dom";
import { Button } from "@/Component/UI/Button";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { LANGUAGE_LABEL, CHESS_LABEL } from "@/Library/Language";

export default function Root_Picker() {
  const navigate = useNavigate();
  const { UI_Language } = Use_Course_Language();

  return (
    <div className="grid grid-cols-2 gap-3 w-full px-4">
      <Button
        onClick={() => navigate("/Language")}
        className="min-h-[64px] py-3 rounded-full flex items-center justify-center text-base"
      >
        <span className="font-semibold">{LANGUAGE_LABEL[UI_Language] || "Language"}</span>
      </Button>

      <Button
        onClick={() => navigate("/Chess")}
        className="min-h-[64px] py-3 rounded-full flex items-center justify-center text-base"
      >
        <span className="font-semibold">{CHESS_LABEL[UI_Language] || "Chess"}</span>
      </Button>
    </div>
  );
}