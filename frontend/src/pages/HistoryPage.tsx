import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Music2, Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getHistory, deleteGeneration, audioUrl, type GenerationItem } from "@/api/client";
import AudioPlayer from "@/components/AudioPlayer";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    succeeded: "bg-green-500/15 text-green-400 border-green-500/30",
    failed: "bg-red-500/15 text-red-400 border-red-500/30",
    queued: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    running: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border", colors[status] || colors.queued)}>
      {status}
    </span>
  );
}

function GenerationCard({
  item,
  expanded,
  onToggle,
  onDelete,
}: {
  item: GenerationItem;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const date = new Date(item.created_at).toLocaleString();

  return (
    <div className="glass rounded-2xl overflow-hidden transition-all">
      {/* Card header — always visible */}
      <button onClick={onToggle} className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-surface-200/30 transition">
        <div className="w-10 h-10 rounded-xl bg-surface-200 flex items-center justify-center shrink-0">
          <Music2 size={18} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.prompt || "Untitled"}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {date} &middot; {item.duration ? `${item.duration}s` : ""} &middot; {item.vocal_language.toUpperCase()}
          </p>
        </div>
        <StatusBadge status={item.status} />
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-surface-200/50 pt-4">
          {/* Metadata chips */}
          <div className="flex flex-wrap gap-2 text-xs">
            {item.bpm && (
              <span className="px-2 py-1 rounded-lg bg-surface-200 text-gray-400">{item.bpm} BPM</span>
            )}
            {item.key_scale && (
              <span className="px-2 py-1 rounded-lg bg-surface-200 text-gray-400">{item.key_scale}</span>
            )}
          </div>

          {/* Lyrics preview */}
          {item.lyrics && (
            <pre className="text-xs text-gray-500 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto bg-surface-50 rounded-lg p-3">
              {item.lyrics}
            </pre>
          )}

          {/* Audio player */}
          {item.audio_urls.length > 0 && (
            <AudioPlayer urls={item.audio_urls.map(audioUrl)} />
          )}

          {/* Delete */}
          <div className="flex justify-end">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const pageSize = 15;

  const { data, isLoading } = useQuery({
    queryKey: ["history", page],
    queryFn: () => getHistory(page, pageSize),
  });

  const deleteMut = useMutation({
    mutationFn: deleteGeneration,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["history"] }),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-neon-cyan flex items-center justify-center">
            <Clock size={20} />
          </div>
          History
        </h2>
        <p className="text-gray-500 mt-1">
          {total} generation{total !== 1 ? "s" : ""} total
        </p>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      ) : items.length === 0 ? (
        <div className="glass rounded-2xl p-12 flex flex-col items-center text-center">
          <Clock size={48} className="text-surface-300 mb-4" />
          <p className="text-gray-500 text-sm">No generations yet</p>
          <p className="text-gray-600 text-xs mt-1">Create your first song on the Generate page</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <GenerationCard
              key={item.id}
              item={item}
              expanded={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
              onDelete={() => deleteMut.mutate(item.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-surface-200 text-gray-400 hover:text-white disabled:opacity-30 transition"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-surface-200 text-gray-400 hover:text-white disabled:opacity-30 transition"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
