import { useState } from "react";
import { Container } from "@/Component/UI/container";
import { Button } from "@/Component/UI/button";
import { Slider } from "@/Component/UI/Slider";
import { SegmentedControl } from "@/Component/UI/Segmented-Control";
import { LiquidToggle } from "@/Component/UI/Toggle-Switch";
import { cn } from "@/Library/Utility";
import { Crown, Shuffle } from "lucide-react";

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
  chat: boolean;
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
    chat: true,
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

  const Select_Preset = (presetId: string) => {
    const preset = Quick_Timers.find((p) => p.id === presetId);
    if (!preset) return;
    update("timer", preset);
    setBaseMinutes(Math.floor(preset.Base_MS / 60_000));
    setIncSeconds(Math.floor(preset.Inc_MS / 1_000));
  };

  return (
    <div
      className={cn(
        "w-full py-2 px-4 flex flex-col gap-1.5 relative z-[49] max-w-4xl mx-auto select-none bg-transparent overflow-visible",
        className
      )}
    >
      {/* Row 1: Rating (Left) & Minutes (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center overflow-visible">
        <Container className="p-1 bg-transparent border-0 shadow-none overflow-visible">
          <Slider
            title="Rating"
            min={100}
            max={3200}
            step={100}
            value={[config.Elo]}
            onValueChange={([val]) => update("Elo", val)}
          />
        </Container>

        <Container className="p-1 bg-transparent border-0 shadow-none overflow-visible">
          <Slider
            title="Minutes"
            min={0}
            max={60}
            step={1}
            value={[Base_Minutes]}
            onValueChange={([val]) => Handle_Custom_Timer_Change(val, Inc_Seconds)}
          />
        </Container>
      </div>

      {/* Row 2: Side / Color (Left) & Increment (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center overflow-visible">
        <Container className="p-0.5 bg-transparent border-0 shadow-none overflow-visible">
          <SegmentedControl
            value={config.color}
            onChange={(val) => update("color", val as Color_Choice)}
            options={[
              {
                id: "white",
                label: "White",
                icon: <Crown className="w-4 h-4 fill-black text-black shrink-0" />,
              },
              {
                id: "random",
                label: "Random",
                icon: <Shuffle className="w-4 h-4 text-black shrink-0" />,
              },
              {
                id: "black",
                label: "Black",
                icon: <Crown className="w-4 h-4 fill-black text-black shrink-0" />,
              },
            ]}
          />
        </Container>

        <Container className="p-1 bg-transparent border-0 shadow-none overflow-visible">
          <Slider
            title="Increment"
            min={0}
            max={30}
            step={1}
            value={[Inc_Seconds]}
            onValueChange={([val]) => Handle_Custom_Timer_Change(Base_Minutes, val)}
          />
        </Container>
      </div>

      {/* Row 3: Variant (Left) & Preset Timers (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center overflow-visible">
        <Container className="p-0.5 bg-transparent border-0 shadow-none overflow-visible">
          <SegmentedControl
            value={config.variant}
            onChange={(val) => update("variant", val as "standard" | "960")}
            options={[
              { id: "standard", label: "Standard" },
              { id: "960", label: "Chess 960" },
            ]}
          />
        </Container>

        <Container className="p-0.5 bg-transparent border-0 shadow-none overflow-visible">
          <SegmentedControl
            value={config.timer.id}
            onChange={Select_Preset}
            options={Quick_Timers.map((p) => ({ id: p.id, label: p.label }))}
            height={36}
          />
        </Container>
      </div>

      {/* Row 4: Threats & Suggestions (Left) & Eval Bar & Engine Assist (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center overflow-visible">
        <Container className="p-1 bg-transparent border-0 shadow-none overflow-visible">
          <div className="grid grid-cols-2 gap-x-4 overflow-visible">
            {[
              { key: "Threat_Arrows", label: "Threat Arrows" },
              { key: "Suggestion_Arrows", label: "Suggestions" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between overflow-visible">
                <span className="text-xs font-bold text-black">{label}</span>
                <LiquidToggle
                  checked={Boolean(config[key as keyof Game_Config])}
                  onChange={(val) => update(key as keyof Game_Config, val)}
                />
              </div>
            ))}
          </div>
        </Container>

        <Container className="p-1 bg-transparent border-0 shadow-none overflow-visible">
          <div className="grid grid-cols-2 gap-x-4 overflow-visible">
            {[
              { key: "Eval_Bar", label: "Eval Bar" },
              { key: "engine", label: "Engine Assist" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between overflow-visible">
                <span className="text-xs font-bold text-black">{label}</span>
                <LiquidToggle
                  checked={Boolean(config[key as keyof Game_Config])}
                  onChange={(val) => update(key as keyof Game_Config, val)}
                />
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Row 5: Play Match (Left) & Move Feedback & Chat (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center mt-1 overflow-visible">
        <Button
          Label="Play Match"
          Color="#000000"
          TextColor="#ffffff"
          Height={52}
          OnClick={() => onPlay(config)}
          className="w-full font-bold shadow-xs text-base rounded-full active:scale-[0.99] transition-transform border border-black"
        />

        <Container className="p-1 bg-transparent border-0 shadow-none overflow-visible">
          <div className="grid grid-cols-2 gap-x-4 overflow-visible">
            {[
              { key: "Move_Feedback", label: "Move Feedback" },
              { key: "chat", label: "Chat" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between overflow-visible">
                <span className="text-xs font-bold text-black">{label}</span>
                <LiquidToggle
                  checked={Boolean(config[key as keyof Game_Config])}
                  onChange={(val) => update(key as keyof Game_Config, val)}
                />
              </div>
            ))}
          </div>
        </Container>
      </div>
    </div>
  );
}