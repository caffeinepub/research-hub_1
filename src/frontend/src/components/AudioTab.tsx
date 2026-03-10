import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Music, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { AudioResult } from "../types/research";

interface Props {
  audio: AudioResult[];
  loading: boolean;
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
};

export function AudioTab({ audio, loading }: Props) {
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
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ))}
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
          Try searching for music, audiobooks, or radio
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visibleAudio.map((item, idx) => (
        <AnimatePresence key={item.id} mode="wait">
          <motion.div
            data-ocid={`audio.item.${idx + 1}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.3 }}
            className="rounded-xl border border-border/60 bg-card overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-start gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: "oklch(0.55 0.18 280 / 0.15)",
                    border: "1px solid oklch(0.55 0.18 280 / 0.3)",
                  }}
                >
                  <Music
                    className="w-5 h-5"
                    style={{ color: "oklch(0.72 0.18 280)" }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <h3 className="font-display font-semibold text-sm leading-snug text-foreground flex-1 min-w-0">
                      {item.title}
                    </h3>
                    <Badge
                      variant="outline"
                      className={`text-[10px] shrink-0 border ${SOURCE_COLORS[item.source] ?? "bg-muted/50 text-muted-foreground"}`}
                    >
                      {item.source}
                    </Badge>
                  </div>
                  {item.creator && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <User className="w-3 h-3" /> {item.creator}
                      {item.year && <span className="ml-1">· {item.year}</span>}
                    </p>
                  )}
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-ocid={`audio.toggle.${idx + 1}`}
                  className="h-8 text-xs"
                  onClick={() =>
                    setPlayingId(playingId === item.id ? null : item.id)
                  }
                >
                  {playingId === item.id ? "Hide Player" : "▶ Play"}
                </Button>
                <a
                  href={item.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-ocid={`audio.download_button.${idx + 1}`}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download / Details
                </a>
              </div>
            </div>

            <AnimatePresence>
              {playingId === item.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden border-t border-border/60"
                >
                  <iframe
                    src={item.embedUrl}
                    title={item.title}
                    width="100%"
                    height="120"
                    frameBorder="0"
                    allow="autoplay; fullscreen"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    className="block"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      ))}

      {visibleCount < audio.length && (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            data-ocid="audio.pagination_next"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="min-w-[140px]"
          >
            Load More
            <span className="ml-2 text-xs text-muted-foreground">
              ({audio.length - visibleCount} remaining)
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
