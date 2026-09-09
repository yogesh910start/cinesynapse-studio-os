import React, { useState } from "react";
import { Sparkline } from "../common/Sparkline";
import { MovieProject } from "../../types";

interface Screen1Props {
  tenantData: any;
  activeProject?: string;
  activeTenant?: string;
  onAuditRipple: () => void;
}

export const Screen1Overview: React.FC<Screen1Props> = ({ tenantData, activeProject = "CHRONO-2026", onAuditRipple }) => {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState<string | null>(null);
  const [consensusResult, setConsensusResult] = useState<any>(null);
  const [activeKpiFilter, setActiveKpiFilter] = useState<string>("ALL");

  const project = tenantData?.projects?.[0] || { title: activeProject, total_frames: 0 };
  const likeness = tenantData?.likeness || [];
  const sentries = tenantData?.sentries || [];

  const primaryPerformer = likeness[0];
  const likenessCapDisplay = primaryPerformer 
    ? `${Math.min(100, Math.round((primaryPerformer.used_seconds / (primaryPerformer.authorized_seconds || 60)) * 100))}%`
    : "0.0%";
  const likenessSubDisplay = primaryPerformer
    ? `${primaryPerformer.actor_name}: ${(primaryPerformer.authorized_seconds - primaryPerformer.used_seconds).toFixed(1)}s left`
    : "0 Performers (Clean Slate)";

  const handleSimulateConsensus = () => {
    setSimulating(true);
    setConsensusResult(null);
    setSimulationStep("Querying ClickHouse Production Graph (sub-15ms)...");

    const perfName = primaryPerformer?.actor_name || "Talent / Clean Slate";
    setTimeout(() => {
      setSimulationStep(`Checking SAG-AFTRA Schedule A likeness caps (${perfName})...`);
    }, 600);

    setTimeout(() => {
      setSimulationStep("Verifying Spherex 190-Territory compliance & inpaint requirements...");
    }, 1200);

    setTimeout(() => {
      setSimulationStep("Allocating neural VFX cluster memory (H100 Node 04)...");
    }, 1800);

    setTimeout(() => {
      setSimulating(false);
      setSimulationStep(null);
      setConsensusResult({
        verdict: "APPROVED_WITH_AUTOMATED_REMEDIATION",
        latency: "12.8ms",
        shotgrid_ticket: "SG-TASK-8492",
        remediations: [
          "0.1% Audio Pull-Up filter applied for camera drift",
          "Automated inpaint task dispatched to ShotGrid for Singapore release",
          primaryPerformer ? `${primaryPerformer.actor_name} likeness cap validated` : "Likeness air-gap validated: 0 unauthorized synthetic doubles"
        ]
      });
      onAuditRipple();
    }, 2400);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <span>Autonomous Production Graph</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
              Live ClickHouse Columnar Graph
            </span>
            {activeProject && (
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                🎬 {activeProject}
              </span>
            )}

          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-agent closed loop: Click any graph node to inspect frame metadata and C2PA lineage.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400">Filter View:</span>
          {["ALL", "CRITICAL", "VFX", "LEGAL"].map((f) => (
            <button
              key={f}
              onClick={() => setActiveKpiFilter(f)}
              className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                activeKpiFilter === f ? "bg-purple-600 text-white font-bold" : "bg-[#151830] text-slate-400 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Sparkline Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div
          onClick={() => setSelectedNode({ title: "Production Ingest Telemetry", type: "DATASET", details: `Project ${project.title || activeProject} has ${project.total_frames !== undefined ? project.total_frames.toLocaleString() : 0} indexed frames across ${project.scenes_count || 0} scenes.` })}
          className="bg-[#121528] border border-[#262A4A] hover:border-cyan-500/50 p-3.5 rounded-xl shadow-lg cursor-pointer transition-all"
        >
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Total Frames Indexed</div>
          <div className="text-xl font-bold text-white mt-1">{project.total_frames !== undefined ? project.total_frames.toLocaleString() : "0"}</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">&check; ClickHouse SLA</div>
          <div className="mt-2"><Sparkline data={project.total_frames ? [10, 25, 40, 35, 60, 85, 110] : [0, 0, 0, 0, 0, 0, 0]} color="#06B6D4" /></div>
        </div>

        <div
          onClick={() => setSelectedNode({
            title: "SAG-AFTRA Likeness Governance",
            type: "LEGAL",
            details: primaryPerformer
              ? `${primaryPerformer.actor_name} has consumed ${primaryPerformer.used_seconds}s of ${primaryPerformer.authorized_seconds}s authorized cap.`
              : "Clean project slate. Zero likeness performers currently registered."
          })}
          className="bg-[#121528] border border-[#262A4A] hover:border-purple-500/50 p-3.5 rounded-xl shadow-lg cursor-pointer transition-all"
        >
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Likeness Cap</div>
          <div className="text-xl font-bold text-purple-300 mt-1">{likenessCapDisplay}</div>
          <div className="text-[10px] text-purple-400 mt-0.5">{likenessSubDisplay}</div>
          <div className="mt-2"><Sparkline data={primaryPerformer ? [20, 35, 45, 55, 68, 72, 76] : [0, 0, 0, 0, 0, 0, 0]} color="#8B5CF6" /></div>
        </div>

        <div
          onClick={() => setSelectedNode({ title: "Active Sentry Alerts", type: "SENTRY", details: `${sentries.length} active micro-sentries monitoring live feeds.` })}
          className="bg-[#121528] border border-[#262A4A] hover:border-amber-500/50 p-3.5 rounded-xl shadow-lg cursor-pointer transition-all"
        >
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Active Sentry Alerts</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{sentries.length} Sentries</div>
          <div className="text-[10px] text-amber-400 mt-0.5">{sentries.length > 0 ? "Drift • Meal • Prop Guard" : "All Feeds Nominal"}</div>
          <div className="mt-2"><Sparkline data={sentries.length > 0 ? [1, 0, 2, 1, 3, 2, 3] : [0, 0, 0, 0, 0, 0, 0]} color="#F59E0B" /></div>
        </div>

        <div
          onClick={() => setSelectedNode({ title: "Union Labor Liability", type: "FINANCIAL", details: "On-set automated meal penalty and turnaround guard active under IATSE Local 600 rules." })}
          className="bg-[#121528] border border-[#262A4A] hover:border-amber-500/50 p-3.5 rounded-xl shadow-lg cursor-pointer transition-all"
        >
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Labor Penalty Burn</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{project.title === "Chrono (2026)" ? "$2,450.00" : "$0.00"}</div>
          <div className="text-[10px] text-amber-400 mt-0.5">{project.title === "Chrono (2026)" ? "140 crew • Tier 2 breach" : "0 Union Infractions"}</div>
          <div className="mt-2"><Sparkline data={project.title === "Chrono (2026)" ? [0, 0, 500, 1050, 1750, 2450] : [0, 0, 0, 0, 0, 0, 0]} color="#F59E0B" /></div>
        </div>

        <div
          onClick={() => setSelectedNode({ title: "Autonomous Sentry ROI", type: "FINANCIAL", details: "Real-time on-set micro-sentries prevent costly post-production pickups and reshoots." })}
          className="bg-[#121528] border border-[#262A4A] hover:border-emerald-500/50 p-3.5 rounded-xl shadow-lg cursor-pointer transition-all"
        >
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Rework Saved</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{project.title === "Chrono (2026)" ? "$142,500" : "$0"}</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">{project.title === "Chrono (2026)" ? "4 reshoots averted" : "Guard active"}</div>
          <div className="mt-2"><Sparkline data={project.title === "Chrono (2026)" ? [10, 30, 45, 80, 95, 120, 142] : [0, 0, 0, 0, 0, 0, 0]} color="#10B981" /></div>
        </div>
      </div>

      {/* Main Production Graph (Clickable Interactive WebGL/SVG Simulation) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#121528] border border-[#262A4A] rounded-xl p-6 min-h-[480px] flex flex-col justify-between relative shadow-xl">
          <div className="flex items-center justify-between border-b border-[#262A4A] pb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Interactive Graph Topology (Click Any Node to Audit)</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span>Studio: <span className="text-white font-bold">{tenantData?.name || "Paramount Pictures"}</span></span>
              {activeProject && (
                <>
                  <span className="text-slate-600">•</span>
                  <span>Project: <span className="text-cyan-400 font-bold">{activeProject}</span></span>
                </>
              )}

            </div>
          </div>


          {/* Interactive Graph Canvas */}
          <div className="relative flex-1 flex items-center justify-center my-6">
            <svg className="w-full h-80 overflow-visible" viewBox="0 0 700 320">
              {/* Connectors */}
              <line x1="80" y1="160" x2="220" y2="90" stroke="#262A4A" strokeWidth="2" />
              <line x1="80" y1="160" x2="220" y2="230" stroke="#262A4A" strokeWidth="2" />
              <line x1="220" y1="90" x2="380" y2="90" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="4 2" />
              <line x1="220" y1="230" x2="380" y2="230" stroke="#06B6D4" strokeWidth="2" />
              <line x1="380" y1="90" x2="540" y2="160" stroke="#8B5CF6" strokeWidth="2" />
              <line x1="380" y1="230" x2="540" y2="160" stroke="#06B6D4" strokeWidth="2" />
              <line x1="540" y1="160" x2="640" y2="160" stroke="#10B981" strokeWidth="3" />

              {/* Node 1: Scene */}
              <g
                onClick={() => setSelectedNode({ title: `${project.active_scene || "Scene 01"} (${activeProject || "Active Project"})`, type: "SCENE", details: `Project: ${activeProject}. Active Scene: ${project.active_scene || "Scene 01"}. Real-time C2PA ingress pipeline.` })}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                transform="translate(80, 160)"
              >
                <circle r="34" fill="#151830" stroke="#262A4A" strokeWidth="2.5" />
                <text textAnchor="middle" dy="4" fill="#E2E8F0" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono">{project.active_scene || "Scene 01"}</text>
              </g>

              {/* Node 2: Take */}
              <g
                onClick={() => setSelectedNode({ title: `Camera A - Take ${project.active_take || 1}`, type: "CAMERA_RAW", details: `Project: ${activeProject}. Active Take: ${project.active_take || 1}. Real-time C2PA ingress verified.` })}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                transform="translate(220, 90)"
              >
                <circle r="38" fill="#1A1E38" stroke={project.title === "Chrono (2026)" ? "#F59E0B" : "#06B6D4"} strokeWidth="3" />
                <text textAnchor="middle" dy="-2" fill={project.title === "Chrono (2026)" ? "#F59E0B" : "#06B6D4"} fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono">Take {String(project.active_take || 1).padStart(2, "0")}</text>
                <text textAnchor="middle" dy="12" fill={project.title === "Chrono (2026)" ? "#FDE68A" : "#67E8F9"} fontSize="9">{project.title === "Chrono (2026)" ? "23.976 Drift" : "24.000 Ingest"}</text>
              </g>

              {/* Node 3: Audio Boom */}
              <g
                onClick={() => setSelectedNode({ title: "Audio Boom Master Track", type: "AUDIO", details: "Broadcast WAV 48kHz / 24-bit. Master clock at 24.000 fps. Automatic 0.1% pull-up filter applied." })}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                transform="translate(220, 230)"
              >
                <circle r="32" fill="#151830" stroke="#06B6D4" strokeWidth="2" />
                <text textAnchor="middle" dy="4" fill="#06B6D4" fontSize="10" fontFamily="JetBrains Mono">Boom 24fps</text>
              </g>

              {/* Node 4: SAG Likeness Double */}
              <g
                onClick={() => setSelectedNode({
                  title: primaryPerformer ? `Synthetic Replica - ${primaryPerformer.actor_name}` : "SAG Likeness Enclave",
                  type: "SAG_LIKENESS",
                  details: primaryPerformer
                    ? `Contract: ${primaryPerformer.contract_id || "SAG-SCH-A"}. Authorized: ${primaryPerformer.authorized_seconds}s. Consumed: ${primaryPerformer.used_seconds}s.`
                    : "Zero likeness performers registered in current project ledger. Clean slate."
                })}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                transform="translate(380, 90)"
              >
                <circle r="38" fill="#1E1B4B" stroke="#8B5CF6" strokeWidth="3" />
                <text textAnchor="middle" dy="-2" fill="#C4B5FD" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono">
                  {primaryPerformer ? primaryPerformer.actor_name.split(" ")[0] + " Twin" : "Likeness"}
                </text>
                <text textAnchor="middle" dy="12" fill="#A78BFA" fontSize="9">
                  {primaryPerformer ? `${primaryPerformer.used_seconds}s / ${primaryPerformer.authorized_seconds}s` : "0 Performers"}
                </text>
              </g>

              {/* Node 5: Color Pipeline */}
              <g
                onClick={() => setSelectedNode({ title: "ACES 1.3 Color Pipeline", type: "COLOR", details: "ACEScg (AP1 primaries) working space. ODT: Rec.709 100 nits. Zero highlight gamut clipping." })}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                transform="translate(380, 230)"
              >
                <circle r="32" fill="#151830" stroke="#06B6D4" strokeWidth="2" />
                <text textAnchor="middle" dy="4" fill="#38BDF8" fontSize="10" fontFamily="JetBrains Mono">ACEScg ODT</text>
              </g>

              {/* Node 6: Neural VFX Node */}
              <g
                onClick={() => setSelectedNode({ title: "Neural VFX Cluster - Node 04", type: "VFX", details: "Allocated H100 GPU cluster (Node 04). 14.2 GB VRAM reserved. Inpaint task SG-TASK-8492 queued." })}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                transform="translate(540, 160)"
              >
                <circle r="40" fill="#151830" stroke="#8B5CF6" strokeWidth="2.5" className="animate-pulse" />
                <text textAnchor="middle" dy="-4" fill="#E2E8F0" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono">VFX Plate</text>
                <text textAnchor="middle" dy="10" fill="#10B981" fontSize="9">GPU Node 04</text>
              </g>

              {/* Node 7: Worldwide Master */}
              <g
                onClick={() => setSelectedNode({ title: "Worldwide Theatrical Master", type: "DISTRIBUTION", details: "190-Territory clearance. 142 territories cleared immediately. Singapore & UAE require billboard inpaint." })}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                transform="translate(640, 160)"
              >
                <circle r="34" fill="#064E3B" stroke="#10B981" strokeWidth="2.5" />
                <text textAnchor="middle" dy="4" fill="#A7F3D0" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono">190 Cleared</text>
              </g>
            </svg>
          </div>

          <div className="flex items-center justify-between border-t border-[#262A4A] pt-3 text-[11px] font-mono text-slate-400">
            <div>ClickHouse Primary Key: <span className="text-cyan-400">({tenantData?.tenant_id || "paramount_pictures"}, {activeProject || "CHRONO-2026"}, scene_id)</span></div>
            <div>C2PA Cryptographic Status: <span className="text-emerald-400 font-bold">&check; SHA-256 Verified</span></div>
          </div>


        </div>

        {/* Right: 5-D Consensus Engine & Simulation Drawer */}
        <div className="bg-[#121528] border border-[#262A4A] rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#262A4A] pb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <span>⚡</span> 5-D Consensus Engine
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                READY
              </span>
            </div>

            {simulating && (
              <div className="mt-4 p-3 bg-purple-950/40 border border-purple-500/40 rounded-lg text-xs font-mono space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
                  <span>SIMULATING CLOSED-LOOP CONSENSUS:</span>
                </div>
                <div className="text-slate-300 text-[11px] animate-pulse">{simulationStep}</div>
              </div>
            )}

            {consensusResult && (
              <div className="mt-4 p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-xs font-mono space-y-2">
                <div className="text-emerald-400 font-bold text-sm">&check; {consensusResult.verdict}</div>
                <div className="text-slate-300 text-[11px]">Execution Latency: <span className="text-white font-bold">{consensusResult.latency}</span></div>
                <div className="text-slate-300 text-[11px]">ShotGrid Task: <span className="text-cyan-400 font-bold">{consensusResult.shotgrid_ticket}</span></div>
                <div className="space-y-1 pt-1 border-t border-emerald-500/20">
                  {consensusResult.remediations.map((r: string, idx: number) => (
                    <div key={idx} className="text-[10px] text-slate-300">&bull; {r}</div>
                  ))}
                </div>
              </div>
            )}

            {!simulating && !consensusResult && (
              <div className="space-y-3 mt-4 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#151830] border border-[#262A4A]">
                  <div className="text-[10px] text-slate-400 uppercase">1. SAG-AFTRA Legal Cap</div>
                  <div className="text-emerald-400 font-semibold mt-0.5">&check; 7.8s Headroom Remaining</div>
                  <div className="text-[10px] text-slate-500 mt-1">NO FAKES Act Schedule A agreement verified.</div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#151830] border border-[#262A4A]">
                  <div className="text-[10px] text-slate-400 uppercase">2. VFX GPU Infrastructure</div>
                  <div className="text-cyan-400 font-semibold mt-0.5">&check; Cluster Node 04 Allocated</div>
                  <div className="text-[10px] text-slate-500 mt-1">14.2 GB VRAM reserved on H100 mesh.</div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#151830] border border-[#262A4A]">
                  <div className="text-[10px] text-slate-400 uppercase">3. Spherex 190-Territory</div>
                  <div className="text-amber-400 font-semibold mt-0.5">&bull; Inpaint Required (Singapore)</div>
                  <div className="text-[10px] text-slate-500 mt-1">Alcohol billboard flagged for generative fill.</div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSimulateConsensus}
            disabled={simulating}
            className="mt-6 w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] hover:opacity-95 text-white text-xs font-mono font-bold shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50"
          >
            {simulating ? "Evaluating 5 Dimensions..." : "Simulate Closed-Loop Consensus (≤2.5s)"}
          </button>
        </div>
      </div>

      {/* Interactive Node Inspector Modal */}
      {selectedNode && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121528] border border-[#262A4A] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#262A4A] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🔍</span> {selectedNode.title}
              </h3>
              <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white text-base">✕</button>
            </div>
            <div className="space-y-2 text-slate-300">
              <div>Domain Type: <span className="text-purple-300 font-bold">{selectedNode.type}</span></div>
              <div className="p-3 bg-[#151830] rounded border border-[#262A4A] leading-relaxed text-[11px] text-slate-200">
                {selectedNode.details}
              </div>
              <div className="text-[10px] text-cyan-400">
                &check; ClickHouse Granularity Hash: <code>8192-NODE-CHRONO-2026</code>
              </div>
            </div>
            <div className="pt-3 border-t border-[#262A4A] flex justify-end">
              <button
                onClick={() => setSelectedNode(null)}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
