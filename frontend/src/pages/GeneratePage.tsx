import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Loader2,
  Music2,
  Mic,
  Clock,
  Gauge,
  Piano,
  Waves,
  Brain,
  Hash,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateMusic, getTaskStatus, audioUrl } from "@/api/client";
import AudioPlayer from "@/components/AudioPlayer";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "by", label: "Беларуская" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ko", label: "한국어" },
];

const KEY_SCALES = [
  "", "C Major", "C Minor", "C# Major", "C# Minor",
  "D Major", "D Minor", "Eb Major", "Eb Minor",
  "E Major", "E Minor", "F Major", "F Minor",
  "F# Major", "F# Minor", "G Major", "G Minor",
  "Ab Major", "Ab Minor", "A Major", "A Minor",
  "Bb Major", "Bb Minor", "B Major", "B Minor",
];

const TIME_SIGNATURES = [
  { value: "", label: "Auto" },
  { value: "2", label: "2/4" },
  { value: "3", label: "3/4" },
  { value: "4", label: "4/4" },
  { value: "6", label: "6/8" },
];

export default function GeneratePage() {
  // Form state
  const [prompt, setPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [duration, setDuration] = useState(60);
  const [bpm, setBpm] = useState(120);
  const [keyScale, setKeyScale] = useState("");
  const [timeSig, setTimeSig] = useState("");
  const [language, setLanguage] = useState("en");
  const [thinking, setThinking] = useState(true);
  const [batchSize, setBatchSize] = useState(2);
  const [steps, setSteps] = useState(8);

  // Pick up lyrics imported from the Lyrics AI page
  useEffect(() => {
    const imported = sessionStorage.getItem("imported_lyrics");
    if (imported) {
      setLyrics(imported);
      sessionStorage.removeItem("imported_lyrics");
    }
  }, []);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  // Poll for task completion
  useEffect(() => {
    if (!taskId) return;

    const poll = async () => {
      try {
        const res = await getTaskStatus(taskId);
        setStatus(res.status);

        if (res.status === "succeeded" && res.audio_urls.length > 0) {
          setAudioUrls(res.audio_urls.map(audioUrl));
          setGenerating(false);
          clearInterval(pollRef.current);
        } else if (res.status === "failed") {
          setError("Generation failed. Try again.");
          setGenerating(false);
          clearInterval(pollRef.current);
        }
      } catch {
        // Keep polling on network errors
      }
    };

    pollRef.current = setInterval(poll, 2000);
    poll(); // Immediate first check

    return () => clearInterval(pollRef.current);
  }, [taskId]);

  const handleGenerate = async () => {
    setError("");
    setAudioUrls([]);
    setGenerating(true);
    setStatus("queued");

    try {
      const res = await generateMusic({
        prompt,
        lyrics,
        duration,
        bpm,
        key_scale: keyScale,
        time_signature: timeSig,
        vocal_language: language,
        thinking,
        batch_size: batchSize,
        inference_steps: steps,
      });
      setTaskId(res.task_id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-neon-pink flex items-center justify-center">
            <Music2 size={20} />
          </div>
          Create Music
        </h2>
        <p className="text-gray-500 mt-1">
          Describe your song and let ACE-Step bring it to life
        </p>
      </div>

      {/* Two-column form */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left: text inputs (3 cols) */}
        <div className="md:col-span-3 space-y-5">
          {/* Prompt */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Sparkles size={14} className="text-accent" />
              Style Description
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Energetic pop rock with electric guitar, catchy melody, upbeat drums..."
              rows={3}
              className="w-full rounded-xl bg-surface-100 border border-surface-200 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-accent/50 focus:ring-1 focus:ring-accent/30 outline-none transition resize-none"
            />
          </div>

          {/* Lyrics */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Mic size={14} className="text-neon-pink" />
              Lyrics
              <span className="text-xs text-gray-600 ml-auto">
                Use [Verse], [Chorus], [Bridge] tags
              </span>
            </label>
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder={`[Verse 1]\nWalking down the city streets at night\nNeon lights reflecting in your eyes\n\n[Chorus]\nWe're alive, we're burning bright\nNothing's gonna stop us tonight`}
              rows={10}
              className="w-full rounded-xl bg-surface-100 border border-surface-200 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-accent/50 focus:ring-1 focus:ring-accent/30 outline-none transition resize-none font-mono leading-relaxed"
            />
          </div>
        </div>

        {/* Right: parameters (2 cols) */}
        <div className="md:col-span-2 space-y-4">
          <div className="glass rounded-2xl p-5 space-y-5">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Parameters
            </h3>

            {/* Duration */}
            <div>
              <label className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="flex items-center gap-1.5"><Clock size={12} /> Duration</span>
                <span className="font-mono text-accent-light">{duration}s</span>
              </label>
              <input
                type="range" min={10} max={300} step={5} value={duration}
                onChange={(e) => setDuration(+e.target.value)}
                className="w-full accent-accent"
              />
            </div>

            {/* BPM */}
            <div>
              <label className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="flex items-center gap-1.5"><Gauge size={12} /> BPM</span>
                <span className="font-mono text-accent-light">{bpm}</span>
              </label>
              <input
                type="range" min={30} max={300} step={1} value={bpm}
                onChange={(e) => setBpm(+e.target.value)}
                className="w-full accent-accent"
              />
            </div>

            {/* Key & Time Signature */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                  <Piano size={12} /> Key
                </label>
                <div className="relative">
                  <select
                    value={keyScale} onChange={(e) => setKeyScale(e.target.value)}
                    className="w-full appearance-none rounded-lg bg-surface-200 border border-surface-300 px-3 py-2 text-xs text-white focus:border-accent/50 outline-none"
                  >
                    <option value="">Auto</option>
                    {KEY_SCALES.filter(Boolean).map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                  <Waves size={12} /> Time Sig
                </label>
                <div className="relative">
                  <select
                    value={timeSig} onChange={(e) => setTimeSig(e.target.value)}
                    className="w-full appearance-none rounded-lg bg-surface-200 border border-surface-300 px-3 py-2 text-xs text-white focus:border-accent/50 outline-none"
                  >
                    {TIME_SIGNATURES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                <Mic size={12} /> Vocal Language
              </label>
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLanguage(l.code)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                      l.code === language
                        ? "bg-accent text-white shadow-[0_0_8px_rgba(139,92,246,0.3)]"
                        : "bg-surface-200 text-gray-400 hover:text-white"
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Thinking toggle */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs text-gray-400">
                <Brain size={12} /> LM Thinking
              </label>
              <button
                onClick={() => setThinking(!thinking)}
                className={cn(
                  "w-10 h-5 rounded-full transition-all relative",
                  thinking ? "bg-accent" : "bg-surface-300"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all",
                    thinking ? "left-5.5" : "left-0.5"
                  )}
                  style={{ left: thinking ? "22px" : "2px" }}
                />
              </button>
            </div>

            {/* Batch size & Steps */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                  <Hash size={12} /> Variants
                </label>
                <div className="flex gap-1">
                  {[1, 2, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setBatchSize(n)}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all",
                        n === batchSize
                          ? "bg-accent text-white"
                          : "bg-surface-200 text-gray-400 hover:text-white"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Steps</span>
                  <span className="font-mono text-accent-light">{steps}</span>
                </label>
                <input
                  type="range" min={1} max={32} step={1} value={steps}
                  onChange={(e) => setSteps(+e.target.value)}
                  className="w-full accent-accent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={generating || (!prompt && !lyrics)}
        className={cn(
          "w-full py-4 rounded-2xl font-semibold text-base transition-all duration-300",
          "flex items-center justify-center gap-3",
          generating
            ? "bg-surface-200 text-gray-500 cursor-wait"
            : "bg-gradient-to-r from-accent via-neon-pink to-accent bg-[length:200%_100%] hover:bg-right text-white shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)]",
          (!prompt && !lyrics) && "opacity-50 cursor-not-allowed"
        )}
      >
        {generating ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            {status === "queued" ? "Waiting in queue..." : "Generating..."}
          </>
        ) : (
          <>
            <Sparkles size={20} />
            Generate Music
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Audio player */}
      {audioUrls.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Music2 size={18} className="text-accent" />
            Results
          </h3>
          <AudioPlayer urls={audioUrls} />
        </div>
      )}
    </div>
  );
}
