import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { WikiArticle } from "../types/research";
import { stripHtml } from "../utils/stripHtml";

interface Props {
  articles: WikiArticle[];
  loading: boolean;
  onExpand: (article: WikiArticle) => void;
  onSelect?: (article: WikiArticle) => void;
  hasSearched?: boolean;
}

const INITIAL_SIZE = 20;
const PAGE_INCREMENT = 20;
const SKELETON_IDS = ["sk-a", "sk-b", "sk-c", "sk-d", "sk-e", "sk-f"];

const SOURCE_COLORS: Record<string, string> = {
  Wikipedia: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Internet Archive": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Project Gutenberg":
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PubMed: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  arXiv: "bg-red-500/10 text-red-400 border-red-500/20",
  CrossRef: "bg-orange-600/10 text-orange-400 border-orange-600/20",
  DOAJ: "bg-green-600/10 text-green-400 border-green-600/20",
  NSF: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "NIH / NLM": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  OpenAlex: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Semantic Scholar": "bg-teal-500/10 text-teal-400 border-teal-500/20",
  "Europe PMC": "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

const TOPIC_CHIPS = [
  { label: "Space", query: "space universe" },
  { label: "History", query: "ancient history" },
  { label: "Science", query: "science biology" },
  { label: "Technology", query: "technology AI" },
];

export function ArticlesTab({
  articles,
  loading,
  onExpand,
  onSelect,
  hasSearched,
}: Props) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_SIZE);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on new search
  useEffect(() => {
    setVisibleCount(INITIAL_SIZE);
  }, [articles]);

  const visibleArticles = articles.slice(0, visibleCount);

  if (loading) {
    return (
      <div
        data-ocid="search.loading_state"
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        {SKELETON_IDS.map((id) => (
          <div key={id} className="article-card p-5 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-8 w-24 mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div
        data-ocid="articles.empty_state"
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="text-5xl mb-4">📚</div>
        <p
          className="font-display text-xl font-semibold mb-2"
          style={{ color: "oklch(0.85 0.04 240)" }}
        >
          Search for Articles
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Wikipedia, PubMed, arXiv, Internet Archive & more
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {TOPIC_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              data-ocid="articles.tab"
              onClick={() => onSelect?.({ title: chip.query } as any)}
              className="px-4 py-2 rounded-full text-sm border transition-colors"
              style={{
                borderColor: "oklch(0.4 0.08 220)",
                color: "oklch(0.72 0.1 220)",
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

  if (articles.length === 0) {
    return (
      <div
        data-ocid="articles.empty_state"
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <BookOpen className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground text-lg font-display">
          No articles found
        </p>
        <p className="text-muted-foreground/60 text-sm mt-1">
          Try a different search term
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {visibleArticles.map((article, idx) => (
          <motion.div
            key={article.pageid}
            data-ocid={`articles.item.${idx + 1}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.03, 0.3), duration: 0.3 }}
            className={`article-card${
              onSelect
                ? " cursor-pointer hover:border-primary/50 transition-colors"
                : ""
            }`}
            onClick={onSelect ? () => onSelect(article) : undefined}
          >
            {article.thumbnail && (
              <div className="relative h-40 overflow-hidden">
                <img
                  src={article.thumbnail.source}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            )}
            <div className="p-5">
              <div className="flex items-start gap-2 flex-wrap mb-1">
                <h3 className="font-display font-semibold text-lg leading-tight text-foreground flex-1">
                  {article.title}
                </h3>
                <Badge
                  variant="outline"
                  className={`text-xs shrink-0 border ${
                    SOURCE_COLORS[article.source] ??
                    "bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {article.source}
                </Badge>
              </div>
              {article.description && (
                <p className="text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
                  {article.description}
                </p>
              )}
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {stripHtml(article.snippet)}
              </p>

              <AnimatePresence>
                {article.expanded && article.fullSummary && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 border-t border-border/60 pt-3">
                      <div className="max-h-96 overflow-y-auto pr-1 scrollbar-thin">
                        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                          {stripHtml(article.fullSummary)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3 text-primary hover:text-primary/80 px-0 font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelect) {
                    onSelect(article);
                  } else {
                    onExpand(article);
                  }
                }}
              >
                {onSelect ? (
                  <>
                    <BookOpen className="w-4 h-4 mr-1" /> Read Full Article
                  </>
                ) : article.expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" /> Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" /> Read Full Article
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Load More */}
      {visibleCount < articles.length && (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            data-ocid="articles.pagination_next"
            onClick={() => setVisibleCount((c) => c + PAGE_INCREMENT)}
            className="min-w-[140px]"
          >
            Load More
            <ArrowRight className="w-4 h-4 ml-2" />
            <span className="ml-2 text-xs text-muted-foreground">
              ({articles.length - visibleCount} remaining)
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
