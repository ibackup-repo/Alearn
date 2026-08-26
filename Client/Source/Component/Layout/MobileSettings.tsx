// @/Component/Header/Mobile_Settings_Header.tsx
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Search, X } from "lucide-react";
import { cn } from "@/Library/Utility";
import { Button } from "@/Component/UI/Button";
import { Input } from "@/Component/UI/Input";
import { TitleBar } from "@/Component/UI/title-bar";
import { Mobile_Settings_Store } from "@/Component/Settings/Mobile-Settings-Store";

interface Mobile_Settings_Header_Properties {
  Is_Visible: boolean;
  Is_RTL: boolean;
  t: (k: string) => string;
  onBack: () => void;
  Is_Settings_Sidebar_Open: boolean;
}

const Custom_Btn_Size = { width: "40px", height: "40px" };

export function Mobile_Settings_Header({
  Is_Visible,
  Is_RTL,
  t,
  onBack,
  Is_Settings_Sidebar_Open,
}: Mobile_Settings_Header_Properties) {
  const [Mobile_Settings, Set_Mobile_Settings] = useState(() => Mobile_Settings_Store.getState());
  const [Settings_Search_Active, Set_Settings_Search_Active] = useState(false);
  const [Settings_Search_Value, Set_Settings_Search_Value] = useState("");
  const Settings_Search_Input_Ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const Unsubscribe_Mode = Mobile_Settings_Store.subscribe(() => {
      const state = Mobile_Settings_Store.getState();
      Set_Mobile_Settings(state);
      Set_Settings_Search_Active(state.Is_Search_Mode);
    });
    const unsubscribeSearch = Mobile_Settings_Store.subscribeSearch(() => {
      Set_Settings_Search_Value(Mobile_Settings_Store.Get_Search_Query());
    });
    return () => {
      Unsubscribe_Mode();
      unsubscribeSearch();
    };
  }, []);

  useEffect(() => {
    if (Settings_Search_Active && Settings_Search_Input_Ref.current) {
      Settings_Search_Input_Ref.current.focus();
    }
    if (!Settings_Search_Active) Set_Settings_Search_Value("");
  }, [Settings_Search_Active]);

  useEffect(() => {
    if (!Is_Settings_Sidebar_Open && Settings_Search_Active) {
      Mobile_Settings_Store.Exit_Search_Mode();
    }
  }, [Is_Settings_Sidebar_Open, Settings_Search_Active]);

  const Handle_Settings_Search_Change = (v: string) => {
    Set_Settings_Search_Value(v);
    Mobile_Settings_Store.Set_Search_Query(v);
  };

  const Exit_Settings_Search = () => {
    Mobile_Settings_Store.Exit_Search_Mode();
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-transform duration-300 bg-transparent isolate select-none px-4 md:px-6 py-2 flex flex-row items-center h-16 gap-x-2",
        Is_Visible ? "translate-y-0" : "-translate-y-full"
      )}
      dir={Is_RTL ? "rtl" : "ltr"}
    >
      <div className="flex items-center h-[40px] w-full gap-2">
        {Settings_Search_Active ? (
          <>
            <Button
              size="icon"
              onClick={Exit_Settings_Search}
              aria-label={t("Back") || "Back"}
              className="shrink-0 p-0"
              style={Custom_Btn_Size}
            >
              <ArrowLeft className={cn("h-5 w-5", Is_RTL && "rotate-180")} />
            </Button>
            <div className="flex-1 min-w-0">
              <Input
                ref={Settings_Search_Input_Ref}
                placeholder="Search settings"
                value={Settings_Search_Value}
                onChange={(e) => Handle_Settings_Search_Change(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </>
        ) : (
          <>
            <Button
              size="icon"
              onClick={onBack}
              aria-label={Mobile_Settings.Show_Back ? (t("Back") || "Back") : (t("Close") || "Close")}
              className="shrink-0 p-0"
              style={Custom_Btn_Size}
            >
              {Mobile_Settings.Show_Back ? (
                <ArrowLeft className={cn("h-5 w-5", Is_RTL && "rotate-180")} />
              ) : (
                <X className="h-5 w-5" />
              )}
            </Button>
            <TitleBar className="font-semibold text-lg truncate h-[40px] flex items-center leading-none">
              {Mobile_Settings.title}
            </TitleBar>
            <Button
              size="icon"
              aria-label={t("Search") || "Search"}
              onClick={() => {
                Mobile_Settings_Store.Enter_Search_Mode(() => {
                  Set_Settings_Search_Value("");
                });
              }}
              className="ml-auto p-0 shrink-0"
              style={Custom_Btn_Size}
            >
              <Search className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}