import React from "react";

interface StatusBarProps {
  activeTenant: string;
  activeProject?: string;
  storageUsage?: string;
  storageQuota?: string;
  onOpenStorage?: () => void;
  onOpenLogs?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  activeTenant,
  activeProject = "",
  storageUsage = "0.0 PB",
  storageQuota = "25.0 PB",
  onOpenStorage,
  onOpenLogs,
}) => {
  const tenantDisplay = activeTenant.replace(/_/g, " ").toUpperCase();

  return (
    <footer className="h-7 bg-[#070913] border-t border-[#1C2038] px-4 flex items-center justify-between font-mono text-[10px] text-slate-400 select-none shrink-0 z-30">
      {/* Left: Real-Time Engine SLAs & Trust Badges */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5" title="ClickHouse sub-15ms Analytical SLA">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-semibold">ClickHouse: 11.4ms</span>
        </div>

        <span className="text-slate-700">|</span>

        <div className="flex items-center gap-1.5" title="Google DeepMind Gemini 1.5 Pro Multi-Agent Fabric">
          <span className="text-purple-400 font-semibold">🧠 Gemini 1.5 Pro</span>
        </div>

        <span className="text-slate-700">|</span>

        <div className="flex items-center gap-1.5" title="C2PA Hardware Secure Enclave Root of Trust">
          <span className="text-cyan-400 font-semibold">🛡️ C2PA: Verified</span>
        </div>

        <span className="text-slate-700">|</span>

        <div className="hidden sm:flex items-center gap-1.5" title="TPN Gold Shield v5.2 / Motion Picture Security Certified">
          <span className="text-amber-400 font-semibold">🏛️ OMC ISO-1004</span>
          <span className="px-1 py-0.2 rounded bg-amber-500/10 text-amber-300 text-[9px] border border-amber-500/20">TPN GOLD</span>
        </div>
      </div>

      {/* Center: Active Slate & Ingress Telemetry */}
      <div className="hidden md:flex items-center gap-3 text-slate-300">
        <div className="flex items-center gap-1.5">
          <span>🎬</span>
          <span className="text-slate-400">Slate:</span>
          <span className="text-white font-bold">{tenantDisplay}</span>
          <span className="text-slate-600">&bull;</span>
          <span className="text-cyan-400 font-bold">{activeProject}</span>
        </div>

        <span className="text-slate-700">|</span>

        <div className="flex items-center gap-1.5" title="Real-time 800 Gbps RoCE v2 Camera-to-Cloud Ingress">
          <span className="text-emerald-400 font-semibold">⚡ C2C Ingest: 3.8 GB/s</span>
          <span className="text-slate-500">(800G RoCE v2)</span>
        </div>
      </div>

      {/* Right: Quick Launchers for Storage & Telemetry */}
      <div className="flex items-center gap-2">
        {onOpenStorage && (
          <button
            onClick={onOpenStorage}
            title="Open Cloud Storage & Security Vault (25.0 PB Multi-Tier)"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#121528] hover:bg-[#1C2038] text-slate-300 hover:text-cyan-300 border border-[#262A4A] transition-colors cursor-pointer"
          >
            <span>📦</span>
            <span className="font-semibold text-cyan-400">{storageUsage}</span>
            <span className="text-slate-500">/ {storageQuota}</span>
          </button>
        )}

        {onOpenLogs && (
          <button
            onClick={onOpenLogs}
            title="Open Real-time Telemetry & SRE Logs"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#121528] hover:bg-[#1C2038] text-slate-300 hover:text-emerald-300 border border-[#262A4A] transition-colors cursor-pointer"
          >
            <span className="text-emerald-400">&bull;</span>
            <span className="text-slate-300">SRE Logs</span>
          </button>
        )}
      </div>
    </footer>
  );
};
