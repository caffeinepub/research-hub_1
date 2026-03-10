import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { WikiArticle } from "../types/research";
import { stripHtml } from "../utils/stripHtml";

interface WikiSummary {
  title: string;
  extract: string;
  thumbnail?: { source: string; width: number; height: number };
  content_urls?: { desktop?: { page?: string } };
  description?: string;
}

interface Props {
  article: WikiArticle;
  onBack: () => void;
}

const SOURCE_COLORS: Record<string, string> = {
  Wikipedia: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Internet Archive": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Project Gutenberg":
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PubMed: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  arXiv: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function ArticleDetailPage({ article, onBack }: Props) {
  const [summaryData, setSummaryData] = useState<WikiSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    if (article.source !== "Wikipedia") return;
    setLoading(true);
    const encodedTitle = encodeURIComponent(article.title.replace(/ /g, "_"));
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`)
      .then((r) => r.json())
      .then((data: WikiSummary) => setSummaryData(data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [article.title, article.source]);

  const isWikipedia = article.source === "Wikipedia";
  const wikiUrl =
    summaryData?.content_urls?.desktop?.page ??
    `https://en.wikipedia.org/wiki/${encodeURIComponent(article.title.replace(/ /g, "_"))}`;

  const bodyText = isWikipedia
    ? (summaryData?.extract ??
      stripHtml(article.fullSummary ?? article.snippet))
    : stripHtml(article.fullSummary ?? article.snippet);

  const thumbnail = isWikipedia
    ? (summaryData?.thumbnail?.source ?? article.thumbnail?.source)
    : article.thumbnail?.source;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Lightbox */}
      {lightboxSrc && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: lightbox overlay dismiss
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white/70 hover:text-white"
            onClick={() => setLightboxSrc(null)}
          >
            ✕
          </button>
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: stop propagation on image click */}
          {/* biome-ignore lint/a11y/noRedundantAlt: descriptive alt intentional */}
          <img
            src={lightboxSrc}
            alt="Enlarged view"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Top bar */}
      <header
        className="sticky top-0 z-30 border-b border-border/60 px-4 py-3 flex items-center gap-3"
        style={{
          background: "oklch(0.12 0.03 260 / 0.95)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={onBack}
          data-ocid="article.back_button"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-base leading-tight text-foreground truncate">
            {article.title}
          </h1>
        </div>
        <Badge
          variant="outline"
          className={`text-xs shrink-0 border ${
            SOURCE_COLORS[article.source] ?? "bg-muted/50 text-muted-foreground"
          }`}
        >
          {article.source}
        </Badge>
      </header>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && (
          <article className="prose prose-invert prose-sm max-w-none">
            {/* Thumbnail */}
            {thumbnail && (
              <button
                type="button"
                className="block w-full mb-6 rounded-xl overflow-hidden cursor-zoom-in"
                onClick={() => setLightboxSrc(thumbnail)}
                data-ocid="article.canvas_target"
              >
                <img
                  src={thumbnail}
                  alt={article.title}
                  className="w-full max-h-96 object-cover rounded-xl"
                />
              </button>
            )}

            {/* Description */}
            {(article.description ?? summaryData?.description) && (
              <p
                className="text-xs font-mono uppercase tracking-wider mb-3"
                style={{ color: "oklch(0.6 0.1 230)" }}
              >
                {article.description ?? summaryData?.description}
              </p>
            )}

            {/* Body text */}
            <div className="text-base text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {bodyText || stripHtml(article.snippet)}
            </div>

            {/* External link */}
            {isWikipedia && (
              <div className="mt-8 pt-6 border-t border-border/60">
                <a
                  href={wikiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  data-ocid="article.link"
                >
                  <ExternalLink className="w-4 h-4" />
                  View full article on Wikipedia
                </a>
              </div>
            )}
          </article>
        )}
      </main>
    </div>
  );
}
