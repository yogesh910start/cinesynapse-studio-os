export const API_BASE = typeof window !== "undefined" && window.location.port === "5173"
  ? `${window.location.protocol}//${window.location.hostname}:8000/api/v1` 
  : "/api/v1";

export async function fetchProductionGraph(tenantId: string = "paramount_pictures", projectId?: string) {
  const url = projectId 
    ? `${API_BASE}/production-graph?project_id=${encodeURIComponent(projectId)}`
    : `${API_BASE}/production-graph`;
  const headers: Record<string, string> = { "x-tenant-id": tenantId };
  if (projectId) headers["x-project-id"] = projectId;
  const res = await fetch(url, { headers });
  return res.json();
}

export async function fetchAuthToken(tenantId: string = "paramount_pictures", role: string = "director", userId: string = "marcus-director") {
  const res = await fetch(`${API_BASE}/auth/token?tenant_id=${encodeURIComponent(tenantId)}`, {
    method: "POST"
  });
  return res.json();
}

export async function logoutSession(tenantId: string = "paramount_pictures") {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: {
      "x-tenant-id": tenantId
    }
  });
  return res.json();
}

export async function triggerScenario(scenarioId: string, tenantId: string = "paramount_pictures") {
  const res = await fetch(`${API_BASE}/scenarios/trigger`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId
    },
    body: JSON.stringify({ scenario_id: scenarioId })
  });
  return res.json();
}

export async function fetchLikenessLedger(tenantId: string = "paramount_pictures", projectId?: string) {
  const url = projectId 
    ? `${API_BASE}/likeness-ledger?project_id=${encodeURIComponent(projectId)}`
    : `${API_BASE}/likeness-ledger`;
  const res = await fetch(url, {
    headers: { "x-tenant-id": tenantId }
  });
  return res.json();
}

export async function fetchSinglePerformer(actorId: string, tenantId: string = "paramount_pictures", projectId?: string) {
  const url = projectId 
    ? `${API_BASE}/likeness/${encodeURIComponent(actorId)}?project_id=${encodeURIComponent(projectId)}`
    : `${API_BASE}/likeness/${encodeURIComponent(actorId)}`;
  const res = await fetch(url, {
    headers: { "x-tenant-id": tenantId }
  });
  return res.json();
}

export async function extendLikenessSeconds(actorId: string, addSeconds: number = 15.0, note?: string, authorizedBy?: string, tenantId: string = "paramount_pictures", projectId?: string) {
  const res = await fetch(`${API_BASE}/likeness/extend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId
    },
    body: JSON.stringify({
      actor_id: actorId,
      add_seconds: addSeconds,
      note: note || "Authorized NO FAKES Act extension",
      authorized_by: authorizedBy || "Elena Rostova (Production Attorney)",
      project_id: projectId
    })
  });
  return res.json();
}

export async function addLikenessPerformer(performerData: any, tenantId: string = "paramount_pictures", projectId?: string) {
  const res = await fetch(`${API_BASE}/likeness/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId
    },
    body: JSON.stringify({ project_id: projectId, ...performerData })
  });
  return res.json();
}

export async function seedLikenessTemplate(template: string = "matrix", tenantId: string = "paramount_pictures", projectId?: string) {
  const res = await fetch(`${API_BASE}/likeness/seed-template`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId
    },
    body: JSON.stringify({ template, project_id: projectId })
  });
  return res.json();
}

export async function exportSagUnionPacket(actorId: string, tenantId: string = "paramount_pictures", projectId?: string) {
  const url = projectId 
    ? `${API_BASE}/likeness/export-packet/${encodeURIComponent(actorId)}?project_id=${encodeURIComponent(projectId)}`
    : `${API_BASE}/likeness/export-packet/${encodeURIComponent(actorId)}`;
  const res = await fetch(url, {
    headers: { "x-tenant-id": tenantId }
  });
  return res.json();
}

export async function recordShotConsumption(actorId: string, shotData: any, tenantId: string = "paramount_pictures", projectId?: string) {
  const res = await fetch(`${API_BASE}/likeness/shot-attribution`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId
    },
    body: JSON.stringify({ actor_id: actorId, project_id: projectId, ...shotData })
  });
  return res.json();
}

export async function remediateSentry(category: string, action: string, tenantId: string = "paramount_pictures") {
  const res = await fetch(`${API_BASE}/sentries/remediate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId
    },
    body: JSON.stringify({ category, action })
  });
  return res.json();
}

export async function dispatchComplianceInpaint(territoryIso: string, tenantId: string = "paramount_pictures", projectId?: string) {
  const res = await fetch(`${API_BASE}/compliance/dispatch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId,
      ...(projectId ? { "x-project-id": projectId } : {})
    },
    body: JSON.stringify({ territory_iso: territoryIso, project_id: projectId })
  });
  return res.json();
}


export async function dispatchEnterpriseMessage(channel: string, message: string) {
  const res = await fetch(`${API_BASE}/enterprise/dispatch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel, message })
  });
  return res.json();
}

export async function sendCopilotMessage(message: string, tenantId: string = "paramount_pictures") {
  const res = await fetch(`${API_BASE}/copilot/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId
    },
    body: JSON.stringify({ message })
  });
  return res.json();
}

export async function fetchSampleTimeline() {
  const res = await fetch(`${API_BASE}/timeline/sample`);
  return res.json();
}

export async function uploadTimelineFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/timeline/upload`, {
    method: "POST",
    body: formData
  });
  return res.json();
}

export async function fetchVoiceNotes() {
  const res = await fetch(`${API_BASE}/voice-notes`);
  return res.json();
}

export async function postVoiceNote(note: any) {
  const res = await fetch(`${API_BASE}/voice-notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note)
  });
  return res.json();
}

export async function fetchStorageQuota(tenantId: string = "paramount_pictures", projectId?: string) {
  const url = projectId 
    ? `${API_BASE}/storage/quota?project_id=${encodeURIComponent(projectId)}`
    : `${API_BASE}/storage/quota`;
  const headers: Record<string, string> = { "x-tenant-id": tenantId };
  if (projectId) headers["x-project-id"] = projectId;
  const res = await fetch(url, { headers });
  return res.json();
}

export async function fetchStorageAssets(tenantId: string = "paramount_pictures", projectId?: string) {
  const url = projectId 
    ? `${API_BASE}/storage/assets?project_id=${encodeURIComponent(projectId)}`
    : `${API_BASE}/storage/assets`;
  const headers: Record<string, string> = { "x-tenant-id": tenantId };
  if (projectId) headers["x-project-id"] = projectId;
  const res = await fetch(url, { headers });
  return res.json();
}

export async function verifyStorageSecurity(tenantId: string = "paramount_pictures") {
  const res = await fetch(`${API_BASE}/storage/security/verify`, {
    method: "POST",
    headers: { "x-tenant-id": tenantId }
  });
  return res.json();
}

export async function rotateStorageKmsKey(tenantId: string = "paramount_pictures") {
  const res = await fetch(`${API_BASE}/storage/security/rotate-key`, {
    method: "POST",
    headers: { "x-tenant-id": tenantId }
  });
  return res.json();
}


export async function fetchTelemetryLogs() {
  const res = await fetch(`${API_BASE}/telemetry/logs?limit=50`);
  return res.json();
}

export async function fetchWarRoomChannels() {
  const res = await fetch(`${API_BASE}/war-room/channels`);
  return res.json();
}

export async function fetchWarRoomMessages(channelId: string = "#on-set-camera-comms") {
  const res = await fetch(`${API_BASE}/war-room/messages?channel_id=${encodeURIComponent(channelId)}`);
  return res.json();
}

export async function sendWarRoomMessage(message: any) {
  const res = await fetch(`${API_BASE}/war-room/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message)
  });
  return res.json();
}

export async function fetchActiveWarRoomMeeting() {
  const res = await fetch(`${API_BASE}/war-room/meetings/active`);
  return res.json();
}

export async function transcribeMeetingAudio(speaker: string, text: string, timecode: string = "01:24:22:10", tenantId: string = "paramount_pictures") {
  const res = await fetch(`${API_BASE}/war-room/meetings/transcribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId
    },
    body: JSON.stringify({ speaker, text, timecode })
  });
  return res.json();
}

export async function generateForensicWatermark(userId: string, assetName: string, tenantId: string = "paramount_pictures") {
  const res = await fetch(`${API_BASE}/war-room/watermark`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId
    },
    body: JSON.stringify({ user_id: userId, asset_name: assetName })
  });
  return res.json();
}

export async function dispatchExternalRelay(platform: string, channel: string, message: string) {
  const res = await fetch(`${API_BASE}/war-room/external-dispatch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ platform, channel, message })
  });
  return res.json();
}

// ----------------- MULTI-STUDIO & PROJECT MANAGEMENT -----------------
export async function fetchStudios() {
  const res = await fetch(`${API_BASE}/studios`);
  return res.json();
}

export async function createStudio(studioData: any) {
  const res = await fetch(`${API_BASE}/studios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(studioData)
  });
  return res.json();
}

export async function fetchProjects(tenantId?: string) {
  const url = tenantId ? `${API_BASE}/projects?tenant_id=${encodeURIComponent(tenantId)}` : `${API_BASE}/projects`;
  const res = await fetch(url);
  return res.json();
}

export async function createProject(projectData: any, tenantId: string = "paramount_pictures") {
  const res = await fetch(`${API_BASE}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId
    },
    body: JSON.stringify({ tenant_id: tenantId, ...projectData })
  });
  return res.json();
}

// ----------------- PRODUCTION SCENES & TAKES STORAGE -----------------
export async function fetchProductionState(tenantId: string = "paramount_pictures", projectId?: string) {
  const url = projectId 
    ? `${API_BASE}/production/state?project_id=${encodeURIComponent(projectId)}`
    : `${API_BASE}/production/state`;
  const res = await fetch(url, {
    headers: { "x-tenant-id": tenantId }
  });
  return res.json();
}

export async function updateProductionState(payload: any, tenantId: string = "paramount_pictures", projectId?: string) {
  const res = await fetch(`${API_BASE}/production/state`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId
    },
    body: JSON.stringify({ project_id: projectId, ...payload })
  });
  return res.json();
}

export async function fetchProductionScenes(tenantId: string = "paramount_pictures", projectId?: string) {
  const url = projectId 
    ? `${API_BASE}/production/scenes?project_id=${encodeURIComponent(projectId)}`
    : `${API_BASE}/production/scenes`;
  const res = await fetch(url, {
    headers: { "x-tenant-id": tenantId }
  });
  return res.json();
}

export async function createProductionScene(payload: any, tenantId: string = "paramount_pictures", projectId?: string) {
  const res = await fetch(`${API_BASE}/production/scenes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId
    },
    body: JSON.stringify({ project_id: projectId, ...payload })
  });
  return res.json();
}

export async function fetchProductionTakes(sceneId?: string, verdict?: string, tenantId: string = "paramount_pictures", projectId?: string) {
  let url = `${API_BASE}/production/takes`;
  const params = new URLSearchParams();
  if (sceneId) params.append("scene_id", sceneId);
  if (verdict) params.append("verdict", verdict);
  if (projectId) params.append("project_id", projectId);
  if (params.toString()) url += `?${params.toString()}`;

  const res = await fetch(url, {
    headers: { "x-tenant-id": tenantId }
  });
  return res.json();
}

export async function recordProductionTake(takeData: any, tenantId: string = "paramount_pictures", projectId?: string) {
  const res = await fetch(`${API_BASE}/production/takes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId
    },
    body: JSON.stringify({ project_id: projectId, ...takeData })
  });
  return res.json();
}

export async function updateProductionTake(takeId: string, updates: any, tenantId: string = "paramount_pictures") {
  const res = await fetch(`${API_BASE}/production/takes/${encodeURIComponent(takeId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId
    },
    body: JSON.stringify(updates)
  });
  return res.json();
}

export async function syncActorTopology(
  actorId: string,
  topologyData: any,
  tenantId: string = "paramount_pictures",
  projectId?: string
) {
  const url = projectId
    ? `${API_BASE}/likeness/${encodeURIComponent(actorId)}/sync-topology?project_id=${encodeURIComponent(projectId)}`
    : `${API_BASE}/likeness/${encodeURIComponent(actorId)}/sync-topology`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": tenantId
    },
    body: JSON.stringify(topologyData)
  });
  return res.json();
}

