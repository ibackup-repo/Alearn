// @/Component/Settings/Layout/Mobile.tsx
import { useState, useEffect, useMemo } from "react";
import { ScrollArea } from "@/Component/UI/Scroll-Area";
import { Button } from "@/Component/UI/Button";
import { ChevronRight } from "lucide-react";
import { SETTINGS_CATEGORIES, Get_Subcategories } from "../Constants";
import { Mobile_Settings_Store } from "../Mobile-Settings-Store";
import type { Settings_Category_ID } from "../Types";

interface Mobile_Properties {
  Active_Category: Settings_Category_ID;
  Active_Subcategory: string | null;
  On_Category_Change: (Category: Settings_Category_ID) => void;
  On_Subcategory_Change: (subcategory: string | null) => void;
  onClose: () => void;
  children: React.ReactNode;
}

export function Mobile({
  Active_Category,
  Active_Subcategory,
  On_Category_Change,
  On_Subcategory_Change,
  onClose,
  children,
}: Mobile_Properties) {
  const [view, setView] = useState<"categories" | "subcategories" | "content">("categories");
  const [Selected_Category, setSelectedCategory] = useState<Settings_Category_ID | null>(null);
  const [Is_Search_Mode, setIsSearchMode] = useState(false);
  const [Search_Query, Set_Search_Query] = useState("");

  // Track global search state streams
  useEffect(() => {
    const Unsubscribe_Mode = Mobile_Settings_Store.subscribe(() => {
      const { Is_Search_Mode } = Mobile_Settings_Store.getState();
      setIsSearchMode(Is_Search_Mode);
    });
    const Unsubscribe_Query = Mobile_Settings_Store.subscribeSearch(() => {
      Set_Search_Query(Mobile_Settings_Store.Get_Search_Query());
    });
    setIsSearchMode(Mobile_Settings_Store.getState().Is_Search_Mode);
    Set_Search_Query(Mobile_Settings_Store.Get_Search_Query());
    return () => {
      Unsubscribe_Mode();
      Unsubscribe_Query();
    };
  }, []);

  // Compute search list
  const Filtered_Results = useMemo(() => {
    if (!Search_Query.trim()) return [];
    const query = Search_Query.toLowerCase();
    const results: { Category: Settings_Category_ID; subcategory?: string; label: string }[] = [];
    for (const cat of SETTINGS_CATEGORIES) {
      if (cat.Label_Key.toLowerCase().includes(query) || cat.fallback.toLowerCase().includes(query)) {
        results.push({ Category: cat.id, label: cat.fallback });
      }
      if (cat.hasSubcategories) {
        const subs = Get_Subcategories(cat.id);
        for (const sub of subs) {
          if (sub.Label_Key.toLowerCase().includes(query) || sub.fallback.toLowerCase().includes(query)) {
            results.push({ Category: cat.id, subcategory: sub.id, label: sub.fallback });
          }
        }
      }
    }
    return results;
  }, [Search_Query]);

  // Handle active selections out of search mode queries
  useEffect(() => {
    if (!Is_Search_Mode || Filtered_Results.length === 0) return;
    const top = Filtered_Results[0];
    if (top.subcategory) {
      On_Category_Change(top.Category);
      On_Subcategory_Change(top.subcategory);
    } else {
      On_Category_Change(top.Category);
      On_Subcategory_Change(null);
    }
    setView("content");
  }, [Filtered_Results, Is_Search_Mode, On_Category_Change, On_Subcategory_Change]);

  // Synchronize layout metadata headers directly to store references
  useEffect(() => {
    if (Is_Search_Mode) {
      Mobile_Settings_Store.setState("Search", true, () => {
        Mobile_Settings_Store.Exit_Search_Mode();
      }, onClose);
      return;
    }
    
    let title = "Settings";
    let Show_Back = false;
    let Go_Back_Function = () => {};

    if (view === "categories") {
      title = "Settings";
      Show_Back = false; // Home list level: Back action triggers full panel onClose closure
      Go_Back_Function = () => onClose();
    } else if (view === "subcategories" && Selected_Category) {
      const cat = SETTINGS_CATEGORIES.find(c => c.id === Selected_Category);
      title = cat?.fallback || "Settings";
      Show_Back = true;
      Go_Back_Function = () => {
        setView("categories");
        setSelectedCategory(null);
      };
    } else if (view === "content") {
      if (Active_Subcategory) {
        const subs = Get_Subcategories(Active_Category);
        const sub = subs.find(s => s.id === Active_Subcategory);
        title = sub?.fallback || Active_Category;
      } else {
        const cat = SETTINGS_CATEGORIES.find(c => c.id === Active_Category);
        title = cat?.fallback || "Settings";
      }
      Show_Back = true;
      Go_Back_Function = () => {
        const Cat_Config = SETTINGS_CATEGORIES.find(c => c.id === Active_Category);
        if (Cat_Config?.hasSubcategories) {
          setView("subcategories");
          setSelectedCategory(Active_Category);
        } else {
          setView("categories");
          setSelectedCategory(null);
        }
      };
    }
    Mobile_Settings_Store.setState(title, Show_Back, Go_Back_Function, onClose);
  }, [view, Selected_Category, Active_Category, Active_Subcategory, onClose, Is_Search_Mode]);

  if (Is_Search_Mode) {
    return (
      <div className="fixed inset-0 z-40 bg-background">
        <ScrollArea className="h-full">
          <div className="pt-[60px]">
            <div className="p-4">
              {Filtered_Results.length > 0 ? (
                <div className="space-y-2">
                  {Filtered_Results.map((item, Index) => (
                    <Button
                      key={Index}
                      onClick={() => {
                        if (item.subcategory) {
                          On_Category_Change(item.Category);
                          On_Subcategory_Change(item.subcategory);
                        } else {
                          On_Category_Change(item.Category);
                          On_Subcategory_Change(null);
                        }
                        Mobile_Settings_Store.Exit_Search_Mode();
                        setView("content");
                      }}
                      className="w-full flex items-center justify-between py-3 px-4 text-left font-normal"
                    >
                      <span className="text-sm font-medium">{item.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  ))}
                </div>
              ) : Search_Query ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No results for "{Search_Query}"
                </div>
              ) : null}
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  if (view === "categories") {
    return (
      <div className="fixed inset-0 z-40 bg-background">
        <ScrollArea className="h-full">
          <div className="pt-[60px]">
            <div className="p-4">
              <div className="space-y-2">
                {SETTINGS_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Button
                      key={cat.id}
                      onClick={() => {
                        if (cat.hasSubcategories) {
                          setSelectedCategory(cat.id);
                          setView("subcategories");
                        } else {
                          On_Category_Change(cat.id);
                          On_Subcategory_Change(null);
                          setView("content");
                        }
                      }}
                      className="w-full flex items-center justify-between gap-3 h-auto py-4 px-4 text-left font-normal"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">{cat.fallback}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  if (view === "subcategories" && Selected_Category) {
    const subcategories = Get_Subcategories(Selected_Category);
    return (
      <div className="fixed inset-0 z-40 bg-background">
        <ScrollArea className="h-full">
          <div className="pt-[60px]">
            <div className="p-4">
              <div className="space-y-2">
                {subcategories.map((sub) => {
                  const SubIcon = sub.icon;
                  return (
                    <Button
                      key={sub.id}
                      onClick={() => {
                        On_Category_Change(Selected_Category);
                        On_Subcategory_Change(sub.id);
                        setView("content");
                      }}
                      className="w-full flex items-center justify-between gap-3 h-auto py-4 px-4 text-left font-normal"
                    >
                      <div className="flex items-center gap-3">
                        <SubIcon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">{sub.fallback}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-background">
      <ScrollArea className="h-full">
        <div className="pt-[60px]">
          <div className="p-4">
            {children}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}