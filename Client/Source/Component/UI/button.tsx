import React, { useState, useRef, useEffect } from "react";
import Fluid from "./Fluid";
import { useNavTransition } from "@/Context/Navigation";

export interface FluidButtonProps {
  Label: string;
  OnClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
  NavigateTo?: string;
  BeautifiedHover?: boolean;
  Height?: number;
  Padding?: number;
  Color?: string;
  TextColor?: string;
}

export const Button: React.FC<FluidButtonProps> = ({
  Label,
  OnClick,
  NavigateTo,
  BeautifiedHover = true,
  Height = 64,
  Padding = 30,
  Color = "#ffffff",
  TextColor = "#0f172a",
}) => {
  const [IsHovered, SetIsHovered] = useState(false);
  const [IsPressed, SetIsPressed] = useState(false);
  const [CursorPos, SetCursorPos] = useState<{ X: number; Y: number } | null>(null);
  const [Width, SetWidth] = useState<number>(0);

  const ContainerRef = useRef<HTMLDivElement>(null);
  const TouchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { triggerTransition, phase } = useNavTransition();

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

  const ContainerWidth = Width + Padding * 2;
  const ContainerHeight = Height + Padding * 2;

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
      if (phase !== "idle") return;

      const domRect = E.currentTarget.getBoundingClientRect();
      triggerTransition(NavigateTo, {
        top: domRect.top,
        left: domRect.left,
        width: domRect.width,
        height: domRect.height,
      });
    }

    if (OnClick) {
      OnClick(E);
    }
  };

  return (
    <div
      ref={ContainerRef}
      style={{
        position: "relative",
        width: "100%",
        height: `${Height}px`,
        cursor: "pointer",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
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
      <svg
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          pointerEvents: "none",
        }}
      >
        <defs>
          <filter
            id="standalone-btn-gooey"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
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
          backgroundColor: Color,
          borderRadius: `${Height / 2}px`,
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
          }}
        >
          {BeautifiedHover && (
            <Fluid
              isHovered={IsHovered}
              isPressed={IsPressed}
              width={Width}
              height={Height}
              padding={Padding}
              color={Color}
              cursorPos={CursorPos}
              drawBody={true}
            />
          )}
        </div>
      )}

      <span
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          color: TextColor,
          fontWeight: 700,
          fontSize: "16px",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          textAlign: "center",
          transform: IsPressed ? "scale(0.94)" : "scale(1)",
          transition: "transform 0.15s ease",
          pointerEvents: "none",
        }}
      >
        {Label}
      </span>
    </div>
  );
};

export default Button;