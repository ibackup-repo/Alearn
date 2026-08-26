// @/Component/Header/Add.tsx
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Minus } from "lucide-react";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { Use_App } from "@/Context/App";
import { Navigator_Layout } from "@/Component/Layout/Utility";
import { Button } from "@/Component/UI/Button"; 
import { Container } from "@/Component/UI/container";
import { SlidingPill } from "@/Component/UI/Sliding-Pill";

type Mode_Type = "add" | "delete";

export function Add() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = Use_Course_Language();
  const { 
    Set_Learning_Language, 
    Remove_Course, 
    Inactive_Languages = [], 
    Active_Languages = [] 
  } = Use_App();

  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [Search_Query, Set_Search_Query] = useState("");
  const [mode, setMode] = useState<Mode_Type>("add");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (Inactive_Languages.length > 0) {
        setMode("add");
      } else if (Active_Languages.length > 0) {
        setMode("delete");
      }
    }
  }, [isOpen, Inactive_Languages.length, Active_Languages.length]);

  if (!location.pathname.toLowerCase().startsWith("/language")) {
    return null;
  }

  const Has_Active = Active_Languages.length > 0;
  const Has_Inactive = Inactive_Languages.length > 0;
  const Current_List = mode === "add" ? Inactive_Languages : Active_Languages;

  const Filtered_Languages = Current_List.filter((lang) =>
    !Search_Query || lang.toLowerCase().includes(Search_Query.toLowerCase().trim())
  );

  const Handle_Pick = (name: string) => {
    setIsOpen(false);
    setIsSearching(false);
    Set_Search_Query("");

    if (mode === "add") {
      Set_Learning_Language(name);
      navigate(`/Language/${name}`);
    } else {
      Remove_Course(name);
      navigate("/Language");
    }
  };

  const Pill_Options = [
    { value: "add" as Mode_Type, label: "", icon: <Plus className="h-4 w-4 stroke-[2.5]" /> },
    { value: "delete" as Mode_Type, label: "", icon: <Minus className="h-4 w-4 stroke-[2.5]" /> }
  ];

  const Render_Header = () => {
    const Container_Classes = "flex items-center justify-center h-7 w-9 rounded-full bg-muted border border-border/40 text-muted-foreground/80 !py-0 !px-0";

    if (!Has_Active) {
      return (
        <Container className={Container_Classes}>
          <Plus className="h-4 w-4 stroke-[2.5]" />
        </Container>
      );
    }
    if (!Has_Inactive) {
      return (
        <Container className={Container_Classes}>
          <Minus className="h-4 w-4 stroke-[2.5]" />
        </Container>
      );
    }
    return (
      <SlidingPill
        options={Pill_Options}
        selectedValue={mode}
        onChange={setMode}
        width="w-24"
        height="h-8"
      />
    );
  };

  // Dynamically determine the trigger icon based on whether courses are available to be added
  const Closed_Icon = !Has_Inactive ? <Minus /> : <Plus />;

  return (
    <Navigator_Layout
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      isSearching={isSearching}
      setIsSearching={setIsSearching}
      Search_Query={Search_Query}
      Set_Search_Query={Set_Search_Query}
      inputRef={inputRef}
      Button_Label="" 
      Render_Mobile_Header_Left={Render_Header}
      Render_Desktop_Header_Left={Render_Header}
      Show_Go_Back={false}
      Disable_Header_Container={true}
      Closed_Icon={Closed_Icon} // <-- Passing clean, customized dynamic icon
    >
      <div className="flex flex-col gap-1.5 px-3 pt-2 sm:p-2 w-full relative">
        {Filtered_Languages.map((lang) => (
          <Button
            key={lang}
            type="button"
            variant={mode === "add" ? "default" : "destructive"}
            className="justify-between text-left w-full h-9 px-4 rounded-full text-sm font-medium transition-colors"
            onClick={() => Handle_Pick(lang)}
          >
            <span>{lang}</span>
            {mode === "add" && lang.toLowerCase() === "pashto" && (
              <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full bg-background border border-border text-muted-foreground">
                Preview
              </span>
            )}
          </Button>
        ))}

        {Filtered_Languages.length === 0 && (
          <p className="text-xs text-muted-foreground p-6 text-center">
            {mode === "add" 
              ? (t("noInactive") || "No remaining tracks to add.") 
              : (t("noActive") || "No active courses found.")}
          </p>
        )}
      </div>
    </Navigator_Layout>
  );
}