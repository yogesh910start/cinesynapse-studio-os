import React, { useState, useEffect } from "react";
import { Header } from "./components/common/Header";
import { Sidebar } from "./components/common/Sidebar";
import { StatusBar } from "./components/common/StatusBar";
import { ScenarioTriggers } from "./components/tools/ScenarioTriggers";
import { LiveLogMonitor } from "./components/panels/LiveLogMonitor";
import { StorageManagerPanel } from "./components/panels/StorageManagerPanel";

// Screen Components
import { Screen1Overview } from "./components/screens/Screen1Overview";
import { Screen2CameraSentry } from "./components/screens/Screen2CameraSentry";
import { Screen3SagLikeness } from "./components/screens/Screen3SagLikeness";
import { Screen4GlobalCompliance } from "./components/screens/Screen4GlobalCompliance";
import { Screen5TenantLogin } from "./components/screens/Screen5TenantLogin";
import { Screen6TimelineIngest } from "./components/screens/Screen6TimelineIngest";
import { Screen7SideTools } from "./components/screens/Screen7SideTools";
import { Screen8StudioWarRoom } from "./components/screens/Screen8StudioWarRoom";
import { Screen9StorageVault } from "./components/screens/Screen9StorageVault";
import { EnterpriseLoginScreen } from "./components/screens/EnterpriseLoginScreen";


// Modals
import { CreateProjectModal } from "./components/modals/CreateProjectModal";
import { CreateStudioModal } from "./components/modals/CreateStudioModal";

import { UserProfile, INITIAL_PERSONAS, StudioTenant, MovieProject } from "./types";
import {
  fetchProductionGraph,
  triggerScenario,
  fetchStorageQuota,
  fetchStorageAssets,
  fetchTelemetryLogs,
  logoutSession,
  fetchStudios,
  fetchProjects,
} from "./services/api";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [activeTenant, setActiveTenant] = useState("paramount_pictures");
  const [activeProject, setActiveProject] = useState("CHRONO-2026");
  const [tenantData, setTenantData] = useState<any>(null);

  // Multi-Studio & Multi-Project Hierarchy
  const [studios, setStudios] = useState<StudioTenant[]>([]);
  const [projects, setProjects] = useState<MovieProject[]>([]);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateStudioOpen, setIsCreateStudioOpen] = useState(false);

  // Authentication & User Profile State
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_PERSONAS[0]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Modals & Panels
  const [showLogs, setShowLogs] = useState(false);
  const [showStorage, setShowStorage] = useState(false);
  const [showTriggers, setShowTriggers] = useState(true);

  // Real-Time Logs & Storage State
  const [logs, setLogs] = useState<any[]>([]);
  const [quota, setQuota] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);

  // Load Studios & Projects Hierarchy
  const loadStudiosAndProjects = async () => {
    try {
      const [studiosRes, projectsRes] = await Promise.all([
        fetchStudios().catch(() => []),
        fetchProjects().catch(() => [])
      ]);
      if (Array.isArray(studiosRes) && studiosRes.length > 0) {
        setStudios(studiosRes);
      }
      if (Array.isArray(projectsRes) && projectsRes.length > 0) {
        setProjects(projectsRes);
      }
    } catch (e) {
      console.warn("Failed to load studios/projects:", e);
    }
  };

  // Load Initial Tenant Data
  const loadData = async (tenant = activeTenant, project = activeProject) => {
    try {
      const graph = await fetchProductionGraph(tenant, project);
      setTenantData(graph.dataset);
      const q = await fetchStorageQuota(tenant, project);
      setQuota(q);
      const a = await fetchStorageAssets(tenant, project);
      setAssets(a);
      const l = await fetchTelemetryLogs();
      setLogs(l);
    } catch {
      // Offline graceful fallback
      console.log("Offline mode active: using embedded state");
    }
  };

  useEffect(() => {
    loadStudiosAndProjects();
  }, []);

  useEffect(() => {
    loadData(activeTenant, activeProject);
  }, [activeTenant, activeProject]);

  useEffect(() => {
    const handleStorageRefresh = () => {
      loadData(activeTenant, activeProject);
    };
    window.addEventListener("cinesynapse:refresh-storage", handleStorageRefresh);
    window.addEventListener("cinesynapse:take-recorded", handleStorageRefresh);
    return () => {
      window.removeEventListener("cinesynapse:refresh-storage", handleStorageRefresh);
      window.removeEventListener("cinesynapse:take-recorded", handleStorageRefresh);
    };
  }, [activeTenant, activeProject]);

  // Handle Switching Studio Tenant -> Sync Movie Project
  const handleTenantChange = (newTenant: string) => {
    setActiveTenant(newTenant);
    const tenantProjs = projects.filter((p) => p.tenant_id === newTenant);
    const studioObj = studios.find((s) => s.tenant_id === newTenant);
    let targetProject = "";
    if (studioObj && studioObj.default_project) {
      targetProject = studioObj.default_project;
    } else if (tenantProjs.length > 0) {
      targetProject = tenantProjs[0].project_id;
    }
    setActiveProject(targetProject);
    loadData(newTenant, targetProject);
  };

  // Handle Project Selection
  const handleProjectChange = (newProject: string) => {
    setActiveProject(newProject);
    loadData(activeTenant, newProject);
  };

  // Handle Studio Creation
  const handleStudioCreated = (newStudio: StudioTenant) => {
    setStudios((prev) => [...prev, newStudio]);
    setActiveTenant(newStudio.tenant_id);
    // Prompt to create first project under this brand-new studio
    setIsCreateProjectOpen(true);
  };

  // Handle Project Creation
  const handleProjectCreated = (newProject: MovieProject) => {
    setProjects((prev) => [...prev, newProject]);
    setActiveTenant(newProject.tenant_id);
    setActiveProject(newProject.project_id);
  };

  // Handle Logout Action -> Route to Screen 5
  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveTab("tenant-login");
    logoutSession(activeTenant).catch(console.error);
  };

  // Handle Login Action -> Update User Profile
  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  // Handle Judge Scenario Click
  const handleScenario = async (scenario: string) => {
    try {
      await triggerScenario(scenario, activeTenant);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // If user is logged out, render the dedicated Enterprise Login Screen
  if (!isAuthenticated) {
    return (
      <EnterpriseLoginScreen
        activeTenant={activeTenant}
        onSelectTenant={(t) => handleTenantChange(t)}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0B0D1B] text-slate-100 font-sans">
      {/* Top Header with Studio/Project Selectors & User Profile */}
      <Header
        activeTenant={activeTenant}
        onTenantChange={handleTenantChange}
        activeProject={activeProject}
        onProjectChange={handleProjectChange}
        studios={studios}
        projects={projects}
        onOpenCreateProject={() => setIsCreateProjectOpen(true)}
        onOpenCreateStudio={() => setIsCreateStudioOpen(true)}
        onToggleLogs={() => setShowLogs(!showLogs)}
        onToggleStorage={() => setActiveTab("storage-vault")}
        onToggleTriggers={() => setShowTriggers(!showTriggers)}

        showTriggers={showTriggers}
        currentUser={currentUser}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        onOpenLogin={() => setActiveTab("tenant-login")}
      />

      {/* Floating Demo Trigger Bar */}
      <ScenarioTriggers isVisible={showTriggers} onTrigger={handleScenario} />

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          currentUser={currentUser}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
        />

        <main className="flex-1 flex flex-col overflow-hidden bg-[#0B0D1B]">
          <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === "overview" ? "" : "hidden"}`}>
            <Screen1Overview
              tenantData={tenantData}
              activeProject={activeProject}
              activeTenant={activeTenant}
              onAuditRipple={() => handleScenario("likeness_overage")}
            />
          </div>
          <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === "camera-sentry" ? "" : "hidden"}`}>
            <Screen2CameraSentry
              tenantData={tenantData}
              activeProject={activeProject}
              activeTenant={activeTenant}
              onRemediateDrift={() => handleScenario("timecode_drift")}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          </div>
          <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === "sag-likeness" ? "" : "hidden"}`}>
            <Screen3SagLikeness
              tenantData={tenantData}
              activeProject={activeProject}
              activeTenant={activeTenant}
              isActive={activeTab === "sag-likeness"}
            />
          </div>
          <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === "compliance" ? "" : "hidden"}`}>
            <Screen4GlobalCompliance
              tenantData={tenantData}
              activeProject={activeProject}
              activeTenant={activeTenant}
              onDispatchShotgrid={() => handleScenario("spherex_inpaint")}
            />
          </div>

          <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === "tenant-login" ? "" : "hidden"}`}>
            <Screen5TenantLogin
              activeTenant={activeTenant}
              onSelectTenant={(t) => handleTenantChange(t)}
              currentUser={currentUser}
              isAuthenticated={isAuthenticated}
              onLogin={handleLogin}
              onLogout={handleLogout}
              onProceedToDashboard={() => setActiveTab("overview")}
            />
          </div>
          <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === "editorial-ingest" ? "" : "hidden"}`}>
            <Screen6TimelineIngest />
          </div>
          <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === "side-tools" ? "" : "hidden"}`}>
            <Screen7SideTools />
          </div>
          <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === "war-room" ? "" : "hidden"}`}>
            <Screen8StudioWarRoom activeTenant={activeTenant} />
          </div>
          <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === "storage-vault" ? "" : "hidden"}`}>
            <Screen9StorageVault
              tenantData={tenantData}
              activeTenant={activeTenant}
              activeProject={activeProject}
              isActive={activeTab === "storage-vault"}
            />
          </div>
        </main>
      </div>

      {/* Docked Hollywood-Grade Bottom Telemetry Status Bar */}
      <StatusBar
        activeTenant={activeTenant}
        activeProject={activeProject}
        storageUsage={quota?.used_human || "0.0 PB"}
        storageQuota={quota?.quota_human || "25.0 PB"}
        onOpenStorage={() => setActiveTab("storage-vault")}
        onOpenLogs={() => setShowLogs(true)}
      />

      {/* Live Logger Drawer */}
      <LiveLogMonitor isOpen={showLogs} onClose={() => setShowLogs(false)} logs={logs} />

      {/* Storage Vault Modal */}
      <StorageManagerPanel
        isOpen={showStorage}
        onClose={() => setShowStorage(false)}
        quota={quota}
        assets={assets}
      />

      {/* Create Movie Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        studios={studios}
        activeTenant={activeTenant}
        onProjectCreated={handleProjectCreated}
      />

      {/* Create Studio Modal */}
      <CreateStudioModal
        isOpen={isCreateStudioOpen}
        onClose={() => setIsCreateStudioOpen(false)}
        onStudioCreated={handleStudioCreated}
      />
    </div>

  );
};
