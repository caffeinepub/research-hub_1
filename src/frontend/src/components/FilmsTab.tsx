import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clapperboard, Play, Youtube } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { WikiVideo } from "../types/research";

interface Props {
  films: WikiVideo[];
  loading: boolean;
  fuzzyUsed?: boolean;
}

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
};

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

export function FilmsTab({ films, loading, fuzzyUsed }: Props) {
  const [selected, setSelected] = useState<WikiVideo | null>(null);

  const ytPublicDomainFilms = films.filter(
    (v) => v.source === "YouTube (Public Domain)",
  );
  const otherFilms = films.filter(
    (v) => v.source !== "YouTube (Public Domain)",
  );

  const allFilms = [...ytPublicDomainFilms, ...otherFilms];
  const activeFilm = selected ?? allFilms[0] ?? null;

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

      {/* Main film player */}
      {activeFilm && (
        <motion.div
          data-ocid="films.player"
          key={activeFilm.pageid}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden border border-border/60 bg-black"
        >
          {activeFilm.embedUrl ? (
            <iframe
              src={activeFilm.embedUrl}
              className="w-full aspect-video"
              style={{ maxHeight: "500px" }}
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-forms allow-pointer-lock"
              title={activeFilm.title}
            />
          ) : (
            // biome-ignore lint/a11y/useMediaCaption: public domain video source may not have captions
            <video
              key={activeFilm.url}
              controls
              className="w-full aspect-video"
              style={{ maxHeight: "500px" }}
            >
              <source src={activeFilm.url} type={activeFilm.mime} />
              Your browser does not support this video format.
            </video>
          )}
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

          {/* Horizontal scroll row */}
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
            {otherFilms.map((film, idx) => (
              <FilmCard
                key={film.pageid}
                film={film}
                index={idx + 1}
                isActive={activeFilm?.pageid === film.pageid}
                onClick={() => setSelected(film)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
