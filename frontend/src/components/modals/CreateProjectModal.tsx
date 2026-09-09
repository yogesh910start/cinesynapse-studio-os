import React, { useState } from 'react';
import { StudioTenant, MovieProject } from '../../types';
import { createProject } from '../../services/api';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  studios: StudioTenant[];
  activeTenant: string;
  onProjectCreated: (newProject: MovieProject) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  studios,
  activeTenant,
  onProjectCreated,
}) => {
  const [tenantId, setTenantId] = useState<string>(activeTenant || 'warner_bros');
  const [title, setTitle] = useState('The Matrix: Burly Brawl');
  const [projectCode, setProjectCode] = useState('MATRIX-2026');
  const [director, setDirector] = useState('Lana & Lilly Wachowski');
  const [cameraFps, setCameraFps] = useState('24.0');
  const [aspectRatio, setAspectRatio] = useState('2.39:1 Scope');
  const [template, setTemplate] = useState<'blank' | 'matrix_benchmark'>('blank');
  const [description, setDescription] = useState('Principal photography for the 100-Agent Smith courtyard martial arts sequence.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a movie project title.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        project_id: projectCode.trim().toUpperCase() || undefined,
        title: title.trim(),
        director: director.trim(),
        year: 2026,
        camera_fps: parseFloat(cameraFps),
        aspect_ratio: aspectRatio,
        description: description.trim(),
        template: template,
        seed_template: template,
        is_blank: template === 'blank',
      };

      const result = await createProject(payload, tenantId);
      if (result && result.project_id) {
        onProjectCreated(result);
        onClose();
      } else {
        setErrorMsg('Failed to create movie project. Server returned invalid response.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-emerald-500/30 rounded-xl shadow-2xl overflow-hidden my-8">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-lg">
              🎬
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 tracking-wide flex items-center gap-2">
                CREATE NEW MOVIE PROJECT
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                  OMC ISO-1004 COMPLIANT
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Register a creative work with isolated production slates, scenes, takes, and SAG-AFTRA riders.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition-colors p-1 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-lg text-xs text-red-300">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Studio Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Studio Organization (Tenant)
            </label>
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono"
            >
              {studios.map((s) => (
                <option key={s.tenant_id} value={s.tenant_id}>
                  {s.logo || '🏢'} {s.name} ({s.code || s.tenant_id})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Movie Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The Matrix: Burly Brawl"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Project Code */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Project Code / Slug
              </label>
              <input
                type="text"
                required
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value.toUpperCase())}
                placeholder="e.g. MATRIX-2026"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Director */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Principal Director(s)
              </label>
              <input
                type="text"
                value={director}
                onChange={(e) => setDirector(e.target.value)}
                placeholder="e.g. Lana & Lilly Wachowski"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* FPS */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Target Capture FPS
              </label>
              <select
                value={cameraFps}
                onChange={(e) => setCameraFps(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="24.0">24.000 fps (SMPTE Theatrical Master)</option>
                <option value="23.976">23.976 fps (Broadcast Sync)</option>
                <option value="48.0">48.000 fps (HFR 3D Stereo)</option>
                <option value="120.0">120.000 fps (VFX High-Speed Matrix)</option>
              </select>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Master Aspect Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="2.39:1 Scope">2.39:1 Anamorphic Scope</option>
                <option value="1.85:1 Flat">1.85:1 Flat Standard</option>
                <option value="1.43:1 IMAX">1.43:1 IMAX 70mm Dual-Laser</option>
                <option value="1.90:1 Digital IMAX">1.90:1 Digital IMAX</option>
              </select>
            </div>
          </div>

          {/* Template Selector Card */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Project Initialization Mode
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label
                className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                  template === 'blank'
                    ? 'bg-emerald-950/20 border-emerald-500/60 ring-1 ring-emerald-500/40'
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 font-semibold text-sm text-zinc-100">
                    <span className="text-base">✨</span>
                    <span>Clean Blank Slate</span>
                  </div>
                  <input
                    type="radio"
                    name="template"
                    value="blank"
                    checked={template === 'blank'}
                    onChange={() => setTemplate('blank')}
                    className="accent-emerald-500"
                  />
                </div>
                <p className="text-xs text-zinc-400">
                  Starts with <strong className="text-zinc-200">0 scenes, 0 takes, 0 likeness riders</strong>. Create your own scenes and test everything from scratch!
                </p>
                <span className="mt-2 text-[10px] text-emerald-400 font-mono font-medium">
                  RECOMMENDED FOR USER CUSTOM TESTING
                </span>
              </label>

              <label
                className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                  template === 'matrix_benchmark'
                    ? 'bg-emerald-950/20 border-emerald-500/60 ring-1 ring-emerald-500/40'
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 font-semibold text-sm text-zinc-100">
                    <span className="text-base">⚡</span>
                    <span>Matrix Benchmark Demo</span>
                  </div>
                  <input
                    type="radio"
                    name="template"
                    value="matrix_benchmark"
                    checked={template === 'matrix_benchmark'}
                    onChange={() => setTemplate('matrix_benchmark')}
                    className="accent-emerald-500"
                  />
                </div>
                <p className="text-xs text-zinc-400">
                  Pre-loads Scene 102 (Burly Brawl), Keanu Reeves (Neo Schedule F), and Hugo Weaving (Agent Smith 100-clone replica).
                </p>
                <span className="mt-2 text-[10px] text-zinc-400 font-mono">
                  ONE-CLICK PRECONFIGURED SHOWCASE
                </span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Production Logline / Scope
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of narrative context or technical scope..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-950/50 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Project...
                </>
              ) : (
                <>
                  <span>➕</span>
                  Create Movie Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
