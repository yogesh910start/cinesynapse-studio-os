import React from "react";
import { UserProfile } from "../../types";

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  sentryCount?: number;
  currentUser?: UserProfile;
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  sentryCount = 3,
  currentUser,
  isAuthenticated = true,
  onLogout,
}) => {
  const navItems = [
    { id: "overview", label: "Production Graph", icon: "🕸️", desc: "Executive Macro View" },
    { id: "camera-sentry", label: "On-Set Camera Sentry", icon: "🎥", desc: "ARRI C2C & Timecode", badge: sentryCount },
    { id: "sag-likeness", label: "SAG-AFTRA Likeness", icon: "⚖️", desc: "NO FAKES Act Caps", badge: "87%" },
    { id: "compliance", label: "190-Territory Compliance", icon: "🌍", desc: "Spherex & Inpaint", badge: "2" },
    { id: "editorial-ingest", label: "Timeline Ingest Hub", icon: "🎞️", desc: "OTIO / EDL / PDF" },
    { id: "storage-vault", label: "Storage & Security Vault", icon: "📦", desc: "25 PB Multi-Tier & TPN", badge: "25 PB" },
    { id: "side-tools", label: "Studio Copilot & Tools", icon: "✨", desc: "Scratchpad & Stills" },

    { id: "war-room", label: "Studio War Room", icon: "🔒", desc: "Comms & Live Huddles", badge: "TPN+" },
    { id: "tenant-login", label: "SaaS Tenant Portal", icon: "🏢", desc: "Okta SSO & RLS" },
  ];

  return (
    <aside className="w-64 border-r border-[#262A4A] bg-[#0E1122] flex flex-col justify-between py-4 select-none shrink-0">
      <div className="space-y-1 px-3">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-semibold">
          Studio Operational Views
        </div>
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-[#8B5CF6]/15 text-purple-300 border border-[#8B5CF6]/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#151830]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{item.icon}</span>
                <div>
                  <div className={isActive ? "text-white font-semibold" : ""}>{item.label}</div>
                  <div className="text-[10px] text-slate-500">{item.desc}</div>
                </div>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    typeof item.badge === "number"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User Profile Footer Card */}
      <div className="px-3 space-y-3">
        {currentUser && isAuthenticated ? (
          <div className="bg-[#151830] border border-[#262A4A] rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-inner">
            <button
              onClick={() => onSelectTab("tenant-login")}
              className="flex items-center gap-2 text-left min-w-0 flex-1 hover:opacity-80 transition-opacity"
              title="Click to manage profile on Tenant Portal"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-base shrink-0">
                {currentUser.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate leading-tight">
                  {currentUser.name.split(",")[0]}
                </div>
                <div className="text-[10px] text-purple-300 font-mono truncate leading-none mt-0.5">
                  {currentUser.role.split("/")[0].trim()}
                </div>
              </div>
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Logout & return to Login Portal"
                className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 flex items-center justify-center text-xs transition-colors shrink-0 cursor-pointer"
              >
                🚪
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => onSelectTab("tenant-login")}
            className="w-full py-2 px-3 rounded-xl bg-purple-900/30 hover:bg-purple-900/40 border border-purple-500/40 text-purple-300 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>🔑</span>
            <span>Sign In to Tenant Portal</span>
          </button>
        )}

        {/* Security Compliance Footer */}
        <div className="px-3 pt-2 border-t border-[#262A4A] text-[10px] font-mono text-slate-500">
          <div className="text-slate-400 font-medium">MPAA Content Security</div>
          <div className="text-[9px] text-slate-600">SOC 2 Type II / C2PA Provenance</div>
        </div>
      </div>
    </aside>
  );
};
