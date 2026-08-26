// @/Component/Layout.tsx
import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { Lesson_Progress, type Lesson_Progress_State } from "@/Library/Lesson-Progress";
import { cn } from "@/Library/Utility";
import { Header } from "./Header";
import { SettingsSidebar } from "@/Component/Settings/Index"; 
import Recall_Overlay from "@/Component/Flashcard"; // 🚀 Imported your Flashcard overlay component

interface Layout_Properties {
  children: ReactNode;
}

export function Layout({ children }: Layout_Properties) {
  const location = useLocation();
  const { UI_Language } = Use_Course_Language();
  const [Search_Open, Set_Search_Open] = useState(false);
  const [Lesson_State, setLessonState] = useState<Lesson_Progress_State | null>(null);
  
  // Track the split layout state here to apply dynamic padding
  const [Is_Header_Split, Set_Is_Header_Split] = useState(false);
  
  useEffect(() => {
    const Check_Progress = () => {
      const Current_Progress = Lesson_Progress.get();
      if (Current_Progress && typeof Current_Progress === 'object' && 'current' in Current_Progress) {
        setLessonState(Current_Progress);
      } else {
        setLessonState(null);
      }
    };
    Check_Progress();
    return Lesson_Progress.subscribe(Check_Progress);
  }, [location.pathname]);

  return (
    <div 
      className="min-h-screen w-full flex flex-col bg-background relative" 
      dir={UI_Language === "ar" ? "rtl" : "ltr"}
    >
      <Header 
        Search_Open={Search_Open} 
        Set_Search_Open={Set_Search_Open} 
        Lesson_State={Lesson_State} 
        // Pass down the state setter callback
        On_Layout_Change={Set_Is_Header_Split}
      />
      
      <main 
        className={cn(
          "flex-1 w-full flex flex-col md:overflow-hidden",
          // Conditionally apply pt-28 or pt-16, and adjust calculated height variable accordingly
          Is_Header_Split 
            ? "pt-28 md:h-[calc(100vh-112px)]" 
            : "pt-16 md:h-[calc(100vh-64px)]"
        )}
      >
        {children}
      </main>

      {/* Global utility overlays and sidebars */}
      <SettingsSidebar />
      
      {/* 🚀 Rendered here so it actively listens to URL parameters across all pages */}
      <Recall_Overlay />
    </div>
  );
}