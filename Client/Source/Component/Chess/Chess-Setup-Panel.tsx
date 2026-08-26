import { useState } from "react";
import { Container } from "@/Component/UI/container";
import { Button } from "@/Component/UI/Button";
import { Slider } from "@/Component/UI/slider";
import { Switch } from "@/Component/UI/switch";
import { cn } from "@/Library/Utility";
import { Play, Crown, Shuffle, Sparkles } from "lucide-react";

export type Color_Choice = "white" | "black" | "random";

export interface Timer_Preset {
  id: string;
  label: string;
  Base_MS: number;
  Inc_MS: number;
}

export interface Game_Config {
  Elo: number;
  color: Color_Choice;
  timer: Timer_Preset;
  variant: "standard" | "960";
  Eval_Bar: boolean;
  Threat_Arrows: boolean;
  Suggestion_Arrows: boolean;
  Move_Feedback: boolean;
  engine: boolean;
}

export const Quick_Timers: Timer_Preset[] = [
  { id: "none", label: "No Timer", Base_MS: 0, Inc_MS: 0 },
  { id: "1m", label: "1 min", Base_MS: 60_000, Inc_MS: 0 },
  { id: "3|2", label: "3 | 2", Base_MS: 180_000, Inc_MS: 2_000 },
  { id: "5m", label: "5 min", Base_MS: 300_000, Inc_MS: 0 },
  { id: "10m", label: "10 min", Base_MS: 600_000, Inc_MS: 0 },
  { id: "15|10", label: "15 | 10", Base_MS: 900_000, Inc_MS: 10_000 },
];

interface Properties {
  onPlay: (cfg: Game_Config) => void;
  className?: string;
}

export function Chess_Setup_Panel({ onPlay, className }: Properties) {
  const [config, setConfig] = useState<Game_Config>({
    Elo: 1500,
    color: "white",
    timer: Quick_Timers[0],
    variant: "standard",
    Eval_Bar: false,
    Threat_Arrows: false,
    Suggestion_Arrows: false,
    Move_Feedback: false,
    engine: true,
  });

  const [Base_Minutes, setBaseMinutes] = useState<number>(
    Math.floor(config.timer.Base_MS / 60_000)
  );
  const [Inc_Seconds, setIncSeconds] = useState<number>(
    Math.floor(config.timer.Inc_MS / 1_000)
  );

  const update = <K extends keyof Game_Config>(key: K, value: Game_Config[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const Handle_Custom_Timer_Change = (mins: number, incs: number) => {
    setBaseMinutes(mins);
    setIncSeconds(incs);

    if (mins === 0 && incs === 0) {
      update("timer", Quick_Timers[0]);
      return;
    }

    const label = incs > 0 ? `${mins} | ${incs}` : `${mins} min`;
    update("timer", {
      id: "custom",
      label,
      Base_MS: mins * 60_000,
      Inc_MS: incs * 1_000,
    });
  };

  const Select_Preset = (preset: Timer_Preset) => {
    update("timer", preset);
    setBaseMinutes(Math.floor(preset.Base_MS / 60_000));
    setIncSeconds(Math.floor(preset.Inc_MS / 1_000));
  };

  return (
    <div className={cn("w-full max-w-4xl mx-auto space-y-4 select-none p-2", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Engine Rating */}
          <Container className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Container className="px-2 py-0.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Rating
              </Container>
              <Container className="font-mono font-bold px-2.5 py-0.5 text-xs">
                {config.Elo} ELO
              </Container>
            </div>
            <Slider
              min={100}
              max={3200}
              step={100}
              value={[config.Elo]}
              onValueChange={([val]) => update("Elo", val)}
            />
          </Container>

          {/* Play Side */}
          <Container className="p-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "white", label: "White", icon: <Crown className="w-4 h-4 fill-current" /> },
                { id: "random", label: "Random", icon: <Shuffle className="w-4 h-4" /> },
                { id: "black", label: "Black", icon: <Crown className="w-4 h-4 fill-background" /> },
              ].map((side) => (
                <button
                  key={side.id}
                  type="button"
                  onClick={() => update("color", side.id as Color_Choice)}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 px-3 rounded-full border text-xs font-semibold transition-all",
                    config.color === side.id
                      ? "border-primary bg-primary text-primary-foreground shadow-xs"
                      : "border-input bg-background hover:bg-accent"
                  )}
                >
                  {side.icon}
                  <span>{side.label}</span>
                </button>
              ))}
            </div>
          </Container>

          {/* Variant (No title) */}
          <Container className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => update("variant", "standard")}
                className={cn(
                  "py-2.5 px-3 rounded-full border text-center font-semibold text-xs transition-all",
                  config.variant === "standard"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-input bg-background hover:bg-accent"
                )}
              >
                Standard
              </button>

              <button
                type="button"
                onClick={() => update("variant", "960")}
                className={cn(
                  "py-2.5 px-3 rounded-full border text-center font-semibold text-xs flex items-center justify-center gap-1.5 transition-all",
                  config.variant === "960"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-input bg-background hover:bg-accent"
                )}
              >
                Chess 960 <Sparkles className="w-3 h-3 text-amber-500" />
              </button>
            </div>
          </Container>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Custom Sliders & Quick Timers */}
          <Container className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Minutes Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Container className="px-2 py-0.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Minutes
                  </Container>
                  <Container className="font-mono text-xs font-semibold px-2 py-0.5">
                    {Base_Minutes}m
                  </Container>
                </div>
                <Slider
                  min={0}
                  max={60}
                  step={1}
                  value={[Base_Minutes]}
                  onValueChange={([val]) => Handle_Custom_Timer_Change(val, Inc_Seconds)}
                />
              </div>

              {/* Increment Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Container className="px-2 py-0.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Increment
                  </Container>
                  <Container className="font-mono text-xs font-semibold px-2 py-0.5">
                    +{Inc_Seconds}s
                  </Container>
                </div>
                <Slider
                  min={0}
                  max={30}
                  step={1}
                  value={[Inc_Seconds]}
                  onValueChange={([val]) => Handle_Custom_Timer_Change(Base_Minutes, val)}
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
              {Quick_Timers.map((p) => {
                const isSelected = config.timer.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => Select_Preset(p)}
                    className={cn(
                      "py-2 px-3 rounded-full text-xs font-medium border text-center transition-all truncate",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary font-semibold"
                        : "bg-background border-input hover:bg-accent"
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </Container>

          {/* Assists & Aids */}
          <Container className="p-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {[
                { key: "Eval_Bar", label: "Eval Bar" },
                { key: "Threat_Arrows", label: "Threat Arrows" },
                { key: "Suggestion_Arrows", label: "Suggestions" },
                { key: "Move_Feedback", label: "Move Feedback" },
                { key: "engine", label: "Engine Assist" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  <Switch
                    checked={Boolean(config[key as keyof Game_Config])}
                    onCheckedChange={(val) => update(key as keyof Game_Config, val)}
                    className="scale-85 origin-right"
                  />
                </div>
              ))}
            </div>
          </Container>
        </div>
      </div>

      {/* CTA Button */}
      <Button
        className="w-full gap-2 font-semibold shadow-xs py-5 text-base rounded-full active:scale-[0.99] transition-transform mt-2"
        size="lg"
        onClick={() => onPlay(config)}
      >
        <Play className="h-5 w-5 fill-current" /> Play Match
      </Button>
    </div>
  );
}