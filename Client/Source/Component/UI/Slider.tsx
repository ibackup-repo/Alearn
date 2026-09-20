import React, {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { cn } from "@/Library/Utility";

export interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  className?: string;
  disabled?: boolean;
  /**
   * Optional label. Starts merged with the handle as a third droplet above it.
   * On hover/drag it slides sideways to sit next to the value droplet (same
   * vertical level, not stacked higher) so adjacent sliders never overlap
   * vertically. Once the handle has moved far enough right to leave room, it
   * detaches entirely and docks as a static label at the start of the track.
   */
  title?: string;
}

let filterIdCounter = 0;
const EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const DETACH_GAP_PX = 14; // breathing room between the detached label and the handle

export function Slider({
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue = [0],
  onValueChange,
  className,
  disabled = false,
  title,
}: SliderProps) {
  const [filterId] = useState(() => `fluid-goo-${++filterIdCounter}`);
  const internalValue = value !== undefined ? value[0] : defaultValue[0];
  const [currentVal, setCurrentVal] = useState<number>(internalValue);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [stageWidth, setStageWidth] = useState(0);
  const [titleWidth, setTitleWidth] = useState(0);

  const stageRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const titleLabelRef = useRef<HTMLDivElement>(null);
  const fineHoverRef = useRef<boolean>(true);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      fineHoverRef.current = window.matchMedia(
        "(hover: hover) and (pointer: fine)"
      ).matches;
    }
  }, []);

  useEffect(() => {
    if (value !== undefined && value[0] !== currentVal) {
      setCurrentVal(value[0]);
    }
  }, [value]);

  // Track stage width so the detach threshold adapts to resizes/responsive layouts.
  useEffect(() => {
    if (!stageRef.current || typeof ResizeObserver === "undefined") return;
    const el = stageRef.current;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setStageWidth(entry.contentRect.width);
    });
    ro.observe(el);
    setStageWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  // Measure the detached label's natural size (it's always mounted, just
  // opacity-toggled) so both the detached label and the attached title
  // droplet can share one accurate width instead of guessing per character.
  useLayoutEffect(() => {
    if (titleLabelRef.current) {
      setTitleWidth(titleLabelRef.current.getBoundingClientRect().width);
    }
  }, [title]);

  const percentage = Math.max(
    0,
    Math.min(100, ((currentVal - min) / (max - min)) * 100)
  );

  const updateValueFromClientX = useCallback(
    (clientX: number) => {
      if (!stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      const rawPercentage = (clientX - rect.left) / rect.width;
      const clampedPercentage = Math.max(0, Math.min(1, rawPercentage));

      let rawVal = min + clampedPercentage * (max - min);
      if (step > 0) {
        rawVal = Math.round((rawVal - min) / step) * step + min;
      }
      const finalVal = Math.max(min, Math.min(max, rawVal));

      setCurrentVal(finalVal);
      if (onValueChange) onValueChange([finalVal]);
    },
    [min, max, step, onValueChange]
  );

  // Recompute hover from actual cursor position (don't trust mouseleave,
  // which is unreliable once setPointerCapture is active on the stage).
  const checkHover = useCallback((clientX: number, clientY: number) => {
    if (!fineHoverRef.current || !triggerRef.current) {
      setIsHovering(false);
      return;
    }
    const r = triggerRef.current.getBoundingClientRect();
    const inside =
      clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
    setIsHovering(inside);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    setIsDragging(true);
    setIsHovering(false); // drag styling takes over; avoid stale hover state
    e.currentTarget.setPointerCapture(e.pointerId);
    updateValueFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (isDragging) {
      updateValueFromClientX(e.clientX);
    } else {
      checkHover(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    // Cursor may still be sitting on the handle after release — check directly
    // instead of waiting for a native mouseenter that pointer capture may swallow.
    checkHover(e.clientX, e.clientY);
  };

  const handleStageLeave = () => setIsHovering(false);

  const showHoverState = isHovering && !isDragging;

  // --- Explicit transforms, mirroring the reference HTML's inline style writes ---
  const pillTransform = isDragging
    ? "translate(-50%, 0) scale(0.75)"
    : showHoverState
    ? "translate(-50%, 1px) scale(1.05)"
    : "translate(-50%, 0) scale(1)";

  const dropletTransform = isDragging
    ? "translate(-50%, -36px) scale(1)"
    : showHoverState
    ? "translate(-50%, -22px) scale(0.92)"
    : "translate(-50%, 0) scale(0.5)";
  const dropletOpacity = isDragging || showHoverState ? 1 : 0;

  // Handle + droplet/text bubble grow to fit the number of digits (e.g. "3200")
  // instead of staying fixed-size circles that only fit 1-2 digits.
  const digitCount = String(Math.round(currentVal)).length;
  const pillWidth = Math.max(28, 16 + digitCount * 8);
  const dropletWidth = Math.max(32, 18 + digitCount * 8);

  const textTransform = isDragging
    ? "translate(-50%, calc(-50% - 36px))"
    : showHoverState
    ? "translate(-50%, calc(-50% - 22px))"
    : "translate(-50%, -50%)";

  // --- Title droplet: merged above the handle at rest; on hover/drag it slides
  // sideways to sit next to the value droplet (same vertical level) instead of
  // stacking higher above it — so multiple sliders close together never grow
  // taller than a plain slider's hover/drag state would.
  const hasTitle = Boolean(title);
  const HOVER_GAP_PX = 0; // touching on hover
  const DRAG_GAP_PX = 2; // slightly separated once dragging
  const titleBubbleWidth = Math.max(32, titleWidth);
  const titleActive = showHoverState || isDragging;
  const titleGap = isDragging ? DRAG_GAP_PX : HOVER_GAP_PX;
  const titleShiftX = dropletWidth / 2 + titleGap + titleBubbleWidth / 2;
  const titleOffsetX = titleActive ? titleShiftX : 0;
  const titleOffsetY = isDragging ? -36 : -22; // matches the value droplet's own levels
  const titleScale = isDragging ? 1 : showHoverState ? 0.95 : 0.85;

  // Once the handle has moved far enough right that a detached label at the
  // start of the track wouldn't overlap it, detach the title from the handle.
  // The detached label spans from the very left edge (0) to its full measured
  // width (it's flush-left, not centered), so the full width counts here.
  const handlePixelPos = (percentage / 100) * stageWidth;
  const marginNeeded = titleWidth + DETACH_GAP_PX + pillWidth / 2;
  const isDetached =
    hasTitle && stageWidth > 0 && handlePixelPos > marginNeeded;

  const titleBubbleTransform = `translate(calc(-50% + ${titleOffsetX}px), ${titleOffsetY}px) scale(${titleScale})`;
  const titleTextTransform = `translate(calc(-50% + ${titleOffsetX}px), calc(-50% + ${titleOffsetY}px))`;

  return (
    <div
      className={cn(
        "relative w-full h-[60px] flex items-center cursor-pointer select-none touch-none",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
      ref={stageRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handleStageLeave}
    >
      <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 18 -8"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Hover Trigger Target */}
      <div
        ref={triggerRef}
        className="absolute top-[6px] h-[48px] w-[36px] -translate-x-1/2 z-20 cursor-grab active:cursor-grabbing"
        style={{ left: `${percentage}%` }}
      />

      {/* Track Background */}
      <div
        className="absolute top-[26px] left-0 right-0 h-[8px] bg-neutral-400/50 dark:bg-neutral-600/50 rounded-[4px]"
        style={{
          clipPath: `polygon(${percentage}% 0%, 100% 0%, 100% 100%, ${percentage}% 100%)`,
        }}
      />

      {/* Gooey Filtered Layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ filter: `url(#${filterId})` }}
      >
        <div
          className="absolute top-[24px] -left-[2px] h-[12px] bg-black rounded-[6px]"
          style={{ width: `calc(${percentage}% + 2px)` }}
        />

        <div
          className="absolute top-[16px] h-[28px] bg-black rounded-full"
          style={{
            left: `${percentage}%`,
            width: `${pillWidth}px`,
            borderRadius: "14px",
            transform: pillTransform,
            transition: `transform 250ms ${EASE}, width 150ms ease`,
          }}
        />

        <div
          className="absolute top-[13px] h-[32px] bg-black rounded-full"
          style={{
            left: `${percentage}%`,
            width: `${dropletWidth}px`,
            borderRadius: "16px",
            transform: dropletTransform,
            opacity: dropletOpacity,
            transition: `transform 300ms ${EASE}, opacity 200ms ease, width 150ms ease`,
          }}
        />

        {/* Title droplet: merged with the handle, hidden once detached */}
        {hasTitle && (
          <div
            className="absolute top-[13px] h-[30px] bg-black rounded-full"
            style={{
              left: `${percentage}%`,
              width: `${titleBubbleWidth}px`,
              borderRadius: "15px",
              transform: titleBubbleTransform,
              opacity: isDetached ? 0 : 1,
              transition: `transform 300ms ${EASE}, opacity 200ms ease, width 150ms ease`,
            }}
          />
        )}
      </div>

      {/* Sharp Overlay Text */}
      <div
        className="absolute top-[30px] text-[13px] font-bold text-white pointer-events-none tabular-nums z-10 flex items-center justify-center leading-none px-1"
        style={{
          left: `${percentage}%`,
          minWidth: `${dropletWidth}px`,
          transform: textTransform,
          transition: `transform 300ms ${EASE}`,
        }}
      >
        {currentVal}
      </div>

      {/* Title text riding with its droplet while attached */}
      {hasTitle && (
        <div
          className="absolute top-[28px] text-[12px] font-semibold text-white pointer-events-none z-10 flex items-center justify-center leading-none px-1 whitespace-nowrap"
          style={{
            left: `${percentage}%`,
            minWidth: `${titleBubbleWidth}px`,
            transform: titleTextTransform,
            opacity: isDetached ? 0 : 1,
            transition: `transform 300ms ${EASE}, opacity 200ms ease`,
          }}
        >
          {title}
        </div>
      )}

      {/* Detached title label: static, flush against the very start of the track
          (aligned to the same -2px edge the track/fill use) so it fully covers
          the corner with zero gap. */}
      {hasTitle && (
        <div
          ref={titleLabelRef}
          className="absolute top-1/2 -left-[2px] h-[30px] bg-black rounded-full text-[12px] font-semibold text-white flex items-center justify-center leading-none px-3 whitespace-nowrap z-10"
          style={{
            transform: "translate(0, -50%)",
            opacity: isDetached ? 1 : 0,
            pointerEvents: "none",
            transition: `opacity 200ms ease`,
          }}
        >
          {title}
        </div>
      )}
    </div>
  );
}