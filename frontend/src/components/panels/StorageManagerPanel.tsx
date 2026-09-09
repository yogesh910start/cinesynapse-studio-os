import React from "react";

interface StorageProps {
  isOpen: boolean;
  onClose: () => void;
  quota: any;
  assets: any[];
}

export const StorageManagerPanel: React.FC<StorageProps> = ({ isOpen, onClose, quota, assets }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#121528] border border-[#262A4A] rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262A4A] pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>📦</span> Cloud Storage Vault &amp; Asset Integrity
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Google Cloud Storage (GCS) CMEK-encrypted vault</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-base">✕</button>
        </div>

        {/* Quota Progress Meter */}
        <div className="bg-[#151830] border border-[#262A4A] p-4 rounded-xl space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-300">Active Bucket: <span className="text-cyan-400 font-bold">{quota?.active_bucket || "gs://paramount-c2c-vault"}</span></span>
            <span className="text-purple-300">{quota?.used_human || "42.8 GB"} / {quota?.quota_human || "1.0 TB"}</span>
          </div>
          <div className="w-full bg-[#1A1E38] h-2.5 rounded-full overflow-hidden border border-[#262A4A]">
            <div
              className="bg-gradient-to-r from-purple-500 to-cyan-500 h-full"
              style={{ width: `${quota?.utilization_pct || 4.28}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 text-right">{quota?.utilization_pct || 4.28}% Quota Utilized</div>
        </div>

        {/* Assets File Table */}
        <div className="space-y-2">
          <div className="text-slate-300 font-bold">Encrypted Vault Assets:</div>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {assets.map((a, idx) => (
              <div key={idx} className="bg-[#151830] p-2.5 rounded border border-[#262A4A] flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-cyan-400">&bull;</span>
                  <span className="text-white font-semibold">{a.file_name}</span>
                  <span className="text-slate-500">({a.size_mb} MB)</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-emerald-400 font-bold">&check; {a.c2pa_status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-[#262A4A] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1A1E38] hover:bg-[#262A4A] text-slate-200 rounded font-semibold text-xs"
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>
  );
};
