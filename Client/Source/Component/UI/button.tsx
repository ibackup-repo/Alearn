import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Fluid from "./Fluid";
import { useNavTransition } from "@/Context/Navigation";
import { cn } from "@/Library/Utility";

export type ButtonVariant = "primary" | "secondary";

export interface FluidButtonProps {
  Label?: string | React.ReactNode;
  Icon?: React.ReactNode;
  OnClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
  NavigateTo?: string;
  BeautifiedHover?: boolean;
  Height?: number;
  Padding?: number;
  variant?: ButtonVariant;
  Color?: string;
  TextColor?: string;
  borderRadius?: number;
  hasBorder?: boolean;
  borderColor?: string;
  size?: "default" | "icon" | "sm" | "lg";
  className?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
}

export const Button: React.FC<FluidButtonProps> = ({
  Label,
  Icon,
  OnClick,
  NavigateTo,
  BeautifiedHover = true,
  Height = 48,
  Padding = 12,
  variant = "primary",
  Color,
  TextColor,
  borderRadius = 24,
  hasBorder = false,
  borderColor = "transparent",
  size = "default",
  className,
  style,
  "aria-label": ariaLabel,
}) => {
  const [IsHovered, SetIsHovered] = useState(false);
  const [IsPressed, SetIsPressed] = useState(false);
  const [CursorPos, SetCursorPos] = useState<{ X: number; Y: number } | null>(null);
  const [Width, SetWidth] = useState<number>(0);

  const ContainerRef = useRef<HTMLDivElement>(null);
  const TouchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { triggerTransition } = useNavTransition();

  // Standaard kleuren op basis van de variant
  const defaultBgColor = variant === "secondary" ? "#e2e8f0" : "#ffffff";
  const defaultTextColor = variant === "secondary" ? "#334155" : "#0f172a";

  // Bepaal de definitieve stijlen
  const resolvedBgColor = Color || defaultBgColor;
  const resolvedTextColor = TextColor || defaultTextColor;
  const resolvedBorderRadius = borderRadius;
  const resolvedHasBorder = hasBorder;
  const resolvedBorderColor = borderColor;

  const isIconOnly = size === "icon" || (!Label && !!Icon);
  const actualHeight = size === "sm" ? 32 : size === "lg" ? 48 : size === "icon" ? 48 : Height;
  const actualWidth = isIconOnly ? actualHeight : undefined;

  useEffect(() => {
    if (!ContainerRef.current) return;

    const Observer = new ResizeObserver((Entries) => {
      for (const Entry of Entries) {
        SetWidth(Entry.contentRect.width);
      }
    });

    Observer.observe(ContainerRef.current);
    return () => Observer.disconnect();
  }, []);

  const ContainerWidth = (actualWidth || Width) + Padding * 2;
  const ContainerHeight = actualHeight + Padding * 2;

  const HandleMouseMove = (E: React.MouseEvent<HTMLDivElement>) => {
    const Rect = E.currentTarget.getBoundingClientRect();
    SetCursorPos({
      X: E.clientX - Rect.left,
      Y: E.clientY - Rect.top,
    });
  };

  const HandleTouchStart = (E: React.TouchEvent<HTMLDivElement>) => {
    if (TouchTimeoutRef.current) clearTimeout(TouchTimeoutRef.current);
    const Rect = E.currentTarget.getBoundingClientRect();
    const Touch = E.touches[0];
    SetCursorPos({
      X: Touch.clientX - Rect.left,
      Y: Touch.clientY - Rect.top,
    });
    SetIsHovered(true);
    SetIsPressed(true);
  };

  const HandleTouchEnd = () => {
    SetIsPressed(false);
    TouchTimeoutRef.current = setTimeout(() => {
      SetIsHovered(false);
      SetCursorPos(null);
    }, 400);
  };

  const HandleClick = (E: React.MouseEvent<HTMLDivElement>) => {
    if (NavigateTo) {
      const labelText = typeof Label === "string" ? Label : ariaLabel || "";
      triggerTransition(NavigateTo, labelText);
    }

    if (OnClick) {
      OnClick(E);
    }
  };

  const resolvedAriaLabel = ariaLabel || (typeof Label === "string" ? Label : undefined);

  return (
    <motion.div
      ref={ContainerRef}
      role="button"
      tabIndex={0}
      aria-label={resolvedAriaLabel}
      layoutId={NavigateTo ? `shared-btn-${NavigateTo}` : undefined}
      className={cn(
        "flex items-center justify-center shrink-0 relative select-none cursor-pointer overflow-hidden w-full transition-all duration-150",
        className
      )}
      style={{
        width: actualWidth ? `${actualWidth}px` : "100%",
        height: `${actualHeight}px`,
        borderRadius: `${resolvedBorderRadius}px`,
        backgroundColor: resolvedBgColor,
        border: resolvedHasBorder ? `2px solid ${resolvedBorderColor}` : "none",
        ...style,
      }}
      onMouseEnter={(E) => {
        SetIsHovered(true);
        HandleMouseMove(E);
      }}
      onMouseMove={HandleMouseMove}
      onMouseLeave={() => {
        SetIsHovered(false);
        SetIsPressed(false);
        SetCursorPos(null);
      }}
      onMouseDown={() => SetIsPressed(true)}
      onMouseUp={() => SetIsPressed(false)}
      onTouchStart={HandleTouchStart}
      onTouchEnd={HandleTouchEnd}
      onTouchCancel={HandleTouchEnd}
      onClick={HandleClick}
    >
      <svg style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}>
        <defs>
          <filter id="standalone-btn-gooey" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: resolvedBgColor,
          borderRadius: `${resolvedBorderRadius}px`,
          opacity: IsHovered ? 0 : 1,
          transition: "opacity 0.3s ease",
          pointerEvents: "none",
        }}
      />

      {Width > 0 && (
        <div
          style={{
            position: "absolute",
            top: -Padding,
            left: -Padding,
            width: `${ContainerWidth}px`,
            height: `${ContainerHeight}px`,
            filter: "url('#standalone-btn-gooey')",
            pointerEvents: "none",
            borderRadius: `${resolvedBorderRadius}px`,
            overflow: "hidden",
          }}
        >
          {BeautifiedHover && (
            <Fluid
              isHovered={IsHovered}
              isPressed={IsPressed}
              width={isIconOnly ? actualHeight : Width}
              height={actualHeight}
              padding={Padding}
              color={resolvedBgColor}
              cursorPos={CursorPos}
              drawBody={true}
            />
          )}
        </div>
      )}

      {/* Tekst en Icon */}
      <motion.span
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          width: "100%",
          height: "100%",
          padding: isIconOnly ? "0" : "0 12px",
          color: resolvedTextColor,
          fontWeight: 700,
          fontSize: "14px",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          textAlign: "center",
          transform: IsPressed ? "scale(0.94)" : "scale(1)",
          transition: "transform 0.15s ease",
          pointerEvents: "none",
        }}
      >
        {Icon}
        {Label && <span>{Label}</span>}
      </motion.span>
    </motion.div>
  );
};

export default Button;