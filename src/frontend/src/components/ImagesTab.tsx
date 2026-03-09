import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Scale, User, X, ZoomIn } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { WikiImage } from "../types/research";

interface Props {
  images: WikiImage[];
  loading: boolean;
}

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

export function ImagesTab({ images, loading }: Props) {
  const [lightbox, setLightbox] = useState<WikiImage | null>(null);

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((img, idx) => (
          <motion.div
            key={img.pageid}
            data-ocid={`images.item.${idx + 1}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.03, duration: 0.25 }}
            className="group cursor-pointer"
            onClick={() => setLightbox(img)}
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
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1 px-0.5">
              {img.title}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "oklch(0.08 0.02 265 / 0.92)" }}
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative max-w-4xl w-full bg-card rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                onClick={() => setLightbox(null)}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <img
                src={lightbox.url}
                alt={lightbox.title}
                className="w-full max-h-[70vh] object-contain bg-black/10"
              />
              <div className="p-4">
                <h3 className="font-display font-semibold text-base text-foreground">
                  {lightbox.title}
                </h3>
                {lightbox.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {lightbox.description}
                  </p>
                )}
                <div className="flex gap-3 mt-2 flex-wrap">
                  {lightbox.author && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="w-3 h-3" /> {lightbox.author}
                    </span>
                  )}
                  {lightbox.license && (
                    <Badge variant="secondary" className="text-xs">
                      <Scale className="w-3 h-3 mr-1" />
                      {lightbox.license}
                    </Badge>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
