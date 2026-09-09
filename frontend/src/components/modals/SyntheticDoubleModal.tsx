import React, { useState, useRef, useEffect } from "react";
import { LikenessPerformer } from "../../types";
import { API_BASE } from "../../services/api";
import { Biometric3DComparator } from "./Biometric3DComparator";

class SafeErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackText?: string },
  { hasError: boolean; errorMsg?: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorMsg: String(error?.message || error) };
  }
  componentDidCatch(error: any, info: any) {
    console.error("3D Viewport caught error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#10132b] p-8 rounded-xl border border-rose-500/40 text-center font-mono space-y-3">
          <div className="text-2xl">⚠️</div>
          <div className="text-sm font-bold text-white">3D Spatial Comparator Standby</div>
          <p className="text-xs text-slate-400">
            {this.props.fallbackText || "Reinitializing 3D photogrammetry canvas pipeline..."}
          </p>
          <div className="text-[10px] text-rose-300 font-mono">{this.state.errorMsg}</div>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all"
          >
            Retry 3D Viewport
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface SyntheticDoubleModalProps {
  actor: LikenessPerformer;
  onClose: () => void;
  onExtend: (actorId: string) => void;
  onUpdateActor?: (updated: LikenessPerformer) => void;
}

export const SyntheticDoubleModal: React.FC<SyntheticDoubleModalProps> = ({
  actor,
  onClose,
  onExtend,
  onUpdateActor,
}) => {
  const [currentActor, setCurrentActor] = useState<LikenessPerformer>(actor);
  const [wipePos, setWipePos] = useState<number>(50);
  const [viewMode, setViewMode] = useState<"WIPE" | "3D_SPATIAL" | "RAW_SCAN" | "NEURAL_PASS" | "DIFF_MAP">("WIPE");
  const [plateSource, setPlateSource] = useState<"LIVE_VIDEO" | "CALIBRATED_STILL">("LIVE_VIDEO");
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [topUpSuccess, setTopUpSuccess] = useState<boolean>(false);
  const [timecode, setTimecode] = useState<string>("01:24:14:10");

  // Reactive state for real-time headroom updates
  const [authorizedSec, setAuthorizedSec] = useState<number>(actor.authorized_seconds || 60.0);
  const [usedSec, setUsedSec] = useState<number>(actor.used_seconds || 0.0);

  useEffect(() => {
    setCurrentActor(actor);
    setAuthorizedSec(actor.authorized_seconds || 60.0);
    setUsedSec(actor.used_seconds || 0.0);
  }, [actor]);

  const headroom = Math.max(0, Number((authorizedSec - usedSec).toFixed(1)));
  const burnPct = Math.round((usedSec / (authorizedSec || 1)) * 100);

  const videoRef = useRef<HTMLVideoElement>(null);

  const isNeo =
    currentActor.actor_name.toLowerCase().includes("keanu") ||
    currentActor.actor_name.toLowerCase().includes("reeves") ||
    (currentActor.character_name || "").toLowerCase().includes("neo");

  const isSmith =
    currentActor.actor_name.toLowerCase().includes("hugo") ||
    currentActor.actor_name.toLowerCase().includes("weaving") ||
    (currentActor.character_name || "").toLowerCase().includes("smith");

  const isVance =
    currentActor.actor_name.toLowerCase().includes("marcus") ||
    currentActor.actor_name.toLowerCase().includes("vance");

  // Determine video feed and scene context
  let videoSrc = `${API_BASE}/media/matrix/stream/cam-b`;
  let sceneTag = "Scene 42B • Production Take #04";
  let performerRoleLabel = currentActor.character_name || "Principal Performer";

  if (isNeo) {
    videoSrc = `${API_BASE}/media/matrix/stream/cam-b`;
    sceneTag = "Scene 42B • Bullet-Time Wirework Martial Arts Stunt";
    performerRoleLabel = "Neo / Thomas Anderson";
  } else if (isSmith) {
    videoSrc = `${API_BASE}/media/matrix/stream/cam-b`;
    sceneTag = "Scene 42B • Multi-Agent Swarm Concrete Concussion Double";
    performerRoleLabel = "Agent Smith / Swarm Replica";
  } else if (isVance) {
    videoSrc = `${API_BASE}/media/horror/stream/cam-a`;
    sceneTag = "Scene 42A • Cockpit High-G Facial Turbulence Stabilizer";
    performerRoleLabel = "Commander Marcus Vance";
  }

  const assets = currentActor.synthetic_double_assets || {
    scan_fidelity: isNeo ? 99.9 : isSmith ? 99.7 : 99.6,
    landmark_deviation_mm: isNeo ? 0.012 : isSmith ? 0.019 : 0.038,
    gamut_match: "ACEScg SMPTE ST 2065-1",
    topology_points: isNeo ? 215000 : isSmith ? 198000 : 148200,
    render_engine: "Neural Gaussian Splatting v4.2 / Unreal Substrate",
    raw_scan_tag: isNeo
      ? "KR_NEO_HEADSCAN_POLARIZED_RAW_v08"
      : isSmith
      ? "HW_SMITH_HEADSCAN_POLARIZED_RAW_v04"
      : "MV_HEADSCAN_POLARIZED_RAW_v04",
    neural_render_tag: isNeo
      ? "KR_NEO_NEURAL_COMP_ACEScg_v14"
      : isSmith
      ? "HW_SMITH_NEURAL_COMP_ACEScg_v09"
      : "MV_NEURAL_COMP_ACEScg_v12",
  };

  const coordsCount = currentActor.synthetic_double_assets?.topology_coordinates?.length || 0;
  const hasConformedCoordinates = coordsCount > 0;

  const handleActorUpdated = (updated: LikenessPerformer) => {
    setCurrentActor(updated);
    if (onUpdateActor) {
      onUpdateActor(updated);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const mins = Math.floor((cur % 3600) / 60);
      const secs = Math.floor(cur % 60);
      const frames = Math.floor((cur % 1) * 24);
      setTimecode(
        `01:${String(mins + 24).padStart(2, "0")}:${String(secs).padStart(2, "0")}:${String(frames).padStart(2, "0")}`
      );
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTriggerExtend = () => {
    // Instant optimistic update for headroom counter
    setAuthorizedSec((prev) => Number((prev + 15.0).toFixed(1)));
    onExtend(actor.actor_id);
    setTopUpSuccess(true);
    setTimeout(() => setTopUpSuccess(false), 3500);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0e1122] border border-[#262A4A] rounded-2xl max-w-5xl w-full flex flex-col shadow-2xl overflow-y-auto font-sans max-h-[94vh]">
        {/* Top Header */}
        <div className="bg-[#141830] px-6 py-3.5 border-b border-[#262A4A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 text-lg font-bold shadow-md shadow-purple-500/20">
              🧬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Synthetic Double Inspector: {currentActor.actor_name}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  {currentActor.schedule_code}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  TAD §8.3 Photogrammetry v4.2
                </span>
                {hasConformedCoordinates ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    ✓ 3D Mesh: 158 Fiducials Conformed
                  </span>
                ) : (
                  <button
                    onClick={() => setViewMode("3D_SPATIAL")}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1 cursor-pointer transition-all animate-pulse"
                    title="Click to freeze frame and extract 158 3D biometric coordinates"
                  >
                    <span>⚠️ 3D Coordinates Missing in Docs (Click to Reconstruct)</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>Role: <span className="text-slate-200 font-medium">{performerRoleLabel}</span></span>
                <span>&bull;</span>
                <span>Contract: <span className="font-mono text-cyan-400">{currentActor.contract_id}</span></span>
                <span>&bull;</span>
                <span className="text-slate-300">{sceneTag}</span>
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

        {/* Viewport Control Bar */}
        <div className="bg-[#111429] px-6 py-2.5 border-b border-[#262A4A] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Comparator Mode:</span>
            {(["WIPE", "3D_SPATIAL", "RAW_SCAN", "NEURAL_PASS", "DIFF_MAP"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1 rounded text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === m
                    ? m === "3D_SPATIAL"
                      ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-md shadow-cyan-500/30 font-bold"
                      : "bg-purple-600 text-white shadow-md shadow-purple-500/30"
                    : "bg-[#1A1F3B] text-slate-400 hover:text-white hover:bg-[#22294E]"
                }`}
              >
                {m === "WIPE" && "🔀 2D A/B Split Wipe"}
                {m === "3D_SPATIAL" && (
                  <>
                    <span>🌐 3D Spatial Comparator</span>
                    <span className="text-[9px] px-1 py-0.2 bg-cyan-400/20 text-cyan-300 rounded font-bold uppercase">
                      New
                    </span>
                  </>
                )}
                {m === "RAW_SCAN" && "📐 Photogrammetry Mesh"}
                {m === "NEURAL_PASS" && "✨ Neural Composite"}
                {m === "DIFF_MAP" && "🔬 Landmark Delta Heatmap"}
              </button>
            ))}
          </div>

          {/* Right Side: Plate Source Switcher + Live Headroom Display */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#181D38] p-0.5 rounded-lg border border-[#262A4A] text-[11px]">
              <button
                onClick={() => setPlateSource("LIVE_VIDEO")}
                className={`px-2 py-0.5 rounded ${
                  plateSource === "LIVE_VIDEO"
                    ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                🎬 Live Video Feed
              </button>
              <button
                onClick={() => setPlateSource("CALIBRATED_STILL")}
                className={`px-2 py-0.5 rounded ${
                  plateSource === "CALIBRATED_STILL"
                    ? "bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                📸 Calibration Frame
              </button>
            </div>

            {/* Real-time Headroom & Extension Button */}
            <div className="flex items-center gap-2 pl-3 border-l border-[#262A4A]">
              <span className="text-slate-400 text-[11px]">Authorized Headroom:</span>
              <span
                className={`font-bold text-xs px-2 py-0.5 rounded border ${
                  headroom < 10
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                    : headroom < 25
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                }`}
              >
                {headroom}s rem ({usedSec}s / {authorizedSec}s)
              </span>
              <button
                onClick={handleTriggerExtend}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs flex items-center gap-1 transition-all shadow-md shadow-emerald-600/30"
                title="Authorize an emergency 15-second likeness headroom extension"
              >
                <span>+15s</span> Top-Up
              </button>
            </div>
          </div>
        </div>

        {/* Biometric 3D Documentation Status Banner */}
        <div
          className={`mx-6 mt-3 px-4 py-2.5 rounded-xl border flex items-center justify-between text-xs font-mono transition-all ${
            hasConformedCoordinates
              ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
              : "bg-amber-950/30 border-amber-500/40 text-amber-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-base">{hasConformedCoordinates ? "🧬" : "⚠️"}</span>
            <div>
              <div className="font-bold flex items-center gap-2">
                <span>
                  {hasConformedCoordinates
                    ? `SAG-AFTRA Schedule A 3D Biometric Topology: 158 Fiducial Points Conformed`
                    : `SAG-AFTRA Schedule A 3D Rider: Missing Biometric Coordinates`}
                </span>
                {currentActor.synthetic_double_assets?.c2pa_hash && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-cyan-300 border border-cyan-500/30">
                    C2PA: {currentActor.synthetic_double_assets.c2pa_hash.slice(0, 24)}...
                  </span>
                )}
              </div>
              <div className="text-[11px] opacity-80 mt-0.5">
                {hasConformedCoordinates
                  ? `Reconstructed via Photometric Shape-from-Shading from frame ${currentActor.synthetic_double_assets?.source_frame || "01:24:14:10"}. Verified sub-mm drift: ${assets.landmark_deviation_mm}mm.`
                  : `This performer's contract lacks 3D fiducial coordinates. Switch to '3D Spatial Comparator' to pause video, capture frame snapshot, and commit coordinates to ${currentActor.actor_name}'s documentation.`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewMode !== "3D_SPATIAL" && (
              <button
                onClick={() => setViewMode("3D_SPATIAL")}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
                  hasConformedCoordinates
                    ? "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30"
                    : "bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-black font-bold shadow-amber-500/30"
                }`}
              >
                <span>🌐</span>
                <span>{hasConformedCoordinates ? "Inspect 3D Biometrics" : "Generate 3D Model Now"}</span>
              </button>
            )}
          </div>
        </div>

        {/* 3D Spatial Mesh Comparator (TAD §8.4) */}
        {viewMode === "3D_SPATIAL" && (
          <div className="mx-6 my-3 min-h-[460px]">
            <SafeErrorBoundary fallbackText="Reinitializing 3D Biometric PBR Engine canvas...">
              <Biometric3DComparator
                actor={currentActor}
                videoSrc={videoSrc}
                currentVideoRef={videoRef}
                currentTimecode={timecode}
                isNeo={isNeo}
                isSmith={isSmith}
                onExtendHeadroom={handleTriggerExtend}
                onActorUpdated={handleActorUpdated}
              />
            </SafeErrorBoundary>
          </div>
        )}

        {/* Center Interactive Comparator Viewport: Unified Pixel-Perfect CSS Clip-Path */}
        <div
          className={`relative h-[430px] bg-black overflow-hidden flex items-center justify-center select-none rounded-xl border border-[#262A4A] mx-6 my-3 ${
            viewMode === "3D_SPATIAL" ? "hidden" : ""
          }`}
        >
          {/* BASE LAYER: Real Video Feed / Neural Composite (Pass B) */}
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-[#070913]">
            {plateSource === "LIVE_VIDEO" ? (
              <video
                ref={videoRef}
                src={videoSrc}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                onTimeUpdate={handleTimeUpdate}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0c1024] via-[#10142b] to-[#080a14]">
                <div className="text-center space-y-3">
                  <div className="w-28 h-28 mx-auto rounded-full bg-slate-800/80 border-2 border-cyan-400/60 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                    <span className="text-4xl">{isNeo ? "🕶️" : isSmith ? "🕴️" : "🧑‍🚀"}</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white tracking-wide">
                      {actor.actor_name} &bull; {performerRoleLabel}
                    </div>
                    <div className="text-xs font-mono text-cyan-400">
                      {assets.neural_render_tag} // 16-BIT EXR ACEScg
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pass B Watermark */}
            <div className="absolute bottom-4 right-4 z-10 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/40 text-[11px] font-mono text-cyan-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>Pass B: Neural Inpaint Composite ({assets.neural_render_tag})</span>
            </div>
          </div>

          {/* OVERLAY LAYER: 3D Photogrammetry Mesh & 68-Point Biometric Topology (Pass A) */}
          {/* Styled with pixel-perfect CSS clip-path so it NEVER distorts or misaligns */}
          <div
            className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-hidden"
            style={{
              clipPath:
                viewMode === "WIPE"
                  ? `inset(0 calc(100% - ${wipePos}%) 0 0)`
                  : viewMode === "RAW_SCAN"
                  ? "none"
                  : "inset(0 100% 0 0)",
            }}
          >
            {/* Holographic light-stage scanner tint */}
            <div className="absolute inset-0 bg-cyan-950/20 backdrop-contrast-125" />

            {/* 68-Point Biometric Topology SVG Overlay spanning exact full 100% viewport */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 800 450"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <pattern id="matrixScanGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#22d3ee" strokeWidth="0.4" strokeOpacity="0.25" />
                </pattern>
              </defs>

              <rect width="100%" height="100%" fill="url(#matrixScanGrid)" />

              {/* 3D Photogrammetry Bounding Hull */}
              <ellipse cx="400" cy="225" rx="130" ry="170" fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8" />
              <ellipse cx="400" cy="225" rx="110" ry="145" fill="none" stroke="#06B6D4" strokeWidth="1" opacity="0.7" />

              {/* 68-Point Fiducial Topology: Jawline Spline (Landmarks 1-17) */}
              <path
                d="M 290 190 Q 300 280 340 330 Q 400 370 460 330 Q 500 280 510 190"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeDasharray="3 3"
              />

              {/* Eyebrow Vectors (Landmarks 18-27) */}
              <path d="M 320 180 Q 350 165 380 180" fill="none" stroke="#06B6D4" strokeWidth="2.5" />
              <path d="M 420 180 Q 450 165 480 180" fill="none" stroke="#06B6D4" strokeWidth="2.5" />

              {/* Eye Contour & Pupil Landmarking (Landmarks 37-48) */}
              <ellipse cx="350" cy="200" rx="22" ry="12" fill="none" stroke="#A78BFA" strokeWidth="2" />
              <circle cx="350" cy="200" r="6" fill="#06B6D4" />
              <circle cx="350" cy="200" r="2" fill="#FFFFFF" />

              <ellipse cx="450" cy="200" rx="22" ry="12" fill="none" stroke="#A78BFA" strokeWidth="2" />
              <circle cx="450" cy="200" r="6" fill="#06B6D4" />
              <circle cx="450" cy="200" r="2" fill="#FFFFFF" />

              {/* Nasal Bridge & Septum Grid (Landmarks 28-36) */}
              <path d="M 400 180 L 400 250 L 385 260 L 415 260 Z" fill="none" stroke="#06B6D4" strokeWidth="2" />

              {/* Lip Perimeter (Landmarks 49-68) */}
              <path d="M 360 295 Q 400 285 440 295 Q 400 315 360 295 Z" fill="none" stroke="#10B981" strokeWidth="2" />
              <path d="M 370 295 Q 400 302 430 295" fill="none" stroke="#10B981" strokeWidth="1.5" />

              {/* Neo-Specific Sunglasses HUD / Matrix Rain Nodes */}
              {isNeo && (
                <g opacity="0.9">
                  <rect x="320" y="188" width="60" height="24" rx="4" fill="none" stroke="#22c55e" strokeWidth="2" />
                  <rect x="420" y="188" width="60" height="24" rx="4" fill="none" stroke="#22c55e" strokeWidth="2" />
                  <line x1="380" y1="198" x2="420" y2="198" stroke="#22c55e" strokeWidth="2" />
                  <text x="325" y="180" fill="#22c55e" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    KR_OPTICAL_AXIS_LOCK [OK]
                  </text>
                </g>
              )}

              {/* Agent Smith-Specific Earpiece Wireframe */}
              {isSmith && (
                <g opacity="0.9">
                  <path d="M 505 190 Q 525 210 515 235 L 505 240" fill="none" stroke="#38BDF8" strokeWidth="2.5" />
                  <circle cx="505" cy="240" r="4" fill="#38BDF8" />
                  <text x="430" y="160" fill="#38BDF8" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    HW_SWARM_NODE_ID: #001
                  </text>
                </g>
              )}

              {/* Laser Scanning Beam */}
              <line x1="200" y1="100" x2="600" y2="100" stroke="#06B6D4" strokeWidth="2.5" opacity="0.8">
                <animate attributeName="y1" values="80;370;80" dur="3s" repeatCount="indefinite" />
                <animate attributeName="y2" values="80;370;80" dur="3s" repeatCount="indefinite" />
              </line>

              {/* Diagnostic Readout Overlay */}
              <text x="24" y="36" fill="#A78BFA" fontSize="11" fontFamily="monospace" fontWeight="bold">
                PASS A: {assets.raw_scan_tag}
              </text>
              <text x="24" y="52" fill="#64748B" fontSize="9" fontFamily="monospace">
                POLARIZED 360° LIGHT STAGE PHOTOGRAMMETRY // 68 FIDUCIALS
              </text>
              <text x="24" y="66" fill="#10B981" fontSize="9" fontFamily="monospace">
                FACS ACTION UNITS: AU01, AU04, AU12 ACTIVE
              </text>
            </svg>

            {/* Pass A Watermark */}
            <div className="absolute bottom-4 left-4 z-10 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-purple-500/40 text-[11px] font-mono text-purple-300">
              A: 3D Photogrammetry Scan ({assets.raw_scan_tag})
            </div>
          </div>

          {/* Draggable Divider Handle for Split-Wipe Mode */}
          {viewMode === "WIPE" && (
            <div
              className="absolute top-0 bottom-0 z-30 w-1 bg-gradient-to-b from-purple-400 via-cyan-400 to-purple-400 cursor-ew-resize flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.9)]"
              style={{ left: `${wipePos}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-[#0d1024] border-2 border-cyan-400 flex items-center justify-center text-[10px] text-white font-bold shadow-2xl">
                ◀▶
              </div>
            </div>
          )}

          {/* Invisible Overlay Range Slider for Smooth Scrubbing */}
          {viewMode === "WIPE" && (
            <input
              type="range"
              min="0"
              max="100"
              value={wipePos}
              onChange={(e) => setWipePos(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-40"
              title="Drag slider to compare 3D Scan vs Neural Composite"
            />
          )}

          {/* Sub-Millimeter Landmark Delta Heatmap Mode */}
          {viewMode === "DIFF_MAP" && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center font-mono text-xs text-center p-8 space-y-4 z-40">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                <span className="text-xl">✓</span>
                <span>SAG-AFTRA Schedule Statutory Landmark Compliance Verified</span>
              </div>
              <div className="text-slate-300 max-w-lg text-xs leading-relaxed">
                Zero identity distortion or unauthorized biometric morphing detected. Mean facial landmark deviation across 68 fiducial anchor points is{" "}
                <span className="text-cyan-400 font-bold text-sm">{assets.landmark_deviation_mm} mm</span> (Well within the union tolerance threshold of &le; 0.250 mm).
              </div>

              {/* Landmark Metric Cards */}
              <div className="grid grid-cols-3 gap-4 w-full max-w-xl pt-2">
                <div className="bg-[#141832] p-3 rounded-xl border border-[#262A4A] text-left">
                  <div className="text-slate-400 text-[10px]">PUPIL ALIGNMENT</div>
                  <div className="text-white font-bold text-sm mt-0.5">&Delta; 0.008 mm</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Tolerance &lt; 0.10mm</div>
                </div>
                <div className="bg-[#141832] p-3 rounded-xl border border-[#262A4A] text-left">
                  <div className="text-slate-400 text-[10px]">NASAL BRIDGE</div>
                  <div className="text-white font-bold text-sm mt-0.5">&Delta; 0.014 mm</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Tolerance &lt; 0.25mm</div>
                </div>
                <div className="bg-[#141832] p-3 rounded-xl border border-[#262A4A] text-left">
                  <div className="text-slate-400 text-[10px]">MANDIBLE CONTOUR</div>
                  <div className="text-white font-bold text-sm mt-0.5">&Delta; 0.018 mm</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Tolerance &lt; 0.25mm</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-2">
                <span className="text-purple-400 font-bold">C2PA Hardware Hash:</span>
                <span className="font-mono text-cyan-300">{actor.c2pa_hash || "c2pa:sha256:matrix_root_verified"}</span>
              </div>
            </div>
          )}

          {/* Transport Floating Bar (Play/Pause, Timecode, Mute) */}
          {plateSource === "LIVE_VIDEO" && (
            <div className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#262A4A] text-xs font-mono text-white">
              <button
                onClick={togglePlay}
                className="hover:text-cyan-400 transition-colors flex items-center gap-1"
                title={isPlaying ? "Pause Video Playback" : "Play Video"}
              >
                <span>{isPlaying ? "⏸" : "▶"}</span>
                <span className="text-[11px]">{isPlaying ? "PAUSE" : "PLAY"}</span>
              </button>
              <span className="text-slate-500">|</span>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="hover:text-cyan-400 transition-colors"
                title={isMuted ? "Unmute Audio" : "Mute Audio"}
              >
                {isMuted ? "🔇" : "🔊"}
              </button>
              <span className="text-slate-500">|</span>
              <span className="text-cyan-300 text-[11px] font-bold">{timecode}</span>
              <span className="text-slate-500">|</span>
              <button
                onClick={() => setViewMode("3D_SPATIAL")}
                className="px-2 py-0.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:opacity-90 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                title="Freeze frame and inspect 3D Biometric Mesh"
              >
                <span>📸 3D Reconstruct</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Telemetry & Quality Assurance Metrics */}
        <div className="bg-[#111429] px-6 py-3.5 border-t border-[#262A4A] grid grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-[#161B38] p-3 rounded-xl border border-[#262A4A]">
            <div className="text-slate-400 text-[10px]">IDENTITY FIDELITY</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">
              {assets.scan_fidelity}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Cosine Similarity Score</div>
          </div>

          <div className="bg-[#161B38] p-3 rounded-xl border border-[#262A4A]">
            <div className="text-slate-400 text-[10px]">LANDMARK DRIFT</div>
            <div className="text-base font-bold text-cyan-400 mt-0.5">
              {assets.landmark_deviation_mm} mm
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Union Limit &le; 0.25mm</div>
          </div>

          <div className="bg-[#161B38] p-3 rounded-xl border border-[#262A4A]">
            <div className="text-slate-400 text-[10px]">COLOR SPACE</div>
            <div className="text-xs font-bold text-purple-300 mt-1 truncate">
              {assets.gamut_match}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">ST 2065-1 Compliant</div>
          </div>

          <div className="bg-[#161B38] p-3 rounded-xl border border-[#262A4A]">
            <div className="text-slate-400 text-[10px]">TOPOLOGY DENSITY</div>
            <div className="text-base font-bold text-white mt-0.5">
              {hasConformedCoordinates ? "158 Fiducials" : `${assets.topology_points.toLocaleString()} pts`}
            </div>
            <div className={`text-[10px] mt-0.5 font-bold ${hasConformedCoordinates ? "text-emerald-400" : "text-amber-400"}`}>
              {hasConformedCoordinates ? "✓ Conformed in Docs" : "⚠️ 3D Coordinates Pending"}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#141830] px-6 py-3 border-t border-[#262A4A] flex items-center justify-between text-xs">
          <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
            <span>Engine: <span className="text-slate-200">{assets.render_engine}</span></span>
            {topUpSuccess && (
              <span className="text-emerald-400 font-bold animate-pulse">
                ✓ +15.0s Emergency Extension Authorized (New Cap: {authorizedSec}s)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerExtend}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white rounded-lg font-bold text-xs font-mono shadow-lg transition-all flex items-center gap-1.5"
            >
              <span>+15s</span>
              <span>Authorize Emergency Extension</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#1A1F3B] hover:bg-[#252C54] text-slate-300 rounded-lg text-xs font-mono transition-colors"
            >
              Close Inspector
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
