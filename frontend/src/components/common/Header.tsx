import React, { useState, useRef, useEffect } from "react";
import { UserProfile, StudioTenant, MovieProject } from "../../types";

interface HeaderProps {
  activeTenant: string;
  onTenantChange: (tenant: string) => void;
  activeProject?: string;
  onProjectChange?: (projectId: string) => void;
  studios?: StudioTenant[];
  projects?: MovieProject[];
  onOpenCreateProject?: () => void;
  onOpenCreateStudio?: () => void;
  onToggleLogs: () => void;
  onToggleStorage: () => void;
  onToggleTriggers: () => void;
  showTriggers: boolean;
  currentUser: UserProfile;
  isAuthenticated: boolean;
  onLogout: () => void;
  onOpenLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTenant,
  onTenantChange,
  activeProject = "CHRONO-2026",
  onProjectChange,
  studios = [],
  projects = [],
  onOpenCreateProject,
  onOpenCreateStudio,
  onToggleLogs,
  onToggleStorage,
  onToggleTriggers,
  showTriggers,
  currentUser,
  isAuthenticated,
  onLogout,
  onOpenLogin,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fallbackStudios: StudioTenant[] = [
    { tenant_id: "paramount_pictures", name: "Paramount Pictures", code: "PARA", default_project: "CHRONO-2026", logo: "🎬" },
    { tenant_id: "a24_films", name: "A24 Films", code: "A24", default_project: "NEON-GHOST", logo: "👻" },
    { tenant_id: "warner_bros", name: "Warner Bros. Discovery", code: "WBD", default_project: "APEX-2026", logo: "🛡️" },
  ];

  const studiosList = studios.length > 0 ? studios : fallbackStudios;
  const currentStudio = studiosList.find((s) => s.tenant_id === activeTenant) || studiosList[0];

  // Projects under active tenant
  const tenantProjects = projects.filter((p) => p.tenant_id === activeTenant);
  const currentProjectObj = tenantProjects.find((p) => p.project_id === activeProject) || tenantProjects[0];

  return (
    <header className="h-16 border-b border-[#262A4A] bg-[#0E1122] px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Studio/Movie Two-Tier Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 font-bold tracking-wider text-white">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="text-lg">🎬</span>
          </div>
          <div>
            <span className="text-base tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              CINE-SYNAPSE
            </span>
            <span className="block text-[10px] tracking-widest font-mono text-slate-400">
              STUDIO OS v2.0
            </span>
          </div>
        </div>

        <div className="h-6 w-px bg-[#262A4A] mx-1" />

        {/* Studio (Tenant) Selector */}
        <div className="flex items-center gap-1.5 bg-[#151830] border border-[#262A4A] hover:border-purple-500/40 rounded-lg px-2.5 py-1 transition-colors">
          <span className="text-xs text-slate-400 font-mono">🏢 Studio:</span>
          <select
            aria-label="Active Studio Tenant"
            value={activeTenant}
            onChange={(e) => {
              if (e.target.value === "__NEW_STUDIO__") {
                if (onOpenCreateStudio) onOpenCreateStudio();
              } else {
                onTenantChange(e.target.value);
              }
            }}
            className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
          >
            {studiosList.map((s) => (
              <option key={s.tenant_id} value={s.tenant_id} className="bg-[#121528] text-slate-200">
                {s.logo || "🏢"} {s.name} ({s.code || s.tenant_id})
              </option>
            ))}
            <option value="__NEW_STUDIO__" className="bg-[#121528] text-emerald-400 font-bold">
              ➕ Add New Studio Tenant...
            </option>
          </select>
        </div>

        {/* Movie Project Selector */}
        <div className="flex items-center gap-1.5 bg-[#151830] border border-[#262A4A] hover:border-cyan-500/40 rounded-lg px-2.5 py-1 transition-colors">
          <span className="text-xs text-slate-400 font-mono">🎬 Movie:</span>
          <select
            aria-label="Active Movie Project"
            value={activeProject}
            onChange={(e) => {
              if (e.target.value === "__NEW_PROJECT__") {
                if (onOpenCreateProject) onOpenCreateProject();
              } else {
                if (onProjectChange) onProjectChange(e.target.value);
              }
            }}
            className="bg-transparent text-cyan-300 text-xs font-semibold focus:outline-none cursor-pointer max-w-[210px] truncate"
          >
            {tenantProjects.length > 0 ? (
              tenantProjects.map((p) => (
                <option key={p.project_id} value={p.project_id} className="bg-[#121528] text-slate-200">
                  {p.project_id}: {p.title}
                </option>
              ))
            ) : (
              <option value={activeProject} className="bg-[#121528] text-slate-200">
                {activeProject}
              </option>
            )}
            <option value="__NEW_PROJECT__" className="bg-[#121528] text-emerald-400 font-bold">
              ➕ Create New Movie Project...
            </option>
          </select>
        </div>

        {/* Quick New Project Button */}
        {onOpenCreateProject && (
          <button
            onClick={onOpenCreateProject}
            title="Create a brand new movie project under current studio"
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg border border-emerald-400/40 shadow-sm shadow-emerald-950/40 transition-all cursor-pointer"
          >
            <span>➕</span>
            <span className="hidden sm:inline">New Project</span>
          </button>
        )}
      </div>

      {/* Global Telemetry & User Profile Controls */}
      <div className="flex items-center gap-3">
        {/* Storage Vault Navigation */}
        <button
          onClick={onToggleStorage}
          title="Open Cloud Storage & Security Vault (25 PB)"
          className="flex items-center gap-1.5 bg-[#151830] hover:bg-[#1A1E38] text-slate-300 hover:text-cyan-300 text-xs px-3 py-1.5 rounded-md border border-[#262A4A] hover:border-cyan-500/40 transition-colors cursor-pointer"
        >
          <span>📦</span>
          <span className="hidden md:inline">Storage Vault</span>
        </button>


        {/* Live Logger Drawer Toggle */}
        <button
          onClick={onToggleLogs}
          className="flex items-center gap-1.5 bg-[#151830] hover:bg-[#1A1E38] text-slate-300 text-xs px-3 py-1.5 rounded-md border border-[#262A4A] transition-colors"
        >
          <span>⚡</span>
          <span>Logs</span>
        </button>

        {/* Judge Scenarios Bar Toggle */}
        <button
          onClick={onToggleTriggers}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium border transition-all ${
            showTriggers
              ? "bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-500/30"
              : "bg-purple-950/40 text-purple-300 border-purple-800/60 hover:bg-purple-900/50"
          }`}
        >
          <span>🎯</span>
          <span>Triggers</span>
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-[#262A4A] mx-1" />

        {/* USER PROFILE & LOGOUT SECTION */}
        {isAuthenticated ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2.5 bg-[#151830] hover:bg-[#1C2042] border border-[#262A4A] hover:border-purple-500/50 rounded-lg px-2.5 py-1.5 transition-all text-left group"
            >
              <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-sm shadow-inner">
                {currentUser.avatar}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-semibold text-white leading-tight flex items-center gap-1.5">
                  <span>{currentUser.name.split(",")[0]}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-[10px] text-purple-300 font-mono leading-none truncate max-w-[120px]">
                  {currentUser.role.split("/")[0].trim()}
                </div>
              </div>
              <span className="text-slate-400 group-hover:text-purple-300 text-xs transition-transform duration-200">
                {isProfileOpen ? "▲" : "▼"}
              </span>
            </button>

            {/* Profile Dropdown Popover */}
            {isProfileOpen && (
              <div className="absolute right-0 top-12 mt-2 w-80 bg-[#121528] border border-[#262A4A] rounded-xl shadow-2xl p-4 space-y-4 z-50 text-slate-200 font-sans animate-in fade-in zoom-in-95 duration-150">
                {/* User Identity Header */}
                <div className="flex items-start gap-3 pb-3 border-b border-[#262A4A]">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/30 to-cyan-500/30 border border-purple-500/40 flex items-center justify-center text-2xl shrink-0 shadow-lg">
                    {currentUser.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white truncate">{currentUser.name}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                    <p className="text-[11px] text-purple-300 font-mono mt-0.5 truncate">{currentUser.role}</p>
                  </div>
                </div>

                {/* Studio & Project Info */}
                <div className="bg-[#151830] p-3 rounded-lg border border-[#262A4A] space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Studio Tenant:</span>
                    <span className="text-white font-semibold">{currentStudio.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Project Tentpole:</span>
                    <span className="text-cyan-300 font-semibold">{currentProjectObj ? `${currentProjectObj.title} (${currentProjectObj.project_id})` : activeProject}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Security Scope:</span>
                    <span className="text-amber-300 font-semibold">TPN+ Level 3 / RLS</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Session Lease:</span>
                    <span className="text-emerald-400">{currentUser.expiresIn || "07h 59m 42s"}</span>
                  </div>
                </div>

                {/* Functional Clearances */}
                <div className="space-y-1 font-mono text-[10px]">
                  <span className="text-slate-400">Granted Entitlements:</span>
                  <div className="text-slate-300 bg-[#090B16] p-2 rounded border border-[#262A4A] leading-relaxed">
                    {currentUser.clearance}
                  </div>
                </div>

                {/* Quick Switch / Settings Link */}
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenLogin();
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-[#1A1E38] hover:bg-[#252A4E] text-slate-200 hover:text-white border border-[#262A4A] hover:border-purple-500/40 text-xs font-mono flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span>🔄</span>
                    <span>Switch Tenant / Persona</span>
                  </span>
                  <span className="text-purple-400">Screen 5 →</span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full py-2.5 px-3 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/40 hover:border-rose-500 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-950/40 cursor-pointer"
                >
                  <span>🚪</span>
                  <span>Logout &amp; Return to Login Portal</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Logged-Out State: Prominent Login Button */
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-mono font-bold px-4 py-2 rounded-lg border border-purple-400/50 shadow-lg shadow-purple-500/30 transition-all cursor-pointer animate-pulse"
          >
            <span>🔐</span>
            <span>Sign In (Tenant Portal)</span>
          </button>
        )}
      </div>
    </header>
  );
};
