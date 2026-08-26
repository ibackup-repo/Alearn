// @/Component/Settings/SettingsSidebar.tsx
import { useState } from "react";
import { Use_App } from "@/Context/App";
import { Use_Is_Mobile } from "@/Hook/Use-Mobile";
import { Desktop } from "./Layout/Desktop";
import { Mobile } from "./Layout/Mobile"; 
import { ProfileSection } from "./Section/Profile";
import { LanguageSection } from "./Section/Language";
import { ChessSection } from "./Section/Chess"; 
import { ThemeSection } from "./Section/Theme";
import { AccessibilitySection } from "./Section/Accessibility";
import type { Settings_Category_ID } from "./Types";

export function SettingsSidebar() {
  const { Is_Settings_Sidebar_Open, Set_Settings_Sidebar_Open } = Use_App();
  const Is_Mobile = Use_Is_Mobile();

  const [Active_Category, Set_Active_Category] = useState<Settings_Category_ID>("profile");
  const [Active_Subcategory, Set_Active_Subcategory] = useState<string | null>("account");

  const Handle_Close = () => {
    Set_Settings_Sidebar_Open(false);
    Set_Active_Category("profile");
    Set_Active_Subcategory("account");
  };

  const Handle_Category_Change = (Category: Settings_Category_ID) => {
    Set_Active_Category(Category);
    if (Category === "profile") {
      Set_Active_Subcategory("account");
    } else {
      Set_Active_Subcategory(null);
    }
  };

  const Handle_Subcategory_Change = (subcategory: string | null) => {
    Set_Active_Subcategory(subcategory);
  };

  const Render_Content = () => {
    switch (Active_Category) {
      case "profile":
        return (
          <ProfileSection 
            Active_Subcategory={Active_Subcategory || "account"} 
          />
        );
      case "language":
        return <LanguageSection On_Select={() => {}} />;
      case "chess":
        return <ChessSection />;
      case "theme":
        return <ThemeSection />;
      case "accessibility":
        return <AccessibilitySection />;
      default:
        return null;
    }
  };

  if (!Is_Settings_Sidebar_Open) return null;

  if (Is_Mobile) {
    return (
      <Mobile
        Active_Category={Active_Category}
        Active_Subcategory={Active_Subcategory}
        On_Category_Change={Handle_Category_Change}
        On_Subcategory_Change={Handle_Subcategory_Change}
        onClose={Handle_Close}
      >
        {Render_Content()}
      </Mobile>
    );
  }

  return (
    <Desktop
      Active_Category={Active_Category}
      Active_Subcategory={Active_Subcategory}
      On_Category_Change={Handle_Category_Change}
      On_Subcategory_Change={Handle_Subcategory_Change}
    >
      {Render_Content()}
    </Desktop>
  );
}