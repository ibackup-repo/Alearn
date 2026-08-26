// @/Context/App.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Review_State, Create_Review_State, Update_Review } from "@/Library/Spaced-Repetition";
import type { Recall_Item, Recall_Scope } from "@/Library/Recall";
import { Browse_Path_To_Url, Same_Browse_Path, URL_To_Browse_Path } from "@/Library/Navigation";

export const ALL_LANGUAGES = ["English", "Nederlands", "Arabic", "Pashto"];

export interface Course {
  From_Language: string;
  concept: string;
  To_Language: string;
}

export type Theme_Choice = "light" | "dark" | "system";
export type Text_Size = "sm" | "md" | "lg";
export type Filter_Type = "all" | "Marked" | "favorites" | "custom";

export interface Active_Recall {
  Scope: Recall_Scope;
  Category_ID: string;
  Subcategory_ID: string;
  Word_ID?: string;
  Word_IDs?: string[];
}

interface App_State {
  Is_Authenticated: boolean;
  user: { firstName: string; email: string } | null;
  Interface_Language: string;
  Selected_Concept: string | null;
  Learning_Language: string | null;
  Introduction_Completed: boolean;
  courses: Course[];
  reviews: Review_State[];
  theme: Theme_Choice;
  textSize: Text_Size;
  High_Contrast: boolean;
  Recall_Queue: Recall_Item[];
  Browse_Path: string[];
  Active_Recall: Active_Recall | null;
  Recall_Return_Path: string[] | null;
  Is_Settings_Sidebar_Open: boolean; 
}

interface App_Context_Type extends App_State {
  Available_Learning_Languages: string[];
  Active_Languages: string[];
  Inactive_Languages: string[];
  
  login: (email: string, password: string) => boolean;
  signup: (firstName: string, email: string, password: string) => boolean;
  logout: () => void;
  Set_Interface_Language: (lang: string) => void;
  Set_Selected_Concept: (concept: string) => void;
  Set_Learning_Language: (lang: string) => void;
  Complete_Introduction: () => void;
  Add_Course: (course: Course) => boolean;
  Set_Active_Course: (course: Course) => void;
  Get_Review: (Word_ID: string) => Review_State;
  Record_Review: (Word_ID: string, Correct: boolean) => void;
  Set_Theme: (t: Theme_Choice) => void;
  Set_Text_Size: (t: Text_Size) => void;
  Set_High_Contrast: (v: boolean) => void;
  Add_Recall_Item: (item: Recall_Item) => void;
  Remove_Recall_Item: (id: string) => void;
  Set_Browse_Path: (path: string[]) => void;
  Push_Browse: (segment: string) => void;
  Pop_Browse: () => void;
  Reset_Browse: () => void;
  Set_Active_Recall: (r: Active_Recall | null) => void;
  Set_Recall_Return_Path: (p: string[] | null) => void;
  Remove_Course: (Course_Name: string) => void;
  Set_Settings_Sidebar_Open: (open: boolean) => void; 
  Select_Mode: boolean;
  Set_Select_Mode: React.Dispatch<React.SetStateAction<boolean>>;
  selected: Set<string>;
  Set_Selected: React.Dispatch<React.SetStateAction<Set<string>>>;
  
  // Filter System Properties
  Filter_Open: boolean;
  Set_Filter_Open: (open: boolean) => void;
  Selected_Filter: Filter_Type; 
  Set_Selected_Filter: (filter: Filter_Type) => void;
  
  // Aliases added to support both naming systems flawlessly
  filter: Filter_Type;
  setFilter: (filter: Filter_Type) => void;
}

const AppContext = createContext<App_Context_Type | null>(null);

export function Use_App() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("Use_App must be inside App_Provider");
  return ctx;
}

const Default_State: App_State = {
  Is_Authenticated: false,
  user: null,
  Interface_Language: "English",
  Selected_Concept: "language",
  Learning_Language: null,
  Introduction_Completed: false,
  courses: [],
  reviews: [],
  theme: "system",
  textSize: "md",
  High_Contrast: false,
  Recall_Queue: [],
  Browse_Path: [],
  Active_Recall: null,
  Recall_Return_Path: null,
  Is_Settings_Sidebar_Open: false, 
};

function Apply_Appearance(theme: Theme_Choice, textSize: Text_Size, hc: boolean) {
  const root = document.documentElement;
  const Prefers_Dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const Is_Dark = theme === "dark" || (theme === "system" && Prefers_Dark);
  root.classList.toggle("dark", Is_Dark);
  root.classList.toggle("hc", hc);
  root.classList.toggle("high-contrast", hc);
  root.classList.remove("text-sm", "text-md", "text-lg");
  root.classList.add(`text-${textSize}`);
}

export function App_Provider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<App_State>(() => {
    const saved = localStorage.getItem("appState");
    if (saved) {
      const parsed = JSON.parse(saved);
      const URL_Path = typeof window !== "undefined" ? URL_To_Browse_Path(window.location.pathname) : null;
      const {
        streak, xp, lastPracticeDate,
        practiceScope, pathProgress, exerciseStats,
        ...clean
      } = parsed;
      const merged: App_State = { ...Default_State, ...clean, Selected_Concept: "language" };
      merged.courses = (merged.courses ?? []).filter((c: Course) => c.concept === "language");
      merged.Recall_Queue = Array.isArray(merged.Recall_Queue) ? merged.Recall_Queue : [];
      merged.Browse_Path = URL_Path ?? (Array.isArray(merged.Browse_Path) ? merged.Browse_Path : []);
      merged.Active_Recall = merged.Active_Recall ?? null;
      merged.Recall_Return_Path = merged.Recall_Return_Path ?? null;
      merged.Is_Settings_Sidebar_Open = false; 
      return merged;
    }
    const URL_Path = typeof window !== "undefined" ? URL_To_Browse_Path(window.location.pathname) : null;
    return URL_Path ? { ...Default_State, Browse_Path: URL_Path } : Default_State;
  });

  const [Is_Settings_Sidebar_Open, Set_Settings_Sidebar_Open] = useState(false);

  const Current_Interface = state.Interface_Language;

  const Available_Learning_Languages = ALL_LANGUAGES.filter(
    (lang) => lang.toLowerCase() !== Current_Interface.toLowerCase()
  );

  const Active_Languages = ALL_LANGUAGES.filter((lang) =>
    state.courses.some((course) => course.To_Language.toLowerCase() === lang.toLowerCase())
  );

  const Inactive_Languages = ALL_LANGUAGES.filter(
    (lang) => !Active_Languages.some(al => al.toLowerCase() === lang.toLowerCase()) && lang.toLowerCase() !== Current_Interface.toLowerCase()
  );

  useEffect(() => {
    const { Is_Settings_Sidebar_Open, ...State_To_Save } = state;
    localStorage.setItem("appState", JSON.stringify(State_To_Save));
  }, [state]);

  useEffect(() => {
    const current = window.location.pathname.toLowerCase();
    const Is_Browse_Route = current === "/" || current.startsWith("/language") || current.startsWith("/chess");
    if (!Is_Browse_Route) return;

    const Next_URL = Browse_Path_To_Url(state.Browse_Path);
    if (window.location.pathname !== Next_URL) {
      window.history.pushState(null, "", Next_URL);
    }
  }, [state.Browse_Path]);

  useEffect(() => {
    const Handle_Pop_State = () => {
      const next = URL_To_Browse_Path(window.location.pathname);
      if (!next) return;
      setState(s => Same_Browse_Path(s.Browse_Path, next) ? s : { ...s, Browse_Path: next });
    };
    window.addEventListener("popstate", Handle_Pop_State);
    return () => window.removeEventListener("popstate", Handle_Pop_State);
  }, []);

  useEffect(() => {
    Apply_Appearance(state.theme, state.textSize, state.High_Contrast);
  }, [state.theme, state.textSize, state.High_Contrast]);

  useEffect(() => {
    if (state.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => Apply_Appearance(state.theme, state.textSize, state.High_Contrast);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [state.theme, state.textSize, state.High_Contrast]);

  const Ensure_Course = (s: App_State, From_Language: string): App_State => {
    const To_Language = s.Learning_Language && s.Learning_Language.toLowerCase() !== From_Language.toLowerCase()
      ? s.Learning_Language
      : (ALL_LANGUAGES.find(l => l.toLowerCase() !== From_Language.toLowerCase()) ?? "English");
    const course: Course = { From_Language, concept: "language", To_Language };
    const exists = s.courses.some(c => c.From_Language.toLowerCase() === From_Language.toLowerCase() && c.concept === "language" && c.To_Language.toLowerCase() === To_Language.toLowerCase());
    return {
      ...s,
      Learning_Language: To_Language,
      courses: exists ? s.courses : [...s.courses, course],
    };
  };

  const login = (email: string, password: string) => {
    if (email === "a@mail.com" && password === "A") {
      setState(s => Ensure_Course({ ...s, Is_Authenticated: true, user: { firstName: "Demo", email } }, s.Interface_Language ?? "English"));
      return true;
    }
    return false;
  };

  const signup = (firstName: string, email: string, _password: string) => {
    setState(s => Ensure_Course({ ...s, Is_Authenticated: true, user: { firstName, email } }, s.Interface_Language ?? "English"));
    return true;
  };

  const logout = () => {
    setState(s => ({ ...Default_State, theme: s.theme, textSize: s.textSize, High_Contrast: s.High_Contrast }));
  };

  const Set_Interface_Language = (lang: string) => setState(s => {
    let Learning_Language = s.Learning_Language;
    if (Learning_Language?.toLowerCase() === lang.toLowerCase()) {
      const fallback = ALL_LANGUAGES.find(l => l.toLowerCase() !== lang.toLowerCase()) ?? null;
      Learning_Language = fallback;
    }
    return { ...s, Interface_Language: lang, Learning_Language };
  });

  const Set_Selected_Concept = (concept: string) => setState(s => ({ ...s, Selected_Concept: concept }));
  
  const Set_Learning_Language = (lang: string) => {
    setState(s => {
      const course: Course = { From_Language: s.Interface_Language, concept: s.Selected_Concept!, To_Language: lang };
      const exists = s.courses.some(c => c.From_Language.toLowerCase() === course.From_Language.toLowerCase() && c.concept === course.concept && c.To_Language.toLowerCase() === course.To_Language.toLowerCase());
      const courses = exists ? s.courses : [...s.courses, course];
      return { ...s, Learning_Language: lang, courses };
    });
  };

  const Complete_Introduction = () => setState(s => ({ ...s, Introduction_Completed: true }));

  const Add_Course = (course: Course): boolean => {
    const exists = state.courses.some(c => c.From_Language.toLowerCase() === course.From_Language.toLowerCase() && c.concept === course.concept && c.To_Language.toLowerCase() === course.To_Language.toLowerCase());
    if (exists) return false;
    setState(s => ({
      ...s,
      courses: [...s.courses, course],
      Interface_Language: course.From_Language,
      Selected_Concept: course.concept,
      Learning_Language: course.To_Language,
    }));
    return true;
  };

  const Set_Active_Course = (course: Course) => {
    setState(s => ({
      ...s,
      Interface_Language: course.From_Language,
      Selected_Concept: course.concept,
      Learning_Language: course.To_Language,
    }));
  };

  const Get_Review = (Word_ID: string): Review_State => {
    const existing = state.reviews.find(r => r.Word_ID === Word_ID);
    if (!existing) return Create_Review_State(Word_ID);
    return { ease: 2.5, reps: existing.learned ? 1 : 0, lapses: 0, ...existing };
  };

  const Record_Review = (Word_ID: string, Correct: boolean) => {
    setState(s => {
      const existing = s.reviews.find(r => r.Word_ID === Word_ID);
      const current: Review_State = existing
        ? { ease: 2.5, reps: existing.learned ? 1 : 0, lapses: 0, ...existing }
        : Create_Review_State(Word_ID);
      const updated = Update_Review(current, Correct);
      const reviews = existing
        ? s.reviews.map(r => r.Word_ID === Word_ID ? updated : r)
        : [...s.reviews, updated];
      return { ...s, reviews };
    });
  };

  const Remove_Course = (Course_Name: string) => {
    setState(s => {
      const Updated_Courses = s.courses.filter(
        c => c.concept !== "language" || c.To_Language.toLowerCase() !== Course_Name.toLowerCase()
      );

      let Learning_Language = s.Learning_Language;
      if (Learning_Language?.toLowerCase() === Course_Name.toLowerCase()) {
        const remaining = Updated_Courses.find(c => c.concept === "language");
        Learning_Language = remaining ? remaining.To_Language : null;
      }

      return {
        ...s,
        courses: Updated_Courses,
        Learning_Language
      };
    });
  };

  const Set_Theme = (theme: Theme_Choice) => setState(s => ({ ...s, theme }));
  const Set_Text_Size = (textSize: Text_Size) => setState(s => ({ ...s, textSize }));
  const Set_High_Contrast = (High_Contrast: boolean) => setState(s => ({ ...s, High_Contrast }));

  const Add_Recall_Item = (item: Recall_Item) => setState(s => {
    const others = s.Recall_Queue.filter(r => r.id !== item.id);
    return { ...s, Recall_Queue: [...others, item] };
  });
  const Remove_Recall_Item = (id: string) => setState(s => ({
    ...s, Recall_Queue: s.Recall_Queue.filter(r => r.id !== id),
  }));

  const Set_Browse_Path = (Browse_Path: string[]) => setState(s => ({ ...s, Browse_Path }));
  const Push_Browse = (segment: string) => setState(s => ({ ...s, Browse_Path: [...s.Browse_Path, segment] }));
  const Pop_Browse = () => setState(s => ({ ...s, Browse_Path: s.Browse_Path.slice(0, -1) }));
  const Reset_Browse = () => setState(s => ({ ...s, Browse_Path: [] }));
  const Set_Active_Recall = (Active_Recall: Active_Recall | null) => setState(s => ({ ...s, Active_Recall }));
  const Set_Recall_Return_Path = (Recall_Return_Path: string[] | null) => setState(s => ({ ...s, Recall_Return_Path }));
  
  const [Select_Mode, Set_Select_Mode] = useState<boolean>(false);
  const [selected, Set_Selected] = useState<Set<string>>(new Set());
  
  // States for filter mechanism
  const [Filter_Open, Set_Filter_Open] = useState(false);
  const [Selected_Filter, Set_Selected_Filter] = useState<Filter_Type>("all");

  return (
    <AppContext.Provider value={{
      ...state, 
      Is_Settings_Sidebar_Open, 
      Set_Settings_Sidebar_Open, 
      Available_Learning_Languages,
      Active_Languages,
      Inactive_Languages,
      Select_Mode,
      Set_Select_Mode,
      selected,
      Set_Selected,
      login, signup, logout, Set_Interface_Language, Set_Selected_Concept,
      Set_Learning_Language, Complete_Introduction, Add_Course, Set_Active_Course,
      Get_Review, Record_Review, Remove_Course,
      Set_Theme, Set_Text_Size, Set_High_Contrast,
      Add_Recall_Item, Remove_Recall_Item,
      Set_Browse_Path, Push_Browse, Pop_Browse, Reset_Browse, Set_Active_Recall, Set_Recall_Return_Path,
      Filter_Open,
      Set_Filter_Open,
      Selected_Filter,
      Set_Selected_Filter,
      
      // EXPOSING ALIASES
      filter: Selected_Filter,
      setFilter: Set_Selected_Filter,
    }}>
      {children}
    </AppContext.Provider>
  );
}