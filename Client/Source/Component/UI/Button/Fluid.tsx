import React, { useEffect, useRef } from "react";
import { Fluid_Config } from "./Configuration";

export interface Fluid_Props {
  isHovered: boolean;
  isPressed: boolean;
  width: number;
  height: number;
  color: string;
  config: Fluid_Config;
}

interface Point {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
}

interface Droplet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

export const Fluid: React.FC<Fluid_Props> = ({
  isHovered,
  isPressed,
  width,
  height,
  color,
  config,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamische waarden uit de config met veilige fallbacks
  const {
    Padding = 30,
    DrawBody = true,
    Friction = 0.88,
    Attraction = 0.03,
    WaveAmplitude = 2.5,
    WaveFrequency = 0.05,
    DropletMinRadius = 4,
    DropletMaxRadius = 10,
  } = config;

  const totalWidth = width + Padding * 2;
  const totalHeight = height + Padding * 2;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // 1. Initialiseer punten rondom de knoprand
    const points: Point[] = [];
    const numPointsX = Math.max(10, Math.floor(width / 10));
    const numPointsY = Math.max(6, Math.floor(height / 10));

    // Bovenrand
    for (let i = 0; i <= numPointsX; i++) {
      const x = Padding + (i / numPointsX) * width;
      const y = Padding;
      points.push({ x, y, originX: x, originY: y, vx: 0, vy: 0 });
    }
    // Rechterrand
    for (let i = 1; i <= numPointsY; i++) {
      const x = Padding + width;
      const y = Padding + (i / numPointsY) * height;
      points.push({ x, y, originX: x, originY: y, vx: 0, vy: 0 });
    }
    // Onderrand
    for (let i = numPointsX - 1; i >= 0; i--) {
      const x = Padding + (i / numPointsX) * width;
      const y = Padding + height;
      points.push({ x, y, originX: x, originY: y, vx: 0, vy: 0 });
    }
    // Linkerrand
    for (let i = numPointsY - 1; i > 0; i--) {
      const x = Padding;
      const y = Padding + (i / numPointsY) * height;
      points.push({ x, y, originX: x, originY: y, vx: 0, vy: 0 });
    }

    // 2. Initialiseer spattende druppels bij interactie
    const droplets: Droplet[] = [];
    if (isHovered || isPressed) {
      const dropletCount = isPressed ? 12 : 6;
      for (let i = 0; i < dropletCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = isPressed ? 2 + Math.random() * 4 : 1 + Math.random() * 2;
        const radius =
          DropletMinRadius + Math.random() * (DropletMaxRadius - DropletMinRadius);

        droplets.push({
          x: totalWidth / 2,
          y: totalHeight / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius,
          alpha: 1,
        });
      }
    }

    // 3. Render & Physics Loop
    const render = () => {
      ctx.clearRect(0, 0, totalWidth, totalHeight);
      time += WaveFrequency;

      // Update & Teken vloeibaar hoofdlichaam
      if (DrawBody) {
        ctx.beginPath();

        points.forEach((p, idx) => {
          // Bereken organische golfverstoring
          const wave = Math.sin(time + idx * 0.5) * WaveAmplitude;
          const targetX = p.originX + (isHovered ? wave : 0);
          const targetY = p.originY + (isHovered ? wave : 0);

          // Physics: Veer-kracht (Attraction) + Wrijving (Friction)
          const ax = (targetX - p.x) * Attraction;
          const ay = (targetY - p.y) * Attraction;

          p.vx = (p.vx + ax) * Friction;
          p.vy = (p.vy + ay) * Friction;

          p.x += p.vx;
          p.y += p.vy;

          if (idx === 0) {
            ctx.moveTo(p.x, p.y);
          } else {
            ctx.lineTo(p.x, p.y);
          }
        });

        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      }

      // Update & Teken Druppels
      droplets.forEach((d) => {
        d.x += d.vx;
        d.y += d.vy;
        d.vx *= Friction;
        d.vy *= Friction;
        d.alpha -= 0.02;

        if (d.alpha > 0) {
          ctx.beginPath();
          ctx.arc(d.x, d.y, Math.max(0.1, d.radius * d.alpha), 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.globalAlpha = d.alpha;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    isHovered,
    isPressed,
    width,
    height,
    color,
    Padding,
    DrawBody,
    Friction,
    Attraction,
    WaveAmplitude,
    WaveFrequency,
    DropletMinRadius,
    DropletMaxRadius,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={totalWidth}
      height={totalHeight}
      style={{
        width: `${totalWidth}px`,
        height: `${totalHeight}px`,
      }}
    />
  );
};

export default Fluid;