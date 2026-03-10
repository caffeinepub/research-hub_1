import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Scale,
  User,
  X,
  ZoomIn,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { WikiImage } from "../types/research";

interface Props {
  images: WikiImage[];
  loading: boolean;
  fuzzyUsed?: boolean;
}

const PAGE_SIZE = 12;

const SKELETON_IDS = [
  "sk-a",
  "sk-b",
  "sk-c",
  "sk-d",
  "sk-e",
  "sk-f",
  "sk-g",
  "sk-h",
  "sk-i",
  "sk-j",
  "sk-k",
  "sk-l",
];

const SOURCE_COLORS: Record<string, string> = {
  "Wikimedia Commons": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  NASA: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  "Met Museum": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Library of Congress": "bg-red-500/10 text-red-400 border-red-500/20",
  Europeana: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  Openverse: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Smithsonian: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Flickr Commons": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Art Institute of Chicago": "bg-red-700/10 text-red-400 border-red-700/20",
  "Cleveland Museum": "bg-teal-700/10 text-teal-400 border-teal-700/20",
  DPLA: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Rijksmuseum: "bg-orange-600/10 text-orange-400 border-orange-600/20",
  Pixabay: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

export function ImagesTab({ images, loading, fuzzyUsed }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on new search
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [images]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setLightboxIndex((i) =>
          i === null ? null : (i - 1 + images.length) % images.length,
        );
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((i) => (i === null ? null : (i + 1) % images.length));
      } else if (e.key === "Escape") {
        setLightboxIndex(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, images.length]);

  const visibleImages = images.slice(0, visibleCount);
  const lightboxImage = lightboxIndex !== null ? images[lightboxIndex] : null;

  if (loading) {
    return (
      <div
        data-ocid="search.loading_state"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
      >
        {SKELETON_IDS.map((id) => (
          <div key={id} className="space-y-2">
            <Skeleton className="aspect-square rounded-xl" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div
        data-ocid="images.empty_state"
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <ZoomIn className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground text-lg font-display">
          No images found
        </p>
        <p className="text-muted-foreground/60 text-sm mt-1">
          Try a different search term
        </p>
      </div>
    );
  }

  return (
    <>
      {fuzzyUsed && (
        <p className="text-xs text-muted-foreground/70 italic mb-3">
          Showing related results
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {visibleImages.map((img, idx) => (
          <motion.div
            key={img.pageid}
            data-ocid={`images.item.${idx + 1}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.03, duration: 0.25 }}
            className="group cursor-pointer"
            onClick={() => setLightboxIndex(idx)}
            // biome-ignore lint/a11y/useSemanticElements: motion.div used for animation
            onKeyDown={(e) => e.key === "Enter" && setLightboxIndex(idx)}
            role="button"
            tabIndex={0}
          >
            <div className="relative aspect-square overflow-hidden rounded-xl border border-border/60 group-hover:border-primary/40 transition-all duration-200">
              <img
                src={img.thumbUrl}
                alt={img.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
              <div className="absolute bottom-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Badge
                  variant="outline"
                  className={`text-[10px] py-0 px-1.5 border backdrop-blur-sm ${
                    SOURCE_COLORS[img.source] ??
                    "bg-black/60 text-white border-white/20"
                  }`}
                >
                  {img.source}
                </Badge>
              </div>
              {/* Download button */}
              <a
                href={img.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                data-ocid={`images.download_button.${idx + 1}`}
                className="absolute bottom-1.5 right-1.5 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/80"
                onClick={(e) => e.stopPropagation()}
                title="Download image"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1 px-0.5">
              {img.title}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Load More */}
      {visibleCount < images.length && (
        <div className="flex justify-center pt-6">
          <Button
            type="button"
            variant="outline"
            data-ocid="images.pagination_next"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="min-w-[140px]"
          >
            Load More
            <span className="ml-2 text-xs text-muted-foreground">
              ({images.length - visibleCount} remaining)
            </span>
          </Button>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "oklch(0.08 0.02 265 / 0.92)" }}
            onClick={() => setLightboxIndex(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative max-w-4xl w-full bg-card rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                type="button"
                data-ocid="lightbox.close_button"
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                onClick={() => setLightboxIndex(null)}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Prev arrow */}
              <button
                type="button"
                data-ocid="lightbox.pagination_prev"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                onClick={() =>
                  setLightboxIndex(
                    (lightboxIndex - 1 + images.length) % images.length,
                  )
                }
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Next arrow */}
              <button
                type="button"
                data-ocid="lightbox.pagination_next"
                className="absolute right-14 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                onClick={() =>
                  setLightboxIndex((lightboxIndex + 1) % images.length)
                }
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <AnimatePresence mode="wait">
                <motion.img
                  key={lightboxImage.pageid}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  src={lightboxImage.url}
                  alt={lightboxImage.title}
                  className="w-full max-h-[70vh] object-contain bg-black/10"
                />
              </AnimatePresence>

              <div className="p-4">
                <div className="flex items-start gap-2 flex-wrap">
                  <h3 className="font-display font-semibold text-base text-foreground flex-1">
                    {lightboxImage.title}
                  </h3>
                  <Badge
                    variant="outline"
                    className={`text-xs shrink-0 border ${
                      SOURCE_COLORS[lightboxImage.source] ??
                      "bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    {lightboxImage.source}
                  </Badge>
                </div>
                {lightboxImage.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {lightboxImage.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {lightboxImage.author && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="w-3 h-3" /> {lightboxImage.author}
                    </span>
                  )}
                  {lightboxImage.license && (
                    <Badge variant="secondary" className="text-xs">
                      <Scale className="w-3 h-3 mr-1" />
                      {lightboxImage.license}
                    </Badge>
                  )}
                  <a
                    href={lightboxImage.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    data-ocid="lightbox.download_button"
                    className="ml-auto inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </a>
                  <span className="text-xs text-muted-foreground font-mono">
                    {lightboxIndex + 1} / {images.length}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
