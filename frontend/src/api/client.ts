/**
 * API client — all backend communication goes through these functions.
 * In dev (port 3000) calls the backend on port 8000 directly, bypassing
 * the Vite proxy which breaks Firefox on long requests.
 * In production (any other port) uses relative "/api" paths.
 */

const API_HOST =
  window.location.port === "3000"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "";

const BASE = `${API_HOST}/api`;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

// ---------- Music ----------

export interface GenerateParams {
  prompt: string;
  lyrics: string;
  duration: number | null;
  bpm: number | null;
  key_scale: string;
  time_signature: string;
  vocal_language: string;
  thinking: boolean;
  batch_size: number;
  inference_steps: number;
}

export interface GenerateResult {
  id: number;
  task_id: string;
  status: string;
}

export interface TaskStatus {
  task_id: string;
  status: string;
  audio_urls: string[];
  generation_meta: Record<string, unknown> | null;
}

export function generateMusic(params: GenerateParams) {
  return request<GenerateResult>("/music/generate", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function getTaskStatus(taskId: string) {
  return request<TaskStatus>(`/music/status/${taskId}`);
}

/** Build full audio URL for an audio path returned by the status endpoint */
export function audioUrl(path: string): string {
  return `${BASE}${path}`;
}

// ---------- Lyrics ----------

export interface LyricsParams {
  theme: string;
  language: string;
  genre: string;
  mood: string;
}

export interface LyricsResult {
  lyrics: string;
  language: string;
}

export function generateLyrics(params: LyricsParams) {
  return request<LyricsResult>("/lyrics/generate", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// ---------- History ----------

export interface GenerationItem {
  id: number;
  task_id: string;
  status: string;
  prompt: string;
  lyrics: string;
  duration: number | null;
  bpm: number | null;
  key_scale: string;
  vocal_language: string;
  audio_urls: string[];
  created_at: string;
  completed_at: string | null;
}

export interface HistoryResult {
  items: GenerationItem[];
  total: number;
}

export function getHistory(page = 1, pageSize = 20) {
  return request<HistoryResult>(`/history?page=${page}&page_size=${pageSize}`);
}

export function deleteGeneration(id: number) {
  return request<{ ok: boolean }>(`/history/${id}`, { method: "DELETE" });
}

// ---------- Health ----------

export interface HealthResult {
  status: string;
  acestep: boolean;
  ollama: boolean;
}

export function getHealth() {
  return request<HealthResult>("/health");
}
