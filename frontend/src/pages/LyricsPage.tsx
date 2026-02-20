import { useState } from "react";
import { PenLine, Sparkles, Loader2, ArrowRight, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateLyrics } from "@/api/client";
import { useNavigate } from "react-router-dom";

const LANG_TABS = [
  { code: "en", label: "English", flag: "EN" },
  { code: "ru", label: "Русский", flag: "RU" },
  { code: "by", label: "Беларуская", flag: "BY" },
];

const GENRES = [
  "Pop", "Rock", "Hip-Hop", "R&B", "Electronic", "Jazz",
  "Country", "Folk", "Metal", "Indie", "Classical", "Reggae",
];

const MOODS = [
  "Happy", "Sad", "Energetic", "Calm", "Romantic", "Angry",
  "Nostalgic", "Dreamy", "Dark", "Uplifting", "Melancholic",
];

export default function LyricsPage() {
  const navigate = useNavigate();

  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState("");
  const [genre, setGenre] = useState("Pop");
  const [mood, setMood] = useState("Happy");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!theme.trim()) return;
    setError("");
    setResult("");
    setLoading(true);

    try {
      const res = await generateLyrics({ theme, language, genre, mood });
      setResult(res.lyrics);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate lyrics");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /** Send lyrics to the generate page via session storage */
  const handleUseInGenerator = () => {
    sessionStorage.setItem("imported_lyrics", result);
    navigate("/");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-pink to-accent flex items-center justify-center">
            <PenLine size={20} />
          </div>
          Lyrics AI
        </h2>
        <p className="text-gray-500 mt-1">
          Generate song lyrics in English, Russian, or Belarusian using Qwen 2.5
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: input form */}
        <div className="space-y-5">
          {/* Language tabs */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Language</label>
            <div className="flex gap-2">
              {LANG_TABS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all flex-1",
                    l.code === language
                      ? "bg-accent text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                      : "glass glass-hover text-gray-400"
                  )}
                >
                  <span className="text-xs opacity-60 mr-1">{l.flag}</span> {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Theme / Topic</label>
            <input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g. Lost love on a rainy night, Road trip freedom, Childhood memories..."
              className="w-full rounded-xl bg-surface-100 border border-surface-200 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-accent/50 focus:ring-1 focus:ring-accent/30 outline-none transition"
            />
          </div>

          {/* Genre */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Genre</label>
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    g === genre
                      ? "bg-neon-pink/20 text-neon-pink border border-neon-pink/30"
                      : "bg-surface-200 text-gray-400 hover:text-white"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Mood</label>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    m === mood
                      ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30"
                      : "bg-surface-200 text-gray-400 hover:text-white"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !theme.trim()}
            className={cn(
              "w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
              loading
                ? "bg-surface-200 text-gray-500 cursor-wait"
                : "bg-gradient-to-r from-neon-pink to-accent text-white shadow-[0_0_20px_rgba(236,72,153,0.25)] hover:shadow-[0_0_30px_rgba(236,72,153,0.4)]",
              !theme.trim() && "opacity-50 cursor-not-allowed"
            )}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Generating...</>
            ) : (
              <><Sparkles size={16} /> Generate Lyrics</>
            )}
          </button>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Right: result */}
        <div>
          {result ? (
            <div className="glass rounded-2xl p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-300">Generated Lyrics</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-200 text-xs text-gray-400 hover:text-white transition"
                  >
                    {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={handleUseInGenerator}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/20 text-xs text-accent-light hover:bg-accent/30 transition"
                  >
                    Use in Generator <ArrowRight size={12} />
                  </button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-gray-200 font-mono leading-relaxed max-h-[500px] overflow-y-auto">
                {result}
              </pre>
            </div>
          ) : (
            <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
              <PenLine size={48} className="text-surface-300 mb-4" />
              <p className="text-gray-500 text-sm">
                Your generated lyrics will appear here
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Enter a theme and click Generate
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
