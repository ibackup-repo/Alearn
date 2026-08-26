import { Use_App, Theme_Choice } from "@/Context/App";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { CardButton } from "@/Component/UI/card-button";
import { Check, Sun, Moon, Laptop } from "lucide-react";

const OPTIONS: { id: Theme_Choice; Label_Key: string; Icon: any }[] = [
  { id: "light",  Label_Key: "themeLight",  Icon: Sun },
  { id: "dark",   Label_Key: "themeDark",   Icon: Moon },
  { id: "system", Label_Key: "themeSystem", Icon: Laptop },
];

export function ThemeSection() {
  const { theme, Set_Theme } = Use_App();
  const { t } = Use_Course_Language();
  return (
    <div className="space-y-3">
      {OPTIONS.map(({ id, Label_Key, Icon }) => {
        const active = theme === id;
        return (
          <CardButton
            key={id}
            onClick={() => Set_Theme(id)}
            className={active ? "bg-foreground text-background border-background" : ""}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                <Icon className="h-4 w-4" /> {t(Label_Key)}
              </span>
              {active && <Check className="h-4 w-4" />}
            </div>
          </CardButton>
        );
      })}
    </div>
  );
}
