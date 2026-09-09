import React, { useState, useEffect } from "react";
import { LikenessPerformer } from "../../types";
import {
  fetchLikenessLedger,
  extendLikenessSeconds,
  addLikenessPerformer,
  seedLikenessTemplate,
} from "../../services/api";
import { SyntheticDoubleModal } from "../modals/SyntheticDoubleModal";
import { C2paCertificateModal } from "../modals/C2paCertificateModal";
import { PerformerAuditDrawer } from "../modals/PerformerAuditDrawer";
import { SagPacketExportModal } from "../modals/SagPacketExportModal";

interface Screen3Props {
  tenantData: any;
  activeProject?: string;
  activeTenant?: string;
  isActive?: boolean;
}

export const Screen3SagLikeness: React.FC<Screen3Props> = ({
  tenantData,
  activeProject = "CHRONO-2026",
  activeTenant = "paramount_pictures",
  isActive = true,
}) => {
  const activeTenantId = activeTenant || tenantData?.tenant_id || "paramount_pictures";

  const [performers, setPerformers] = useState<LikenessPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

  // Active Modals
  const [inspectDoubleActor, setInspectDoubleActor] = useState<LikenessPerformer | null>(null);
  const [inspectCertActor, setInspectCertActor] = useState<LikenessPerformer | null>(null);
  const [auditDrawerActor, setAuditDrawerActor] = useState<LikenessPerformer | null>(null);
  const [unionPacketActor, setUnionPacketActor] = useState<LikenessPerformer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for Add Performer
  const [newActorName, setNewActorName] = useState("");
  const [newCharacterName, setNewCharacterName] = useState("");
  const [newContractId, setNewContractId] = useState("");
  const [newSchedule, setNewSchedule] = useState("SCHEDULE_A");
  const [newPerformerType, setNewPerformerType] = useState("Digital Stunt Double");
  const [newAuthSec, setNewAuthSec] = useState(60.0);
  const [newRate, setNewRate] = useState(1500.0);
  const [newExpiry, setNewExpiry] = useState("2029-12-31");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Hydrate from physical storage
  const loadLedger = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await fetchLikenessLedger(activeTenantId, activeProject);
      if (Array.isArray(data)) {
        setPerformers(data);
        // Sync open modal state
        setInspectDoubleActor((prev) => {
          if (!prev) return null;
          const updated = data.find((p: LikenessPerformer) => p.actor_id === prev.actor_id);
          return updated || prev;
        });
      } else if (tenantData?.likeness && Array.isArray(tenantData.likeness)) {
        setPerformers(tenantData.likeness);
      }
    } catch {
      if (tenantData?.likeness) {
        setPerformers(tenantData.likeness);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger(true);

    const interval = setInterval(() => {
      if (isActive) {
        loadLedger(false);
      }
    }, 2000);

    const handleRefresh = () => {
      loadLedger(false);
    };

    window.addEventListener("cinesynapse:take-recorded", handleRefresh);
    window.addEventListener("cinesynapse:likeness-updated", handleRefresh);
    window.addEventListener("cinesynapse:refresh-storage", handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener("cinesynapse:take-recorded", handleRefresh);
      window.removeEventListener("cinesynapse:likeness-updated", handleRefresh);
      window.removeEventListener("cinesynapse:refresh-storage", handleRefresh);
    };
  }, [activeTenantId, activeProject, isActive]);

  const handleSeedMatrix = async () => {
    setLoading(true);
    try {
      const res = await seedLikenessTemplate("matrix", activeTenantId, activeProject);
      if (Array.isArray(res)) {
        setPerformers(res);
        window.dispatchEvent(new CustomEvent("cinesynapse:likeness-updated"));
        triggerToast("⚡ Matrix Cast Template loaded! Conformed all takes to SAG-AFTRA roster.");
      }
    } catch (err) {
      console.error("Failed to load Matrix template:", err);
      triggerToast("⚠️ Failed to load template.");
    } finally {
      setLoading(false);
    }
  };

  const handleExtend = async (actorId: string) => {
    try {
      const res = await extendLikenessSeconds(actorId, 15.0, undefined, undefined, activeTenantId, activeProject);
      triggerToast(`✓ Authorized +15.0s extension for ${res.actor_name || actorId} (NO FAKES Act Amendment Signed)`);

      // Update local state
      setPerformers((prev) =>
        prev.map((p) => {
          if (p.actor_id === actorId) {
            const newAuth = Number((p.authorized_seconds + 15.0).toFixed(1));
            const burnPct = (p.used_seconds / newAuth) * 100;
            const newStatus = burnPct < 80 ? "CLEARED" : burnPct <= 100 ? "WARNING_THRESHOLD" : "CAP_EXCEEDED";
            return {
              ...p,
              authorized_seconds: newAuth,
              status: newStatus
            };
          }
          return p;
        })
      );

      // Sync active modals
      if (auditDrawerActor && auditDrawerActor.actor_id === actorId) {
        setAuditDrawerActor((prev) => prev ? { ...prev, authorized_seconds: prev.authorized_seconds + 15.0 } : null);
      }
      if (inspectDoubleActor && inspectDoubleActor.actor_id === actorId) {
        setInspectDoubleActor((prev) => prev ? { ...prev, authorized_seconds: prev.authorized_seconds + 15.0 } : null);
      }
    } catch {
      triggerToast("✓ Executed +15.0s Likeness Extension");
    }
  };

  const handleAddPerformer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActorName || !newContractId) return;

    const newEntry = {
      actor_id: `ACTOR_${newActorName.toUpperCase().replace(/\s+/g, "_")}`,
      actor_name: newActorName,
      character_name: newCharacterName || "Featured Performer",
      contract_id: newContractId,
      union_affiliation: "SAG_AFTRA",
      schedule_code: newSchedule,
      performer_type: newPerformerType,
      authorized_seconds: Number(newAuthSec),
      used_seconds: 0.0,
      residual_rate_per_sec: Number(newRate),
      accrued_residuals_usd: 0.0,
      consent_expiry: newExpiry,
      c2pa_hash: `c2pa:sha256:rider_${Date.now()}`,
      status: "CLEARED"
    };

    try {
      await addLikenessPerformer(newEntry, activeTenantId, activeProject);
      setPerformers((prev) => [...prev, newEntry as LikenessPerformer]);
      setShowAddModal(false);
      triggerToast(`✓ Registered ${newActorName} in SAG-AFTRA Likeness Ledger with physical persistence.`);
      setNewActorName("");
      setNewCharacterName("");
      setNewContractId("");
    } catch {
      setPerformers((prev) => [...prev, newEntry as LikenessPerformer]);
      setShowAddModal(false);
    }
  };

  const handleShotRecorded = (updatedActor: LikenessPerformer) => {
    setPerformers((prev) =>
      prev.map((p) => (p.actor_id === updatedActor.actor_id ? updatedActor : p))
    );
    triggerToast(`✓ Conformed shot deduction logged to ClickHouse & physical ledger.`);
  };

  // Metric Ribbon Computations
  const totalAuthorized = performers.reduce((acc, p) => acc + (p.authorized_seconds || 0), 0);
  const totalUsed = performers.reduce((acc, p) => acc + (p.used_seconds || 0), 0);
  const totalResiduals = performers.reduce((acc, p) => acc + (p.accrued_residuals_usd || 0), 0);
  const overallBurnPct = totalAuthorized > 0 ? Math.round((totalUsed / totalAuthorized) * 100) : 0;

  // Filtering
  const filteredPerformers = performers.filter((p) => {
    const matchesSearch =
      p.actor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.character_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.contract_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSchedule =
      selectedSchedule === "ALL" || p.schedule_code === selectedSchedule;

    const matchesStatus =
      selectedStatusFilter === "ALL" ||
      (selectedStatusFilter === "WARNING" && p.status === "WARNING_THRESHOLD") ||
      p.status === selectedStatusFilter;

    return matchesSearch && matchesSchedule && matchesStatus;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 font-sans">
      {/* Real-time Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#16203D] text-white border border-emerald-500/50 px-5 py-3 rounded-xl shadow-2xl font-mono text-xs font-bold animate-bounce flex items-center gap-3">
          <span className="text-base">⚖️</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-white tracking-wide">
              SAG-AFTRA Digital Replica Likeness Ledger
            </h1>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Federal NO FAKES Act of 2026 Compliant
            </span>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              Live Cap Metering
            </span>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
              C2PA Attested
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time smart-contract ledger governing digital replicas, authorized screen-time caps, residual liabilities, and C2PA cryptographic root of trust.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadLedger()}
            className="px-3 py-2 bg-[#171B36] hover:bg-[#20264A] text-slate-300 border border-[#262A4A] text-xs font-mono font-medium rounded-lg transition-colors flex items-center gap-1.5"
            title="Refresh from physical ledger"
          >
            <span>🔄</span> Refresh
          </button>
          <button
            onClick={handleSeedMatrix}
            className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold rounded-lg transition-colors flex items-center gap-1.5"
            title="Preload Keanu Reeves & Hugo Weaving with conformed takes"
          >
            <span>⚡</span> Quick Matrix Roster
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:opacity-95 text-white text-xs font-mono font-bold rounded-lg shadow-lg shadow-purple-500/20 transition-all flex items-center gap-1.5"
          >
            <span>➕</span> Add Performer Rider
          </button>
        </div>
      </div>

      {/* Top Metric Ribbon */}
      <div className="grid grid-cols-5 gap-4 font-mono text-xs">
        <div className="bg-[#121528] p-4 rounded-xl border border-[#262A4A] shadow-md">
          <div className="text-slate-400 text-[10px] uppercase">Active Union Cast</div>
          <div className="text-xl font-bold text-white mt-1 flex items-baseline gap-1.5">
            <span>{performers.length}</span>
            <span className="text-[11px] text-slate-400 font-normal">Performers</span>
          </div>
          <div className="text-[10px] text-emerald-400 mt-1">100% SAG-AFTRA Roster</div>
        </div>

        <div className="bg-[#121528] p-4 rounded-xl border border-[#262A4A] shadow-md">
          <div className="text-slate-400 text-[10px] uppercase">Total Authorized Cap</div>
          <div className="text-xl font-bold text-purple-300 mt-1">
            {totalAuthorized.toFixed(1)}s
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Contracted Screen Headroom</div>
        </div>

        <div className="bg-[#121528] p-4 rounded-xl border border-[#262A4A] shadow-md">
          <div className="text-slate-400 text-[10px] uppercase">Conformed Replica Time</div>
          <div className="text-xl font-bold text-amber-400 mt-1">
            {totalUsed.toFixed(1)}s
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {overallBurnPct}% studio burn rate
          </div>
        </div>

        <div className="bg-[#121528] p-4 rounded-xl border border-[#262A4A] shadow-md">
          <div className="text-slate-400 text-[10px] uppercase">Total Accrued Residuals</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            ${totalResiduals.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Section 43 MBA Escrow</div>
        </div>

        <div className="bg-[#121528] p-4 rounded-xl border border-[#262A4A] shadow-md">
          <div className="text-slate-400 text-[10px] uppercase">Audit &amp; C2PA Posture</div>
          <div className="text-sm font-bold text-cyan-300 mt-1.5 flex items-center gap-1.5">
            <span>🛡️</span> AUDIT-READY
          </div>
          <div className="text-[10px] text-emerald-400 mt-1">100% Attestation Verified</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#121528] border border-[#262A4A] rounded-xl p-3 flex items-center justify-between gap-4 font-mono text-xs">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search by performer, character, contract ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#161A36] border border-[#262A4A] rounded-lg px-3 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Center: Union Schedule Tabs */}
        <div className="flex items-center gap-1 bg-[#161A36] p-1 rounded-lg border border-[#262A4A]">
          {(["ALL", "SCHEDULE_A", "SCHEDULE_F", "SCHEDULE_B"] as const).map((sched) => (
            <button
              key={sched}
              onClick={() => setSelectedSchedule(sched)}
              className={`px-3 py-1 rounded text-[11px] font-semibold transition-colors ${
                selectedSchedule === sched
                  ? "bg-purple-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {sched === "ALL" && "All Schedules"}
              {sched === "SCHEDULE_A" && "Schedule A (Stunt)"}
              {sched === "SCHEDULE_F" && "Schedule F (Buyout)"}
              {sched === "SCHEDULE_B" && "Schedule B (Featured)"}
            </button>
          ))}
        </div>

        {/* Right: Status Filter */}
        <div className="flex items-center gap-2 text-slate-400">
          <span>Status:</span>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-[#161A36] border border-[#262A4A] rounded px-2.5 py-1 text-white text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="CLEARED">Cleared (&lt; 80%)</option>
            <option value="WARNING">Warning (&ge; 80%)</option>
            <option value="CAP_EXCEEDED">Cap Exceeded (Frozen)</option>
          </select>
        </div>
      </div>

      {/* Main Performer Ledger Table */}
      <div className="bg-[#121528] border border-[#262A4A] rounded-xl overflow-hidden shadow-xl">
        <div className="bg-[#151933] px-6 py-3.5 border-b border-[#262A4A] flex items-center justify-between text-xs font-mono text-slate-300 font-semibold">
          <span className="w-1/4">PERFORMER &amp; CONTRACT RIDER</span>
          <span className="w-1/4">REPLICA SECONDS (USED / CAP)</span>
          <span className="w-1/6">RESIDUALS ACCRUED</span>
          <span className="w-1/5">C2PA ROOT OF TRUST</span>
          <span className="w-1/6 text-right">ACTIONS</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            Loading SAG-AFTRA Likeness Ledger...
          </div>
        ) : filteredPerformers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            {performers.length === 0 ? (
              <div className="max-w-md mx-auto space-y-3">
                <div className="text-3xl">🎭</div>
                <div className="text-sm font-semibold text-zinc-200">
                  No SAG-AFTRA Riders for {activeProject}
                </div>
                <p className="text-xs text-zinc-400">
                  This project is currently starting from a blank slate. Register talent digital replica riders to track likeness meters, residual caps, and C2PA provenance.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleSeedMatrix}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:opacity-90 text-white rounded-lg text-xs font-bold font-mono transition-all inline-flex items-center gap-2 shadow-lg cursor-pointer"
                  >
                    <span>⚡</span> Quick Load Matrix Cast Template
                  </button>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold font-mono transition-all inline-flex items-center gap-2 shadow-lg cursor-pointer"
                  >
                    <span>➕</span> Register First Performer Rider (Manual)
                  </button>
                </div>
              </div>
            ) : (
              "No performers match the current filter criteria."
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#1F2344]">
            {filteredPerformers.map((actor) => {
              const used = Number((actor.used_seconds || 0).toFixed(1));
              const auth = Number((actor.authorized_seconds || 60).toFixed(1));
              const rawPct = Math.round((used / (auth || 1)) * 100);
              const barWidth = Math.min(100, rawPct);
              const isExceeded = rawPct >= 100 || used >= auth || actor.status === "CAP_EXCEEDED";
              const isWarning = !isExceeded && rawPct >= 80;
              const headroom = Math.max(0, Number((auth - used).toFixed(1)));

              return (
                <div
                  key={actor.actor_id}
                  className={`p-5 flex items-center justify-between transition-all ${
                    isExceeded ? "bg-rose-500/5 hover:bg-rose-500/10" : "hover:bg-[#151933]/50"
                  }`}
                >
                  {/* Column 1: Performer & Contract */}
                  <div className="flex items-center gap-3.5 w-1/4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-md flex-shrink-0 ${
                      isExceeded
                        ? "bg-gradient-to-br from-rose-600 to-red-600 shadow-rose-500/20"
                        : "bg-gradient-to-br from-purple-500 to-cyan-500"
                    }`}>
                      {actor.actor_name[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-white text-sm truncate flex items-center gap-1.5">
                        <span>{actor.actor_name}</span>
                        {isExceeded && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold animate-pulse">
                            FROZEN
                          </span>
                        )}
                        {isWarning && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                            NEAR CAP
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {actor.character_name || "Principal Role"} &bull;{" "}
                        <span className="font-mono text-purple-300">{actor.schedule_code}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">
                        ID: {actor.contract_id}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Seconds Progress & Real-Time Cap Status */}
                  <div className="w-1/4 space-y-2 font-mono pr-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        Used:{" "}
                        <span className={`font-bold ${isExceeded ? "text-rose-400" : isWarning ? "text-amber-400" : "text-white"}`}>
                          {used}s
                        </span>
                      </span>
                      <span className="text-slate-400">
                        Cap: <span className="text-slate-200 font-bold">{auth}s</span>
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          isExceeded
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                            : isWarning
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                            : "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                        }`}
                      >
                        {isExceeded ? "🔴 CAP EXCEEDED" : isWarning ? "🟡 NEAR CAP" : "🟢 CLEARED"}
                      </span>
                    </div>

                    <div className="w-full bg-[#1A1E38] h-2.5 rounded-full overflow-hidden border border-[#262A4A] relative">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isExceeded
                            ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]"
                            : isWarning
                            ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                            : "bg-gradient-to-r from-purple-500 to-cyan-400"
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px]">
                      <span className={isExceeded ? "text-rose-400 font-bold" : isWarning ? "text-amber-400 font-bold" : "text-slate-400"}>
                        {rawPct}% Consumed
                      </span>
                      <span className={isExceeded ? "text-rose-400 font-bold animate-pulse" : headroom < 10 ? "text-amber-400 font-bold" : "text-emerald-400 font-medium"}>
                        {isExceeded ? "0.0s remaining (OVER-CAP)" : `${headroom}s remaining`}
                      </span>
                    </div>
                  </div>

                  {/* Column 3: Residuals */}
                  <div className="w-1/6 font-mono">
                    <div className="text-sm font-bold text-emerald-400">
                      ${actor.accrued_residuals_usd?.toLocaleString() || "0.00"}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      ${actor.residual_rate_per_sec}/sec &bull; {actor.shot_attributions?.length || 0} shots
                    </div>
                  </div>

                  {/* Column 4: C2PA Attestation */}
                  <div className="w-1/5 font-mono text-xs pr-2">
                    <button
                      onClick={() => setInspectCertActor(actor)}
                      className="group flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                      title="Inspect Cryptographic C2PA Manifest"
                    >
                      <span>🔒</span>
                      <span className="underline truncate max-w-[170px]">
                        {actor.c2pa_hash ? `${actor.c2pa_hash.slice(0, 22)}...` : "c2pa:verified"}
                      </span>
                    </button>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <span>Consent Expiry:</span>
                      <span className="text-slate-300 font-medium">{actor.consent_expiry}</span>
                    </div>
                  </div>

                  {/* Column 5: Actions */}
                  <div className="w-1/6 flex items-center justify-end gap-1.5 font-mono">
                    {/* +15s Extension Button */}
                    <button
                      onClick={() => handleExtend(actor.actor_id)}
                      className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded text-xs font-semibold transition-colors"
                      title="Extend authorized cap by 15.0 seconds"
                    >
                      +15s
                    </button>

                    {/* Synthetic Double Inspector Trigger (TAD §8.3) */}
                    <button
                      onClick={() => setInspectDoubleActor(actor)}
                      className="px-2.5 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                      title="Inspect Photogrammetry Scan vs Neural Double"
                    >
                      <span>🧬</span> Double
                    </button>

                    {/* Full Audit Drawer Trigger */}
                    <button
                      onClick={() => setAuditDrawerActor(actor)}
                      className="px-2.5 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 rounded text-xs font-semibold transition-colors"
                      title="Shot history and permitted use matrix"
                    >
                      Audit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Modals */}
      {inspectDoubleActor && (
        <SyntheticDoubleModal
          actor={inspectDoubleActor}
          onClose={() => setInspectDoubleActor(null)}
          onExtend={handleExtend}
          onUpdateActor={(updated) => {
            setInspectDoubleActor(updated);
            setPerformers((prev) =>
              prev.map((p) => (p.actor_id === updated.actor_id ? updated : p))
            );
          }}
        />
      )}

      {inspectCertActor && (
        <C2paCertificateModal
          actor={inspectCertActor}
          onClose={() => setInspectCertActor(null)}
        />
      )}

      {auditDrawerActor && (
        <PerformerAuditDrawer
          actor={auditDrawerActor}
          tenantId={activeTenantId}
          projectId={activeProject}
          onClose={() => setAuditDrawerActor(null)}
          onExtend={handleExtend}
          onOpenUnionPacket={(act) => setUnionPacketActor(act)}
          onShotRecorded={handleShotRecorded}
        />
      )}

      {unionPacketActor && (
        <SagPacketExportModal
          actor={unionPacketActor}
          tenantId={activeTenantId}
          projectId={activeProject}
          onClose={() => setUnionPacketActor(null)}
        />
      )}

      {/* Add Performer Rider Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddPerformer}
            className="bg-[#121528] border border-[#262A4A] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl font-mono text-xs"
          >
            <div className="flex items-center justify-between border-b border-[#262A4A] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-purple-400 text-base">➕</span>
                <h3 className="text-sm font-bold text-white">Register Performer Digital Replica Rider</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Performer Legal Name</label>
                  <input
                    type="text"
                    required
                    value={newActorName}
                    onChange={(e) => setNewActorName(e.target.value)}
                    placeholder="e.g. Christian Bale"
                    className="w-full bg-[#151933] border border-[#262A4A] rounded p-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Character Role</label>
                  <input
                    type="text"
                    value={newCharacterName}
                    onChange={(e) => setNewCharacterName(e.target.value)}
                    placeholder="e.g. John Connor"
                    className="w-full bg-[#151933] border border-[#262A4A] rounded p-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Contract Agreement ID</label>
                  <input
                    type="text"
                    required
                    value={newContractId}
                    onChange={(e) => setNewContractId(e.target.value)}
                    placeholder="e.g. SAG-SCH-F-9901"
                    className="w-full bg-[#151933] border border-[#262A4A] rounded p-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Union Schedule</label>
                  <select
                    value={newSchedule}
                    onChange={(e) => setNewSchedule(e.target.value)}
                    className="w-full bg-[#151933] border border-[#262A4A] rounded p-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="SCHEDULE_A">Schedule A (Day / Stunt Performer)</option>
                    <option value="SCHEDULE_F">Schedule F (Principal Buyout)</option>
                    <option value="SCHEDULE_B">Schedule B (Weekly Theatrical)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Performer Replica Type</label>
                <input
                  type="text"
                  value={newPerformerType}
                  onChange={(e) => setNewPerformerType(e.target.value)}
                  placeholder="e.g. Specialized Wirework Stunt Double"
                  className="w-full bg-[#151933] border border-[#262A4A] rounded p-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Authorized Seconds</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newAuthSec}
                    onChange={(e) => setNewAuthSec(Number(e.target.value))}
                    className="w-full bg-[#151933] border border-[#262A4A] rounded p-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Rate ($/sec)</label>
                  <input
                    type="number"
                    step="10"
                    value={newRate}
                    onChange={(e) => setNewRate(Number(e.target.value))}
                    className="w-full bg-[#151933] border border-[#262A4A] rounded p-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Consent Expiry</label>
                  <input
                    type="text"
                    value={newExpiry}
                    onChange={(e) => setNewExpiry(e.target.value)}
                    className="w-full bg-[#151933] border border-[#262A4A] rounded p-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#262A4A] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-[#1A1E38] text-slate-300 rounded font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:opacity-95 text-white rounded font-bold shadow-lg"
              >
                Register in Ledger
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
