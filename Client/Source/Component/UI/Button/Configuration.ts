export type Theme_Mode = "Light" | "Dark";
export type Button_Variant = "Primary" | "Secondary";
export type Button_State = "Normal" | "Hover" | "Active";

export interface Spacing_Configuration {
  Top: number;
  Right: number;
  Bottom: number;
  Left: number;
}

interface Gooey_Base_Configuration {
  Enabled: boolean;
  Blur: number;
  Contrast: number;

  Canvas_Padding: number;
  Draw_Body: boolean;
  Wave_Frequency: number;
  Spring_Stiffness: number;
  Spring_Damping: number;
}

export interface Gooey_Normal_Configuration extends Gooey_Base_Configuration {
  Rest_Outline_Amplitude: number;
}

export interface Gooey_Hover_Configuration extends Gooey_Base_Configuration {
  Wave_Amplitude: number;
  Rest_Outline_Amplitude: number;
  Scale_Breathe_Amplitude: number;
  Friction: number;
  Attraction: number;
  Attraction_Jitter: number;
  Droplet_Min_Radius: number;
  Droplet_Max_Radius: number;
  Hover_Splash_Min: number;
  Hover_Splash_Max: number;
  Hover_Splash_Intensity: number;
  Release_Splash_Min: number;
  Release_Splash_Max: number;
  Release_Splash_Intensity: number;
}

export interface Gooey_Active_Configuration extends Gooey_Base_Configuration {
  Wave_Amplitude: number;
  Press_Scale_X: number;
  Press_Scale_Y: number;
  Friction: number;
  Attraction: number;
  Attraction_Jitter: number;
  Droplet_Min_Radius: number;
  Droplet_Max_Radius: number;
  Press_Splash_Min: number;
  Press_Splash_Max: number;
  Press_Splash_Intensity: number;
}

interface Button_Base_Fields {
  BG_Color: string;
  Text_Color: string;
  Border_Radius: number;
  Has_Border: boolean;
  Border_Color: string;
  Padding: Spacing_Configuration;
  Margin: Spacing_Configuration;
}

export interface Button_Normal_Configuration extends Button_Base_Fields {
  Gooey: Gooey_Normal_Configuration;
}
export interface Button_Hover_Configuration extends Button_Base_Fields {
  Gooey: Gooey_Hover_Configuration;
}
export interface Button_Active_Configuration extends Button_Base_Fields {
  Gooey: Gooey_Active_Configuration;
}

export type Button_Configuration_Map = {
  [Theme in Theme_Mode]: {
    [Variant in Button_Variant]: {
      Normal: Button_Normal_Configuration;
      Hover: Button_Hover_Configuration;
      Active: Button_Active_Configuration;
    };
  };
};

export const Default_Button_Configuration: Button_Configuration_Map = {
  Light: {
    Primary: {
      Normal: {
        BG_Color: "#ffffff",
        Text_Color: "#0f172a",
        Border_Radius: 28,
        Has_Border: false,
        Border_Color: "transparent",
        
        Gooey: {
          Enabled: false,
          Blur: 5,
          Contrast: 19,
          Canvas_Padding: 30,
          Draw_Body: true,
          Wave_Frequency: 0.05,
          Spring_Stiffness: 0.15,
          Spring_Damping: 0.75,
          Rest_Outline_Amplitude: 0.4,
        },
        Padding: { Top: 0, Right: 0, Bottom: 0, Left: 0 },
        Margin: { Top: 0, Right: 0, Bottom: 0, Left: 0 },
      },
      Hover: {
        BG_Color: "#ffffff",
        Text_Color: "#0f172a",
        Border_Radius: 28,
        Has_Border: false,
        Border_Color: "transparent",
        Gooey: {
          Enabled: true,
          Blur: 5,
          Contrast: 19,
          Canvas_Padding: 30,
          Draw_Body: true,
          Wave_Frequency: 0.05,
          Spring_Stiffness: 0.15,
          Spring_Damping: 0.75,
          Wave_Amplitude: 2.5,
          Rest_Outline_Amplitude: 0.4,
          Scale_Breathe_Amplitude: 0.02,
          Friction: 0.88,
          Attraction: 0.03,
          Attraction_Jitter: 0.02,
          Droplet_Min_Radius: 4,
          Droplet_Max_Radius: 14,
          Hover_Splash_Min: 2,
          Hover_Splash_Max: 4,
          Hover_Splash_Intensity: 0.8,
          Release_Splash_Min: 1,
          Release_Splash_Max: 2,
          Release_Splash_Intensity: 0.6,
        },
        Padding: { Top: 0, Right: 0, Bottom: 0, Left: 0 },
        Margin: { Top: 0, Right: 0, Bottom: 0, Left: 0 },
      },
      Active: {
        BG_Color: "#ffffff",
        Text_Color: "#0f172a",
        Border_Radius: 28,
        Has_Border: false,
        Border_Color: "transparent",
        Gooey: {
          Enabled: true,
          Blur: 5,
          Contrast: 19,
          Canvas_Padding: 30,
          Draw_Body: true,
          Wave_Frequency: 0.05,
          Spring_Stiffness: 0.15,
          Spring_Damping: 0.75,
          Wave_Amplitude: 2.5,
          Press_Scale_X: 1.08,
          Press_Scale_Y: 0.88,
          Friction: 0.88,
          Attraction: 0.03,
          Attraction_Jitter: 0.02,
          Droplet_Min_Radius: 4,
          Droplet_Max_Radius: 14,
          Press_Splash_Min: 4,
          Press_Splash_Max: 7,
          Press_Splash_Intensity: 1.8,
        },
        Padding: { Top: 0, Right: 0, Bottom: 0, Left: 0 },
        Margin: { Top: 0, Right: 0, Bottom: 0, Left: 0 },
      },
    },
    Secondary: {
      Normal: {
        BG_Color: "#f1f5f9",
        Text_Color: "#0f172a",
        Border_Radius: 12,
        Has_Border: false,
        Border_Color: "#e2e8f0",
        Gooey: {
          Enabled: false,
          Blur: 10,
          Contrast: 19,
          Canvas_Padding: 30,
          Draw_Body: true,
          Wave_Frequency: 0.05,
          Spring_Stiffness: 0.15,
          Spring_Damping: 0.75,
          Rest_Outline_Amplitude: 0.4,
        },
        Padding: { Top: 12, Right: 16, Bottom: 12, Left: 16 },
        Margin: { Top: 0, Right: 0, Bottom: 0, Left: 0 },
      },
      Hover: {
        BG_Color: "#e2e8f0",
        Text_Color: "#0f172a",
        Border_Radius: 12,
        Has_Border: false,
        Border_Color: "#cbd5e1",
        Gooey: {
          Enabled: true,
          Blur: 10,
          Contrast: 19,
          Canvas_Padding: 30,
          Draw_Body: true,
          Wave_Frequency: 0.05,
          Spring_Stiffness: 0.15,
          Spring_Damping: 0.75,
          Wave_Amplitude: 2.5,
          Rest_Outline_Amplitude: 0.4,
          Scale_Breathe_Amplitude: 0.02,
          Friction: 0.88,
          Attraction: 0.03,
          Attraction_Jitter: 0.02,
          Droplet_Min_Radius: 4,
          Droplet_Max_Radius: 14,
          Hover_Splash_Min: 2,
          Hover_Splash_Max: 4,
          Hover_Splash_Intensity: 0.8,
          Release_Splash_Min: 1,
          Release_Splash_Max: 2,
          Release_Splash_Intensity: 0.6,
        },
        Padding: { Top: 12, Right: 16, Bottom: 12, Left: 16 },
        Margin: { Top: 0, Right: 0, Bottom: 0, Left: 0 },
      },
      Active: {
        BG_Color: "#cbd5e1",
        Text_Color: "#0f172a",
        Border_Radius: 12,
        Has_Border: false,
        Border_Color: "#94a3b8",
        Gooey: {
          Enabled: true,
          Blur: 10,
          Contrast: 19,
          Canvas_Padding: 30,
          Draw_Body: true,
          Wave_Frequency: 0.05,
          Spring_Stiffness: 0.15,
          Spring_Damping: 0.75,
          Wave_Amplitude: 2.5,
          Press_Scale_X: 1.08,
          Press_Scale_Y: 0.88,
          Friction: 0.88,
          Attraction: 0.03,
          Attraction_Jitter: 0.02,
          Droplet_Min_Radius: 4,
          Droplet_Max_Radius: 14,
          Press_Splash_Min: 4,
          Press_Splash_Max: 7,
          Press_Splash_Intensity: 1.8,
        },
        Padding: { Top: 12, Right: 16, Bottom: 12, Left: 16 },
        Margin: { Top: 0, Right: 0, Bottom: 0, Left: 0 },
      },
    },
  },
  Dark: {
    Primary: {
      Normal: {
        BG_Color: "#ffffff",
        Text_Color: "#0f172a",
        Border_Radius: 28,
        Has_Border: false,
        Border_Color: "transparent",
        // Hier stond Fluid.Enabled altijd al op true: dit is de knop die ook in
        // rust een zachte, ademende rand toont. Dat gedrag blijft behouden.
        Gooey: {
          Enabled: true,
          Blur: 5,
          Contrast: 19,
          Canvas_Padding: 30,
          Draw_Body: true,
          Wave_Frequency: 0.05,
          Spring_Stiffness: 0.15,
          Spring_Damping: 0.75,
          Rest_Outline_Amplitude: 0.4,
        },
        Padding: { Top: 0, Right: 0, Bottom: 0, Left: 0 },
        Margin: { Top: 0, Right: 0, Bottom: 0, Left: 0 },
      },
      Hover: {
        BG_Color: "#ffffff",
        Text_Color: "#0f172a",
        Border_Radius: 28,
        Has_Border: false,
        Border_Color: "transparent",
        Gooey: {
          Enabled: true,
          Blur: 5,
          Contrast: 19,
          Canvas_Padding: 30,
          Draw_Body: true,
          Wave_Frequency: 0.05,
          Spring_Stiffness: 0.15,
          Spring_Damping: 0.75,
          Wave_Amplitude: 2.5,
          Rest_Outline_Amplitude: 0.4,
          Scale_Breathe_Amplitude: 0.02,
          Friction: 0.88,
          Attraction: 0.03,
          Attraction_Jitter: 0.02,
          Droplet_Min_Radius: 4,
          Droplet_Max_Radius: 14,
          Hover_Splash_Min: 2,
          Hover_Splash_Max: 4,
          Hover_Splash_Intensity: 0.8,
          Release_Splash_Min: 1,
          Release_Splash_Max: 2,
          Release_Splash_Intensity: 0.6,
        },
        Padding: { Top: 0, Right: 0, Bottom: 0, Left: 0 },
        Margin: { Top: 0, Right: 0, Bottom: 0, Left: 0 },
      },
      Active: {
        BG_Color: "#ffffff",
        Text_Color: "#0f172a",
        Border_Radius: 28,
        Has_Border: false,
        Border_Color: "transparent",
        Gooey: {
          Enabled: true,
          Blur: 5,
          Contrast: 19,
          Canvas_Padding: 30,
          Draw_Body: true,
          Wave_Frequency: 0.05,
          Spring_Stiffness: 0.15,
          Spring_Damping: 0.75,
          Wave_Amplitude: 2.5,
          Press_Scale_X: 1.08,
          Press_Scale_Y: 0.88,
          Friction: 0.88,
          Attraction: 0.03,
          Attraction_Jitter: 0.02,
          Droplet_Min_Radius: 4,
          Droplet_Max_Radius: 14,
          Press_Splash_Min: 4,
          Press_Splash_Max: 7,
          Press_Splash_Intensity: 1.8,
        },
        Padding: { Top: 0, Right: 0, Bottom: 0, Left: 0 },
        Margin: { Top: 0, Right: 0, Bottom: 0, Left: 0 },
      },
    },
    Secondary: {
      Normal: {
        BG_Color: "#1e293b",
        Text_Color: "#f8fafc",
        Border_Radius: 12,
        Has_Border: false,
        Border_Color: "#334155",
        Gooey: {
          Enabled: false,
          Blur: 10,
          Contrast: 19,
          Canvas_Padding: 30,
          Draw_Body: true,
          Wave_Frequency: 0.05,
          Spring_Stiffness: 0.15,
          Spring_Damping: 0.75,
          Rest_Outline_Amplitude: 0.4,
        },
        Padding: { Top: 12, Right: 16, Bottom: 12, Left: 16 },
        Margin: { Top: 0, Right: 0, Bottom: 0, Left: 0 },
      },
      Hover: {
        BG_Color: "#334155",
        Text_Color: "#f8fafc",
        Border_Radius: 12,
        Has_Border: false,
        Border_Color: "#475569",
        Gooey: {
          Enabled: true,
          Blur: 10,
          Contrast: 19,
          Canvas_Padding: 30,
          Draw_Body: true,
          Wave_Frequency: 0.05,
          Spring_Stiffness: 0.15,
          Spring_Damping: 0.75,
          Wave_Amplitude: 2.5,
          Rest_Outline_Amplitude: 0.4,
          Scale_Breathe_Amplitude: 0.02,
          Friction: 0.88,
          Attraction: 0.03,
          Attraction_Jitter: 0.02,
          Droplet_Min_Radius: 4,
          Droplet_Max_Radius: 14,
          Hover_Splash_Min: 2,
          Hover_Splash_Max: 4,
          Hover_Splash_Intensity: 0.8,
          Release_Splash_Min: 1,
          Release_Splash_Max: 2,
          Release_Splash_Intensity: 0.6,
        },
        Padding: { Top: 12, Right: 16, Bottom: 12, Left: 16 },
        Margin: { Top: 0, Right: 0, Bottom: 0, Left: 0 },
      },
      Active: {
        BG_Color: "#475569",
        Text_Color: "#f8fafc",
        Border_Radius: 12,
        Has_Border: false,
        Border_Color: "#64748b",
        Gooey: {
          Enabled: true,
          Blur: 10,
          Contrast: 19,
          Canvas_Padding: 30,
          Draw_Body: true,
          Wave_Frequency: 0.05,
          Spring_Stiffness: 0.15,
          Spring_Damping: 0.75,
          Wave_Amplitude: 2.5,
          Press_Scale_X: 1.08,
          Press_Scale_Y: 0.88,
          Friction: 0.88,
          Attraction: 0.03,
          Attraction_Jitter: 0.02,
          Droplet_Min_Radius: 4,
          Droplet_Max_Radius: 14,
          Press_Splash_Min: 4,
          Press_Splash_Max: 7,
          Press_Splash_Intensity: 1.8,
        },
        Padding: { Top: 12, Right: 16, Bottom: 12, Left: 16 },
        Margin: { Top: 0, Right: 0, Bottom: 0, Left: 0 },
      },
    },
  },
};