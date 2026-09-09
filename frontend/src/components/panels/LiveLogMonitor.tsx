import React, { useState } from "react";

interface LogEntry {
  timestamp: string;
  severity: string;
  source: string;
  message: string;
  tenant_id: string;
}

interface LogMonitorProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
}

export const LiveLogMonitor: React.FC<LogMonitorProps> = ({ isOpen, onClose, logs }) => {
  const [filter, setFilter] = useState("ALL");

  if (!isOpen) return null;

  const filteredLogs = logs.filter((l) => {
    if (filter === "ALL") return true;
    return l.severity === filter;
  });

  return (
    <div className="fixed inset-x-0 bottom-0 h-72 bg-[#0E1122] border-t-2 border-purple-500 shadow-2xl z-40 flex flex-col font-mono text-xs">
      {/* Header */}
      <div className="bg-[#151830] px-6 py-2.5 border-b border-[#262A4A] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-purple-300 font-bold flex items-center gap-1.5">
            <span>⚡</span> Real-Time SRE Telemetry &amp; Structured Audit Logger
          </span>
          <span className="text-[10px] text-slate-500">WebSocket Connected &bull; OpenTelemetry JSON Format</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Severity Filter */}
          <div className="flex items-center gap-1 text-[10px]">
            {["ALL", "INFO", "WARNING", "CRITICAL"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilter(lvl)}
                className={`px-2 py-0.5 rounded ${
                  filter === lvl ? "bg-purple-600 text-white font-bold" : "bg-[#1A1E38] text-slate-400 hover:text-white"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button
            onClick={() => alert("Audit log exported as audit_lineage.jsonl")}
            className="text-[10px] bg-[#1A1E38] hover:bg-[#262A4A] text-slate-300 px-2 py-1 rounded border border-[#262A4A]"
          >
            Export JSONL
          </button>

          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">
            ✕
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1.5 bg-[#070913]">
        {filteredLogs.length === 0 ? (
          <div className="text-slate-500 text-center py-8">Awaiting telemetry events...</div>
        ) : (
          filteredLogs.map((l, idx) => (
            <div key={idx} className="flex items-start gap-3 hover:bg-[#121528] px-2 py-1 rounded">
              <span className="text-slate-500 text-[10px] shrink-0">{l.timestamp?.split("T")?.[1]?.slice(0, 12) || "00:00:00.000"}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                  l.severity === "CRITICAL"
                    ? "bg-crimson/20 text-red-400 border border-crimson/30"
                    : l.severity === "WARNING"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                }`}
              >
                {l.severity}
              </span>
              <span className="text-purple-400 font-semibold shrink-0">[{l.source || "SYSTEM"}]</span>
              <span className="text-slate-200">{l.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
