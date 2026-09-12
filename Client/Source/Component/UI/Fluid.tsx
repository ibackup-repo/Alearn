import React, { useEffect, useRef } from 'react';

export interface Fluid {
  isHovered: boolean;
  isPressed?: boolean;
  width?: number;
  height?: number;
  color?: string;
  padding?: number;
  drawBody?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

class Droplet {
  X: number;
  Y: number;
  Vx: number;
  Vy: number;
  Radius: number;
  Friction: number;
  Attraction: number;
  Center_X: number;
  Center_Y: number;
  Btn_Width: number;
  Color: string;

  constructor(
    X: number,
    Y: number,
    Vx: number,
    Vy: number,
    Radius: number,
    Center_X: number,
    Center_Y: number,
    Btn_Width: number,
    Color: string = '#ffffff'
  ) {
    this.X = X;
    this.Y = Y;
    this.Vx = Vx;
    this.Vy = Vy;
    this.Radius = Radius;
    this.Center_X = Center_X;
    this.Center_Y = Center_Y;
    this.Btn_Width = Btn_Width;
    this.Color = Color;
    this.Friction = 0.88;
    this.Attraction = 0.03 + Math.random() * 0.02;
  }

  Update() {
    const Dx = this.Center_X - this.X;
    const Dy = this.Center_Y - this.Y;
    this.Vx += Dx * this.Attraction * 0.1;
    this.Vy += Dy * this.Attraction * 0.1;
    this.Vx *= this.Friction;
    this.Vy *= this.Friction;
    this.X += this.Vx;
    this.Y += this.Vy;

    const Dist_To_Center = Math.hypot(Dx, Dy);
    if (Dist_To_Center < this.Btn_Width / 2) {
      this.Radius *= 0.92;
    }
  }

  Draw(Ctx: CanvasRenderingContext2D) {
    if (this.Radius < 0.5) return;
    Ctx.beginPath();
    Ctx.arc(this.X, this.Y, Math.max(0, this.Radius), 0, Math.PI * 2);
    Ctx.fillStyle = this.Color;
    Ctx.fill();
  }
}

export const Fluid: React.FC<Fluid> = ({
  isHovered,
  isPressed = false,
  width = 180,
  height = 56,
  color = '#ffffff',
  padding = 30,
  drawBody = true,
  className = '',
  style,
}) => {
  const Canvas_Ref = useRef<HTMLCanvasElement>(null);
  const Anim_Frame_Id = useRef<number | null>(null);
  const Droplets_Ref = useRef<Droplet[]>([]);

  const Canvas_Width = width + padding * 2;
  const Canvas_Height = height + padding * 2;
  const Center_X = Canvas_Width / 2;
  const Center_Y = Canvas_Height / 2;

  const Physics = useRef({
    Scale_X: 1,
    Scale_Y: 1,
    Target_Scale_X: 1,
    Target_Scale_Y: 1,
    Vel_X: 0,
    Vel_Y: 0,
    Time: 0,
  });

  const Spawn_Splash = (Count: number, Intensity: number) => {
    for (let I = 0; I < Count; I++) {
      const Angle = Math.random() * Math.PI * 2;
      const Speed = (Math.random() * 6 + 2) * Intensity;
      const Spawn_Offset_X = (Math.cos(Angle) * width) / 2.2;
      const Spawn_Offset_Y = (Math.sin(Angle) * height) / 2.2;
      const X = Center_X + Spawn_Offset_X;
      const Y = Center_Y + Spawn_Offset_Y;
      const Vx = Math.cos(Angle) * Speed;
      const Vy = Math.sin(Angle) * Speed;
      const Radius = Math.random() * 10 + 4;

      Droplets_Ref.current.push(
        new Droplet(X, Y, Vx, Vy, Radius, Center_X, Center_Y, width, color)
      );
    }
  };

  useEffect(() => {
    if (isHovered) {
      Spawn_Splash(Math.floor(Math.random() * 3) + 2, 0.8);
    } else {
      Droplets_Ref.current.forEach((D) => (D.Attraction = 0.08));
    }
  }, [isHovered]);

  useEffect(() => {
    if (isPressed) {
      Spawn_Splash(Math.floor(Math.random() * 4) + 4, 1.8);
    } else if (!isPressed && isHovered) {
      Physics.current.Vel_X = -0.15;
      Physics.current.Vel_Y = 0.15;
      Spawn_Splash(Math.floor(Math.random() * 2) + 1, 0.6);
    }
  }, [isPressed]);

  useEffect(() => {
    const Canvas = Canvas_Ref.current;
    if (!Canvas) return;
    const Ctx = Canvas.getContext('2d');
    if (!Ctx) return;

    const Dpr = window.devicePixelRatio || 1;
    Canvas.width = Canvas_Width * Dpr;
    Canvas.height = Canvas_Height * Dpr;
    Ctx.scale(Dpr, Dpr);

    const Render = () => {
      const P = Physics.current;
      P.Time += 0.03;
      Ctx.clearRect(0, 0, Canvas_Width, Canvas_Height);

      if (isPressed) {
        P.Target_Scale_X = 1.08;
        P.Target_Scale_Y = 0.88;
      } else if (isHovered) {
        P.Target_Scale_X = 1 + Math.sin(P.Time * 2) * 0.02;
        P.Target_Scale_Y = 1 + Math.cos(P.Time * 2) * 0.02;
      } else {
        P.Target_Scale_X = 1;
        P.Target_Scale_Y = 1;
      }

      const K = 0.15;
      const Damping = 0.75;
      const Ax = (P.Target_Scale_X - P.Scale_X) * K;
      const Ay = (P.Target_Scale_Y - P.Scale_Y) * K;
      P.Vel_X = (P.Vel_X + Ax) * Damping;
      P.Vel_Y = (P.Vel_Y + Ay) * Damping;
      P.Scale_X += P.Vel_X;
      P.Scale_Y += P.Vel_Y;

      if (drawBody) {
        Ctx.save();
        Ctx.translate(Center_X, Center_Y);
        Ctx.scale(P.Scale_X, P.Scale_Y);
        Ctx.fillStyle = color;

        const R = height / 2;
        const Straight_Segment = Math.max(0, width - height);
        const Wave_Amplitude = isHovered ? 2.5 : 0.4;
        const Wave_Freq = 0.05;

        Ctx.beginPath();
        const Num_Points = 64;
        for (let I = 0; I <= Num_Points; I++) {
          const T = I / Num_Points;
          const Angle = T * Math.PI * 2;

          let Px = Math.cos(Angle) * R;
          let Py = Math.sin(Angle) * R;

          if (Math.cos(Angle) > 0) Px += Straight_Segment / 2;
          else Px -= Straight_Segment / 2;

          const Noise =
            Math.sin(P.Time * 3 + I * Wave_Freq) *
            Math.cos(P.Time * 2 + I * 0.5) *
            Wave_Amplitude;
          const Nx = Px + Math.cos(Angle) * Noise;
          const Ny = Py + Math.sin(Angle) * Noise;

          if (I === 0) Ctx.moveTo(Nx, Ny);
          else Ctx.lineTo(Nx, Ny);
        }

        Ctx.closePath();
        Ctx.fill();
        Ctx.restore();
      }

      for (let I = Droplets_Ref.current.length - 1; I >= 0; I--) {
        const D = Droplets_Ref.current[I];
        D.Update();
        D.Draw(Ctx);
        if (D.Radius < 0.5) Droplets_Ref.current.splice(I, 1);
      }

      const Is_Settled =
        Math.abs(P.Scale_X - 1) < 0.001 &&
        Math.abs(P.Scale_Y - 1) < 0.001 &&
        Math.abs(P.Vel_X) < 0.001 &&
        Math.abs(P.Vel_Y) < 0.001 &&
        Droplets_Ref.current.length === 0;

      if (!isHovered && Is_Settled) {
        Ctx.clearRect(0, 0, Canvas_Width, Canvas_Height);
        Anim_Frame_Id.current = null;
      } else {
        Anim_Frame_Id.current = requestAnimationFrame(Render);
      }
    };

    if (!Anim_Frame_Id.current) {
      Anim_Frame_Id.current = requestAnimationFrame(Render);
    }

    return () => {
      if (Anim_Frame_Id.current) {
        cancelAnimationFrame(Anim_Frame_Id.current);
        Anim_Frame_Id.current = null;
      }
    };
  }, [
    isHovered,
    isPressed,
    Canvas_Width,
    Canvas_Height,
    color,
    drawBody,
    width,
    height,
  ]);

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${Canvas_Width}px`,
        height: `${Canvas_Height}px`,
        pointerEvents: 'none',
        zIndex: 1,
        ...style,
      }}
    >
      <canvas
        ref={Canvas_Ref}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};

export default Fluid;