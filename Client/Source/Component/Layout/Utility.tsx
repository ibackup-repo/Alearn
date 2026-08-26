// @/Component/Layout/Utility.tsx
import { useEffect, useRef, useState, ReactNode } from "react";
import { ChevronDown, Search, X, ArrowLeft } from "lucide-react";
import { Button } from "@/Component/UI/Button";
import { Container } from "@/Component/UI/container";
import { cn } from "@/Library/Utility";

export function ID_From_Name(name: string): string {
  return name.replace(/\s+/g, "-");
}

export function Name_From_ID(id: string): string {
  return id.replace(/-/g, " ");
}

interface Navigator_Layout_Properties {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;
  Search_Query: string;
  Set_Search_Query: (query: string) => void;
  Button_Label: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  Render_Mobile_Header_Left: () => ReactNode;
  Render_Desktop_Header_Left: () => ReactNode;
  Show_Go_Back?: boolean;
  On_Go_Back?: () => void;
  children: ReactNode;
  Disable_Header_Container?: boolean;
  width?: string;                    
  height?: string;                   
  align?: "auto" | "left" | "right" | "center" | "top"; 
  Closed_Icon?: ReactNode; 
}

export function Navigator_Layout({
  isOpen,
  setIsOpen,
  isSearching,
  setIsSearching,
  Search_Query,
  Set_Search_Query,
  Button_Label,
  inputRef,
  Render_Mobile_Header_Left,
  Render_Desktop_Header_Left,
  Show_Go_Back = false,
  On_Go_Back,
  children,
  Disable_Header_Container = false,
  width = "sm:w-72",               
  height = "sm:h-[288px]", 
  align = "auto",
  Closed_Icon
}: Navigator_Layout_Properties) {
  const Dropdown_Reference = useRef<HTMLDivElement>(null);
  const [Resolved_Align, Set_Resolved_Align] = useState<"left" | "right" | "center" | "top">("left");

  const Close_All = () => {
    setIsOpen(false);
    setIsSearching(false);
    Set_Search_Query("");
  };

  useEffect(() => {
    if (!isOpen) return;

    if (align !== "auto") {
      Set_Resolved_Align(align);
      return;
    }

    if (Dropdown_Reference.current) {
      const rect = Dropdown_Reference.current.getBoundingClientRect();
      const Viewport_Width = window.innerWidth;
      const Trigger_Center = rect.left + rect.width / 2;
      
      Set_Resolved_Align(Trigger_Center < Viewport_Width / 2 ? "left" : "right");
    }
  }, [isOpen, align]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.height = "100vh";
    } else {
      document.body.style.overflow = "";
      document.body.style.height = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const Handle_Click_Outside = (event: MouseEvent) => {
      if (window.innerWidth >= 640 && Dropdown_Reference.current && !Dropdown_Reference.current.contains(event.target as Node)) {
        Close_All();
      }
    };
    document.addEventListener("mousedown", Handle_Click_Outside);
    return () => document.removeEventListener("mousedown", Handle_Click_Outside);
  }, [isOpen]);

  useEffect(() => {
    if (isSearching) {
      inputRef?.current?.focus();
    }
  }, [isSearching, inputRef]);

  const Alignment_Classes = {
    left: "max-sm:origin-center sm:left-0 sm:origin-top-left",
    right: "max-sm:origin-center sm:right-0 sm:origin-top-right",
    center: "max-sm:origin-center sm:left-1/2 sm:-translate-x-1/2 sm:origin-top",
    top: "max-sm:origin-center sm:bottom-0 sm:left-0 sm:origin-bottom-left"
  };

  return (
    <div 
      ref={Dropdown_Reference} 
      className={cn(
        "relative transition-all duration-300 ease-in-out select-none shrink-0",
        isOpen 
          ? cn("max-sm:fixed max-sm:inset-0 max-sm:z-[9999] max-sm:w-screen max-sm:h-screen sm:h-10", width) 
          : "w-10 h-10"
      )}
    >
      <div 
        className={cn(
          "origin-center bg-background text-foreground transition-all duration-300 ease-in-out border-2 border-border overflow-hidden",
          isOpen 
            ? cn("w-full h-full max-sm:rounded-none max-sm:border-0 max-sm:flex max-sm:flex-col sm:rounded-[32px] shadow-lg sm:absolute sm:top-0", height) 
            : "w-10 h-10 rounded-[20px] flex items-center justify-center cursor-pointer hover:bg-foreground hover:text-background",
          
          isOpen && Alignment_Classes[Resolved_Align]
        )}
        onClick={() => { if (!isOpen) setIsOpen(true); }}
      >
        {/* CLOSED TRIGGER */}
        <div 
          className={cn(
            "w-10 h-10 shrink-0 flex items-center justify-center absolute inset-0 transition-opacity duration-200 ease-in-out",
            isOpen ? "opacity-0 pointer-events-none invisible" : "opacity-100 pointer-events-auto visible"
          )}
        >
          {Closed_Icon ? (
            <div className="h-5 w-5 flex items-center justify-center [&_svg]:h-5 [&_svg]:w-5">
              {Closed_Icon}
            </div>
          ) : (
            <ChevronDown className="h-5 w-5 opacity-60" />
          )}
        </div>

        {/* EXPANDED CONTENT */}
        <div 
          className={cn(
            "w-full h-full flex flex-col relative transition-all duration-300 ease-in-out origin-center",
            isOpen 
              ? "opacity-100 scale-100 pointer-events-auto visible" 
              : "opacity-0 scale-95 pointer-events-none invisible"
          )}
        >
          
          {/* BUTTONS GROUP — mobile */}
          <div className="hidden max-sm:flex items-center justify-between w-full h-14 pl-4 pr-6 shrink-0 absolute top-0 left-0 z-30 opacity-100">
            {!isSearching ? (
              <>
                <div className="flex items-center gap-2 max-w-[65%]">
                  {Show_Go_Back && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-9 w-9 p-0 rounded-full shrink-0 flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        On_Go_Back?.();
                      }}
                    >
                      <ArrowLeft className="h-5 w-5 shrink-0" />
                    </Button>
                  )}
                  {Disable_Header_Container ? (
                    Render_Mobile_Header_Left()
                  ) : (
                    <Container className="flex items-center justify-center text-center max-w-full h-8 !py-0 px-4">
                      {Render_Mobile_Header_Left()}
                    </Container>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-9 w-9 p-0 rounded-full flex items-center justify-center"
                    onClick={() => setIsSearching(true)}
                  >
                    <Search className="h-5 w-5 shrink-0" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-9 w-9 p-0 rounded-full flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      Close_All();
                    }}
                  >
                    <X className="h-5 w-5 shrink-0" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between w-full gap-2">
                <Container className="flex items-center flex-1 h-9 px-3 min-w-0 rounded-full relative shadow-md">
                  <Search className="h-5 w-5 text-muted-foreground shrink-0 mr-2" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search entries..."
                    value={Search_Query}
                    onChange={(e) => Set_Search_Query(e.target.value)}
                    className="w-full bg-transparent text-xs font-normal outline-none placeholder:text-muted-foreground/60 h-full border-none focus:ring-0 p-0 pr-8"
                  />
                  {Search_Query && (
                    <Button
                      variant="default"
                      size="icon"
                      className="h-6 w-6 p-0 rounded-full shrink-0 absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center"
                      onClick={() => Set_Search_Query("")}
                    >
                      <X className="h-4 w-4 shrink-0" />
                    </Button>
                  )}
                </Container>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-9 w-9 p-0 rounded-full shrink-0 flex items-center justify-center"
                  onClick={() => {
                    setIsSearching(false);
                    Set_Search_Query("");
                  }}
                >
                  <X className="h-5 w-5 shrink-0" />
                </Button>
              </div>
            )}
          </div>

          {/* BUTTONS GROUP — desktop */}
          <div className="max-sm:hidden sm:flex items-center justify-between w-full h-12 px-3.5 absolute top-0 left-0 z-30 opacity-100">
            {!isSearching ? (
              <>
                <div className="flex items-center gap-1.5 max-w-[55%]">
                  {Show_Go_Back && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 p-0 rounded-full shrink-0 flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        On_Go_Back?.();
                      }}
                    >
                      <ArrowLeft className="h-5 w-5 shrink-0" />
                    </Button>
                  )}
                  {Disable_Header_Container ? (
                    Render_Desktop_Header_Left()
                  ) : (
                    <Container className="flex items-center justify-center text-center max-w-full h-7 !py-0 px-3">
                      {Render_Desktop_Header_Left()}
                    </Container>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 p-0 rounded-full shrink-0 flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSearching(true);
                    }}
                  >
                    <Search className="h-5 w-5 opacity-90 shrink-0" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 p-0 rounded-full shrink-0 flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      Close_All();
                    }}
                  >
                    <X className="h-5 w-5 opacity-80 shrink-0" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between w-full gap-1.5">
                <Container className="!py-0 !px-3 flex items-center flex-1 min-w-0 h-8 relative shadow-sm rounded-full">
                  <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-2" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search entries..."
                    value={Search_Query}
                    onChange={(e) => Set_Search_Query(e.target.value)}
                    className="w-full bg-transparent text-xs font-normal outline-none placeholder:text-muted-foreground/60 h-full border-none focus:ring-0 p-0 pr-7"
                  />
                  {Search_Query && (
                    <Button
                      variant="default"
                      size="icon"
                      className="h-5 w-5 p-0 rounded-full shrink-0 absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        Set_Search_Query("");
                      }}
                    >
                      <X className="h-3.5 w-3.5 shrink-0" />
                    </Button>
                  )}
                </Container>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 p-0 rounded-full shrink-0 flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSearching(false);
                    Set_Search_Query("");
                  }}
                >
                  <X className="h-5 w-5 shrink-0" />
                </Button>
              </div>
            )}
          </div>

          {/* SCROLL CONTAINER */}
          <div
            className={cn(
              "space-y-1.5 sm:space-y-0 max-sm:flex-1 max-sm:h-full overflow-y-auto max-sm:px-4 select-none pb-4 relative z-10 max-sm:rounded-none sm:rounded-[32px]",
              "max-sm:pt-14 sm:pt-14",
              "scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
              "max-sm:h-full",
              height
            )}
          >
            {children}
          </div>

        </div>
      </div>
    </div>
  );
}