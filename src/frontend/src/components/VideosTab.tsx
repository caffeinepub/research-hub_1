import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Archive, Play, Video, Youtube } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { WikiVideo } from "../types/research";
import { SensitiveContentBlur } from "./SensitiveContentBlur";

interface Props {
  videos: WikiVideo[];
  loading: boolean;
  fuzzyUsed?: boolean;
  hasSearched?: boolean;
  query?: string;
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
  Dailymotion: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Reddit: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "News & Public Affairs": "bg-slate-600/10 text-slate-300 border-slate-600/20",
  Odysee: "bg-lime-500/10 text-lime-400 border-lime-500/20",
  PeerTube: "bg-orange-600/10 text-orange-300 border-orange-600/20",
  "Free Movies": "bg-cyan-600/10 text-cyan-400 border-cyan-600/20",
  "Mystery & Sci-Fi": "bg-violet-600/10 text-violet-400 border-violet-600/20",
  "Film Noir": "bg-stone-400/10 text-stone-300 border-stone-400/20",
  Newsreels: "bg-yellow-700/10 text-yellow-400 border-yellow-700/20",
  "Instructional Films": "bg-green-700/10 text-green-400 border-green-700/20",
  "NFL Films": "bg-green-600/10 text-green-300 border-green-600/20",
  "Live Concerts": "bg-pink-600/10 text-pink-400 border-pink-600/20",
  "Open Culture": "bg-teal-400/10 text-teal-300 border-teal-400/20",
  "Vimeo Archive": "bg-cyan-600/10 text-cyan-400 border-cyan-600/20",
  "PeerTube (Framatube)":
    "bg-orange-500/10 text-orange-300 border-orange-500/20",
  "Archive Documentary":
    "bg-emerald-700/10 text-emerald-400 border-emerald-700/20",
  "Archive Science": "bg-blue-700/10 text-blue-400 border-blue-700/20",
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
  // If it looks like a direct video file, use <video>
  const isDirectVideo = /\.(mp4|webm|ogg|ogv)(\?|$)/i.test(video.url);
  if (isDirectVideo) {
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
  // Fallback: show a watch button for sources that block embedding
  return (
    <div className="w-full aspect-video bg-black/80 flex flex-col items-center justify-center gap-4 p-6">
      {video.thumbUrl && (
        <img
          src={video.thumbUrl}
          alt={video.title}
          className="max-h-32 object-contain rounded-lg opacity-60"
        />
      )}
      <p className="text-white/70 text-sm text-center line-clamp-2">
        {video.title}
      </p>
      <button
        type="button"
        onClick={() => window.open(video.url, "_blank")}
        className="px-6 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium border border-white/20 transition-colors"
      >
        Watch on {video.source} ↗
      </button>
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
        <SensitiveContentBlur label={video.title}>
          <p className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
            {video.title}
          </p>
        </SensitiveContentBlur>
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

export function VideosTab({
  videos,
  loading,
  fuzzyUsed,
  hasSearched,
  query,
}: Props) {
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

  const [localVideos, setLocalVideos] = useState<WikiVideo[]>([]);

  useEffect(() => {
    if (!query) {
      setLocalVideos([]);
      return;
    }
    const controller = new AbortController();
    (async () => {
      const results: WikiVideo[] = [];
      await Promise.allSettled([
        fetch(
          `https://api.dailymotion.com/videos?search=${encodeURIComponent(query)}&fields=id,title,thumbnail_url,embed_url&limit=20&sort=relevance`,
          { signal: controller.signal },
        )
          .then((r) => r.json())
          .then((dmData) => {
            const dmVideos: WikiVideo[] = (dmData.list ?? []).map((v: any) => ({
              pageid: v.id,
              title: v.title,
              url: `https://www.dailymotion.com/video/${v.id}`,
              embedUrl:
                v.embed_url ||
                `https://www.dailymotion.com/embed/video/${v.id}`,
              thumbUrl: v.thumbnail_url,
              mime: "video/mp4",
              source: "Dailymotion",
              description: "",
              sensitive: false,
            }));
            results.push(...dmVideos);
          })
          .catch(() => {}),
        fetch(
          `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&type=link&sort=top&limit=25`,
          {
            headers: { Accept: "application/json" },
            signal: controller.signal,
          },
        )
          .then((r) => r.json())
          .then((redditData) => {
            const redditVideos: WikiVideo[] = (redditData?.data?.children ?? [])
              .filter(
                (c: any) =>
                  c.data.is_video || c.data.url?.includes("v.redd.it"),
              )
              .map((c: any) => ({
                pageid: c.data.id,
                title: c.data.title,
                url: c.data.url,
                embedUrl: c.data.media?.reddit_video?.fallback_url ?? "",
                thumbUrl: c.data.thumbnail !== "self" ? c.data.thumbnail : "",
                mime: "video/mp4",
                source: "Reddit",
                description: c.data.subreddit_name_prefixed ?? "",
                sensitive: false,
              }))
              .filter((v: WikiVideo) => v.embedUrl);
            results.push(...redditVideos);
          })
          .catch(() => {}),
        // Vimeo via Archive.org
        fetch(
          `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+vimeo&mediatype=movies&output=json&rows=5&fl[]=identifier,title`,
          { signal: controller.signal },
        )
          .then((r) => r.json())
          .then((data) => {
            const vs: WikiVideo[] = (data?.response?.docs ?? []).map(
              (d: any) => ({
                pageid: d.identifier,
                title: d.title || d.identifier,
                url: `https://archive.org/details/${d.identifier}`,
                embedUrl: `https://archive.org/embed/${d.identifier}`,
                thumbUrl: `https://archive.org/services/img/${d.identifier}`,
                mime: "video/mp4",
                source: "Vimeo Archive",
                description: "",
                sensitive: false,
              }),
            );
            results.push(...vs);
          })
          .catch(() => {}),
        // PeerTube (Framatube)
        fetch(
          `https://framatube.org/api/v1/search/videos?search=${encodeURIComponent(query)}&count=5`,
          { signal: controller.signal },
        )
          .then((r) => r.json())
          .then((data) => {
            const vs: WikiVideo[] = (data?.data ?? []).map((v: any) => ({
              pageid: v.id?.toString() || v.uuid,
              title: v.name,
              url: `https://framatube.org/w/${v.uuid}`,
              embedUrl: `https://framatube.org/videos/embed/${v.uuid}`,
              thumbUrl: v.thumbnailPath
                ? `https://framatube.org${v.thumbnailPath}`
                : "",
              mime: "video/mp4",
              source: "PeerTube (Framatube)",
              description: v.description || "",
              sensitive: false,
            }));
            results.push(...vs);
          })
          .catch(() => {}),
        // Archive Documentary
        fetch(
          `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+documentary&mediatype=movies&output=json&rows=5&fl[]=identifier,title`,
          { signal: controller.signal },
        )
          .then((r) => r.json())
          .then((data) => {
            const vs: WikiVideo[] = (data?.response?.docs ?? []).map(
              (d: any) => ({
                pageid: `doc-${d.identifier}`,
                title: d.title || d.identifier,
                url: `https://archive.org/details/${d.identifier}`,
                embedUrl: `https://archive.org/embed/${d.identifier}`,
                thumbUrl: `https://archive.org/services/img/${d.identifier}`,
                mime: "video/mp4",
                source: "Archive Documentary",
                description: "",
                sensitive: false,
              }),
            );
            results.push(...vs);
          })
          .catch(() => {}),
      ]);
      setLocalVideos(results);
    })();
    return () => controller.abort();
  }, [query]);

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

  const combinedVideos = useMemo(() => {
    const seen = new Set<string | number>();
    const merged: WikiVideo[] = [];
    for (const v of [...videos, ...localVideos]) {
      if (!seen.has(v.pageid)) {
        seen.add(v.pageid);
        merged.push(v);
      }
    }
    return merged;
  }, [videos, localVideos]);

  const allSources = useMemo(
    () => Array.from(new Set(combinedVideos.map((v) => v.source))).sort(),
    [combinedVideos],
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
    () => combinedVideos.filter((v) => !disabledSources.has(v.source)),
    [combinedVideos, disabledSources],
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

      {query && (
        <div className="mb-2 p-3 rounded-lg border border-orange-500/20 bg-orange-500/5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-white font-medium">Rumble</span>
            <span className="text-muted-foreground text-sm ml-2 truncate">
              Search "{query}" on Rumble
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
            onClick={() =>
              window.open(
                `https://rumble.com/search/video?q=${encodeURIComponent(query)}`,
                "_blank",
              )
            }
          >
            Watch
          </Button>
        </div>
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
