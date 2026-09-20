import React, { createContext, useContext, useState } from "react";
import { 
  Button_Customization_Map, 
  DEFAULT_BUTTON_CONFIG,
  Theme_Mode,
  Button_Variant,
  Button_State,
  Button_State_Config
} from "@/Component/UI/Button/Configuration";

interface UI_Context_Type {
  Button_Customization: Button_Customization_Map;
  Update_Button_Single_Property: (
    Theme: Theme_Mode,
    Variant: Button_Variant,
    State: Button_State,
    Key: keyof Button_State_Config,
    Value: any
  ) => void;
  Reset_To_Defaults: () => void;
}

const LOCAL_STORAGE_KEY = "ui_button_customization";

const UI_Context = createContext<UI_Context_Type | undefined>(undefined);

export const UI_Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [Button_Customization, Set_Button_Customization] = useState<Button_Customization_Map>(() => {
    if (typeof window !== "undefined") {
      const Saved_Config = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (Saved_Config) {
        try {
          return JSON.parse(Saved_Config);
        } catch (Error) {
          console.error("Fout bij het laden van UI instellingen uit LocalStorage:", Error);
        }
      }
    }
    return DEFAULT_BUTTON_CONFIG;
  });

  const Update_Button_Single_Property = (
    Theme: Theme_Mode,
    Variant: Button_Variant,
    State: Button_State,
    Key: keyof Button_State_Config,
    Value: any
  ) => {
    Set_Button_Customization((Prev) => {
      const Updated: Button_Customization_Map = {
        ...Prev,
        [Theme]: {
          ...Prev[Theme],
          [Variant]: {
            ...Prev[Theme][Variant],
            [State]: {
              ...Prev[Theme][Variant][State],
              [Key]: Value,
            },
          },
        },
      };

      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(Updated));
      }

      return Updated;
    });
  };

  const Reset_To_Defaults = () => {
    Set_Button_Customization(DEFAULT_BUTTON_CONFIG);
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  return (
    <UI_Context.Provider
      value={{
        Button_Customization,
        Update_Button_Single_Property,
        Reset_To_Defaults,
      }}
    >
      {children}
    </UI_Context.Provider>
  );
};

export const Use_UI = (): UI_Context_Type => {
  const Context = useContext(UI_Context);
  if (!Context) {
    throw new Error("Use_UI moet binnen een UI_Provider worden gebruikt");
  }
  return Context;
};