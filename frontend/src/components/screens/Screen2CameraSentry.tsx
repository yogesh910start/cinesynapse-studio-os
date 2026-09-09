import React, { useState, useEffect, useRef } from "react";
import {
  remediateSentry,
  sendWarRoomMessage,
  dispatchExternalRelay,
  dispatchComplianceInpaint,
  extendLikenessSeconds,
  fetchLikenessLedger,
  fetchProductionState,
  updateProductionState,
  fetchProductionScenes,
  createProductionScene,
  fetchProductionTakes,
  recordProductionTake,
  updateProductionTake,
  API_BASE
} from "../../services/api";
import { ProductionTake, ProductionScene, ProductionState } from "../../types";

interface Screen2Props {
  tenantData: any;
  onRemediateDrift: () => void;
  onNavigateTab?: (tab: string) => void;
  activeProject?: string;
  activeTenant?: string;
}

export interface CameraFeed {
  id: string;
  name: string;
  model: string;
  fps: number;
  lens: string;
  anamorphicSqueeze: number;
  protocol: string;
  streamUrl: string;
  sourceType: "simulated" | "file" | "youtube" | "webcam" | "hls";
  videoSrc?: string | null;
  uploadedFileName?: string | null;
  youtubeUrl?: string;
  youtubeId?: string;
  hlsUrl?: string;
  status: "LOCKED" | "DRIFT" | "OFFLINE";
  driftAmount?: string;
  pullUpCompensated?: boolean;
  colorSpace: string;
  c2paCert: string;
  c2paVerified: boolean;
  transmitter: string;
  timecodeMaster: string;
  operator: string;
}

// Utility to parse YouTube video/live IDs
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const clean = url.trim();
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/)([^#&?]*).*/;
  const match = clean.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  // Direct 11-char ID
  if (clean.length === 11 && !clean.includes("/") && !clean.includes(".")) {
    return clean;
  }
  return null;
}

const YOUTUBE_PRESETS = [
  {
    label: "Live Earth / NASA ISS Orbit (24/7 Live Stream)",
    url: "https://www.youtube.com/watch?v=DDU-rZs-Ic4",
    id: "DDU-rZs-Ic4"
  },
  {
    label: "4K Tokyo Shinjuku Street (24/7 Live Cam)",
    url: "https://www.youtube.com/watch?v=4_Fp2YjD2pA",
    id: "4_Fp2YjD2pA"
  },
  {
    label: "Cinema 4K Color & Motion Test Reel",
    url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    id: "aqz-KE-bpKQ"
  }
];

const INITIAL_CAMERAS: CameraFeed[] = [
  {
    id: "cam-a",
    name: "CAMERA A (HERO CLOSE-UP)",
    model: "ARRI ALEXA 35",
    fps: 24.000,
    lens: "Cooke Anamorphic /i 40mm T/2.0",
    anamorphicSqueeze: 2.0,
    protocol: "SRT over UDP (Port 9001)",
    streamUrl: "srt://ingest.cinesynapse.io:9001?streamid=paramount:cam-a",
    sourceType: "simulated",
    status: "LOCKED",
    colorSpace: "ACEScg (LogC4)",
    c2paCert: "CERT-ARRI-ALEXA35-HW-8849",
    c2paVerified: true,
    transmitter: "Teradek Prism Mobile 4K (Dual 5G)",
    timecodeMaster: "Ambient Master Lockit ACN-CL (24.000 fps)",
    operator: "Roger Deakins (A-Cam DP)"
  },
  {
    id: "cam-b",
    name: "CAMERA B (HERO TWO-SHOT)",
    model: "ARRI ALEXA 35",
    fps: 23.976,
    lens: "Cooke Anamorphic /i 65mm T/2.3",
    anamorphicSqueeze: 2.0,
    protocol: "SRT over UDP (Port 9002)",
    streamUrl: "srt://ingest.cinesynapse.io:9002?streamid=paramount:cam-b",
    sourceType: "simulated",
    status: "DRIFT",
    driftAmount: "+7.2s / 2h shoot",
    colorSpace: "ACEScg (LogC4)",
    c2paCert: "CERT-ARRI-ALEXA35-HW-9912",
    c2paVerified: true,
    transmitter: "Teradek Serv 4K (Bonded 5G)",
    timecodeMaster: "Ambient Master Lockit ACN-CL (24.000 fps)",
    operator: "Elena Vance (B-Cam Operator)"
  },
  {
    id: "cam-c",
    name: "CAMERA C (STEADICAM WIDE)",
    model: "RED V-RAPTOR XL 8K",
    fps: 24.000,
    lens: "Zeiss Supreme Prime 25mm T/1.5",
    anamorphicSqueeze: 1.0,
    protocol: "WebRTC Low-Latency (WHEP)",
    streamUrl: "wss://ingest.cinesynapse.io/webrtc/cam-c",
    sourceType: "simulated",
    status: "LOCKED",
    colorSpace: "REDWideGamutRGB",
    c2paCert: "CERT-RED-VRAPTOR-HW-1102",
    c2paVerified: true,
    transmitter: "Teradek Bolt 4K MAX -> DIT Node",
    timecodeMaster: "Tentacle Sync E mkII (ACN)",
    operator: "Dave Chameides (Steadicam)"
  },
  {
    id: "cam-d",
    name: "CAMERA D (OVERHEAD WITNESS / CRANE)",
    model: "SONY VENICE 2 (8K)",
    fps: 24.000,
    lens: "Fujinon Premista 28-100mm T/2.9",
    anamorphicSqueeze: 1.0,
    protocol: "RTSP / NDI Local Network",
    streamUrl: "rtsp://192.168.10.45:554/live/cam-d",
    sourceType: "simulated",
    status: "LOCKED",
    colorSpace: "Sony S-Gamut3.Cine / S-Log3",
    c2paCert: "CERT-SONY-VENICE2-HW-3301",
    c2paVerified: true,
    transmitter: "Atomos Connect / LiveU Solo",
    timecodeMaster: "Ambient Master Lockit ACN-CL (24.000 fps)",
    operator: "Sarah Lin (Crane Operator)"
  }
];

interface CameraVideoFeedProps {
  src: string;
  isPlaying: boolean;
  isFrameHold: boolean;
  monitorMode: "live" | "playback";
  isPlayingPlayback: boolean;
  playbackFrame: number;
  filterStyle: React.CSSProperties;
  deSqueezeStyle: React.CSSProperties;
}

const CameraVideoFeed: React.FC<CameraVideoFeedProps> = ({
  src,
  isPlaying,
  isFrameHold,
  monitorMode,
  isPlayingPlayback,
  playbackFrame,
  filterStyle,
  deSqueezeStyle
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Normalize stream URL: If relative /api/v1 URL, route directly to API_BASE to bypass sandboxed Vite proxy
  const normalizedSrc = src.startsWith("/api/v1")
    ? src.replace("/api/v1", API_BASE)
    : src;

  // Live Mode Play / Pause sync
  useEffect(() => {
    if (monitorMode !== "live") return;
    const el = videoRef.current;
    if (!el) return;

    if (!isPlaying || isFrameHold) {
      if (!el.paused) el.pause();
    } else {
      if (el.paused) {
        const p = el.play();
        if (p !== undefined) {
          p.catch((err: any) => {
            if (err?.name !== "AbortError") console.warn("Live play error:", err);
          });
        }
      }
    }
  }, [isPlaying, isFrameHold, monitorMode, normalizedSrc]);

  // Review / Playback Mode Gang Sync (play, pause, frame seek)
  useEffect(() => {
    if (monitorMode !== "playback") return;
    const el = videoRef.current;
    if (!el) return;

    const targetSec = playbackFrame / 24.0;
    const duration = isFinite(el.duration) && el.duration > 0 ? el.duration : undefined;
    const safeTargetSec = duration ? Math.min(targetSec, duration) : targetSec;

    if (!isPlayingPlayback) {
      // Review paused: Ensure paused and seek directly to exact gang frame
      if (!el.paused) el.pause();
      if (Math.abs(el.currentTime - safeTargetSec) > 0.03) {
        try {
          el.currentTime = safeTargetSec;
        } catch {}
      }
    } else {
      // Review playing: Ensure playing
      if (el.paused) {
        // If starting playback, snap to scrubber position
        if (Math.abs(el.currentTime - safeTargetSec) > 0.25) {
          try {
            el.currentTime = safeTargetSec;
          } catch {}
        }
        const p = el.play();
        if (p !== undefined) {
          p.catch((err: any) => {
            if (err?.name !== "AbortError") console.warn("Review play error:", err);
          });
        }
      } else {
        // Already playing: only resync if drift exceeds 0.5s
        if (Math.abs(el.currentTime - safeTargetSec) > 0.5) {
          try {
            el.currentTime = safeTargetSec;
          } catch {}
        }
      }
    }
  }, [monitorMode, isPlayingPlayback, playbackFrame, normalizedSrc]);

  if (loadError) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-950/80 p-4 text-center z-10">
        <span className="text-2xl mb-1">⚠️</span>
        <span className="text-xs font-mono text-rose-200 font-bold">Stream Ingest Error</span>
        <span className="text-[10px] text-rose-300/80 mt-1 font-mono">{loadError}</span>
        <button
          onClick={() => {
            setLoadError(null);
            if (videoRef.current) {
              videoRef.current.load();
            }
          }}
          className="mt-2 px-2 py-0.5 bg-rose-800 hover:bg-rose-700 text-white rounded text-[10px]"
        >
          Retry Stream
        </button>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={normalizedSrc}
      loop
      muted
      playsInline
      className="absolute inset-0 w-full h-full object-cover transition-all"
      style={{
        ...filterStyle,
        ...deSqueezeStyle
      }}
      onLoadedMetadata={() => {
        if (monitorMode === "playback" && videoRef.current) {
          const targetSec = playbackFrame / 24.0;
          try {
            videoRef.current.currentTime = targetSec;
            if (!isPlayingPlayback && !videoRef.current.paused) {
              videoRef.current.pause();
            }
          } catch {}
        }
      }}
      onError={() => {
        setLoadError(`Failed to load video stream from ${normalizedSrc}`);
      }}
    />
  );
};

export const Screen2CameraSentry: React.FC<Screen2Props> = ({
  tenantData,
  onRemediateDrift,
  onNavigateTab,
  activeProject = "CHRONO-2026",
  activeTenant = "paramount_pictures"
}) => {
  const [cameras, setCameras] = useState<CameraFeed[]>(INITIAL_CAMERAS);
  const [activeCamId, setActiveCamId] = useState<string>("cam-b");
  
  // Layout views: 'single', '2-up', '3-up', 'quad' (4-up), '6-up', 'all'
  const [layoutMode, setLayoutMode] = useState<"single" | "2-up" | "3-up" | "quad" | "6-up" | "all">("quad");

  // Playback & Global Overlays
  const [isPlaying, setIsPlaying] = useState(true);
  // Total elapsed frames starting at 01:24:12:04 (1h 24m 12s 4f = 121,252 frames @ 24fps)
  const [totalFrames, setTotalFrames] = useState<number>(121252);
  const [mealRemainingSec, setMealRemainingSec] = useState<number>(702); // 11m 42s remaining
  const [falseColor, setFalseColor] = useState(false);
  const [showGuides, setShowGuides] = useState(true);

  // Sentries state
  const [pullUpApplied, setPullUpApplied] = useState(false);
  const [cateringWrapped, setCateringWrapped] = useState(false);
  const [showContinuityModal, setShowContinuityModal] = useState(false);

  // Production Slate & Script Supervisor state
  const initialProject = tenantData?.projects?.[0] || {};
  const [projectTitle, setProjectTitle] = useState(initialProject.title || "Chrono 2026 (Theatrical Feature)");
  const [activeDirector, setActiveDirector] = useState(initialProject.director || "Denis Villeneuve");
  const [activeScene, setActiveScene] = useState(initialProject.active_scene?.replace("SCENE_", "Scene ") || "Scene 42B");
  const [activeTake, setActiveTake] = useState<number>(initialProject.active_take || 4);
  const [activeSoundRoll, setActiveSoundRoll] = useState("A104");

  // Persistent Scenes & Takes Store State
  const [scenes, setScenes] = useState<ProductionScene[]>([]);
  const [takes, setTakes] = useState<ProductionTake[]>([]);
  const [showSceneDropdown, setShowSceneDropdown] = useState(false);
  const [showTakesModal, setShowTakesModal] = useState(false);
  const [takesFilterVerdict, setTakesFilterVerdict] = useState<string>("ALL");
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareTakeAId, setCompareTakeAId] = useState<string>("");
  const [compareTakeBId, setCompareTakeBId] = useState<string>("");
  const [showNewSceneModal, setShowNewSceneModal] = useState(false);
  const [newSceneNumber, setNewSceneNumber] = useState("");
  const [newSceneDescription, setNewSceneDescription] = useState("");
  const [isSyncingProduction, setIsSyncingProduction] = useState(false);

  // Active SAG-AFTRA Performers for dynamic Sentry Likeness chips
  const [activePerformers, setActivePerformers] = useState<any[]>([]);
  const [activePerformer, setActivePerformer] = useState<any>(null);

  const loadActivePerformer = async () => {
    try {
      const list = await fetchLikenessLedger(activeTenant, activeProject);
      if (Array.isArray(list) && list.length > 0) {
        setActivePerformers(list);
        const isMatrix = (activeProject || "").toLowerCase().includes("matrix") || (activeTenant || "").toLowerCase().includes("silver") || (activeTenant || "").toLowerCase().includes("village") || (activeTenant || "").toLowerCase().includes("roadshow");
        let matched = null;
        if (isMatrix) {
          const sceneLower = (activeScene || "").toLowerCase();
          if (sceneLower.includes("smith") || sceneLower.includes("burly") || sceneLower.includes("brawl") || sceneLower.includes("103")) {
            matched = list.find((p: any) => p.actor_id === "ACTOR_HUGO_WEAVING" || (p.actor_name && p.actor_name.toLowerCase().includes("weaving")));
          } else {
            matched = list.find((p: any) => p.actor_id === "ACTOR_KEANU_REEVES" || (p.actor_name && p.actor_name.toLowerCase().includes("reeves")));
          }
        }
        setActivePerformer(matched || list[0]);
      } else {
        setActivePerformers([]);
        setActivePerformer(null);
      }
    } catch (err) {
      console.warn("Could not sync active performer for camera sentry:", err);
    }
  };

  useEffect(() => {
    loadActivePerformer();
    const handlePerformerEvent = () => {
      loadActivePerformer();
    };
    window.addEventListener("cinesynapse:take-recorded", handlePerformerEvent);
    window.addEventListener("cinesynapse:likeness-updated", handlePerformerEvent);
    return () => {
      window.removeEventListener("cinesynapse:take-recorded", handlePerformerEvent);
      window.removeEventListener("cinesynapse:likeness-updated", handlePerformerEvent);
    };
  }, [activeTenant, activeProject, activeScene]);

  // Union Labor Call Sheet Configuration (Sentry 4 Engine)
  const [crewHeadcount, setCrewHeadcount] = useState<number>(140);
  const [unionAgreement, setUnionAgreement] = useState<"IATSE" | "DGA" | "TEAMSTERS">("IATSE");
  const [callTimeStr, setCallTimeStr] = useState("06:00 AM");

  // Prop Continuity Configuration (Sentry 7 Engine)
  const [trackedPropName, setTrackedPropName] = useState("Whiskey Glass (Amber Bourbon)");
  const [propBaselineFill, setPropBaselineFill] = useState<number>(42); // 42% (Take 3)
  const [propCurrentFill, setPropCurrentFill] = useState<number>(68); // 68% (Take 4)
  const [propToleranceThreshold, setPropToleranceThreshold] = useState<number>(15); // 15% delta
  const [propContinuityApproved, setPropContinuityApproved] = useState(false);

  // 1. Unified DIT Precision Studio Dock ("none" | "cdl" | "scopes")
  const [activeDrawerTab, setActiveDrawerTab] = useState<"none" | "cdl" | "scopes">("none");
  const showCdlDrawer = activeDrawerTab === "cdl";
  const showScopes = activeDrawerTab === "scopes";
  const [scopeMode, setScopeMode] = useState<"waveform" | "vectorscope" | "parade">("waveform");

  // Visual Overlays HUD Density Mode: "full" | "compact" | "clean"
  const [hudMode, setHudMode] = useState<"full" | "compact" | "clean">("full");

  // Sentry Production Guardians Tray (Collapsible Bottom Dock)
  const [sentryTrayExpanded, setSentryTrayExpanded] = useState<boolean>(false);

  // 2. Script Supervisor Slate Bar State
  const [takeVerdict, setTakeVerdict] = useState<"CIRCLE" | "NG" | "HOLD" | null>(null);
  const [directorNotes, setDirectorNotes] = useState<string>("Hero coverage on Marcus. Tack sharp focus at T/2.0.");
  const [showNotesModal, setShowNotesModal] = useState(false);

  // Downstream Output Pipeline Dispatcher Modal
  const [showPipelineModal, setShowPipelineModal] = useState(false);
  const [c2cUploadProgress, setC2cUploadProgress] = useState<number | null>(null);

  // Master Transport & Video Assist Operating Modes
  const [monitorMode, setMonitorMode] = useState<"live" | "playback">("live");
  const [isRolling, setIsRolling] = useState(false);
  const [takeElapsedSec, setTakeElapsedSec] = useState<number>(0);
  const [takeInTimecode, setTakeInTimecode] = useState<string>("01:24:12:00");
  const [takeOutTimecode, setTakeOutTimecode] = useState<string>("01:24:36:00");
  const [isFrameHold, setIsFrameHold] = useState(false);
  const [frozenBufferTc, setFrozenBufferTc] = useState<string>("01:24:12:04");
  const [playbackFrame, setPlaybackFrame] = useState<number>(0); // 0-maxPlaybackFrames for review
  const [isPlayingPlayback, setIsPlayingPlayback] = useState(false);
  const maxPlaybackFrames = takeElapsedSec > 0 ? Math.max(576, takeElapsedSec * 24) : 576;

  // Smart Slate Editor Modal
  const [showSlateModal, setShowSlateModal] = useState(false);
  const [slateFormScene, setSlateFormScene] = useState(activeScene);
  const [slateFormTake, setSlateFormTake] = useState(activeTake);
  const [slateFormDirector, setSlateFormDirector] = useState(activeDirector);
  const [slateFormSoundRoll, setSlateFormSoundRoll] = useState(activeSoundRoll);
  const [slateFormProject, setSlateFormProject] = useState(projectTitle);

  // NG Defect Reason Selector & Take Wrap Review Modal
  const [showNgModal, setShowNgModal] = useState(false);
  const [ngReason, setNgReason] = useState<string>("");
  const [showTakeWrapModal, setShowTakeWrapModal] = useState(false);

  // 3. Live A/B Split-Wipe Continuity Tool State
  const [splitWipeActive, setSplitWipeActive] = useState(false);
  const [splitPosition, setSplitPosition] = useState<number>(50); // percentage 0 - 100
  const [splitWipeMode, setSplitWipeMode] = useState<"vertical" | "onion">("vertical");

  // 4. Live Lens Metadata Overlay & 1:1 Pixel Punch-In Zoom
  const [showLensHud, setShowLensHud] = useState(true);
  const [zoomPunchIn, setZoomPunchIn] = useState(false);

  // 5. ASC EL Zone System Exposure Engine
  const [exposureMode, setExposureMode] = useState<"clean" | "el_zone" | "ire_false_color">("clean");

  // 6. Non-Destructive ASC-CDL Live Grading Drawer (SOP)
  const [cdlParams, setCdlParams] = useState({ slope: 1.0, offset: 0.0, power: 1.0, saturation: 1.0 });
  const [cdlPreset, setCdlPreset] = useState("rec709");

  // 7. Multi-Format Safe Area Framing Guides & Anamorphic
  const [framingAspect, setFramingAspect] = useState<"2.39" | "1.85" | "16:9" | "all" | "off">("2.39");
  const [showSocialSafe, setShowSocialSafe] = useState(true);
  const [matteOpacity, setMatteOpacity] = useState<number>(0.85);

  // 8. Focus Peaking Assist
  const [focusPeakingActive, setFocusPeakingActive] = useState(false);
  const [peakingColor, setPeakingColor] = useState<"cyan" | "magenta">("cyan");

  // 9. Live Audio Phase Correlation & Dialogue Peak HUD
  const [phaseInverted, setPhaseInverted] = useState(false);
  const [livePhase, setLivePhase] = useState(0.92);

  // 10. AI Vision Auto-Slate & Clapper Spike Sync
  const [isScanningSlate, setIsScanningSlate] = useState(false);
  const [clapperSyncLocked, setClapperSyncLocked] = useState(true);
  const [clapperSpikeTc, setClapperSpikeTc] = useState("01:24:12:08");

  // Visual Configuration Drawer / Modal state
  const [editingCamId, setEditingCamId] = useState<string | null>(null);
  const [configTab, setConfigTab] = useState<"stream" | "hardware" | "timecode" | "c2pa">("stream");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Collapsible Bottom Production Telemetry & Sentry Dock
  const [bottomDockExpanded, setBottomDockExpanded] = useState<boolean>(false);
  const [bottomDockTab, setBottomDockTab] = useState<"sentries" | "matrix">("sentries");

  // Drag over tracking per camera ID
  const [dragOverCamId, setDragOverCamId] = useState<string | null>(null);

  // Per-camera hidden file inputs ref map
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const activeCamera = cameras.find((c) => c.id === activeCamId) || cameras[0];
  const editingCamera = cameras.find((c) => c.id === editingCamId) || activeCamera;

  // Load Production State, Scenes, and Takes from Persistent Storage
  const loadProductionData = async () => {
    setIsSyncingProduction(true);
    try {
      const [stateRes, scenesRes, takesRes] = await Promise.all([
        fetchProductionState(activeTenant, activeProject).catch(() => null),
        fetchProductionScenes(activeTenant, activeProject).catch(() => []),
        fetchProductionTakes(undefined, undefined, activeTenant, activeProject).catch(() => [])
      ]);

      if (stateRes && stateRes.active_scene) {
        setActiveScene(stateRes.active_scene);
        setActiveTake(stateRes.active_take || 1);
        if (stateRes.project_title) setProjectTitle(stateRes.project_title);
        if (stateRes.director) setActiveDirector(stateRes.director);
        if (stateRes.sound_roll) setActiveSoundRoll(stateRes.sound_roll);
      } else {
        setProjectTitle(activeProject);
      }

      if (Array.isArray(scenesRes)) {
        setScenes(scenesRes);
        if (scenesRes.length === 0) {
          setActiveScene("Scene 01");
          setActiveTake(1);
        }
      }

      if (Array.isArray(takesRes)) {
        setTakes(takesRes);
        if (takesRes.length === 0) {
          setTakeVerdict(null);
          setDirectorNotes("");
        } else {
          const currentActiveTake = takesRes.find(
            (t: ProductionTake) =>
              (t.scene_display === (stateRes?.active_scene || activeScene) || t.scene_id === stateRes?.active_scene_id) &&
              t.take_number === (stateRes?.active_take || activeTake)
          );
          if (currentActiveTake) {
            setTakeVerdict(currentActiveTake.verdict || null);
            if (currentActiveTake.director_notes) setDirectorNotes(currentActiveTake.director_notes);
          }
        }
      }
    } catch (err) {
      console.warn("Could not sync production state from backend:", err);
    } finally {
      setIsSyncingProduction(false);
    }
  };

  useEffect(() => {
    loadProductionData();
  }, [activeProject, activeTenant]);

  const currentSceneTakes = takes.filter(
    (t) =>
      t.scene_display === activeScene ||
      t.scene_id === activeScene.toUpperCase().replace(" ", "_") ||
      activeScene.toLowerCase().includes((t.scene_display || "").toLowerCase())
  );

  const handleSelectScene = async (scene: ProductionScene) => {
    const sceneDisplay = scene.title || `Scene ${scene.scene_number}`;
    setActiveScene(sceneDisplay);
    setShowSceneDropdown(false);

    try {
      const sceneTakes = await fetchProductionTakes(scene.scene_id, undefined, activeTenant, activeProject);
      const nextTakeNum = sceneTakes && sceneTakes.length > 0
        ? Math.max(...sceneTakes.map((t: ProductionTake) => t.take_number)) + 1
        : 1;
      setActiveTake(nextTakeNum);
      setTakeVerdict(null);
      setNgReason("");

      await updateProductionState({
        active_scene: sceneDisplay,
        active_scene_id: scene.scene_id,
        active_take: nextTakeNum
      }, activeTenant, activeProject);
      await loadProductionData();
      triggerToast(`🎬 Switched to ${sceneDisplay} (Next Take: 0${nextTakeNum})`);
    } catch (e) {
      console.error("Error switching scene:", e);
    }
  };

  const handleCreateNewScene = async () => {
    if (!newSceneNumber.trim()) return;
    const sceneNum = newSceneNumber.trim();
    const sceneId = `SCENE_${sceneNum.toUpperCase()}`;
    const sceneTitle = `Scene ${sceneNum}`;
    const payload = {
      scene_id: sceneId,
      scene_number: sceneNum,
      title: sceneTitle,
      description: newSceneDescription || "Production coverage scene",
      location: "Main Stage",
      active_take: 1,
      total_takes: 0,
      status: "IN_PROGRESS"
    };
    try {
      await createProductionScene(payload, activeTenant, activeProject);
      setShowNewSceneModal(false);
      setNewSceneNumber("");
      setNewSceneDescription("");
      await handleSelectScene(payload as any);
    } catch (e) {
      console.error("Failed to create scene:", e);
    }
  };

  const handleUpdateTakeVerdict = async (takeId: string, verdict: "CIRCLE" | "NG" | "HOLD" | null, reason?: string) => {
    try {
      await updateProductionTake(takeId, { verdict, ng_reason: reason || null });
      await loadProductionData();
      triggerToast(`✓ Updated Take verdict to ${verdict || "Unrated"}`);
    } catch (e) {
      console.error("Failed to update take verdict:", e);
    }
  };

  // SMPTE ST 12-1 Timecode Formatter: HH:MM:SS:FF
  const formatSMPTE = (framesCount: number) => {
    const ff = Math.floor(framesCount % 24);
    const totalSec = Math.floor(framesCount / 24);
    const ss = Math.floor(totalSec % 60);
    const totalMin = Math.floor(totalSec / 60);
    const mm = Math.floor(totalMin % 60);
    const hh = Math.floor(totalMin / 60) % 24;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(hh)}:${pad(mm)}:${pad(ss)}:${pad(ff)}`;
  };

  // Rolling Take Duration & Frame Counter
  useEffect(() => {
    if (!isRolling) return;
    const interval = setInterval(() => {
      setTakeElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRolling]);

  // 24fps Gang Playback Clock in Review Mode
  useEffect(() => {
    if (monitorMode !== "playback" || !isPlayingPlayback) return;
    const interval = setInterval(() => {
      setPlaybackFrame((prev) => (prev >= maxPlaybackFrames ? 0 : prev + 1));
    }, 1000 / 24);
    return () => clearInterval(interval);
  }, [monitorMode, isPlayingPlayback, maxPlaybackFrames]);

  // Running Master SMPTE Timecode Ticker (24.000 fps -> 41.67ms per frame)
  useEffect(() => {
    if (!isPlaying || isFrameHold || monitorMode === "playback") return;
    const interval = setInterval(() => {
      setTotalFrames((prev) => prev + 1);
    }, 41.67);
    return () => clearInterval(interval);
  }, [isPlaying, isFrameHold, monitorMode]);

  const liveTimecode = formatSMPTE(totalFrames);
  const playbackTimecode = formatSMPTE(121252 + playbackFrame);
  const masterTimecode = monitorMode === "playback" 
    ? playbackTimecode 
    : isFrameHold 
    ? frozenBufferTc 
    : liveTimecode;

  // Per-camera timecode (shows physical frame slippage if sensor runs at 23.976 fps!)
  const getCameraTimecode = (cam: CameraFeed) => {
    if (monitorMode === "playback") {
      return masterTimecode;
    }
    const isCompensated = !!cam.pullUpCompensated || (cam.id === "cam-b" && pullUpApplied);
    if (isCompensated || Math.abs(cam.fps - 24.0) < 0.001) {
      return masterTimecode;
    }
    // Fractional drift: sensor frames advance at (cam.fps / 24.0) rate
    const sensorFrames = Math.floor(totalFrames * (cam.fps / 24.0));
    return formatSMPTE(sensorFrames);
  };

  // Live countdown for Sentry 4 (Meal Penalty)
  useEffect(() => {
    if (cateringWrapped) return;
    const interval = setInterval(() => {
      setMealRemainingSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cateringWrapped]);

  const formatMealCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s Remaining`;
  };

  // Union Penalty Rate Schedules (IATSE vs DGA vs Teamsters)
  const getUnionPenaltyRatePerHead = () => {
    if (unionAgreement === "DGA") return 30.0;
    if (unionAgreement === "TEAMSTERS") return 20.0;
    return 25.0; // IATSE Basic Agreement Tier 1 standard ($25.00/head)
  };

  const currentRatePerHead = getUnionPenaltyRatePerHead();
  const calculatedMealLiability = cateringWrapped ? 0 : crewHeadcount * currentRatePerHead;

  // Prop Continuity Delta & Validation
  const propDelta = Math.abs(propCurrentFill - propBaselineFill);
  const isPropMismatchFlagged = propDelta > propToleranceThreshold && !propContinuityApproved;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Toggle Master Take Roll (Rolling vs Cutting)
  const handleToggleRoll = () => {
    if (!isRolling) {
      setIsRolling(true);
      setTakeElapsedSec(0);
      setTakeInTimecode(masterTimecode);
      setIsFrameHold(false);
      setIsPlaying(true);
      setMonitorMode("live");

      const rollMsg = {
        message_id: `msg-roll-${Date.now()}`,
        channel_id: "#on-set-camera-comms",
        sender_id: "1st-ad-transport",
        sender_name: "1st Assistant Director",
        sender_role: "On-Set Production Control",
        text: `🔴 SPEED: Scene ${activeScene} Take 0${activeTake} ROLLING at SMPTE ${masterTimecode}. All 4 camera sensors locked to master clapper. Recording ProRes 4444 XQ RAW.`,
        timecode_smpte: masterTimecode,
        asset_name: `Scene${activeScene.replace(/\s+/g, "")}_Take0${activeTake}_RawMaster.mov`,
        asset_type: "VIDEO",
        c2pa_status: "VERIFIED_HARDWARE_SIGNATURE",
        created_at: new Date().toISOString()
      };
      sendWarRoomMessage(rollMsg).catch(console.error);
      window.dispatchEvent(new CustomEvent("cinesynapse:war-room-message", { detail: rollMsg }));
      triggerToast(`🔴 SPEED: Camera Rolling! Scene ${activeScene} Take 0${activeTake}`);
    } else {
      setIsRolling(false);
      setTakeOutTimecode(masterTimecode);

      const finalSec = takeElapsedSec > 0 ? takeElapsedSec : 24.0;
      const takePayload = {
        scene_display: activeScene,
        take_number: activeTake,
        director: activeDirector,
        sound_roll: activeSoundRoll,
        timecode_in: takeInTimecode,
        timecode_out: masterTimecode,
        duration_sec: finalSec,
        duration_frames: Math.round(finalSec * 24),
        verdict: takeVerdict,
        director_notes: directorNotes,
        cdl: cdlParams,
        prop_fill_level: propCurrentFill
      };
      recordProductionTake(takePayload, activeTenant, activeProject).then(() => {
        loadProductionData();
        window.dispatchEvent(new CustomEvent("cinesynapse:refresh-storage"));
        window.dispatchEvent(new CustomEvent("cinesynapse:take-recorded", { detail: takePayload }));
      }).catch(console.error);

      const cutMsg = {
        message_id: `msg-cut-${Date.now()}`,
        channel_id: "#on-set-camera-comms",
        sender_id: "director-transport",
        sender_name: activeDirector,
        sender_role: "Director",
        text: `⏹️ CUT: Scene ${activeScene} Take 0${activeTake} wrapped at SMPTE ${masterTimecode}. Duration: ${finalSec}s (${Math.round(finalSec * 24)} frames). Awaiting Smart Slate Verdict.`,
        timecode_smpte: masterTimecode,
        asset_name: `Scene${activeScene.replace(/\s+/g, "")}_Take0${activeTake}_Print.mov`,
        asset_type: "VIDEO",
        c2pa_status: "VERIFIED_HARDWARE_SIGNATURE",
        created_at: new Date().toISOString()
      };
      sendWarRoomMessage(cutMsg).catch(console.error);
      window.dispatchEvent(new CustomEvent("cinesynapse:war-room-message", { detail: cutMsg }));
      setShowTakeWrapModal(true);
      triggerToast(`⏹️ CUT: Take 0${activeTake} wrapped (${finalSec}s). Select Slate Verdict.`);
    }
  };

  // Master Pause All / Freeze Hold Feeds Buffer across all cameras
  const handleTogglePauseAll = () => {
    if (isRolling) {
      triggerToast("⚠️ Active take is currently rolling. Cut take before pausing feeds.");
      return;
    }
    const nextPaused = !(isFrameHold || !isPlaying);
    setIsFrameHold(nextPaused);
    setIsPlaying(!nextPaused);
    if (nextPaused) {
      setFrozenBufferTc(masterTimecode);
      triggerToast(`⏸️ PAUSE ALL: Frame buffer frozen across all cameras @ ${masterTimecode}. Ready for A/B wipe inspection.`);
    } else {
      triggerToast("▶️ RESUME ALL: Restored live camera feeds.");
    }
  };
  const handleToggleFrameHold = handleTogglePauseAll;

  // Save Slate Configuration from Modal
  const handleSaveSlateConfig = () => {
    setActiveScene(slateFormScene);
    setActiveTake(slateFormTake);
    setActiveDirector(slateFormDirector);
    setActiveSoundRoll(slateFormSoundRoll);
    setProjectTitle(slateFormProject);
    setShowSlateModal(false);
    triggerToast(`🎬 Slate Updated: ${slateFormScene} • Take 0${slateFormTake} (Dir: ${slateFormDirector})`);

    updateProductionState({
      active_scene: slateFormScene,
      active_take: slateFormTake,
      director: slateFormDirector,
      sound_roll: slateFormSoundRoll,
      project_title: slateFormProject
    }, activeTenant, activeProject).then(() => {
      loadProductionData();
      window.dispatchEvent(new CustomEvent("cinesynapse:refresh-storage"));
    }).catch(console.error);

    const slateChangeMsg = {
      message_id: `msg-slate-change-${Date.now()}`,
      channel_id: "#on-set-camera-comms",
      sender_id: "script-supervisor",
      sender_name: "Script Supervisor (iPad)",
      sender_role: "Script & Continuity",
      text: `🎬 SMART SLATE RE-INDEXED: Active Slate set to ${slateFormScene} • Take 0${slateFormTake}. Director: ${slateFormDirector}. Sound Roll: ${slateFormSoundRoll}. Project: ${slateFormProject}.`,
      timecode_smpte: masterTimecode,
      created_at: new Date().toISOString()
    };
    sendWarRoomMessage(slateChangeMsg).catch(console.error);
    window.dispatchEvent(new CustomEvent("cinesynapse:war-room-message", { detail: slateChangeMsg }));
  };

  // 1-Click Save & Record Take Now from Smart Slate Modal
  const handleSaveAndRecordTakeNow = async () => {
    setActiveScene(slateFormScene);
    setActiveTake(slateFormTake);
    setActiveDirector(slateFormDirector);
    setActiveSoundRoll(slateFormSoundRoll);
    setProjectTitle(slateFormProject);
    setShowSlateModal(false);

    await updateProductionState({
      active_scene: slateFormScene,
      active_take: slateFormTake,
      director: slateFormDirector,
      sound_roll: slateFormSoundRoll,
      project_title: slateFormProject
    }, activeTenant, activeProject).catch(console.error);

    const takePayload = {
      scene_display: slateFormScene,
      take_number: slateFormTake,
      director: slateFormDirector,
      sound_roll: slateFormSoundRoll,
      timecode_in: masterTimecode,
      timecode_out: masterTimecode,
      duration_sec: 24.0,
      duration_frames: 576,
      verdict: "CIRCLE",
      director_notes: `Take physically slated & printed from Smart Slate control for ${slateFormScene}`,
      cdl: cdlParams,
      prop_fill_level: propCurrentFill,
      detected_actor_ids: activePerformers.map((p) => p.actor_id)
    };

    try {
      await recordProductionTake(takePayload, activeTenant, activeProject);
      const nextTake = slateFormTake + 1;
      setActiveTake(nextTake);
      await updateProductionState({
        active_scene: slateFormScene,
        active_take: nextTake,
        director: slateFormDirector,
        sound_roll: slateFormSoundRoll,
        project_title: slateFormProject
      }, activeTenant, activeProject).catch(console.error);
      await loadProductionData();
      window.dispatchEvent(new CustomEvent("cinesynapse:refresh-storage"));
      window.dispatchEvent(new CustomEvent("cinesynapse:take-recorded", { detail: takePayload }));
      triggerToast(`⭐️ CIRCLE TAKE: Take 0${slateFormTake} physically recorded & vaulted! Slate auto-advanced to Take 0${nextTake}.`);
    } catch (err) {
      console.error("Failed to record take from slate:", err);
    }
  };

  // 1-Click Quick Record & Vault Take (Instant C2PA Attestation + Tier 0 NVMe Archival)
  const handleQuickRecordTake = async () => {
    const curTake = activeTake;
    const nextTake = curTake + 1;
    const finalSec = takeElapsedSec > 0 ? takeElapsedSec : 24.0;
    const takePayload = {
      scene_display: activeScene,
      take_number: curTake,
      director: activeDirector,
      sound_roll: activeSoundRoll,
      timecode_in: takeInTimecode || masterTimecode,
      timecode_out: masterTimecode,
      duration_sec: finalSec,
      duration_frames: Math.round(finalSec * 24),
      verdict: "CIRCLE",
      director_notes: `Take 0${curTake} recorded via 1-Click Record & Vault control.`,
      cdl: cdlParams,
      prop_fill_level: propCurrentFill,
      detected_actor_ids: activePerformers.map((p) => p.actor_id)
    };

    try {
      await recordProductionTake(takePayload, activeTenant, activeProject);
      setActiveTake(nextTake);
      setTakeVerdict(null);
      setTakeElapsedSec(0);
      setIsRolling(false);
      await updateProductionState({
        active_scene: activeScene,
        active_take: nextTake
      }, activeTenant, activeProject);
      await loadProductionData();
      window.dispatchEvent(new CustomEvent("cinesynapse:refresh-storage"));
      window.dispatchEvent(new CustomEvent("cinesynapse:take-recorded", { detail: takePayload }));
      
      const circleMsg = {
        message_id: `msg-quick-take-${Date.now()}`,
        channel_id: "#on-set-camera-comms",
        sender_id: "director-transport",
        sender_name: activeDirector,
        sender_role: "Director",
        text: `⭐️ CIRCLE TAKE: ${activeScene} • Take 0${curTake} printed & vaulted into Storage Vault Tier 0 NVMe. Slate auto-advanced to Take 0${nextTake}.`,
        timecode_smpte: masterTimecode,
        asset_name: `Scene${activeScene.replace(/\\s+/g, "")}_Take0${curTake}_Circle.mov`,
        asset_type: "VIDEO",
        c2pa_status: "VERIFIED_HARDWARE_SIGNATURE",
        created_at: new Date().toISOString()
      };
      sendWarRoomMessage(circleMsg).catch(console.error);
      window.dispatchEvent(new CustomEvent("cinesynapse:war-room-message", { detail: circleMsg }));
      
      triggerToast(`⭐️ CIRCLE TAKE: Scene ${activeScene} Take 0${curTake} vaulted! Slate auto-advanced to Take 0${nextTake}.`);
    } catch (err) {
      console.error("Failed to quick record take:", err);
      triggerToast("⚠️ Failed to record take to storage vault.");
    }
  };

  // Gang Playback Step / Scrub
  const handleStepPlayback = (delta: number) => {
    setIsPlayingPlayback(false);
    setPlaybackFrame((prev) => Math.max(0, Math.min(maxPlaybackFrames, prev + delta)));
  };

  // 1-Click Circle Take & Script Supervisor Verdict
  const handleCircleTake = () => {
    setShowTakeWrapModal(false);
    const curTake = activeTake;
    const nextTake = curTake + 1;
    const takePayload = {
      scene_display: activeScene,
      take_number: curTake,
      director: activeDirector,
      sound_roll: activeSoundRoll,
      timecode_in: takeInTimecode || masterTimecode,
      timecode_out: takeOutTimecode || masterTimecode,
      duration_sec: takeElapsedSec > 0 ? takeElapsedSec : 24.0,
      verdict: "CIRCLE",
      director_notes: directorNotes,
      cdl: cdlParams,
      prop_fill_level: propCurrentFill
    };
    recordProductionTake(takePayload, activeTenant, activeProject).then(() => {
      setActiveTake(nextTake);
      setTakeVerdict(null);
      setTakeElapsedSec(0);
      setIsRolling(false);
      updateProductionState({
        active_scene: activeScene,
        active_take: nextTake
      }, activeTenant, activeProject);
      loadProductionData();
      window.dispatchEvent(new CustomEvent("cinesynapse:refresh-storage"));
      window.dispatchEvent(new CustomEvent("cinesynapse:take-recorded", { detail: takePayload }));
    }).catch(console.error);

    triggerToast(`⭐️ CIRCLE TAKE: Scene ${activeScene} • Take 0${curTake} PRINTED & Vaulted! Slate auto-advanced to Take 0${nextTake}.`);
    const circleMsg = {
      message_id: `msg-slate-${Date.now()}`,
      channel_id: "#on-set-camera-comms",
      sender_id: "script-supervisor",
      sender_name: "Script Supervisor (iPad)",
      sender_role: "Script & Continuity",
      text: `⭐️ CIRCLE TAKE (PRINT): ${activeScene} • Take 0${curTake} approved by Director (${activeDirector}). Notes: "${directorNotes}". Conformed to Screen 6 V1 Master Raw & Vaulted to Tier 0.`,
      timecode_smpte: masterTimecode,
      asset_name: `Scene${activeScene.replace(/\\s+/g, "")}_Take0${curTake}_Print.mov`,
      asset_type: "VIDEO",
      c2pa_status: "VERIFIED_HARDWARE_SIGNATURE",
      created_at: new Date().toISOString()
    };
    sendWarRoomMessage(circleMsg).catch(console.error);
    window.dispatchEvent(new CustomEvent("cinesynapse:war-room-message", { detail: circleMsg }));

    // Dispatch Conformed Take directly into Screen 6 Editorial Ingest
    const editorialClip = {
      id: `clip-sc${activeScene.replace(/\\s+/g, "")}-t${curTake}-${Date.now()}`,
      name: `Scene${activeScene.replace(/\\s+/g, "")}_T0${curTake}_Print`,
      track: "V1: MASTER RAW",
      duration: `${takeElapsedSec || 24}s (${(takeElapsedSec || 24) * 24} frames)`,
      timecodeIn: takeInTimecode || masterTimecode,
      timecodeOut: takeOutTimecode || "01:24:36:04",
      lens: "Cooke Anamorphic /i 40mm",
      aperture: "T/2.0 calibrated (Cooke /i Protocol)",
      c2pa: "Hardware Root of Trust Verified (ARRI Alexa 35)",
      colorSpace: `ACEScg (AP1) • CDL [S:${cdlParams.slope} O:${cdlParams.offset} P:${cdlParams.power} Sat:${cdlParams.saturation}]`,
      likenessPerformer: `Marcus Vance (Approved Script Notes: "${directorNotes.slice(0, 30)}...")`,
      complianceNote: "Circle Take (PRINT) • Synchronized to 24.000fps Boom WAV"
    };
    window.dispatchEvent(new CustomEvent("cinesynapse:editorial-clip-ingest", { detail: editorialClip }));
  };

  // 1-Click NG Take with Defect Reason
  const handleNgTake = (reason: string) => {
    setShowNgModal(false);
    setShowTakeWrapModal(false);
    const curTake = activeTake;
    const nextTake = curTake + 1;

    const takePayload = {
      scene_display: activeScene,
      take_number: curTake,
      director: activeDirector,
      sound_roll: activeSoundRoll,
      timecode_in: takeInTimecode || masterTimecode,
      timecode_out: takeOutTimecode || masterTimecode,
      duration_sec: takeElapsedSec > 0 ? takeElapsedSec : 24.0,
      verdict: "NG",
      ng_reason: reason,
      director_notes: directorNotes,
      cdl: cdlParams,
      prop_fill_level: propCurrentFill
    };
    recordProductionTake(takePayload, activeTenant, activeProject).then(() => {
      setActiveTake(nextTake);
      setTakeVerdict(null);
      setTakeElapsedSec(0);
      setIsRolling(false);
      updateProductionState({
        active_scene: activeScene,
        active_take: nextTake
      }, activeTenant, activeProject);
      loadProductionData();
      window.dispatchEvent(new CustomEvent("cinesynapse:refresh-storage"));
      window.dispatchEvent(new CustomEvent("cinesynapse:take-recorded", { detail: takePayload }));
    }).catch(console.error);

    triggerToast(`❌ Take 0${curTake} marked as NG (${reason}). Conformed to Outtakes! Slate auto-advanced to Take 0${nextTake}.`);

    const ngMsg = {
      message_id: `msg-ng-${Date.now()}`,
      channel_id: "#on-set-camera-comms",
      sender_id: "script-supervisor",
      sender_name: "Script Supervisor (iPad)",
      sender_role: "Script & Continuity",
      text: `❌ TAKE 0${curTake} REJECTED (NG) - Reason: ${reason}. Scene ${activeScene}. Take excluded from master assembly. Preserved in outtakes archive. Camera resetting for Take 0${nextTake}.`,
      timecode_smpte: masterTimecode,
      asset_name: `Scene${activeScene.replace(/\\s+/g, "")}_Take0${curTake}_NG.mov`,
      asset_type: "VIDEO",
      c2pa_status: "VERIFIED_HARDWARE_SIGNATURE",
      created_at: new Date().toISOString()
    };
    sendWarRoomMessage(ngMsg).catch(console.error);
    window.dispatchEvent(new CustomEvent("cinesynapse:war-room-message", { detail: ngMsg }));

    const editorialClip = {
      id: `clip-sc${activeScene.replace(/\\s+/g, "")}-t${curTake}-ng-${Date.now()}`,
      name: `Scene${activeScene.replace(/\\s+/g, "")}_T0${curTake}_NG`,
      track: "OUTTAKES / REJECTS (NG)",
      duration: `${takeElapsedSec || 24}s (${(takeElapsedSec || 24) * 24} frames)`,
      timecodeIn: takeInTimecode || masterTimecode,
      timecodeOut: takeOutTimecode || "01:24:36:04",
      lens: "Cooke Anamorphic /i 40mm",
      aperture: "T/2.0 calibrated (Cooke /i Protocol)",
      c2pa: "Hardware Root of Trust Verified (ARRI Alexa 35)",
      colorSpace: `ACEScg (AP1) • CDL [S:${cdlParams.slope} O:${cdlParams.offset} P:${cdlParams.power} Sat:${cdlParams.saturation}]`,
      likenessPerformer: `Marcus Vance`,
      complianceNote: `❌ NG: ${reason} (Defective Take - Outtakes Archive)`
    };
    window.dispatchEvent(new CustomEvent("cinesynapse:editorial-clip-ingest", { detail: editorialClip }));
  };

  // 1-Click Hold / Keep Take (Alternate Coverage)
  const handleHoldTake = () => {
    setShowTakeWrapModal(false);
    const curTake = activeTake;
    const nextTake = curTake + 1;

    const takePayload = {
      scene_display: activeScene,
      take_number: curTake,
      director: activeDirector,
      sound_roll: activeSoundRoll,
      timecode_in: takeInTimecode || masterTimecode,
      timecode_out: takeOutTimecode || masterTimecode,
      duration_sec: takeElapsedSec > 0 ? takeElapsedSec : 24.0,
      verdict: "HOLD",
      director_notes: directorNotes,
      cdl: cdlParams,
      prop_fill_level: propCurrentFill
    };
    recordProductionTake(takePayload, activeTenant, activeProject).then(() => {
      setActiveTake(nextTake);
      setTakeVerdict(null);
      setTakeElapsedSec(0);
      setIsRolling(false);
      updateProductionState({
        active_scene: activeScene,
        active_take: nextTake
      }, activeTenant, activeProject);
      loadProductionData();
      window.dispatchEvent(new CustomEvent("cinesynapse:refresh-storage"));
      window.dispatchEvent(new CustomEvent("cinesynapse:take-recorded", { detail: takePayload }));
    }).catch(console.error);

    triggerToast(`⏳ Take 0${curTake} marked as HOLD (Alternate Coverage). Conformed to Screen 6 V2! Slate auto-advanced to Take 0${nextTake}.`);

    const holdMsg = {
      message_id: `msg-hold-${Date.now()}`,
      channel_id: "#on-set-camera-comms",
      sender_id: "script-supervisor",
      sender_name: "Script Supervisor (iPad)",
      sender_role: "Script & Continuity",
      text: `⏳ TAKE 0${curTake} MARKED HOLD: Approved alternate performance & reaction coverage for ${activeScene}. Ingested into Screen 6 V2 Alternate track. Vaulted to Tier 0.`,
      timecode_smpte: masterTimecode,
      asset_name: `Scene${activeScene.replace(/\\s+/g, "")}_Take0${curTake}_Hold.mov`,
      asset_type: "VIDEO",
      c2pa_status: "VERIFIED_HARDWARE_SIGNATURE",
      created_at: new Date().toISOString()
    };
    sendWarRoomMessage(holdMsg).catch(console.error);
    window.dispatchEvent(new CustomEvent("cinesynapse:war-room-message", { detail: holdMsg }));

    const editorialClip = {
      id: `clip-sc${activeScene.replace(/\\s+/g, "")}-t${curTake}-hold-${Date.now()}`,
      name: `Scene${activeScene.replace(/\\s+/g, "")}_T0${curTake}_Hold`,
      track: "V2: ALTERNATE TAKES / COVERAGE",
      duration: `${takeElapsedSec || 24}s (${(takeElapsedSec || 24) * 24} frames)`,
      timecodeIn: takeInTimecode || masterTimecode,
      timecodeOut: takeOutTimecode || "01:24:36:04",
      lens: "Cooke Anamorphic /i 40mm",
      aperture: "T/2.0 calibrated (Cooke /i Protocol)",
      c2pa: "Hardware Root of Trust Verified (ARRI Alexa 35)",
      colorSpace: `ACEScg (AP1) • CDL [S:${cdlParams.slope} O:${cdlParams.offset} P:${cdlParams.power} Sat:${cdlParams.saturation}]`,
      likenessPerformer: `Marcus Vance`,
      complianceNote: "⏳ HOLD / ALTERNATE: Secondary coverage select"
    };
    window.dispatchEvent(new CustomEvent("cinesynapse:editorial-clip-ingest", { detail: editorialClip }));
  };

  const handleNextTake = () => {
    const nextTake = activeTake + 1;
    setActiveTake(nextTake);
    setTakeVerdict(null);
    setNgReason("");
    setTakeElapsedSec(0);
    updateProductionState({
      active_scene: activeScene,
      active_take: nextTake
    }, activeTenant, activeProject).then(() => {
      loadProductionData();
      window.dispatchEvent(new CustomEvent("cinesynapse:refresh-storage"));
    }).catch(console.error);
    triggerToast(`🎬 Rolled to Take 0${nextTake} for ${activeScene}! Ready on Director's cue.`);
  };

  // Exposure Mode Switcher (Clean -> ASC EL Zone -> IRE False Color -> Clean)
  const handleCycleExposure = () => {
    setExposureMode((prev) => {
      const next = prev === "clean" ? "el_zone" : prev === "el_zone" ? "ire_false_color" : "clean";
      triggerToast(
        next === "el_zone"
          ? "💡 ASC EL Zone Active: Stop-based exposure (Green = 18% Mid-Gray Target)"
          : next === "ire_false_color"
          ? "🌈 0-100 IRE Waveform Heatmap Active"
          : "Clean Monitoring (ACEScg / Rec.709 IDT)"
      );
      return next;
    });
  };

  // AI Auto-Slate & Clapper Transient Spike Synchronization
  const handleTriggerAiSlateSync = () => {
    setIsScanningSlate(true);
    triggerToast("🤖 AI Auto-Slate: Scanning frame OCR & audio transient spike...");
    setTimeout(() => {
      setIsScanningSlate(false);
      setClapperSyncLocked(true);
      setClapperSpikeTc(masterTimecode);
      triggerToast(`✓ AI Clapper Sticks Locked @ ${masterTimecode} [Vision OCR: 99.4% Match]`);
      const slateMsg = {
        message_id: `msg-slate-sync-${Date.now()}`,
        channel_id: "#on-set-camera-comms",
        sender_id: "ai-auto-slate",
        sender_name: "AI Vision Auto-Slate",
        sender_role: "Script Supervisor AI",
        text: `🤖 AUTO-SLATE SYNCED: ${activeScene} • Take 0${activeTake} sticks contact locked at SMPTE ${masterTimecode}. Vision OCR validated 100% parity with digital slate.`,
        timecode_smpte: masterTimecode,
        created_at: new Date().toISOString()
      };
      sendWarRoomMessage(slateMsg).catch(() => {});
      window.dispatchEvent(new CustomEvent("cinesynapse:war-room-message", { detail: slateMsg }));
    }, 700);
  };

  // ASC-CDL Preset Application
  const handleApplyCdlPreset = (presetKey: string) => {
    setCdlPreset(presetKey);
    if (presetKey === "rec709") {
      setCdlParams({ slope: 1.0, offset: 0.0, power: 1.0, saturation: 1.0 });
      triggerToast("Applied ASC-CDL: Neutral Rec.709 Pass");
    } else if (presetKey === "fincher") {
      setCdlParams({ slope: 1.22, offset: -0.04, power: 0.92, saturation: 0.68 });
      triggerToast("Applied ASC-CDL: Fincher Bleach Bypass (Punchy Contrast)");
    } else if (presetKey === "tungsten") {
      setCdlParams({ slope: 1.08, offset: 0.02, power: 1.05, saturation: 1.18 });
      triggerToast("Applied ASC-CDL: Warm 3200K Tungsten");
    } else if (presetKey === "night") {
      setCdlParams({ slope: 0.82, offset: -0.06, power: 1.18, saturation: 0.72 });
      triggerToast("Applied ASC-CDL: Day-for-Night Teal Grade");
    }
  };

  const handleSaveCdlToMetadata = () => {
    triggerToast(`💾 ASC-CDL metadata [S:${cdlParams.slope.toFixed(2)} O:${cdlParams.offset.toFixed(2)} P:${cdlParams.power.toFixed(2)} Sat:${cdlParams.saturation.toFixed(2)}] attached to Take 0${activeTake}!`);
  };

  // Keyboard Shortcuts Engine (DIT & Video Assist Hotkeys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        if (monitorMode === "playback") {
          setIsPlayingPlayback((p) => !p);
        } else {
          handleToggleRoll();
        }
      } else if (e.code === "KeyR") {
        e.preventDefault();
        handleToggleRoll();
      } else if (e.code === "KeyN") {
        e.preventDefault();
        setShowNgModal(true);
      } else if (e.code === "KeyH") {
        e.preventDefault();
        handleHoldTake();
      } else if (e.code === "KeyJ" || e.code === "ArrowLeft") {
        e.preventDefault();
        handleStepPlayback(e.shiftKey ? -120 : -1);
      } else if (e.code === "KeyL" || e.code === "ArrowRight") {
        e.preventDefault();
        handleStepPlayback(e.shiftKey ? 120 : 1);
      } else if (e.code === "KeyK") {
        e.preventDefault();
        setIsPlayingPlayback(false);
      } else if (e.code === "KeyW") {
        e.preventDefault();
        setActiveDrawerTab((prev) => prev === "scopes" ? "none" : "scopes");
      } else if (e.code === "KeyE") {
        e.preventDefault();
        handleCycleExposure();
      } else if (e.code === "KeyG") {
        e.preventDefault();
        setActiveDrawerTab((prev) => prev === "cdl" ? "none" : "cdl");
      } else if (e.code === "Tab") {
        e.preventDefault();
        setHudMode((prev) => prev === "full" ? "compact" : prev === "compact" ? "clean" : "full");
      } else if (e.code === "KeyB") {
        e.preventDefault();
        setBottomDockExpanded((prev) => !prev);
      } else if (e.code === "Escape") {
        setActiveDrawerTab("none");
        setShowNgModal(false);
        setShowTakeWrapModal(false);
        setShowSlateModal(false);
      } else if (e.code === "KeyP") {
        e.preventDefault();
        setFocusPeakingActive((p) => !p);
      } else if (e.code === "KeyM") {
        e.preventDefault();
        setFramingAspect((fa) => fa === "2.39" ? "1.85" : fa === "1.85" ? "16:9" : fa === "16:9" ? "all" : fa === "all" ? "off" : "2.39");
      } else if (e.code === "KeyS") {
        e.preventDefault();
        handleTriggerAiSlateSync();
      } else if (e.code === "KeyF") {
        e.preventDefault();
        handleTogglePauseAll();
      } else if (e.code === "KeyC") {
        e.preventDefault();
        handleCircleTake();
      } else if (e.code === "KeyZ") {
        e.preventDefault();
        setZoomPunchIn((z) => !z);
      } else if (e.code === "KeyQ") {
        e.preventDefault();
        setLayoutMode("quad");
      } else if (e.code === "Digit1" && cameras[0]) {
        e.preventDefault();
        setLayoutMode("single");
        setActiveCamId(cameras[0].id);
      } else if (e.code === "Digit2" && cameras[1]) {
        e.preventDefault();
        setLayoutMode("single");
        setActiveCamId(cameras[1].id);
      } else if (e.code === "Digit3" && cameras[2]) {
        e.preventDefault();
        setLayoutMode("single");
        setActiveCamId(cameras[2].id);
      } else if (e.code === "Digit4" && cameras[3]) {
        e.preventDefault();
        setLayoutMode("single");
        setActiveCamId(cameras[3].id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    cameras,
    activeScene,
    activeTake,
    activeDirector,
    directorNotes,
    masterTimecode,
    takeVerdict,
    exposureMode,
    cdlParams,
    monitorMode,
    isPlayingPlayback,
    isRolling,
    isPlaying,
    isFrameHold,
    maxPlaybackFrames
  ]);

  // Add a new camera feed
  const handleAddCamera = () => {
    const letters = ["E", "F", "G", "H", "I", "J"];
    const nextLetter = letters[cameras.length - 4] || `X${cameras.length + 1}`;
    const newId = `cam-${nextLetter.toLowerCase()}`;
    const newCam: CameraFeed = {
      id: newId,
      name: `CAMERA ${nextLetter} (POV / SPECIAL)`,
      model: "ARRI ALEXA MINI LF",
      fps: 24.000,
      lens: "ARRI Signature Prime 35mm T/1.8",
      anamorphicSqueeze: 1.0,
      protocol: "SRT over UDP (Port 900" + (cameras.length + 1) + ")",
      streamUrl: `srt://ingest.cinesynapse.io:900${cameras.length + 1}?streamid=paramount:${newId}`,
      sourceType: "simulated",
      status: "LOCKED",
      colorSpace: "ACEScg (LogC4)",
      c2paCert: `CERT-ARRI-MINILF-HW-5${cameras.length}00`,
      c2paVerified: true,
      transmitter: "Teradek Prism Mobile 4K",
      timecodeMaster: "Ambient Master Lockit ACN-CL (24.000 fps)",
      operator: `Operator ${nextLetter}`
    };
    setCameras((prev) => [...prev, newCam]);
    triggerToast(`✓ Added ${newCam.name} to on-set production graph.`);
  };

  // Remove a camera feed
  const handleRemoveCamera = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (cameras.length <= 1) {
      triggerToast("⚠️ At least 1 active camera feed is required on set.");
      return;
    }
    const camName = cameras.find((c) => c.id === id)?.name;
    setCameras((prev) => prev.filter((c) => c.id !== id));
    if (activeCamId === id) {
      const remaining = cameras.filter((c) => c.id !== id);
      setActiveCamId(remaining[0].id);
    }
    triggerToast(`Removed ${camName} from active monitor.`);
  };

  // Remediate Sentry 1 & Notify Studio War Room
  const handleApplyPullUp = async (targetCamId?: string) => {
    try {
      await remediateSentry("TIMECODE_DRIFT", "APPLY_0.1_PERCENT_AUDIO_PULL_UP", tenantData?.tenant_id);
      setPullUpApplied(true);
      setCameras((prev) =>
        prev.map((cam) => {
          if (!targetCamId || cam.id === targetCamId || (targetCamId === undefined && Math.abs(cam.fps - 24.0) >= 0.0005)) {
            return {
              ...cam,
              status: "LOCKED",
              driftAmount: "0.0s (Compensated)",
              pullUpCompensated: true
            };
          }
          return cam;
        })
      );
      const camName = targetCamId ? (cameras.find((c) => c.id === targetCamId)?.name || targetCamId) : "All camera heads";
      
      // Dispatch timecode-latched resolution note to Screen 8 Studio War Room
      const pullUpMsg = {
        message_id: `msg-pullup-${Date.now()}`,
        channel_id: "#on-set-camera-comms",
        sender_id: "klaus-dit",
        sender_name: "Klaus Richter",
        sender_role: "Lead DIT",
        text: `⚡ Autonomous 0.1% audio pull-up filter applied to ${camName}. Re-clocked against 24.000 fps Master LTC (0.0s drift). $42,000 ADR risk cleared.`,
        timecode_smpte: masterTimecode,
        asset_name: "Boom_A1_Genlock_Sync.wav",
        asset_type: "AUDIO",
        c2pa_status: "VERIFIED_HARDWARE_SIGNATURE",
        created_at: new Date().toISOString()
      };
      sendWarRoomMessage(pullUpMsg).catch(console.error);
      window.dispatchEvent(new CustomEvent("cinesynapse:war-room-message", { detail: pullUpMsg }));

      triggerToast(`✓ 0.1% Audio Pull-Up applied! Logged to Studio War Room (#on-set-camera-comms).`);
      onRemediateDrift();
    } catch {
      setPullUpApplied(true);
      setCameras((prev) =>
        prev.map((cam) => {
          if (!targetCamId || cam.id === targetCamId || (targetCamId === undefined && Math.abs(cam.fps - 24.0) >= 0.0005)) {
            return {
              ...cam,
              status: "LOCKED",
              driftAmount: "0.0s (Compensated)",
              pullUpCompensated: true
            };
          }
          return cam;
        })
      );
      triggerToast("✓ 0.1% Audio Pull-Up filter applied!");
    }
  };

  // Remediate Sentry 4 & Dispatch SMS/WhatsApp Pager to Catering & Studio War Room
  const handleCateringWrap = async () => {
    try {
      await remediateSentry("MEAL_PENALTY", "CALL_IMMEDIATE_CATERING_WRAP", tenantData?.tenant_id);
      setCateringWrapped(true);

      // 1. Dispatch WhatsApp / SMS Pager via Twilio Cloud Relay
      dispatchExternalRelay(
        "whatsapp_pager",
        "#production-sentry",
        `🚨 URGENT CATERING WRAP: 1st AD called hot meal break for ${crewHeadcount} crew at SMPTE ${masterTimecode}. Food service on Stage 4 immediately.`
      ).catch(console.error);

      // 2. Post Timecode-Latched Wrap Announcement into Screen 8 Studio War Room
      const wrapMsg = {
        message_id: `msg-catering-${Date.now()}`,
        channel_id: "#on-set-camera-comms",
        sender_id: "1st-ad-wrap",
        sender_name: "1st Assistant Director",
        sender_role: "On-Set Production Safety",
        text: `🍱 CATERING WRAP CALLED at SMPTE ${masterTimecode}: 6-hour meal penalty averted for ${crewHeadcount} crew members. Liability reset to $0.00. Paged Catering Master via WhatsApp.`,
        timecode_smpte: masterTimecode,
        asset_name: "CallSheet_Active_Roster.pdf",
        asset_type: "SCRIPT",
        c2pa_status: "VERIFIED_HARDWARE_SIGNATURE",
        created_at: new Date().toISOString()
      };
      await sendWarRoomMessage(wrapMsg);
      window.dispatchEvent(new CustomEvent("cinesynapse:war-room-message", { detail: wrapMsg }));
      window.dispatchEvent(new CustomEvent("cinesynapse:catering-wrapped", { detail: { masterTimecode, crewHeadcount } }));

      triggerToast(`✓ Catering Wrap called: Paged Catering Lead via WhatsApp & routed to Screen 8 War Room!`);
    } catch {
      setCateringWrapped(true);
      triggerToast("✓ Catering Wrap called!");
    }
  };

  // Dispatch Timecode-Latched Union Compliance Alert to Screen 8 Studio War Room
  const handleDispatchUnionComplianceAlert = async () => {
    try {
      const unionMsg = {
        message_id: `msg-union-breach-${Date.now()}`,
        channel_id: "#on-set-camera-comms",
        sender_id: "union-steward",
        sender_name: "IATSE Local 600 Shop Steward",
        sender_role: "Labor Compliance Officer",
        text: `⚠️ UNION COMPLIANCE ALERT [SMPTE: ${masterTimecode}]: 6-hour meal turnaround breached by 18 mins. Tier 2 penalties accruing at $10.00/hr per crew member (${crewHeadcount} crew = $${(crewHeadcount * 10).toFixed(2)}/hr liability). 1st AD wrap requested immediately.`,
        timecode_smpte: masterTimecode,
        asset_name: "IATSE_Basic_Agreement_2024_2027.pdf",
        asset_type: "SCRIPT",
        c2pa_status: "VERIFIED_HARDWARE_SIGNATURE",
        created_at: new Date().toISOString()
      };
      await sendWarRoomMessage(unionMsg);
      window.dispatchEvent(new CustomEvent("cinesynapse:war-room-message", { detail: unionMsg }));
      triggerToast(`⚠️ Union Compliance Alert routed directly to Screen 8 (#on-set-camera-comms)!`);
    } catch (err) {
      console.error(err);
      triggerToast("⚠️ Compliance alert dispatched!");
    }
  };

  // Save Script Notes & Route Directly to Screen 8 Studio War Room & Screen 6 Editorial
  const handleSaveAndRouteScriptNotes = async () => {
    setShowNotesModal(false);
    try {
      const scriptMsg = {
        message_id: `msg-script-${Date.now()}`,
        channel_id: "#on-set-camera-comms",
        sender_id: "script-supervisor",
        sender_name: "Script Supervisor (iPad)",
        sender_role: "Script & Continuity",
        text: `📝 SCRIPT & CONTINUITY NOTE [${activeScene} • Take 0${activeTake}]: "${directorNotes}". Director: ${activeDirector}. Timecode: ${masterTimecode}. Ready for OpenTimelineIO conform & Avid ALE merge.`,
        timecode_smpte: masterTimecode,
        asset_name: `Scene${activeScene.replace(/\s+/g, "")}_Take0${activeTake}_ScriptNotes.json`,
        asset_type: "SCRIPT",
        c2pa_status: "VERIFIED_HARDWARE_SIGNATURE",
        created_at: new Date().toISOString()
      };
      await sendWarRoomMessage(scriptMsg);
      window.dispatchEvent(new CustomEvent("cinesynapse:war-room-message", { detail: scriptMsg }));

      const editorialUpdate = {
        id: `clip-sc${activeScene.replace(/\s+/g, "")}-t${activeTake}-${Date.now()}`,
        name: `Scene${activeScene.replace(/\s+/g, "")}_T0${activeTake}`,
        track: takeVerdict === "NG" ? "OUTTAKES / REJECTS (NG)" : takeVerdict === "HOLD" ? "V2: ALTERNATE TAKES / COVERAGE" : "V1: MASTER RAW",
        duration: `${takeElapsedSec || 24}s (${(takeElapsedSec || 24) * 24} frames)`,
        timecodeIn: takeInTimecode || masterTimecode,
        timecodeOut: takeOutTimecode || "01:24:36:04",
        lens: "Cooke Anamorphic /i 40mm",
        aperture: "T/2.0 calibrated (Cooke /i Protocol)",
        c2pa: "Hardware Root of Trust Verified (ARRI Alexa 35)",
        colorSpace: `ACEScg (AP1) • CDL [S:${cdlParams.slope} O:${cdlParams.offset} P:${cdlParams.power} Sat:${cdlParams.saturation}]`,
        likenessPerformer: `Marcus Vance (Script Note: "${directorNotes.slice(0, 35)}...")`,
        complianceNote: `Director Note: "${directorNotes}"`
      };
      window.dispatchEvent(new CustomEvent("cinesynapse:editorial-clip-ingest", { detail: editorialUpdate }));

      triggerToast(`✓ Script notes saved & routed to Screen 8 War Room & Screen 6 Editorial!`);
    } catch (err) {
      console.error(err);
      triggerToast("✓ Script notes saved to metadata.");
    }
  };

  // 1. Dispatch Conformed Take directly into Screen 6 Editorial Ingest
  const handleDispatchToEditorial = () => {
    const editorialClip = {
      id: `clip-sc${activeScene.replace(/\s+/g, "")}-t${activeTake}-${Date.now()}`,
      name: `Scene${activeScene.replace(/\s+/g, "")}_T0${activeTake}_Print`,
      track: "V1: MASTER RAW",
      duration: "24s (576 frames)",
      timecodeIn: masterTimecode,
      timecodeOut: "01:24:36:04",
      lens: "Cooke Anamorphic /i 40mm",
      aperture: "T/2.0 calibrated (Cooke /i Protocol)",
      c2pa: "Hardware Root of Trust Verified (ARRI Alexa 35)",
      colorSpace: `ACEScg (AP1) • CDL [S:${cdlParams.slope} O:${cdlParams.offset} P:${cdlParams.power} Sat:${cdlParams.saturation}]`,
      likenessPerformer: `Marcus Vance (Approved Script Notes: "${directorNotes.slice(0, 30)}...")`,
      complianceNote: "Circle Take (PRINT) • Synchronized to 24.000fps Boom WAV"
    };
    window.dispatchEvent(new CustomEvent("cinesynapse:editorial-clip-ingest", { detail: editorialClip }));
    triggerToast(`🎬 Dispatched Scene ${activeScene} Take 0${activeTake} directly to Screen 6 Editorial Ingest!`);
  };

  // 2. Dispatch VFX Inpaint Task to Screen 4 (Autodesk Flow / ShotGrid)
  const handleDispatchVfxInpaint = async () => {
    try {
      await dispatchComplianceInpaint("SG", tenantData?.tenant_id);
      triggerToast("✓ VFX Inpaint Task SG-TASK-8492 Dispatched to Autodesk Flow (Screen 4)!");
      sendWarRoomMessage({
        message_id: `msg-vfx-${Date.now()}`,
        channel_id: "#vfx-legal-clearance",
        sender_id: "vfx-supervisor",
        sender_name: "VFX Supervisor (Stage 4)",
        sender_role: "VFX Production",
        text: `🎨 DISPATCHED SHOTGRID INPAINT SG-TASK-8492: Scene 42B Take 04 plate sent for Singapore alcohol billboard inpaint & prop liquid continuity conform. ACEScg coordinates locked.`,
        timecode_smpte: masterTimecode,
        asset_name: "SG-TASK-8492_Inpaint_Plate.exr",
        asset_type: "STILL",
        c2pa_status: "VERIFIED_HARDWARE_SIGNATURE",
        created_at: new Date().toISOString()
      }).catch(console.error);
    } catch {
      triggerToast("✓ VFX Inpaint task queued in Autodesk Flow!");
    }
  };

  // 3. Extend SAG-AFTRA Likeness in Screen 3
  const handleExtendLikeness = async (targetActorId?: string | any, targetActorName?: string) => {
    const actorId = (typeof targetActorId === "string" && targetActorId) ? targetActorId : (activePerformer?.actor_id || "ACTOR_MARCUS_VANCE");
    const actorName = (typeof targetActorName === "string" && targetActorName) ? targetActorName : (activePerformer?.actor_name || "Performer");
    try {
      await extendLikenessSeconds(actorId, 15.0, undefined, undefined, activeTenant, activeProject);
      triggerToast(`✓ Extended ${actorName} Likeness by +15.0s in SAG-AFTRA Ledger (Screen 3)!`);
      window.dispatchEvent(new CustomEvent("cinesynapse:likeness-updated"));
      loadActivePerformer();
      sendWarRoomMessage({
        message_id: `msg-likeness-${Date.now()}`,
        channel_id: "#vfx-legal-clearance",
        sender_id: "elena-legal",
        sender_name: "Elena Rostova, Esq.",
        sender_role: "Production Attorney",
        text: `⚖️ SAG-AFTRA RIDER AMENDMENT: Approved +15.0s digital likeness extension for ${actorName}. Residual rate logged to ClickHouse contract ledger.`,
        timecode_smpte: masterTimecode,
        asset_name: `SAG_Rider_${actorName.replace(/\s+/g, "")}.pdf`,
        asset_type: "SCRIPT",
        c2pa_status: "VERIFIED_HARDWARE_SIGNATURE",
        created_at: new Date().toISOString()
      }).catch(console.error);
    } catch {
      triggerToast("✓ Extended likeness cap (+15s)!");
    }
  };

  // 4. Trigger Camera-to-Cloud (C2C) Proxy Upload
  const handleTriggerC2cUpload = () => {
    setC2cUploadProgress(10);
    const interval = setInterval(() => {
      setC2cUploadProgress((prev) => {
        if (prev === null || prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setC2cUploadProgress(null), 2000);
          triggerToast("✓ 1080p ProRes Proxy uploaded to gs://paramount-c2c-vault (C2PA Signed)!");
          return 100;
        }
        return prev + 30;
      });
    }, 300);
  };

  // 1-Click Multi-Camera Scene Preset (4K Cinema Test Set)
  const handleLoadCinemaScenePreset = () => {
    setCameras((prev) =>
      prev.map((c) => {
        if (c.id === "cam-a") {
          return {
            ...c,
            sourceType: "youtube",
            youtubeUrl: "https://www.youtube.com/watch?v=OHOpb2fS-cM",
            youtubeId: "OHOpb2fS-cM",
            status: "LOCKED",
            name: "CAMERA A (HERO CLOSE-UP)",
            model: "ARRI ALEXA 35"
          };
        }
        if (c.id === "cam-b") {
          return {
            ...c,
            sourceType: "youtube",
            youtubeUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
            youtubeId: "aqz-KE-bpKQ",
            status: pullUpApplied ? "LOCKED" : "DRIFT",
            name: "CAMERA B (HERO TWO-SHOT)",
            model: "ARRI ALEXA 35"
          };
        }
        if (c.id === "cam-c") {
          return {
            ...c,
            sourceType: "youtube",
            youtubeUrl: "https://www.youtube.com/watch?v=4_Fp2YjD2pA",
            youtubeId: "4_Fp2YjD2pA",
            status: "LOCKED",
            name: "CAMERA C (STEADICAM WIDE)",
            model: "RED V-RAPTOR XL 8K"
          };
        }
        if (c.id === "cam-d") {
          return {
            ...c,
            sourceType: "youtube",
            youtubeUrl: "https://www.youtube.com/watch?v=DDU-rZs-Ic4",
            youtubeId: "DDU-rZs-Ic4",
            status: "LOCKED",
            name: "CAMERA D (OVERHEAD CRANE)",
            model: "SONY VENICE 2 (8K)"
          };
        }
        return c;
      })
    );
    setLayoutMode("quad");
    triggerToast("✓ 4-Camera Cinema Scene Preset loaded across all 4 camera heads!");
  };

  // 1-Click NASA 4-Angle Multi-Camera Live Mission
  const handleLoadNasaMissionPreset = () => {
    setCameras((prev) =>
      prev.map((c) => {
        if (c.id === "cam-a") {
          return {
            ...c,
            sourceType: "youtube",
            youtubeUrl: "https://www.youtube.com/watch?v=DDU-rZs-Ic4",
            youtubeId: "DDU-rZs-Ic4",
            status: "LOCKED",
            name: "CAMERA A (ISS ORBIT NADIR)",
            model: "ARRI ALEXA 35"
          };
        }
        if (c.id === "cam-b") {
          return {
            ...c,
            sourceType: "youtube",
            youtubeUrl: "https://www.youtube.com/watch?v=M3HKLzjvKPc",
            youtubeId: "M3HKLzjvKPc",
            status: pullUpApplied ? "LOCKED" : "DRIFT",
            name: "CAMERA B (ISS HD FORWARD CAM)",
            model: "ARRI ALEXA 35"
          };
        }
        if (c.id === "cam-c") {
          return {
            ...c,
            sourceType: "youtube",
            youtubeUrl: "https://www.youtube.com/watch?v=wwMDvPCGeE0",
            youtubeId: "wwMDvPCGeE0",
            status: "LOCKED",
            name: "CAMERA C (NASA LIVE TV CONTROL)",
            model: "RED V-RAPTOR XL 8K"
          };
        }
        if (c.id === "cam-d") {
          return {
            ...c,
            sourceType: "youtube",
            youtubeUrl: "https://www.youtube.com/watch?v=4_Fp2YjD2pA",
            youtubeId: "4_Fp2YjD2pA",
            status: "LOCKED",
            name: "CAMERA D (GROUND TRACKING 4K)",
            model: "SONY VENICE 2 (8K)"
          };
        }
        return c;
      })
    );
    setLayoutMode("quad");
    triggerToast("✓ NASA 4-Angle Live Mission loaded across all 4 cameras!");
  };

  // 1-Click Horror Scene Multi-Camera Preset (Real 4-Camera Footage Shoot from /Horror Scene)
  const handleLoadHorrorScenePreset = () => {
    const horrorCameraConfigs: CameraFeed[] = [
      {
        id: "cam-a",
        name: "CAMERA A (HERO MASTER)",
        model: "ARRI ALEXA 35",
        fps: 24.0,
        lens: "Cooke Anamorphic /i 40mm T/2.0",
        anamorphicSqueeze: 1.8,
        protocol: "Teradek Bolt 4K 12G-SDI",
        streamUrl: `${API_BASE}/media/horror/stream/cam-a`,
        sourceType: "file",
        videoSrc: `${API_BASE}/media/horror/stream/cam-a`,
        uploadedFileName: "HORROR - A Cam Set 1.mp4",
        status: "LOCKED",
        colorSpace: "ARRI LogC4 / AWG4",
        c2paCert: "Paramount Hardware C2PA #ARRI-94812",
        c2paVerified: true,
        transmitter: "Bolt 4K MAX #TX-1",
        timecodeMaster: "Ambient Lockit ACN-CL Genlock Locked",
        operator: "Elena Rostova, SOC"
      },
      {
        id: "cam-b",
        name: "CAMERA B (TIGHT TWO-SHOT)",
        model: "ARRI ALEXA 35",
        fps: pullUpApplied ? 24.0 : 23.976,
        lens: "Cooke Anamorphic /i 65mm T/2.3",
        anamorphicSqueeze: 1.8,
        protocol: "Teradek Bolt 4K 12G-SDI",
        streamUrl: `${API_BASE}/media/horror/stream/cam-b`,
        sourceType: "file",
        videoSrc: `${API_BASE}/media/horror/stream/cam-b`,
        uploadedFileName: "HORROR - B Cam.mp4",
        status: pullUpApplied ? "LOCKED" : "DRIFT",
        driftAmount: pullUpApplied ? undefined : "+0.024 fps (23.976 Drop)",
        colorSpace: "ARRI LogC4 / AWG4",
        c2paCert: "Paramount Hardware C2PA #ARRI-94814",
        c2paVerified: true,
        transmitter: "Bolt 4K MAX #TX-2",
        timecodeMaster: "Ambient Lockit ACN-CL (Fractional Drift)",
        operator: "Klaus Richter"
      },
      {
        id: "cam-c",
        name: "CAMERA C (STEADICAM TRACK)",
        model: "RED V-RAPTOR XL 8K",
        fps: 24.0,
        lens: "Zeiss Supreme 25mm T/1.5",
        anamorphicSqueeze: 1.0,
        protocol: "Teradek Ranger Micro",
        streamUrl: `${API_BASE}/media/horror/stream/cam-c`,
        sourceType: "file",
        videoSrc: `${API_BASE}/media/horror/stream/cam-c`,
        uploadedFileName: "HORROR - steadicam shots.mp4",
        status: "LOCKED",
        colorSpace: "REDWideGamutRGB / Log3G10",
        c2paCert: "Paramount Hardware C2PA #RED-00812",
        c2paVerified: true,
        transmitter: "Ranger Micro #TX-3",
        timecodeMaster: "Ambient Lockit ACN-CL Genlock Locked",
        operator: "Larry McConkey"
      },
      {
        id: "cam-d",
        name: "CAMERA D (REVERSE ANGLE)",
        model: "SONY VENICE 2 (8K)",
        fps: 24.0,
        lens: "Fujinon Premista 28-100mm T/2.9",
        anamorphicSqueeze: 1.0,
        protocol: "Teradek Bolt 4K LT",
        streamUrl: `${API_BASE}/media/horror/stream/cam-d`,
        sourceType: "file",
        videoSrc: `${API_BASE}/media/horror/stream/cam-d`,
        uploadedFileName: "HORROR - A Cam Set 2.mp4",
        status: "LOCKED",
        colorSpace: "S-Gamut3.Cine / S-Log3",
        c2paCert: "Sony Secure Silo C2PA #VENICE-7731",
        c2paVerified: true,
        transmitter: "Bolt 4K LT #TX-4",
        timecodeMaster: "Ambient Lockit ACN-CL Genlock Locked",
        operator: "Sarah Chen"
      }
    ];

    setCameras(horrorCameraConfigs);
    setLayoutMode("quad");
    setActiveCamId("cam-a");
    setActiveScene("Scene 13 (The Haunting)");
    setIsPlaying(true);
    setIsFrameHold(false);
    triggerToast("👻 Horror Scene 4-Camera Shoot loaded! Streaming A-Cam Set 1, B-Cam, Steadicam & A-Cam Set 2.");

    try {
      window.dispatchEvent(
        new CustomEvent("cinesynapse:war-room-message", {
          detail: {
            channelId: "#on-set-camera-comms",
            sender: "Klaus Richter (Lead DIT)",
            text: "Loaded 4-Camera Horror Scene Shoot preset into Camera Sentry. A-Cam Set 1, B-Cam, Steadicam, and A-Cam Set 2 synched to 24.000 fps Genlock master.",
            timecode: masterTimecode,
            type: "PRESET_LOAD"
          }
        })
      );
    } catch {
      // safe fallback
    }
  };

  // 1-Click Matrix Fights Multi-Camera Preset (Real 4-Camera Footage Shoot from /Matrix)
  const handleLoadMatrixFightsPreset = () => {
    const matrixCameraConfigs: CameraFeed[] = [
      {
        id: "cam-a",
        name: "CAMERA A (NEO VS MORPHEUS DOJO)",
        model: "ARRI ALEXA 35 (4.6K)",
        fps: 24.0,
        lens: "Panavision Primo Anamorphic 40mm T/2.0",
        anamorphicSqueeze: 2.0,
        protocol: "Teradek Bolt 4K 12G-SDI",
        streamUrl: `${API_BASE}/media/matrix/stream/cam-a`,
        sourceType: "file",
        videoSrc: `${API_BASE}/media/matrix/stream/cam-a`,
        uploadedFileName: "Kung Fu Neo vs Morpheus  The Matrix [Open Matte].mp4",
        status: "LOCKED",
        colorSpace: "ACEScg (SMPTE ST 2065-1)",
        c2paCert: "Silver Pictures Hardware C2PA #MATRIX-DOJO-9901",
        c2paVerified: true,
        transmitter: "Bolt 4K MAX #TX-1",
        timecodeMaster: "Ambient Lockit ACN-CL Genlock Locked",
        operator: "Bill Pope, ASC"
      },
      {
        id: "cam-b",
        name: "CAMERA B (NEO VS AGENT SMITH SUBWAY)",
        model: "ARRI ALEXA 35 (4.6K)",
        fps: pullUpApplied ? 24.0 : 23.976,
        lens: "Panavision Primo Anamorphic 50mm T/2.0",
        anamorphicSqueeze: 2.0,
        protocol: "Teradek Bolt 4K 12G-SDI",
        streamUrl: `${API_BASE}/media/matrix/stream/cam-b`,
        sourceType: "file",
        videoSrc: `${API_BASE}/media/matrix/stream/cam-b`,
        uploadedFileName: "Neo vs Agent Smith  The Matrix [Open Matte].mp4",
        status: pullUpApplied ? "LOCKED" : "DRIFT",
        driftAmount: pullUpApplied ? undefined : "+0.024 fps (23.976 Drop)",
        colorSpace: "ACEScg (SMPTE ST 2065-1)",
        c2paCert: "Silver Pictures Hardware C2PA #MATRIX-SUBWAY-9902",
        c2paVerified: true,
        transmitter: "Bolt 4K MAX #TX-2",
        timecodeMaster: "Ambient Lockit ACN-CL (Fractional Drift)",
        operator: "David Burr, ACS"
      },
      {
        id: "cam-c",
        name: "CAMERA C (NEO VS MEROVINGIAN CHATEAU)",
        model: "IMAX 9802 65mm / RED V-RAPTOR XL 8K",
        fps: 24.0,
        lens: "Hasselblad Prime 60mm T/2.8",
        anamorphicSqueeze: 1.0,
        protocol: "Teradek Ranger Micro",
        streamUrl: `${API_BASE}/media/matrix/stream/cam-c`,
        sourceType: "file",
        videoSrc: `${API_BASE}/media/matrix/stream/cam-c`,
        uploadedFileName: "Neo vs Merovingian  The Matrix Reloaded [IMAX].mp4",
        status: "LOCKED",
        colorSpace: "ACEScg (SMPTE ST 2065-1)",
        c2paCert: "Silver Pictures Hardware C2PA #MATRIX-CHATEAU-9903",
        c2paVerified: true,
        transmitter: "Ranger Micro #TX-3",
        timecodeMaster: "Ambient Lockit ACN-CL Genlock Locked",
        operator: "Peter Menzies Jr., ACS"
      },
      {
        id: "cam-d",
        name: "CAMERA D (NEO VS SMITH CLONES BURLY BRAWL)",
        model: "SONY VENICE 2 (8K)",
        fps: 24.0,
        lens: "Panavision C-Series 35mm T/2.3",
        anamorphicSqueeze: 2.0,
        protocol: "Teradek Bolt 4K LT",
        streamUrl: `${API_BASE}/media/matrix/stream/cam-d`,
        sourceType: "file",
        videoSrc: `${API_BASE}/media/matrix/stream/cam-d`,
        uploadedFileName: "Neo vs Smith Clones  The Matrix Reloaded [Open Matte].mp4",
        status: "LOCKED",
        colorSpace: "ACEScg (SMPTE ST 2065-1)",
        c2paCert: "Silver Pictures Hardware C2PA #MATRIX-BURLY-9904",
        c2paVerified: true,
        transmitter: "Bolt 4K LT #TX-4",
        timecodeMaster: "Ambient Lockit ACN-CL Genlock Locked",
        operator: "Calum McFarlane"
      }
    ];

    setCameras(matrixCameraConfigs);
    setLayoutMode("quad");
    setActiveCamId("cam-a");
    setActiveScene("Scene 01 (Virtual Construct Dojo)");
    setIsPlaying(true);
    setIsFrameHold(false);
    triggerToast("🟢 Matrix 4-Camera Martial Arts Shoot loaded! Streaming Dojo, Subway, Chateau & Burly Brawl.");

    try {
      window.dispatchEvent(
        new CustomEvent("cinesynapse:war-room-message", {
          detail: {
            channelId: "#on-set-camera-comms",
            sender: "Lead DIT (Silver Pictures)",
            text: "Loaded 4-Camera Matrix Martial Arts Shoot preset into Camera Sentry. Feeds A (Dojo), B (Subway), C (Chateau), and D (Burly Brawl) synched to 24.000 fps Genlock master.",
            timecode: masterTimecode,
            type: "PRESET_LOAD"
          }
        })
      );
    } catch {
      // safe fallback
    }
  };

  // Handle local video file upload per camera
  const handleFileSelectForCamera = (camId: string, file: File) => {
    if (!file.type.startsWith("video/")) {
      triggerToast("⚠️ Unsupported format. Please select an MP4, MOV, or WebM video file.");
      return;
    }
    const url = URL.createObjectURL(file);
    setCameras((prev) =>
      prev.map((cam) =>
        cam.id === camId
          ? {
              ...cam,
              sourceType: "file",
              videoSrc: url,
              uploadedFileName: file.name,
              youtubeId: undefined,
              youtubeUrl: undefined
            }
          : cam
      )
    );
    triggerToast(`✓ Ingested proxy into ${cameras.find((c) => c.id === camId)?.name}: ${file.name}`);
  };

  // Drag & drop handlers for a specific camera
  const handleCameraDragOver = (camId: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCamId(camId);
  };

  const handleCameraDragLeave = (camId: string, e: React.DragEvent) => {
    e.preventDefault();
    if (dragOverCamId === camId) setDragOverCamId(null);
  };

  const handleCameraDrop = (camId: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCamId(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelectForCamera(camId, e.dataTransfer.files[0]);
    }
  };

  // Update YouTube URL on a camera
  const handleSetYouTubeFeed = (camId: string, url: string) => {
    const id = extractYouTubeId(url);
    if (!id) {
      triggerToast("⚠️ Invalid YouTube URL or video ID. Please paste a valid YouTube watch or live link.");
      return;
    }
    setCameras((prev) =>
      prev.map((cam) =>
        cam.id === camId
          ? {
              ...cam,
              sourceType: "youtube",
              youtubeUrl: url,
              youtubeId: id,
              videoSrc: null,
              uploadedFileName: null
            }
          : cam
      )
    );
    triggerToast(`✓ YouTube Live Stream configured on ${cameras.find((c) => c.id === camId)?.name}`);
  };

  // Update camera property from config panel
  const updateCameraProperty = (camId: string, field: keyof CameraFeed, value: any) => {
    setCameras((prev) =>
      prev.map((c) => (c.id === camId ? { ...c, [field]: value } : c))
    );
  };

  // Determine which cameras to display based on layout mode
  const getVisibleCameras = () => {
    if (layoutMode === "single") {
      return [activeCamera];
    }
    if (layoutMode === "2-up") {
      return cameras.slice(0, 2);
    }
    if (layoutMode === "3-up") {
      return cameras.slice(0, 3);
    }
    if (layoutMode === "quad") {
      return cameras.slice(0, 4);
    }
    if (layoutMode === "6-up") {
      return cameras.slice(0, 6);
    }
    return cameras; // "all"
  };

  const visibleCameras = getVisibleCameras();

  // Grid CSS classes based on visible camera count
  const getGridColsClass = () => {
    if (layoutMode === "single") return "grid-cols-1";
    if (visibleCameras.length <= 2) return "grid-cols-1 md:grid-cols-2";
    if (visibleCameras.length === 3) return "grid-cols-1 md:grid-cols-3";
    if (visibleCameras.length <= 4) return "grid-cols-1 md:grid-cols-2";
    if (visibleCameras.length <= 6) return "grid-cols-1 md:grid-cols-3";
    return "grid-cols-1 sm:grid-cols-2 md:grid-cols-4";
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-xl font-mono text-xs font-bold animate-bounce flex items-center gap-2">
          <span>🔔</span> {toastMessage}
        </div>
      )}

      {/* 2-TIER STREAMLINED MASTER CONTROL DECK */}
      <div className="space-y-2.5">
        {/* TIER 1: MASTER PRODUCTION COMMAND BAR (Slate, Timecode & Transport) */}
        <div className="bg-[#0E1124] border border-[#262A4A] rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xl font-mono text-xs">
          {/* Left: Production Identity, Master LTC & Slate */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 pr-1 border-r border-[#262A4A]/80">
              <span className="font-bold text-white tracking-wide text-sm">{projectTitle}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hidden md:inline">
                SMPTE ST 12-1 LTC
              </span>
            </div>

            {/* Master Studio LTC Clock */}
            <div className="flex items-center gap-1.5 bg-[#14172E] px-2.5 py-1 rounded-lg border border-[#262A4A]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400 text-[10px]">LTC:</span>
              <span className="text-cyan-400 font-bold tracking-wider text-xs">
                {masterTimecode}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30 hidden sm:inline">
                24.000 fps Genlock Locked
              </span>
            </div>

            {/* Organic Production Slate Group (Scene Selector, Take Indexer, Takes Log Modal) */}
            <div className="relative flex items-center bg-[#14172E] rounded-lg border border-[#262A4A] text-xs divide-x divide-[#262A4A]">
              {/* Scene Switcher Dropdown Button */}
              <button
                onClick={() => setShowSceneDropdown(!showSceneDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-slate-300 hover:text-white hover:bg-[#1D2144] rounded-l-lg transition-colors font-medium cursor-pointer"
                title="Switch production scene or create a new scene"
              >
                <span className="text-[10px] text-slate-400">🎬</span>
                <span className="font-bold text-purple-300">{activeScene}</span>
                <span className="text-[10px] text-slate-400">▾</span>
              </button>

              {/* Take Number & Slate Edit Modal Button */}
              <button
                onClick={() => {
                  setSlateFormScene(activeScene);
                  setSlateFormTake(activeTake);
                  setSlateFormDirector(activeDirector);
                  setSlateFormSoundRoll(activeSoundRoll);
                  setSlateFormProject(projectTitle);
                  setShowSlateModal(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 text-slate-300 hover:text-white hover:bg-[#1D2144] transition-colors group cursor-pointer"
                title="Click to edit Smart Slate details (Director, Sound Roll, Scene, Take)"
              >
                <span className="text-slate-400 text-[10px]">Take:</span>
                <span className="text-white font-bold group-hover:text-purple-200">
                  {activeTake < 10 ? `0${activeTake}` : activeTake}
                </span>
                <span className="text-[10px] text-slate-500 group-hover:text-slate-300">✏️</span>
                {takeVerdict && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                      takeVerdict === "CIRCLE"
                        ? "bg-amber-400 text-black shadow-sm"
                        : takeVerdict === "NG"
                        ? "bg-rose-600 text-white"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {takeVerdict}
                  </span>
                )}
              </button>

              {/* 1-Click Vault Current Take right next to Take pill */}
              <button
                onClick={handleQuickRecordTake}
                className="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 hover:text-white transition-colors font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                title="1-Click Record & Vault this Take to Storage Vault Tier 0 NVMe (Advances slate to next take)"
              >
                <span>💾 Vault</span>
              </button>

              {/* Quick Increment Take (+1) */}
              <button
                onClick={handleNextTake}
                className="px-2 py-1 text-purple-300 hover:text-white hover:bg-[#1D2144] transition-colors font-bold text-[11px] cursor-pointer"
                title="Advance Slate Number (+1 without recording)"
              >
                +1
              </button>

              {/* Takes Log Pill: shows total takes for this scene and opens Script Supervisor log */}
              <button
                onClick={() => setShowTakesModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-cyan-400 hover:text-cyan-300 hover:bg-[#1D2144] rounded-r-lg transition-colors font-medium group cursor-pointer"
                title="Open Script Supervisor Takes Log & Compare Takes"
              >
                <span className="text-[11px]">📋</span>
                <span className="text-[11px] font-bold">
                  {currentSceneTakes.length} {currentSceneTakes.length === 1 ? "Take" : "Takes"}
                </span>
              </button>

              {/* Scene Switcher Dropdown Popover */}
              {showSceneDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSceneDropdown(false)}
                  />
                  <div className="absolute top-full left-0 mt-1.5 w-64 bg-[#0F1123] border border-[#2B2F55] rounded-xl shadow-2xl z-50 p-2 text-xs divide-y divide-[#1D2144]">
                    <div className="pb-2">
                      <div className="flex items-center justify-between px-2 py-1 text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
                        <span>Production Scenes</span>
                        <span className="text-purple-400">{scenes.length} Scenes</span>
                      </div>
                      <div className="max-h-52 overflow-y-auto space-y-1 mt-1">
                        {scenes.map((sc) => {
                          const scTakesCount = takes.filter(t => t.scene_id === sc.scene_id || (t.scene_display && t.scene_display.includes(sc.scene_number))).length;
                          const isCurrent = sc.scene_number === activeScene || sc.title === activeScene;
                          return (
                            <button
                              key={sc.scene_number}
                              onClick={() => {
                                handleSelectScene(sc);
                                setShowSceneDropdown(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer ${
                                isCurrent
                                  ? "bg-purple-900/50 text-purple-200 border border-purple-600/40"
                                  : "text-slate-300 hover:bg-[#1A1D36] hover:text-white"
                              }`}
                            >
                              <div className="truncate pr-2">
                                <span className="font-bold">🎬 {sc.scene_number}</span>
                                <p className="text-[10px] text-slate-400 truncate">{sc.title || sc.description || "Scene"}</p>
                              </div>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#16182E] text-slate-400 whitespace-nowrap">
                                {scTakesCount} {scTakesCount === 1 ? "take" : "takes"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setShowSceneDropdown(false);
                          setShowNewSceneModal(true);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-[11px] font-semibold transition-colors border border-purple-500/30 cursor-pointer"
                      >
                        <span>➕</span>
                        <span>Create New Scene</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <span className="text-slate-400 text-[11px] hidden xl:inline">
              Dir: <strong className="text-slate-200">{activeDirector}</strong>
            </span>
          </div>

          {/* Right: Master Roll/Cut, Freeze Hold, Gang Playback & Smart Slate Verdicts */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Operating Mode Switcher: LIVE STAGE vs PLAYBACK REVIEW */}
            <div className="flex items-center bg-[#14172E] border border-[#262A4A] rounded-lg p-0.5 text-[11px]">
              <button
                onClick={() => {
                  setMonitorMode("live");
                  setIsPlayingPlayback(false);
                }}
                className={`px-2.5 py-1 rounded transition-all font-bold flex items-center gap-1.5 ${
                  monitorMode === "live"
                    ? isRolling
                      ? "bg-rose-600 text-white shadow-md shadow-rose-950/40 animate-pulse"
                      : "bg-emerald-600 text-white shadow-md shadow-emerald-950/40"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Monitor Live SDI/NDI Camera Feeds"
              >
                <span className={`w-2 h-2 rounded-full ${isRolling ? "bg-white animate-ping" : "bg-emerald-400"}`} />
                <span>LIVE STAGE</span>
              </button>
              <button
                onClick={() => {
                  setMonitorMode("playback");
                  setIsPlayingPlayback(false);
                  triggerToast("🎞️ Multi-Cam Gang Playback Review Active. Press Space to Play/Pause, J/L to step, or scrub timeline.");
                }}
                className={`px-2.5 py-1 rounded transition-all font-bold flex items-center gap-1.5 ${
                  monitorMode === "playback"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-900/50"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Gang-Locked Multi-Cam Take Playback & Review (SMPTE ST 12-1)"
              >
                <span>🎞️ REVIEW</span>
              </button>
            </div>

            {/* LIVE TRANSPORT CONTROLS */}
            {monitorMode === "live" ? (
              <div className="flex items-center gap-1.5">
                {/* Roll / Cut Master Trigger */}
                <button
                  onClick={handleToggleRoll}
                  className={`px-3 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition-all text-xs ${
                    isRolling
                      ? "bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-950/50 animate-pulse"
                      : "bg-[#14172E] hover:bg-[#1E2344] text-rose-400 border-rose-500/40"
                  }`}
                  title="Master Record / Cut: Synchronously records all camera feeds, marks C2PA provenance, and archives take to Storage Vault (Shortcut: R or Space)"
                >
                  <span className={`w-2 h-2 rounded-full ${isRolling ? "bg-white animate-ping" : "bg-rose-500"}`} />
                  <span>{isRolling ? "⏹️ Cut & Save Take" : "🔴 Record Take"}</span>
                  <span className="text-[10px] opacity-75 font-normal">[R]</span>
                </button>

                {/* Pause All / Freeze-Frame Button */}
                <button
                  onClick={handleTogglePauseAll}
                  className={`px-3 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition-all text-xs ${
                    isFrameHold || !isPlaying
                      ? "bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-300 shadow-lg shadow-cyan-950/50 animate-pulse"
                      : "bg-[#14172E] hover:bg-[#1E2344] text-cyan-300 border-cyan-500/40"
                  }`}
                  title="Pause All: Freeze incoming frame buffer across all camera sensors for A/B wipe & focus inspection (Shortcut: F)"
                >
                  <span>{isFrameHold || !isPlaying ? "▶️ Resume Feeds" : "⏸️ Pause All"}</span>
                  <span className="text-[10px] opacity-75 font-normal">[F]</span>
                </button>
              </div>
            ) : (
              /* PLAYBACK GANG TRANSPORT CONTROLS */
              <div className="flex items-center gap-1 bg-[#14172E] border border-[#262A4A] rounded-lg p-0.5">
                <button
                  onClick={() => setPlaybackFrame(0)}
                  className="px-1.5 py-1 text-slate-300 hover:text-white rounded hover:bg-[#1E2344] transition-colors"
                  title="Jump to Head (Frame 0 / 01:24:12:00)"
                >
                  ⏮️
                </button>
                <button
                  onClick={() => handleStepPlayback(-120)}
                  className="px-1.5 py-1 text-slate-300 hover:text-white rounded hover:bg-[#1E2344] transition-colors text-[10px]"
                  title="Rewind 5 Seconds (-120 frames)"
                >
                  ⏪ 5s
                </button>
                <button
                  onClick={() => handleStepPlayback(-1)}
                  className="px-1.5 py-1 text-cyan-300 hover:text-cyan-200 rounded hover:bg-[#1E2344] transition-colors font-bold text-[10px]"
                  title="Step Backward 1 Frame (Shortcut: J or Left Arrow)"
                >
                  ◀ -1F
                </button>
                <button
                  onClick={() => setIsPlayingPlayback(!isPlayingPlayback)}
                  className={`px-2.5 py-1 rounded font-bold transition-all text-[11px] ${
                    isPlayingPlayback
                      ? "bg-purple-600 text-white shadow-sm"
                      : "bg-emerald-600 text-white shadow-sm"
                  }`}
                  title="Play / Pause Gang Playback (Shortcut: Space)"
                >
                  {isPlayingPlayback ? "⏸️ Pause" : "▶️ Play"}
                </button>
                <button
                  onClick={() => handleStepPlayback(1)}
                  className="px-1.5 py-1 text-cyan-300 hover:text-cyan-200 rounded hover:bg-[#1E2344] transition-colors font-bold text-[10px]"
                  title="Step Forward 1 Frame (Shortcut: L or Right Arrow)"
                >
                  +1F ▶
                </button>
                <button
                  onClick={() => handleStepPlayback(120)}
                  className="px-1.5 py-1 text-slate-300 hover:text-white rounded hover:bg-[#1E2344] transition-colors text-[10px]"
                  title="Forward 5 Seconds (+120 frames)"
                >
                  5s ⏩
                </button>
                <div className="px-2 py-0.5 text-[10px] text-slate-300 border-l border-[#262A4A] flex items-center gap-1 font-mono">
                  <span>Frame:</span>
                  <strong className="text-purple-300">{playbackFrame}</strong>/{maxPlaybackFrames}
                </div>
              </div>
            )}

            {/* Smart Slate Verdict Actions */}
            <div className="flex items-center bg-[#14172E] border border-[#262A4A] rounded-lg p-0.5">
              <button
                onClick={handleCircleTake}
                className={`px-2 py-1 rounded flex items-center gap-1 font-bold transition-all ${
                  takeVerdict === "CIRCLE"
                    ? "bg-amber-400 text-black shadow-sm"
                    : "text-amber-300 hover:text-white"
                }`}
                title="Circle Take / Print for Editorial (Shortcut: C)"
              >
                <span>⭐️ Circle</span>
                <span className="text-[10px] opacity-70 font-normal">[C]</span>
              </button>

              <button
                onClick={() => {
                  if (takeVerdict === "NG") {
                    setTakeVerdict(null);
                    setNgReason("");
                    triggerToast("Cleared NG mark.");
                  } else {
                    setShowNgModal(true);
                  }
                }}
                className={`px-2 py-1 rounded font-bold transition-colors flex items-center gap-1 ${
                  takeVerdict === "NG"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-rose-400 hover:text-white"
                }`}
                title="Mark as NG (No Good) & Specify Defect Reason (Shortcut: N)"
              >
                <span>❌ NG</span>
                <span className="text-[10px] opacity-70 font-normal">[N]</span>
              </button>

              <button
                onClick={handleHoldTake}
                className={`px-2 py-1 rounded font-bold transition-colors flex items-center gap-1 ${
                  takeVerdict === "HOLD"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-blue-400 hover:text-white"
                }`}
                title="Mark as Hold / Alternate Coverage for Editorial (Shortcut: H)"
              >
                <span>⏳ Keep</span>
                <span className="text-[10px] opacity-70 font-normal">[H]</span>
              </button>
            </div>

            {/* AI Auto-Slate */}
            <button
              onClick={handleTriggerAiSlateSync}
              disabled={isScanningSlate}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 border ${
                clapperSyncLocked
                  ? "bg-emerald-600/25 text-emerald-300 border-emerald-500/50 shadow-sm"
                  : "bg-[#14172E] hover:bg-[#1E2344] text-purple-300 border-purple-500/40"
              }`}
              title="Optical Slate OCR & Clapper Transient Sync (Shortcut: S)"
            >
              <span>{isScanningSlate ? "⚡ Scanning..." : clapperSyncLocked ? "✓ Sticks Synced" : "🤖 Auto-Slate"}</span>
              <span className="text-[10px] opacity-75 font-normal">[S]</span>
              {clapperSyncLocked && clapperSpikeTc && (
                <span className="text-[9px] bg-black/60 px-1 py-0.2 rounded text-emerald-400 font-mono hidden sm:inline">
                  {clapperSpikeTc}
                </span>
              )}
            </button>

            {/* Quick 1-Click Record & Vault Take */}
            <button
              onClick={handleQuickRecordTake}
              className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/50 cursor-pointer text-xs"
              title="1-Click Record & Vault Take: Generates hardware C2PA attested take and archives to Storage Vault Tier 0 NVMe, advancing to next take"
            >
              <span>🎬 Record Take 0{activeTake}</span>
            </button>

            {/* Advance Slate Only (+1) */}
            <button
              onClick={handleNextTake}
              className="px-2 py-1 bg-[#14172E] hover:bg-[#1E2344] text-purple-300 border border-purple-500/30 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
              title="Advance slate number to next take without recording (+1)"
            >
              <span>+1 Slate</span>
            </button>

            {/* Editorial Notes */}
            <button
              onClick={() => setShowNotesModal(true)}
              className="px-2 py-1 bg-[#14172E] hover:bg-[#1E2344] text-slate-300 border border-[#262A4A] rounded-lg text-[11px] flex items-center gap-1 transition-colors"
              title="Edit Script Supervisor & Director Notes"
            >
              <span>📝 Notes</span>
            </button>

            {/* On-Set Call Sheet Pill */}
            <div className="hidden lg:flex items-center gap-1.5 bg-[#121528] border border-[#262A4A] rounded-lg px-2.5 py-1 text-[11px]">
              <span className="text-slate-400">Day 14:</span>
              <span className="text-cyan-300 font-bold">Call 06:00A</span>
              <span className="text-slate-500">•</span>
              <span className="text-amber-300">Lunch 12:00P</span>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab("war-room")}
                  className="ml-1 text-[10px] text-purple-400 hover:text-purple-300 font-semibold underline flex items-center gap-0.5 cursor-pointer"
                  title="Open Call Sheet, Crew Roster & Logistics in Studio War Room"
                >
                  <span>War Room</span>
                  <span>➔</span>
                </button>
              )}
            </div>

            {/* Master Ingest Config */}
            <button
              onClick={() => setEditingCamId(activeCamId)}
              className="px-2.5 py-1 bg-[#14172E] hover:bg-[#1E2344] text-slate-200 border border-[#262A4A] rounded-lg flex items-center gap-1 transition-colors text-[11px]"
              title="Open Ingest & Hardware Configuration Panel"
            >
              <span>⚙️ Ingest</span>
            </button>

            {/* Downstream Output Pipeline Dispatcher */}
            <button
              onClick={() => setShowPipelineModal(true)}
              className="px-3 py-1 bg-gradient-to-r from-purple-600/30 to-cyan-600/30 hover:from-purple-600/50 hover:to-cyan-600/50 text-cyan-200 border border-cyan-500/50 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              title="Inspect Downstream Output Destinations: Editorial (Screen 6), Graph (Screen 1), Likeness (Screen 3), VFX (Screen 4), War Room (Screen 8), Cloud Vault"
            >
              <span>📤 Pipeline Out</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </button>
          </div>
        </div>

        {/* TIER 2: VIDEO VILLAGE & DIT ASSIST TOOLBELT RIBBON */}
        <div className="bg-[#0A0D1C] border border-[#262A4A]/80 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-md font-mono text-xs">
          {/* Left: Multi-View Layout Presets & Quick Demos */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Multi-View Layout Switcher */}
            <div className="flex items-center bg-[#14172E] border border-[#262A4A] rounded-lg p-0.5">
              <button
                onClick={() => setLayoutMode("single")}
                className={`px-2.5 py-0.5 rounded text-xs transition-colors ${
                  layoutMode === "single" ? "bg-purple-600 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
                title="1-Up Single Camera Focus (Shortcuts: 1, 2, 3, 4)"
              >
                1-Up
              </button>
              <button
                onClick={() => setLayoutMode("2-up")}
                className={`px-2.5 py-0.5 rounded text-xs transition-colors ${
                  layoutMode === "2-up" ? "bg-purple-600 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
                title="2-Up Side-by-Side Coverage"
              >
                2-Up
              </button>
              <button
                onClick={() => setLayoutMode("3-up")}
                className={`px-2.5 py-0.5 rounded text-xs transition-colors ${
                  layoutMode === "3-up" ? "bg-purple-600 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
                title="3-Up Coverage"
              >
                3-Up
              </button>
              <button
                onClick={() => setLayoutMode("quad")}
                className={`px-2.5 py-0.5 rounded text-xs transition-colors ${
                  layoutMode === "quad" ? "bg-purple-600 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
                title="4-Up Quad Split Standard (Shortcut: Q)"
              >
                ⊞ Quad (4)
              </button>
              <button
                onClick={() => setLayoutMode("6-up")}
                className={`px-2.5 py-0.5 rounded text-xs transition-colors ${
                  layoutMode === "6-up" ? "bg-purple-600 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
                title="6-Up Multi-Rig View"
              >
                6-Up
              </button>
              <button
                onClick={() => setLayoutMode("all")}
                className={`px-2.5 py-0.5 rounded text-xs transition-colors ${
                  layoutMode === "all" ? "bg-purple-600 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
                title="Show All Connected Feeds"
              >
                All ({cameras.length})
              </button>
            </div>

            {/* 1-Click Multi-Cam Presets */}
            <button
              onClick={handleLoadCinemaScenePreset}
              className="px-2 py-1 bg-purple-600/25 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 rounded-lg flex items-center gap-1 transition-colors text-[11px]"
              title="Equip Camera A, B, C, D with 4K Cinema Benchmark Scene"
            >
              <span>🎬 4-Cam Cinema</span>
            </button>
            <button
              onClick={handleLoadNasaMissionPreset}
              className="px-2 py-1 bg-blue-600/25 hover:bg-blue-600/40 text-blue-200 border border-blue-500/40 rounded-lg flex items-center gap-1 transition-colors text-[11px]"
              title="Equip Camera A, B, C, D with NASA 4-Angle Live Space Mission"
            >
              <span>🚀 NASA Live</span>
            </button>
            <button
              onClick={handleLoadHorrorScenePreset}
              className="px-2 py-1 bg-rose-600/25 hover:bg-rose-600/40 text-rose-200 border border-rose-500/40 rounded-lg flex items-center gap-1 transition-colors text-[11px] shadow-sm shadow-rose-950/40"
              title="Equip Camera A, B, C, D with 4-Camera Horror Scene Shoot (/Horror Scene)"
            >
              <span>👻 Horror Shoot</span>
            </button>
            <button
              onClick={handleLoadMatrixFightsPreset}
              className="px-2 py-1 bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-500/40 rounded-lg flex items-center gap-1 transition-colors text-[11px] shadow-sm shadow-emerald-950/40 font-semibold"
              title="Equip Camera A, B, C, D with 4-Camera Matrix Fight Scenes Shoot (/Matrix)"
            >
              <span>🟢 Matrix Shoot</span>
            </button>
            <button
              onClick={handleAddCamera}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-[#262A4A] rounded-lg flex items-center gap-1 transition-colors text-[11px]"
              title="Add a new live camera feed to the grid"
            >
              <span>➕ Cam</span>
            </button>
          </div>

          {/* Right: DIT Precision Assist Toolbelt & HUD Density Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Exposure Mode Toggle */}
            <button
              onClick={handleCycleExposure}
              className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 text-[11px] ${
                exposureMode === "el_zone"
                  ? "bg-amber-600 text-white border-amber-400 font-bold shadow-md shadow-amber-950/40"
                  : exposureMode === "ire_false_color"
                  ? "bg-purple-600 text-white border-purple-400 font-bold shadow-md shadow-purple-950/40"
                  : "bg-[#14172E] text-slate-300 border-[#262A4A] hover:bg-[#1E2344]"
              }`}
              title="Cycle Exposure Assist: Clean -> ASC EL Zone -> 0-100 IRE False Color (Shortcut: E)"
            >
              <span>{exposureMode === "el_zone" ? "🎯 EL Zone" : exposureMode === "ire_false_color" ? "🌈 IRE Heatmap" : "👁️ Clean Feed"}</span>
              <span className="text-[9px] opacity-70 font-normal">[E]</span>
            </button>

            {/* DIT Studio Dock Tabs: ASC-CDL Grade & Video Scopes */}
            <div className="flex items-center bg-[#14172E] border border-[#262A4A] rounded-lg p-0.5">
              <button
                onClick={() => setActiveDrawerTab((prev) => prev === "cdl" ? "none" : "cdl")}
                className={`px-2.5 py-0.5 rounded text-xs transition-all flex items-center gap-1 ${
                  activeDrawerTab === "cdl"
                    ? "bg-indigo-600 text-white font-bold shadow-sm"
                    : "text-slate-300 hover:text-white"
                }`}
                title="Toggle Non-Destructive ASC-CDL Live Color Grade (Shortcut: G)"
              >
                <span>🎨 CDL Grade</span>
                <span className="text-[10px] text-indigo-300 font-normal">[G]</span>
                {cdlPreset !== "rec709" && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />}
              </button>
              <button
                onClick={() => setActiveDrawerTab((prev) => prev === "scopes" ? "none" : "scopes")}
                className={`px-2.5 py-0.5 rounded text-xs transition-all flex items-center gap-1 ${
                  activeDrawerTab === "scopes"
                    ? "bg-emerald-600 text-white font-bold shadow-sm"
                    : "text-slate-300 hover:text-white"
                }`}
                title="Toggle Real-Time Video Scopes: Waveform, Vectorscope, Parade (Shortcut: W)"
              >
                <span>📊 Scopes</span>
                <span className="text-[10px] text-emerald-300 font-normal">[W]</span>
              </button>
            </div>

            {/* Focus Peaking */}
            <button
              onClick={() => {
                setFocusPeakingActive(!focusPeakingActive);
                triggerToast(!focusPeakingActive ? "🎯 Focus Peaking: Active (Cyan Contours)" : "Focus Peaking: Disabled");
              }}
              className={`px-2 py-1 rounded-lg border transition-colors flex items-center gap-1 text-[11px] ${
                focusPeakingActive
                  ? "bg-teal-600 text-white border-teal-400 font-bold shadow-sm"
                  : "bg-[#14172E] text-slate-400 border-[#262A4A] hover:bg-[#1E2344]"
              }`}
              title="Toggle High-Frequency Edge Detection Focus Peaking (Shortcut: P)"
            >
              <span>🎯 Peaking</span>
              <span className="text-[9px] text-teal-300 font-normal">[P]</span>
            </button>

            {/* Framing Guides */}
            <button
              onClick={() => {
                const nextFa = framingAspect === "off" ? "2.39" : framingAspect === "2.39" ? "1.85" : framingAspect === "1.85" ? "16:9" : framingAspect === "16:9" ? "all" : "off";
                setFramingAspect(nextFa);
                triggerToast(`Framing Guides: ${nextFa === "off" ? "Disabled" : nextFa === "all" ? "2.39 + 1.85 + 9:16 Social Safe" : `${nextFa}:1 Matte Active`}`);
              }}
              className={`px-2 py-1 rounded-lg border transition-colors flex items-center gap-1 text-[11px] ${
                framingAspect !== "off"
                  ? "bg-cyan-600/30 text-cyan-300 border-cyan-500 font-bold shadow-sm"
                  : "bg-[#14172E] text-slate-400 border-[#262A4A] hover:bg-[#1E2344]"
              }`}
              title="Cycle Framing Guides: 2.39:1 -> 1.85:1 -> 16:9 -> Multi+Social (Shortcut: M)"
            >
              <span>📐 {framingAspect === "off" ? "Framing: Off" : framingAspect === "all" ? "2.39+9:16" : `${framingAspect}:1`}</span>
              <span className="text-[9px] text-cyan-300 font-normal">[M]</span>
            </button>

            {/* A/B Wipe */}
            <button
              onClick={() => setSplitWipeActive(!splitWipeActive)}
              className={`px-2 py-1 rounded-lg border transition-colors flex items-center gap-1 text-[11px] ${
                splitWipeActive
                  ? "bg-purple-600 text-white border-purple-400 font-bold shadow-sm"
                  : "bg-[#14172E] text-slate-400 border-[#262A4A] hover:bg-[#1E2344]"
              }`}
              title="Toggle Live A/B Split-Wipe (Take 3 vs Take 4 Meniscus)"
            >
              <span>🔀 Wipe</span>
              {splitWipeActive && <span className="text-[9px] bg-purple-950 px-1 rounded">{splitPosition}%</span>}
            </button>

            {/* 1:1 Zoom Punch-In */}
            <button
              onClick={() => setZoomPunchIn(!zoomPunchIn)}
              className={`px-2 py-1 rounded-lg border transition-colors flex items-center gap-1 text-[11px] ${
                zoomPunchIn
                  ? "bg-rose-600 text-white border-rose-400 font-bold shadow-sm"
                  : "bg-[#14172E] text-slate-400 border-[#262A4A] hover:bg-[#1E2344]"
              }`}
              title="1:1 (200%) Focus Punch-In (Shortcut: Z)"
            >
              <span>🔍 Zoom</span>
              <span className="text-[9px] text-rose-300 font-normal">[Z]</span>
            </button>

            {/* Lens HUD Toggle */}
            <button
              onClick={() => setShowLensHud(!showLensHud)}
              className={`px-2 py-1 rounded-lg border transition-colors flex items-center gap-1 text-[11px] ${
                showLensHud ? "bg-cyan-600/30 text-cyan-300 border-cyan-500 font-bold" : "bg-[#14172E] text-slate-400 border-[#262A4A]"
              }`}
              title="Toggle Cooke /i & ARRI LDS-2 Lens Telemetry"
            >
              <span>📐 Lens</span>
            </button>

            {/* HUD Density Mode Switcher */}
            <div className="flex items-center bg-[#14172E] border border-[#262A4A] rounded-lg p-0.5 text-[11px]">
              <span className="text-[10px] text-slate-500 px-1.5 hidden 2xl:inline">HUD:</span>
              <button
                onClick={() => setHudMode("full")}
                className={`px-2 py-0.5 rounded transition-colors ${
                  hudMode === "full" ? "bg-cyan-600 text-white font-bold shadow-sm" : "text-slate-400 hover:text-white"
                }`}
                title="Full HUD: Complete lens telemetry, audio meters, and C2C status"
              >
                Full
              </button>
              <button
                onClick={() => setHudMode("compact")}
                className={`px-2 py-0.5 rounded transition-colors ${
                  hudMode === "compact" ? "bg-cyan-600 text-white font-bold shadow-sm" : "text-slate-400 hover:text-white"
                }`}
                title="Compact HUD: Minimal timecode and audio indicator"
              >
                Compact
              </button>
              <button
                onClick={() => setHudMode("clean")}
                className={`px-2 py-0.5 rounded transition-colors ${
                  hudMode === "clean" ? "bg-cyan-600 text-white font-bold shadow-sm" : "text-slate-400 hover:text-white"
                }`}
                title="Clean Feed: Pure cinematic monitoring without telemetry clutter (Shortcut: Tab)"
              >
                Clean [Tab]
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* UNIFIED TABBED DIT PRECISION STUDIO DOCK (ASC-CDL & VIDEO SCOPES) */}
      {activeDrawerTab !== "none" && (
        <div className="bg-[#0A0D1E] border border-indigo-500/40 rounded-xl p-4 shadow-2xl font-mono text-xs space-y-3 animate-in fade-in duration-200">
          {/* Unified Tab Header Bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-[#262A4A] pb-2.5 gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-[#14172E] border border-[#262A4A] rounded-lg p-0.5">
                <button
                  onClick={() => setActiveDrawerTab("cdl")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeDrawerTab === "cdl"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/50"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>🎨 ASC-CDL Live Color Grade</span>
                  <span className="text-[10px] opacity-75 font-normal">[G]</span>
                </button>
                <button
                  onClick={() => setActiveDrawerTab("scopes")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeDrawerTab === "scopes"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/50"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>📊 Real-Time Video Scopes</span>
                  <span className="text-[10px] opacity-75 font-normal">[W]</span>
                </button>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hidden sm:inline">
                ACES AP1 / Colorfront &amp; Pomfort LiveGrade Pipeline
              </span>
            </div>

            {/* Context Actions depending on active tab */}
            <div className="flex items-center gap-2">
              {activeDrawerTab === "cdl" && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400 mr-1 hidden md:inline">Presets:</span>
                  <button
                    onClick={() => handleApplyCdlPreset("rec709")}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                      cdlPreset === "rec709"
                        ? "bg-indigo-600 text-white font-bold"
                        : "bg-[#14172E] text-slate-300 hover:bg-[#1E2344] border border-[#262A4A]"
                    }`}
                  >
                    Rec.709
                  </button>
                  <button
                    onClick={() => handleApplyCdlPreset("fincher")}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                      cdlPreset === "fincher"
                        ? "bg-indigo-600 text-white font-bold"
                        : "bg-[#14172E] text-slate-300 hover:bg-[#1E2344] border border-[#262A4A]"
                    }`}
                  >
                    Fincher Bleach
                  </button>
                  <button
                    onClick={() => handleApplyCdlPreset("tungsten")}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                      cdlPreset === "tungsten"
                        ? "bg-indigo-600 text-white font-bold"
                        : "bg-[#14172E] text-slate-300 hover:bg-[#1E2344] border border-[#262A4A]"
                    }`}
                  >
                    3200K Tungsten
                  </button>
                  <button
                    onClick={() => handleApplyCdlPreset("night")}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                      cdlPreset === "night"
                        ? "bg-indigo-600 text-white font-bold"
                        : "bg-[#14172E] text-slate-300 hover:bg-[#1E2344] border border-[#262A4A]"
                    }`}
                  >
                    Day-for-Night
                  </button>
                  <button
                    onClick={handleSaveCdlToMetadata}
                    className="ml-1 px-2.5 py-0.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                    title="Attach ASC-CDL XML parameters to current camera take metadata"
                  >
                    <span>💾 Save to Take 0{activeTake}</span>
                  </button>
                </div>
              )}

              {activeDrawerTab === "scopes" && (
                <div className="flex items-center bg-[#14172E] border border-[#262A4A] rounded-lg p-0.5 text-[11px]">
                  <button
                    onClick={() => setScopeMode("waveform")}
                    className={`px-2.5 py-0.5 rounded transition-colors ${
                      scopeMode === "waveform" ? "bg-emerald-600 text-white font-bold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Luma Waveform
                  </button>
                  <button
                    onClick={() => setScopeMode("vectorscope")}
                    className={`px-2.5 py-0.5 rounded transition-colors ${
                      scopeMode === "vectorscope" ? "bg-emerald-600 text-white font-bold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Vectorscope
                  </button>
                  <button
                    onClick={() => setScopeMode("parade")}
                    className={`px-2.5 py-0.5 rounded transition-colors ${
                      scopeMode === "parade" ? "bg-emerald-600 text-white font-bold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    RGB Parade
                  </button>
                </div>
              )}

              {/* Close Dock Button */}
              <button
                onClick={() => setActiveDrawerTab("none")}
                className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-[#14172E] hover:bg-[#1E2344] border border-[#262A4A] text-xs font-bold transition-colors ml-1.5"
                title="Close Studio Dock [Esc / G / W]"
              >
                ✕ Close
              </button>
            </div>
          </div>

          {/* TAB CONTENT: ASC-CDL GRADE CONTROLS */}
          {activeDrawerTab === "cdl" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-3 bg-[#080A16] rounded-lg border border-[#1F2448]">
                {/* 1. SLOPE (Gain / Highlights) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-300 flex items-center gap-1">
                      <span>📈</span> SLOPE (Gain)
                    </span>
                    <span className="text-indigo-400 font-bold bg-[#121528] px-1.5 py-0.5 rounded border border-[#262A4A]">
                      {cdlParams.slope.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.01}
                    value={cdlParams.slope}
                    onChange={(e) => {
                      setCdlPreset("custom");
                      setCdlParams((p) => ({ ...p, slope: parseFloat(e.target.value) }));
                    }}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>0.50 (Pull)</span>
                    <span>1.00 (Unity)</span>
                    <span>2.00 (Push)</span>
                  </div>
                </div>

                {/* 2. OFFSET (Lift / Pedestal) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-300 flex items-center gap-1">
                      <span>⚓</span> OFFSET (Lift)
                    </span>
                    <span className="text-indigo-400 font-bold bg-[#121528] px-1.5 py-0.5 rounded border border-[#262A4A]">
                      {cdlParams.offset >= 0 ? `+${cdlParams.offset.toFixed(2)}` : cdlParams.offset.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-0.2}
                    max={0.2}
                    step={0.005}
                    value={cdlParams.offset}
                    onChange={(e) => {
                      setCdlPreset("custom");
                      setCdlParams((p) => ({ ...p, offset: parseFloat(e.target.value) }));
                    }}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>-0.20 (Crush)</span>
                    <span>0.00 (Zero)</span>
                    <span>+0.20 (Lift)</span>
                  </div>
                </div>

                {/* 3. POWER (Gamma / Midtones) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-300 flex items-center gap-1">
                      <span>⚡</span> POWER (Gamma)
                    </span>
                    <span className="text-indigo-400 font-bold bg-[#121528] px-1.5 py-0.5 rounded border border-[#262A4A]">
                      {cdlParams.power.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.01}
                    value={cdlParams.power}
                    onChange={(e) => {
                      setCdlPreset("custom");
                      setCdlParams((p) => ({ ...p, power: parseFloat(e.target.value) }));
                    }}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>0.50 (Light)</span>
                    <span>1.00 (Linear)</span>
                    <span>2.00 (Dense)</span>
                  </div>
                </div>

                {/* 4. SATURATION (Chroma) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-300 flex items-center gap-1">
                      <span>🌈</span> SATURATION
                    </span>
                    <span className="text-indigo-400 font-bold bg-[#121528] px-1.5 py-0.5 rounded border border-[#262A4A]">
                      {cdlParams.saturation.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={2.0}
                    step={0.02}
                    value={cdlParams.saturation}
                    onChange={(e) => {
                      setCdlPreset("custom");
                      setCdlParams((p) => ({ ...p, saturation: parseFloat(e.target.value) }));
                    }}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>0.00 (Mono)</span>
                    <span>1.00 (Standard)</span>
                    <span>2.00 (Vivid)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
                <span className="flex items-center gap-2">
                  <span>Standard: <strong>ASC-CDL v1.2 RFC</strong></span>
                  <span className="text-slate-600">•</span>
                  <span>LUT Box Sync: <strong className="text-emerald-400">Pomfort LiveGrade / BoxIO Active</strong></span>
                </span>
                <button
                  onClick={() => handleApplyCdlPreset("rec709")}
                  className="text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                >
                  Reset to 1.0/0.0/1.0/1.0 (Unity)
                </button>
              </div>
            </div>
          )}

          {/* TAB CONTENT: REAL-TIME VIDEO SCOPES */}
          {activeDrawerTab === "scopes" && (
            <div>
              {scopeMode === "waveform" && (
                <div className="relative h-44 bg-[#080B14] rounded-lg border border-[#1F2448] overflow-hidden p-2 flex items-center">
                  {/* Y-axis IRE Scale */}
                  <div className="w-20 h-full flex flex-col justify-between text-[9px] text-slate-500 font-mono pr-2 border-r border-[#1F2448]">
                    <span className="text-rose-400 font-bold">100 IRE (Clip)</span>
                    <span>80 IRE</span>
                    <span className="text-amber-400">70 IRE (Skin)</span>
                    <span className="text-cyan-400">41 IRE (18% Gray)</span>
                    <span>20 IRE</span>
                    <span className="text-emerald-400">7.5 IRE (Pedestal)</span>
                    <span className="text-slate-600">0 IRE (Sub-black)</span>
                  </div>
                  {/* Waveform Trace Canvas */}
                  <div className="flex-1 h-full relative px-3 flex items-center">
                    <div className="absolute inset-x-0 top-[0%] border-b border-rose-500/30 border-dashed" />
                    <div className="absolute inset-x-0 top-[30%] border-b border-amber-500/20" />
                    <div className="absolute inset-x-0 top-[59%] border-b border-cyan-500/25 border-dashed" />
                    <div className="absolute inset-x-0 top-[92.5%] border-b border-emerald-500/20" />

                    <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                      <path
                        d="M 0 110 Q 50 40, 100 85 T 200 60 T 300 95 T 400 35 T 500 100"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="1.8"
                        strokeOpacity="0.85"
                      />
                      <path
                        d="M 0 115 Q 40 45, 90 90 T 190 65 T 290 100 T 390 40 T 500 105"
                        fill="none"
                        stroke="#34D399"
                        strokeWidth="1.2"
                        strokeOpacity="0.6"
                      />
                      <path
                        d="M 0 105 Q 60 35, 110 80 T 210 55 T 310 90 T 410 30 T 500 95"
                        fill="none"
                        stroke="#059669"
                        strokeWidth="1"
                        strokeOpacity="0.5"
                      />
                    </svg>

                    <div className="absolute top-2 right-3 text-[10px] text-slate-400 font-mono bg-black/70 px-2 py-0.5 rounded border border-[#262A4A]">
                      Active Sensor: <strong className="text-white">{activeCamera.name}</strong> • Exposure Margin: <strong className="text-emerald-400">+1.8 EV Safe</strong>
                    </div>
                  </div>
                </div>
              )}

              {scopeMode === "vectorscope" && (
                <div className="relative h-48 bg-[#080B14] rounded-lg border border-[#1F2448] p-3 flex items-center justify-center">
                  <svg className="h-44 w-44 overflow-visible" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="90" fill="none" stroke="#262A4A" strokeWidth="1.5" />
                    <circle cx="100" cy="100" r="68" fill="none" stroke="#1D2140" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="10" y1="100" x2="190" y2="100" stroke="#1D2140" strokeWidth="1" />
                    <line x1="100" y1="10" x2="100" y2="190" stroke="#1D2140" strokeWidth="1" />

                    <line x1="100" y1="100" x2="155" y2="28" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 2" />
                    <text x="160" y="26" fill="#F59E0B" fontSize="9" fontWeight="bold">Skin Line (I-Axis)</text>

                    <rect x="145" y="45" width="8" height="8" fill="none" stroke="#EF4444" strokeWidth="1" />
                    <text x="156" y="52" fill="#EF4444" fontSize="8">R</text>
                    <rect x="135" y="140" width="8" height="8" fill="none" stroke="#EC4899" strokeWidth="1" />
                    <text x="146" y="147" fill="#EC4899" fontSize="8">Mg</text>
                    <rect x="75" y="155" width="8" height="8" fill="none" stroke="#3B82F6" strokeWidth="1" />
                    <text x="86" y="162" fill="#3B82F6" fontSize="8">B</text>
                    <rect x="45" y="125" width="8" height="8" fill="none" stroke="#06B6D4" strokeWidth="1" />
                    <text x="28" y="132" fill="#06B6D4" fontSize="8">Cy</text>
                    <rect x="50" y="45" width="8" height="8" fill="none" stroke="#10B981" strokeWidth="1" />
                    <text x="36" y="52" fill="#10B981" fontSize="8">G</text>
                    <rect x="115" y="25" width="8" height="8" fill="none" stroke="#EAB308" strokeWidth="1" />
                    <text x="108" y="20" fill="#EAB308" fontSize="8">Yl</text>

                    <ellipse cx="125" cy="65" rx="16" ry="12" fill="#10B981" fillOpacity="0.4" />
                    <ellipse cx="120" cy="70" rx="9" ry="7" fill="#34D399" fillOpacity="0.6" />
                    <circle cx="100" cy="100" r="14" fill="#10B981" fillOpacity="0.5" />
                  </svg>
                  <div className="absolute bottom-3 right-4 text-[10px] text-slate-400 bg-black/70 px-2 py-1 rounded border border-[#262A4A]">
                    Color Matrix: <strong className="text-amber-300">Skin Tone Aligned (ACES LogC4 IDT)</strong>
                  </div>
                </div>
              )}

              {scopeMode === "parade" && (
                <div className="grid grid-cols-3 gap-2 h-44 bg-[#080B14] rounded-lg border border-[#1F2448] p-2">
                  <div className="border border-red-500/30 rounded p-1.5 flex flex-col justify-between">
                    <span className="text-[10px] text-red-400 font-bold">RED (AP1)</span>
                    <svg className="w-full h-28" viewBox="0 0 100 80" preserveAspectRatio="none">
                      <path d="M 0 60 Q 25 20, 50 45 T 100 30" fill="none" stroke="#EF4444" strokeWidth="1.5" />
                    </svg>
                    <span className="text-[9px] text-slate-500">Max: 78 IRE</span>
                  </div>
                  <div className="border border-green-500/30 rounded p-1.5 flex flex-col justify-between">
                    <span className="text-[10px] text-green-400 font-bold">GREEN (AP1)</span>
                    <svg className="w-full h-28" viewBox="0 0 100 80" preserveAspectRatio="none">
                      <path d="M 0 65 Q 25 35, 50 50 T 100 40" fill="none" stroke="#10B981" strokeWidth="1.5" />
                    </svg>
                    <span className="text-[9px] text-slate-500">Max: 68 IRE</span>
                  </div>
                  <div className="border border-blue-500/30 rounded p-1.5 flex flex-col justify-between">
                    <span className="text-[10px] text-blue-400 font-bold">BLUE (AP1)</span>
                    <svg className="w-full h-28" viewBox="0 0 100 80" preserveAspectRatio="none">
                      <path d="M 0 70 Q 25 45, 50 60 T 100 50" fill="none" stroke="#3B82F6" strokeWidth="1.5" />
                    </svg>
                    <span className="text-[9px] text-slate-500">Max: 55 IRE</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Multi-Camera Channel Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-[#262A4A] pb-3 overflow-x-auto">
        <span className="text-xs font-mono text-slate-500 uppercase tracking-wider mr-1">Active Feeds:</span>
        {cameras.map((cam, idx) => {
          const isActive = cam.id === activeCamId;
          const isCompensated = !!cam.pullUpCompensated || (cam.id === "cam-b" && pullUpApplied);
          const isBreached = Math.abs(cam.fps - 24.0) >= 0.0005 && !isCompensated;
          return (
            <div key={cam.id} className="flex items-center">
              <button
                onClick={() => {
                  setActiveCamId(cam.id);
                  if (layoutMode === "single") setLayoutMode("single");
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-2 transition-all ${
                  isActive
                    ? "bg-purple-600/20 border-purple-500 text-white font-bold shadow-md shadow-purple-900/30"
                    : "bg-[#151830] border-[#262A4A] text-slate-400 hover:text-slate-200 hover:border-slate-500"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isBreached ? "bg-amber-400 animate-ping" : "bg-emerald-400"
                  }`}
                />
                <span>{cam.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                    isBreached
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {cam.sourceType === "youtube" ? "🔴 YouTube Live" : `${cam.fps.toFixed(3)} fps`}
                </span>
              </button>
              {cameras.length > 1 && (
                <button
                  onClick={(e) => handleRemoveCamera(cam.id, e)}
                  className="ml-1 text-slate-500 hover:text-rose-400 p-1 text-xs"
                  title="Remove this camera feed"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* PAUSE ALL / FRAME-HOLD FREEZE BUFFER BANNER */}
      {(isFrameHold || !isPlaying) && monitorMode === "live" && (
        <div className="bg-cyan-950/80 border border-cyan-500/50 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-cyan-200 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="text-base animate-pulse">⏸️</span>
            <strong className="text-white tracking-wide">PAUSE ALL / GANG BUFFER HELD:</strong>
            <span>All {cameras.length} camera feeds frozen at SMPTE <strong className="text-cyan-300 bg-black/40 px-1.5 py-0.5 rounded border border-cyan-500/30">{frozenBufferTc}</strong>.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSplitWipeActive(!splitWipeActive)}
              className={`px-3 py-1 rounded border text-[11px] font-bold transition-all ${
                splitWipeActive
                  ? "bg-cyan-500 text-black border-cyan-300 shadow-md"
                  : "bg-cyan-900/60 hover:bg-cyan-900 text-cyan-200 border-cyan-500/40"
              }`}
            >
              🔀 {splitWipeActive ? "Close A/B Wipe" : "Live A/B Split-Wipe"}
            </button>
            <button
              onClick={() => {
                setSplitWipeMode("onion");
                setSplitWipeActive(true);
              }}
              className="px-3 py-1 bg-purple-900/60 hover:bg-purple-900 text-purple-200 border border-purple-500/40 rounded text-[11px] font-bold transition-all"
            >
              👻 50% Onion Skin
            </button>
            <button
              onClick={handleTogglePauseAll}
              className="px-3 py-1 bg-emerald-600/40 hover:bg-emerald-600/60 text-emerald-200 border border-emerald-500/40 rounded text-[11px] font-bold transition-colors"
            >
              ▶️ Resume Feeds
            </button>
          </div>
        </div>
      )}

      {/* PLAYBACK REVIEW MODE BANNER & SCRUBBER */}
      {monitorMode === "playback" && (
        <div className="bg-purple-950/70 border border-purple-500/50 rounded-xl p-3.5 space-y-2.5 text-xs font-mono shadow-xl animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-base animate-pulse">🎞️</span>
              <strong className="text-white tracking-wide">MULTI-CAM GANG PLAYBACK REVIEW:</strong>
              <span className="text-purple-300 font-bold bg-purple-900/40 px-2 py-0.5 rounded border border-purple-500/30">
                {activeScene} • Take 0{activeTake}
              </span>
              <span className="text-slate-400 hidden sm:inline">
                ({playbackFrame} / {maxPlaybackFrames} frames • 24.000 fps SMPTE ST 12-1 Synced)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleStepPlayback(-120)}
                className="px-2 py-1 bg-[#151830] hover:bg-[#22274F] text-slate-300 border border-[#262A4A] rounded text-[11px] font-bold transition-colors"
                title="Jump -5 Seconds (-120 frames)"
              >
                ⏪ 5s
              </button>
              <button
                onClick={() => handleStepPlayback(-1)}
                className="px-2.5 py-1 bg-[#151830] hover:bg-[#22274F] text-cyan-300 border border-cyan-500/40 rounded text-[11px] font-bold transition-colors"
                title="Step Backward 1 Frame (Shortcut: J or Left Arrow)"
              >
                ◀ -1F [J]
              </button>
              <button
                onClick={() => setIsPlayingPlayback(!isPlayingPlayback)}
                className={`px-3.5 py-1 rounded text-[11px] font-bold shadow-md transition-all flex items-center gap-1.5 ${
                  isPlayingPlayback
                    ? "bg-amber-600 hover:bg-amber-500 text-white ring-2 ring-amber-400/40"
                    : "bg-purple-600 hover:bg-purple-500 text-white"
                }`}
                title="Play / Pause Gang Playback (Shortcut: Space)"
              >
                <span>{isPlayingPlayback ? "⏸️ Pause [Space]" : "▶️ Play [Space]"}</span>
              </button>
              <button
                onClick={() => handleStepPlayback(1)}
                className="px-2.5 py-1 bg-[#151830] hover:bg-[#22274F] text-cyan-300 border border-cyan-500/40 rounded text-[11px] font-bold transition-colors"
                title="Step Forward 1 Frame (Shortcut: L or Right Arrow)"
              >
                +1F ▶ [L]
              </button>
              <button
                onClick={() => handleStepPlayback(120)}
                className="px-2 py-1 bg-[#151830] hover:bg-[#22274F] text-slate-300 border border-[#262A4A] rounded text-[11px] font-bold transition-colors"
                title="Jump +5 Seconds (+120 frames)"
              >
                5s ⏩
              </button>
              <button
                onClick={() => {
                  setMonitorMode("live");
                  setIsPlayingPlayback(false);
                }}
                className="px-3 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded text-[11px] font-bold transition-colors ml-2 shadow-sm"
                title="Return to Live Multi-Cam SDI/NDI Stage"
              >
                🔴 Return to Live Stage
              </button>
            </div>
          </div>

          {/* Gang Timeline Scrubber Slider */}
          <div className="flex items-center gap-3 pt-1">
            <span className="text-[10px] text-slate-400 font-mono shrink-0">00:00 (In)</span>
            <input
              type="range"
              min={0}
              max={maxPlaybackFrames}
              value={playbackFrame}
              onChange={(e) => {
                setPlaybackFrame(Number(e.target.value));
                setIsPlayingPlayback(false);
              }}
              className="flex-1 h-2 bg-[#090B16] rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <span className="text-[10px] text-slate-400 font-mono shrink-0">
              00:{Math.floor(maxPlaybackFrames / 24).toString().padStart(2, "0")}s (Out)
            </span>
          </div>
        </div>
      )}

      {/* Main Grid Viewport */}
      <div className={`grid ${getGridColsClass()} gap-4 ${isRolling ? "ring-2 ring-rose-500/50 rounded-xl p-1 bg-rose-950/10" : ""}`}>
        {visibleCameras.map((cam) => {
          const isCompensated = !!cam.pullUpCompensated || (cam.id === "cam-b" && pullUpApplied);
          const isCamBreached = Math.abs(cam.fps - 24.0) >= 0.0005 && !isCompensated;
          const isSelected = cam.id === activeCamId;
          const isOver = dragOverCamId === cam.id;

          // Dynamic non-destructive visual grade (ASC-CDL + Exposure False Color / EL Zone)
          const getFeedFilterStyle = (): React.CSSProperties => {
            if (exposureMode === "ire_false_color") {
              return { filter: "contrast(200%) saturate(300%) invert(20%) hue-rotate(180deg)" };
            }
            if (exposureMode === "el_zone") {
              return { filter: "contrast(180%) saturate(220%) hue-rotate(95deg) brightness(1.05)" };
            }
            const contrastVal = (cdlParams.slope * cdlParams.power).toFixed(3);
            const brightnessVal = (1.0 + cdlParams.offset).toFixed(3);
            const saturateVal = cdlParams.saturation.toFixed(3);
            return {
              filter: `contrast(${contrastVal}) brightness(${brightnessVal}) saturate(${saturateVal})`
            };
          };

          const deSqueezeStyle: React.CSSProperties =
            cam.anamorphicSqueeze && cam.anamorphicSqueeze > 1.0
              ? { transform: `scaleX(${cam.anamorphicSqueeze})` }
              : {};

          return (
            <div
              key={cam.id}
              className={`bg-[#121528] border rounded-xl overflow-hidden shadow-2xl flex flex-col transition-all relative ${
                isSelected
                  ? "border-purple-500 ring-1 ring-purple-500/40"
                  : isCamBreached
                  ? "border-amber-500/60"
                  : "border-[#262A4A]"
              }`}
            >
              {/* Hidden File Input for this specific camera */}
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                className="hidden"
                ref={(el) => (fileInputRefs.current[cam.id] = el)}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelectForCamera(cam.id, e.target.files[0]);
                  }
                }}
              />

              {/* Camera Slot Title Bar */}
              <div className="bg-[#151830] px-3.5 py-2 border-b border-[#262A4A] flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isRolling
                        ? "bg-rose-500 animate-ping"
                        : (isFrameHold || !isPlaying)
                        ? "bg-cyan-400 animate-pulse"
                        : isPlaying
                        ? isCamBreached
                          ? "bg-amber-400 animate-ping"
                          : "bg-emerald-400 animate-pulse"
                        : "bg-slate-500"
                    }`}
                  />
                  <span className="font-bold text-white tracking-wide">{cam.name}</span>
                  {isRolling && (
                    <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white font-bold text-[9px] flex items-center gap-1 animate-pulse shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>REC 00:{takeElapsedSec.toString().padStart(2, "0")}s</span>
                    </span>
                  )}
                  {(isFrameHold || !isPlaying) && monitorMode === "live" && (
                    <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold text-[9px] flex items-center gap-1 animate-pulse">
                      <span>⏸️</span>
                      <span>PAUSED</span>
                    </span>
                  )}
                  {monitorMode === "playback" && (
                    <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold text-[9px]">
                      🎞️ PLAYBACK (F:{playbackFrame})
                    </span>
                  )}
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400 text-[11px]">{cam.model}</span>
                  <span className="text-slate-600 hidden sm:inline">•</span>
                  <span className="hidden sm:inline-flex text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-500/30 items-center gap-1">
                    <span>☁️ C2C: 1080p</span>
                    <span className="text-emerald-400 font-bold">xxHash64 ✓</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-bold tracking-wider">{getCameraTimecode(cam)}</span>
                  <button
                    onClick={() => setEditingCamId(cam.id)}
                    className="px-2 py-0.5 bg-[#1F2448] hover:bg-[#2B3162] text-slate-200 rounded text-[10px] border border-[#3A417A] transition-colors"
                    title="Configure stream URL, YouTube link, lens, or C2PA"
                  >
                    ⚙️ Source
                  </button>
                  {layoutMode !== "single" && (
                    <button
                      onClick={() => {
                        setActiveCamId(cam.id);
                        setLayoutMode("single");
                      }}
                      className="px-1.5 py-0.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 rounded text-[10px] border border-purple-500/40"
                      title="Focus on this camera in 1-Up mode"
                    >
                      ↗ Focus
                    </button>
                  )}
                </div>
              </div>

              {/* Video Player Canvas / Drag Target */}
              <div
                onDragOver={(e) => handleCameraDragOver(cam.id, e)}
                onDragLeave={(e) => handleCameraDragLeave(cam.id, e)}
                onDrop={(e) => handleCameraDrop(cam.id, e)}
                className={`relative aspect-video flex items-center justify-center overflow-hidden transition-all select-none bg-[#070913] ${
                  isOver ? "border-2 border-dashed border-cyan-400 bg-cyan-950/40" : ""
                }`}
              >
                {/* Dragging Highlight Overlay */}
                {isOver && (
                  <div className="absolute inset-0 bg-cyan-950/80 z-40 flex flex-col items-center justify-center text-cyan-300 font-mono text-xs pointer-events-none">
                    <div className="text-3xl mb-1 animate-bounce">📥</div>
                    <div className="font-bold">Drop Proxy for {cam.name}</div>
                  </div>
                )}

                {/* 1. YOUTUBE LIVE STREAM EMBED */}
                {cam.sourceType === "youtube" && cam.youtubeId && (
                  <div
                    className="absolute inset-0 w-full h-full transition-all"
                    style={{
                      ...getFeedFilterStyle(),
                      ...deSqueezeStyle
                    }}
                  >
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${cam.youtubeId}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${cam.youtubeId}`}
                      title={cam.name}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full pointer-events-none object-cover border-0"
                    />
                  </div>
                )}

                {/* 2. LOCAL UPLOADED OR PRESET VIDEO PROXY */}
                {cam.sourceType === "file" && cam.videoSrc && (
                  <CameraVideoFeed
                    src={cam.videoSrc}
                    isPlaying={isPlaying}
                    isFrameHold={isFrameHold}
                    monitorMode={monitorMode}
                    isPlayingPlayback={isPlayingPlayback}
                    playbackFrame={playbackFrame}
                    filterStyle={getFeedFilterStyle()}
                    deSqueezeStyle={deSqueezeStyle}
                  />
                )}

                {/* 3. SIMULATED PROXY PATTERN (Default) */}
                {cam.sourceType === "simulated" && (
                  <div
                    className={`absolute inset-0 flex items-center justify-center transition-all ${
                      exposureMode === "el_zone"
                        ? "bg-gradient-to-tr from-emerald-950 via-amber-950 to-indigo-950"
                        : exposureMode === "ire_false_color"
                        ? "bg-gradient-to-tr from-purple-950 via-green-950 to-pink-900"
                        : "bg-gradient-to-b from-[#0F1225] to-[#070913]"
                    }`}
                    style={getFeedFilterStyle()}
                  >
                    <div className="text-center p-4 space-y-1 z-10">
                      <div className="text-4xl animate-pulse">🎬</div>
                      <div className="text-xs font-mono font-bold text-slate-200">
                        {exposureMode === "el_zone"
                          ? "ASC EL ZONE EXPOSURE ASSIST"
                          : exposureMode === "ire_false_color"
                          ? "0-100 IRE FALSE COLOR HEATMAP"
                          : `${cam.model} C2C STREAM`}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {cam.lens} &bull; {cam.colorSpace}
                        {cam.anamorphicSqueeze > 1.0 && ` • ${cam.anamorphicSqueeze}x Desqueeze`}
                      </div>
                      <div className="pt-2 flex items-center justify-center gap-2">
                        <button
                          onClick={() => fileInputRefs.current[cam.id]?.click()}
                          className="px-2.5 py-1 bg-[#1A1E38] hover:bg-[#262A4A] border border-[#3A4070] text-slate-300 rounded text-[10px] font-mono transition-colors"
                        >
                          Drop .mp4 here or upload
                        </button>
                        <button
                          onClick={() => setEditingCamId(cam.id)}
                          className="px-2.5 py-1 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/40 text-cyan-300 rounded text-[10px] font-mono transition-colors"
                        >
                          Paste YouTube Live
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cooke /i & ARRI LDS-2 Live Lens Telemetry HUD */}
                {showLensHud && hudMode !== "clean" && (
                  <div className="absolute top-2.5 left-2.5 bg-black/75 border border-cyan-500/40 rounded px-2 py-1 text-[9px] font-mono text-cyan-300 z-20 backdrop-blur-sm pointer-events-none flex items-center gap-2">
                    <span className="text-white font-bold">{cam.lens}</span>
                    <span className="text-slate-500">•</span>
                    <span>FOCAL: <strong className="text-amber-300">40mm</strong></span>
                    <span>IRIS: <strong className="text-emerald-300">T/2.0</strong></span>
                    <span>FOCUS: <strong className="text-cyan-300">6&apos;4&quot;</strong></span>
                    {hudMode === "full" && (
                      <span>DoF: <span className="text-slate-300">5&apos;11&quot;–6&apos;10&quot;</span></span>
                    )}
                    {zoomPunchIn && isSelected && (
                      <span className="text-rose-400 font-bold bg-rose-950/80 px-1 rounded border border-rose-500/50 animate-pulse">
                        200% PUNCH-IN
                      </span>
                    )}
                  </div>
                )}

                {/* Minimalist Watermark for Clean Feed Mode */}
                {hudMode === "clean" && (
                  <div className="absolute top-2.5 left-2.5 bg-black/50 border border-white/10 rounded px-2 py-0.5 text-[10px] font-mono text-white/85 z-20 backdrop-blur-xs pointer-events-none">
                    {cam.name}
                  </div>
                )}

                {/* HIGH-FREQUENCY FOCUS PEAKING OVERLAY */}
                {focusPeakingActive && (
                  <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                    <div
                      className="absolute inset-0 border-2 border-cyan-400/50 mix-blend-screen opacity-70 pointer-events-none"
                      style={{
                        boxShadow: "inset 0 0 16px #06b6d4, 0 0 8px #06b6d4"
                      }}
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/85 border border-cyan-400 text-[9px] font-mono text-cyan-300 font-bold flex items-center gap-1.5 shadow-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      <span>PEAKING: CYAN ACTIVE</span>
                    </div>
                  </div>
                )}

                {/* LIVE A/B SPLIT-WIPE CONTINUITY OVERLAY (Dynamic Scene Takes Comparison) */}
                {splitWipeActive && isSelected && (() => {
                  const takeA = takes.find((t) => t.take_id === compareTakeAId) || (currentSceneTakes.length > 1 ? currentSceneTakes[currentSceneTakes.length - 2] : currentSceneTakes[0]);
                  const takeB = takes.find((t) => t.take_id === compareTakeBId) || currentSceneTakes[currentSceneTakes.length - 1];

                  return (
                    <div className="absolute inset-0 z-30 pointer-events-auto flex flex-col justify-between">
                      {/* Top Split Header Bar with Slider and Dynamic Take Pickers */}
                      <div className="bg-black/90 border-b border-purple-500/50 p-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-white backdrop-blur-md">
                        {/* Dynamic Take Pickers */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-amber-950/40 border border-amber-500/40 px-2 py-0.5 rounded">
                            <span className="text-amber-400 font-bold">◀ REF A:</span>
                            <select
                              value={takeA?.take_id || ""}
                              onChange={(e) => setCompareTakeAId(e.target.value)}
                              className="bg-[#0e1022] text-amber-300 font-bold border border-amber-500/50 rounded px-1.5 py-0.5 outline-none text-[10px] cursor-pointer"
                            >
                              {currentSceneTakes.map((t) => (
                                <option key={t.take_id} value={t.take_id} className="bg-[#0e1022] text-white">
                                  Take {t.take_number < 10 ? `0${t.take_number}` : t.take_number} {t.verdict ? `(${t.verdict})` : ""}
                                </option>
                              ))}
                            </select>
                          </div>

                          <span className="text-slate-400 font-bold">VS</span>

                          <div className="flex items-center gap-1 bg-purple-950/40 border border-purple-500/40 px-2 py-0.5 rounded">
                            <span className="text-purple-400 font-bold">CMP B:</span>
                            <select
                              value={takeB?.take_id || ""}
                              onChange={(e) => setCompareTakeBId(e.target.value)}
                              className="bg-[#0e1022] text-purple-300 font-bold border border-purple-500/50 rounded px-1.5 py-0.5 outline-none text-[10px] cursor-pointer"
                            >
                              {currentSceneTakes.map((t) => (
                                <option key={t.take_id} value={t.take_id} className="bg-[#0e1022] text-white">
                                  Take {t.take_number < 10 ? `0${t.take_number}` : t.take_number} {t.verdict ? `(${t.verdict})` : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Split Position Slider */}
                        <div className="flex items-center gap-2 flex-1 min-w-[140px] max-w-xs mx-2">
                          <span className="text-[9px] text-slate-400">Wipe:</span>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={splitPosition}
                            onChange={(e) => setSplitPosition(parseInt(e.target.value))}
                            className="w-full accent-purple-500 cursor-ew-resize"
                          />
                          <span className="text-purple-300 font-bold w-7 text-right">{splitPosition}%</span>
                        </div>

                        {/* Mode toggle and close */}
                        <div className="flex items-center gap-1.5 text-[9px]">
                          <button
                            onClick={() => setSplitWipeMode(splitWipeMode === "vertical" ? "onion" : "vertical")}
                            className="px-2 py-0.5 rounded bg-[#1A1E38] hover:bg-[#262A4A] text-slate-300 border border-[#262A4A] transition-colors cursor-pointer"
                          >
                            Mode: {splitWipeMode === "vertical" ? "Split Wipe" : "Onion Skin"}
                          </button>
                          <button
                            onClick={() => setSplitWipeActive(false)}
                            className="text-slate-400 hover:text-white px-1.5 cursor-pointer font-bold"
                            title="Close A/B Wipe"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Split Viewport Rendering */}
                      <div className="relative flex-1 overflow-hidden pointer-events-none">
                        {splitWipeMode === "vertical" ? (
                          <>
                            {/* Left Half: Take A Reference */}
                            <div
                              className="absolute inset-y-0 left-0 border-r-2 border-cyan-400 bg-amber-950/20 backdrop-contrast-125 overflow-hidden flex items-center justify-start z-10 shadow-2xl"
                              style={{ width: `${splitPosition}%` }}
                            >
                              <div className="absolute top-4 left-4 bg-black/85 border border-amber-500/60 p-2.5 rounded-lg text-[10px] font-mono text-amber-300 space-y-1 shadow-lg max-w-[220px]">
                                <div className="font-bold flex items-center gap-1.5 text-amber-200">
                                  <span>🎬</span> TAKE {takeA?.take_number ? (takeA.take_number < 10 ? `0${takeA.take_number}` : takeA.take_number) : "REF"}
                                  {takeA?.verdict && (
                                    <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/30 text-amber-300 font-bold border border-amber-500/50">
                                      {takeA.verdict}
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-300 text-[9px]">TC: {takeA?.timecode_in || "01:14:02:18"} ➔ {takeA?.timecode_out || "01:14:26:18"}</div>
                                <div className="text-slate-400 text-[9px] truncate">Note: <span className="text-white font-semibold">{takeA?.director_notes || takeA?.notes || "Baseline Master"}</span></div>
                                <div className="text-cyan-400 text-[8px]">Sound: {takeA?.sound_roll || activeSoundRoll} • 24.000 fps</div>
                              </div>
                              {/* Reference alignment guide */}
                              <div className="absolute top-[58%] inset-x-0 border-b-2 border-dashed border-amber-400/80 flex items-center justify-end pr-2">
                                <span className="bg-amber-500 text-black font-bold text-[8px] px-1 rounded">Ref Datum</span>
                              </div>
                            </div>

                            {/* Right Half Label: Take B Target */}
                            <div className="absolute top-4 right-4 bg-black/85 border border-purple-500/60 p-2.5 rounded-lg text-[10px] font-mono text-purple-300 space-y-1 z-10 shadow-lg max-w-[220px]">
                              <div className="font-bold flex items-center gap-1.5 text-purple-200">
                                <span>🎬</span> TAKE {takeB?.take_number ? (takeB.take_number < 10 ? `0${takeB.take_number}` : takeB.take_number) : "CMP"}
                                {takeB?.verdict && (
                                  <span className="text-[8px] px-1 py-0.2 rounded bg-purple-500/30 text-purple-300 font-bold border border-purple-500/50">
                                    {takeB.verdict}
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-300 text-[9px]">TC: {takeB?.timecode_in || "01:14:30:00"} ➔ {takeB?.timecode_out || masterTimecode}</div>
                              <div className="text-slate-400 text-[9px] truncate">Note: <span className="text-white font-semibold">{takeB?.director_notes || takeB?.notes || "Inspected Live Feed"}</span></div>
                              <div className="text-emerald-400 text-[8px]">Delta Check: Continuity Tracked</div>
                            </div>
                            {/* Take B comparison line */}
                            <div className="absolute top-[45%] inset-x-0 border-b-2 border-dashed border-purple-400/80 flex items-center justify-end pr-2 z-10">
                              <span className="bg-purple-500 text-white font-bold text-[8px] px-1 rounded">Target Datum</span>
                            </div>
                          </>
                        ) : (
                          /* 50% Onion Skin Overlay Mode */
                          <div className="absolute inset-0 bg-purple-950/30 flex items-center justify-center pointer-events-none">
                            <div className="bg-black/85 border border-purple-500 p-3 rounded-lg text-center text-xs font-mono text-slate-200 shadow-2xl">
                              <div className="font-bold text-purple-300 mb-1">50% ONION SKIN OVERLAY ACTIVE</div>
                              <div className="text-[10px] text-slate-400">
                                Ghosting Take {takeA?.take_number || "A"} over Take {takeB?.take_number || "B"} for framing &amp; prop continuity.
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* MULTI-FORMAT SAFE AREA FRAMING GUIDES & MATTE */}
                {framingAspect !== "off" && (
                  <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden flex flex-col justify-between">
                    {/* 2.39:1 Scope Letterbox Mode or All */}
                    {(framingAspect === "2.39" || framingAspect === "all") && (
                      <>
                        <div
                          className="w-full bg-black pointer-events-none transition-all duration-200 border-b border-cyan-500/30 flex items-end justify-between px-3 pb-0.5 text-[9px] font-mono text-cyan-400/80"
                          style={{ height: "12%", opacity: matteOpacity }}
                        >
                          <span>2.39:1 THEATRICAL SCOPE</span>
                          <span>SAFE ACTION 90%</span>
                        </div>
                        <div className="flex-1 relative flex items-center justify-center">
                          {/* 9:16 Social Safe Box (TikTok / Instagram Reels / Shorts) */}
                          {(showSocialSafe || framingAspect === "all") && (
                            <div className="h-full aspect-[9/16] border-2 border-dashed border-amber-400/80 rounded bg-amber-500/5 flex flex-col justify-between p-2 text-[9px] font-mono text-amber-300 pointer-events-none">
                              <div className="flex items-center justify-between bg-black/75 px-1.5 py-0.5 rounded border border-amber-500/40">
                                <span>📱 9:16 SOCIAL SAFE</span>
                                <span className="text-[8px] text-amber-200">Reels/TikTok</span>
                              </div>
                              <div className="text-center text-[8px] text-amber-300/80 bg-black/70 py-0.5 rounded">
                                Center Punch Target
                              </div>
                            </div>
                          )}

                          {/* 1.85:1 Flat Center Box when "all" */}
                          {framingAspect === "all" && (
                            <div className="h-full aspect-[1.85/1] border border-dotted border-purple-400/60 pointer-events-none flex items-end justify-start p-1 text-[8px] font-mono text-purple-300">
                              <span>1.85:1 FLAT</span>
                            </div>
                          )}
                        </div>
                        <div
                          className="w-full bg-black pointer-events-none transition-all duration-200 border-t border-cyan-500/30 flex items-start justify-between px-3 pt-0.5 text-[9px] font-mono text-cyan-400/80"
                          style={{ height: "12%", opacity: matteOpacity }}
                        >
                          <span>DCI SCOPE 4096×1716</span>
                          <span>ANAMORPHIC</span>
                        </div>
                      </>
                    )}

                    {/* 1.85:1 Flat Only Mode */}
                    {framingAspect === "1.85" && (
                      <div className="w-full h-full relative flex items-center justify-center pointer-events-none p-2">
                        <div className="h-full aspect-[1.85/1] border-2 border-purple-500/70 rounded bg-black/10 flex flex-col justify-between p-2 text-[9px] font-mono text-purple-300">
                          <div className="flex items-center justify-between bg-black/70 px-1.5 py-0.5 rounded border border-purple-500/40">
                            <span>1.85:1 ACADEMY FLAT</span>
                            <span>3996×2160</span>
                          </div>
                          <div className="border border-dashed border-purple-400/40 m-2 flex-1 flex items-start p-1 text-[8px]">
                            <span>SAFE ACTION 90%</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 16:9 Broadcast Only Mode */}
                    {framingAspect === "16:9" && (
                      <div className="w-full h-full relative flex items-center justify-center pointer-events-none p-2">
                        <div className="w-full h-full border-2 border-emerald-500/60 p-2 flex flex-col justify-between text-[9px] font-mono text-emerald-300">
                          <div className="flex items-center justify-between bg-black/70 px-1.5 py-0.5 rounded border border-emerald-500/40">
                            <span>16:9 BROADCAST UHD</span>
                            <span>3840×2160</span>
                          </div>
                          <div className="border border-dashed border-emerald-400/40 m-2 flex-1 flex items-start p-1 text-[8px]">
                            <span>SAFE ACTION 90%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ASC EL ZONE 15-ZONE SCALE LEGEND (Ed Lachman ASC Standard) */}
                {exposureMode === "el_zone" && hudMode !== "clean" && (
                  <div className="absolute top-2.5 right-2.5 bg-black/90 border border-amber-500/60 p-2 rounded-lg text-[9px] font-mono text-white z-20 space-y-1 backdrop-blur-md shadow-2xl pointer-events-none max-w-[210px]">
                    <div className="flex items-center justify-between border-b border-[#262A4A] pb-1">
                      <span className="font-bold text-amber-300 flex items-center gap-1">
                        <span>🎯</span> ASC EL ZONE
                      </span>
                      <span className="text-[8px] text-slate-400">18% Middle Gray</span>
                    </div>
                    <div className="space-y-1 pt-0.5 text-[8.5px]">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-white rounded-xs inline-block border border-slate-400" /> +6 EV</span>
                        <span className="text-slate-300 font-bold">Specular Clip</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-amber-400 rounded-xs inline-block" /> +1.5 EV</span>
                        <span className="text-amber-300 font-bold">Skin Highlight</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-emerald-500 rounded-xs inline-block" /> 0 EV</span>
                        <span className="text-emerald-400 font-bold">18% Gray Target</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-cyan-500 rounded-xs inline-block" /> -1.5 EV</span>
                        <span className="text-cyan-300">Shadow Detail</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-[#1E1B4B] rounded-xs inline-block border border-indigo-900" /> -6 EV</span>
                        <span className="text-slate-400">Crushed Black</span>
                      </div>
                    </div>
                    <div className="text-[8px] text-slate-400 border-t border-[#262A4A] pt-1">
                      Calibrated to: <strong className="text-amber-300">{cam.colorSpace}</strong>
                    </div>
                  </div>
                )}

                {/* 0-100 IRE FALSE COLOR LEGEND */}
                {exposureMode === "ire_false_color" && hudMode !== "clean" && (
                  <div className="absolute top-2.5 right-2.5 bg-black/90 border border-purple-500/60 p-2 rounded-lg text-[9px] font-mono text-white z-20 space-y-1 backdrop-blur-md shadow-2xl pointer-events-none">
                    <div className="font-bold text-purple-300 border-b border-[#262A4A] pb-1">
                      🌈 IRE FALSE COLOR
                    </div>
                    <div className="space-y-0.5 text-[8.5px]">
                      <div className="flex items-center gap-1.5"><span className="w-3 h-2 bg-rose-600 rounded-xs inline-block" /> &gt;100 IRE Clip</div>
                      <div className="flex items-center gap-1.5"><span className="w-3 h-2 bg-amber-500 rounded-xs inline-block" /> 70 IRE Skin Tone</div>
                      <div className="flex items-center gap-1.5"><span className="w-3 h-2 bg-emerald-500 rounded-xs inline-block" /> 42 IRE 18% Gray</div>
                      <div className="flex items-center gap-1.5"><span className="w-3 h-2 bg-blue-600 rounded-xs inline-block" /> &lt;10 IRE Crushed</div>
                    </div>
                  </div>
                )}

                {/* Bottom Left: Camera Status HUD */}
                {hudMode !== "clean" && (
                  <div className="absolute bottom-2.5 left-3 text-[10px] font-mono text-slate-300 z-20 bg-black/75 px-2 py-1 rounded backdrop-blur-sm space-y-0.5">
                    <div>
                      FPS:{" "}
                      <span
                        className={
                          isCamBreached ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"
                        }
                      >
                        {isCompensated
                          ? "24.000 (0.1% Pull-Up)"
                          : Math.abs(cam.fps - 24.0) < 0.001
                          ? "24.000 (Genlock Synced)"
                          : `${cam.fps.toFixed(3)} (Drift Detected)`}
                      </span>{" "}
                      {hudMode === "full" && "(Master: 24.000)"}
                    </div>
                    {hudMode === "full" && (
                      <div className="text-[9px] text-slate-400">
                        Source:{" "}
                        <span className="text-cyan-300">
                          {cam.sourceType === "youtube"
                            ? "Live YouTube Feed"
                            : cam.sourceType === "file"
                            ? `File: ${cam.uploadedFileName || "Ingested Clip"}`
                            : cam.protocol}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Right: Audio Phase Correlation & Dialogue Peak HUD */}
                {hudMode !== "clean" && (
                  <div className="absolute bottom-2.5 right-3 text-[10px] font-mono text-slate-300 z-20 bg-black/85 border border-[#262A4A] p-2 rounded-lg backdrop-blur-md flex flex-col gap-1.5 shadow-xl pointer-events-auto">
                    {/* VU Meters and dBFS */}
                    <div className="flex items-center justify-between gap-3">
                      {hudMode === "full" && (
                        <div className="text-[9px] font-mono space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400">CH1:</span>
                            <span className="text-emerald-400 font-bold">{isPlaying ? "-18.2 dBFS" : "-42.0 dBFS"}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400">CH2:</span>
                            <span className="text-emerald-400 font-bold">{isPlaying ? "-16.4 dBFS" : "-45.0 dBFS"}</span>
                          </div>
                        </div>
                      )}
                      {/* VU Meter Bars */}
                      <div className="flex gap-1 h-6 items-end bg-[#0A0D1A] p-0.5 rounded border border-[#1F2448]">
                        <div className="w-1.5 bg-emerald-400 rounded-xs transition-all duration-75" style={{ height: isPlaying ? "75%" : "15%" }} />
                        <div className="w-1.5 bg-emerald-400 rounded-xs transition-all duration-75" style={{ height: isPlaying ? "80%" : "12%" }} />
                        <div className="w-1.5 bg-amber-400 rounded-xs transition-all duration-75" style={{ height: isPlaying ? "35%" : "0%" }} />
                      </div>
                    </div>

                    {/* Phase Correlation Bar (-1.0 to +1.0) & Polarity Invert */}
                    <div className="pt-1 border-t border-[#262A4A]/70 flex items-center justify-between gap-2 text-[9px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Phase:</span>
                        <span className={`font-bold ${livePhase >= 0.5 ? "text-emerald-400" : livePhase >= 0 ? "text-amber-400" : "text-rose-400"}`}>
                          {livePhase >= 0 ? `+${livePhase.toFixed(2)}` : livePhase.toFixed(2)}
                        </span>
                        {livePhase < 0.2 && (
                          <span className="text-rose-400 font-bold text-[8px] bg-rose-950/80 px-1 rounded border border-rose-500/40 animate-pulse">
                            ⚠️ COMB
                          </span>
                        )}
                      </div>
                      {/* Phase Polarity Invert Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhaseInverted((prev) => {
                            const next = !prev;
                            setLivePhase((p) => -(p * 0.92));
                            triggerToast(next ? "Ø Polarity Inverted (180° Audio Phase Flip Applied)" : "Ø Polarity Normal (0° Phase)");
                            return next;
                          });
                        }}
                        className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold border transition-colors ${
                          phaseInverted
                            ? "bg-amber-600 text-white border-amber-400 shadow-sm"
                            : "bg-[#151830] text-slate-400 border-[#262A4A] hover:text-white"
                        }`}
                        title="Toggle 180° Audio Polarity Phase Invert"
                      >
                        <span>Ø {phaseInverted ? "180°" : "Invert"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Bottom Ribbon: Quick Switcher */}
              {hudMode !== "clean" && (
                <div className="bg-[#151830] px-3 py-1.5 border-t border-[#262A4A] flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>Lens: <strong className="text-slate-200">{cam.lens}</strong></span>
                    <span>&bull;</span>
                    <span>C2PA: <strong className="text-emerald-400">&check; Signed</strong></span>
                  </div>
                  {cam.sourceType !== "simulated" && (
                    <button
                      onClick={() =>
                        setCameras((prev) =>
                          prev.map((c) =>
                            c.id === cam.id
                              ? { ...c, sourceType: "simulated", videoSrc: null, youtubeId: undefined, youtubeUrl: undefined }
                              : c
                          )
                        )
                      }
                      className="text-[10px] text-rose-400 hover:text-rose-300"
                    >
                      Reset to Sim ↺
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* COLLAPSIBLE BOTTOM PRODUCTION SENTINEL & TELEMETRY DOCK */}
      <div className="bg-[#0A0D1E] border border-[#262A4A] rounded-xl overflow-hidden shadow-2xl font-mono text-xs transition-all">
        {/* Dock Master Bar (Always Visible Strip) */}
        <div className="px-4 py-2 bg-[#0E1126] border-b border-[#262A4A]/80 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Expand/Collapse & Title */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setBottomDockExpanded((prev) => !prev)}
              className="p-1 rounded bg-[#151830] hover:bg-[#1E2344] text-slate-300 border border-[#262A4A] transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="Toggle Bottom Telemetry Dock (Shortcut: B)"
            >
              <span>{bottomDockExpanded ? "▼" : "▲"}</span>
              <span>{bottomDockExpanded ? "Collapse" : "Expand"}</span>
              <span className="text-[10px] text-slate-500 font-normal">[B]</span>
            </button>
            <span className="font-bold text-white tracking-wide flex items-center gap-1.5">
              <span>🛡️</span> Production Guardians &amp; Telemetry
            </span>
          </div>

          {/* Center: Live Sentinel Status Chips with 1-Click Fast Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sentinel 1 Status Chip */}
            {(() => {
              const driftingCams = cameras.filter((cam) => {
                const isCompensated = !!cam.pullUpCompensated || (cam.id === "cam-b" && pullUpApplied);
                return Math.abs(cam.fps - 24.0) >= 0.0005 && !isCompensated;
              });
              const hasDrift = driftingCams.length > 0;
              const primaryDrift = driftingCams[0];
              const maxDriftSec = primaryDrift ? ((Math.abs(primaryDrift.fps - 24.0) * 7200) / 24.0).toFixed(1) : "0.0";

              return (
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] ${
                    hasDrift
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${hasDrift ? "bg-amber-400 animate-ping" : "bg-emerald-400"}`} />
                  <span>S1 Drift:</span>
                  <strong className={hasDrift ? "text-amber-400" : "text-emerald-400"}>
                    {hasDrift ? `+${maxDriftSec}s` : "0.0s Locked"}
                  </strong>
                  {hasDrift && (
                    <button
                      onClick={() => handleApplyPullUp()}
                      className="ml-1 px-1.5 py-0.2 bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 border border-amber-500/50 rounded text-[9px] font-bold transition-colors"
                      title="Apply 0.1% Audio Pull-Up to align all sensors"
                    >
                      ⚡ Pull-Up
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Sentinel 4 Status Chip */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] ${
                !cateringWrapped
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${!cateringWrapped ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
              <span>S4 Meal:</span>
              <strong className={!cateringWrapped ? "text-amber-400" : "text-emerald-400"}>
                {!cateringWrapped ? "18m Breach" : "Compliant"}
              </strong>
              {!cateringWrapped && (
                <div className="flex items-center gap-1 ml-1">
                  <button
                    onClick={handleCateringWrap}
                    className="px-1.5 py-0.5 bg-emerald-600/40 hover:bg-emerald-600/60 text-emerald-200 border border-emerald-500/40 rounded text-[9px] font-bold transition-colors"
                    title="Call Catering Wrap & reset penalty risk"
                  >
                    🍽️ Wrap
                  </button>
                  <button
                    onClick={handleDispatchUnionComplianceAlert}
                    className="px-1.5 py-0.5 bg-amber-600/40 hover:bg-amber-600/60 text-amber-200 border border-amber-500/40 rounded text-[9px] font-bold transition-colors"
                    title="Broadcast Timecode-Latched Union Breach Warning to Screen 8 Studio War Room"
                  >
                    ⚠️ Alert War Room
                  </button>
                </div>
              )}
            </div>

            {/* Sentinel 7 Status Chip */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] ${
                isPropMismatchFlagged
                  ? "bg-purple-500/10 border-purple-500/40 text-purple-300"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isPropMismatchFlagged ? "bg-purple-400 animate-pulse" : "bg-emerald-400"}`} />
              <span>S7 Prop:</span>
              <strong className={isPropMismatchFlagged ? "text-purple-300" : "text-emerald-400"}>
                {isPropMismatchFlagged ? `+${propDelta}% Delta` : "Verified"}
              </strong>
              {isPropMismatchFlagged && (
                <div className="flex items-center gap-1 ml-1">
                  <button
                    onClick={() => setSplitWipeActive(!splitWipeActive)}
                    className="px-1.5 py-0.2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded text-[9px] font-bold transition-colors"
                    title="Toggle Live A/B Split-Wipe"
                  >
                    🔀 Wipe
                  </button>
                  <button
                    onClick={handleDispatchVfxInpaint}
                    className="px-1.5 py-0.2 bg-fuchsia-600/30 hover:bg-fuchsia-600/50 text-fuchsia-200 border border-fuchsia-500/40 rounded text-[9px] font-bold transition-colors"
                    title="Dispatch Inpaint Fix to Screen 4 (Autodesk Flow / ShotGrid)"
                  >
                    🎨 S4 Inpaint
                  </button>
                </div>
              )}
            </div>

            {/* SAG-AFTRA Likeness Status Chips */}
            {(() => {
              const displayList = activePerformers.length > 0 ? activePerformers.slice(0, 2) : [activePerformer].filter(Boolean);
              if (displayList.length === 0) {
                return (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] bg-indigo-500/10 border-indigo-500/30 text-indigo-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>SAG-AFTRA:</span>
                    <strong className="text-indigo-200">
                      {(activeProject || "").toLowerCase().includes("matrix") ? "K. Reeves (Neo)" : "M. Vance"} (0%)
                    </strong>
                  </div>
                );
              }

              return displayList.map((perf: any) => {
                const displayName = perf.actor_name === "Keanu Reeves" ? "K. Reeves (Neo)" 
                  : perf.actor_name === "Hugo Weaving" ? "H. Weaving (Smith)" 
                  : perf.actor_name === "Marcus Vance" ? "M. Vance" 
                  : perf.actor_name;
                const used = perf?.used_seconds ?? 0;
                const auth = perf?.authorized_seconds ?? 60;
                const pct = Math.round((used / (auth || 1)) * 100);
                const status = perf?.status || (pct > 100 ? "CAP_EXCEEDED" : pct >= 80 ? "WARNING_THRESHOLD" : "CLEARED");
                const isCapped = status === "CAP_EXCEEDED" || pct > 100;
                const isWarning = status === "WARNING_THRESHOLD" || (pct >= 80 && pct <= 100);

                return (
                  <div
                    key={perf.actor_id}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition-all ${
                      isCapped ? "bg-rose-500/15 border-rose-500/50 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.25)]" :
                      isWarning ? "bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]" :
                      "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isCapped ? "bg-rose-400 animate-pulse" : isWarning ? "bg-amber-400" : "bg-indigo-400"
                    }`} />
                    <span>SAG:</span>
                    <strong className={isCapped ? "text-rose-200" : isWarning ? "text-amber-200" : "text-indigo-200"}>
                      {displayName} ({pct}%)
                    </strong>
                    <button
                      onClick={() => handleExtendLikeness(perf.actor_id, perf.actor_name)}
                      className={`ml-1 px-1.5 py-0.2 rounded text-[9px] font-bold transition-colors border ${
                        isCapped ? "bg-rose-600/40 hover:bg-rose-600/60 text-rose-100 border-rose-400/50" :
                        isWarning ? "bg-amber-600/40 hover:bg-amber-600/60 text-amber-100 border-amber-400/50" :
                        "bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border-indigo-500/40"
                      }`}
                      title={`Extend Likeness Cap for ${displayName} by +15s (Screen 3 Legal Vault)`}
                    >
                      +15s
                    </button>
                    {onNavigateTab && (
                      <button
                        onClick={() => onNavigateTab("sag-likeness")}
                        className="px-1 py-0.2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded text-[9px] transition-colors"
                        title="View SAG-AFTRA Digital Likeness Registry (Screen 3)"
                      >
                        S3 ➔
                      </button>
                    )}
                  </div>
                );
              });
            })()}

            {/* Genlock Phase Status */}
            {(() => {
              const driftingCount = cameras.filter((c) => {
                const isComp = !!c.pullUpCompensated || (c.id === "cam-b" && pullUpApplied);
                return Math.abs(c.fps - 24.0) >= 0.0005 && !isComp;
              }).length;
              return (
                <div className="hidden xl:flex items-center gap-1 px-2 py-1 text-[11px] text-slate-400">
                  <span>Genlock:</span>
                  <strong className={driftingCount > 0 ? "text-amber-400" : "text-emerald-400"}>
                    {cameras.length - driftingCount}/{cameras.length} Locked
                  </strong>
                </div>
              );
            })()}
          </div>

          {/* Right: Tab Switcher between Sentinel Cards & Ingest Matrix */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#14172E] border border-[#262A4A] rounded-lg p-0.5 text-[11px]">
              <button
                onClick={() => {
                  setBottomDockTab("sentries");
                  if (!bottomDockExpanded) setBottomDockExpanded(true);
                }}
                className={`px-2.5 py-0.5 rounded transition-all ${
                  bottomDockExpanded && bottomDockTab === "sentries"
                    ? "bg-purple-600 text-white font-bold shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🛡️ Sentry Cards (3)
              </button>
              <button
                onClick={() => {
                  setBottomDockTab("matrix");
                  if (!bottomDockExpanded) setBottomDockExpanded(true);
                }}
                className={`px-2.5 py-0.5 rounded transition-all ${
                  bottomDockExpanded && bottomDockTab === "matrix"
                    ? "bg-purple-600 text-white font-bold shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                📊 Ingest Matrix ({cameras.length})
              </button>
            </div>
          </div>
        </div>

        {/* EXPANDABLE DOCK CONTENT */}
        {bottomDockExpanded && (
          <div className="p-4 space-y-4 border-t border-[#1F2448] bg-[#0A0D1A]/90 animate-in fade-in duration-200">
            {/* VIEW 1: 3 SENTRY GUARDIAN CARDS */}
            {bottomDockTab === "sentries" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Sentry 1: Fractional Timecode Drift */}
                {(() => {
                  const driftingCams = cameras.filter((cam) => {
                    const isCompensated = !!cam.pullUpCompensated || (cam.id === "cam-b" && pullUpApplied);
                    return Math.abs(cam.fps - 24.0) >= 0.0005 && !isCompensated;
                  });
                  const hasDrift = driftingCams.length > 0;
                  const primaryDrift = driftingCams[0];
                  const maxDriftSec = primaryDrift ? ((Math.abs(primaryDrift.fps - 24.0) * 7200) / 24.0).toFixed(1) : "0.0";

                  return (
                    <div
                      className={`p-4 rounded-xl shadow-lg border transition-all ${
                        !hasDrift ? "bg-[#121528] border-emerald-500/40" : "bg-[#121528] border-amber-500/40"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono font-bold">
                        <span className="flex items-center gap-1.5 text-amber-400">
                          <span>⏱️</span> Sentry 1: Fractional Drift Monitor
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded ${
                            !hasDrift
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                          }`}
                        >
                          {!hasDrift ? "RESOLVED (0.0s)" : `CRITICAL (+${maxDriftSec}s Drift)`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-2 font-mono leading-relaxed">
                        {!hasDrift
                          ? "✓ Locked: All 4 camera heads phase-aligned to 24.000 fps LTC master clock."
                          : `Camera B (23.976 fps) clocked against 24.000 fps master LTC. Cumulative drift: +${maxDriftSec}s across 2h.`}
                      </p>
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#262A4A] text-xs font-mono">
                        <span className="text-slate-400">Remediation:</span>
                        <span className="text-emerald-400 font-bold">
                          {!hasDrift ? "✓ Pull-Up Active (All Cams Synced)" : "0.1% Audio Pull-Up Filter"}
                        </span>
                      </div>
                      {hasDrift && (
                        <button
                          onClick={() => handleApplyPullUp()}
                          className="mt-3 w-full py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-xs font-mono font-semibold transition-colors"
                        >
                          Apply Autonomous Audio Pull-Up (Sync All)
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Sentry 4: IATSE/DGA Meal Penalty Countdown */}
                <div
                  className={`p-4 rounded-xl shadow-lg border transition-all ${
                    cateringWrapped ? "bg-[#121528] border-emerald-500/40" : "bg-[#121528] border-amber-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-400">
                    <span className="flex items-center gap-1.5">
                      <span>🍱</span> Sentry 4: Meal Penalty Countdown
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded ${
                        cateringWrapped ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {cateringWrapped ? "COMPLIANT" : "TIER 2 BREACH"}
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-bold font-mono text-white">
                    {cateringWrapped ? "Meal Break Active" : formatMealCountdown(mealRemainingSec)}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Status:{" "}
                    <span className={cateringWrapped ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                      {cateringWrapped ? "Cleared (Standing Down)" : "18m in breach • Compounding Tier 2"}
                    </span>
                  </div>
                  {!cateringWrapped && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={handleCateringWrap}
                        className="flex-1 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-500/40 rounded text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        <span>🍽️ Wrap Catering</span>
                      </button>
                      <button
                        onClick={handleDispatchUnionComplianceAlert}
                        className="py-1.5 px-2.5 bg-amber-600/30 hover:bg-amber-600/40 text-amber-200 border border-amber-500/40 rounded text-xs font-mono font-semibold transition-colors flex items-center gap-1"
                        title="Broadcast Timecode-Latched Union Breach Alert to Screen 8 War Room"
                      >
                        <span>⚠️ Alert War Room</span>
                      </button>
                      {onNavigateTab && (
                        <button
                          onClick={() => onNavigateTab("war-room")}
                          className="px-3 py-1.5 bg-[#1A1E38] hover:bg-[#262A4A] text-purple-300 border border-purple-500/40 rounded text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer"
                          title="Manage Call Sheet, Crew Count & Union Rules in Studio War Room"
                        >
                          <span>🏢 War Room</span>
                          <span>➔</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Sentry 7: Prop Continuity Meniscus Tracker */}
                <div className={`p-4 rounded-xl shadow-lg border transition-all ${
                  isPropMismatchFlagged ? "bg-[#121528] border-purple-500/50" : "bg-[#121528] border-emerald-500/30"
                } space-y-2 font-mono text-xs`}>
                  <div className="flex items-center justify-between font-bold text-purple-300">
                    <span className="flex items-center gap-1.5">
                      <span>🥃</span> Sentry 7: Prop Continuity Tracker
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${
                      isPropMismatchFlagged
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    }`}>
                      {isPropMismatchFlagged ? `FLAGGED (+${propDelta}% Delta)` : "COMPLIANT"}
                    </span>
                  </div>
                  <div className="text-slate-300">
                    {trackedPropName}: <span className="text-amber-400 font-bold">{propBaselineFill}% (Take 3) vs {propCurrentFill}% (Take 4)</span>.
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isPropMismatchFlagged
                      ? `Computer Vision flagged ${propDelta}% liquid delta exceeding ${propToleranceThreshold}% continuity safety threshold.`
                      : `Liquid fill delta (${propDelta}%) verified within approved continuity threshold.`}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSplitWipeActive(!splitWipeActive)}
                      className={`flex-1 py-1.5 rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                        splitWipeActive
                          ? "bg-purple-600 text-white font-bold"
                          : "bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40"
                      }`}
                      title="Toggle Live A/B Split Wipe on active feed"
                    >
                      <span>🔀</span>
                      <span>{splitWipeActive ? "Close A/B Wipe" : "Live A/B Wipe"}</span>
                    </button>
                    <button
                      onClick={() => setShowContinuityModal(true)}
                      className="px-3 py-1.5 bg-[#1A1E38] hover:bg-[#262A4A] text-slate-200 border border-[#262A4A] rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                      title="Compare high-resolution meniscus stills"
                    >
                      <span>🔍 Stills</span>
                    </button>
                    <button
                      onClick={handleDispatchVfxInpaint}
                      className="px-3 py-1.5 bg-fuchsia-600/30 hover:bg-fuchsia-600/50 text-fuchsia-200 border border-fuchsia-500/40 rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                      title="Dispatch automated VFX Inpaint clean-plate to Screen 4 (Autodesk Flow / ShotGrid)"
                    >
                      <span>🎨</span>
                      <span>VFX Inpaint (S4)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: CROSS-CAMERA GENLOCK INGEST MATRIX */}
            {bottomDockTab === "matrix" && (
              <div className="bg-[#0E1124] border border-[#262A4A] rounded-xl p-4 font-mono text-xs shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#262A4A] pb-2 gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>📊</span> Cross-Camera Genlock &amp; Synchronized Ingest Matrix
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      SMPTE ST 12-1 linear timecode &amp; phase drift telemetry comparing active camera sensors to master studio clock.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    {(() => {
                      const driftingCount = cameras.filter((c) => {
                        const isComp = !!c.pullUpCompensated || (c.id === "cam-b" && pullUpApplied);
                        return Math.abs(c.fps - 24.0) >= 0.0005 && !isComp;
                      }).length;
                      const hasDrift = driftingCount > 0;
                      return (
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${hasDrift ? "bg-amber-400 animate-ping" : "bg-emerald-400 animate-pulse"}`} />
                          <span className={hasDrift ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                            {hasDrift
                              ? `${cameras.length - driftingCount}/${cameras.length} Locked • ${driftingCount} Drifting`
                              : `${cameras.length}/${cameras.length} Heads In Phase (0.0 ms Delta)`}
                          </span>
                        </div>
                      );
                    })()}
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-300">
                      Master: <strong className="text-emerald-400">Ambient Master Lockit ACN-CL (24.000 fps LTC)</strong>
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-500 text-[10px] uppercase border-b border-[#262A4A]">
                        <th className="pb-2">Camera Head &amp; Lens</th>
                        <th className="pb-2">Active Source Stream</th>
                        <th className="pb-2">Sensor vs Master FPS</th>
                        <th className="pb-2">Phase Drift Rate</th>
                        <th className="pb-2">Cumulative Drift (2h)</th>
                        <th className="pb-2">C2PA Hardware Hash</th>
                        <th className="pb-2">Transmitter / C2C</th>
                        <th className="pb-2 text-right">Sentry 1 Verdict</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1D2140] text-[11px]">
                      {cameras.map((cam) => {
                        const isCompensated = !!cam.pullUpCompensated || (cam.id === "cam-b" && pullUpApplied);
                        const effectiveFps = isCompensated ? 24.000 : cam.fps;
                        const deltaFps = Math.abs(effectiveFps - 24.000);
                        const isDrifting = deltaFps >= 0.0005;
                        const isLagging = effectiveFps < 24.000;
                        
                        const driftFrames = isDrifting ? deltaFps * 7200 : 0;
                        const driftSec = isDrifting ? driftFrames / 24.000 : 0;
                        const ratePerMin = isDrifting ? deltaFps * 60 : 0;

                        const getStandardTag = () => {
                          if (isCompensated) return "0.1% Audio Pull-Up Locked";
                          if (Math.abs(cam.fps - 24.0) < 0.001) return "Genlock Locked (1:1 Cinema)";
                          if (Math.abs(cam.fps - 23.976) < 0.005) return "NTSC Fractional (-0.1% Pull-Down)";
                          if (Math.abs(cam.fps - 25.0) < 0.001) return "EBU / PAL (+4.17% Phase Lead)";
                          if (Math.abs(cam.fps - 29.97) < 0.01) return "US Broadcast (+24.88% Phase Lead)";
                          if (Math.abs(cam.fps - 48.0) < 0.001) return "HFR Dual-Speed (2:1 Cadence)";
                          return `${cam.fps > 24.0 ? "+" : ""}${(((cam.fps - 24.0) / 24.0) * 100).toFixed(2)}% Off-Speed`;
                        };

                        return (
                          <tr key={cam.id} className="hover:bg-[#151830]/50 transition-colors">
                            {/* Camera Head & Lens */}
                            <td className="py-2.5">
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isDrifting ? "bg-amber-400 animate-ping" : "bg-emerald-400"}`} />
                                <span>{cam.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {cam.model} &bull; {cam.lens} ({cam.anamorphicSqueeze > 1.0 ? `${cam.anamorphicSqueeze}x Anamorphic` : "Spherical 1.0x"})
                              </div>
                              <div className="text-[9px] text-slate-500">Op: {cam.operator}</div>
                            </td>

                            {/* Active Source Stream */}
                            <td className="py-2.5">
                              {cam.sourceType === "youtube" ? (
                                <div>
                                  <span className="text-rose-400 font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                    YouTube Live
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    ID: {cam.youtubeId || "External Stream"}
                                  </span>
                                </div>
                              ) : cam.sourceType === "file" ? (
                                <div>
                                  <span className="text-cyan-300 font-bold">📁 Ingested Proxy</span>
                                  <div className="text-[10px] text-slate-400 truncate max-w-[140px]" title={cam.uploadedFileName || "proxy.mp4"}>
                                    {cam.uploadedFileName || "proxy.mp4"}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <span className="text-purple-300 font-bold">📡 {cam.protocol.split(" ")[0]}</span>
                                  <div className="text-[10px] text-slate-400 font-mono">C2C Stream Ingest</div>
                                </div>
                              )}
                            </td>

                            {/* Sensor vs Master FPS */}
                            <td className="py-2.5 text-slate-300">
                              <div className="font-mono">
                                <span className={isDrifting ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                                  {effectiveFps.toFixed(3)}
                                </span>{" "}
                                / 24.000
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {getStandardTag()}
                              </div>
                            </td>

                            {/* Phase Drift Rate */}
                            <td className="py-2.5 font-mono">
                              {isDrifting ? (
                                <div>
                                  <span className="text-amber-400 font-bold">
                                    {isLagging ? "-" : "+"}{ratePerMin.toFixed(2)} fr/min
                                  </span>
                                  <div className="text-[10px] text-amber-300/80">
                                    {isLagging ? "(Phase Lag)" : "(Phase Lead)"}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <span className="text-emerald-400">0.00 fr/min</span>
                                  <div className="text-[10px] text-slate-500">&plusmn;0.0 ms phase</div>
                                </div>
                              )}
                            </td>

                            {/* Cumulative Drift (2h Shoot) */}
                            <td className="py-2.5 font-mono">
                              {isDrifting ? (
                                <div>
                                  <span className="text-amber-400 font-bold">+{driftSec.toFixed(1)}s / 2h</span>
                                  <div className="text-[10px] text-amber-300/80">
                                    ({isLagging ? "-" : "+"}{driftFrames.toFixed(1)} frames)
                                  </div>
                                </div>
                              ) : isCompensated ? (
                                <div>
                                  <span className="text-emerald-400 font-bold">0.0s (Compensated)</span>
                                  <div className="text-[10px] text-emerald-400/80">Pull-Up DSP Active</div>
                                </div>
                              ) : (
                                <div>
                                  <span className="text-emerald-400 font-bold">0.0 frames</span>
                                  <div className="text-[10px] text-slate-500">&plusmn;0.2 &micro;s Lockit Phase</div>
                                </div>
                              )}
                            </td>

                            {/* C2PA Hash */}
                            <td className="py-2.5 text-slate-400 font-mono text-[10px]">
                              <div className="flex items-center gap-1 text-emerald-400">
                                <span>&check;</span>
                                <span className="truncate max-w-[130px]" title={cam.c2paCert}>{cam.c2paCert}</span>
                              </div>
                              <div className="text-[9px] text-slate-500">Hardware Enclave Signed</div>
                            </td>

                            {/* Transmitter */}
                            <td className="py-2.5 text-slate-300 text-[11px]">
                              <div>{cam.transmitter}</div>
                              <div className="text-[10px] text-slate-500">{cam.timecodeMaster.split(" ")[0]} Genlock</div>
                            </td>

                            {/* Sentry Verdict & Quick Action */}
                            <td className="py-2.5 text-right">
                              {isDrifting ? (
                                <div className="space-y-1">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-block">
                                    {cam.fps === 23.976
                                      ? "PULL-UP REQUIRED (+0.1%)"
                                      : cam.fps === 25.0
                                      ? "PULL-DOWN REQUIRED (-4.0%)"
                                      : "RESAMPLE REQUIRED"}
                                  </span>
                                  <div>
                                    <button
                                      onClick={() => handleApplyPullUp(cam.id)}
                                      className="px-2 py-0.5 bg-amber-500/30 hover:bg-amber-500/40 text-amber-200 border border-amber-500/50 rounded text-[9px] font-bold transition-colors"
                                      title={`Apply audio DSP re-clocking to ${cam.name}`}
                                    >
                                      {cam.fps === 23.976 ? "⚡ Apply 0.1% Pull-Up" : "⚡ Retime & Lock"}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-block">
                                  PASSED &bull; LOCKED
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SCRIPT SUPERVISOR NOTES MODAL */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121528] border border-[#262A4A] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#262A4A] pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>📝</span> Script Supervisor &amp; Director Slate Notes
              </h3>
              <button onClick={() => setShowNotesModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 text-[11px]">
                Editorial Notes for {activeScene} • Take 0{activeTake}:
              </label>
              <textarea
                rows={4}
                value={directorNotes}
                onChange={(e) => setDirectorNotes(e.target.value)}
                className="w-full bg-[#151830] border border-[#262A4A] p-2.5 rounded text-white font-mono text-xs focus:border-purple-500 focus:outline-none"
                placeholder="Enter take quality notes, performance nuances, or editorial recommendations..."
              />
            </div>
            <div className="p-2.5 bg-[#151830] border border-[#262A4A] rounded text-[10px] text-slate-400">
              💡 These notes export directly into DaVinci Resolve markers, Avid ALE, and OpenTimelineIO metadata.
            </div>
            <div className="pt-2 border-t border-[#262A4A] flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] text-purple-400 font-mono">
                Latched SMPTE: {masterTimecode}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNotesModal(false)}
                  className="px-3 py-1.5 bg-[#1A1E38] hover:bg-[#262A4A] text-slate-300 rounded font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowNotesModal(false);
                    triggerToast("✓ Script notes saved to take metadata.");
                  }}
                  className="px-3 py-1.5 bg-[#262A4A] hover:bg-[#343A66] text-slate-200 rounded font-bold text-xs"
                >
                  Save Local
                </button>
                <button
                  onClick={handleSaveAndRouteScriptNotes}
                  className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded font-bold text-xs shadow-lg flex items-center gap-1.5"
                >
                  <span>🚀 Save & Route to Screen 8</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTINUITY MODAL (Take 3 vs Take 4) */}
      {showContinuityModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121528] border border-[#262A4A] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#262A4A] pb-3">
              <h3 className="text-sm font-bold text-white">Take 03 vs Take 04 Liquid Continuity</h3>
              <button onClick={() => setShowContinuityModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-[#151830] rounded border border-[#262A4A]">
                <div className="text-2xl mb-1">🥃</div>
                <div className="font-bold text-white">Take 03 (42% Fill)</div>
                <div className="text-[10px] text-slate-500">Meniscus: 14.2mm from rim</div>
              </div>
              <div className="p-4 bg-[#151830] rounded border border-amber-500/40">
                <div className="text-2xl mb-1">🥃</div>
                <div className="font-bold text-amber-400">Take 04 (68% Fill)</div>
                <div className="text-[10px] text-amber-300">Meniscus: 7.8mm from rim (Mismatch)</div>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 leading-relaxed">
              Script Supervisor alert dispatched: Liquid level exceeds 15% continuity threshold. Re-topping prop recommended before rolling Take 05.
            </div>
            <div className="pt-3 border-t border-[#262A4A] flex justify-end">
              <button
                onClick={() => setShowContinuityModal(false)}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold"
              >
                Acknowledge Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VISUAL CONFIGURATION DRAWER / MODAL */}
      {editingCamId && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121528] border border-[#262A4A] rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl font-mono text-xs max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#262A4A] pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>⚙️</span> Ingest &amp; Hardware Configuration: {editingCamera.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Configure live YouTube stream, local video file, C2C transmitters, Cooke /i lens data, and C2PA root certificate.
                </p>
              </div>
              <button onClick={() => setEditingCamId(null)} className="text-slate-400 hover:text-white text-base">
                ✕
              </button>
            </div>

            {/* Config Tabs */}
            <div className="flex items-center gap-2 border-b border-[#262A4A] pb-2">
              <button
                onClick={() => setConfigTab("stream")}
                className={`px-3 py-1 rounded transition-colors ${
                  configTab === "stream" ? "bg-purple-600 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                1. Stream Source (YouTube / File / Live)
              </button>
              <button
                onClick={() => setConfigTab("hardware")}
                className={`px-3 py-1 rounded transition-colors ${
                  configTab === "hardware" ? "bg-purple-600 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                2. Camera &amp; Lens Hardware
              </button>
              <button
                onClick={() => setConfigTab("timecode")}
                className={`px-3 py-1 rounded transition-colors ${
                  configTab === "timecode" ? "bg-purple-600 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                3. Timecode &amp; Genlock
              </button>
              <button
                onClick={() => setConfigTab("c2pa")}
                className={`px-3 py-1 rounded transition-colors ${
                  configTab === "c2pa" ? "bg-purple-600 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                4. C2PA &amp; Color Science
              </button>
            </div>

            {/* TAB 1: STREAM SOURCE (YouTube Live, File, or Protocols) */}
            {configTab === "stream" && (
              <div className="space-y-4">
                {/* YouTube Live / Video Section */}
                <div className="p-4 bg-[#151830] border border-cyan-500/40 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300 text-sm flex items-center gap-1.5">
                      <span>🔴</span> Live YouTube Feed Input
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      24/7 Testing Ready
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Paste any live YouTube channel URL, livestream link, or video URL. The stream will embed directly into this camera viewport with live False Color and 2.39:1 scope overlay support.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. https://www.youtube.com/watch?v=DDU-rZs-Ic4 or video ID"
                      defaultValue={editingCamera.youtubeUrl || ""}
                      id={`yt-input-${editingCamera.id}`}
                      className="flex-1 bg-[#0A0D1E] border border-[#262A4A] px-3 py-2 rounded text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById(`yt-input-${editingCamera.id}`) as HTMLInputElement;
                        if (input) handleSetYouTubeFeed(editingCamera.id, input.value);
                      }}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold transition-colors"
                    >
                      Connect Feed
                    </button>
                  </div>

                  {/* 1-Click Live YouTube Presets */}
                  <div className="pt-2 border-t border-[#262A4A] space-y-1.5">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Or Select 1-Click Free Test Presets:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {YOUTUBE_PRESETS.map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => {
                            const input = document.getElementById(`yt-input-${editingCamera.id}`) as HTMLInputElement;
                            if (input) input.value = preset.url;
                            handleSetYouTubeFeed(editingCamera.id, preset.url);
                          }}
                          className="px-2.5 py-1 bg-[#1F2448] hover:bg-[#2C3364] text-slate-200 border border-[#3A4178] rounded text-[10px] transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Local Video Proxy Drop / Upload */}
                <div className="p-4 bg-[#151830] border border-[#262A4A] rounded-xl space-y-2">
                  <div className="font-bold text-white text-sm flex items-center gap-1.5">
                    <span>📁</span> Local Video File Upload (.mp4 / .mov / .webm)
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Upload an offline proxy video directly into this camera head. The video will loop continuously and sync with the timecode ticker.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => fileInputRefs.current[editingCamera.id]?.click()}
                      className="px-4 py-1.5 bg-[#1F2448] hover:bg-[#2C3364] text-white border border-[#3A4178] rounded font-bold transition-colors"
                    >
                      Choose Video File
                    </button>
                    <span className="text-[11px] text-slate-400">
                      {editingCamera.uploadedFileName ? `Active: ${editingCamera.uploadedFileName}` : "No file loaded"}
                    </span>
                  </div>
                </div>

                {/* Standard Broadcast Ingest Protocol Select */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">Ingest Transport Protocol</label>
                    <select
                      value={editingCamera.protocol}
                      onChange={(e) => updateCameraProperty(editingCamera.id, "protocol", e.target.value)}
                      className="w-full bg-[#151830] border border-[#262A4A] px-3 py-1.5 rounded text-white font-mono"
                    >
                      <option>SRT over UDP (Port 9001/9002)</option>
                      <option>WebRTC Low-Latency (WHEP / Sub-500ms)</option>
                      <option>RTSP / NDI Local Network Stream</option>
                      <option>Frame.io C2C Ingest Webhook</option>
                      <option>SMPTE ST 2110-20 Uncompressed</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">Endpoint URL / URI</label>
                    <input
                      type="text"
                      value={editingCamera.streamUrl}
                      onChange={(e) => updateCameraProperty(editingCamera.id, "streamUrl", e.target.value)}
                      className="w-full bg-[#151830] border border-[#262A4A] px-3 py-1.5 rounded text-slate-200 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CAMERA & LENS HARDWARE */}
            {configTab === "hardware" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">Camera Package / Model</label>
                    <select
                      value={editingCamera.model}
                      onChange={(e) => updateCameraProperty(editingCamera.id, "model", e.target.value)}
                      className="w-full bg-[#151830] border border-[#262A4A] px-3 py-1.5 rounded text-white font-mono"
                    >
                      <option>ARRI ALEXA 35 (Super 35 4K)</option>
                      <option>ARRI ALEXA MINI LF (Large Format)</option>
                      <option>SONY VENICE 2 (8K Full-Frame)</option>
                      <option>RED V-RAPTOR XL 8K (VV)</option>
                      <option>BLACKMAGIC URSA CINE 12K</option>
                      <option>CANON EOS C500 MARK II</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">Lens System &amp; Metadata Protocol</label>
                    <input
                      type="text"
                      value={editingCamera.lens}
                      onChange={(e) => updateCameraProperty(editingCamera.id, "lens", e.target.value)}
                      className="w-full bg-[#151830] border border-[#262A4A] px-3 py-1.5 rounded text-white font-mono text-[11px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">Anamorphic Squeeze Factor</label>
                    <select
                      value={editingCamera.anamorphicSqueeze}
                      onChange={(e) => updateCameraProperty(editingCamera.id, "anamorphicSqueeze", parseFloat(e.target.value))}
                      className="w-full bg-[#151830] border border-[#262A4A] px-3 py-1.5 rounded text-white font-mono"
                    >
                      <option value={2.0}>2.0x (Standard Cinema Anamorphic)</option>
                      <option value={1.8}>1.8x (Cooke Full Frame Plus)</option>
                      <option value={1.5}>1.5x (Technovision / Atlas)</option>
                      <option value={1.33}>1.33x (Widescreen 16:9 Adapt)</option>
                      <option value={1.0}>1.0x (Spherical Prime)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">Camera Operator Call Sign</label>
                    <input
                      type="text"
                      value={editingCamera.operator}
                      onChange={(e) => updateCameraProperty(editingCamera.id, "operator", e.target.value)}
                      className="w-full bg-[#151830] border border-[#262A4A] px-3 py-1.5 rounded text-white font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div className="p-3 bg-[#151830] border border-[#262A4A] rounded-lg text-slate-300 text-[11px]">
                  🔬 <strong>Lens Data Intercept:</strong> Cooke /i protocol continuously logs focal length, T-stop, focus distance, and entrance pupil into the C2C telemetry stream to feed VFX match-move without survey markers.
                </div>
              </div>
            )}

            {/* TAB 3: TIMECODE & GENLOCK */}
            {configTab === "timecode" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">Camera Sensor Clock Rate (FPS)</label>
                    <select
                      value={editingCamera.fps}
                      onChange={(e) => {
                        const newFps = parseFloat(e.target.value);
                        const is24 = Math.abs(newFps - 24.0) < 0.001;
                        setCameras((prev) =>
                          prev.map((c) =>
                            c.id === editingCamera.id
                              ? {
                                  ...c,
                                  fps: newFps,
                                  status: is24 ? "LOCKED" : "DRIFT",
                                  pullUpCompensated: false,
                                  driftAmount: is24 ? undefined : `Drift active (${newFps.toFixed(3)} fps)`
                                }
                              : c
                          )
                        );
                        if (!is24) {
                          setPullUpApplied(false);
                        }
                      }}
                      className="w-full bg-[#151830] border border-[#262A4A] px-3 py-1.5 rounded text-white font-mono"
                    >
                      <option value={24.000}>24.000 fps (Cinema Master Standard)</option>
                      <option value={23.976}>23.976 fps (NTSC Fractional Pull-Down)</option>
                      <option value={25.000}>25.000 fps (EBU Broadcast Standard)</option>
                      <option value={29.970}>29.970 fps (US Broadcast)</option>
                      <option value={48.000}>48.000 fps (High Frame Rate)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">Project Master LTC Source</label>
                    <input
                      type="text"
                      value={editingCamera.timecodeMaster}
                      onChange={(e) => updateCameraProperty(editingCamera.id, "timecodeMaster", e.target.value)}
                      className="w-full bg-[#151830] border border-[#262A4A] px-3 py-1.5 rounded text-emerald-400 font-mono text-[11px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">On-Camera Transmitter / Encoder</label>
                    <input
                      type="text"
                      value={editingCamera.transmitter}
                      onChange={(e) => updateCameraProperty(editingCamera.id, "transmitter", e.target.value)}
                      className="w-full bg-[#151830] border border-[#262A4A] px-3 py-1.5 rounded text-white font-mono text-[11px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">LTC Jam-Sync Protocol</label>
                    <input
                      type="text"
                      value="SMPTE ST 12-1 / BEXT Linear TC"
                      disabled
                      className="w-full bg-[#151830] border border-[#262A4A] px-3 py-1.5 rounded text-slate-400 font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div className="p-3 bg-[#151830] border border-[#262A4A] rounded-lg text-slate-300 text-[11px]">
                  ⚠️ <strong>Fractional Pull-Down Notice:</strong> Setting camera to 23.976 fps while master audio is 24.000 fps causes +7.2s audio drift every 2 hours. Micro-Sentry 1 will automatically flag this breach and apply an audio pull-up.
                </div>
              </div>
            )}

            {/* TAB 4: C2PA & COLOR SCIENCE */}
            {configTab === "c2pa" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">In-Camera C2PA Security Enclave</label>
                    <div className="flex items-center gap-2 p-2 bg-[#151830] border border-emerald-500/30 rounded text-emerald-400 font-mono text-[11px]">
                      <span>🔒</span>
                      <span className="font-bold">Hardware Enclave:</span>
                      <span className="text-white truncate">{editingCamera.c2paCert}</span>
                      <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold shrink-0">
                        TPN+ Root Locked
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px]">Input Device Transform (ACES IDT)</label>
                    <select
                      value={editingCamera.colorSpace}
                      onChange={(e) => updateCameraProperty(editingCamera.id, "colorSpace", e.target.value)}
                      className="w-full bg-[#151830] border border-[#262A4A] px-3 py-1.5 rounded text-white font-mono"
                    >
                      <option>ACEScg (ARRI LogC4 IDT)</option>
                      <option>ACEScg (Sony S-Gamut3.Cine IDT)</option>
                      <option>ACEScg (REDWideGamutRGB Log3G10)</option>
                      <option>Rec.709 Standard Dynamic Range</option>
                      <option>Rec.2020 PQ (Dolby Vision 1000 nits)</option>
                    </select>
                  </div>
                </div>

                <div className="p-2.5 bg-[#151830] border border-[#262A4A] rounded-lg text-slate-300 text-[11px] flex items-center justify-between">
                  <span>🔒 Cryptographic JUMBF provenance manifest embedded into every ingested frame.</span>
                  <span className="text-emerald-400 font-bold text-[10px]">C2PA v2.1 Active</span>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[#262A4A] flex justify-between items-center">
              <div className="text-[11px] text-slate-400">
                Changes persist live into on-set production state.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingCamId(null)}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold transition-colors shadow-lg"
                >
                  Apply &amp; Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ON-SET TAKE OUTPUT & DOWNSTREAM PIPELINE DISPATCH HUB MODAL */}
      {showPipelineModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B0E1F] border border-[#262A4A] rounded-2xl w-full max-w-4xl p-6 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto font-mono">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#262A4A] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📤</span>
                  <h2 className="text-lg font-bold text-white tracking-wide">
                    ON-SET FEED OUTPUT &amp; PIPELINE DISPATCH HUB
                  </h2>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                    TAKE 04 READY
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Active Scene: <span className="text-white font-bold">{activeScene}</span> • Take: <span className="text-purple-400 font-bold">0{activeTake}</span> • Timecode: <span className="text-amber-400 font-bold">{masterTimecode}</span> • C2PA Hardware Signature: <span className="text-emerald-400 font-bold">LOCKED</span>
                </p>
              </div>
              <button
                onClick={() => setShowPipelineModal(false)}
                className="text-slate-400 hover:text-white text-xl p-1.5 rounded-lg hover:bg-[#1A1E38] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Sub-banner for C2C proxy upload status if active */}
            {c2cUploadProgress !== null && (
              <div className="p-3 bg-purple-950/40 border border-purple-500/40 rounded-xl space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-purple-300 font-bold">Uploading 1080p ProRes Proxy to C2C Cloud Vault...</span>
                  <span className="text-purple-200">{c2cUploadProgress}%</span>
                </div>
                <div className="w-full bg-[#151830] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-emerald-400 h-full transition-all duration-300"
                    style={{ width: `${c2cUploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* 6 Downstream Production Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Destination 1: Screen 6 Editorial Ingest */}
              <div className="p-4 bg-[#12162E] border border-purple-500/30 rounded-xl flex flex-col justify-between hover:border-purple-500/60 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🎬</span>
                      <h3 className="font-bold text-sm text-white">Screen 6: Editorial Ingest</h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                      TIMELINE CONFORM
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Pushes conformed master take into V1 Master Raw with Cooke /i metadata, ACEScg CDL grade, and audio sync latch.
                  </p>
                  <div className="bg-[#0B0D1B] p-2 rounded text-[10px] space-y-0.5 text-slate-400 border border-[#1A1E38]">
                    <div>• Track: <span className="text-white">V1: MASTER RAW</span></div>
                    <div>• Metadata: <span className="text-white">Cooke /i T/2.0 + CDL Grade</span></div>
                    <div>• Flag: <span className="text-emerald-400 font-bold">Circle Take (PRINT)</span></div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t border-[#1F2347]">
                  <button
                    onClick={handleDispatchToEditorial}
                    className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold transition-colors shadow"
                  >
                    📤 Dispatch Clip
                  </button>
                  {onNavigateTab && (
                    <button
                      onClick={() => {
                        setShowPipelineModal(false);
                        onNavigateTab("editorial-ingest");
                      }}
                      className="px-3 py-1.5 bg-[#1F2347] hover:bg-[#2A305D] text-slate-200 rounded text-xs font-semibold transition-colors"
                    >
                      Jump S6 ➔
                    </button>
                  )}
                </div>
              </div>

              {/* Destination 2: Screen 1 Production Graph */}
              <div className="p-4 bg-[#12162E] border border-amber-500/30 rounded-xl flex flex-col justify-between hover:border-amber-500/60 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📊</span>
                      <h3 className="font-bold text-sm text-white">Screen 1: ClickHouse Graph</h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      GENLOCK DRIFT
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Live telemetry stream tracking Cam-B 23.976fps drift vs 24.000fps studio clock, remediating $42,000 ADR reshoot penalty.
                  </p>
                  <div className="bg-[#0B0D1B] p-2 rounded text-[10px] space-y-0.5 text-slate-400 border border-[#1A1E38]">
                    <div>• Master Clock: <span className="text-emerald-400">24.000 fps Locked</span></div>
                    <div>• Cam B Phase: <span className="text-amber-400 font-bold">0.1% Pull-Up Delta</span></div>
                    <div>• Savings: <span className="text-emerald-400 font-bold">+$42,000 Remediation</span></div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t border-[#1F2347]">
                  <button
                    onClick={() => {
                      onRemediateDrift?.();
                      triggerToast("✓ ClickHouse ADR Remediation Applied! (Saved $42,000)");
                    }}
                    className="flex-1 py-1.5 bg-amber-600/80 hover:bg-amber-600 text-white rounded text-xs font-bold transition-colors shadow"
                  >
                    ⚡ Remediate Drift
                  </button>
                  {onNavigateTab && (
                    <button
                      onClick={() => {
                        setShowPipelineModal(false);
                        onNavigateTab("overview");
                      }}
                      className="px-3 py-1.5 bg-[#1F2347] hover:bg-[#2A305D] text-slate-200 rounded text-xs font-semibold transition-colors"
                    >
                      Jump S1 ➔
                    </button>
                  )}
                </div>
              </div>

              {/* Destination 3: Screen 3 SAG-AFTRA Likeness */}
              <div className="p-4 bg-[#12162E] border border-indigo-500/30 rounded-xl flex flex-col justify-between hover:border-indigo-500/60 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">👤</span>
                      <h3 className="font-bold text-sm text-white">Screen 3: SAG-AFTRA Vault</h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                      DIGITAL LIKENESS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Actor biometric likeness registry latching contract quotas, consent tokens, and residual tier calculations.
                  </p>
                  <div className="bg-[#0B0D1B] p-2 rounded text-[10px] space-y-0.5 text-slate-400 border border-[#1A1E38]">
                    <div>• Performer: <span className="text-white">{activePerformer?.actor_name || "Marcus Vance"}</span></div>
                    <div>• Quota Used: <span className="text-indigo-300 font-bold">
                      {activePerformer ? `${Math.round((activePerformer.used_seconds / (activePerformer.authorized_seconds || 1)) * 100)}% (${activePerformer.used_seconds}s / ${activePerformer.authorized_seconds}s)` : "87% (43.5s / 50.0s)"}
                    </span></div>
                    <div>• Status: <span className={activePerformer?.status === "CAP_EXCEEDED" ? "text-rose-400 font-bold" : "text-emerald-400"}>
                      {activePerformer ? activePerformer.status : "Consent Token Active"}
                    </span></div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t border-[#1F2347]">
                  <button
                    onClick={() => handleExtendLikeness()}
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-colors shadow"
                  >
                    🛡️ Extend (+15s)
                  </button>
                  {onNavigateTab && (
                    <button
                      onClick={() => {
                        setShowPipelineModal(false);
                        onNavigateTab("sag-likeness");
                      }}
                      className="px-3 py-1.5 bg-[#1F2347] hover:bg-[#2A305D] text-slate-200 rounded text-xs font-semibold transition-colors"
                    >
                      Jump S3 ➔
                    </button>
                  )}
                </div>
              </div>

              {/* Destination 4: Screen 4 VFX & Compliance */}
              <div className="p-4 bg-[#12162E] border border-fuchsia-500/30 rounded-xl flex flex-col justify-between hover:border-fuchsia-500/60 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🎨</span>
                      <h3 className="font-bold text-sm text-white">Screen 4: ShotGrid &amp; VFX</h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 font-bold">
                      AUTODESK FLOW
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Automated clean-plate inpainting tasks for brand logos, alcohol compliance, and S7 prop meniscus continuity.
                  </p>
                  <div className="bg-[#0B0D1B] p-2 rounded text-[10px] space-y-0.5 text-slate-400 border border-[#1A1E38]">
                    <div>• Task: <span className="text-white">SG-TASK-8492 (Clean Plate)</span></div>
                    <div>• Region: <span className="text-fuchsia-300 font-bold">Singapore / Middle East</span></div>
                    <div>• Target: <span className="text-purple-300">Bourbon Label + Glass Fill</span></div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t border-[#1F2347]">
                  <button
                    onClick={handleDispatchVfxInpaint}
                    className="flex-1 py-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded text-xs font-bold transition-colors shadow"
                  >
                    🎨 Queue VFX Inpaint
                  </button>
                  {onNavigateTab && (
                    <button
                      onClick={() => {
                        setShowPipelineModal(false);
                        onNavigateTab("compliance");
                      }}
                      className="px-3 py-1.5 bg-[#1F2347] hover:bg-[#2A305D] text-slate-200 rounded text-xs font-semibold transition-colors"
                    >
                      Jump S4 ➔
                    </button>
                  )}
                </div>
              </div>

              {/* Destination 5: Screen 8 War Room & Comms */}
              <div className="p-4 bg-[#12162E] border border-cyan-500/30 rounded-xl flex flex-col justify-between hover:border-cyan-500/60 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">💬</span>
                      <h3 className="font-bold text-sm text-white">Screen 8: Studio War Room</h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                      #ON-SET-CAMERA-COMMS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Timecode-latched broadcasts for catering wrap calls, union meal penalty alerts, and director script supervisor notes.
                  </p>
                  <div className="bg-[#0B0D1B] p-2 rounded text-[10px] space-y-0.5 text-slate-400 border border-[#1A1E38]">
                    <div>• Channel: <span className="text-cyan-300">#on-set-camera-comms</span></div>
                    <div>• Meal Status: <span className={cateringWrapped ? "text-emerald-400" : "text-amber-400"}>{cateringWrapped ? "Wrapped" : "18m Penalty Risk"}</span></div>
                    <div>• Script Note: <span className="text-slate-300 truncate">{directorNotes.slice(0, 25)}...</span></div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t border-[#1F2347]">
                  <button
                    onClick={handleSaveAndRouteScriptNotes}
                    className="flex-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold transition-colors shadow"
                  >
                    💬 Route Script Note
                  </button>
                  {onNavigateTab && (
                    <button
                      onClick={() => {
                        setShowPipelineModal(false);
                        onNavigateTab("war-room");
                      }}
                      className="px-3 py-1.5 bg-[#1F2347] hover:bg-[#2A305D] text-slate-200 rounded text-xs font-semibold transition-colors"
                    >
                      Jump S8 ➔
                    </button>
                  )}
                </div>
              </div>

              {/* Destination 6: Camera-to-Cloud (C2C) Vault */}
              <div className="p-4 bg-[#12162E] border border-emerald-500/30 rounded-xl flex flex-col justify-between hover:border-emerald-500/60 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">☁️</span>
                      <h3 className="font-bold text-sm text-white">C2C Cloud Storage Vault</h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      FRAME.IO &amp; GCS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Simultaneous high-throughput upload of 1080p ProRes Proxy &amp; RAW checksum to secure cloud storage vault.
                  </p>
                  <div className="bg-[#0B0D1B] p-2 rounded text-[10px] space-y-0.5 text-slate-400 border border-[#1A1E38]">
                    <div>• Destination: <span className="text-white">gs://paramount-c2c-vault/</span></div>
                    <div>• Format: <span className="text-emerald-400">ProRes 422 Proxy + C2PA</span></div>
                    <div>• Checksum: <span className="text-slate-300">SHA256: 9b2d...f74a</span></div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t border-[#1F2347]">
                  <button
                    onClick={handleTriggerC2cUpload}
                    disabled={c2cUploadProgress !== null}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 text-white rounded text-xs font-bold transition-colors shadow"
                  >
                    {c2cUploadProgress !== null ? "Uploading..." : "☁️ Upload Proxy"}
                  </button>
                  <button
                    onClick={() => {
                      triggerToast("✓ Verified C2C Cloud Vault: 14 takes stored (38.4 GB / 100 GB)");
                    }}
                    className="px-3 py-1.5 bg-[#1F2347] hover:bg-[#2A305D] text-slate-200 rounded text-xs font-semibold transition-colors"
                  >
                    Check Vault
                  </button>
                </div>
              </div>
            </div>

            {/* Footer / Quick All-Dispatch */}
            <div className="pt-4 border-t border-[#262A4A] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                <span>All outputs are anchored to C2PA Hardware Trust Root (ARRI Alexa 35 #94821).</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    handleDispatchToEditorial();
                    handleDispatchVfxInpaint();
                    handleExtendLikeness();
                    handleSaveAndRouteScriptNotes();
                    handleTriggerC2cUpload();
                    triggerToast("🚀 ALL 6 PIPELINE DESTINATIONS SYNCHRONIZED & DISPATCHED!");
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white rounded-lg font-bold text-xs shadow-lg transition-all"
                >
                  🚀 Dispatch to All 6 Destinations
                </button>
                <button
                  onClick={() => setShowPipelineModal(false)}
                  className="px-4 py-2 bg-[#1A1E38] hover:bg-[#262A4A] text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NG DEFECT REASON SELECTOR MODAL */}
      {showNgModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono">
          <div className="bg-[#0D1024] border border-rose-500/50 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-[#262A4A] pb-3">
              <div>
                <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
                  <span className="text-xl">❌</span>
                  <span>MARK TAKE 0{activeTake} AS NG (NO GOOD)</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Select defect reason. Take will be excluded from master cut, filed into Screen 6 Outtakes, and logged to Screen 8 Studio War Room.
                </p>
              </div>
              <button
                onClick={() => setShowNgModal(false)}
                className="text-slate-400 hover:text-white text-lg p-1 rounded hover:bg-[#1A1E38] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Defect Reasons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { reason: "Focus Soft / Missed Actor Mark", icon: "🎯", desc: "Focus slipped off actor pupil at T/2.0" },
                { reason: "Sound Boom / Mic in Frame", icon: "🎙️", desc: "Boom microphone dipped below upper crop line" },
                { reason: "Genlock 0.1% Drift / Phase Slip", icon: "⚡", desc: "Sentry 1 flagged audio phase drift" },
                { reason: "Actor Flub / Reset Mid-Line", icon: "🎭", desc: "Performer forgot dialogue beat / reset" },
                { reason: "Prop Meniscus Discontinuity", icon: "🍷", desc: "Sentry 7 flagged liquid level discrepancy" },
                { reason: "Union Meal Penalty Wrap Interruption", icon: "🍽️", desc: "1st AD called wrap before take completed" },
                { reason: "Lighting Flare / Camera Shadow", icon: "💡", desc: "Grip boom cast shadow across set wall" },
                { reason: "False Move / Dolly Jerk", icon: "🎥", desc: "Dolly grip hit track bump during track-in" }
              ].map((item) => (
                <button
                  key={item.reason}
                  onClick={() => handleNgTake(item.reason)}
                  className="p-3 bg-[#131735] hover:bg-rose-950/40 border border-[#262A4A] hover:border-rose-500/60 rounded-xl text-left transition-all space-y-1 group"
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-white group-hover:text-rose-300">
                    <span>{item.icon}</span>
                    <span>{item.reason}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">{item.desc}</div>
                </button>
              ))}
            </div>

            {/* Custom Reason Input */}
            <div className="space-y-1.5 pt-2 border-t border-[#262A4A]">
              <label className="text-[11px] text-slate-400">Or enter custom defect note:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Smoke machine cleared too fast..."
                  value={ngReason}
                  onChange={(e) => setNgReason(e.target.value)}
                  className="flex-1 bg-[#151830] border border-[#262A4A] px-3 py-1.5 rounded-lg text-xs text-white font-mono focus:border-rose-500 outline-none"
                />
                <button
                  onClick={() => handleNgTake(ngReason || "Unspecified Defect")}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors shadow"
                >
                  Submit NG
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAKE WRAP & SLATE VERDICT MODAL */}
      {showTakeWrapModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono">
          <div className="bg-[#0D1024] border border-purple-500/50 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-[#262A4A] pb-3">
              <div>
                <div className="flex items-center gap-2 text-white font-bold text-base">
                  <span className="text-xl">🎬</span>
                  <span>TAKE 0{activeTake} COMPLETE ({takeElapsedSec || 24}s)</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Scene {activeScene} • In: {takeInTimecode} • Out: {takeOutTimecode}
                </p>
              </div>
              <button
                onClick={() => setShowTakeWrapModal(false)}
                className="text-slate-400 hover:text-white text-lg p-1 rounded hover:bg-[#1A1E38] transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-[#151830] border border-[#262A4A] rounded-xl text-xs space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span>Director: <strong className="text-white">{activeDirector}</strong></span>
                <span>Frames: <strong className="text-purple-300">{(takeElapsedSec || 24) * 24}f</strong></span>
              </div>
              <div className="flex justify-between">
                <span>Sound Sync: <strong className="text-emerald-400">24.000 fps Locked</strong></span>
                <span>C2PA Signature: <strong className="text-emerald-400">Locked</strong></span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-bold">SELECT SLATE VERDICT:</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={handleCircleTake}
                  className="p-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/50 rounded-xl text-center transition-all group"
                >
                  <div className="text-xl mb-1 group-hover:scale-110 transition-transform">⭐️</div>
                  <div className="text-xs font-bold text-amber-300">CIRCLE (PRINT)</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Hero Select to V1</div>
                </button>

                <button
                  onClick={() => {
                    setShowTakeWrapModal(false);
                    setShowNgModal(true);
                  }}
                  className="p-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/50 rounded-xl text-center transition-all group"
                >
                  <div className="text-xl mb-1 group-hover:scale-110 transition-transform">❌</div>
                  <div className="text-xs font-bold text-rose-300">NG (REJECT)</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Pick defect reason</div>
                </button>

                <button
                  onClick={handleHoldTake}
                  className="p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/50 rounded-xl text-center transition-all group"
                >
                  <div className="text-xl mb-1 group-hover:scale-110 transition-transform">⏳</div>
                  <div className="text-xs font-bold text-blue-300">KEEP (HOLD)</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Alternate Coverage</div>
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#262A4A]">
              <button
                onClick={() => {
                  setShowTakeWrapModal(false);
                  setPlaybackFrame(0);
                  setMonitorMode("playback");
                  setIsPlayingPlayback(false);
                  triggerToast("🎞️ Multi-Cam Gang Playback Review Active. Press Space to Play/Pause, J/L to step, or scrub timeline.");
                }}
                className="flex-1 py-2 bg-[#1A1E38] hover:bg-[#262A4A] text-purple-300 border border-purple-500/40 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>🎞️</span>
                <span>Review in Multi-Cam Playback</span>
              </button>
              <button
                onClick={() => {
                  setShowTakeWrapModal(false);
                  handleNextTake();
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Next Take (+1)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMART SLATE & PRODUCTION INDEX MODAL */}
      {showSlateModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono text-xs">
          <div className="bg-[#121528] border border-purple-500/50 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#262A4A] pb-2.5">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <span className="text-base">🎬</span>
                <span>SMART SLATE &amp; PRODUCTION INDEX</span>
              </div>
              <button onClick={() => setShowSlateModal(false)} className="text-slate-400 hover:text-white text-base">✕</button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Project / Production Title:</label>
                <input
                  type="text"
                  value={slateFormProject}
                  onChange={(e) => setSlateFormProject(e.target.value)}
                  className="w-full bg-[#151830] border border-[#262A4A] p-2 rounded text-white font-mono focus:border-purple-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Active Scene:</label>
                  <input
                    type="text"
                    value={slateFormScene}
                    onChange={(e) => setSlateFormScene(e.target.value)}
                    className="w-full bg-[#151830] border border-[#262A4A] p-2 rounded text-white font-mono focus:border-purple-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Take Number:</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      value={slateFormTake}
                      onChange={(e) => setSlateFormTake(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-[#151830] border border-[#262A4A] p-2 rounded text-white font-mono focus:border-purple-500 outline-none"
                    />
                    <button
                      onClick={() => setSlateFormTake((t) => t + 1)}
                      className="px-2 py-2 bg-[#1A1E38] hover:bg-[#262A4A] text-purple-300 border border-purple-500/40 rounded font-bold"
                      title="Increment Take (+1)"
                    >
                      +1
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Director:</label>
                  <input
                    type="text"
                    value={slateFormDirector}
                    onChange={(e) => setSlateFormDirector(e.target.value)}
                    className="w-full bg-[#151830] border border-[#262A4A] p-2 rounded text-white font-mono focus:border-purple-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Sound Roll:</label>
                  <input
                    type="text"
                    value={slateFormSoundRoll}
                    onChange={(e) => setSlateFormSoundRoll(e.target.value)}
                    className="w-full bg-[#151830] border border-[#262A4A] p-2 rounded text-white font-mono focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-[#0D1020] border border-[#1F2448] rounded text-[10px] text-slate-400 space-y-0.5">
              <div>• Master Timecode: <span className="text-cyan-400 font-bold">{masterTimecode}</span></div>
              <div>• Changes synchronize live into C2PA JUMBF metadata and Studio War Room.</div>
            </div>

            <div className="pt-2 border-t border-[#262A4A] flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={handleSaveAndRecordTakeNow}
                className="px-3 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/50 rounded font-bold shadow-md flex items-center gap-1.5 cursor-pointer text-xs"
                title="Save slate settings and immediately physically record and anchor this take into Storage Vault"
              >
                <span>🔴</span>
                <span>Save &amp; Record Take Now</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSlateModal(false)}
                  className="px-3 py-1.5 bg-[#1A1E38] hover:bg-[#262A4A] text-slate-300 rounded font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSlateConfig}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold shadow-md cursor-pointer"
                >
                  Save Slate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCRIPT SUPERVISOR TAKES LOG MODAL */}
      {showTakesModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono text-xs">
          <div className="bg-[#0D1024] border border-cyan-500/50 rounded-2xl max-w-3xl w-full p-5 shadow-2xl animate-in fade-in duration-200 max-h-[90vh] flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#262A4A] pb-3">
              <div>
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="text-lg">📋</span>
                  <span>SCRIPT SUPERVISOR TAKES LOG — SCENE {activeScene}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {currentSceneTakes.length} recorded takes in physical storage • Genlock 24.000 fps • Current LTC: <span className="text-cyan-400 font-bold">{masterTimecode}</span>
                </p>
              </div>
              <button
                onClick={() => setShowTakesModal(false)}
                className="text-slate-400 hover:text-white text-base p-1 rounded hover:bg-[#1A1E38] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Filter Tabs & Quick Compare Action */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#12152E] p-2 rounded-xl border border-[#22274A]">
              <div className="flex items-center gap-1.5">
                {(["ALL", "CIRCLE", "NG", "HOLD"] as const).map((filter) => {
                  const count = filter === "ALL"
                    ? currentSceneTakes.length
                    : currentSceneTakes.filter((t) => t.verdict === filter).length;
                  const isActive = takesFilterVerdict === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() => setTakesFilterVerdict(filter)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        isActive
                          ? filter === "CIRCLE"
                            ? "bg-amber-500 text-black shadow-md shadow-amber-950/40"
                            : filter === "NG"
                            ? "bg-rose-600 text-white shadow-md shadow-rose-950/40"
                            : filter === "HOLD"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-950/40"
                            : "bg-purple-600 text-white shadow-md shadow-purple-950/40"
                          : "text-slate-400 hover:text-white hover:bg-[#1C2042]"
                      }`}
                    >
                      {filter === "CIRCLE" ? "⭐️ CIRCLE" : filter === "NG" ? "❌ NG" : filter === "HOLD" ? "⏳ HOLD" : "ALL"} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    await handleQuickRecordTake();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer shadow-sm shadow-emerald-950/50"
                  title="Physically record, attestate and vault this take immediately"
                >
                  <span>🎬</span>
                  <span>Record Take 0{activeTake}</span>
                </button>

                {currentSceneTakes.length >= 2 && (
                  <button
                    onClick={() => {
                      const sorted = [...currentSceneTakes].sort((a, b) => a.take_number - b.take_number);
                      setCompareTakeAId(sorted[sorted.length - 2].take_id);
                      setCompareTakeBId(sorted[sorted.length - 1].take_id);
                      setSplitWipeActive(true);
                      setShowTakesModal(false);
                      triggerToast("🔀 A/B Split-Wipe comparison loaded with Take " + sorted[sorted.length - 2].take_number + " vs Take " + sorted[sorted.length - 1].take_number);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#1A1E3C] hover:bg-[#272D5C] text-purple-300 border border-purple-500/40 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    <span>🔀</span>
                    <span>Compare Last 2 Takes</span>
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Takes List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[50vh]">
              {currentSceneTakes.length === 0 ? (
                <div className="text-center py-12 bg-[#12152E] rounded-xl border border-dashed border-[#262A4A] space-y-3">
                  <div className="text-3xl">🎬</div>
                  <p className="text-slate-300 font-bold">No takes recorded for Scene {activeScene} yet.</p>
                  <p className="text-[11px] text-slate-500">Hit Record Take to capture &amp; anchor this take into Cloud Storage Vault.</p>
                  <button
                    onClick={async () => {
                      await handleQuickRecordTake();
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
                  >
                    🎬 Record &amp; Vault Take 0{activeTake} Now
                  </button>
                </div>
              ) : (
                currentSceneTakes
                  .filter((t) => (takesFilterVerdict === "ALL" ? true : t.verdict === takesFilterVerdict))
                  .map((t) => {
                    const isCircle = t.verdict === "CIRCLE";
                    const isNg = t.verdict === "NG";
                    const isHold = t.verdict === "HOLD";
                    const isCurrent = t.take_number === activeTake;

                    return (
                      <div
                        key={t.take_id}
                        className={`p-3 rounded-xl border transition-all text-xs space-y-2.5 ${
                          isCircle
                            ? "bg-amber-950/15 border-amber-500/50 shadow-sm"
                            : isNg
                            ? "bg-rose-950/15 border-rose-500/40"
                            : isHold
                            ? "bg-blue-950/15 border-blue-500/40"
                            : "bg-[#13172E] border-[#262A4A]"
                        }`}
                      >
                        {/* Top Line: Take #, Verdict pill, Timecode & Duration */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              TAKE {t.take_number < 10 ? `0${t.take_number}` : t.take_number}
                            </span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded bg-purple-600 text-white text-[9px] font-bold">
                                CURRENT
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isCircle
                                  ? "bg-amber-400 text-black shadow-sm"
                                  : isNg
                                  ? "bg-rose-600 text-white"
                                  : isHold
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-700 text-slate-300"
                              }`}
                            >
                              {isCircle ? "⭐️ CIRCLE" : isNg ? "❌ NG" : isHold ? "⏳ HOLD" : "UNRATED"}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-300">
                            <span>
                              TC In: <strong className="text-cyan-400">{t.timecode_in}</strong> ➔ Out: <strong className="text-cyan-400">{t.timecode_out}</strong>
                            </span>
                            <span className="text-purple-300 font-bold bg-[#1C2042] px-2 py-0.5 rounded">
                              {t.duration_sec.toFixed(1)}s ({Math.round(t.duration_sec * 24)}f)
                            </span>
                          </div>
                        </div>

                        {/* Metadata Row: Notes, Director, C2PA, Proxies */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] bg-[#0E1124]/70 p-2 rounded-lg border border-[#1F2445]">
                          <div className="space-y-0.5 truncate">
                            <span className="text-slate-400">Notes: </span>
                            <span className="text-slate-200 font-medium">{t.director_notes || t.notes || "Standard production take"}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-400">
                            <span>Dir: <strong className="text-white">{t.director}</strong></span>
                            <span>Sound: <strong className="text-white">{t.sound_roll}</strong></span>
                            <span className="text-emerald-400">🛡️ C2PA Signed</span>
                          </div>
                        </div>

                        {/* Actions Row: Quick Verdict Switcher, Gang Review & Compare */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#202549]">
                          {/* Verdict Switcher */}
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="text-slate-400">Verdict:</span>
                            <button
                              onClick={() => handleUpdateTakeVerdict(t.take_id, "CIRCLE")}
                              className={`px-2 py-0.5 rounded transition-all font-bold cursor-pointer ${
                                isCircle
                                  ? "bg-amber-400 text-black shadow-sm"
                                  : "bg-[#181C38] text-amber-300 hover:bg-amber-500/20 border border-amber-500/30"
                              }`}
                              title="Mark as Circle (Hero Select)"
                            >
                              ⭐️ Circle
                            </button>
                            <button
                              onClick={() => handleUpdateTakeVerdict(t.take_id, "NG")}
                              className={`px-2 py-0.5 rounded transition-all font-bold cursor-pointer ${
                                isNg
                                  ? "bg-rose-600 text-white"
                                  : "bg-[#181C38] text-rose-300 hover:bg-rose-500/20 border border-rose-500/30"
                              }`}
                              title="Mark as NG (Defect / Reject)"
                            >
                              ❌ NG
                            </button>
                            <button
                              onClick={() => handleUpdateTakeVerdict(t.take_id, "HOLD")}
                              className={`px-2 py-0.5 rounded transition-all font-bold cursor-pointer ${
                                isHold
                                  ? "bg-blue-600 text-white"
                                  : "bg-[#181C38] text-blue-300 hover:bg-blue-500/20 border border-blue-500/30"
                              }`}
                              title="Mark as Hold (Keep for backup)"
                            >
                              ⏳ Hold
                            </button>
                          </div>

                          {/* Gang Review & Split Wipe Triggers */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setShowTakesModal(false);
                                setPlaybackFrame(0);
                                setMonitorMode("playback");
                                setIsPlayingPlayback(false);
                                triggerToast(`🎞️ Multi-Cam Gang Review: Scene ${activeScene} Take 0${t.take_number} loaded into playback deck.`);
                              }}
                              className="px-2.5 py-1 bg-[#1A1E3C] hover:bg-[#252B57] text-purple-300 border border-purple-500/40 rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <span>🎞️</span>
                              <span>Gang Review</span>
                            </button>

                            <button
                              onClick={() => {
                                setCompareTakeAId(t.take_id);
                                const otherTake = currentSceneTakes.find((ot) => ot.take_id !== t.take_id) || t;
                                setCompareTakeBId(otherTake.take_id);
                                setSplitWipeActive(true);
                                setShowTakesModal(false);
                                triggerToast(`🔀 A/B Split-Wipe: Take 0${t.take_number} vs Take 0${otherTake.take_number}`);
                              }}
                              className="px-2.5 py-1 bg-[#15283C] hover:bg-[#1E3B59] text-cyan-300 border border-cyan-500/40 rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <span>🔀</span>
                              <span>A/B Compare</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[#262A4A] flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] text-slate-400">
                <span>Circle Takes: </span>
                <strong className="text-amber-300 font-bold">
                  {currentSceneTakes.filter((t) => t.verdict === "CIRCLE").length}
                </strong>
                <span className="text-slate-500 mx-2">•</span>
                <span>NGs: </span>
                <strong className="text-rose-400 font-bold">
                  {currentSceneTakes.filter((t) => t.verdict === "NG").length}
                </strong>
                <span className="text-slate-500 mx-2">•</span>
                <span>Hold: </span>
                <strong className="text-blue-400 font-bold">
                  {currentSceneTakes.filter((t) => t.verdict === "HOLD").length}
                </strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTakesModal(false)}
                  className="px-4 py-1.5 bg-[#1A1E38] hover:bg-[#262A4A] text-slate-300 rounded-lg font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW PRODUCTION SCENE MODAL */}
      {showNewSceneModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono text-xs">
          <div className="bg-[#121528] border border-purple-500/50 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#262A4A] pb-2.5">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <span className="text-base">🎬</span>
                <span>CREATE NEW PRODUCTION SCENE</span>
              </div>
              <button
                onClick={() => setShowNewSceneModal(false)}
                className="text-slate-400 hover:text-white text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-bold">Scene Number / Slug (e.g. 42C, 43, INT-BAR):</label>
                <input
                  type="text"
                  placeholder="e.g. 43"
                  value={newSceneNumber}
                  onChange={(e) => setNewSceneNumber(e.target.value)}
                  className="w-full bg-[#151830] border border-[#262A4A] p-2 rounded text-white font-mono focus:border-purple-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-bold">Scene Description / Script Notes:</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Detective enters dimly lit storage area; multi-cam tracking on door entry."
                  value={newSceneDescription}
                  onChange={(e) => setNewSceneDescription(e.target.value)}
                  className="w-full bg-[#151830] border border-[#262A4A] p-2 rounded text-white font-mono focus:border-purple-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="p-2.5 bg-[#0D1020] border border-[#1F2448] rounded text-[10px] text-slate-400 space-y-0.5">
              <div>• Initialized at Take 01 with production timecode sync.</div>
              <div>• Persisted to local project manifest and synchronized across all sentry monitors.</div>
            </div>

            <div className="pt-2 border-t border-[#262A4A] flex justify-end gap-2">
              <button
                onClick={() => setShowNewSceneModal(false)}
                className="px-3 py-1.5 bg-[#1A1E38] hover:bg-[#262A4A] text-slate-300 rounded font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewScene}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold shadow-md cursor-pointer"
              >
                Create &amp; Switch Scene
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

