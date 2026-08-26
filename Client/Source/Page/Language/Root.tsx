import { useNavigate } from "react-router-dom";
import { Button } from "@/Component/UI/Button";
import { Use_App } from "@/Context/App";

export default function Language_Root() {
  const navigate = useNavigate();
  const { 
    Set_Learning_Language, 
    Active_Languages, 
    Inactive_Languages 
  } = Use_App();

  const Handle_Pick = (name: string) => {
    Set_Learning_Language(name);
    navigate(`/Language/${name}`);
  };

  const Has_Active_Languages = Active_Languages.length > 0;

  return (
    <div className="px-4 w-full">
      {Has_Active_Languages ? (
        /* Clean Active View (No titles, just the active track buttons) */
        <div className="grid grid-cols-2 gap-3">
          {Active_Languages.map((lang) => (
            <Button
              key={lang}
              onClick={() => Handle_Pick(lang)}
              className="min-h-[64px] py-3 text-base"
            >
              <span className="font-semibold">{lang}</span>
            </Button>
          ))}
        </div>
      ) : (
        /* Clean Empty State View (Just the grid of available choices) */
        <div className="grid grid-cols-2 gap-3">
          {Inactive_Languages.map((lang) => (
            <Button
              key={lang}
              onClick={() => Handle_Pick(lang)}
              className="min-h-[64px] py-3 text-base"
            >
              <span className="font-semibold">{lang}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}