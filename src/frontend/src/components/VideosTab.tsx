import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Archive, Play, Video, Youtube } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { WikiVideo } from "../types/research";

interface Props {
  videos: WikiVideo[];
  loading: boolean;
  fuzzyUsed?: boolean;
  hasSearched?: boolean;
}

const PAGE_SIZE = 24;
const SKELETON_IDS = ["sk-a", "sk-b", "sk-c", "sk-d", "sk-e", "sk-f"];

const SOURCE_COLORS: Record<string, string> = {
  "Wikimedia Commons": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Internet Archive": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  NASA: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  "Prelinger Archives": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "British Pathé": "bg-red-600/10 text-red-400 border-red-600/20",
  "C-SPAN Archive": "bg-blue-900/10 text-blue-300 border-blue-700/30",
  "Library of Congress": "bg-red-700/10 text-red-500 border-red-700/20",
  DPLA: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "European Film Gateway":
    "bg-emerald-600/10 text-emerald-400 border-emerald-600/20",
  "YouTube (Archived)": "bg-red-500/10 text-red-400 border-red-500/20",
  "YouTube (Public Domain)": "bg-red-600/10 text-red-500 border-red-600/20",
  "Archive Feature Films":
    "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Archive Open Source": "bg-teal-500/10 text-teal-400 border-teal-500/20",
  "Vimeo CC": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Archive Animation": "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Archive Education": "bg-green-500/10 text-green-400 border-green-500/20",
  "Archive News & TV": "bg-slate-500/10 text-slate-400 border-slate-500/20",
  NSF: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "NIH / NLM": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Science.gov": "bg-teal-600/10 text-teal-400 border-teal-600/20",
  NOAA: "bg-blue-600/10 text-blue-400 border-blue-600/20",
  "PBS NewsHour": "bg-blue-800/10 text-blue-300 border-blue-800/30",
  "UC Berkeley": "bg-yellow-600/10 text-yellow-400 border-yellow-600/20",
  "Democracy Now": "bg-pink-600/10 text-pink-400 border-pink-600/20",
  "Classic TV": "bg-stone-500/10 text-stone-300 border-stone-500/20",
  "MIT OpenCourseWare": "bg-red-800/10 text-red-300 border-red-800/20",
  "TED Talks": "bg-rose-600/10 text-rose-400 border-rose-600/20",
  "News & Public Affairs": "bg-slate-600/10 text-slate-300 border-slate-600/20",
};

function isArchiveSource(source: string) {
  return (
    source.startsWith("Archive") ||
    source === "Internet Archive" ||
    source === "Prelinger Archives" ||
    source === "YouTube (Archived)" ||
    source === "C-SPAN Archive"
  );
}

const VIDEO_DIRECT = /\.(mp4|webm|ogg)(\?.*)?$/i;

function VideoPlayer({ video }: { video: WikiVideo }) {
  if (video.embedUrl) {
    const noSandbox =
      isArchiveSource(video.source) || video.embedUrl.includes("archive.org");
    return (
      <iframe
        src={video.embedUrl}
        className="w-full aspect-video"
        style={{ maxHeight: "500px" }}
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        {...(!noSandbox && {
          sandbox:
            "allow-scripts allow-same-origin allow-presentation allow-popups allow-forms allow-pointer-lock",
        })}
        title={video.title}
      />
    );
  }
  if (VIDEO_DIRECT.test(video.url)) {
    return (
      // biome-ignore lint/a11y/useMediaCaption: public domain video source may not have captions
      <video
        key={video.url}
        controls
        className="w-full aspect-video"
        style={{ maxHeight: "500px" }}
      >
        <source src={video.url} type={video.mime} />
        Your browser does not support this video format.
      </video>
    );
  }
  // Fallback: thumbnail + external link
  return (
    <div className="w-full aspect-video flex flex-col items-center justify-center bg-black/60 rounded-lg gap-3 p-4">
      {video.thumbUrl && (
        <img
          src={video.thumbUrl}
          alt={video.title}
          className="max-h-48 max-w-full object-contain rounded opacity-80"
        />
      )}
      <a
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary/80 hover:bg-primary text-primary-foreground rounded-lg text-sm font-medium transition-colors"
      >
        Watch on {video.source} ↗
      </a>
    </div>
  );
}

function VideoThumb({ video }: { video: WikiVideo }) {
  return (
    <div className="flex-shrink-0 w-14 h-10 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
      {video.thumbUrl ? (
        <img
          src={video.thumbUrl}
          alt={video.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <Play className="w-5 h-5 text-muted-foreground" />
      )}
    </div>
  );
}

function VideoCard({
  video,
  index,
  isActive,
  onClick,
  ocidPrefix,
}: {
  video: WikiVideo;
  index: number;
  isActive: boolean;
  onClick: () => void;
  ocidPrefix: string;
}) {
  return (
    <motion.div
      key={video.pageid}
      data-ocid={`${ocidPrefix}.item.${index}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.6) }}
      className={`video-thumb bg-card border border-border/60 rounded-xl p-3 flex gap-3 items-start cursor-pointer ${
        isActive ? "active" : ""
      }`}
      onClick={onClick}
    >
      <VideoThumb video={video} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
          {video.title}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <p className="text-xs text-muted-foreground font-mono uppercase">
            {video.mime.split("/")[1]}
          </p>
          <Badge
            variant="outline"
            className={`text-[10px] py-0 px-1.5 border ${
              SOURCE_COLORS[video.source] ?? "bg-muted/50 text-muted-foreground"
            }`}
          >
            {video.source}
          </Badge>
        </div>
      </div>
    </motion.div>
  );
}

function SourceFilters({
  sources,
  disabled,
  onToggle,
}: {
  sources: string[];
  disabled: Set<string>;
  onToggle: (source: string) => void;
}) {
  if (sources.length <= 1) return null;
  return (
    <div
      data-ocid="videos.source_filters"
      className="flex flex-wrap gap-2 pb-2"
    >
      <span className="text-xs text-muted-foreground self-center mr-1">
        Sources:
      </span>
      {sources.map((source) => {
        const active = !disabled.has(source);
        const colorClass =
          SOURCE_COLORS[source] ?? "bg-muted/50 text-muted-foreground";
        return (
          <button
            key={source}
            type="button"
            data-ocid={"videos.filter.toggle"}
            onClick={() => onToggle(source)}
            className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium transition-all ${
              active
                ? colorClass
                : "bg-transparent text-muted-foreground/40 border-border/30 line-through"
            }`}
          >
            {source}
          </button>
        );
      })}
    </div>
  );
}

export function VideosTab({ videos, loading, fuzzyUsed, hasSearched }: Props) {
  const [selected, setSelected] = useState<WikiVideo | null>(null);
  const [disabledSources, setDisabledSources] = useState<Set<string>>(
    new Set(),
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on new search
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [videos]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => c + PAGE_SIZE);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const allSources = useMemo(
    () => Array.from(new Set(videos.map((v) => v.source))).sort(),
    [videos],
  );

  const toggleSource = (source: string) => {
    setDisabledSources((prev) => {
      const next = new Set(prev);
      if (next.has(source)) next.delete(source);
      else next.add(source);
      return next;
    });
  };

  const filteredVideos = useMemo(
    () => videos.filter((v) => !disabledSources.has(v.source)),
    [videos, disabledSources],
  );

  const ytArchivedVideos = filteredVideos.filter(
    (v) => v.source === "YouTube (Archived)",
  );
  const ytPublicDomainVideos = filteredVideos.filter(
    (v) => v.source === "YouTube (Public Domain)",
  );
  const regularVideos = filteredVideos.filter(
    (v) =>
      v.source !== "YouTube (Archived)" &&
      v.source !== "YouTube (Public Domain)",
  );

  const visibleRegular = regularVideos.slice(0, visibleCount);
  const hasMore = visibleCount < regularVideos.length;

  const allFiltered = [
    ...ytPublicDomainVideos,
    ...ytArchivedVideos,
    ...regularVideos,
  ];

  const activeVideo =
    selected && !disabledSources.has(selected.source)
      ? selected
      : (allFiltered[0] ?? null);

  if (loading) {
    return (
      <div data-ocid="search.loading_state" className="space-y-4">
        <Skeleton className="w-full aspect-video rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SKELETON_IDS.map((id) => (
            <Skeleton key={id} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!hasSearched && !loading) {
    return (
      <div
        data-ocid="videos.empty_state"
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="text-5xl mb-4">🎬</div>
        <p
          className="font-display text-xl font-semibold mb-2"
          style={{ color: "oklch(0.85 0.04 240)" }}
        >
          Search for Videos
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Internet Archive, NASA, C-SPAN, TED Talks & more
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {["Space", "History", "Science", "Nature"].map((chip) => (
            <button
              key={chip}
              type="button"
              data-ocid="videos.tab"
              className="px-4 py-2 rounded-full text-sm border transition-colors"
              style={{
                borderColor: "oklch(0.4 0.08 55)",
                color: "oklch(0.72 0.1 55)",
                background: "oklch(0.18 0.04 260 / 0.5)",
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div
        data-ocid="videos.empty_state"
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <Video className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground text-lg font-display">
          No videos found
        </p>
        <p className="text-muted-foreground/60 text-sm mt-1">
          Try searching for a topic that might have video content
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {fuzzyUsed && (
        <p className="text-xs text-muted-foreground/70 italic">
          Showing related results
        </p>
      )}

      <SourceFilters
        sources={allSources}
        disabled={disabledSources}
        onToggle={toggleSource}
      />

      {/* Main video player */}
      {activeVideo && (
        <motion.div
          data-ocid="videos.player"
          key={activeVideo.pageid}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden border border-border/60 bg-black"
        >
          <VideoPlayer video={activeVideo} />
          <div className="p-4 bg-card">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-semibold text-base text-foreground flex-1">
                {activeVideo.title}
              </h3>
              <Badge
                variant="outline"
                className={`text-xs shrink-0 border ${
                  SOURCE_COLORS[activeVideo.source] ??
                  "bg-muted/50 text-muted-foreground"
                }`}
              >
                {activeVideo.source}
              </Badge>
            </div>
            {activeVideo.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {activeVideo.description}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* YouTube Public Domain section */}
      {ytPublicDomainVideos.length > 0 && (
        <motion.section
          data-ocid="videos.youtube_pd.section"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-red-600/25 bg-red-600/5 p-4 space-y-3"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Youtube className="w-4 h-4 text-red-500" />
              <h4 className="font-display font-semibold text-sm text-foreground">
                Public Domain Films on YouTube
              </h4>
            </div>
            <Badge
              variant="outline"
              className="ml-auto text-[10px] border-red-600/30 text-red-500 bg-red-600/10"
            >
              {ytPublicDomainVideos.length} film
              {ytPublicDomainVideos.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
            {ytPublicDomainVideos.map((video, idx) => (
              <motion.div
                key={video.pageid}
                data-ocid={`videos.youtube_pd.item.${idx + 1}`}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex-shrink-0 w-56 bg-card border rounded-xl p-3 flex gap-2.5 items-start cursor-pointer transition-colors hover:border-red-600/40 ${
                  activeVideo?.pageid === video.pageid
                    ? "border-red-600/50 bg-red-600/5"
                    : "border-border/60"
                }`}
                onClick={() => setSelected(video)}
              >
                <div className="flex-shrink-0 w-12 h-9 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {video.thumbUrl ? (
                    <img
                      src={video.thumbUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Youtube className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground line-clamp-3 leading-tight">
                    {video.title}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* YouTube Archived section */}
      {ytArchivedVideos.length > 0 && (
        <motion.section
          data-ocid="videos.youtube_archived.section"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 space-y-3"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Youtube className="w-4 h-4 text-red-400" />
              <h4 className="font-display font-semibold text-sm text-foreground">
                Preserved from YouTube
              </h4>
            </div>
            <div className="flex items-center gap-1.5">
              <Archive className="w-3 h-3 text-muted-foreground/60" />
              <span className="text-[10px] text-muted-foreground/60 font-mono uppercase tracking-wider">
                Removed / archived on Internet Archive
              </span>
            </div>
            <Badge
              variant="outline"
              className="ml-auto text-[10px] border-red-500/30 text-red-400 bg-red-500/10"
            >
              {ytArchivedVideos.length} video
              {ytArchivedVideos.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
            {ytArchivedVideos.map((video, idx) => (
              <motion.div
                key={video.pageid}
                data-ocid={`videos.youtube_archived.item.${idx + 1}`}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex-shrink-0 w-56 bg-card border rounded-xl p-3 flex gap-2.5 items-start cursor-pointer transition-colors hover:border-red-500/40 ${
                  activeVideo?.pageid === video.pageid
                    ? "border-red-500/50 bg-red-500/5"
                    : "border-border/60"
                }`}
                onClick={() => setSelected(video)}
              >
                <div className="flex-shrink-0 w-12 h-9 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {video.thumbUrl ? (
                    <img
                      src={video.thumbUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Youtube className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground line-clamp-3 leading-tight">
                    {video.title}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Main grid — regular videos */}
      {regularVideos.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleRegular.map((video, idx) => (
              <VideoCard
                key={video.pageid}
                video={video}
                index={idx + 1}
                isActive={activeVideo?.pageid === video.pageid}
                onClick={() => setSelected(video)}
                ocidPrefix="videos"
              />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          {hasMore && (
            <div ref={sentinelRef} className="h-10" aria-hidden="true" />
          )}
        </div>
      )}

      {allFiltered.length === 0 && (
        <div
          data-ocid="videos.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <Video className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">All sources filtered out</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Re-enable a source above to see results
          </p>
        </div>
      )}
    </div>
  );
}
