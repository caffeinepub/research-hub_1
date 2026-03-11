import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Music, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { AudioResult } from "../types/research";
import { SensitiveContentBlur } from "./SensitiveContentBlur";

interface Props {
  audio: AudioResult[];
  loading: boolean;
  hasSearched?: boolean;
}

const PAGE_SIZE = 10;
const SKELETON_IDS = ["sk-a", "sk-b", "sk-c", "sk-d", "sk-e"];

const SOURCE_COLORS: Record<string, string> = {
  "Live Concerts (etree)":
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  LibriVox: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Archive Audio": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Old Time Radio": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "78rpm Records": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Archive.org": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Archive Music": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Folk Music": "bg-green-500/10 text-green-400 border-green-500/20",
  Podcasts: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  "Radio Broadcasts": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "Vintage Recordings": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

const TOPIC_CHIPS = [
  { label: "Jazz", query: "jazz" },
  { label: "Classical", query: "classical music" },
  { label: "Podcasts", query: "podcast" },
  { label: "Radio", query: "radio" },
];

export function AudioTab({ audio, loading, hasSearched }: Props) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on new search
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setPlayingId(null);
  }, [audio]);

  const visibleAudio = audio.slice(0, visibleCount);

  if (loading) {
    return (
      <div data-ocid="audio.loading_state" className="space-y-4">
        {SKELETON_IDS.map((id) => (
          <div
            key={id}
            className="rounded-xl border border-border/60 p-5 space-y-3"
          >
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div
        data-ocid="audio.empty_state"
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="text-5xl mb-4">🎵</div>
        <p
          className="font-display text-xl font-semibold mb-2"
          style={{ color: "oklch(0.85 0.04 240)" }}
        >
          Search for Audio & Music
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Internet Archive, LibriVox, Live Concerts & more
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {TOPIC_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              data-ocid="audio.tab"
              className="px-4 py-2 rounded-full text-sm border transition-colors"
              style={{
                borderColor: "oklch(0.4 0.08 160)",
                color: "oklch(0.72 0.1 160)",
                background: "oklch(0.18 0.04 260 / 0.5)",
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (audio.length === 0) {
    return (
      <div
        data-ocid="audio.empty_state"
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <Music className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground text-lg font-display">
          No audio found
        </p>
        <p className="text-muted-foreground/60 text-sm mt-1">
          Try searching for music, podcasts, or radio
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {visibleAudio.map((track, idx) => (
          <motion.div
            key={`${track.id}-${idx}`}
            data-ocid={`audio.item.${idx + 1}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.04, 0.4), duration: 0.3 }}
            className="rounded-xl border border-border/60 p-5"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <SensitiveContentBlur label={track.title}>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-display font-semibold text-base text-foreground truncate">
                      {track.title}
                    </h3>
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 border ${
                        SOURCE_COLORS[track.source] ??
                        "bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      {track.source}
                    </Badge>
                  </div>
                  {track.creator && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {Array.isArray(track.creator)
                        ? track.creator[0]
                        : track.creator}
                    </p>
                  )}
                </SensitiveContentBlur>
              </div>
              {track.downloadUrl && (
                <a
                  href={track.downloadUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg shrink-0"
                  style={{
                    background: "oklch(0.52 0.18 220 / 0.15)",
                    color: "oklch(0.65 0.12 220)",
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {playingId === track.id ? (
              <div className="space-y-2">
                {track.embedUrl ? (
                  <iframe
                    src={track.embedUrl}
                    className="w-full rounded-lg"
                    style={{ height: "120px", border: "none" }}
                    title={track.title}
                    allow="autoplay"
                  />
                ) : track.downloadUrl ? (
                  <p className="text-xs text-muted-foreground">
                    <a
                      href={track.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                      style={{ color: "oklch(0.65 0.16 220)" }}
                    >
                      Open on Archive.org
                    </a>
                  </p>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPlayingId(null)}
                  className="text-xs text-muted-foreground"
                >
                  Close player
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                data-ocid={`audio.item.${idx + 1}.button`}
                size="sm"
                onClick={() => setPlayingId(track.id)}
                className="w-full"
                style={{
                  background: "oklch(0.52 0.18 150 / 0.15)",
                  color: "oklch(0.72 0.15 150)",
                  border: "1px solid oklch(0.52 0.18 150 / 0.3)",
                }}
              >
                <Music className="w-4 h-4 mr-2" />
                Play
              </Button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {visibleCount < audio.length && (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            data-ocid="audio.pagination_next"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          >
            Load More ({audio.length - visibleCount} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
