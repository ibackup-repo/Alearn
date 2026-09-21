export type Theme_Mode = "light" | "dark";
export type Button_Variant = "Primary" | "Secondary";
export type Button_State = "Normal" | "Hover" | "Active";

export interface Gooey_Config {
  Enabled: boolean;
  Blur: number;
  Contrast: number;
}

export interface Fluid_Config {
  Enabled: boolean;
  BeautifiedHover: boolean;
  Padding: number;
  DrawBody: boolean;
  Friction: number;
  Attraction: number;
  WaveAmplitude: number;
  WaveFrequency: number;
  DropletMinRadius: number;
  DropletMaxRadius: number;
}

export interface Spacing_Config {
  Top: number;
  Right: number;
  Bottom: number;
  Left: number;
}

export interface Button_State_Config {
  BG_Color: string;
  Text_Color: string;
  Border_Radius: number;
  Has_Border: boolean;
  Border_Color: string;
  Gooey: Gooey_Config;
  Fluid: Fluid_Config;
  Padding: Spacing_Config;
  Margin: Spacing_Config;
}

export type Button_Customization_Map = {
  [theme in Theme_Mode]: {
    [variant in Button_Variant]: {
      [state in Button_State]: Button_State_Config;
    };
  };
};

// Standaard Fluid-configuratie gebaseerd op het Fluid.tsx component
const DEFAULT_FLUID_CONFIG: Fluid_Config = {
  Enabled: false,
  BeautifiedHover: true,
  Padding: 30,
  DrawBody: true,
  Friction: 0.88,
  Attraction: 0.03,
  WaveAmplitude: 2.5,
  WaveFrequency: 0.05,
  DropletMinRadius: 4,
  DropletMaxRadius: 10,
};

// Algemene basisconfiguratie (voor Secondary knoppen)
const DEFAULT_STATE_BASE: Button_State_Config = {
  BG_Color: "#2563eb",
  Text_Color: "#ffffff",
  Border_Radius: 12,
  Has_Border: false,
  Border_Color: "#2563eb",
  Gooey: { Enabled: false, Blur: 10, Contrast: 19 },
  Fluid: DEFAULT_FLUID_CONFIG,
  Padding: { Top: 12, Right: 16, Bottom: 12, Left: 16 },
  Margin: { Top: 0, Right: 0, Bottom: 0, Left: 0 },
};

// Specifieke basis voor de Primary knop gebaseerd op het Fluid Button component (wit, capsule, gooey actief)
const PRIMARY_STATE_BASE: Button_State_Config = {
  BG_Color: "#ffffff",
  Text_Color: "#0f172a",
  Border_Radius: 28, // Capsule-vorm (op basis van Height 56px)
  Has_Border: false,
  Border_Color: "transparent",
  Gooey: {
    Enabled: true,
    Blur: 5,        // Komt overeen met stdDeviation="5" in de SVG filter
    Contrast: 19,   // Alpha matrix multiplier 19
  },
  Fluid: {
    ...DEFAULT_FLUID_CONFIG,
    Enabled: true,  // Direct geactiveerd voor Primary
  },
  Padding: { Top: 0, Right: 0, Bottom: 0, Left: 0 },
  Margin: { Top: 0, Right: 0, Bottom: 0, Left: 0 },
};

export const DEFAULT_BUTTON_CONFIG: Button_Customization_Map = {
  light: {
    Primary: {
      Normal: { ...PRIMARY_STATE_BASE },
      Hover: { ...PRIMARY_STATE_BASE },
      Active: { ...PRIMARY_STATE_BASE },
    },
    Secondary: {
      Normal: { ...DEFAULT_STATE_BASE, BG_Color: "#f1f5f9", Text_Color: "#0f172a", Border_Color: "#e2e8f0" },
      Hover: {
        ...DEFAULT_STATE_BASE,
        BG_Color: "#e2e8f0",
        Text_Color: "#0f172a",
        Border_Color: "#cbd5e1",
        Fluid: { ...DEFAULT_FLUID_CONFIG, Enabled: true },
      },
      Active: {
        ...DEFAULT_STATE_BASE,
        BG_Color: "#cbd5e1",
        Text_Color: "#0f172a",
        Border_Color: "#94a3b8",
        Fluid: { ...DEFAULT_FLUID_CONFIG, Enabled: true },
      },
    },
  },
  dark: {
    Primary: {
      Normal: { ...PRIMARY_STATE_BASE },
      Hover: { ...PRIMARY_STATE_BASE },
      Active: { ...PRIMARY_STATE_BASE },
    },
    Secondary: {
      Normal: { ...DEFAULT_STATE_BASE, BG_Color: "#1e293b", Text_Color: "#f8fafc", Border_Color: "#334155" },
      Hover: {
        ...DEFAULT_STATE_BASE,
        BG_Color: "#334155",
        Text_Color: "#f8fafc",
        Border_Color: "#475569",
        Fluid: { ...DEFAULT_FLUID_CONFIG, Enabled: true },
      },
      Active: {
        ...DEFAULT_STATE_BASE,
        BG_Color: "#475569",
        Text_Color: "#f8fafc",
        Border_Color: "#64748b",
        Fluid: { ...DEFAULT_FLUID_CONFIG, Enabled: true },
      },
    },
  },
};