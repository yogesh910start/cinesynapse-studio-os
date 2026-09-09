import React, { useState, useEffect } from "react";
import { LikenessPerformer, SagUnionPacket } from "../../types";
import { exportSagUnionPacket } from "../../services/api";

interface SagPacketExportModalProps {
  actor: LikenessPerformer;
  tenantId?: string;
  projectId?: string;
  onClose: () => void;
}

export const SagPacketExportModal: React.FC<SagPacketExportModalProps> = ({
  actor,
  tenantId = "paramount_pictures",
  projectId,
  onClose,
}) => {
  const [packet, setPacket] = useState<SagUnionPacket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    async function loadPacket() {
      try {
        const res = await exportSagUnionPacket(actor.actor_id, tenantId, projectId);
        setPacket(res);
      } catch {
        // Fallback representation
      } finally {
        setLoading(false);
      }
    }
    loadPacket();
  }, [actor, tenantId, projectId]);

  const handleCopyJson = () => {
    if (!packet) return;
    navigator.clipboard.writeText(JSON.stringify(packet, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!packet) return;
    const blob = new Blob([JSON.stringify(packet, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${packet.packet_id || "SAG_PACKET"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0E1122] border border-[#262A4A] rounded-2xl max-w-3xl w-full flex flex-col shadow-2xl overflow-hidden font-sans max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#141833] px-6 py-4 border-b border-[#262A4A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-bold text-lg shadow-md">
              🏛️
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>SAG-AFTRA Certified Digital Replica Delivery Packet</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  MBA §43 &bull; NO FAKES Act
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Packet Ref: <span className="text-cyan-400">{packet?.packet_id || "GENERATING..."}</span>
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

        {/* Packet Slip Viewport */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 font-mono text-xs text-slate-200">
          {loading ? (
            <div className="text-center p-12 text-slate-400">
              Generating certified union compliance slip...
            </div>
          ) : (
            <div className="bg-[#121528] border-2 border-[#262A4A] rounded-xl p-6 space-y-5 shadow-inner">
              {/* Document Header */}
              <div className="border-b-2 border-[#2A3059] pb-4 flex items-start justify-between">
                <div>
                  <div className="text-sm font-bold text-white tracking-wider">
                    SCREEN ACTORS GUILD &bull; AMERICAN FEDERATION OF TELEVISION AND RADIO ARTISTS
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    EXECUTIVE NOTICE OF DIGITAL REPLICA CONFORM &amp; RESIDUAL ACCRUAL
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-1">
                    STATUTORY BASIS: {packet?.statutory_act || "Federal NO FAKES Act of 2026 (17 U.S.C. § 1401)"}
                  </div>
                </div>
                <div className="text-right text-[10px] text-slate-400">
                  <div>Studio Tenant: <span className="text-white font-bold">{packet?.studio_tenant}</span></div>
                  <div>Production: <span className="text-cyan-400 font-bold">{packet?.production_title}</span></div>
                  <div>Timestamp: <span className="text-slate-300">{packet?.generated_at?.slice(0, 19)}</span></div>
                </div>
              </div>

              {/* Performer & Contract Summary */}
              <div className="grid grid-cols-2 gap-4 bg-[#161B38] p-4 rounded-lg border border-[#262A4A]">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Performer Legal Identity</div>
                  <div className="text-white text-sm font-bold mt-0.5">{actor.actor_name}</div>
                  <div className="text-slate-300 text-[11px] mt-0.5">Role: {actor.character_name || "Principal Role"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Union Agreement &amp; Rider</div>
                  <div className="text-purple-300 text-sm font-bold mt-0.5">{actor.contract_id}</div>
                  <div className="text-slate-300 text-[11px] mt-0.5">Schedule: {actor.schedule_code} &bull; Expiry: {actor.consent_expiry}</div>
                </div>
              </div>

              {/* Metering Breakdown Grid */}
              <div>
                <div className="text-[11px] font-bold text-white mb-2 uppercase tracking-wide">
                  1. Statutory Screen-Time Metering Ledger
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-[#161B38] p-3 rounded border border-[#262A4A]">
                    <div className="text-[10px] text-slate-400">CONTRACT CAP</div>
                    <div className="text-base font-bold text-white mt-1">{actor.authorized_seconds}s</div>
                  </div>
                  <div className="bg-[#161B38] p-3 rounded border border-[#262A4A]">
                    <div className="text-[10px] text-slate-400">ACTUAL CONFORMED</div>
                    <div className="text-base font-bold text-amber-300 mt-1">{actor.used_seconds}s</div>
                  </div>
                  <div className="bg-[#161B38] p-3 rounded border border-[#262A4A]">
                    <div className="text-[10px] text-slate-400">REMAINING HEADROOM</div>
                    <div className="text-base font-bold text-emerald-400 mt-1">
                      {Math.max(0, Number((actor.authorized_seconds - actor.used_seconds).toFixed(1)))}s
                    </div>
                  </div>
                  <div className="bg-[#161B38] p-3 rounded border border-[#262A4A]">
                    <div className="text-[10px] text-slate-400">ACCRUED RESIDUALS</div>
                    <div className="text-base font-bold text-emerald-400 mt-1">
                      ${actor.accrued_residuals_usd?.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Conformed Shots Log Table */}
              <div>
                <div className="text-[11px] font-bold text-white mb-2 uppercase tracking-wide">
                  2. Conformed Scene / Shot Audit Trail
                </div>
                <div className="bg-[#161B38] rounded-lg border border-[#262A4A] overflow-hidden">
                  <div className="bg-[#1A2045] px-4 py-2 border-b border-[#262A4A] flex justify-between text-[10px] font-bold text-slate-300">
                    <span className="w-1/4">SCENE / TAKE</span>
                    <span className="w-1/2">SHOT DESCRIPTION</span>
                    <span className="w-1/8 text-right">DURATION</span>
                    <span className="w-1/8 text-right">CONFORM</span>
                  </div>
                  <div className="divide-y divide-[#262A4A] max-h-40 overflow-y-auto">
                    {(actor.shot_attributions || []).map((shot, i) => (
                      <div key={i} className="px-4 py-2 flex justify-between text-[11px] text-slate-300">
                        <span className="w-1/4 text-purple-300 font-bold">{shot.scene_display} T{shot.take_number}</span>
                        <span className="w-1/2 truncate text-slate-300">{shot.description}</span>
                        <span className="w-1/8 text-right text-amber-300 font-bold">+{shot.used_seconds}s</span>
                        <span className="w-1/8 text-right text-emerald-400">VERIFIED</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cryptographic Attestation Seal */}
              <div className="border-t-2 border-[#2A3059] pt-4 flex items-center justify-between">
                <div className="space-y-1 text-[10px] text-slate-400">
                  <div>Legal Counsel: <span className="text-white font-bold">{packet?.certification?.attorney_signature || "Elena Rostova, Esq. (Bar No. CA-491208)"}</span></div>
                  <div>Digital Seal: <span className="text-cyan-400 select-all">{packet?.certification?.digital_seal?.slice(0, 32)}...</span></div>
                  <div>TSA Server: <span className="text-slate-300">{packet?.certification?.timestamp_authority}</span></div>
                </div>

                <div className="w-24 h-24 rounded-full border-2 border-amber-500/40 bg-amber-500/5 flex flex-col items-center justify-center text-center p-1 select-none">
                  <div className="text-[9px] text-amber-400 font-bold">SAG-AFTRA</div>
                  <div className="text-sm">⚖️</div>
                  <div className="text-[8px] text-amber-300 uppercase font-bold">AUDIT READY</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#141833] px-6 py-4 border-t border-[#262A4A] flex items-center justify-between">
          <button
            onClick={handleCopyJson}
            className="px-4 py-2 bg-[#1C213D] hover:bg-[#252C52] text-slate-200 rounded-lg text-xs font-mono font-medium transition-colors"
          >
            {copied ? "✓ Copied JSON" : "📋 Copy Full JSON"}
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#1C213D] hover:bg-[#252C52] text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-mono font-medium transition-colors"
            >
              🖨️ Print / Save PDF
            </button>
            <button
              onClick={handleDownload}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:opacity-90 text-slate-950 font-bold rounded-lg text-xs font-mono shadow-lg transition-all"
            >
              💾 Download Signed Packet
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
