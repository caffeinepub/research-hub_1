import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clapperboard, Play, Youtube } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import type { WikiVideo } from "../types/research";

interface Props {
  films: WikiVideo[];
  loading: boolean;
  fuzzyUsed?: boolean;
  hasSearched?: boolean;
}

const PAGE_SIZE = 12;
const SKELETON_IDS = ["sk-a", "sk-b", "sk-c", "sk-d", "sk-e", "sk-f"];

const SOURCE_COLORS: Record<string, string> = {
  "YouTube (Public Domain)": "bg-red-600/10 text-red-400 border-red-600/20",
  "Archive Feature Films":
    "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Archive Open Source": "bg-teal-500/10 text-teal-400 border-teal-500/20",
  "Prelinger Archives": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "British Pathé": "bg-red-700/10 text-red-500 border-red-700/20",
  "European Film Gateway":
    "bg-emerald-600/10 text-emerald-400 border-emerald-600/20",
  "Wikimedia Commons": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Internet Archive": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  DPLA: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  NASA: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  "National Film Board": "bg-red-900/10 text-red-300 border-red-900/30",
  "Classic Cartoons": "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
  "Sci-Fi & Horror Archive":
    "bg-purple-900/10 text-purple-300 border-purple-900/30",
};

function isArchiveSource(source: string) {
  return (
    source.startsWith("Archive") ||
    source === "Internet Archive" ||
    source === "Prelinger Archives" ||
    source === "National Film Board" ||
    source === "Classic Cartoons" ||
    source === "Sci-Fi & Horror Archive" ||
    source === "British Pathé"
  );
}

const VIDEO_DIRECT = /\.(mp4|webm|ogg)(\?.*)?$/i;

function FilmPlayer({ film }: { film: WikiVideo }) {
  if (film.embedUrl) {
    const noSandbox =
      isArchiveSource(film.source) || film.embedUrl.includes("archive.org");
    return (
      <iframe
        src={film.embedUrl}
        className="w-full aspect-video"
        style={{ maxHeight: "500px" }}
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        {...(!noSandbox && {
          sandbox:
            "allow-scripts allow-same-origin allow-presentation allow-popups allow-forms allow-pointer-lock",
        })}
        title={film.title}
      />
    );
  }
  if (VIDEO_DIRECT.test(film.url)) {
    return (
      // biome-ignore lint/a11y/useMediaCaption: public domain video source may not have captions
      <video
        key={film.url}
        controls
        className="w-full aspect-video"
        style={{ maxHeight: "500px" }}
      >
        <source src={film.url} type={film.mime} />
        Your browser does not support this video format.
      </video>
    );
  }
  // Fallback: thumbnail + external link
  return (
    <div className="w-full aspect-video flex flex-col items-center justify-center bg-black/60 rounded-lg gap-3 p-4">
      {film.thumbUrl && (
        <img
          src={film.thumbUrl}
          alt={film.title}
          className="max-h-48 max-w-full object-contain rounded opacity-80"
        />
      )}
      <a
        href={film.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary/80 hover:bg-primary text-primary-foreground rounded-lg text-sm font-medium transition-colors"
      >
        Watch on {film.source} ↗
      </a>
    </div>
  );
}

function FilmThumb({ film }: { film: WikiVideo }) {
  return (
    <div className="flex-shrink-0 w-14 h-10 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
      {film.thumbUrl ? (
        <img
          src={film.thumbUrl}
          alt={film.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <Play className="w-5 h-5 text-muted-foreground" />
      )}
    </div>
  );
}

function FilmCard({
  film,
  index,
  isActive,
  onClick,
}: {
  film: WikiVideo;
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      key={film.pageid}
      data-ocid={`films.item.${index}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`video-thumb bg-card border border-border/60 rounded-xl p-3 flex gap-3 items-start cursor-pointer ${
        isActive ? "active" : ""
      }`}
      onClick={onClick}
    >
      <FilmThumb film={film} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
          {film.title}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <Badge
            variant="outline"
            className={`text-[10px] py-0 px-1.5 border ${
              SOURCE_COLORS[film.source] ?? "bg-muted/50 text-muted-foreground"
            }`}
          >
            {film.source}
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
    <div data-ocid="films.source_filters" className="flex flex-wrap gap-2 pb-2">
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
            data-ocid={"films.filter.toggle"}
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

export function FilmsTab({ films, loading, fuzzyUsed, hasSearched }: Props) {
  const [selected, setSelected] = useState<WikiVideo | null>(null);
  const [disabledSources, setDisabledSources] = useState<Set<string>>(
    new Set(),
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on new search
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [films]);

  const allSources = useMemo(
    () => Array.from(new Set(films.map((f) => f.source))).sort(),
    [films],
  );

  const toggleSource = (source: string) => {
    setDisabledSources((prev) => {
      const next = new Set(prev);
      if (next.has(source)) next.delete(source);
      else next.add(source);
      return next;
    });
  };

  const filteredFilms = useMemo(
    () => films.filter((f) => !disabledSources.has(f.source)),
    [films, disabledSources],
  );

  const ytPublicDomainFilms = filteredFilms.filter(
    (v) => v.source === "YouTube (Public Domain)",
  );
  const otherFilms = filteredFilms.filter(
    (v) => v.source !== "YouTube (Public Domain)",
  );

  const visibleOther = otherFilms.slice(0, visibleCount);

  const allFiltered = [...ytPublicDomainFilms, ...otherFilms];

  const activeFilm =
    selected && !disabledSources.has(selected.source)
      ? selected
      : (allFiltered[0] ?? null);

  if (loading) {
    return (
      <div data-ocid="films.loading_state" className="space-y-4">
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
        data-ocid="films.empty_state"
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="text-5xl mb-4">🎥</div>
        <p
          className="font-display text-xl font-semibold mb-2"
          style={{ color: "oklch(0.85 0.04 240)" }}
        >
          Search for Films
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Public domain classics, Archive.org & more
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {["Classic", "Western", "Horror", "Documentary"].map((chip) => (
            <button
              key={chip}
              type="button"
              data-ocid="films.tab"
              className="px-4 py-2 rounded-full text-sm border transition-colors"
              style={{
                borderColor: "oklch(0.4 0.08 25)",
                color: "oklch(0.72 0.1 25)",
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

  if (films.length === 0) {
    return (
      <div
        data-ocid="films.empty_state"
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <Clapperboard className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground text-lg font-display">
          No films found for this search
        </p>
        <p className="text-muted-foreground/60 text-sm mt-1">
          Try searching for a genre, director, era, or film title
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

      {/* Main film player */}
      {activeFilm && (
        <motion.div
          data-ocid="films.player"
          key={activeFilm.pageid}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden border border-border/60 bg-black"
        >
          <FilmPlayer film={activeFilm} />
          <div className="p-4 bg-card">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-semibold text-base text-foreground flex-1">
                {activeFilm.title}
              </h3>
              <Badge
                variant="outline"
                className={`text-xs shrink-0 border ${
                  SOURCE_COLORS[activeFilm.source] ??
                  "bg-muted/50 text-muted-foreground"
                }`}
              >
                {activeFilm.source}
              </Badge>
            </div>
            {activeFilm.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {activeFilm.description}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* YouTube Public Domain section */}
      {ytPublicDomainFilms.length > 0 && (
        <motion.section
          data-ocid="films.youtube_pd.section"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
              className="ml-auto text-[10px] border-red-600/30 text-red-400 bg-red-600/10"
            >
              {ytPublicDomainFilms.length} film
              {ytPublicDomainFilms.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
            {ytPublicDomainFilms.map((film, idx) => (
              <motion.div
                key={film.pageid}
                data-ocid={`films.youtube_pd.item.${idx + 1}`}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex-shrink-0 w-56 bg-card border rounded-xl p-3 flex gap-2.5 items-start cursor-pointer transition-colors hover:border-red-600/40 ${
                  activeFilm?.pageid === film.pageid
                    ? "border-red-600/50 bg-red-600/5"
                    : "border-border/60"
                }`}
                onClick={() => setSelected(film)}
              >
                <div className="flex-shrink-0 w-12 h-9 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {film.thumbUrl ? (
                    <img
                      src={film.thumbUrl}
                      alt={film.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Youtube className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground line-clamp-3 leading-tight">
                    {film.title}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Films & Cinema header + grid */}
      {otherFilms.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clapperboard className="w-4 h-4 text-muted-foreground" />
            <h4 className="font-display font-semibold text-sm text-foreground">
              Films &amp; Cinema
            </h4>
            <Badge variant="secondary" className="text-[10px]">
              {otherFilms.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleOther.map((film, idx) => (
              <FilmCard
                key={film.pageid}
                film={film}
                index={idx + 1}
                isActive={activeFilm?.pageid === film.pageid}
                onClick={() => setSelected(film)}
              />
            ))}
          </div>

          {visibleCount < otherFilms.length && (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                data-ocid="films.pagination_next"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="min-w-[140px]"
              >
                Load More
                <span className="ml-2 text-xs text-muted-foreground">
                  ({otherFilms.length - visibleCount} remaining)
                </span>
              </Button>
            </div>
          )}
        </div>
      )}

      {allFiltered.length === 0 && (
        <div
          data-ocid="films.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <Clapperboard className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">All sources filtered out</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Re-enable a source above to see results
          </p>
        </div>
      )}
    </div>
  );
}
