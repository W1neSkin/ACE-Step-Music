import { useRef, useEffect, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, SkipBack, SkipForward, Download, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Global event so only one player is active at a time.
// When any player starts, it fires "audioplayer:play" with its id.
// All other players listen and pause themselves.
const PLAY_EVENT = "audioplayer:play";
let playerIdCounter = 0;

interface Props {
  /** List of audio URLs to play */
  urls: string[];
  className?: string;
}

export default function AudioPlayer({ urls, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const playerIdRef = useRef(++playerIdCounter);

  const [playing, setPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const currentUrl = urls[currentIndex] ?? "";

  // Listen for other players starting — pause ourselves
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail;
      if (detail !== playerIdRef.current) {
        wsRef.current?.pause();
      }
    };
    window.addEventListener(PLAY_EVENT, handler);
    return () => window.removeEventListener(PLAY_EVENT, handler);
  }, []);

  /** Stop and destroy a WaveSurfer instance safely */
  const killWs = (ws: WaveSurfer | null) => {
    if (!ws) return;
    try { ws.pause(); } catch { /* already destroyed */ }
    try { ws.destroy(); } catch { /* already destroyed */ }
  };

  // Create WaveSurfer when currentUrl changes, destroy on cleanup
  useEffect(() => {
    if (!containerRef.current || !currentUrl) return;

    // Kill any leftover instance before creating a new one
    killWs(wsRef.current);
    wsRef.current = null;

    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "rgba(139, 92, 246, 0.35)",
      progressColor: "#8b5cf6",
      cursorColor: "#a78bfa",
      cursorWidth: 2,
      height: 64,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
    });

    ws.on("ready", () => setDuration(ws.getDuration()));
    ws.on("audioprocess", () => setCurrentTime(ws.getCurrentTime()));
    ws.on("finish", () => setPlaying(false));
    ws.on("play", () => {
      // Tell all other players to stop
      window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: playerIdRef.current }));
      setPlaying(true);
    });
    ws.on("pause", () => setPlaying(false));

    ws.load(currentUrl);
    wsRef.current = ws;

    return () => {
      killWs(ws);
      if (wsRef.current === ws) wsRef.current = null;
    };
  }, [currentUrl]);

  const toggle = () => wsRef.current?.playPause();
  const prev = () => currentIndex > 0 && setCurrentIndex((i) => i - 1);
  const next = () => currentIndex < urls.length - 1 && setCurrentIndex((i) => i + 1);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (!urls.length) return null;

  return (
    <div className={cn("glass rounded-2xl p-5", className)}>
      {/* Variant selector tabs */}
      {urls.length > 1 && (
        <div className="flex gap-2 mb-4">
          {urls.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all",
                i === currentIndex
                  ? "bg-accent text-white shadow-[0_0_10px_rgba(139,92,246,0.4)]"
                  : "bg-surface-200 text-gray-400 hover:text-white"
              )}
            >
              Variant {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Waveform */}
      <div ref={containerRef} className="w-full mb-4 rounded-lg overflow-hidden" />

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={prev} disabled={currentIndex === 0} className="text-gray-400 hover:text-white disabled:opacity-30 transition">
            <SkipBack size={18} />
          </button>
          <button
            onClick={toggle}
            className="w-10 h-10 rounded-full bg-accent flex items-center justify-center hover:bg-accent-dark transition shadow-[0_0_15px_rgba(139,92,246,0.4)]"
          >
            {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>
          <button onClick={next} disabled={currentIndex === urls.length - 1} className="text-gray-400 hover:text-white disabled:opacity-30 transition">
            <SkipForward size={18} />
          </button>
        </div>

        {/* Time */}
        <span className="text-xs text-gray-500 font-mono tabular-nums">
          {fmt(currentTime)} / {fmt(duration)}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-gray-500" />
          <a
            href={currentUrl}
            download
            className="text-gray-400 hover:text-accent transition"
            title="Download"
          >
            <Download size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
