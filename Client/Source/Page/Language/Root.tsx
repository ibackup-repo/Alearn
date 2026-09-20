import { Use_App } from "@/Context/App";
import { Button } from "@/Component/UI/button";

export default function Language_Root() {
  const { 
    Set_Learning_Language, 
    Active_Languages, 
    Inactive_Languages 
  } = Use_App();

  const Has_Active_Languages = Active_Languages.length > 0;
  const languagesToDisplay = Has_Active_Languages ? Active_Languages : Inactive_Languages;

  return (
    <div className="px-8 py-4 w-full relative z-[49]">
      <div className="grid grid-cols-2 gap-3">
        {languagesToDisplay.map((lang) => (
          <Button
            key={lang}
            Label={lang}
            NavigateTo={`/Language/${lang}`}
            OnClick={() => Set_Learning_Language(lang)}
            Height={64}
            Color="#000000"
            TextColor="#ffffff"
          />
        ))}
      </div>
    </div>
  );
}