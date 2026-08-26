// @/Component/Header.tsx
import { useState, useEffect, useRef, memo, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Settings, Search, LogIn } from "lucide-react";
import { Use_App } from "@/Context/App";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { Use_Is_Mobile } from "@/Hook/Use-Mobile";
import { type Lesson_Progress_State } from "@/Library/Lesson-Progress";
import { cn } from "@/Library/Utility";
import { Button } from "@/Component/UI/Button";
import { TitleBar } from "@/Component/UI/title-bar";
import { Header_Search } from "@/Component/Search/Header-Search";
import { Recall_Queue_Button } from "./Button/AR";
import { Recall_Button } from "./Button/Recall";
import { Filter_Button } from "./Button/Filter";
import { Add } from "./Button/Add";
import { AddWord } from "./Button/AddWord";
import { Select_Button } from "./Button/Select";
import { AI_Call_Button } from "@/Component/AI-Call-Button";
import { Mobile_Settings_Store } from "@/Component/Settings/Mobile-Settings-Store";
import { Mobile_Settings_Header } from "@/Component/Layout/MobileSettings";

// 🚀 IMPORT THE 4 WORD ACTION BUTTONS
import { Speak_Button } from "./Button/Speak";
import { Mark_Button } from "./Button/Mark";
import { Favorite_Button } from "./Button/Favorite";
import { EditButton } from "./Button/Edit";

interface Header_Properties {
  Search_Open: boolean;
  Set_Search_Open: (open: boolean) => void;
  Lesson_State: Lesson_Progress_State | null;
  On_Layout_Change?: (isSplit: boolean) => void;
}

function Get_Page_Title(pathname: string, t: (k: string) => string, Has_Active_Languages: boolean): string {
  const lower = pathname.toLowerCase();
  if (lower.startsWith("/settings")) return t("Settings") || "Settings";
  if (lower.startsWith("/Recall")) return t("Recall") || "Recall";
  if (lower.startsWith("/sign")) return "Sign In";

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "";

  if ((lower === "/language" || lower === "/language/") && !Has_Active_Languages) {
    return "Add Language";
  }

  // If we are looking at a specific word detail, use the decoded Word_ID as the title
  const isWordDetail =
    segments[0]?.toLowerCase() === "language" &&
    segments[2]?.toLowerCase() === "dictionary" &&
    segments[3]?.toLowerCase() === "vocabulary" &&
    segments.length === 7;

  if (isWordDetail && segments[6]) {
    return decodeURIComponent(segments[6]);
  }

  return segments[segments.length - 1]
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const Custom_Btn_Size = { width: "40px", height: "40px" };

export const Header = memo(function Header({
  Search_Open,
  Set_Search_Open,
  Lesson_State,
  On_Layout_Change
}: Header_Properties) {
  const navigate = useNavigate();
  const location = useLocation();
  const Is_Mobile = Use_Is_Mobile();
  const { UI_Language, t } = Use_Course_Language();

  const App_Context = Use_App();

  const {
    Browse_Path = [],
    Is_Authenticated,
    Recall_Return_Path,
    Set_Recall_Return_Path,
    Set_Browse_Path,
    Inactive_Languages,
    Active_Languages = [],
    Recall_Queue = [],
    Is_Settings_Sidebar_Open,
    Set_Settings_Sidebar_Open,
  } = App_Context;

  const [Is_Visible, Set_Is_Visible] = useState(true);
  const Last_Scroll_Y = useRef(0);
  const [Is_Split_Layout, Set_Is_Split_Layout] = useState(false);

  const Header_Ref = useRef<HTMLHeadingElement>(null);
  const Left_Group_Ref = useRef<HTMLDivElement>(null);
  const Right_Group_Ref = useRef<HTMLDivElement>(null);

  const Lower_Path = location.pathname.toLowerCase();
  const Is_Settings = Lower_Path.startsWith("/settings");
  const Is_Recall = Lower_Path.startsWith("/Recall");
  const Is_Sign = Lower_Path.startsWith("/sign");
  const Is_Root_Home = location.pathname === "/";
  const Is_Language_Tree = Lower_Path.startsWith("/language");
  const Is_Language_Root_Only = Lower_Path === "/language" || Lower_Path === "/language/";

  const Has_Active_Languages = Active_Languages.length > 0;
  const In_Lesson = !!(Lesson_State && 'current' in Lesson_State && 'total' in Lesson_State);
  const Is_Mobile_Settings_Open = Is_Mobile && !!Is_Settings_Sidebar_Open;
  const Is_Desktop_Settings_Open = !Is_Mobile && !!Is_Settings_Sidebar_Open;
  const Show_Back = (!Is_Sign && !Is_Root_Home) || Is_Desktop_Settings_Open;
  const Show_Call = Is_Language_Tree && Browse_Path[0] === "Language" && Browse_Path.length >= 2 && !In_Lesson;
  const Is_RTL = UI_Language === "ar";

  // Parse path segments once for dynamic checks
  const Path_Segments = useMemo(() => location.pathname.split("/").filter(Boolean), [location.pathname]);

  // --- Dynamic Adjective/Vocabulary Route Validator ---
  const Show_Recall_Button = useMemo(() => {
    const Is_Under_Adjective_Vocab =
      Path_Segments[0]?.toLowerCase() === "language" &&
      Path_Segments[2]?.toLowerCase() === "dictionary" &&
      Path_Segments[3]?.toLowerCase() === "vocabulary" &&
      Path_Segments[4]?.toLowerCase() === "adjective";

    return Is_Under_Adjective_Vocab && Path_Segments.length >= 6;
  }, [Path_Segments]);

  // --- Strict Subcategory "Filter" Validator ---
  const Show_Filter_Button = useMemo(() => {
    return (
      Path_Segments[0]?.toLowerCase() === "language" &&
      Path_Segments[2]?.toLowerCase() === "dictionary" &&
      Path_Segments[3]?.toLowerCase() === "vocabulary" &&
      Path_Segments.length === 6
    );
  }, [Path_Segments]);

  // --- Strict Subcategory "AddWord" & "Select" Validator ---
  const Show_Subcategory_Controls = useMemo(() => {
    return (
      Path_Segments[0]?.toLowerCase() === "language" &&
      Path_Segments[2]?.toLowerCase() === "dictionary" &&
      Path_Segments[3]?.toLowerCase() === "vocabulary" &&
      Path_Segments.length === 6
    );
  }, [Path_Segments]);

  // --- 🚀 Word Detail Action Buttons Validator (Exact 7 segments) ---
  const Word_Detail_Context = useMemo(() => {
    const Is_Detail =
      Path_Segments[0]?.toLowerCase() === "language" &&
      Path_Segments[2]?.toLowerCase() === "dictionary" &&
      Path_Segments[3]?.toLowerCase() === "vocabulary" &&
      Path_Segments.length === 7;

    return {
      show: Is_Detail,
      Word_ID: Is_Detail && Path_Segments[6] ? decodeURIComponent(Path_Segments[6]) : "",
    };
  }, [Path_Segments]);

  useEffect(() => {
    if (On_Layout_Change) {
      On_Layout_Change(Is_Split_Layout);
    }
  }, [Is_Split_Layout, On_Layout_Change]);

  const Check_Layout_Capacity = useCallback(() => {
    const header = Header_Ref.current;
    if (!header || Search_Open || In_Lesson || Is_Mobile_Settings_Open) return;

    const leftEl = Left_Group_Ref.current;
    const rightEl = Right_Group_Ref.current;
    if (!leftEl || !rightEl) return;

    let Actual_Left_Width = 0;
    Array.from(leftEl.children).forEach((child) => {
      if (child.className.includes("absolute") && !child.className.includes("md:absolute")) {
        const titleText = child.querySelector("span, h1, div");
        Actual_Left_Width += titleText ? titleText.clientWidth : 0;
      } else {
        Actual_Left_Width += (child as HTMLElement).offsetWidth;
      }
    });

    let Actual_Right_Width = 0;
    Array.from(rightEl.children).forEach((child) => {
      Actual_Right_Width += (child as HTMLElement).offsetWidth;
    });

    const Available_Width = header.clientWidth;
    const Padding_Buffer = window.innerWidth >= 768 ? 100 : 64;

    if (Actual_Left_Width + Actual_Right_Width + Padding_Buffer >= Available_Width) {
      Set_Is_Split_Layout(true);
    } else {
      Set_Is_Split_Layout(false);
    }
  }, [Search_Open, In_Lesson, Is_Mobile_Settings_Open]);

  useEffect(() => {
    Set_Is_Split_Layout(false);
    const rafId = requestAnimationFrame(() => {
      Check_Layout_Capacity();
    });
    return () => cancelAnimationFrame(rafId);
  }, [location.pathname, Check_Layout_Capacity]);

  useEffect(() => {
    Check_Layout_Capacity();
    window.addEventListener("resize", Check_Layout_Capacity);
    return () => window.removeEventListener("resize", Check_Layout_Capacity);
  }, [Check_Layout_Capacity, Inactive_Languages.length, Show_Call, Show_Back, Is_Authenticated]);

  useEffect(() => {
    const Handle_Scroll = () => {
      const Current_Scroll_Y = window.scrollY;
      if (Current_Scroll_Y > Last_Scroll_Y.current && Current_Scroll_Y > 50) {
        Set_Is_Visible(false);
      } else {
        Set_Is_Visible(true);
      }
      Last_Scroll_Y.current = Current_Scroll_Y;
    };
    window.addEventListener("scroll", Handle_Scroll, { passive: true });
    return () => window.removeEventListener("scroll", Handle_Scroll);
  }, []);

  useEffect(() => {
    const Force_Hide = () => Set_Is_Visible(false);
    const Force_Show = () => Set_Is_Visible(true);
    window.addEventListener("header:hide", Force_Hide);
    window.addEventListener("header:show", Force_Show);
    return () => {
      window.removeEventListener("header:hide", Force_Hide);
      window.removeEventListener("header:show", Force_Show);
    };
  }, []);

  const Restore_From_Recall = useCallback(() => {
    if (Recall_Return_Path) {
      Set_Browse_Path(Recall_Return_Path);
      Set_Recall_Return_Path(null);
    }
  }, [Recall_Return_Path, Set_Browse_Path, Set_Recall_Return_Path]);

  const Handle_Back = useCallback(() => {
    // 1. Close settings panel if open
    if (Is_Desktop_Settings_Open) {
      Set_Settings_Sidebar_Open(false);
      return;
    }
    
    // 2. Close active header search bar if open
    if (Search_Open) { 
      Set_Search_Open(false); 
      return; 
    }
    
    // 3. Close and clean up active recall environments
    if (Is_Recall) { 
      Restore_From_Recall(); 
      navigate("/"); 
      return; 
    }
    if (Is_Settings) { 
      navigate("/"); 
      return; 
    }

    // 4. Hierarchical Category routing logic (prevents loops)
    if (Is_Language_Tree) {
      const segments = location.pathname.split("/").filter(Boolean);
      
      // If we are exactly at "/Language" or "/Language/", go back to Root Picker ("/")
      if (segments.length === 1 && segments[0].toLowerCase() === "language") {
        navigate("/");
        return;
      }

      // If we are deeper than "/Language", safely pop back one level
      if (segments.length > 1) {
        // Preserves exact original casing of your segments (e.g. /Language/English)
        const Parent_Path = "/" + segments.slice(0, -1).join("/");
        navigate(Parent_Path);
        return;
      }
    }

    // Fallback default back state
    navigate(-1);
  }, [
    Search_Open,
    Is_Recall,
    Is_Settings,
    Is_Language_Tree,
    location.pathname,
    navigate,
    Restore_From_Recall,
    Is_Desktop_Settings_Open,
    Set_Settings_Sidebar_Open,
    Set_Search_Open
  ]);

  // Dispatch custom event to trigger the edit modal inside Word_Detail_View
  const Handle_Edit_Click = useCallback(() => {
    window.dispatchEvent(new CustomEvent("word:edit-trigger"));
  }, []);

  if (Is_Mobile_Settings_Open) {
    return (
      <Mobile_Settings_Header
        Is_Visible={Is_Visible}
        Is_RTL={Is_RTL}
        t={t}
        onBack={() => Mobile_Settings_Store.goBack()}
        Is_Settings_Sidebar_Open={!!Is_Settings_Sidebar_Open}
      />
    );
  }

  return (
    <header
      ref={Header_Ref}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-transform duration-300 bg-transparent isolate select-none px-4 md:px-6 py-2 flex",
        Is_Split_Layout ? "flex-col items-start gap-y-3 h-auto" : "flex-row items-center h-16 gap-x-2",
        Is_Visible ? "translate-y-0" : "-translate-y-full"
      )}
      dir={Is_RTL ? "rtl" : "ltr"}
    >
      {/* ROW 1: BACK BUTTON, TITLE, ADD, ADDWORD & INLINE CONTROLS */}
      <div
        ref={Left_Group_Ref}
        className={cn(
          "flex items-center h-[40px] relative w-full",
          !Is_Split_Layout && "w-auto shrink-0 gap-2"
        )}
      >
        {Show_Back && (
          <Button
            size="icon"
            onClick={Handle_Back}
            aria-label={Is_Desktop_Settings_Open ? (t("Close") || "Close") : (t("Back") || "Back")}
            className="shrink-0 p-0"
            style={Custom_Btn_Size}
          >
            <ArrowLeft className={cn("h-5 w-5", Is_RTL && "rotate-180")} />
          </Button>
        )}

        {In_Lesson && Lesson_State && (
          <div className="w-32 h-3 bg-muted rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${(Lesson_State.current / Math.max(1, Lesson_State.total)) * 100}%` }}
            />
          </div>
        )}

        {!In_Lesson && !Search_Open && (!Is_Root_Home || Is_Desktop_Settings_Open) && (
          <div
            className={cn(
              "flex items-center h-[40px]",
              Is_Split_Layout
                ? "absolute left-1/2 -translate-x-1/2 w-auto max-w-[50%] justify-center"
                : "min-w-0 gap-2 max-w-full"
            )}
          >
            <TitleBar className="font-semibold text-lg truncate h-[40px] flex items-center leading-none">
              {Is_Desktop_Settings_Open
                ? (t("Settings") || "Settings")
                : Get_Page_Title(location.pathname, t, Has_Active_Languages)}
            </TitleBar>
          </div>
        )}

        {/* Global Track Language Add Button */}
        {!In_Lesson && !Search_Open && !Is_Desktop_Settings_Open && !Is_Root_Home && Is_Language_Root_Only && (
          <div className={cn("flex items-center gap-2 shrink-0 h-[40px]", Is_Split_Layout ? (Is_RTL ? "mr-auto" : "ml-auto") : "")}>
            <Add />
          </div>
        )}

        {/* Word Creation Dropdown Trigger */}
        {!In_Lesson && !Search_Open && !Is_Desktop_Settings_Open && !Is_Root_Home && Show_Subcategory_Controls && (
          <div className={cn("flex items-center gap-2 shrink-0 h-[40px]", Is_Split_Layout ? (Is_RTL ? "mr-auto" : "ml-auto") : "")}>
            <AddWord />
          </div>
        )}

        {/* Inline Select, Filter & Recall Buttons (Unified Row 1 inline layout) */}
        {!Is_Split_Layout && Show_Subcategory_Controls && (
          <div className="flex items-center gap-2 shrink-0 h-[40px]">
            <Select_Button />
            {Show_Filter_Button && <Filter_Button />}
            {Show_Recall_Button && <Recall_Button />}
          </div>
        )}

        {/* 🚀 Inline Word Action Buttons (Desktop / Non-Split View) */}
        {!Is_Split_Layout && Word_Detail_Context.show && (
          <div className="flex items-center gap-2 shrink-0 h-[40px]">
            <Speak_Button Target_Text={Word_Detail_Context.Word_ID} />
            <Mark_Button Word_ID={Word_Detail_Context.Word_ID} />
            <Favorite_Button Word_ID={Word_Detail_Context.Word_ID} />
            <EditButton onClick={Handle_Edit_Click} />
          </div>
        )}
      </div>

      {/* SEARCH OVERLAY BLOCK */}
      {!In_Lesson && Search_Open && (
        <div className="flex-1 min-w-0 w-full transition-all duration-300 ease-out">
          <Header_Search open={Search_Open} onClose={() => Set_Search_Open(false)} />
        </div>
      )}

      {/* ROW 2 / UTILITIES */}
      {!In_Lesson && !Search_Open && !Is_Desktop_Settings_Open && (
        <div
          ref={Right_Group_Ref}
          className={cn(
            "flex items-center h-[40px] gap-2 w-full justify-between",
            !Is_Split_Layout && cn("w-auto shrink-0", Is_RTL ? "mr-auto" : "ml-auto")
          )}
        >
          {/* Split Row 2 left: AR queue, Select Button, Filter, & Split-positioned Recall_Button */}
          <div className="flex items-center shrink-0 h-[40px] gap-2">
            {Is_Language_Tree && Recall_Queue.length > 0 && <Recall_Queue_Button />}
            {Is_Split_Layout && Show_Subcategory_Controls && (
              <>
                <Select_Button />
                {Show_Filter_Button && <Filter_Button />}
                {Show_Recall_Button && <Recall_Button />}
              </>
            )}

            {/* 🚀 Split Layout Word Action Buttons (Mobile / Split View bottom bar) */}
            {Is_Split_Layout && Word_Detail_Context.show && (
              <>
                <Speak_Button Target_Text={Word_Detail_Context.Word_ID} />
                <Mark_Button Word_ID={Word_Detail_Context.Word_ID} />
                <Favorite_Button Word_ID={Word_Detail_Context.Word_ID} />
                <EditButton onClick={Handle_Edit_Click} />
              </>
            )}
          </div>

          <div className={cn("flex items-center gap-2 shrink-0 h-[40px]", Is_Split_Layout && (Is_RTL ? "mr-auto" : "ml-auto"))}>
            {Show_Call && <AI_Call_Button />}

            <Button size="icon" aria-label={t("Search") || "Search"} onClick={() => Set_Search_Open(true)} className="p-0" style={Custom_Btn_Size}>
              <Search className="h-5 w-5" />
            </Button>

            <Button
              size="icon"
              aria-label={t("Settings") || "Settings"}
              onClick={() => {
                if (typeof Set_Settings_Sidebar_Open === "function") {
                  Set_Settings_Sidebar_Open(true);
                } else {
                  console.error("[SETTINGS ERROR] Set_Settings_Sidebar_Open is not available as a valid context function.");
                }
              }}
              className="p-0"
              style={Custom_Btn_Size}
            >
              <Settings className="h-5 w-5" />
            </Button>

            {Is_Root_Home && !Is_Authenticated && !Is_Sign && (
              <Button size="icon" aria-label="Sign in" onClick={() => navigate("/Sign")} className="p-0" style={Custom_Btn_Size}>
                <LogIn className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
});