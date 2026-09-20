import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/Library/Utility";
import { Use_UI } from "@/Context/UI";
import { Use_App } from "@/Context/App";
import { Button_Variant, Button_State, Theme_Mode } from "./Configuration";

export interface Button_Props {
  Label?: string | React.ReactNode;
  Icon?: React.ReactNode;
  On_Click?: (Event?: React.MouseEvent<HTMLDivElement>) => void;
  Height?: number;
  Padding?: number;
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
  const Container_Ref = useRef<HTMLDivElement>(null);

  const { Button_Customization } = Use_UI();
  const { theme } = Use_App();

  const Active_Theme_Key: Theme_Mode = theme === "dark" ? "dark" : "light";
  const Current_State_Key: Button_State = Is_Pressed ? "Active" : Is_Hovered ? "Hover" : "Normal";

  const Config = Button_Customization?.[Active_Theme_Key]?.[Variant]?.[Current_State_Key];

  const Resolved_BG_Color = Color || Config?.BG_Color || "#ffffff";
  const Resolved_Text_Color = Text_Color || Config?.Text_Color || "#0f172a";
  const Resolved_Border_Radius = Config?.Border_Radius ?? 12;
  const Resolved_Has_Border = Config?.Has_Border ?? false;
  const Resolved_Border_Color = Config?.Border_Color || "transparent";

  const Is_Icon_Only = Size === "icon" || (!Label && !!Icon);
  const Actual_Height = Size === "sm" ? 32 : Size === "lg" ? 48 : Size === "icon" ? 48 : Height;
  const Actual_Width = Is_Icon_Only ? Actual_Height : undefined;

  const Resolved_Aria_Label = Aria_Label || (typeof Label === "string" ? Label : undefined);

  return (
    <motion.div
      ref={Container_Ref}
      role="button"
      tabIndex={0}
      aria-label={Resolved_Aria_Label}
      className={cn(
        "flex items-center justify-center shrink-0 relative select-none cursor-pointer overflow-hidden w-full transition-all duration-150",
        Class_Name
      )}
      style={{
        width: Actual_Width ? `${Actual_Width}px` : "100%",
        height: `${Actual_Height}px`,
        borderRadius: `${Resolved_Border_Radius}px`,
        backgroundColor: Resolved_BG_Color,
        border: Resolved_Has_Border ? `2px solid ${Resolved_Border_Color}` : "none",
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
          padding: Is_Icon_Only ? "0" : "0 12px",
          color: Resolved_Text_Color,
          fontWeight: 700,
          fontSize: "14px",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        {Icon}
        {Label && <span>{Label}</span>}
      </span>
    </motion.div>
  );
};

export default Button;