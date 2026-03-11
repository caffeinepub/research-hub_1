import { Badge } from "@/components/ui/badge";
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
import { useEffect, useRef, useState } from "react";
import type { WikiImage } from "../types/research";
import { SensitiveContentBlur } from "./SensitiveContentBlur";

interface Props {
  images: WikiImage[];
  loading: boolean;
  fuzzyUsed?: boolean;
  hasSearched?: boolean;
}

const PAGE_SIZE = 30;

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

const TOPIC_CHIPS = [
  { label: "Space", query: "space" },
  { label: "Nature", query: "nature" },
  { label: "Art", query: "art" },
  { label: "History", query: "history" },
];

export function ImagesTab({ images, loading, fuzzyUsed, hasSearched }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on new search
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [images]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && visibleCount < images.length) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, images.length));
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, images.length]);

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
        data-ocid="images.loading_state"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
      >
        {SKELETON_IDS.map((id) => (
          <Skeleton key={id} className="aspect-square rounded-xl" />
        ))}
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div
        data-ocid="images.empty_state"
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="text-5xl mb-4">🖼️</div>
        <p
          className="font-display text-xl font-semibold mb-2"
          style={{ color: "oklch(0.85 0.04 240)" }}
        >
          Search for Images
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          NASA, Met Museum, Wikimedia Commons, Flickr & more
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {TOPIC_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              data-ocid="images.tab"
              className="px-4 py-2 rounded-full text-sm border transition-colors"
              style={{
                borderColor: "oklch(0.4 0.08 200)",
                color: "oklch(0.72 0.1 200)",
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
    <div className="space-y-4">
      {fuzzyUsed && (
        <p className="text-xs text-muted-foreground italic">
          Showing similar results (exact match not found)
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {visibleImages.map((img, idx) => (
          <motion.button
            key={`${img.pageid}-${idx}`}
            type="button"
            data-ocid={`images.item.${idx + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: Math.min(idx * 0.02, 0.4) }}
            className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
            style={{ background: "oklch(0.16 0.04 260)" }}
            onClick={() => setLightboxIndex(idx)}
          >
            <SensitiveContentBlur label={img.title}>
              <img
                src={img.thumbUrl ?? img.url}
                alt={img.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </SensitiveContentBlur>
            {img.source && (
              <div className="absolute bottom-1 left-1">
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                    SOURCE_COLORS[img.source] ??
                    "bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {img.source}
                </span>
              </div>
            )}
          </motion.button>
        ))}
      </div>

      <div ref={sentinelRef} className="h-4" aria-hidden="true" />

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "oklch(0.05 0.02 260 / 0.95)" }}
          >
            <button
              type="button"
              data-ocid="images.close_button"
              className="absolute top-4 right-4 p-2 rounded-full"
              style={{ background: "oklch(0.22 0.05 260)" }}
              onClick={() => setLightboxIndex(null)}
            >
              <X className="w-5 h-5" />
            </button>

            {lightboxIndex > 0 && (
              <button
                type="button"
                data-ocid="images.pagination_prev"
                className="absolute left-4 p-3 rounded-full"
                style={{ background: "oklch(0.22 0.05 260 / 0.8)" }}
                onClick={() => setLightboxIndex((i) => (i ?? 1) - 1)}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {lightboxIndex < images.length - 1 && (
              <button
                type="button"
                data-ocid="images.pagination_next"
                className="absolute right-4 p-3 rounded-full"
                style={{ background: "oklch(0.22 0.05 260 / 0.8)" }}
                onClick={() => setLightboxIndex((i) => (i ?? 0) + 1)}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            <div className="max-w-4xl w-full px-16 flex flex-col items-center gap-4">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-h-[75vh] max-w-full object-contain rounded-xl"
              />
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <p
                  className="text-sm text-center"
                  style={{ color: "oklch(0.85 0.03 240)" }}
                >
                  {lightboxImage.title}
                </p>
                {lightboxImage.source && (
                  <Badge
                    variant="outline"
                    className={SOURCE_COLORS[lightboxImage.source] ?? ""}
                  >
                    {lightboxImage.source}
                  </Badge>
                )}
                {lightboxImage.license && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Scale className="w-3 h-3" />
                    {lightboxImage.license}
                  </span>
                )}
                {lightboxImage.author && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    {lightboxImage.author}
                  </span>
                )}
                <a
                  href={lightboxImage.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
                  style={{
                    background: "oklch(0.52 0.18 220 / 0.2)",
                    color: "oklch(0.72 0.12 220)",
                  }}
                >
                  <Download className="w-3 h-3" />
                  Download
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
