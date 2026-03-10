import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Film,
  Image,
  Music,
  Play,
  Search,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type {
  AudioResult,
  WikiArticle,
  WikiImage,
  WikiVideo,
} from "../types/research";
import { stripHtml } from "../utils/stripHtml";

interface SearchResults {
  articles: WikiArticle[];
  images: WikiImage[];
  videos: WikiVideo[];
  films: WikiVideo[];
  audio: AudioResult[];
}

interface Props {
  results: SearchResults;
  lastQuery: string;
  isLoading: boolean;
  onSearch: (q: string) => void;
  onSelectArticle: (article: WikiArticle) => void;
}

const SOURCE_COLORS: Record<string, string> = {
  Wikipedia: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Internet Archive": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  NASA: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  "Wikimedia Commons": "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export function DiscoverPage({
  results,
  lastQuery,
  isLoading,
  onSearch,
  onSelectArticle,
}: Props) {
  const [query, setQuery] = useState(lastQuery);
  const [lightboxImages, setLightboxImages] = useState<WikiImage[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null);

  useEffect(() => {
    setQuery(lastQuery);
  }, [lastQuery]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setLightboxIndex((i) =>
          i === null
            ? null
            : (i - 1 + lightboxImages.length) % lightboxImages.length,
        );
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((i) =>
          i === null ? null : (i + 1) % lightboxImages.length,
        );
      } else if (e.key === "Escape") {
        setLightboxIndex(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, lightboxImages.length]);

  const openLightbox = (images: WikiImage[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  const hasResults =
    results.articles.length > 0 ||
    results.images.length > 0 ||
    results.videos.length > 0 ||
    results.audio.length > 0;

  const currentImage =
    lightboxIndex !== null ? lightboxImages[lightboxIndex] : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && currentImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4"
            data-ocid="discover.modal"
          >
            <button
              type="button"
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              onClick={() => setLightboxIndex(null)}
              data-ocid="discover.close_button"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="text-center mb-3">
              <p className="text-white/80 text-sm font-medium">
                {currentImage.title}
              </p>
              <p className="text-white/50 text-xs">
                {lightboxIndex + 1} / {lightboxImages.length}
              </p>
            </div>
            <div className="relative flex items-center gap-4 max-w-5xl w-full">
              <button
                type="button"
                data-ocid="discover.pagination_prev"
                className="shrink-0 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                onClick={() =>
                  setLightboxIndex((i) =>
                    i === null
                      ? null
                      : (i - 1 + lightboxImages.length) % lightboxImages.length,
                  )
                }
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <img
                src={currentImage.url}
                alt={currentImage.title}
                className="flex-1 max-h-[70vh] object-contain rounded-xl"
              />
              <button
                type="button"
                data-ocid="discover.pagination_next"
                className="shrink-0 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                onClick={() =>
                  setLightboxIndex((i) =>
                    i === null ? null : (i + 1) % lightboxImages.length,
                  )
                }
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            {currentImage.description && (
              <p className="text-white/50 text-xs mt-3 max-w-lg text-center line-clamp-2">
                {stripHtml(currentImage.description)}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with search */}
      <header
        className="sticky top-0 z-30 border-b border-border/60 px-4 py-3"
        style={{
          background: "oklch(0.12 0.03 260 / 0.95)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="p-1.5 rounded-lg"
              style={{
                background: "oklch(0.65 0.18 200 / 0.2)",
                border: "1px solid oklch(0.65 0.18 200 / 0.35)",
              }}
            >
              <Search
                className="w-4 h-4"
                style={{ color: "oklch(0.78 0.18 200)" }}
              />
            </div>
            <h1
              className="font-display font-bold text-lg"
              style={{ color: "oklch(0.97 0.01 240)" }}
            >
              Discover
            </h1>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                style={{ color: "oklch(0.6 0.1 230)" }}
              />
              <Input
                data-ocid="discover.search_input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search anything..."
                className="pl-9 h-10 text-sm border-0 rounded-lg"
                style={{
                  background: "oklch(0.2 0.04 260 / 0.8)",
                  color: "oklch(0.95 0.02 240)",
                }}
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="h-10 px-4 rounded-lg"
              style={{ background: "oklch(0.52 0.18 220)", color: "white" }}
              data-ocid="discover.submit_button"
              disabled={isLoading || !query.trim()}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl pb-24">
        {isLoading && (
          <div data-ocid="discover.loading_state" className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-border/60 p-4 space-y-2"
              >
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && !hasResults && (
          <div
            data-ocid="discover.empty_state"
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="font-display text-lg text-muted-foreground">
              Search to discover content
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Articles, images, audio, videos — all in one feed
            </p>
          </div>
        )}

        {!isLoading && hasResults && (
          <div className="space-y-8">
            {/* Articles */}
            {results.articles.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen
                    className="w-4 h-4"
                    style={{ color: "oklch(0.52 0.18 220)" }}
                  />
                  <h2 className="font-display font-semibold text-xs uppercase tracking-widest text-muted-foreground">
                    Articles ({results.articles.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.articles.map((article, idx) => (
                    <motion.button
                      key={article.pageid}
                      type="button"
                      data-ocid={`discover.article.item.${idx + 1}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => onSelectArticle(article)}
                      className="text-left bg-card border border-border/60 rounded-xl p-4 hover:border-primary/40 hover:bg-card/80 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start gap-2">
                        {article.thumbnail && (
                          <img
                            src={article.thumbnail.source}
                            alt={article.title}
                            className="w-12 h-12 rounded-lg object-cover shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {article.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                            {stripHtml(article.snippet)}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] shrink-0 border ${
                            SOURCE_COLORS[article.source] ??
                            "bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          {article.source}
                        </Badge>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </section>
            )}

            {/* Images */}
            {results.images.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Image
                    className="w-4 h-4"
                    style={{ color: "oklch(0.65 0.18 200)" }}
                  />
                  <h2 className="font-display font-semibold text-xs uppercase tracking-widest text-muted-foreground">
                    Images ({results.images.length})
                  </h2>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {results.images.map((img, idx) => (
                    <motion.button
                      key={img.pageid}
                      type="button"
                      data-ocid={`discover.image.item.${idx + 1}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="aspect-square rounded-lg overflow-hidden border border-border/60 hover:border-primary/50 transition-colors cursor-zoom-in"
                      onClick={() => openLightbox(results.images, idx)}
                    >
                      <img
                        src={img.thumbUrl}
                        alt={img.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </motion.button>
                  ))}
                </div>
              </section>
            )}

            {/* Audio */}
            {results.audio.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Music
                    className="w-4 h-4"
                    style={{ color: "oklch(0.72 0.18 280)" }}
                  />
                  <h2 className="font-display font-semibold text-xs uppercase tracking-widest text-muted-foreground">
                    Audio ({results.audio.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {results.audio.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      data-ocid={`discover.audio.item.${idx + 1}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="bg-card border border-border/60 rounded-xl overflow-hidden"
                    >
                      <div className="p-3 flex items-center gap-3">
                        <button
                          type="button"
                          data-ocid={`discover.audio.toggle.${idx + 1}`}
                          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all"
                          style={{
                            background:
                              playingAudioId === item.id
                                ? "oklch(0.72 0.18 280)"
                                : "oklch(0.55 0.18 280 / 0.15)",
                            border: "1px solid oklch(0.55 0.18 280 / 0.3)",
                          }}
                          onClick={() =>
                            setPlayingAudioId(
                              playingAudioId === item.id ? null : item.id,
                            )
                          }
                        >
                          <Play
                            className="w-4 h-4"
                            style={{
                              color:
                                playingAudioId === item.id
                                  ? "white"
                                  : "oklch(0.72 0.18 280)",
                            }}
                          />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground line-clamp-1">
                            {item.title}
                          </p>
                          {item.creator && (
                            <p className="text-xs text-muted-foreground">
                              {item.creator}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] shrink-0"
                        >
                          {item.source}
                        </Badge>
                      </div>
                      <AnimatePresence>
                        {playingAudioId === item.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
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
                  ))}
                </div>
              </section>
            )}

            {/* Videos */}
            {results.videos.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Film
                    className="w-4 h-4"
                    style={{ color: "oklch(0.78 0.17 55)" }}
                  />
                  <h2 className="font-display font-semibold text-xs uppercase tracking-widest text-muted-foreground">
                    Videos ({results.videos.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.videos.map((video, idx) => (
                    <motion.div
                      key={video.pageid}
                      data-ocid={`discover.video.item.${idx + 1}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="bg-card border border-border/60 rounded-xl overflow-hidden"
                    >
                      {video.thumbUrl && playingVideoId !== video.pageid && (
                        <div className="relative aspect-video bg-black/40">
                          <img
                            src={video.thumbUrl}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            data-ocid={`discover.video.toggle.${idx + 1}`}
                            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors"
                            onClick={() => setPlayingVideoId(video.pageid)}
                          >
                            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                              <Play className="w-5 h-5 text-black ml-0.5" />
                            </div>
                          </button>
                        </div>
                      )}
                      {!video.thumbUrl && playingVideoId !== video.pageid && (
                        <button
                          type="button"
                          data-ocid={`discover.video.toggle.${idx + 1}`}
                          className="w-full aspect-video bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
                          onClick={() => setPlayingVideoId(video.pageid)}
                        >
                          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                            <Play className="w-5 h-5 text-white/80 ml-0.5" />
                          </div>
                        </button>
                      )}
                      {playingVideoId === video.pageid && video.embedUrl && (
                        <div className="aspect-video">
                          <iframe
                            src={video.embedUrl}
                            title={video.title}
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            allow="autoplay; fullscreen"
                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                            allowFullScreen
                            className="block"
                          />
                        </div>
                      )}
                      <div className="p-3">
                        <p className="font-semibold text-sm text-foreground line-clamp-1">
                          {video.title}
                        </p>
                        {video.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {stripHtml(video.description)}
                          </p>
                        )}
                        <Badge variant="outline" className="text-[10px] mt-2">
                          {video.source}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
