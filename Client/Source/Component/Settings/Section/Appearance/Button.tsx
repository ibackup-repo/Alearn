import React, { useState, useCallback } from "react";
import { Use_App } from "@/Context/App";
import { Use_UI, UI_Provider, Button_State_Configuration } from "@/Context/UI";
import {
  Button_Variant,
  Button_State,
  Theme_Mode,
  Default_Button_Configuration,
  Gooey_Normal_Configuration,
  Gooey_Hover_Configuration,
  Gooey_Active_Configuration,
} from "@/Component/UI/Button/Configuration";
import { Gooey_Configuration } from "@/Component/UI/Button/Fluid";
import { Button as CustomButton } from "@/Component/UI/Button/Index";
import { Accordion_Item } from "@/Component/UI/Accordion/Index";

const VARIANTS: Button_Variant[] = ["Primary", "Secondary"];
const STATES: Button_State[] = ["Normal", "Hover", "Active"];
const DIRECTIONS = ["Top", "Right", "Bottom", "Left"] as const;

// Gooey en Fluid zijn in Configuration.ts samengevoegd tot één veld (Gooey) per
// state. De drie state-varianten hebben elk hun eigen subset van velden (bv.
// Press_Scale_X bestaat alleen bij Active, Hover_Splash_* alleen bij Hover).
// Voor dit paneel willen we juist de VOLLEDIGE verzameling velden over alle
// states heen kunnen tonen/bewerken, dus gebruiken we de doorsnede (intersectie)
// van de drie types — dat geeft een object met alle velden samen. Een unie
// (keyof A | B | C) zou hier averechts werken: die levert alleen de velden op
// die in alle drie tegelijk voorkomen.
type All_Gooey_Fields = Gooey_Normal_Configuration &
  Gooey_Hover_Configuration &
  Gooey_Active_Configuration;

// Alle numerieke velden (dus zonder de booleans)
type Fluid_Number_Key = Exclude<keyof All_Gooey_Fields, "Enabled" | "Draw_Body">;

interface Fluid_Field {
  Key: Fluid_Number_Key;
  Label: string;
  Min: number;
  Max: number;
  Step: number;
}

const FLUID_GROUPS: { Title: string; Fields: Fluid_Field[] }[] = [
  {
    Title: "Vorm",
    Fields: [
      { Key: "Canvas_Padding", Label: "Canvas Padding", Min: 0, Max: 100, Step: 1 },
      { Key: "Wave_Amplitude", Label: "Wave Amplitude (hover)", Min: 0, Max: 10, Step: 0.1 },
      { Key: "Rest_Outline_Amplitude", Label: "Rest Amplitude", Min: 0, Max: 5, Step: 0.1 },
      { Key: "Wave_Frequency", Label: "Wave Frequency", Min: 0, Max: 0.2, Step: 0.01 },
      { Key: "Scale_Breathe_Amplitude", Label: "Breathe Amplitude", Min: 0, Max: 0.2, Step: 0.01 },
    ],
  },
  {
    Title: "Druppels",
    Fields: [
      { Key: "Droplet_Min_Radius", Label: "Min Radius", Min: 0, Max: 30, Step: 1 },
      { Key: "Droplet_Max_Radius", Label: "Max Radius", Min: 0, Max: 40, Step: 1 },
      { Key: "Friction", Label: "Friction", Min: 0, Max: 1, Step: 0.01 },
      { Key: "Attraction", Label: "Attraction", Min: 0, Max: 0.2, Step: 0.005 },
      { Key: "Attraction_Jitter", Label: "Attraction Jitter", Min: 0, Max: 0.2, Step: 0.005 },
    ],
  },
  {
    Title: "Veer (indrukken)",
    Fields: [
      { Key: "Press_Scale_X", Label: "Press Scale X", Min: 0.5, Max: 1.5, Step: 0.01 },
      { Key: "Press_Scale_Y", Label: "Press Scale Y", Min: 0.5, Max: 1.5, Step: 0.01 },
      { Key: "Spring_Stiffness", Label: "Spring Stiffness", Min: 0, Max: 0.5, Step: 0.01 },
      { Key: "Spring_Damping", Label: "Spring Damping", Min: 0, Max: 1, Step: 0.01 },
    ],
  },
  {
    Title: "Splash",
    Fields: [
      { Key: "Hover_Splash_Min", Label: "Hover Min", Min: 0, Max: 10, Step: 1 },
      { Key: "Hover_Splash_Max", Label: "Hover Max", Min: 0, Max: 10, Step: 1 },
      { Key: "Hover_Splash_Intensity", Label: "Hover Intensity", Min: 0, Max: 5, Step: 0.1 },
      { Key: "Press_Splash_Min", Label: "Press Min", Min: 0, Max: 10, Step: 1 },
      { Key: "Press_Splash_Max", Label: "Press Max", Min: 0, Max: 10, Step: 1 },
      { Key: "Press_Splash_Intensity", Label: "Press Intensity", Min: 0, Max: 5, Step: 0.1 },
      { Key: "Release_Splash_Min", Label: "Release Min", Min: 0, Max: 10, Step: 1 },
      { Key: "Release_Splash_Max", Label: "Release Max", Min: 0, Max: 10, Step: 1 },
      { Key: "Release_Splash_Intensity", Label: "Release Intensity", Min: 0, Max: 5, Step: 0.1 },
    ],
  },
];

function ButtonCustomizerContent() {
  const { Thema } = Use_App();
  const {
    Button_Customization = Default_Button_Configuration,
    Update_Button_Single_Property,
    Reset_To_Defaults,
  } = Use_UI();

  const [openVariant, setOpenVariant] = useState<Button_Variant | null>("Primary");
  const [openSubState, setOpenSubState] = useState<string | null>("Primary-Normal");
  const [openSubSections, setOpenSubSections] = useState<Record<string, boolean>>({});

  const activeThemeMode: Theme_Mode = Thema === "dark" ? "Dark" : "Light";

  const handleUpdate = useCallback(
    <K extends keyof Button_State_Configuration>(
      variant: Button_Variant,
      state: Button_State,
      key: K,
      value: Button_State_Configuration[K]
    ) => {
      if (Update_Button_Single_Property) {
        Update_Button_Single_Property(activeThemeMode, variant, state, key, value);
      }
    },
    [Update_Button_Single_Property, activeThemeMode]
  );

  const toggleSubSection = useCallback((key: string) => {
    setOpenSubSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full bg-transparent">
      {/* Instellingen Kolom */}
      <div className="md:col-span-7 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-sm font-semibold">Knop Instellingen</span>
          <button
            onClick={Reset_To_Defaults}
            className="px-3 py-1.5 text-xs font-medium bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-md transition-colors border border-red-500/20 cursor-pointer"
          >
            Reset to Defaults
          </button>
        </div>

        {VARIANTS.map((variant) => (
          <Accordion_Item
            key={variant}
            Title={`${variant} Variant`}
            IsOpen={openVariant === variant}
            On_Toggle={() => setOpenVariant((prev) => (prev === variant ? null : variant))}
          >
            {STATES.map((state) => {
              const subKey = `${variant}-${state}`;
              const defaultConfig = Default_Button_Configuration[activeThemeMode][variant][state];
              const config: Button_State_Configuration =
                Button_Customization?.[activeThemeMode]?.[variant]?.[state] || defaultConfig;

              // Fallback: oude localStorage-data kan van vóór de samenvoeging van
              // Gooey en Fluid zijn (of simpelweg nog niet alle nieuwe velden bevatten).
              // We vullen ontbrekende velden aan vanuit de default zodat het paneel
              // altijd een compleet object heeft om te tonen en te bewerken.
              const gooey: All_Gooey_Fields = {
                ...(defaultConfig.Gooey as All_Gooey_Fields),
                ...(config.Gooey as All_Gooey_Fields),
              };

              return (
                <Accordion_Item
                  key={state}
                  Title={`${state} Status`}
                  IsOpen={openSubState === subKey}
                  On_Toggle={() => setOpenSubState((prev) => (prev === subKey ? null : subKey))}
                  Size="small"
                >
                  {/* Basis Instellingen */}
                  <div className="space-y-3">
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
                        onChange={(e) =>
                          handleUpdate(variant, state, "Border_Radius", Number(e.target.value))
                        }
                        className="w-full accent-foreground"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Heeft Rand (Has_Border)</label>
                      <input
                        type="checkbox"
                        checked={config.Has_Border}
                        onChange={(e) =>
                          handleUpdate(variant, state, "Has_Border", e.target.checked)
                        }
                        className="h-4 w-4 rounded accent-foreground cursor-pointer"
                      />
                    </div>

                    {config.Has_Border && (
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Randkleur (Border_Color)</label>
                        <input
                          type="color"
                          value={config.Border_Color}
                          onChange={(e) =>
                            handleUpdate(variant, state, "Border_Color", e.target.value)
                          }
                          className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                        />
                      </div>
                    )}
                  </div>

                  {/* Gooey / Fluid Effect — sinds de samenvoeging in Configuration.ts
                      is dit één config-object (config.Gooey) dat zowel het SVG-filter
                      als de canvas-druppelanimatie aanstuurt. */}
                  <Accordion_Item
                    Title="Gooey / Fluid Effect"
                    IsOpen={!!openSubSections[`${subKey}-gooey`]}
                    On_Toggle={() => toggleSubSection(`${subKey}-gooey`)}
                    Size="small"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Enabled</label>
                        <input
                          type="checkbox"
                          checked={gooey.Enabled}
                          onChange={(e) =>
                            handleUpdate(variant, state, "Gooey", {
                              ...gooey,
                              Enabled: e.target.checked,
                            } as Gooey_Configuration)
                          }
                          className="h-4 w-4 rounded accent-foreground cursor-pointer"
                        />
                      </div>

                      {gooey.Enabled && (
                        <>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm font-medium">
                              <span>Blur</span>
                              <span>{gooey.Blur}</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="20"
                              value={gooey.Blur}
                              onChange={(e) =>
                                handleUpdate(variant, state, "Gooey", {
                                  ...gooey,
                                  Blur: Number(e.target.value),
                                } as Gooey_Configuration)
                              }
                              className="w-full"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm font-medium">
                              <span>Contrast</span>
                              <span>{gooey.Contrast}</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="50"
                              value={gooey.Contrast}
                              onChange={(e) =>
                                handleUpdate(variant, state, "Gooey", {
                                  ...gooey,
                                  Contrast: Number(e.target.value),
                                } as Gooey_Configuration)
                              }
                              className="w-full"
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Draw Body</label>
                            <input
                              type="checkbox"
                              checked={gooey.Draw_Body}
                              onChange={(e) =>
                                handleUpdate(variant, state, "Gooey", {
                                  ...gooey,
                                  Draw_Body: e.target.checked,
                                } as Gooey_Configuration)
                              }
                              className="h-4 w-4 rounded accent-foreground cursor-pointer"
                            />
                          </div>

                          {FLUID_GROUPS.map((group) => (
                            <div
                              key={group.Title}
                              className="space-y-2 pt-2 border-t border-border"
                            >
                              <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                                {group.Title}
                              </span>
                              {group.Fields.map((field) => (
                                <div key={field.Key} className="space-y-1">
                                  <div className="flex justify-between text-sm font-medium">
                                    <span>{field.Label}</span>
                                    <span>{gooey[field.Key]}</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={field.Min}
                                    max={field.Max}
                                    step={field.Step}
                                    value={gooey[field.Key]}
                                    onChange={(e) =>
                                      handleUpdate(variant, state, "Gooey", {
                                        ...gooey,
                                        [field.Key]: Number(e.target.value),
                                      } as Gooey_Configuration)
                                    }
                                    className="w-full accent-foreground"
                                  />
                                </div>
                              ))}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </Accordion_Item>

                  {/* Padding */}
                  <Accordion_Item
                    Title="Padding (Binnenkant)"
                    IsOpen={!!openSubSections[`${subKey}-padding`]}
                    On_Toggle={() => toggleSubSection(`${subKey}-padding`)}
                    Size="small"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {DIRECTIONS.map((side) => (
                        <div key={side} className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                            {side}
                          </span>
                          <input
                            type="number"
                            value={config.Padding[side]}
                            onChange={(e) =>
                              handleUpdate(variant, state, "Padding", {
                                ...config.Padding,
                                [side]: Number(e.target.value),
                              })
                            }
                            className="w-full p-1 border border-border rounded bg-transparent text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </Accordion_Item>

                  {/* Margin */}
                  <Accordion_Item
                    Title="Margin (Buitenkant)"
                    IsOpen={!!openSubSections[`${subKey}-margin`]}
                    On_Toggle={() => toggleSubSection(`${subKey}-margin`)}
                    Size="small"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {DIRECTIONS.map((side) => (
                        <div key={side} className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                            {side}
                          </span>
                          <input
                            type="number"
                            value={config.Margin[side]}
                            onChange={(e) =>
                              handleUpdate(variant, state, "Margin", {
                                ...config.Margin,
                                [side]: Number(e.target.value),
                              })
                            }
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
        ))}
      </div>

      {/* Preview Kolom */}
      <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-xl border border-border bg-transparent gap-4 h-fit sticky top-4">
        <h3 className="w-full text-center text-sm font-semibold mb-4 text-muted-foreground">
          Preview Knoppen
        </h3>
        <div className="w-full flex flex-col items-center space-y-8">
          <CustomButton Variant="Primary" Label="Primary Knop" />
          <CustomButton Variant="Secondary" Label="Secondary Knop" />
        </div>
      </div>
    </div>
  );
}

export function ButtonCustomizer() {
  return (
    <UI_Provider>
      <ButtonCustomizerContent />
    </UI_Provider>
  );
}

export default ButtonCustomizer;