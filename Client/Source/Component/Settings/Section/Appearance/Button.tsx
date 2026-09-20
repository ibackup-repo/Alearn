// Button.tsx
import { useState } from "react";
import { Use_App } from "@/Context/App";
import { UI_Provider, Use_UI } from "@/Context/UI"; // <-- UI_Provider hier importeren
import { Button_Variant, Button_State, Theme_Mode } from "@/Component/UI/Button/Configuration";
import { ChevronDown, MousePointerClick } from "lucide-react";
import { Button as CustomButton } from "@/Component/UI/Button/Index";

function ButtonCustomizerContent() {
  const { theme } = Use_App();
  const { Button_Customization, Update_Button_Single_Property } = Use_UI();

  const [isButtonDropdownOpen, setIsButtonDropdownOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Button_Variant>("Primary");
  const [selectedState, setSelectedState] = useState<Button_State>("Normal");

  const activeThemeMode: Theme_Mode = theme === "dark" ? "dark" : "light";

  const currentConfig = Button_Customization?.[activeThemeMode]?.[selectedVariant]?.[selectedState] || {
    BG_Color: "#ffffff",
    Text_Color: "#0f172a",
    Border_Radius: 12,
    Has_Border: false,
    Border_Color: "#ffffff",
  };

  const handleUpdate = (key: any, value: any) => {
    Update_Button_Single_Property(activeThemeMode, selectedVariant, selectedState, key, value);
  };

  return (
    <div className="w-full border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setIsButtonDropdownOpen(!isButtonDropdownOpen)}
        className="w-full p-4 flex items-center justify-between bg-card hover:bg-accent/50 transition-colors text-left"
      >
        <span className="flex items-center gap-2 font-semibold text-sm">
          <MousePointerClick className="h-4 w-4" /> Knop Stijlen Aanpassen
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${
            isButtonDropdownOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isButtonDropdownOpen && (
        <div className="p-4 bg-card/50 border-t border-border space-y-5 w-full">
          {/* Live Preview */}
          <div className="p-4 rounded-xl bg-background/80 border border-border flex flex-col items-center justify-center gap-2 w-full">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Live Voorbeeld ({activeThemeMode} - {selectedVariant})
            </span>
            <div className="w-full max-w-xs">
              <CustomButton Variant={selectedVariant} Label="Test Knop" />
            </div>
          </div>

          {/* Variant Selector */}
          <div className="w-full">
            <label className="text-xs font-semibold opacity-70 block mb-2">Variant</label>
            <div className="grid grid-cols-2 gap-2 w-full">
              {(["Primary", "Secondary"] as Button_Variant[]).map((variant) => (
                <button
                  key={variant}
                  onClick={() => setSelectedVariant(variant)}
                  className={`py-1.5 text-xs font-medium rounded-lg border capitalize transition-all ${
                    selectedVariant === variant
                      ? "bg-foreground text-background border-foreground"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {variant}
                </button>
              ))}
            </div>
          </div>

          {/* State Selector */}
          <div className="w-full">
            <label className="text-xs font-semibold opacity-70 block mb-2">Status (State)</label>
            <div className="grid grid-cols-3 gap-1.5 w-full">
              {(["Normal", "Hover", "Active"] as Button_State[]).map((state) => (
                <button
                  key={state}
                  onClick={() => setSelectedState(state)}
                  className={`py-1.5 text-xs font-medium rounded-lg border capitalize transition-all ${
                    selectedState === state
                      ? "bg-foreground text-background border-foreground"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {state === "Normal" ? "Normaal" : state}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-border opacity-30 w-full" />

          {/* Controls */}
          <div className="space-y-3 pt-1 w-full">
            <div className="flex items-center justify-between w-full">
              <label className="text-xs font-medium">Achtergrondkleur</label>
              <input
                type="color"
                value={currentConfig.BG_Color}
                onChange={(e) => handleUpdate("BG_Color", e.target.value)}
                className="w-7 h-7 rounded cursor-pointer border-none bg-transparent"
              />
            </div>

            <div className="flex items-center justify-between w-full">
              <label className="text-xs font-medium">Tekstkleur</label>
              <input
                type="color"
                value={currentConfig.Text_Color}
                onChange={(e) => handleUpdate("Text_Color", e.target.value)}
                className="w-7 h-7 rounded cursor-pointer border-none bg-transparent"
              />
            </div>

            <div className="space-y-1 w-full">
              <div className="flex justify-between text-xs font-medium">
                <span>Ronding (Border Radius)</span>
                <span>{currentConfig.Border_Radius}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="32"
                value={currentConfig.Border_Radius}
                onChange={(e) => handleUpdate("Border_Radius", Number(e.target.value))}
                className="w-full accent-foreground"
              />
            </div>

            <div className="flex items-center justify-between pt-1 w-full">
              <label className="text-xs font-medium">Rand (Border) Aan/Uit</label>
              <input
                type="checkbox"
                checked={currentConfig.Has_Border}
                onChange={(e) => handleUpdate("Has_Border", e.target.checked)}
                className="h-4 w-4 rounded accent-foreground cursor-pointer"
              />
            </div>

            {currentConfig.Has_Border && (
              <div className="flex items-center justify-between w-full pt-1 transition-all">
                <label className="text-xs font-medium">Rand Kleur</label>
                <input
                  type="color"
                  value={currentConfig.Border_Color}
                  onChange={(e) => handleUpdate("Border_Color", e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border-none bg-transparent"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Geëxporteerd component gewrapt in de UI_Provider
export function ButtonCustomizer() {
  return (
    <UI_Provider>
      <ButtonCustomizerContent />
    </UI_Provider>
  );
}

export default ButtonCustomizer;