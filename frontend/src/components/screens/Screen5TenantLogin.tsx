import React, { useState } from "react";
import { fetchAuthToken } from "../../services/api";
import { UserProfile, INITIAL_PERSONAS } from "../../types";

interface Screen5Props {
  activeTenant: string;
  onSelectTenant: (tenant: string) => void;
  currentUser?: UserProfile;
  isAuthenticated?: boolean;
  onLogin?: (user: UserProfile) => void;
  onLogout?: () => void;
  onProceedToDashboard?: () => void;
}

export const Screen5TenantLogin: React.FC<Screen5Props> = ({
  activeTenant,
  onSelectTenant,
  currentUser,
  isAuthenticated = true,
  onLogin,
  onLogout,
  onProceedToDashboard,
}) => {
  const [selectedPersona, setSelectedPersona] = useState<UserProfile>(
    currentUser || INITIAL_PERSONAS[0]
  );
  const [authStatus, setAuthStatus] = useState<"IDLE" | "AUTHENTICATING" | "AUTHENTICATED" | "REVOKED">(
    isAuthenticated ? "AUTHENTICATED" : "REVOKED"
  );
  const [sessionToken, setSessionToken] = useState<string>(
    isAuthenticated
      ? "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlbGVuYS1sZWdhbCIsInRlbmFudF9pZCI6InBhcmFtb3VudF9waWN0dXJlcyIsInJvbGUiOiJwcm9kdWN0aW9uX2F0dG9ybmV5IiwiZXhwIjoxNzkxNTU4MDAwfQ.simulated_c2pa_sig"
      : ""
  );
  const [activeTab, setActiveTab] = useState<"SESSION" | "RLS_EXPLORER" | "SECURITY_AUDIT">("SESSION");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSSOLogin = async (provider: string) => {
    setAuthStatus("AUTHENTICATING");
    try {
      const res = await fetchAuthToken(activeTenant, selectedPersona.role, selectedPersona.id);
      const token = res.access_token || "cs_jwt_sec_" + Math.random().toString(36).substring(2);
      setSessionToken(token);
      setAuthStatus("AUTHENTICATED");
      const loggedUser = { ...selectedPersona, tenantId: activeTenant, token };
      if (onLogin) onLogin(loggedUser);
      showToast(`SSO Handshake verified via ${provider}! Authenticated as ${selectedPersona.name}`);
    } catch {
      const token = "cs_jwt_offline_" + Math.random().toString(36).substring(2);
      setSessionToken(token);
      setAuthStatus("AUTHENTICATED");
      const loggedUser = { ...selectedPersona, tenantId: activeTenant, token };
      if (onLogin) onLogin(loggedUser);
      showToast(`Local SSO fallback token issued for ${selectedPersona.name}`);
    }
  };

  const handleDirectLogin = (persona: UserProfile) => {
    setSelectedPersona(persona);
    setAuthStatus("AUTHENTICATED");
    const token = "cs_jwt_persona_" + Math.random().toString(36).substring(2);
    setSessionToken(token);
    const loggedUser = { ...persona, tenantId: activeTenant, token };
    if (onLogin) onLogin(loggedUser);
    showToast(`Authenticated as ${persona.name} (${persona.role})`);
  };

  const handleLogoutAction = () => {
    setAuthStatus("REVOKED");
    setSessionToken("");
    if (onLogout) onLogout();
    showToast("Session revoked! Strict RLS session boundary terminated.");
  };

  const tenantNames: Record<string, { label: string; project: string; camera: string }> = {
    paramount_pictures: { label: "Paramount Pictures", project: "CHRONO-2026", camera: "ARRIRAW 4.6K 24.000fps" },
    a24_films: { label: "A24 Films", project: "NEON-GHOST", camera: "Cooke Anamorphic 35mm ACEScg" },
    warner_bros: { label: "Warner Bros. Discovery", project: "APEX-2026", camera: "IMAX 70mm / ACES AP0" }
  };

  const currentStudio = tenantNames[activeTenant] || tenantNames["paramount_pictures"];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-purple-600 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-purple-400 font-mono text-xs flex items-center gap-2 animate-bounce">
          <span>🛡️</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <span>Enterprise Multi-Tenant SaaS Identity &amp; RLS Security Portal</span>
            {isAuthenticated ? (
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                &check; Zero-Trust RLS Active
              </span>
            ) : (
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                🔒 Logged Out / Authentication Required
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cryptographic tenant boundaries, Okta/Google BeyondCorp OIDC federation, and ClickHouse Row-Level Security policies.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400">Current Partition:</span>
          <span className="px-2.5 py-1 rounded bg-[#151830] border border-purple-500/40 text-purple-300 font-bold">
            tenant_id = '{activeTenant}'
          </span>
        </div>
      </div>

      {/* Logged-Out Prompt Banner */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-purple-900/30 via-indigo-900/30 to-slate-900/40 border border-purple-500/40 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xl shrink-0">
              🔑
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Studio Session Logged Out</h4>
              <p className="text-xs text-slate-300">
                Select your studio tenant, choose a persona or authenticate via Okta / Google Workspace to restore active RLS access.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleSSOLogin("Okta Studio Identity")}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-mono font-bold rounded-lg border border-purple-400/50 shadow-lg shadow-purple-500/30 transition-all shrink-0 cursor-pointer"
          >
            Sign In with Okta SSO →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Persona & Studio Selection (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Studio Selector Card */}
          <div className="bg-[#121528] border border-[#262A4A] rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#262A4A] pb-3 text-xs font-mono">
              <span className="text-slate-300 font-bold flex items-center gap-2">
                <span>🏢</span> Studio Tenant Organization
              </span>
              <span className="text-emerald-400 font-bold">&check; RLS Isolated</span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <label className="text-slate-400">Active Tenant Organization</label>
              <select
                value={activeTenant}
                onChange={(e) => {
                  onSelectTenant(e.target.value);
                  showToast(`Switched active tenant to ${e.target.value}`);
                }}
                className="w-full bg-[#151830] border border-[#262A4A] hover:border-purple-500 text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-purple-500 cursor-pointer font-sans text-sm"
              >
                <option value="paramount_pictures">Paramount Pictures (CHRONO-2026)</option>
                <option value="a24_films">A24 Films (NEON-GHOST)</option>
                <option value="warner_bros">Warner Bros. Discovery (APEX-2026)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-[11px] pt-1">
              <div className="bg-[#151830] p-2.5 rounded-lg border border-[#262A4A]">
                <div className="text-slate-500">Active Tentpole:</div>
                <div className="text-white font-bold mt-0.5">{currentStudio.project}</div>
              </div>
              <div className="bg-[#151830] p-2.5 rounded-lg border border-[#262A4A]">
                <div className="text-slate-500">Camera Pipeline:</div>
                <div className="text-cyan-300 font-bold mt-0.5">{currentStudio.camera}</div>
              </div>
            </div>
          </div>

          {/* Persona Switcher Card */}
          <div className="bg-[#121528] border border-[#262A4A] rounded-xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#262A4A] pb-3 text-xs font-mono">
              <span className="text-slate-300 font-bold flex items-center gap-2">
                <span>🎭</span> Multi-Tenant Persona &amp; Clearance
              </span>
              <span className="text-slate-500 text-[10px]">Select to Authenticate</span>
            </div>

            <div className="space-y-2">
              {INITIAL_PERSONAS.map((p) => {
                const isSelected = selectedPersona.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleDirectLogin(p)}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-3 ${
                      isSelected && isAuthenticated
                        ? "bg-purple-900/30 border-purple-500/60 shadow-md shadow-purple-500/10"
                        : "bg-[#151830] border-[#262A4A] hover:border-slate-600 hover:bg-[#1A1E38]"
                    }`}
                  >
                    <span className="text-2xl mt-0.5">{p.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">{p.name}</span>
                        {isSelected && isAuthenticated ? (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300">
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700/40 text-slate-400">
                            Sign In
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-purple-300 font-mono truncate">{p.role}</div>
                      <div className="text-[10px] text-slate-400 mt-1 truncate">{p.clearance}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SSO Authentication Action Buttons */}
          <div className="bg-[#121528] border border-[#262A4A] rounded-xl p-5 shadow-xl space-y-3 font-mono text-xs">
            <div className="text-slate-300 font-bold">Enterprise SSO Federation Handshake</div>
            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => handleSSOLogin("Okta Studio Identity")}
                disabled={authStatus === "AUTHENTICATING"}
                className="w-full py-2.5 px-4 rounded-lg bg-[#1A1E38] hover:bg-[#262A4A] text-white text-xs font-mono font-medium border border-[#262A4A] hover:border-cyan-500/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>🛡️</span>
                <span>Sign in with Okta Studio Identity (OIDC)</span>
              </button>
              <button
                onClick={() => handleSSOLogin("Google Workspace BeyondCorp")}
                disabled={authStatus === "AUTHENTICATING"}
                className="w-full py-2.5 px-4 rounded-lg bg-[#1A1E38] hover:bg-[#262A4A] text-white text-xs font-mono font-medium border border-[#262A4A] hover:border-purple-500/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>🌐</span>
                <span>Continue with Google Workspace (BeyondCorp)</span>
              </button>
            </div>

            {/* Logout Action Button */}
            {isAuthenticated ? (
              <button
                onClick={handleLogoutAction}
                className="w-full py-2.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>🚪</span>
                <span>Logout Current Session (Terminate Tokens)</span>
              </button>
            ) : (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-[11px] text-center">
                User logged out. Select a persona above or click an SSO provider to sign in.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Session, JWT Inspector, & RLS Details (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Tab Selector */}
          <div className="flex items-center gap-2 border-b border-[#262A4A] pb-2 font-mono text-xs">
            <button
              onClick={() => setActiveTab("SESSION")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                activeTab === "SESSION"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                  : "bg-[#151830] text-slate-400 hover:text-white"
              }`}
            >
              Active Session Claims
            </button>
            <button
              onClick={() => setActiveTab("RLS_EXPLORER")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                activeTab === "RLS_EXPLORER"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                  : "bg-[#151830] text-slate-400 hover:text-white"
              }`}
            >
              ClickHouse RLS Predicate
            </button>
            <button
              onClick={() => setActiveTab("SECURITY_AUDIT")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                activeTab === "SECURITY_AUDIT"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                  : "bg-[#151830] text-slate-400 hover:text-white"
              }`}
            >
              MPAA &amp; SOC2 Audit Trail
            </button>
          </div>

          {/* TAB 1: ACTIVE SESSION CLAIMS */}
          {activeTab === "SESSION" && (
            <div className="bg-[#121528] border border-[#262A4A] rounded-xl p-5 shadow-xl space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#262A4A] pb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isAuthenticated && authStatus === "AUTHENTICATED" ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`} />
                  <span className="text-white font-bold">
                    {isAuthenticated && authStatus === "AUTHENTICATED" ? "Session Active (RS256 Verified)" : "Session Revoked / Logged Out"}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {isAuthenticated ? `Expires in: ${selectedPersona.expiresIn || "07h 59m 42s"}` : "No Active Lease"}
                </span>
              </div>

              {/* Claims Grid */}
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="bg-[#151830] p-3 rounded-lg border border-[#262A4A]">
                  <div className="text-slate-500 text-[10px]">Subject (User ID):</div>
                  <div className="text-cyan-300 font-bold mt-0.5">{selectedPersona.id}</div>
                </div>
                <div className="bg-[#151830] p-3 rounded-lg border border-[#262A4A]">
                  <div className="text-slate-500 text-[10px]">Tenant Partition:</div>
                  <div className="text-purple-300 font-bold mt-0.5">{activeTenant}</div>
                </div>
                <div className="bg-[#151830] p-3 rounded-lg border border-[#262A4A]">
                  <div className="text-slate-500 text-[10px]">RBAC Role:</div>
                  <div className="text-amber-300 font-bold mt-0.5">{selectedPersona.role}</div>
                </div>
                <div className="bg-[#151830] p-3 rounded-lg border border-[#262A4A]">
                  <div className="text-slate-500 text-[10px]">C2PA Cryptographic Signature:</div>
                  <div className="text-emerald-400 font-bold mt-0.5">&check; Hardware Root of Trust</div>
                </div>
              </div>

              {/* Scopes Array */}
              <div className="space-y-1.5">
                <div className="text-slate-400 text-[11px]">Authorized Functional Scopes (OAuth 2.0 / OIDC):</div>
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  {["likeness:read", "likeness:extend", "sentry:remediate", "compliance:inpaint", "timeline:conform", "c2pa:verify"].map((scope) => (
                    <span key={scope} className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                      {scope}
                    </span>
                  ))}
                </div>
              </div>

              {/* Raw Bearer Token */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Simulated JWT Session Token:</span>
                  {sessionToken && (
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(sessionToken);
                        showToast("Copied JWT bearer token to clipboard!");
                      }}
                      className="text-cyan-400 hover:underline text-[10px]"
                    >
                      Copy Token
                    </button>
                  )}
                </div>
                <pre className="p-3 bg-[#090B16] border border-[#262A4A] rounded-lg text-[10px] text-slate-300 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                  {sessionToken || "NO_ACTIVE_SESSION (LOGGED OUT)"}
                </pre>
              </div>

              {/* Proceed to Dashboard Button (if authenticated) */}
              {isAuthenticated && onProceedToDashboard && (
                <div className="pt-2">
                  <button
                    onClick={onProceedToDashboard}
                    className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
                  >
                    <span>🚀</span>
                    <span>Launch Studio Workspace (Production Graph) →</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CLICKHOUSE RLS EXPLORER */}
          {activeTab === "RLS_EXPLORER" && (
            <div className="bg-[#121528] border border-[#262A4A] rounded-xl p-5 shadow-xl space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#262A4A] pb-3">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <span>🔒</span> ClickHouse Columnar Row-Level Security Policy
                </span>
                <span className="text-[10px] text-slate-400">Enforced on every query</span>
              </div>

              <div className="p-3.5 bg-[#090B16] border border-emerald-500/30 rounded-lg text-emerald-300 space-y-2 text-[11px]">
                <div className="text-[10px] text-slate-500">Active Row Policy Definition:</div>
                <code>
                  CREATE ROW POLICY rls_{activeTenant}_policy<br />
                  ON cine_synapse.production_graph<br />
                  FOR SELECT<br />
                  USING (tenant_id = '{activeTenant}')<br />
                  TO ALL EXCEPT admin;
                </code>
              </div>

              <div className="space-y-2 text-[11px] text-slate-300 leading-relaxed">
                <div className="font-bold text-white">Cryptographic Multi-Tenant Guarantee:</div>
                <p>
                  No query executed by <code className="text-purple-300">{currentStudio.label}</code> can inspect, scan, or aggregate rows belonging to other studios. Every read/write query automatically appends the cryptographic predicate.
                </p>
                <div className="p-3 bg-[#151830] rounded border border-[#262A4A] text-[10px] text-slate-400">
                  Verified Invariant: Data contamination probability = 0.0000%. Certified for MPAA Best Practices v5.2.
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY AUDIT */}
          {activeTab === "SECURITY_AUDIT" && (
            <div className="bg-[#121528] border border-[#262A4A] rounded-xl p-5 shadow-xl space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#262A4A] pb-3">
                <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                  <span>📋</span> Compliance &amp; Audit Trail Ledger
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">SOC 2 Type II Certified</span>
              </div>

              <div className="space-y-2.5 text-[11px]">
                <div className="p-3 bg-[#151830] border border-[#262A4A] rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold">C2PA Hardware Manifest Validation</div>
                    <div className="text-[10px] text-slate-400">Sony Venice 2 / ARRI Alexa 35 secure enclave certificate verified.</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">PASS</span>
                </div>

                <div className="p-3 bg-[#151830] border border-[#262A4A] rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold">SAG-AFTRA 2026 Residuals Ledger Audit</div>
                    <div className="text-[10px] text-slate-400">Schedule A digital likeness consent tokens registered in ClickHouse.</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">PASS</span>
                </div>

                <div className="p-3 bg-[#151830] border border-[#262A4A] rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold">Multi-Cloud BeyondCorp IP Filtering</div>
                    <div className="text-[10px] text-slate-400">Only authorized production lot &amp; editorial IP ranges permitted.</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">PASS</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
