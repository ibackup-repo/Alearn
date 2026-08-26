import { useState, useRef } from "react";
import { Search, X, ChevronDown, Check } from "lucide-react";
import { cn } from "@/Library/Utility";
import { Button } from "@/Component/UI/Button";
import { Container } from "@/Component/UI/Container";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/Component/UI/Dropdown-Menu";
import { Categories } from "./Utility";
import { Search_Results } from "./Results";
import type { Search_Category, Search_Result } from "./Types";

export interface Search_Input_Properties {
  query: string;
  setQuery: (query: string) => void;
  Category: Search_Category;
  Set_Category: (Category: Search_Category) => void;
  On_Search: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  onKeyDown: (e: React.KeyboardEvent) => void;
  results: Search_Result[];
  Selected_Index: number;
  On_Result_Click: (path: string) => void;
  On_See_All: () => void;
  Dropdown_Menu_Reference?: React.RefObject<HTMLDivElement>;
  Is_Mobile?: boolean;
}

export function Search_Input({
  query,
  setQuery,
  Category,
  Set_Category,
  On_Search,
  inputRef,
  onKeyDown,
  results,
  Selected_Index,
  On_Result_Click,
  On_See_All,
  Dropdown_Menu_Reference,
  Is_Mobile = false,
}: Search_Input_Properties) {
  const [Dropdown_Open, Set_Dropdown_Open] = useState(false);
  const Container_Reference = useRef<HTMLDivElement>(null);
  const Current_Category = Categories.find(c => c.id === Category)!;

  const Handle_Clear = () => {
    setQuery("");
    inputRef?.current?.focus();
  };

  const Show_Results = !Is_Mobile && query.length > 0 && results.length > 0;

  return (
    <div
      className={cn(
        "bg-white dark:bg-black border-2 border-black dark:border-white w-full max-w-none shadow-sm overflow-hidden transition-all duration-200",
        Show_Results ? "rounded-xl" : "rounded-[40px]"
      )}
    >
      <Container className="!bg-transparent !border-0 !rounded-none px-2 sm:px-3 h-8 sm:h-9 flex items-center w-full">
        <div className="flex items-center w-full gap-2 min-w-0" onKeyDown={onKeyDown}>
          <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") On_Search();
              onKeyDown(e);
            }}
            placeholder={Current_Category.placeholder}
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-[13px] sm:text-sm placeholder:text-muted-foreground text-foreground"
            aria-label="Search"
          />

          {/* Fixed-width slot to prevent container from shrinking */}
          <div className="flex-shrink-0 w-20 sm:w-24 flex justify-end items-center h-full">
            {!query ? (
              <DropdownMenu open={Dropdown_Open} onOpenChange={Set_Dropdown_Open}>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    className="flex items-center gap-1 px-1.5 h-6 rounded-full text-[10px] font-medium transition-colors"
                  >
                    {Current_Category.label}
                    <ChevronDown className={cn("h-3 w-3 transition-transform", Dropdown_Open && "rotate-180")} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuPortal container={Container_Reference.current}>
                  <DropdownMenuContent
                    ref={Dropdown_Menu_Reference}
                    align="end"
                    sideOffset={4}
                    className="min-w-[130px] bg-white dark:bg-black border-2 border-black dark:border-white rounded-md shadow-lg z-50"
                  >
                    {Categories.map((cat) => (
                      <DropdownMenuItem
                        key={cat.id}
                        onClick={() => {
                          Set_Category(cat.id);
                          Set_Dropdown_Open(false);
                          inputRef?.current?.focus();
                        }}
                        className="cursor-pointer flex items-center gap-2 px-2 py-1 text-[11px]"
                      >
                        <cat.icon className="h-3 w-3" />
                        <span className="flex-1">{cat.label}</span>
                        {Category === cat.id && <Check className="h-3 w-3" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenuPortal>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                className="w-6 h-6 p-0 rounded-full flex-shrink-0"
                onClick={Handle_Clear}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </Container>

      {Show_Results && (
        <>
          <div className="h-px bg-border/50 w-full" />
          <Search_Results
            query={query}
            Category={Category}
            results={results}
            Selected_Index={Selected_Index}
            On_Result_Click={On_Result_Click}
            On_See_All={On_See_All}
            hideTopBorder
          />
        </>
      )}
    </div>
  );
}