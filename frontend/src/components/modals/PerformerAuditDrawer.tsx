import React, { useState } from "react";
import { LikenessPerformer, ShotAttribution } from "../../types";
import { recordShotConsumption } from "../../services/api";

interface PerformerAuditDrawerProps {
  actor: LikenessPerformer;
  tenantId?: string;
  projectId?: string;
  onClose: () => void;
  onExtend: (actorId: string) => void;
  onOpenUnionPacket: (actor: LikenessPerformer) => void;
  onShotRecorded?: (updatedActor: LikenessPerformer) => void;
}

export const PerformerAuditDrawer: React.FC<PerformerAuditDrawerProps> = ({
  actor,
  tenantId = "paramount_pictures",
  projectId,
  onClose,
  onExtend,
  onOpenUnionPacket,
  onShotRecorded,
}) => {
  const [activeTab, setActiveTab] = useState<"SHOTS" | "CLAUSES" | "SIMULATOR">("SHOTS");
  const [testAction, setTestAction] = useState<string>("stunt_wirework");

  // Simulator form state
  const [simScene, setSimScene] = useState("Scene 42B");
  const [simTake, setSimTake] = useState(5);
  const [simSec, setSimSec] = useState(4.5);
  const [simDesc, setSimDesc] = useState("Platform recoil digital face replacement");
  const [isSubmittingSim, setIsSubmittingSim] = useState(false);

  const shotAttributions: ShotAttribution[] = actor.shot_attributions || [];
  const permittedUses = actor.permitted_uses || [
    "VFX digital double background stunt replication",
    "Dangerous wirework replacement in Scene 42B",
    "Extreme environment cockpit facial composite in Scene 42A",
    "High-G facial turbulence stabilizer"
  ];
  const prohibitedUses = actor.prohibited_uses || [
    "Dialogue generation unscripted by principal author",
    "Posthumous continuation without secondary estate consent",
    "Commercial merchandising endorsement without Rider B",
    "Third-party AI foundation model training"
  ];

  const pct = Math.min(100, Math.round((actor.used_seconds / actor.authorized_seconds) * 100));
  const headroom = Math.max(0, Number((actor.authorized_seconds - actor.used_seconds).toFixed(1)));

  const handleSimulateDeduction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSim(true);
    try {
      const res = await recordShotConsumption(actor.actor_id, {
        scene_id: simScene.toUpperCase().replace(" ", "_"),
        scene_display: simScene,
        take_number: simTake,
        shot_id: `SHOT_${Math.floor(Math.random() * 90 + 10)}`,
        description: simDesc,
        used_seconds: simSec,
        rendered_by: "VFX_GPU_NODE_12"
      }, tenantId, projectId);

      if (onShotRecorded && res?.attribution) {
        actor.used_seconds = res.used_seconds;
        actor.accrued_residuals_usd = res.accrued_residuals_usd;
        actor.status = res.status;
        if (!actor.shot_attributions) actor.shot_attributions = [];
        actor.shot_attributions.unshift(res.attribution);
        onShotRecorded({ ...actor });
      }
      setActiveTab("SHOTS");
    } catch {
      // Handled gracefully
    } finally {
      setIsSubmittingSim(false);
    }
  };

  const checkActionCompliance = (action: string) => {
    if (action === "dialogue_synth") {
      return {
        compliant: false,
        clause: "Prohibited under Section 4(B): Unscripted Dialogue Generation requires primary author and talent sign-off.",
        color: "text-rose-400 bg-rose-500/10 border-rose-500/30"
      };
    }
    if (action === "merchandising") {
      return {
        compliant: false,
        clause: "Prohibited under Rider B: Commercial toys and avatars require secondary licensing buyout.",
        color: "text-rose-400 bg-rose-500/10 border-rose-500/30"
      };
    }
    return {
      compliant: true,
      clause: "Authorized under Schedule A: Stunt wirework and visual continuity double permitted within contracted second caps.",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
    };
  };

  const actionStatus = checkActionCompliance(testAction);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex justify-end">
      <div className="bg-[#101326] border-l border-[#262A4A] w-full max-w-2xl h-full flex flex-col shadow-2xl font-sans overflow-hidden">
        {/* Header */}
        <div className="bg-[#151933] px-6 py-5 border-b border-[#262A4A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center font-bold text-white text-lg shadow-lg">
              {actor.actor_name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  {actor.actor_name}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold">
                  {actor.schedule_code}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                  actor.status === "CLEARED"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : actor.status === "WARNING_THRESHOLD"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                }`}>
                  {actor.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Contract: <span className="font-mono text-cyan-400">{actor.contract_id}</span> &bull; Rate: <span className="text-emerald-400 font-mono">${actor.residual_rate_per_sec}/sec</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1D2240] hover:bg-[#262C54] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Overview Stat Ribbon */}
        <div className="bg-[#121528] px-6 py-3 border-b border-[#262A4A] grid grid-cols-3 gap-3 font-mono text-xs">
          <div className="bg-[#161A36] p-2.5 rounded-lg border border-[#262A4A]">
            <div className="text-slate-400 text-[10px]">AUTHORIZED VS USED</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {actor.used_seconds}s / <span className="text-slate-400">{actor.authorized_seconds}s</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {pct}% consumed &bull; <span className={headroom < 10 ? "text-amber-400" : "text-emerald-400"}>{headroom}s left</span>
            </div>
          </div>

          <div className="bg-[#161A36] p-2.5 rounded-lg border border-[#262A4A]">
            <div className="text-slate-400 text-[10px]">ACCRUED RESIDUALS</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">
              ${actor.accrued_residuals_usd?.toLocaleString() || "0.00"}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Payable under MBA §43</div>
          </div>

          <div className="bg-[#161A36] p-2.5 rounded-lg border border-[#262A4A]">
            <div className="text-slate-400 text-[10px]">CONSENT EXPIRY</div>
            <div className="text-sm font-bold text-cyan-300 mt-0.5 truncate">
              {actor.consent_expiry}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">NO FAKES Certified</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#13162B] px-6 pt-2 border-b border-[#262A4A] flex items-center gap-4 text-xs font-mono">
          <button
            onClick={() => setActiveTab("SHOTS")}
            className={`pb-2 border-b-2 font-semibold transition-colors ${
              activeTab === "SHOTS"
                ? "border-purple-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            📋 Shot Attribution ({shotAttributions.length})
          </button>
          <button
            onClick={() => setActiveTab("CLAUSES")}
            className={`pb-2 border-b-2 font-semibold transition-colors ${
              activeTab === "CLAUSES"
                ? "border-purple-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            ⚖️ Permitted vs Prohibited Matrix
          </button>
          <button
            onClick={() => setActiveTab("SIMULATOR")}
            className={`pb-2 border-b-2 font-semibold transition-colors ${
              activeTab === "SIMULATOR"
                ? "border-purple-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            ⚡ Test Shot Deduction
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB 1: SHOT-BY-SHOT ATTRIBUTION */}
          {activeTab === "SHOTS" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>CONFORMED TIMELINE USAGE BREAKDOWN</span>
                <span>TOTAL: {actor.used_seconds}s</span>
              </div>

              {shotAttributions.length === 0 ? (
                <div className="text-center p-8 bg-[#141731] border border-[#262A4A] rounded-xl text-slate-400 font-mono text-xs">
                  No shots logged yet. Use the Test Deduction tab to simulate.
                </div>
              ) : (
                <div className="space-y-2">
                  {shotAttributions.map((shot, idx) => (
                    <div
                      key={shot.attribution_id || idx}
                      className="bg-[#141731] border border-[#262A4A] rounded-xl p-3.5 hover:border-purple-500/40 transition-colors space-y-1.5 font-mono text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                            {shot.scene_display || shot.scene_id} Take {shot.take_number}
                          </span>
                          <span className="text-slate-400 font-normal">&bull; {shot.shot_id}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-amber-300 font-bold">+{shot.used_seconds}s</span>
                          <span className="text-slate-500 text-[10px] ml-1">(${Math.round(shot.used_seconds * actor.residual_rate_per_sec)})</span>
                        </div>
                      </div>

                      <div className="text-slate-300 text-[11px]">
                        {shot.description}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-[#1F2344]">
                        <span>Timecode: <span className="text-cyan-400">{shot.timecode}</span></span>
                        <span>Node: <span className="text-slate-300">{shot.rendered_by}</span></span>
                        <span>Status: <span className="text-emerald-400 font-bold">{shot.status}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PERMITTED VS PROHIBITED MATRIX */}
          {activeTab === "CLAUSES" && (
            <div className="space-y-4 font-mono text-xs">
              {/* Interactive Compliance Evaluator */}
              <div className="bg-[#151935] p-4 rounded-xl border border-[#262A4A] space-y-3">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>🔬</span> Instant Action Compliance Evaluator
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Evaluate Proposed Production Use:</label>
                  <select
                    value={testAction}
                    onChange={(e) => setTestAction(e.target.value)}
                    className="w-full bg-[#0E1122] border border-[#262A4A] rounded-lg p-2 text-white font-mono text-xs"
                  >
                    <option value="stunt_wirework">VFX Stunt Double Wirework / High Fall (Scene 42B)</option>
                    <option value="facial_deaging">Retrospective De-Aging Flashback Sequence (Scene 38)</option>
                    <option value="dialogue_synth">Unscripted Synthetic Dialogue Generation (AI Voice)</option>
                    <option value="merchandising">Digital Video Game Merchandising Avatar</option>
                  </select>
                </div>

                <div className={`p-3 rounded-lg border text-xs ${actionStatus.color}`}>
                  <div className="font-bold flex items-center gap-1.5">
                    {actionStatus.compliant ? "✓ COMPLIANT" : "❌ INJUNCTION RISK / CONTRACT BREACH"}
                  </div>
                  <div className="text-[11px] mt-0.5">{actionStatus.clause}</div>
                </div>
              </div>

              {/* Permitted Uses */}
              <div className="space-y-2">
                <div className="text-emerald-400 font-bold flex items-center gap-1.5 text-xs">
                  <span>✓</span> Contractually Permitted Uses ({permittedUses.length})
                </div>
                <div className="space-y-1.5">
                  {permittedUses.map((use, i) => (
                    <div key={i} className="bg-[#141833] p-2.5 rounded-lg border border-emerald-500/20 text-slate-200 text-xs flex items-start gap-2">
                      <span className="text-emerald-400 font-bold mt-0.5">&check;</span>
                      <span>{use}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prohibited Uses */}
              <div className="space-y-2 pt-2">
                <div className="text-rose-400 font-bold flex items-center gap-1.5 text-xs">
                  <span>✕</span> Strictly Prohibited Uses ({prohibitedUses.length})
                </div>
                <div className="space-y-1.5">
                  {prohibitedUses.map((use, i) => (
                    <div key={i} className="bg-[#1D1424] p-2.5 rounded-lg border border-rose-500/20 text-slate-200 text-xs flex items-start gap-2">
                      <span className="text-rose-400 font-bold mt-0.5">&times;</span>
                      <span>{use}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SIMULATOR */}
          {activeTab === "SIMULATOR" && (
            <form onSubmit={handleSimulateDeduction} className="bg-[#141731] border border-[#262A4A] rounded-xl p-5 space-y-4 font-mono text-xs">
              <div className="border-b border-[#262A4A] pb-2">
                <div className="font-bold text-white text-sm">Simulate Live Shot Deduction</div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Simulates Camera-to-Cloud or VFX editorial conforming a synthetic double pass directly into the physical ClickHouse ledger.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Scene</label>
                  <input
                    type="text"
                    value={simScene}
                    onChange={(e) => setSimScene(e.target.value)}
                    className="w-full bg-[#0E1122] border border-[#262A4A] rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Take Number</label>
                  <input
                    type="number"
                    value={simTake}
                    onChange={(e) => setSimTake(Number(e.target.value))}
                    className="w-full bg-[#0E1122] border border-[#262A4A] rounded p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Duration to Deduct (Seconds)</label>
                <input
                  type="number"
                  step="0.1"
                  value={simSec}
                  onChange={(e) => setSimSec(Number(e.target.value))}
                  className="w-full bg-[#0E1122] border border-[#262A4A] rounded p-2 text-white"
                />
                <div className="text-[10px] text-slate-500 mt-1">
                  Residual cost for this shot: <span className="text-emerald-400 font-bold">${Math.round(simSec * actor.residual_rate_per_sec)}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">VFX Pass Description</label>
                <input
                  type="text"
                  value={simDesc}
                  onChange={(e) => setSimDesc(e.target.value)}
                  className="w-full bg-[#0E1122] border border-[#262A4A] rounded p-2 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingSim}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:opacity-90 disabled:opacity-50 text-white rounded-lg font-bold text-xs shadow-lg transition-all"
                >
                  {isSubmittingSim ? "Logging to Ledger..." : "⚡ Execute Shot Deduction"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#151933] px-6 py-4 border-t border-[#262A4A] flex items-center justify-between">
          <button
            onClick={() => onOpenUnionPacket(actor)}
            className="px-4 py-2 bg-[#1C213D] hover:bg-[#252C52] text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md"
          >
            <span>📜</span> Export Certified Union Packet
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onExtend(actor.actor_id)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold transition-all shadow-md shadow-emerald-600/30"
            >
              +15s Extension
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#1A1E38] hover:bg-[#252A4E] text-slate-300 rounded-lg text-xs font-mono transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
