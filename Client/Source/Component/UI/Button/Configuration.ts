export type Theme_Mode = "light" | "dark";
export type Button_Variant = "Primary" | "Secondary";
export type Button_State = "Normal" | "Hover" | "Active";

export interface Button_State_Config {
  BG_Color: string;
  Text_Color: string;
  Border_Radius: number;
  Has_Border: boolean;
  Border_Color: string;
}

// 3-laags mapping: [Theme] -> [Variant] -> [State]
export type Button_Customization_Map = {
  [theme in Theme_Mode]: {
    [variant in Button_Variant]: {
      [state in Button_State]: Button_State_Config;
    };
  };
};

export const DEFAULT_BUTTON_CONFIG: Button_Customization_Map = {
  light: {
    Primary: {
      Normal: { BG_Color: "#2563eb", Text_Color: "#ffffff", Border_Radius: 12, Has_Border: false, Border_Color: "#2563eb" },
      Hover:  { BG_Color: "#1d4ed8", Text_Color: "#ffffff", Border_Radius: 12, Has_Border: false, Border_Color: "#1d4ed8" },
      Active: { BG_Color: "#1e40af", Text_Color: "#ffffff", Border_Radius: 12, Has_Border: false, Border_Color: "#1e40af" },
    },
    Secondary: {
      Normal: { BG_Color: "#f1f5f9", Text_Color: "#0f172a", Border_Radius: 12, Has_Border: false, Border_Color: "#e2e8f0" },
      Hover:  { BG_Color: "#e2e8f0", Text_Color: "#0f172a", Border_Radius: 12, Has_Border: false, Border_Color: "#cbd5e1" },
      Active: { BG_Color: "#cbd5e1", Text_Color: "#0f172a", Border_Radius: 12, Has_Border: false, Border_Color: "#94a3b8" },
    },
  },
  dark: {
    Primary: {
      Normal: { BG_Color: "#3b82f6", Text_Color: "#ffffff", Border_Radius: 12, Has_Border: false, Border_Color: "#3b82f6" },
      Hover:  { BG_Color: "#60a5fa", Text_Color: "#ffffff", Border_Radius: 12, Has_Border: false, Border_Color: "#60a5fa" },
      Active: { BG_Color: "#2563eb", Text_Color: "#ffffff", Border_Radius: 12, Has_Border: false, Border_Color: "#2563eb" },
    },
    Secondary: {
      Normal: { BG_Color: "#1e293b", Text_Color: "#f8fafc", Border_Radius: 12, Has_Border: false, Border_Color: "#334155" },
      Hover:  { BG_Color: "#334155", Text_Color: "#f8fafc", Border_Radius: 12, Has_Border: false, Border_Color: "#475569" },
      Active: { BG_Color: "#475569", Text_Color: "#f8fafc", Border_Radius: 12, Has_Border: false, Border_Color: "#64748b" },
    },
  },
};