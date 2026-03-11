import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ExternalLink,
  Loader2,
  Search,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useResearch } from "../hooks/useResearch";
import type {
  AudioResult,
  WikiArticle,
  WikiImage,
  WikiVideo,
} from "../types/research";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  results?: {
    articles: WikiArticle[];
    images: WikiImage[];
    videos: WikiVideo[];
    audio: AudioResult[];
  };
  suggestions?: string[];
  isLoading?: boolean;
}

const EXAMPLE_QUESTIONS = [
  "What is quantum entanglement?",
  "Tell me about the Roman Empire",
  "How does photosynthesis work?",
  "Who was Nikola Tesla?",
  "Explain the Big Bang theory",
  "What are black holes?",
];

function getSuggestions(query: string): string[] {
  const q = query.toLowerCase();
  if (q.includes("space") || q.includes("universe") || q.includes("cosmos"))
    return ["Dark matter", "Exoplanets", "Neutron stars"];
  if (
    q.includes("history") ||
    q.includes("ancient") ||
    q.includes("roman") ||
    q.includes("empire")
  )
    return ["Ancient Egypt", "Greek civilization", "Medieval Europe"];
  if (
    q.includes("biology") ||
    q.includes("evolution") ||
    q.includes("photosynthesis")
  )
    return ["DNA replication", "Cell biology", "Natural selection"];
  if (q.includes("quantum") || q.includes("physics"))
    return ["String theory", "Relativity", "Particle physics"];
  if (q.includes("music") || q.includes("jazz") || q.includes("classical"))
    return ["Music theory", "Baroque period", "Jazz history"];
  if (q.includes("art") || q.includes("painting"))
    return ["Renaissance art", "Impressionism", "Modern sculpture"];
  const words = query.trim().split(" ").filter(Boolean);
  const main = words[0] ?? query;
  return [`${main} history`, `${main} science`, `How does ${main} work`];
}

function ArticleCard({ article }: { article: WikiArticle }) {
  return (
    <div
      className="rounded-xl p-3 flex gap-3 items-start"
      style={{
        background: "oklch(0.18 0.05 260 / 0.7)",
        border: "1px solid oklch(0.3 0.06 255 / 0.4)",
      }}
    >
      {article.thumbnail && (
        <img
          src={article.thumbnail.source}
          alt={article.title}
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
        />
      )}
      <div className="min-w-0 flex-1">
        <p
          className="text-sm font-semibold leading-snug truncate"
          style={{ color: "oklch(0.92 0.04 240)" }}
        >
          {article.title}
        </p>
        <p
          className="text-xs mt-0.5 line-clamp-2"
          style={{ color: "oklch(0.62 0.05 240)" }}
        >
          {article.snippet || article.fullSummary?.slice(0, 120) || ""}
        </p>
        <span
          className="inline-block text-xs mt-1 px-1.5 py-0.5 rounded-full"
          style={{
            background: "oklch(0.72 0.18 150 / 0.15)",
            color: "oklch(0.72 0.18 150)",
          }}
        >
          {article.source}
        </span>
      </div>
    </div>
  );
}

function VideoCard({ video }: { video: WikiVideo }) {
  return (
    <div
      className="rounded-xl p-3 flex gap-3 items-center"
      style={{
        background: "oklch(0.18 0.05 260 / 0.7)",
        border: "1px solid oklch(0.3 0.06 255 / 0.4)",
      }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "oklch(0.52 0.18 20 / 0.2)" }}
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ color: "oklch(0.72 0.18 30)" }}
          aria-label="Play"
          role="img"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="text-sm font-semibold leading-snug truncate"
          style={{ color: "oklch(0.92 0.04 240)" }}
        >
          {video.title}
        </p>
        <span
          className="inline-block text-xs px-1.5 py-0.5 rounded-full mt-0.5"
          style={{
            background: "oklch(0.52 0.18 20 / 0.15)",
            color: "oklch(0.72 0.18 30)",
          }}
        >
          {video.source}
        </span>
      </div>
    </div>
  );
}

interface AIChatPageProps {
  onSearchMore?: (query: string) => void;
}

export function AIChatPage({ onSearchMore }: AIChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { search, results, status } = useResearch();
  const pendingQueryRef = useRef<string | null>(null);

  // When results come in, update the pending assistant message
  useEffect(() => {
    if (status === "success" && pendingQueryRef.current !== null) {
      const q = pendingQueryRef.current;
      pendingQueryRef.current = null;
      const suggestions = getSuggestions(q);
      setMessages((prev) =>
        prev.map((m) =>
          m.isLoading
            ? {
                ...m,
                isLoading: false,
                text: `Here's what I found for "${q}":`,
                results: {
                  articles: results.articles.slice(0, 3),
                  images: results.images.slice(0, 4),
                  videos: results.videos.slice(0, 2),
                  audio: results.audio.slice(0, 2),
                },
                suggestions,
              }
            : m,
        ),
      );
    } else if (status === "error" && pendingQueryRef.current !== null) {
      pendingQueryRef.current = null;
      setMessages((prev) =>
        prev.map((m) =>
          m.isLoading
            ? {
                ...m,
                isLoading: false,
                text: "Sorry, I couldn't fetch results. Please try again.",
              }
            : m,
        ),
      );
    }
  }, [status, results]);

  // Auto-scroll to bottom when messages update
  // biome-ignore lint/correctness/useExhaustiveDependencies: messages triggers scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (q?: string) => {
    const query = (q ?? input).trim();
    if (!query) return;
    setInput("");

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text: query,
    };
    const assistantMsg: Message = {
      id: `a-${Date.now()}`,
      role: "assistant",
      text: "",
      isLoading: true,
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    pendingQueryRef.current = query;
    search(query);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 128px)" }}>
      {/* Messages scroll area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        style={{ background: "oklch(0.10 0.04 265)" }}
        data-ocid="ai.panel"
      >
        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-6 pt-10 px-2"
            data-ocid="ai.empty_state"
          >
            {/* Google-style heading */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Sparkles
                  className="w-6 h-6"
                  style={{ color: "oklch(0.72 0.18 150)" }}
                />
                <h2
                  className="font-display text-2xl font-bold"
                  style={{ color: "oklch(0.95 0.01 240)" }}
                >
                  Research Hub AI
                </h2>
              </div>
              <p className="text-sm" style={{ color: "oklch(0.55 0.05 240)" }}>
                Search across millions of articles, videos, audio &amp; more
              </p>
            </div>

            {/* Example chips */}
            <div className="w-full max-w-lg">
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-2 text-center"
                style={{ color: "oklch(0.45 0.06 240)" }}
              >
                Try asking
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {EXAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    data-ocid="ai.secondary_button"
                    onClick={() => handleSend(q)}
                    className="text-left px-4 py-3 rounded-xl text-sm transition-all"
                    style={{
                      background: "oklch(0.18 0.05 260 / 0.8)",
                      border: "1px solid oklch(0.3 0.06 255 / 0.5)",
                      color: "oklch(0.78 0.06 240)",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex gap-3 ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
                data-ocid={msg.role === "user" ? "ai.item.1" : "ai.item.2"}
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                  style={{
                    background:
                      msg.role === "assistant"
                        ? "oklch(0.72 0.18 150 / 0.2)"
                        : "oklch(0.52 0.18 220 / 0.2)",
                    border: `1px solid ${
                      msg.role === "assistant"
                        ? "oklch(0.72 0.18 150 / 0.4)"
                        : "oklch(0.52 0.18 220 / 0.4)"
                    }`,
                  }}
                >
                  {msg.role === "assistant" ? (
                    <Sparkles
                      className="w-4 h-4"
                      style={{ color: "oklch(0.72 0.18 150)" }}
                    />
                  ) : (
                    <User
                      className="w-4 h-4"
                      style={{ color: "oklch(0.65 0.16 220)" }}
                    />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[80%] ${
                    msg.role === "user" ? "items-end" : "items-start"
                  } flex flex-col gap-3`}
                >
                  <div
                    className="px-4 py-3 rounded-2xl text-sm"
                    style={{
                      background:
                        msg.role === "user"
                          ? "oklch(0.52 0.18 220 / 0.25)"
                          : "oklch(0.16 0.05 260 / 0.8)",
                      border: `1px solid ${
                        msg.role === "user"
                          ? "oklch(0.52 0.18 220 / 0.4)"
                          : "oklch(0.28 0.05 255 / 0.5)"
                      }`,
                      color: "oklch(0.90 0.03 240)",
                    }}
                  >
                    {msg.isLoading ? (
                      <div
                        className="flex items-center gap-2"
                        data-ocid="ai.loading_state"
                      >
                        <Loader2
                          className="w-4 h-4 animate-spin"
                          style={{ color: "oklch(0.72 0.18 150)" }}
                        />
                        <span style={{ color: "oklch(0.65 0.06 240)" }}>
                          Researching...
                        </span>
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>

                  {/* Results */}
                  {!msg.isLoading && msg.results && (
                    <div className="w-full space-y-3">
                      {/* Articles */}
                      {msg.results.articles.length > 0 && (
                        <div className="space-y-2">
                          <p
                            className="text-xs font-semibold uppercase tracking-widest"
                            style={{ color: "oklch(0.50 0.06 240)" }}
                          >
                            Articles
                          </p>
                          {msg.results.articles.map((article, i) => (
                            <ArticleCard
                              key={`${article.pageid}-${i}`}
                              article={article}
                            />
                          ))}
                        </div>
                      )}

                      {/* Images */}
                      {msg.results.images.length > 0 && (
                        <div>
                          <p
                            className="text-xs font-semibold uppercase tracking-widest mb-2"
                            style={{ color: "oklch(0.50 0.06 240)" }}
                          >
                            Images
                          </p>
                          <div className="grid grid-cols-4 gap-1.5">
                            {msg.results.images.map((img, i) => (
                              <img
                                key={`${img.pageid}-${i}`}
                                src={img.thumbUrl ?? img.url}
                                alt={img.title}
                                className="w-full aspect-square object-cover rounded-lg"
                                style={{
                                  border:
                                    "1px solid oklch(0.25 0.05 255 / 0.4)",
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Videos */}
                      {msg.results.videos.length > 0 && (
                        <div className="space-y-2">
                          <p
                            className="text-xs font-semibold uppercase tracking-widest"
                            style={{ color: "oklch(0.50 0.06 240)" }}
                          >
                            Videos
                          </p>
                          {msg.results.videos.map((video, i) => (
                            <VideoCard
                              key={`${video.pageid}-${i}`}
                              video={video}
                            />
                          ))}
                        </div>
                      )}

                      {/* Search more */}
                      <button
                        type="button"
                        data-ocid="ai.secondary_button"
                        onClick={() => onSearchMore?.(msg.text)}
                        className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-colors"
                        style={{
                          background: "oklch(0.72 0.18 150 / 0.12)",
                          border: "1px solid oklch(0.72 0.18 150 / 0.3)",
                          color: "oklch(0.72 0.18 150)",
                        }}
                        onMouseEnter={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "oklch(0.72 0.18 150 / 0.22)";
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "oklch(0.72 0.18 150 / 0.12)";
                        }}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Search more in full results
                      </button>
                    </div>
                  )}

                  {/* Follow-up suggestions */}
                  {!msg.isLoading && msg.suggestions && (
                    <div className="flex flex-wrap gap-2">
                      {msg.suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          data-ocid="ai.toggle"
                          onClick={() => handleSend(s)}
                          className="text-xs px-3 py-1.5 rounded-full transition-colors"
                          style={{
                            background: "oklch(0.20 0.06 260 / 0.7)",
                            border: "1px solid oklch(0.35 0.08 255 / 0.5)",
                            color: "oklch(0.78 0.08 230)",
                          }}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.background = "oklch(0.72 0.18 150 / 0.15)";
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.borderColor = "oklch(0.72 0.18 150 / 0.4)";
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.background = "oklch(0.20 0.06 260 / 0.7)";
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.borderColor = "oklch(0.35 0.08 255 / 0.5)";
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Input bar — always visible above bottom nav */}
      <div
        className="flex-shrink-0 px-4 py-3"
        style={{
          background: "oklch(0.10 0.04 265)",
          borderTop: "1px solid oklch(0.22 0.05 260)",
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-0 rounded-full overflow-hidden max-w-2xl mx-auto"
          style={{
            background: "oklch(0.96 0.01 240)",
            boxShadow: "0 2px 12px oklch(0 0 0 / 0.3)",
          }}
        >
          <Search
            className="ml-4 w-5 h-5 flex-shrink-0"
            style={{ color: "oklch(0.45 0.06 240)" }}
          />
          <Input
            ref={inputRef}
            data-ocid="ai.input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything... e.g. What is quantum physics?"
            className="flex-1 h-12 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0 px-3"
            style={{ color: "oklch(0.20 0.04 260)" }}
            disabled={status === "loading"}
          />
          <Button
            type="submit"
            data-ocid="ai.submit_button"
            disabled={!input.trim() || status === "loading"}
            className="h-12 w-12 p-0 rounded-full flex-shrink-0 mr-0"
            style={{
              background:
                input.trim() && status !== "loading"
                  ? "oklch(0.72 0.18 150)"
                  : "oklch(0.25 0.05 255)",
              color: "white",
            }}
          >
            {status === "loading" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
