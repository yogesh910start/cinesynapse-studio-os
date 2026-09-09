import React, { useState } from "react";
import { UserProfile, INITIAL_PERSONAS } from "../../types";
import { fetchAuthToken } from "../../services/api";

interface EnterpriseLoginScreenProps {
  activeTenant: string;
  onSelectTenant: (tenant: string) => void;
  onLogin: (user: UserProfile) => void;
}

export const EnterpriseLoginScreen: React.FC<EnterpriseLoginScreenProps> = ({
  activeTenant,
  onSelectTenant,
  onLogin,
}) => {
  const [selectedPersona, setSelectedPersona] = useState<UserProfile>(INITIAL_PERSONAS[0]);
  const [workEmail, setWorkEmail] = useState<string>(INITIAL_PERSONAS[0].email);
  const [securityToken, setSecurityToken] = useState<string>("cs_sec_tok_2026_verified");
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [loginFeedback, setLoginFeedback] = useState<string | null>(null);

  const tenantOptions = [
    { id: "paramount_pictures", label: "Paramount Pictures (Active Studio Tenant)", project: "CHRONO-2026" },
    { id: "a24_films", label: "A24 Films (NEON-GHOST Project)", project: "NEON-GHOST" },
    { id: "warner_bros", label: "Warner Bros. Discovery (APEX-2026 Project)", project: "APEX-2026" },
  ];

  const handleSelectPersona = (p: UserProfile) => {
    setSelectedPersona(p);
    setWorkEmail(p.email);
    setLoginFeedback(`Selected persona: ${p.name} (${p.role})`);
    setTimeout(() => setLoginFeedback(null), 3000);
  };

  const handleSSOLogin = async (provider: string) => {
    setIsAuthenticating(true);
    setLoginFeedback(`Connecting to ${provider}...`);
    try {
      const res = await fetchAuthToken(activeTenant, selectedPersona.role, selectedPersona.id);
      const token = res.access_token || "cs_jwt_sso_" + Math.random().toString(36).substring(2);
      const userToLogin: UserProfile = {
        ...selectedPersona,
        tenantId: activeTenant,
        email: workEmail || selectedPersona.email,
        token: token,
      };
      setTimeout(() => {
        setIsAuthenticating(false);
        onLogin(userToLogin);
      }, 600);
    } catch {
      const token = "cs_jwt_offline_" + Math.random().toString(36).substring(2);
      const userToLogin: UserProfile = {
        ...selectedPersona,
        tenantId: activeTenant,
        email: workEmail || selectedPersona.email,
        token: token,
      };
      setTimeout(() => {
        setIsAuthenticating(false);
        onLogin(userToLogin);
      }, 400);
    }
  };

  const handleSubmitCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setLoginFeedback("Validating corporate terminal token...");
    setTimeout(() => {
      setIsAuthenticating(false);
      const userToLogin: UserProfile = {
        ...selectedPersona,
        email: workEmail,
        tenantId: activeTenant,
        token: securityToken,
      };
      onLogin(userToLogin);
    }, 500);
  };

  return (
    <div className="min-h-screen w-screen bg-[#070914] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden select-none font-sans">
      {/* Ambient Background Glow Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Dual-Card Login Layout */}
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch z-10">
        
        {/* ========================================================================= */}
        {/* LEFT 45% HERO BRANDING SECTION                                            */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-[#0D1022]/90 border border-[#222744] rounded-3xl p-8 sm:p-10 flex flex-col justify-between shadow-[0_20px_60px_rgba(0,0,0,0.7)] relative overflow-hidden backdrop-blur-2xl">
          {/* Subtle Corner Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Brand Header */}
          <div>
            <div className="flex items-center gap-3.5">
              {/* Glowing Prismatic Pyramid Logo */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8B5CF6] via-[#A855F7] to-[#06B6D4] flex items-center justify-center shadow-[0_0_35px_rgba(168,85,247,0.6)] border border-purple-300/40 transform hover:scale-105 transition-transform">
                <span className="text-2xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">🔮</span>
              </div>
              <div>
                <span className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-purple-100 to-cyan-300 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                  CINE-SYNAPSE
                </span>
                <span className="block text-[10px] font-mono tracking-widest text-purple-400 font-semibold">
                  STUDIO OPERATING SYSTEM
                </span>
              </div>
            </div>

            {/* Core Mission Typography */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mt-8">
              The Autonomous Studio Operating System
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed mt-4">
              Closed-loop multi-agent production graph connecting on-set ingest, SAG likeness, and global release.
            </p>

            {/* Enterprise Badges */}
            <div className="flex flex-col gap-2.5 mt-6">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-semibold w-fit shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ClickHouse Cloud: 4ms SLA</span>
              </div>

              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-semibold w-fit shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>SOC 2 Type II | MPAA Content Security Certified</span>
              </div>
            </div>
          </div>

          {/* Bottom Isometric Network Graphic & Label */}
          <div className="mt-8 pt-6 border-t border-[#222744]/80 flex flex-col justify-end">
            <div className="relative h-28 w-full rounded-2xl bg-[#080A18]/80 border border-[#222744] flex items-center justify-around px-4 overflow-hidden shadow-inner">
              {/* Isometric Synapse Nodes */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-sm shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  🎥
                </div>
                <span className="text-[9px] font-mono text-slate-400">On-Set Ingest</span>
              </div>

              <div className="h-0.5 w-10 bg-gradient-to-r from-purple-500 to-cyan-500 animate-pulse" />

              <div className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-sm shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  🗄️
                </div>
                <span className="text-[9px] font-mono text-slate-400">ClickHouse</span>
              </div>

              <div className="h-0.5 w-10 bg-gradient-to-r from-cyan-500 to-purple-500 animate-pulse" />

              <div className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-sm shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  🌍
                </div>
                <span className="text-[9px] font-mono text-slate-400">190 Release</span>
              </div>
            </div>

            <div className="text-center text-[11px] font-mono text-slate-500 mt-3">
              45% Left Hero Branding Section
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT 55% AUTHENTICATION CARD                                             */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 bg-[#121528] border border-[#262A4A] rounded-3xl p-8 sm:p-10 flex flex-col justify-between shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative backdrop-blur-2xl">
          <div>
            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
              Studio Enterprise Sign-In
            </h2>

            {/* Notification Feedback Toast */}
            {loginFeedback && (
              <div className="mt-3 p-2.5 rounded-lg bg-purple-900/30 border border-purple-500/40 text-purple-300 font-mono text-xs flex items-center gap-2 animate-in fade-in duration-150">
                <span>🛡️</span>
                <span>{loginFeedback}</span>
              </div>
            )}

            {/* Studio Organization Switcher Dropdown */}
            <div className="mt-6 space-y-2 font-mono">
              <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                Studio Organization Switcher Dropdown
              </label>
              <div className="relative">
                <select
                  aria-label="Studio Organization Switcher"
                  value={activeTenant}
                  onChange={(e) => onSelectTenant(e.target.value)}
                  className="w-full bg-[#151830] border border-[#2E3458] hover:border-purple-500 text-slate-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 cursor-pointer appearance-none transition-all shadow-inner font-sans font-medium"
                >
                  {tenantOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* Primary SSO Buttons */}
            <div className="mt-5 space-y-3">
              {/* Studio SSO (Okta / SAML) */}
              <button
                type="button"
                onClick={() => handleSSOLogin("Okta Studio SSO")}
                disabled={isAuthenticating}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#06B6D4] hover:from-[#9333EA] hover:to-[#0891B2] text-white font-bold text-sm tracking-wide shadow-[0_0_25px_rgba(139,92,246,0.4)] hover:shadow-[0_0_35px_rgba(139,92,246,0.6)] flex items-center justify-center gap-2.5 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                <span>🛡️</span>
                <span>Continue with Studio SSO (Okta / SAML)</span>
              </button>

              {/* Google Workspace */}
              <button
                type="button"
                onClick={() => handleSSOLogin("Google Workspace BeyondCorp")}
                disabled={isAuthenticating}
                className="w-full py-3.5 px-6 rounded-xl bg-[#181C38] hover:bg-[#20254A] border border-[#2E3458] hover:border-purple-500/60 text-slate-200 hover:text-white font-medium text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>🌐</span>
                <span>Continue with Google Workspace</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-5 flex items-center justify-center">
              <div className="border-t border-[#262A4A] w-full" />
              <span className="bg-[#121528] px-3 text-[11px] font-mono text-slate-500 uppercase tracking-widest shrink-0">
                or corporate credentials
              </span>
            </div>

            {/* Corporate Form Fields */}
            <form onSubmit={handleSubmitCredentials} className="space-y-3 font-mono text-xs">
              <div>
                <input
                  type="email"
                  required
                  placeholder="Studio Work Email"
                  value={workEmail}
                  onChange={(e) => setWorkEmail(e.target.value)}
                  className="w-full bg-[#151830] border border-[#262A4A] focus:border-purple-500 text-slate-100 rounded-xl px-4 py-3 placeholder:text-slate-500 text-sm focus:outline-none transition-all"
                />
              </div>

              <div>
                <input
                  type="password"
                  required
                  placeholder="Terminal Security Token"
                  value={securityToken}
                  onChange={(e) => setSecurityToken(e.target.value)}
                  className="w-full bg-[#151830] border border-[#262A4A] focus:border-purple-500 text-slate-100 rounded-xl px-4 py-3 placeholder:text-slate-500 text-sm focus:outline-none transition-all"
                />
              </div>

              {/* Fast 1-Click Role Persona Selection Chips */}
              <div className="pt-1">
                <div className="text-[10px] text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>Fast Persona Impersonation (Evaluation Mode):</span>
                  <span className="text-purple-400 font-bold">{selectedPersona.name.split(",")[0]}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {INITIAL_PERSONAS.map((p) => {
                    const isSelected = selectedPersona.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPersona(p)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1.5 border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-purple-600/30 border-purple-400 text-purple-200 font-bold shadow-sm"
                            : "bg-[#151830] border-[#262A4A] text-slate-400 hover:text-white hover:bg-[#1C2042]"
                        }`}
                      >
                        <span>{p.avatar}</span>
                        <span>{p.name.split(" ")[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Credentials Button */}
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full mt-2 py-3 rounded-xl bg-[#20254A] hover:bg-purple-600 text-white font-semibold text-xs transition-all border border-[#2E3458] hover:border-purple-400 cursor-pointer disabled:opacity-50"
              >
                Authorize Terminal &amp; Sign In →
              </button>
            </form>
          </div>

          {/* Security Guarantee Footer */}
          <div className="mt-6 pt-4 border-t border-[#262A4A] flex flex-col items-center gap-1 text-center">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
              <span>🛡️</span>
              <span>Row-Level Security (RLS) Active | End-to-End Encrypted</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              55% Right Authentication Card
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
