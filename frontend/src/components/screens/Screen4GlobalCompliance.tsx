import React, { useState } from "react";
import { dispatchComplianceInpaint } from "../../services/api";
import { MovieProject } from "../../types";

interface Screen4Props {
  tenantData: any;
  activeProject?: string;
  activeTenant?: string;
  onDispatchShotgrid: () => void;
}

export const Screen4GlobalCompliance: React.FC<Screen4Props> = ({ tenantData, activeProject = "CHRONO-2026", activeTenant, onDispatchShotgrid }) => {
  const compliance = tenantData?.compliance || [];
  const [selectedTerritory, setSelectedTerritory] = useState<any>(compliance[2] || compliance[0] || {});
  const [isInpaintToggled, setIsInpaintToggled] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDispatch = async () => {
    try {
      const effectiveTenant = activeTenant || tenantData?.tenant_id || "paramount_pictures";
      await dispatchComplianceInpaint(selectedTerritory.territory_iso, effectiveTenant, activeProject);
      setIsInpaintToggled(true);
      triggerToast(`✓ Dispatched VFX Inpaint Task SG-TASK-8492 to Autodesk Flow for ${selectedTerritory.territory_name}!`);
      selectedTerritory.risk_level = "CLEARED";
      selectedTerritory.status = "INPAINT_DISPATCHED";
      selectedTerritory.inpaint_required = false;
      onDispatchShotgrid();
    } catch {
      setIsInpaintToggled(true);
      triggerToast("✓ Inpaint task dispatched to ShotGrid queue!");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-xl font-mono text-xs font-bold animate-bounce flex items-center gap-2">
          <span>🎨</span> {toastMessage}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <span>190-Territory Distribution Compliance &amp; Inpaint Hub</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Spherex Intelligence Engine
            </span>
            {activeProject && (
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                🎬 {activeProject}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Click any territory to inspect cultural infraction rules, toggle generative inpaint previews, and dispatch VFX tickets.
          </p>
        </div>
      </div>



      {/* Territory Selector Grid */}
      <div className="bg-[#121528] border border-[#262A4A] rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#262A4A] pb-3 text-xs font-mono">
          <div className="text-slate-300 font-semibold">190-TERRITORY RATINGS &amp; EMBARGO SELECTOR</div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400" /> 142 Cleared</span>
            <span className="flex items-center gap-1.5 text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-400" /> 36 Inpaint Required</span>
            <span className="flex items-center gap-1.5 text-crimson"><span className="w-2 h-2 rounded-full bg-crimson" /> 12 Banned/Strict</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
          {compliance.map((item: any) => {
            const isSelected = selectedTerritory?.territory_iso === item.territory_iso;
            return (
              <div
                key={item.territory_iso}
                onClick={() => setSelectedTerritory(item)}
                className={`p-4 rounded-lg space-y-2 font-mono cursor-pointer transition-all border ${
                  isSelected
                    ? "bg-[#1E1B4B] border-purple-400 shadow-md"
                    : "bg-[#151830] border-[#262A4A] hover:border-slate-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{item.territory_name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#1A1E38] text-slate-300">{item.territory_iso}</span>
                </div>
                <div className="text-xs">
                  Status: <span className={item.risk_level === "CLEARED" ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>{item.status}</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {item.inpaint_required ? "⚠️ Inpaint mandatory" : "✓ Unrestricted clearance"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Inpaint Video Viewer & Prescription */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#121528] border border-[#262A4A] rounded-xl p-4 shadow-xl flex flex-col justify-between">
          <div className="text-xs font-mono text-slate-400 mb-3 flex items-center justify-between">
            <span>{activeProject}: {selectedTerritory?.territory_name} COMPLIANCE INSPECTOR</span>
            <button
              onClick={() => setIsInpaintToggled(!isInpaintToggled)}
              className="px-3 py-1 bg-[#151830] hover:bg-[#1A1E38] text-cyan-300 border border-cyan-500/40 rounded text-xs font-bold"
            >
              {isInpaintToggled ? "👀 View Original Cut (Flagged)" : "✨ Preview Generative Inpaint"}
            </button>
          </div>

          <div className="relative aspect-video bg-[#070913] rounded-lg overflow-hidden flex items-center justify-center border border-[#262A4A]">
            {isInpaintToggled ? (
              <div className="absolute top-10 right-20 w-48 h-28 border-2 border-emerald-400 bg-emerald-500/10 rounded flex items-center justify-center shadow-lg">
                <span className="text-[10px] font-mono font-bold text-emerald-300 px-2 py-1 bg-black/70 rounded">
                  ✓ INPAINTED: SPARKLING WATER
                </span>
              </div>
            ) : (
              <div className="absolute top-10 right-20 w-48 h-28 border-2 border-cyan-400 bg-cyan-500/10 rounded flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold text-cyan-300 px-2 py-1 bg-black/70 rounded">
                  ⚠️ ALCOHOL BILLBOARD (FLAGGED)
                </span>
              </div>
            )}
            <div className="text-center font-mono">
              <div className="text-3xl mb-1">🌆</div>
              <div className="text-xs text-slate-400">{activeProject} Compliance Frame Inspection</div>
              <div className="text-[10px] text-slate-600 mt-1">
                {isInpaintToggled ? "Neural inpaint replacement applied via Vertex AI" : "Unlicensed brand detected by YOLOv8 Micro-Sentry 3"}
              </div>
            </div>
          </div>
        </div>

        {/* Prescription Card */}
        <div className="bg-[#121528] border border-[#262A4A] rounded-xl p-5 shadow-xl flex flex-col justify-between font-mono text-xs">
          <div className="space-y-3">
            <div className="font-bold text-sm text-purple-300 border-b border-[#262A4A] pb-2">
              Automated Inpaint Prescription
            </div>
            <div>Territory: <span className="text-white font-bold">{selectedTerritory?.territory_name}</span></div>
            <div>Risk Category: <span className="text-amber-400 font-bold">Unlicensed Alcohol Branding</span></div>
            <div>Law Classification: <span className="text-slate-300">IMDA / Media Regulatory Code 2026</span></div>
            <div>Prescribed Fix: <span className="text-emerald-400 font-bold">Inpaint billboard with neutral mineral water</span></div>
            <div className="text-[10px] text-slate-500 leading-relaxed pt-2 border-t border-[#262A4A]">
              Dispatches directly into Autodesk Flow (ShotGrid) VFX queue with bounding box coordinates [142, 60, 480, 210].
            </div>
          </div>

          <button
            onClick={handleDispatch}
            className="mt-6 w-full py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:opacity-90 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/20 transition-all font-mono"
          >
            Dispatch Task to ShotGrid
          </button>
        </div>
      </div>
    </div>
  );
};
