import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookImage,
  BookOpen,
  ChevronRight,
  Clapperboard,
  Film,
  Image,
  Music,
  Newspaper,
  Smile,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type {
  AudioResult,
  SearchResults,
  WikiArticle,
  WikiImage,
  WikiVideo,
} from "../types/research";
import { SensitiveContentBlur } from "./SensitiveContentBlur";

interface Props {
  results: SearchResults;
  isLoading: boolean;
  lastQuery: string;
  onSelectArticle: (article: WikiArticle) => void;
  onGoToTab: (tab: string) => void;
}

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35 },
  }),
};

type FilterKey =
  | "all"
  | "articles"
  | "images"
  | "videos"
  | "audio"
  | "gifs"
  | "comics"
  | "news";

const FILTER_TABS: {
  key: FilterKey;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  { key: "all", label: "All", icon: null, color: "oklch(0.72 0.12 240)" },
  {
    key: "articles",
    label: "Articles",
    icon: <BookOpen className="w-3.5 h-3.5" />,
    color: "oklch(0.72 0.16 220)",
  },
  {
    key: "images",
    label: "Images",
    icon: <Image className="w-3.5 h-3.5" />,
    color: "oklch(0.72 0.16 140)",
  },
  {
    key: "videos",
    label: "Videos",
    icon: <Film className="w-3.5 h-3.5" />,
    color: "oklch(0.72 0.16 280)",
  },
  {
    key: "audio",
    label: "Audio",
    icon: <Music className="w-3.5 h-3.5" />,
    color: "oklch(0.72 0.16 200)",
  },
  {
    key: "gifs",
    label: "GIFs",
    icon: <Smile className="w-3.5 h-3.5" />,
    color: "oklch(0.72 0.18 55)",
  },
  {
    key: "comics",
    label: "Comics",
    icon: <BookImage className="w-3.5 h-3.5" />,
    color: "oklch(0.72 0.18 30)",
  },
  {
    key: "news",
    label: "News",
    icon: <Newspaper className="w-3.5 h-3.5" />,
    color: "oklch(0.72 0.14 160)",
  },
];

function ArticleCard({
  article,
  onClick,
}: { article: WikiArticle; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 w-56 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: "oklch(0.15 0.03 260)",
        border: "1px solid oklch(0.22 0.04 260)",
        padding: "12px",
      }}
    >
      <SensitiveContentBlur label={article.title}>
        {article.thumbnail && (
          <div className="w-full h-24 rounded-lg overflow-hidden mb-2">
            <img
              src={article.thumbnail.source}
              alt={article.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        <p className="font-semibold text-sm text-white leading-tight line-clamp-2 mb-1">
          {article.title}
        </p>
        <p
          className="text-xs line-clamp-2"
          style={{ color: "oklch(0.60 0.04 240)" }}
        >
          {article.snippet?.replace(/<[^>]+>/g, "") || ""}
        </p>
      </SensitiveContentBlur>
      <span
        className="inline-block mt-2 text-[10px] font-mono px-1.5 py-0.5 rounded"
        style={{
          background: "oklch(0.20 0.05 220 / 0.4)",
          color: "oklch(0.65 0.12 220)",
        }}
      >
        {article.source}
      </span>
    </button>
  );
}

function ImageCard({ img }: { img: WikiImage }) {
  return (
    <div
      className="flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden relative group cursor-pointer"
      style={{ border: "1px solid oklch(0.22 0.04 260)" }}
    >
      <SensitiveContentBlur label={img.title}>
        <img
          src={img.thumbUrl || img.url}
          alt={img.title}
          className="w-full h-full object-cover transition-transform group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </SensitiveContentBlur>
      <div
        className="absolute bottom-0 left-0 right-0 px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: "oklch(0.05 0.02 260 / 0.85)" }}
      >
        <p className="text-[9px] text-white line-clamp-1">{img.title}</p>
      </div>
    </div>
  );
}

function VideoCard({ video }: { video: WikiVideo }) {
  return (
    <div
      className="flex-shrink-0 w-48 rounded-xl overflow-hidden"
      style={{
        background: "oklch(0.15 0.03 260)",
        border: "1px solid oklch(0.22 0.04 260)",
      }}
    >
      <div
        className="w-full h-24 flex items-center justify-center relative"
        style={{ background: "oklch(0.10 0.03 260)" }}
      >
        {video.thumbUrl ? (
          <img
            src={video.thumbUrl}
            alt={video.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <Film className="w-8 h-8" style={{ color: "oklch(0.45 0.06 260)" }} />
        )}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: "oklch(0.05 0.02 260 / 0.4)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.72 0.18 220 / 0.85)" }}
          >
            <div
              className="w-0 h-0 ml-0.5"
              style={{
                borderTop: "5px solid transparent",
                borderBottom: "5px solid transparent",
                borderLeft: "8px solid white",
              }}
            />
          </div>
        </div>
      </div>
      <div className="p-2">
        <SensitiveContentBlur label={video.title}>
          <p className="text-xs font-semibold text-white line-clamp-2 leading-tight">
            {video.title}
          </p>
        </SensitiveContentBlur>
        <span
          className="inline-block mt-1 text-[9px] font-mono px-1 py-0.5 rounded"
          style={{
            background: "oklch(0.20 0.05 280 / 0.4)",
            color: "oklch(0.65 0.12 280)",
          }}
        >
          {video.source}
        </span>
      </div>
    </div>
  );
}

function AudioCard({ track }: { track: AudioResult }) {
  return (
    <div
      className="flex-shrink-0 w-44 rounded-xl p-3"
      style={{
        background: "oklch(0.15 0.03 260)",
        border: "1px solid oklch(0.22 0.04 260)",
      }}
    >
      <div
        className="w-full h-16 rounded-lg flex items-center justify-center mb-2"
        style={{ background: "oklch(0.10 0.04 200)" }}
      >
        <Music className="w-6 h-6" style={{ color: "oklch(0.65 0.18 200)" }} />
      </div>
      <SensitiveContentBlur label={track.title}>
        <p className="text-xs font-semibold text-white line-clamp-2 leading-tight">
          {track.title}
        </p>
        {track.creator && (
          <p
            className="text-[10px] mt-0.5 line-clamp-1"
            style={{ color: "oklch(0.55 0.06 240)" }}
          >
            {track.creator}
          </p>
        )}
      </SensitiveContentBlur>
      <span
        className="inline-block mt-1 text-[9px] font-mono px-1 py-0.5 rounded"
        style={{
          background: "oklch(0.20 0.06 200 / 0.4)",
          color: "oklch(0.65 0.14 200)",
        }}
      >
        {track.source}
      </span>
    </div>
  );
}

function SectionSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-x-hidden">
      {Array.from({ length: count }, (_, i) => `sk-${i}`).map((key) => (
        <Skeleton
          key={key}
          className="flex-shrink-0 rounded-xl"
          style={{
            width: 180,
            height: 120,
            background: "oklch(0.14 0.025 260)",
          }}
        />
      ))}
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  tabKey: string;
  onGoToTab: (tab: string) => void;
  isLoading: boolean;
  index: number;
  children: React.ReactNode;
  accentColor: string;
}

function Section({
  title,
  icon,
  count,
  tabKey,
  onGoToTab,
  isLoading,
  index,
  children,
  accentColor,
}: SectionProps) {
  if (!isLoading && count === 0) return null;

  return (
    <motion.section
      custom={index}
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
      className="mb-7"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span style={{ color: accentColor }}>{icon}</span>
          <h2 className="font-semibold text-sm text-white">{title}</h2>
          {count > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4"
              style={{
                background: "oklch(0.20 0.04 260)",
                color: "oklch(0.65 0.06 240)",
              }}
            >
              {count}
            </Badge>
          )}
        </div>
        {count > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs h-7 gap-1 hover:bg-transparent"
            style={{ color: accentColor }}
            data-ocid={`universal.${tabKey}_button`}
            onClick={() => onGoToTab(tabKey)}
          >
            See all <ChevronRight className="w-3 h-3" />
          </Button>
        )}
      </div>

      <div
        className="flex gap-3 overflow-x-auto pb-2"
        style={
          {
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
          } as React.CSSProperties
        }
      >
        {isLoading && count === 0 ? <SectionSkeleton /> : children}
      </div>
    </motion.section>
  );
}

export function UniversalSearchResults({
  results,
  isLoading,
  lastQuery,
  onSelectArticle,
  onGoToTab,
}: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const articles = results.articles.slice(0, 6);
  const images = results.images.slice(0, 10);
  const videos = results.videos.slice(0, 6);
  const films = results.films.slice(0, 6);
  const audio = results.audio.slice(0, 6);

  const totalCount =
    results.articles.length +
    results.images.length +
    results.videos.length +
    results.films.length +
    results.audio.length;

  const showSection = (key: string): boolean => {
    if (activeFilter === "all") return true;
    if (activeFilter === "videos") return key === "videos" || key === "films";
    return activeFilter === key;
  };

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm" style={{ color: "oklch(0.55 0.06 240)" }}>
            Results for{" "}
            <span className="font-semibold text-white">
              &ldquo;{lastQuery}&rdquo;
            </span>
          </p>
          {totalCount > 0 && (
            <p
              className="text-xs mt-0.5"
              style={{ color: "oklch(0.45 0.05 240)" }}
            >
              {totalCount} results across all sources
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs h-7 gap-1"
          style={{
            borderColor: "oklch(0.25 0.05 260)",
            color: "oklch(0.65 0.06 240)",
            background: "transparent",
          }}
          data-ocid="universal.tab_view_button"
          onClick={() => onGoToTab("articles")}
        >
          Tab View
        </Button>
      </div>

      {/* Filter tabs */}
      <div
        className="flex gap-1.5 overflow-x-auto mb-5 pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              data-ocid={`universal.${tab.key}_tab`}
              onClick={() => setActiveFilter(tab.key)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150"
              style={{
                background: isActive
                  ? tab.color.replace("oklch(", "oklch(") +
                    " / 0.2".replace("oklch(", "")
                  : "oklch(0.16 0.03 260)",
                backgroundColor: isActive
                  ? tab.color
                      .replace("oklch(", "oklch(")
                      .replace(")", " / 0.18)")
                  : "oklch(0.16 0.03 260)",
                border: `1px solid ${isActive ? tab.color.replace(")", " / 0.45)") : "oklch(0.24 0.04 260)"}`,
                color: isActive ? tab.color : "oklch(0.60 0.05 240)",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Articles */}
      {showSection("articles") && (
        <Section
          title="Articles"
          icon={<BookOpen className="w-4 h-4" />}
          count={results.articles.length}
          tabKey="articles"
          onGoToTab={onGoToTab}
          isLoading={isLoading}
          index={0}
          accentColor="oklch(0.72 0.16 220)"
        >
          {articles.map((article) => (
            <ArticleCard
              key={article.pageid}
              article={article}
              onClick={() => onSelectArticle(article)}
            />
          ))}
        </Section>
      )}

      {/* Images */}
      {showSection("images") && (
        <Section
          title="Images"
          icon={<Image className="w-4 h-4" />}
          count={results.images.length}
          tabKey="images"
          onGoToTab={onGoToTab}
          isLoading={isLoading}
          index={1}
          accentColor="oklch(0.72 0.16 140)"
        >
          {images.map((img) => (
            <ImageCard key={img.pageid} img={img} />
          ))}
        </Section>
      )}

      {/* Videos */}
      {(showSection("videos") || showSection("films")) && (
        <Section
          title="Videos"
          icon={<Film className="w-4 h-4" />}
          count={results.videos.length}
          tabKey="videos"
          onGoToTab={onGoToTab}
          isLoading={isLoading}
          index={2}
          accentColor="oklch(0.72 0.16 280)"
        >
          {videos.map((v) => (
            <VideoCard key={v.pageid} video={v} />
          ))}
        </Section>
      )}

      {/* Films */}
      {(showSection("videos") || showSection("films")) && (
        <Section
          title="Films"
          icon={<Clapperboard className="w-4 h-4" />}
          count={results.films.length}
          tabKey="films"
          onGoToTab={onGoToTab}
          isLoading={isLoading}
          index={3}
          accentColor="oklch(0.72 0.14 55)"
        >
          {films.map((f) => (
            <VideoCard key={f.pageid} video={f} />
          ))}
        </Section>
      )}

      {/* Audio & Music */}
      {showSection("audio") && (
        <Section
          title="Audio &amp; Music"
          icon={<Music className="w-4 h-4" />}
          count={results.audio.length}
          tabKey="audio"
          onGoToTab={onGoToTab}
          isLoading={isLoading}
          index={4}
          accentColor="oklch(0.72 0.16 200)"
        >
          {audio.map((a) => (
            <AudioCard key={a.id} track={a} />
          ))}
        </Section>
      )}

      {/* GIFs & Memes shortcut */}
      {(activeFilter === "all" || activeFilter === "gifs") && !isLoading && (
        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="mb-7"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span style={{ color: "oklch(0.72 0.18 55)" }}>
                <Smile className="w-4 h-4" />
              </span>
              <h2 className="font-semibold text-sm text-white">
                GIFs &amp; Memes
              </h2>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs h-7 gap-1 hover:bg-transparent"
              style={{ color: "oklch(0.72 0.18 55)" }}
              data-ocid="universal.memes_button"
              onClick={() => onGoToTab("memes")}
            >
              Browse all <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
          <button
            type="button"
            className="w-full rounded-xl p-4 flex items-center gap-3 hover:opacity-90 transition-opacity text-left"
            style={{
              background: "oklch(0.13 0.03 55 / 0.35)",
              border: "1px solid oklch(0.22 0.06 55 / 0.35)",
            }}
            onClick={() => onGoToTab("memes")}
          >
            <Smile
              className="w-8 h-8 flex-shrink-0"
              style={{ color: "oklch(0.72 0.18 55)" }}
            />
            <div>
              <p className="text-sm font-semibold text-white">
                Search GIFs &amp; Memes for &ldquo;{lastQuery}&rdquo;
              </p>
              <p className="text-xs" style={{ color: "oklch(0.55 0.06 55)" }}>
                Giphy, Tenor, Imgflip, Reddit and more
              </p>
            </div>
          </button>
        </motion.div>
      )}

      {/* Comics shortcut */}
      {(activeFilter === "all" || activeFilter === "comics") && !isLoading && (
        <motion.div
          custom={6}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="mb-7"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span style={{ color: "oklch(0.72 0.18 30)" }}>
                <BookImage className="w-4 h-4" />
              </span>
              <h2 className="font-semibold text-sm text-white">Comics</h2>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs h-7 gap-1 hover:bg-transparent"
              style={{ color: "oklch(0.72 0.18 30)" }}
              data-ocid="universal.comics_button"
              onClick={() => onGoToTab("comics")}
            >
              Browse all <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
          <button
            type="button"
            className="w-full rounded-xl p-4 flex items-center gap-3 hover:opacity-90 transition-opacity text-left"
            style={{
              background: "oklch(0.13 0.04 30 / 0.3)",
              border: "1px solid oklch(0.22 0.08 30 / 0.35)",
            }}
            onClick={() => onGoToTab("comics")}
          >
            <BookImage
              className="w-8 h-8 flex-shrink-0"
              style={{ color: "oklch(0.72 0.18 30)" }}
            />
            <div>
              <p className="text-sm font-semibold text-white">
                Read public domain comics
              </p>
              <p className="text-xs" style={{ color: "oklch(0.55 0.08 30)" }}>
                Archive.org, Digital Comic Museum &amp; more
              </p>
            </div>
          </button>
        </motion.div>
      )}

      {/* News shortcut */}
      {(activeFilter === "all" || activeFilter === "news") && !isLoading && (
        <motion.div
          custom={7}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="mb-7"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span style={{ color: "oklch(0.72 0.14 160)" }}>
                <Newspaper className="w-4 h-4" />
              </span>
              <h2 className="font-semibold text-sm text-white">News</h2>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs h-7 gap-1 hover:bg-transparent"
              style={{ color: "oklch(0.72 0.14 160)" }}
              data-ocid="universal.news_button"
              onClick={() => onGoToTab("news")}
            >
              Latest news <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
          <button
            type="button"
            className="w-full rounded-xl p-4 flex items-center gap-3 hover:opacity-90 transition-opacity text-left"
            style={{
              background: "oklch(0.13 0.04 160 / 0.3)",
              border: "1px solid oklch(0.22 0.08 160 / 0.35)",
            }}
            onClick={() => onGoToTab("news")}
          >
            <Newspaper
              className="w-8 h-8 flex-shrink-0"
              style={{ color: "oklch(0.72 0.14 160)" }}
            />
            <div>
              <p className="text-sm font-semibold text-white">
                Latest news about &ldquo;{lastQuery}&rdquo;
              </p>
              <p className="text-xs" style={{ color: "oklch(0.55 0.08 160)" }}>
                HackerNews, Reddit, Wikipedia, The Guardian
              </p>
            </div>
          </button>
        </motion.div>
      )}
    </div>
  );
}
