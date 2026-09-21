import React, { useState } from "react";
import { Use_App } from "@/Context/App";
import { Use_UI, UI_Provider } from "@/Context/UI"; // UI_Provider toegevoegd
import { 
  Button_Variant, 
  Button_State, 
  Theme_Mode,
  Button_State_Config,
  DEFAULT_BUTTON_CONFIG
} from "@/Component/UI/Button/Configuration";
import { Button as CustomButton } from "@/Component/UI/Button/Index";
import { Accordion_Item } from "@/Component/UI/Accordion/Index";

function ButtonCustomizerContent() {
  const { theme } = Use_App();
  
  // Fallback naar DEFAULT_BUTTON_CONFIG om undefined errors te voorkomen
  const { 
    Button_Customization = DEFAULT_BUTTON_CONFIG, 
    Update_Button_Single_Property, 
    Reset_To_Defaults 
  } = Use_UI();

  // State voor accordeons
  const [openVariant, setOpenVariant] = useState<Button_Variant | null>("Primary");
  const [openSubState, setOpenSubState] = useState<string | null>("Primary-Normal");
  
  // State voor geneste instellingen
  const [openGooeyState, setOpenGooeyState] = useState<Record<string, boolean>>({});
  const [openFluidState, setOpenFluidState] = useState<Record<string, boolean>>({});
  const [openPaddingState, setOpenPaddingState] = useState<Record<string, boolean>>({});
  const [openMarginState, setOpenMarginState] = useState<Record<string, boolean>>({});

  const activeThemeMode: Theme_Mode = theme === "dark" ? "dark" : "light";

  const handleUpdate = <K extends keyof Button_State_Config>(
    variant: Button_Variant,
    state: Button_State,
    key: K,
    value: Button_State_Config[K]
  ) => {
    if (Update_Button_Single_Property) {
      Update_Button_Single_Property(activeThemeMode, variant, state, key, value);
    }
  };

  const toggleVariant = (variant: Button_Variant) => {
    setOpenVariant((prev) => (prev === variant ? null : variant));
  };

  const toggleSubState = (key: string) => {
    setOpenSubState((prev) => (prev === key ? null : key));
  };

  const toggleSubGroup = (
    setter: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
    key: string
  ) => {
    setter((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const variants: Button_Variant[] = ["Primary", "Secondary"];
  const states: Button_State[] = ["Normal", "Hover", "Active"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full bg-transparent">
      {/* Linker kolom: Instellingen */}
      <div className="md:col-span-7 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-sm font-semibold">Knop Instellingen</span>
          <button
            onClick={Reset_To_Defaults}
            className="px-3 py-1.5 text-xs font-medium bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-md transition-colors border border-red-500/20"
          >
            Reset to Defaults
          </button>
        </div>

        {variants.map((variant) => {
          const isVariantOpen = openVariant === variant;

          return (
            <Accordion_Item
              key={variant}
              Title={`${variant} Variant`}
              IsOpen={isVariantOpen}
              On_Toggle={() => toggleVariant(variant)}
            >
              {states.map((state) => {
                const subKey = `${variant}-${state}`;
                const isSubOpen = openSubState === subKey;

                // Haal huidige configuratie op uit de live state (of fallback defaults)
                const config = Button_Customization?.[activeThemeMode]?.[variant]?.[state] 
                  || DEFAULT_BUTTON_CONFIG[activeThemeMode][variant][state];

                return (
                  <Accordion_Item
                    key={state}
                    Title={`${state} Status`}
                    IsOpen={isSubOpen}
                    On_Toggle={() => toggleSubState(subKey)}
                    Size="small"
                  >
                    {/* --- BASICS --- */}
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Achtergrond (BG_Color)</label>
                      <input
                        type="color"
                        value={config.BG_Color}
                        onChange={(e) => handleUpdate(variant, state, "BG_Color", e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Tekst (Text_Color)</label>
                      <input
                        type="color"
                        value={config.Text_Color}
                        onChange={(e) => handleUpdate(variant, state, "Text_Color", e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Ronding (Border_Radius)</span>
                        <span>{config.Border_Radius}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={config.Border_Radius}
                        onChange={(e) => handleUpdate(variant, state, "Border_Radius", Number(e.target.value))}
                        className="w-full accent-foreground"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="text-sm font-medium">Heeft Rand (Has_Border)</label>
                      <input
                        type="checkbox"
                        checked={config.Has_Border}
                        onChange={(e) => handleUpdate(variant, state, "Has_Border", e.target.checked)}
                        className="h-4 w-4 rounded accent-foreground cursor-pointer"
                      />
                    </div>

                    {config.Has_Border && (
                      <div className="flex items-center justify-between pt-1">
                        <label className="text-sm font-medium">Randkleur (Border_Color)</label>
                        <input
                          type="color"
                          value={config.Border_Color}
                          onChange={(e) => handleUpdate(variant, state, "Border_Color", e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                        />
                      </div>
                    )}

                    {/* --- GOOEY CONFIG --- */}
                    <Accordion_Item
                      Title="Gooey Effect"
                      IsOpen={!!openGooeyState[subKey]}
                      On_Toggle={() => toggleSubGroup(setOpenGooeyState, subKey)}
                      Size="small"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Enabled</label>
                        <input
                          type="checkbox"
                          checked={config.Gooey.Enabled}
                          onChange={(e) => handleUpdate(variant, state, "Gooey", { ...config.Gooey, Enabled: e.target.checked })}
                          className="h-4 w-4 rounded accent-foreground cursor-pointer"
                        />
                      </div>
                      {config.Gooey.Enabled && (
                        <>
                          <div className="space-y-1 mt-2">
                            <div className="flex justify-between text-sm font-medium"><span>Blur</span><span>{config.Gooey.Blur}</span></div>
                            <input type="range" min="1" max="20" value={config.Gooey.Blur} onChange={(e) => handleUpdate(variant, state, "Gooey", { ...config.Gooey, Blur: Number(e.target.value) })} className="w-full" />
                          </div>
                          <div className="space-y-1 mt-2">
                            <div className="flex justify-between text-sm font-medium"><span>Contrast</span><span>{config.Gooey.Contrast}</span></div>
                            <input type="range" min="1" max="50" value={config.Gooey.Contrast} onChange={(e) => handleUpdate(variant, state, "Gooey", { ...config.Gooey, Contrast: Number(e.target.value) })} className="w-full" />
                          </div>
                        </>
                      )}
                    </Accordion_Item>

                    {/* --- FLUID CONFIG --- */}
                    <Accordion_Item
                      Title="Fluid Canvas Animatie"
                      IsOpen={!!openFluidState[subKey]}
                      On_Toggle={() => toggleSubGroup(setOpenFluidState, subKey)}
                      Size="small"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium">Enabled</label>
                        <input
                          type="checkbox"
                          checked={config.Fluid.Enabled}
                          onChange={(e) => handleUpdate(variant, state, "Fluid", { ...config.Fluid, Enabled: e.target.checked })}
                          className="h-4 w-4 rounded accent-foreground cursor-pointer"
                        />
                      </div>

                      {config.Fluid.Enabled && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">BeautifiedHover</label>
                            <input
                              type="checkbox"
                              checked={config.Fluid.BeautifiedHover}
                              onChange={(e) => handleUpdate(variant, state, "Fluid", { ...config.Fluid, BeautifiedHover: e.target.checked })}
                              className="h-4 w-4 rounded"
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">DrawBody</label>
                            <input
                              type="checkbox"
                              checked={config.Fluid.DrawBody}
                              onChange={(e) => handleUpdate(variant, state, "Fluid", { ...config.Fluid, DrawBody: e.target.checked })}
                              className="h-4 w-4 rounded"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-sm font-medium"><span>Padding</span><span>{config.Fluid.Padding}px</span></div>
                            <input type="range" min="0" max="60" value={config.Fluid.Padding} onChange={(e) => handleUpdate(variant, state, "Fluid", { ...config.Fluid, Padding: Number(e.target.value) })} className="w-full" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-sm font-medium"><span>Friction</span><span>{config.Fluid.Friction}</span></div>
                            <input type="range" min="0.5" max="0.99" step="0.01" value={config.Fluid.Friction} onChange={(e) => handleUpdate(variant, state, "Fluid", { ...config.Fluid, Friction: Number(e.target.value) })} className="w-full" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-sm font-medium"><span>Attraction</span><span>{config.Fluid.Attraction}</span></div>
                            <input type="range" min="0.01" max="0.2" step="0.01" value={config.Fluid.Attraction} onChange={(e) => handleUpdate(variant, state, "Fluid", { ...config.Fluid, Attraction: Number(e.target.value) })} className="w-full" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-sm font-medium"><span>WaveAmplitude</span><span>{config.Fluid.WaveAmplitude}</span></div>
                            <input type="range" min="0" max="10" step="0.1" value={config.Fluid.WaveAmplitude} onChange={(e) => handleUpdate(variant, state, "Fluid", { ...config.Fluid, WaveAmplitude: Number(e.target.value) })} className="w-full" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-sm font-medium"><span>WaveFrequency</span><span>{config.Fluid.WaveFrequency}</span></div>
                            <input type="range" min="0.01" max="0.2" step="0.01" value={config.Fluid.WaveFrequency} onChange={(e) => handleUpdate(variant, state, "Fluid", { ...config.Fluid, WaveFrequency: Number(e.target.value) })} className="w-full" />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] uppercase font-semibold text-muted-foreground">Min Droplet Rad</span>
                              <input type="number" value={config.Fluid.DropletMinRadius} onChange={(e) => handleUpdate(variant, state, "Fluid", { ...config.Fluid, DropletMinRadius: Number(e.target.value) })} className="w-full p-1 border rounded bg-transparent text-xs" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] uppercase font-semibold text-muted-foreground">Max Droplet Rad</span>
                              <input type="number" value={config.Fluid.DropletMaxRadius} onChange={(e) => handleUpdate(variant, state, "Fluid", { ...config.Fluid, DropletMaxRadius: Number(e.target.value) })} className="w-full p-1 border rounded bg-transparent text-xs" />
                            </div>
                          </div>
                        </div>
                      )}
                    </Accordion_Item>

                    {/* --- PADDING CONFIG --- */}
                    <Accordion_Item
                      Title="Padding (Binnenkant)"
                      IsOpen={!!openPaddingState[subKey]}
                      On_Toggle={() => toggleSubGroup(setOpenPaddingState, subKey)}
                      Size="small"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        {(["Top", "Right", "Bottom", "Left"] as const).map((side) => (
                          <div key={side} className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-semibold text-muted-foreground">{side}</span>
                            <input
                              type="number"
                              value={config.Padding[side]}
                              onChange={(e) => handleUpdate(variant, state, "Padding", { ...config.Padding, [side]: Number(e.target.value) })}
                              className="w-full p-1 border border-border rounded bg-transparent text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    </Accordion_Item>

                    {/* --- MARGIN CONFIG --- */}
                    <Accordion_Item
                      Title="Margin (Buitenkant)"
                      IsOpen={!!openMarginState[subKey]}
                      On_Toggle={() => toggleSubGroup(setOpenMarginState, subKey)}
                      Size="small"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        {(["Top", "Right", "Bottom", "Left"] as const).map((side) => (
                          <div key={side} className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-semibold text-muted-foreground">{side}</span>
                            <input
                              type="number"
                              value={config.Margin[side]}
                              onChange={(e) => handleUpdate(variant, state, "Margin", { ...config.Margin, [side]: Number(e.target.value) })}
                              className="w-full p-1 border border-border rounded bg-transparent text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    </Accordion_Item>
                  </Accordion_Item>
                );
              })}
            </Accordion_Item>
          );
        })}
      </div>

      {/* Rechter kolom: Preview */}
      <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-xl border border-border bg-transparent gap-4 h-fit sticky top-4">
        <h3 className="w-full text-center text-sm font-semibold mb-4 text-muted-foreground">Preview Knoppen</h3>
        <div className="w-full flex flex-col items-center space-y-8">
          <CustomButton Variant="Primary" Label="Primary Knop" />
          <CustomButton Variant="Secondary" Label="Secondary Knop" />
        </div>
      </div>
    </div>
  );
}

// Zorgt ervoor dat Use_UI() altijd binnen een UI_Provider draait
export function ButtonCustomizer() {
  return (
    <UI_Provider>
      <ButtonCustomizerContent />
    </UI_Provider>
  );
}

export default ButtonCustomizer;