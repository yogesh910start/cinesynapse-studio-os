import React from "react";

interface TriggerProps {
  isVisible: boolean;
  onTrigger: (scenario: string) => void;
}

export const ScenarioTriggers: React.FC<TriggerProps> = ({ isVisible, onTrigger }) => {
  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-[#1E1B4B] via-[#121528] to-[#0E1122] border-b border-[#8B5CF6]/50 px-6 py-2.5 flex items-center justify-between text-xs font-mono shadow-xl sticky top-16 z-20">
      <div className="flex items-center gap-2 text-purple-300 font-bold">
        <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
        <span>HACKATHON DEMO TRIGGERS (ONE-CLICK STATE MUTATIONS):</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onTrigger("timecode_drift")}
          className="px-3 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold transition-colors"
        >
          1. Trigger 23.976 Drift (+7.2s)
        </button>

        <button
          onClick={() => onTrigger("meal_penalty")}
          className="px-3 py-1 rounded bg-crimson/20 hover:bg-crimson/30 text-red-300 border border-crimson/40 text-[11px] font-semibold transition-colors"
        >
          2. Breach Meal Penalty Tier 2 ($3.5k)
        </button>

        <button
          onClick={() => onTrigger("likeness_overage")}
          className="px-3 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[11px] font-semibold transition-colors"
        >
          3. Synthesize Past SAG Cap (Freeze)
        </button>

        <button
          onClick={() => onTrigger("spherex_inpaint")}
          className="px-3 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-semibold transition-colors"
        >
          4. Dispatch ShotGrid Inpaint
        </button>
      </div>
    </div>
  );
};
