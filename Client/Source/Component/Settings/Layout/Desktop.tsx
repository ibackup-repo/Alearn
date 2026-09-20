// @/Component/Settings/Layout/Desktop.tsx
import { useState, useRef, useEffect, useMemo } from "react";
import { ScrollArea } from "@/Component/UI/Scroll-Area";
import { Button } from "@/Component/UI/Button";
import { Input } from "@/Component/UI/Input";
import { cn } from "@/Library/Utility";
import { Search, X } from "lucide-react";
import { SETTINGS_CATEGORIES, Get_Subcategories } from "../Constants";
import type { Settings_Category_ID } from "../Types";

interface Desktop_Properties {
  Active_Category: Settings_Category_ID;
  Active_Subcategory: string | null;
  On_Category_Change: (Category: Settings_Category_ID) => void;
  On_Subcategory_Change: (subcategory: string | null) => void;
  children: React.ReactNode;
}

/** Desktop two-column settings layout: sidebar + content. */
export function Desktop({
  Active_Category,
  Active_Subcategory,
  On_Category_Change,
  On_Subcategory_Change,
  children,
}: Desktop_Properties) {
  const [Is_Search_Active, setIsSearchActive] = useState(false);
  const [query, setQuery] = useState("");
  const [Is_Focused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine if the input should be in "active" style (black bg, white border)
  const Is_Input_Active = Is_Focused || query.length > 0;

  // --- Search filtering logic ---
  const Filtered_Data = useMemo(() => {
    if (!query.trim()) {
      // No query: return all categories with all subcategories
      return SETTINGS_CATEGORIES.map((cat) => ({
        ...cat,
        subcategories: cat.hasSubcategories ? Get_Subcategories(cat.id) : [],
      }));
    }

    const Query_Lower = query.toLowerCase();
    const results: typeof SETTINGS_CATEGORIES = [];

    for (const cat of SETTINGS_CATEGORIES) {
      const Cat_Matches =
        cat.Label_Key.toLowerCase().includes(Query_Lower) ||
        cat.fallback.toLowerCase().includes(Query_Lower);
      let Matching_Subs = [];
      if (cat.hasSubcategories) {
        const subs = Get_Subcategories(cat.id);
        Matching_Subs = subs.filter(
          (sub) =>
            sub.Label_Key.toLowerCase().includes(Query_Lower) ||
            sub.fallback.toLowerCase().includes(Query_Lower)
        );
      }
      if (Cat_Matches || Matching_Subs.length > 0) {
        results.push({
          ...cat,
          subcategories: Matching_Subs,
        });
      }
    }

    // Determine top result: first matching subcategory, else first matching Category
    let Top_Category: Settings_Category_ID | null = null;
    let Top_Subcategory: string | null = null;

    for (const cat of results) {
      if (cat.subcategories && cat.subcategories.length > 0) {
        Top_Category = cat.id;
        Top_Subcategory = cat.subcategories[0].id;
        break;
      }
    }
    if (!Top_Category && results.length > 0) {
      Top_Category = results[0].id;
      Top_Subcategory = null;
    }

    // Automatically switch to the top result if different from current
    if (
      Top_Category &&
      (Top_Category !== Active_Category ||
        Top_Subcategory !== Active_Subcategory)
    ) {
      setTimeout(() => {
        On_Category_Change(Top_Category!);
        On_Subcategory_Change(Top_Subcategory);
      }, 0);
    }

    return results.map((cat) => ({
      ...cat,
      subcategories: cat.subcategories || [],
    }));
  }, [
    query,
    Active_Category,
    Active_Subcategory,
    On_Category_Change,
    On_Subcategory_Change,
  ]);

  const Handle_Search_Click = () => {
    setIsSearchActive(true);
  };

  const Handle_Blur = () => {
    setIsFocused(false);
    if (query === "") {
      setIsSearchActive(false);
    }
  };

  const Handle_Clear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (Is_Search_Active && inputRef.current) {
      inputRef.current.focus();
    }
  }, [Is_Search_Active]);

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <div className="h-full flex">
        {/* Sidebar: pointer-events-auto enables clicking here */}
        <div className="shrink-0 w-64 h-full flex flex-col pt-[80px] pb-4 pl-[24px] pr-[8px] overflow-hidden relative z-[100] pointer-events-auto">
          <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
            {/* Search Section */}
            <div className="relative z-[100] mb-4">
              {!Is_Search_Active ? (
                <Button
                  onClick={Handle_Search_Click}
                  className="w-10 h-10 rounded-full flex items-center justify-center p-0"
                >
                  <Search className="h-4 w-4" />
                </Button>
              ) : (
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={Handle_Blur}
                    className={cn(
                      "pr-10 transition-all duration-200",
                      Is_Input_Active && "bg-black text-white border-white"
                    )}
                  />
                  {query && (
                    <Button
                      onClick={Handle_Clear}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full p-0 flex items-center justify-center"
                      size="sm"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Categories List */}
            <div className="relative z-[100] space-y-2 flex-1">
              {Filtered_Data.map((cat) => {
                const isActive = Active_Category === cat.id;
                const hasSubs =
                  cat.subcategories && cat.subcategories.length > 0;

                return (
                  <div key={cat.id}>
                    <Button
                      onClick={() => {
                        On_Category_Change(cat.id);
                        if (hasSubs) {
                          const firstSub = cat.subcategories[0];
                          if (firstSub) On_Subcategory_Change(firstSub.id);
                        } else {
                          On_Subcategory_Change(null);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center gap-2.5 h-auto px-3 py-2.5",
                        isActive &&
                          "bg-black dark:bg-white text-white dark:text-black"
                      )}
                    >
                      <span className="text-sm font-medium">
                        {cat.fallback}
                      </span>
                    </Button>

                    {hasSubs && isActive && (
                      <div className="mt-2 space-y-2 ml-6">
                        {cat.subcategories.map((sub) => {
                          const isActiveSub = Active_Subcategory === sub.id;
                          return (
                            <Button
                              key={sub.id}
                              onClick={() => On_Subcategory_Change(sub.id)}
                              className={cn(
                                "flex items-center gap-2.5 h-auto py-1.5 px-3 rounded-full",
                                isActiveSub &&
                                  "bg-black dark:bg-white text-white dark:text-black"
                              )}
                            >
                              <span className="text-sm font-medium">
                                {sub.fallback}
                              </span>
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {Filtered_Data.length === 0 && query && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No results for "{query}"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Box: pointer-events-auto enables clicking inside content */}
        <div className="flex-1 mt-[80px] mb-[24px] mr-[24px] bg-black text-white rounded-2xl overflow-hidden relative z-[100] pointer-events-auto">
          <ScrollArea className="h-full w-full">
            <div className="p-8 w-full text-left">
              {children}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}