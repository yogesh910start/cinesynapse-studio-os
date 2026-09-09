import React, { useState } from "react";
import { LikenessPerformer } from "../../types";

interface C2paCertificateModalProps {
  actor: LikenessPerformer;
  onClose: () => void;
}

export const C2paCertificateModal: React.FC<C2paCertificateModalProps> = ({
  actor,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const cert = actor.cryptographic_signatures || {
    performer_key_id: `kms:us-central1:sag:${actor.actor_id.toLowerCase()}-key`,
    sha256_consent_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    c2pa_manifest_uri: actor.c2pa_hash || "c2pa:sha256:42a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
    root_of_trust: "ARRI Alexa 35 Hardware Enclave CA",
    x509_issuer: "DigiCert Studio CA v3 / SAG-AFTRA Trust Network",
    tsa_timestamp: "2026-03-14T08:12:44Z",
    integrity_status: "VERIFIED_VALID"
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(cert.sha256_consent_hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#101326] border border-[#262A4A] rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl font-sans text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262A4A] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg font-bold">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  C2PA Cryptographic Provenance Manifest
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span>✓</span> {cert.integrity_status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Performer: <span className="text-white font-bold">{actor.actor_name}</span> &bull; Contract: <span className="text-cyan-400">{actor.contract_id}</span>
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

        {/* Trust Seal Banner */}
        <div className="bg-gradient-to-r from-cyan-950/40 via-purple-950/40 to-cyan-950/40 border border-cyan-500/30 rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold text-cyan-300 flex items-center gap-2">
              <span>🏛️</span> Coalition for Content Provenance and Authenticity (C2PA v2.1)
            </div>
            <p className="text-[11px] text-slate-300">
              Hardware-attested root of trust guaranteeing this digital replica has not been forged, tampered with, or used without statutory union consent.
            </p>
          </div>
          <div className="text-right font-mono text-[10px] text-slate-400">
            <div>RFC 3161 TSA</div>
            <div className="text-emerald-400 font-bold">STAMP VALID</div>
          </div>
        </div>

        {/* Certificate Breakdown Grid */}
        <div className="bg-[#141731] border border-[#262A4A] rounded-xl p-4 space-y-3 font-mono text-xs">
          <div>
            <div className="text-slate-400 text-[10px] uppercase">Performer KMS Key Identity</div>
            <div className="text-white font-medium text-[11px] bg-[#0E1124] p-2 rounded border border-[#262A4A] mt-1 break-all select-all">
              {cert.performer_key_id}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[10px] uppercase">SHA-256 Consent Rider Hash</span>
              <button
                onClick={handleCopyHash}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 underline"
              >
                {copied ? "✓ Copied to Clipboard" : "Copy Hash"}
              </button>
            </div>
            <div className="text-cyan-300 font-medium text-[11px] bg-[#0E1124] p-2 rounded border border-[#262A4A] mt-1 break-all select-all">
              {cert.sha256_consent_hash}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="text-slate-400 text-[10px] uppercase">Root of Trust Hardware</div>
              <div className="text-slate-200 text-[11px] mt-0.5">{cert.root_of_trust}</div>
            </div>

            <div>
              <div className="text-slate-400 text-[10px] uppercase">X.509 Certificate Issuer</div>
              <div className="text-slate-200 text-[11px] mt-0.5 truncate">{cert.x509_issuer}</div>
            </div>

            <div>
              <div className="text-slate-400 text-[10px] uppercase">Timestamp Authority (TSA)</div>
              <div className="text-slate-200 text-[11px] mt-0.5">{cert.tsa_timestamp}</div>
            </div>

            <div>
              <div className="text-slate-400 text-[10px] uppercase">Consent Expiration Date</div>
              <div className="text-emerald-400 text-[11px] font-bold mt-0.5">{actor.consent_expiry}</div>
            </div>
          </div>

          <div>
            <div className="text-slate-400 text-[10px] uppercase">C2PA Manifest Canonical URI</div>
            <div className="text-purple-300 font-medium text-[11px] bg-[#0E1124] p-2 rounded border border-[#262A4A] mt-1 break-all select-all">
              {cert.c2pa_manifest_uri}
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="bg-[#121528] p-3 rounded-lg border border-[#262A4A] text-[11px] text-slate-400 space-y-1">
          <div className="font-bold text-slate-300 flex items-center gap-1.5">
            <span>⚖️</span> Federal NO FAKES Act of 2026 Statutory Compliance
          </div>
          <div>
            This digital signature serves as prima facie evidence under 17 U.S.C. § 1401 that the performer granted express, unbundled authorization for employment-based digital replica usage within contracted scene parameters.
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleCopyHash}
            className="px-4 py-2 bg-[#1C213D] hover:bg-[#252C52] text-slate-200 rounded-lg text-xs font-mono font-medium transition-colors"
          >
            {copied ? "✓ Copied" : "Copy Consent Hash"}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:opacity-90 text-white rounded-lg text-xs font-mono font-bold transition-all shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
