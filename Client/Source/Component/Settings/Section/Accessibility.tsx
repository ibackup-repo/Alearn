import { Use_App, Text_Size } from "@/Context/App";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { Button } from "@/Component/UI/Button";
import { Check } from "lucide-react";

const SIZES: { id: Text_Size; Label_Key: string }[] = [
  { id: "sm", Label_Key: "textSizeSmall" },
  { id: "md", Label_Key: "textSizeMedium" },
  { id: "lg", Label_Key: "textSizeLarge" },
];

export function AccessibilitySection() {
  const { textSize, Set_Text_Size, High_Contrast, Set_High_Contrast } = Use_App();
  const { t } = Use_Course_Language();

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold mb-3">{t("textSize")}</h3>
        <div className="space-y-2">
          {SIZES.map((s) => {
            const active = textSize === s.id;
            return (
              <Button
                key={s.id}
                active={active} // Pass active state directly!
                onClick={() => Set_Text_Size(s.id)}
                className="w-full rounded-2xl p-4 text-left justify-between"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{t(s.Label_Key)}</span>
                  {active && <Check className="h-4 w-4 shrink-0" />}
                </div>
              </Button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-3">{t("High_Contrast")}</h3>
        <Button
          active={High_Contrast} // Pass active state directly!
          onClick={() => Set_High_Contrast(!High_Contrast)}
          className="w-full rounded-2xl p-4 text-left justify-between"
        >
          <div className="flex items-center justify-between w-full">
            <div>
              <div className="font-medium">{t("High_Contrast")}</div>
              <div className="text-xs opacity-70 group-hover:opacity-100 transition-opacity mt-1">
                {t("highContrastDesc")}
              </div>
            </div>
            {High_Contrast && <Check className="h-4 w-4 shrink-0" />}
          </div>
        </Button>
      </section>
    </div>
  );
}