import React, { useState } from 'react';
import { StudioTenant } from '../../types';
import { createStudio } from '../../services/api';

interface CreateStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudioCreated: (newStudio: StudioTenant) => void;
}

export const CreateStudioModal: React.FC<CreateStudioModalProps> = ({
  isOpen,
  onClose,
  onStudioCreated,
}) => {
  const [name, setName] = useState('Silver Pictures / Village Roadshow');
  const [tenantId, setTenantId] = useState('silver_pictures');
  const [code, setCode] = useState('SILV');
  const [logo, setLogo] = useState('🏛️');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a studio organization name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const normalizedTenantId = tenantId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const payload = {
        name: name.trim(),
        tenant_id: normalizedTenantId || undefined,
        code: code.trim().toUpperCase() || 'STUD',
        logo: logo.trim() || '🏢',
      };

      const result = await createStudio(payload);
      if (result && result.tenant_id) {
        onStudioCreated({
          ...result,
          logo: payload.logo,
        });
        onClose();
      } else {
        setErrorMsg('Failed to create studio. Server returned invalid response.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating studio');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-emerald-500/30 rounded-xl shadow-2xl overflow-hidden my-8">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-lg">
              🏢
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 tracking-wide flex items-center gap-2">
                REGISTER STUDIO TENANT
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                  TENANT ISOLATION
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Create a high-level studio organization to host multiple film projects.
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-lg text-xs text-red-300">
              ⚠️ {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Studio Organization Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setTenantId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
              }}
              placeholder="e.g. Silver Pictures / Village Roadshow"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Tenant Slug (Unique ID)
              </label>
              <input
                type="text"
                required
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value.toLowerCase())}
                placeholder="e.g. silver_pictures"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Short Code (3-4 Chars)
              </label>
              <input
                type="text"
                required
                maxLength={5}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SILV"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 font-mono uppercase focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Studio Icon / Emblem Emoji
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={4}
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                className="w-16 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-center text-lg text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex items-center gap-2">
                {['🏛️', '🎬', '🦅', '🦁', '🌟', '🛡️', '⚡', '👁️'].map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setLogo(em)}
                    className="w-8 h-8 rounded border border-zinc-700 hover:border-emerald-500 bg-zinc-950 flex items-center justify-center text-sm transition-colors"
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
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
              {isSubmitting ? 'Registering Studio...' : 'Register Studio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
