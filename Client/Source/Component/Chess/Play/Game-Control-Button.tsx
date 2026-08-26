import React from "react";
import { Button } from "@/Component/UI/Button";
import {
  RotateCcw,
  Flag,
  Lightbulb,
  Sparkles,
  Eye,
  Play,
  Plus,
} from "lucide-react";

interface Game_Control_Buttons_Properties {
  Is_Game_Over: boolean;
  live: boolean;
  Has_Moves: boolean;
  Engine_Enabled: boolean;
  Analysing: { done: number; total: number } | null;
  Analysis_View: "play" | "analysis" | "review";
  Has_Analysis: boolean;
  On_Start_Analysis: () => void;
  On_Review: () => void;
  On_Show_Hint: () => void;
  On_Undo: () => void;
  On_Resign: () => void;
  On_Rematch: () => void;
  On_New_Game: () => void;
  compact?: boolean;
}

export const Game_Control_Buttons: React.FC<Game_Control_Buttons_Properties> = ({
  Is_Game_Over,
  live,
  Has_Moves,
  Engine_Enabled,
  Analysing,
  Analysis_View,
  Has_Analysis,
  On_Start_Analysis,
  On_Review,
  On_Show_Hint,
  On_Undo,
  On_Resign,
  On_Rematch,
  On_New_Game,
  compact = false,
}) => {
  // ── Compact Mobile Horizontal Mode ──────────────────────────────────────────
  if (compact) {
    return (
      <div className="flex items-center justify-between gap-1.5 w-full">
        {Is_Game_Over ? (
          <>
            <Button
              variant="default"
              size="sm"
              onClick={On_Rematch}
              className="flex-1 text-xs gap-1 py-1 h-8"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Rematch
            </Button>
            {Has_Moves && !Has_Analysis && (
              <Button
                variant="outline"
                size="sm"
                onClick={On_Start_Analysis}
                disabled={!!Analysing}
                className="flex-1 text-xs gap-1 py-1 h-8"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {Analysing ? `${Analysing.done}/${Analysing.total}` : "Analyze"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={On_New_Game}
              className="text-xs gap-1 py-1 h-8 px-2"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </Button>
          </>
        ) : (
          <>
            {Engine_Enabled && live && (
              <Button
                variant="outline"
                size="sm"
                onClick={On_Show_Hint}
                className="flex-1 text-xs gap-1 py-1 h-8"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                Hint
              </Button>
            )}
            {live && Has_Moves && (
              <Button
                variant="outline"
                size="sm"
                onClick={On_Undo}
                className="flex-1 text-xs gap-1 py-1 h-8"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Undo
              </Button>
            )}
            {live && (
              <Button
                variant="destructive"
                size="sm"
                onClick={On_Resign}
                className="flex-1 text-xs gap-1 py-1 h-8"
              >
                <Flag className="w-3.5 h-3.5" />
                Resign
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={On_New_Game}
              className="text-xs gap-1 py-1 h-8 px-2"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </>
        )}
      </div>
    );
  }

  // ── Standard Vertical Desktop Mode ─────────────────────────────────────────
  return (
    <div className="flex flex-col gap-2 w-full">
      {Is_Game_Over ? (
        <>
          <Button variant="default" onClick={On_Rematch} className="w-full gap-2">
            <RotateCcw className="w-4 h-4" />
            Rematch
          </Button>

          {Has_Moves && !Has_Analysis && (
            <Button
              variant="outline"
              onClick={On_Start_Analysis}
              disabled={!!Analysing}
              className="w-full gap-2"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              {Analysing
                ? `Analyzing (${Analysing.done}/${Analysing.total})...`
                : "Analyze Game"}
            </Button>
          )}

          {Has_Analysis && Analysis_View !== "review" && (
            <Button variant="outline" onClick={On_Review} className="w-full gap-2">
              <Eye className="w-4 h-4" />
              Review Game
            </Button>
          )}

          <Button variant="ghost" onClick={On_New_Game} className="w-full gap-2">
            <Plus className="w-4 h-4" />
            New Setup
          </Button>
        </>
      ) : (
        <>
          {Engine_Enabled && live && (
            <Button variant="outline" onClick={On_Show_Hint} className="w-full gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Get Hint
            </Button>
          )}

          {live && Has_Moves && (
            <Button variant="outline" onClick={On_Undo} className="w-full gap-2">
              <RotateCcw className="w-4 h-4" />
              Undo Move
            </Button>
          )}

          {live && (
            <Button variant="destructive" onClick={On_Resign} className="w-full gap-2">
              <Flag className="w-4 h-4" />
              Resign
            </Button>
          )}

          <Button variant="ghost" onClick={On_New_Game} className="w-full gap-2">
            <Plus className="w-4 h-4" />
            New Game
          </Button>
        </>
      )}
    </div>
  );
};