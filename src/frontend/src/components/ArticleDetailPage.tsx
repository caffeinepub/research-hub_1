import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { WikiArticle } from "../types/research";
import { stripHtml } from "../utils/stripHtml";

interface WikiSection {
  id: number;
  title?: string;
  text: string;
}

interface RelatedPage {
  title: string;
  description?: string;
  thumbnail?: { source: string };
}

interface Props {
  article: WikiArticle;
  onBack: () => void;
  onSelectRelated?: (title: string, source: string) => void;
}

const SOURCE_COLORS: Record<string, string> = {
  Wikipedia: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Internet Archive": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Project Gutenberg":
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PubMed: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  arXiv: "bg-red-500/10 text-red-400 border-red-500/20",
};

function extractImagesFromHtml(html: string): string[] {
  const imgs: string[] = [];
  const re = /<img[^>]+src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: regex loop
  while ((m = re.exec(html)) !== null) {
    const src = m[1];
    if (src && !src.includes("thumb") && src.startsWith("http")) {
      imgs.push(src);
    } else if (src?.startsWith("//")) {
      imgs.push(`https:${src}`);
    }
  }
  return imgs.slice(0, 12);
}

function htmlToText(html: string): string {
  return stripHtml(
    html.replace(/<\/p>/gi, "\n\n").replace(/<br\s*\/?>/gi, "\n"),
  );
}

export function ArticleDetailPage({ article, onBack, onSelectRelated }: Props) {
  const [sections, setSections] = useState<WikiSection[]>([]);
  const [allImages, setAllImages] = useState<string[]>([]);
  const [relatedPages, setRelatedPages] = useState<RelatedPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | undefined>(
    article.thumbnail?.source,
  );

  useEffect(() => {
    setLoading(true);
    setSections([]);
    setAllImages([]);
    setRelatedPages([]);

    const encodedTitle = encodeURIComponent(article.title.replace(/ /g, "_"));

    const fetchContent = async () => {
      if (article.source === "Wikipedia") {
        // Fetch full article via mobile-sections
        const [sectRes, relRes] = await Promise.allSettled([
          fetch(
            `https://en.wikipedia.org/api/rest_v1/page/mobile-sections/${encodedTitle}`,
          ),
          fetch(
            `https://en.wikipedia.org/api/rest_v1/page/related/${encodedTitle}`,
          ),
        ]);

        if (sectRes.status === "fulfilled" && sectRes.value.ok) {
          const data = await sectRes.value.json();
          const rawSections: WikiSection[] = [];
          const imgs: string[] = [];

          // Lead section
          if (data.lead) {
            if (data.lead.image?.urls) {
              const imgUrl =
                data.lead.image.urls["1280"] ||
                data.lead.image.urls["800"] ||
                data.lead.image.urls["640"] ||
                (Object.values(data.lead.image.urls)[0] as string);
              if (imgUrl) {
                setThumbnail(imgUrl);
                imgs.push(imgUrl);
              }
            }
            if (data.lead.sections?.[0]?.text) {
              const sectionImgs = extractImagesFromHtml(
                data.lead.sections[0].text,
              );
              imgs.push(...sectionImgs);
              rawSections.push({
                id: 0,
                text: htmlToText(data.lead.sections[0].text),
              });
            }
          }

          // Remaining sections
          if (Array.isArray(data.remaining?.sections)) {
            for (const sec of data.remaining.sections) {
              if (sec.text) {
                const sectionImgs = extractImagesFromHtml(sec.text);
                imgs.push(...sectionImgs);
                rawSections.push({
                  id: sec.id,
                  title: sec.line ? stripHtml(sec.line) : undefined,
                  text: htmlToText(sec.text),
                });
              }
            }
          }

          setSections(rawSections);
          setAllImages([...new Set(imgs)].slice(0, 16));
        } else {
          // Fallback to summary
          const summary = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`,
          ).then((r) => r.json());
          if (summary.extract) {
            setSections([{ id: 0, text: summary.extract }]);
          }
          if (summary.thumbnail?.source) {
            setThumbnail(summary.thumbnail.source);
          }
        }

        // Related pages
        if (relRes.status === "fulfilled" && relRes.value.ok) {
          const relData = await relRes.value.json();
          const pages: RelatedPage[] = (relData.pages ?? [])
            .slice(0, 5)
            .map((p: any) => ({
              title: p.title,
              description: p.description,
              thumbnail: p.thumbnail,
            }));
          setRelatedPages(pages);
        }
      } else {
        // Non-Wikipedia article — use stored content
        const text = article.fullSummary ?? article.snippet ?? "";
        setSections([{ id: 0, text: stripHtml(text) }]);
        if (article.thumbnail?.source) {
          setThumbnail(article.thumbnail.source);
        }
      }
    };

    fetchContent()
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [
    article.title,
    article.source,
    article.fullSummary,
    article.snippet,
    article.thumbnail?.source,
  ]);

  const handleRelated = (page: RelatedPage) => {
    if (onSelectRelated) {
      onSelectRelated(page.title, "Wikipedia");
    }
  };

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
            className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl"
            onClick={() => setLightboxSrc(null)}
          >
            ✕
          </button>
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: stop propagation */}
          {/* biome-ignore lint/a11y/noRedundantAlt: descriptive */}
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
          <article className="prose prose-invert prose-sm max-w-none space-y-6">
            {/* Hero image */}
            {thumbnail && (
              <button
                type="button"
                className="block w-full rounded-xl overflow-hidden cursor-zoom-in"
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
            {article.description && (
              <p
                className="text-xs font-mono uppercase tracking-wider"
                style={{ color: "oklch(0.6 0.1 230)" }}
              >
                {article.description}
              </p>
            )}

            {/* Inline image row */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {allImages.slice(1).map((src, i) => (
                  <button
                    // biome-ignore lint/suspicious/noArrayIndexKey: stable index
                    key={i}
                    type="button"
                    className="flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden cursor-zoom-in"
                    onClick={() => setLightboxSrc(src)}
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Article sections */}
            {sections.map((sec) => (
              <div key={sec.id} className="space-y-2">
                {sec.title && (
                  <h2
                    className="font-display font-semibold text-xl pt-4 border-t border-border/40"
                    style={{ color: "oklch(0.88 0.06 230)" }}
                  >
                    {sec.title}
                  </h2>
                )}
                <p className="text-base text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {sec.text}
                </p>
              </div>
            ))}

            {/* Fallback if no sections */}
            {sections.length === 0 && (
              <p className="text-base text-foreground/90 leading-relaxed">
                {stripHtml(article.snippet)}
              </p>
            )}

            {/* Related Articles */}
            {relatedPages.length > 0 && (
              <div className="mt-10 pt-8 border-t border-border/60">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen
                    className="w-5 h-5"
                    style={{ color: "oklch(0.65 0.18 200)" }}
                  />
                  <h2 className="font-display text-lg font-bold">
                    Related Articles
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {relatedPages.map((page) => (
                    <button
                      key={page.title}
                      type="button"
                      data-ocid="article.secondary_button"
                      className="text-left rounded-xl p-4 border transition-colors hover:border-primary/40"
                      style={{
                        background: "oklch(0.16 0.04 260)",
                        border: "1px solid oklch(0.28 0.06 260)",
                      }}
                      onClick={() => handleRelated(page)}
                    >
                      <div className="flex items-start gap-3">
                        {page.thumbnail?.source && (
                          <img
                            src={page.thumbnail.source}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">
                            {page.title}
                          </p>
                          {page.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {page.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </article>
        )}
      </main>
    </div>
  );
}
