import { Button } from "@/Component/UI/button";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { LANGUAGE_LABEL, CHESS_LABEL } from "@/Library/Language";

export default function Root_Picker() {
  const { UI_Language } = Use_Course_Language();

  const Language_Text = LANGUAGE_LABEL[UI_Language] || "Language";
  const Chess_Text = CHESS_LABEL[UI_Language] || "Chess";

  return (
    <div className="grid grid-cols-2 gap-3 w-full px-4 relative">
      <Button Label={Language_Text} NavigateTo="/Language" Height={64} />
      <Button Label={Chess_Text} NavigateTo="/Chess" Height={64} />
    </div>
  );
}