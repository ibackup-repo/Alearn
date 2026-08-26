// Source/Component/Search/Header-Search.tsx
import React, { useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";

interface Header_Search_Properties {
  placeholder?: string;
  className?: string;
}

export function Header_Search({
  placeholder = "Search...",
  className = "",
}: Header_Search_Properties) {
  const [Search_Params, Set_Search_Params] = useSearchParams();
  const query = Search_Params.get("search") || "";
  const inputRef = useRef<HTMLInputElement>(null);

  const Handle_Input_Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      Set_Search_Params({ ...Object.fromEntries(Search_Params), search: value });
    } else {
      Search_Params.delete("search");
      Set_Search_Params(Search_Params);
    }
  };

  const Handle_Clear = () => {
    Search_Params.delete("search");
    Set_Search_Params(Search_Params);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative flex items-center w-full h-[40px] ${className}`}>
      {/* Search Icon */}
      <div className="absolute left-3 flex items-center pointer-events-none text-muted-foreground">
        <Search className="h-4 w-4" />
      </div>

      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={Handle_Input_Change}
        placeholder={placeholder}
        className="w-full h-[40px] pl-9 pr-8 rounded-full border border-border/50 bg-background text-sm focus:outline-none focus:border-ring transition-colors"
      />

      {/* Clear Button */}
      {query && (
        <button
          type="button"
          onClick={Handle_Clear}
          className="absolute right-2.5 flex items-center justify-center p-0.5 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export default Header_Search;