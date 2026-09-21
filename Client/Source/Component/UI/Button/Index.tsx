import React, { useState, useRef, useId, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/Library/Utility";
import { Use_UI } from "@/Context/UI";
import { Use_App } from "@/Context/App";
import { Button_Variant, Button_State, Theme_Mode, Fluid_Config } from "./Configuration";
import { Fluid } from "./Fluid";

export interface Button_Props {
  Label?: string | React.ReactNode;
  Icon?: React.ReactNode;
  On_Click?: (Event?: React.MouseEvent<HTMLDivElement>) => void;
  Height?: number;
  Width?: number;
  Variant?: Button_Variant;
  Color?: string;
  Text_Color?: string;
  Size?: "default" | "icon" | "sm" | "lg";
  Class_Name?: string;
  Style?: React.CSSProperties;
  "aria-label"?: string;
}

export const Button: React.FC<Button_Props> = ({
  Label,
  Icon,
  On_Click,
  Height = 48,
  Width,
  Variant = "Primary",
  Color,
  Text_Color,
  Size = "default",
  Class_Name,
  Style,
  "aria-label": Aria_Label,
}) => {
  const [Is_Hovered, Set_Is_Hovered] = useState(false);
  const [Is_Pressed, Set_Is_Pressed] = useState(false);
  const [Measured_Width, Set_Measured_Width] = useState<number>(Width || 180);
  const Container_Ref = useRef<HTMLDivElement>(null);

  const Filter_Id = useId().replace(/:/g, "");

  let Button_Customization = null;
  try {
    const uiContext = Use_UI();
    Button_Customization = uiContext?.Button_Customization;
  } catch {}

  const { theme } = Use_App();

  const Active_Theme_Key: Theme_Mode = theme === "dark" ? "dark" : "light";
  const Current_State_Key: Button_State = Is_Pressed ? "Active" : Is_Hovered ? "Hover" : "Normal";

  const Config = Button_Customization?.[Active_Theme_Key]?.[Variant]?.[Current_State_Key];

  const Resolved_BG_Color = Color || Config?.BG_Color || "#ffffff";
  const Resolved_Text_Color = Text_Color || Config?.Text_Color || "#0f172a";
  const Resolved_Border_Radius = Config?.Border_Radius ?? 12;
  const Resolved_Has_Border = Config?.Has_Border ?? false;
  const Resolved_Border_Color = Config?.Border_Color || "transparent";

  const Gooey = Config?.Gooey || { Enabled: false, Blur: 10, Contrast: 19 };
  const FluidConfig: Fluid_Config = Config?.Fluid || {
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

  const Padding = Config?.Padding || { Top: 12, Right: 16, Bottom: 12, Left: 16 };
  const Margin = Config?.Margin || { Top: 0, Right: 0, Bottom: 0, Left: 0 };

  const Is_Icon_Only = Size === "icon" || (!Label && !!Icon);
  const Actual_Height = Size === "sm" ? 32 : Size === "lg" ? 48 : Size === "icon" ? 48 : Height;
  const Actual_Width = Is_Icon_Only ? Actual_Height : Width;

  // Dynamisch de breedte van het element opmeten voor de canvas berekeningen
  useEffect(() => {
    if (Container_Ref.current && !Width) {
      const Rect = Container_Ref.current.getBoundingClientRect();
      if (Rect.width > 0) {
        Set_Measured_Width(Rect.width);
      }
    }
  }, [Label, Icon, Size, Padding]);

  const Resolved_Aria_Label = Aria_Label || (typeof Label === "string" ? Label : undefined);
  const Use_Gooey_Filter = Gooey.Enabled || FluidConfig.Enabled;

  return (
    <div className="relative inline-block w-full">
      {/* Shared SVG filter voor Gooey & Fluid effecten */}
      {Use_Gooey_Filter && (
        <svg className="hidden absolute w-0 h-0" aria-hidden="true">
          <defs>
            <filter id={`gooey-filter-${Filter_Id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation={Gooey.Blur} result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${Gooey.Contrast} -9`}
                result="gooey"
              />
              <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
            </filter>
          </defs>
        </svg>
      )}

      {/* Fluid Canvas Animatie Layer */}
      {FluidConfig.Enabled && (
        <div
          style={{
            position: "absolute",
            top: -FluidConfig.Padding,
            left: -FluidConfig.Padding,
            filter: `url(#gooey-filter-${Filter_Id})`,
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <Fluid
            isHovered={Is_Hovered}
            isPressed={Is_Pressed}
            width={Actual_Width || Measured_Width}
            height={Actual_Height}
            color={Resolved_BG_Color}
            config={FluidConfig}
          />
        </div>
      )}

      {/* Hoofd Button Component */}
      <motion.div
        ref={Container_Ref}
        role="button"
        tabIndex={0}
        aria-label={Resolved_Aria_Label}
        className={cn(
          "flex items-center justify-center shrink-0 relative select-none cursor-pointer overflow-hidden transition-all duration-150",
          Class_Name
        )}
        style={{
          width: Actual_Width ? `${Actual_Width}px` : "100%",
          height: `${Actual_Height}px`,
          borderRadius: `${Resolved_Border_Radius}px`,
          backgroundColor: FluidConfig.Enabled && Is_Hovered ? "transparent" : Resolved_BG_Color,
          border: Resolved_Has_Border ? `2px solid ${Resolved_Border_Color}` : "none",
          paddingTop: `${Padding.Top}px`,
          paddingRight: `${Padding.Right}px`,
          paddingBottom: `${Padding.Bottom}px`,
          paddingLeft: `${Padding.Left}px`,
          marginTop: `${Margin.Top}px`,
          marginRight: `${Margin.Right}px`,
          marginBottom: `${Margin.Bottom}px`,
          marginLeft: `${Margin.Left}px`,
          filter: Gooey.Enabled && !FluidConfig.Enabled ? `url(#gooey-filter-${Filter_Id})` : "none",
          ...Style,
        }}
        onMouseEnter={() => Set_Is_Hovered(true)}
        onMouseLeave={() => {
          Set_Is_Hovered(false);
          Set_Is_Pressed(false);
        }}
        onMouseDown={() => Set_Is_Pressed(true)}
        onMouseUp={() => Set_Is_Pressed(false)}
        onTouchStart={() => {
          Set_Is_Hovered(true);
          Set_Is_Pressed(true);
        }}
        onTouchEnd={() => {
          Set_Is_Hovered(false);
          Set_Is_Pressed(false);
        }}
        onClick={On_Click}
      >
        <span
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            width: "100%",
            height: "100%",
            color: Resolved_Text_Color,
            fontWeight: 700,
            fontSize: "14px",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            textAlign: "center",
            transform: Is_Pressed ? "scale(0.94)" : "scale(1)",
            transition: "transform 0.15s ease",
            pointerEvents: "none",
          }}
        >
          {Icon}
          {Label && <span>{Label}</span>}
        </span>
      </motion.div>
    </div>
  );
};

export default Button;