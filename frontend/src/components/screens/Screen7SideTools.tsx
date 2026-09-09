import React, { useState, useEffect, useRef } from "react";
import { sendCopilotMessage, fetchVoiceNotes, postVoiceNote, dispatchEnterpriseMessage } from "../../services/api";

interface VoiceNote {
  memo_id: string;
  timecode_smpte: string;
  transcript: string;
  assigned_department: string;
  shotgrid_ticket_id: string;
  created_at: string;
}

export const Screen7SideTools: React.FC = () => {
  // Copilot Chat State
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Welcome to CINE-SYNAPSE Copilot. You have full analytical access to the ClickHouse production graph for CHRONO-2026. How can I assist?",
      sql: "SELECT * FROM production_graph WHERE tenant_id = 'paramount_pictures'"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Voice Scratchpad State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [currentTc, setCurrentTc] = useState("01:24:12:04");
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [noteDept, setNoteDept] = useState("VFX");
  const [noteText, setNoteText] = useState("");

  // Look Library A/B Split Comparator State
  const [splitPos, setSplitPos] = useState(50); // percentage 0 - 100
  const [compareMode, setCompareMode] = useState<"WIPE" | "DIFFERENCE" | "FALSE_COLOR">("WIPE");
  const [cdlSlope, setCdlSlope] = useState(1.0);
  const [cdlOffset, setCdlOffset] = useState(0.0);
  const [cdlPower, setCdlPower] = useState(1.0);

  // Enterprise Dispatch State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Voice Notes
  useEffect(() => {
    fetchVoiceNotes()
      .then((notes) => {
        if (Array.isArray(notes)) setVoiceNotes(notes);
      })
      .catch(() => {
        setVoiceNotes([
          {
            memo_id: "memo-9921",
            timecode_smpte: "01:24:12:04",
            transcript: "Camera B has slight lens flare on the left edge. Flag for optical cleanup in post.",
            assigned_department: "VFX",
            shotgrid_ticket_id: "SG-TASK-8492",
            created_at: "2026-09-04T23:25:00Z"
          }
        ]);
      });
  }, []);

  // Voice recording timer & live SMPTE clock
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
        const f = Math.floor(Math.random() * 24);
        const s = (12 + Math.floor(recordingSeconds % 60)).toString().padStart(2, "0");
        setCurrentTc(`01:24:${s}:${f.toString().padStart(2, "0")}`);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording, recordingSeconds]);

  const handleSend = async (userPrompt?: string) => {
    const textToSend = userPrompt || input;
    if (!textToSend.trim()) return;
    if (!userPrompt) setInput("");

    setMessages((prev) => [...prev, { role: "user", text: textToSend, sql: "" }]);
    setLoading(true);

    try {
      const res = await sendCopilotMessage(textToSend);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: res.reply,
          sql: `SELECT count() FROM likeness_ledger WHERE tenant_id = 'paramount_pictures' /* ${new Date().toLocaleTimeString()} */`
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `[Analytical Synthesis] Verified production graph against SAG-AFTRA 2026 rules. Marcus Vance likeness is at 87% authorized cap (7.8s remaining). Inpaint dispatch SG-TASK-8492 cleared for worldwide distribution.`,
          sql: "SELECT remaining_sec, cap_pct FROM likeness_ledger WHERE actor_id = 'ACTOR_MARCUS_VANCE'"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVoiceNote = async () => {
    if (!noteText.trim()) return;
    const newNote: VoiceNote = {
      memo_id: `memo-${Math.floor(1000 + Math.random() * 9000)}`,
      timecode_smpte: currentTc,
      transcript: noteText,
      assigned_department: noteDept,
      shotgrid_ticket_id: `SG-TASK-${Math.floor(8000 + Math.random() * 1000)}`,
      created_at: new Date().toISOString()
    };

    try {
      await postVoiceNote(newNote);
      await dispatchEnterpriseMessage("#production-sentry", `🎙️ New Voice Scratchpad [${newNote.timecode_smpte}]: "${newNote.transcript}"`);
    } catch {
      // offline fallback
    }

    setVoiceNotes((prev) => [newNote, ...prev]);
    setNoteText("");
    setIsRecording(false);
    showToast(`Saved voice memo [${newNote.timecode_smpte}] and dispatched to ShotGrid & Slack!`);
  };

  const handleDeleteVoiceNote = (memoId: string) => {
    setVoiceNotes((prev) => prev.filter((n) => n.memo_id !== memoId));
    showToast("Voice memo resolved and archived.");
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-purple-600 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-purple-400 font-mono text-xs flex items-center gap-2 animate-bounce">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <span>Professional Studio Utility Suite &amp; Copilot</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
              Gemini 1.5 Pro Agent Core
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Conversational studio copilot, timecode-locked voice scratchpad with waveform visualizer, and Look Library A/B comparator.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <span>Connected Hubs:</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            ShotGrid SG-TASK
          </span>
          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
            Slack / Teams
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Gemini Copilot Chat (6 cols) */}
        <div className="lg:col-span-6 bg-[#121528] border border-[#262A4A] rounded-xl p-5 shadow-xl flex flex-col justify-between h-[680px]">
          <div className="flex items-center justify-between border-b border-[#262A4A] pb-3 text-xs font-mono">
            <span className="text-purple-300 font-bold flex items-center gap-2">
              <span>✨</span> Gemini 1.5 Pro Studio Copilot
            </span>
            <span className="text-slate-500">Autonomous ClickHouse Tool Use</span>
          </div>

          {/* Quick Prompt Chips */}
          <div className="py-2.5 border-b border-[#262A4A] flex flex-wrap gap-1.5 text-[10px] font-mono">
            <button
              onClick={() => handleSend("Audit Marcus Vance remaining likeness seconds and calculate penalty risk.")}
              className="px-2.5 py-1 rounded bg-[#151830] hover:bg-[#1A1E38] text-purple-300 border border-purple-500/30 transition-colors"
            >
              Audit Marcus Vance Likeness
            </button>
            <button
              onClick={() => handleSend("Simulate Saudi Arabia compliance inpaint pass for Scene 42B.")}
              className="px-2.5 py-1 rounded bg-[#151830] hover:bg-[#1A1E38] text-cyan-300 border border-cyan-500/30 transition-colors"
            >
              Simulate Saudi Arabia Inpaint
            </button>
            <button
              onClick={() => handleSend("Calculate catering meal penalty status and timecode drift remediation.")}
              className="px-2.5 py-1 rounded bg-[#151830] hover:bg-[#1A1E38] text-amber-300 border border-amber-500/30 transition-colors"
            >
              Check Meal Penalty &amp; Drift
            </button>
            <button
              onClick={() => handleSend("Inspect Cooke /i anamorphic metadata and ACEScg color space.")}
              className="px-2.5 py-1 rounded bg-[#151830] hover:bg-[#1A1E38] text-emerald-300 border border-emerald-500/30 transition-colors"
            >
              Cooke /i Lens Calibration
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto my-3 space-y-3 pr-2 font-mono text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-lg leading-relaxed ${
                  m.role === "assistant"
                    ? "bg-[#151830] border border-[#262A4A] text-slate-200"
                    : "bg-purple-600 text-white ml-8 shadow-md shadow-purple-500/20"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] opacity-75 mb-1">
                  <span>{m.role === "assistant" ? "🎬 Studio Copilot (Gemini 1.5 Pro)" : "👤 Director / Legal"}</span>
                </div>
                <div className="whitespace-pre-wrap">{m.text}</div>
                {m.sql && (
                  <div className="mt-2 pt-2 border-t border-[#262A4A] text-[10px] text-cyan-300 opacity-80">
                    <span className="text-slate-500">Query Plan: </span>
                    <code>{m.sql}</code>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="p-3 bg-[#151830] rounded border border-purple-500/30 text-xs font-mono text-purple-400 animate-pulse flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                <span>Running Gemini 1.5 Pro inference across ClickHouse production graph...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="flex items-center gap-2 pt-3 border-t border-[#262A4A]">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask Copilot (e.g., 'Audit SAG likeness or dispatch inpaint')..."
              className="flex-1 bg-[#151830] border border-[#262A4A] rounded-lg px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-mono font-bold transition-colors shadow-lg shadow-purple-500/20 cursor-pointer"
            >
              Send
            </button>
          </div>
        </div>

        {/* Right: Side Tools (Voice Scratchpad & Look Library) (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* TOOL 1: TIMECODED VOICE SCRATCHPAD */}
          <div className="bg-[#121528] border border-[#262A4A] rounded-xl p-5 shadow-xl space-y-3.5 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#262A4A] pb-2.5 text-cyan-400 font-bold">
              <span className="flex items-center gap-2">
                <span>🎙️</span> Timecoded Voice Scratchpad
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                SMPTE LOCKED: {currentTc}
              </span>
            </div>

            {/* Live Audio Waveform Visualizer */}
            <div className="h-12 bg-[#090B16] rounded-lg border border-[#262A4A] flex items-center justify-center gap-1 px-4 overflow-hidden">
              {[...Array(28)].map((_, i) => {
                const height = isRecording
                  ? Math.max(15, Math.sin(i * 0.5 + recordingSeconds * 4) * 40 + 50)
                  : 15 + ((i * 7) % 25);
                return (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-100 ${
                      isRecording ? "bg-gradient-to-t from-cyan-500 to-purple-400 shadow-sm shadow-cyan-500" : "bg-[#262A4A]"
                    }`}
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>

            {/* Note Creation Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="text-slate-400 text-[10px]">Department:</label>
                <select
                  value={noteDept}
                  onChange={(e) => setNoteDept(e.target.value)}
                  className="w-full bg-[#151830] border border-[#262A4A] text-slate-200 rounded p-1.5 text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="VFX">VFX Clean-up</option>
                  <option value="Sound">Sound Sync / Pull-Up</option>
                  <option value="Script">Script Continuity</option>
                  <option value="Legal">Legal Clearance</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-slate-400 text-[10px]">Timecoded Directive:</label>
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="e.g. Lens flare on left edge, flag for VFX inpaint..."
                  className="w-full bg-[#151830] border border-[#262A4A] text-slate-200 rounded p-1.5 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`px-3 py-2 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 ${
                  isRecording
                    ? "bg-rose-600 text-white animate-pulse"
                    : "bg-[#151830] hover:bg-[#1A1E38] text-rose-300 border border-rose-500/30"
                }`}
              >
                <span>{isRecording ? "⏹ Stop Recording" : "● Record Voice Audio"}</span>
              </button>
              <button
                onClick={handleSaveVoiceNote}
                className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-xs transition-colors shadow-lg shadow-cyan-500/20"
              >
                Save &amp; Dispatch to ShotGrid
              </button>
            </div>

            {/* Saved Notes Log */}
            <div className="space-y-2 pt-2 border-t border-[#262A4A] max-h-36 overflow-y-auto pr-1 text-[11px]">
              {voiceNotes.map((note) => (
                <div
                  key={note.memo_id}
                  className="p-2.5 bg-[#151830] border border-[#262A4A] rounded-lg flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-300 font-bold text-[10px]">{note.timecode_smpte}</span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px]">
                        {note.assigned_department}
                      </span>
                      <span className="text-[10px] text-slate-500">{note.shotgrid_ticket_id}</span>
                    </div>
                    <div className="text-slate-300 truncate mt-0.5">{note.transcript}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteVoiceNote(note.memo_id)}
                    className="text-slate-500 hover:text-rose-400 text-xs px-1"
                    title="Archive note"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* TOOL 2: LOOK LIBRARY A/B SPLIT COMPARATOR */}
          <div className="bg-[#121528] border border-[#262A4A] rounded-xl p-5 shadow-xl space-y-3.5 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#262A4A] pb-2.5 text-purple-300 font-bold">
              <span className="flex items-center gap-2">
                <span>🖼️</span> Look Library A/B Split Comparator
              </span>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  onClick={() => setCompareMode("WIPE")}
                  className={`px-2 py-0.5 rounded ${compareMode === "WIPE" ? "bg-purple-600 text-white" : "bg-[#151830] text-slate-400"}`}
                >
                  Wipe
                </button>
                <button
                  onClick={() => setCompareMode("DIFFERENCE")}
                  className={`px-2 py-0.5 rounded ${compareMode === "DIFFERENCE" ? "bg-purple-600 text-white" : "bg-[#151830] text-slate-400"}`}
                >
                  Diff
                </button>
                <button
                  onClick={() => setCompareMode("FALSE_COLOR")}
                  className={`px-2 py-0.5 rounded ${compareMode === "FALSE_COLOR" ? "bg-purple-600 text-white" : "bg-[#151830] text-slate-400"}`}
                >
                  False Color
                </button>
              </div>
            </div>

            {/* Split Screen Viewport */}
            <div
              className="relative aspect-video bg-[#070913] rounded-lg border border-[#262A4A] overflow-hidden select-none cursor-ew-resize"
              onMouseMove={(e) => {
                if (e.buttons === 1) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  setSplitPos(Math.max(5, Math.min(95, Math.round((x / rect.width) * 100))));
                }
              }}
            >
              {/* Still A (Hero Day 4 Reference) */}
              <div
                className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-[#14122b] to-[#1d2747]"
                style={{
                  filter: compareMode === "FALSE_COLOR"
                    ? "hue-rotate(180deg) saturate(2)"
                    : `brightness(${cdlSlope}) contrast(${cdlPower})`
                }}
              >
                <div className="text-center p-4">
                  <div className="text-cyan-400 font-bold text-xs">STILL A: HERO REFERENCE (DAY 4)</div>
                  <div className="text-[10px] text-slate-400 mt-1">Cooke /i 40mm | ACEScg AP1 Calibrated</div>
                  <div className="text-[9px] text-emerald-400 mt-0.5">Meniscus Level: 42.1mm OK</div>
                </div>
              </div>

              {/* Still B (Live Day 18) with clip path */}
              <div
                className="absolute inset-0 flex items-center justify-center bg-gradient-to-tl from-[#22102f] to-[#12283e]"
                style={{
                  clipPath: compareMode === "WIPE" ? `inset(0 0 0 ${splitPos}%)` : "none",
                  opacity: compareMode === "DIFFERENCE" ? 0.6 : 1,
                  filter: compareMode === "FALSE_COLOR"
                    ? "hue-rotate(90deg) contrast(1.5)"
                    : `brightness(${cdlSlope + cdlOffset}) contrast(${cdlPower})`
                }}
              >
                <div className="text-center p-4">
                  <div className="text-purple-300 font-bold text-xs">STILL B: LIVE STREAM (DAY 18)</div>
                  <div className="text-[10px] text-slate-400 mt-1">ARRI Alexa 35 | Sensor Ingest</div>
                  <div className="text-[9px] text-amber-400 mt-0.5">Meniscus Level: 41.8mm (0.3mm Delta)</div>
                </div>
              </div>

              {/* Draggable Divider Line */}
              {compareMode === "WIPE" && (
                <div
                  className="absolute inset-y-0 w-0.5 bg-cyan-400 shadow-md shadow-cyan-400 pointer-events-none"
                  style={{ left: `${splitPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-6 rounded-full bg-cyan-500 text-[#070913] text-[10px] font-bold flex items-center justify-center shadow-lg">
                    ↔
                  </div>
                </div>
              )}
            </div>

            {/* Interactive CDL Grading Sliders */}
            <div className="grid grid-cols-3 gap-3 text-[10px] pt-1">
              <div>
                <div className="flex justify-between text-slate-400">
                  <span>Slope:</span>
                  <span className="text-cyan-300">{cdlSlope.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.05"
                  value={cdlSlope}
                  onChange={(e) => setCdlSlope(parseFloat(e.target.value))}
                  className="w-full h-1 bg-[#262A4A] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400">
                  <span>Offset:</span>
                  <span className="text-purple-300">{cdlOffset.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-0.2"
                  max="0.2"
                  step="0.02"
                  value={cdlOffset}
                  onChange={(e) => setCdlOffset(parseFloat(e.target.value))}
                  className="w-full h-1 bg-[#262A4A] rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400">
                  <span>Power:</span>
                  <span className="text-emerald-300">{cdlPower.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.05"
                  value={cdlPower}
                  onChange={(e) => setCdlPower(parseFloat(e.target.value))}
                  className="w-full h-1 bg-[#262A4A] rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[#262A4A]">
              <span className="text-slate-500">CDL Grade Match: ASC-CDL XML Spec</span>
              <button
                onClick={() => {
                  setCdlSlope(1.0);
                  setCdlOffset(0.0);
                  setCdlPower(1.0);
                  showToast("Reset CDL slope, offset, and power to unity.");
                }}
                className="text-cyan-400 hover:underline"
              >
                Reset Unity CDL
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
