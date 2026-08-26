import { Use_App } from "@/Context/App";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { CardButton } from "@/Component/UI/card-button";
import { Check } from "lucide-react";

const LANGS: { code: "nl" | "en" | "ar"; native: string }[] = [
  { code: "nl", native: "Nederlands" },
  { code: "en", native: "English" },
  { code: "ar", native: "العربية القرآنية" },
];

export function LanguageSection() {
  const { Interface_Language, Set_Interface_Language } = Use_App();
  const { t } = Use_Course_Language();

  // Show every interface language. The interface language is independent of
  // any course/target language, so we no longer hide options that happen to
  // match an existing course.
  return (
    <div className="space-y-3">
      <p className="text-sm opacity-70">{t("changeInterfaceLanguage")}</p>
      {LANGS.map(l => {
        const active = Interface_Language === l.code;
        return (
          <CardButton
            key={l.code}
            onClick={() => Set_Interface_Language(l.code)}
            className={active ? "bg-foreground text-background border-border" : ""}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{l.native}</span>
              {active && <Check className="h-4 w-4" />}
            </div>
          </CardButton>
        );
      })}
    </div>
  );
}
