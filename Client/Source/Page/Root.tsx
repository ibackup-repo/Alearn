import { useNavigate } from "react-router-dom"; // of "next/navigation" als je Next.js gebruikt
import { Button } from "@/Component/UI/Button/Index";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { LANGUAGE_LABEL, CHESS_LABEL } from "@/Library/Language";
import { UI_Provider } from "@/Context/UI";

export default function Root_Picker() {
  const { UI_Language } = Use_Course_Language();
  const navigate = useNavigate();

  const Language_Text = LANGUAGE_LABEL[UI_Language] || "Language";
  const Chess_Text = CHESS_LABEL[UI_Language] || "Chess";

  return (
    <UI_Provider>
      <div className="grid grid-cols-2 gap-3 w-full px-4 relative">
        <Button 
          Label={Language_Text} 
          Height={64} 
          On_Click={() => navigate("/Language")} 
        />
        <Button 
          Label={Chess_Text} 
          Height={64} 
          On_Click={() => navigate("/Chess")} 
        />
      </div>
    </UI_Provider>
  );
}