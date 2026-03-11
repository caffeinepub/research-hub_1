import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  ExternalLink,
  Loader2,
  Search,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useResearch } from "../hooks/useResearch";
import type {
  AudioResult,
  WikiArticle,
  WikiImage,
  WikiVideo,
} from "../types/research";
import {
  canSearch,
  getRemainingSearches,
  isAdmin,
  recordSearch,
} from "../utils/aiCredits";

function evaluateMath(query: string): string | null {
  const mathPattern =
    /^[\d\s\+\-\*\/\^\(\)\.\%]+$|(\d+\s*(plus|minus|times|divided by|multiplied by|\+|\-|\*|\/|x)\s*\d+)/i;
  if (!mathPattern.test(query.trim())) return null;
  try {
    const expr = query
      .toLowerCase()
      .replace(/plus/g, "+")
      .replace(/minus/g, "-")
      .replace(/times|multiplied by/g, "*")
      .replace(/divided by/g, "/")
      .replace(/x/g, "*")
      .replace(/[^0-9\+\-\*\/\(\)\.\%\s]/g, "");
    // biome-ignore lint/security/noGlobalEval: safe math eval
    const result = Function(`"use strict"; return (${expr})`)();
    if (typeof result === "number" && Number.isFinite(result)) {
      return result % 1 === 0
        ? result.toString()
        : result.toFixed(6).replace(/\.?0+$/, "");
    }
    return null;
  } catch {
    return null;
  }
}

// Solve simple linear equations like "2x+5=11" or "x/3=7"
function solveLinearEquation(
  query: string,
): { steps: string[]; answer: string } | null {
  const eq = query.trim().replace(/\s+/g, "");
  const match = eq.match(/^([\d.]*)[xX]([+\-][\d.]+)?=([+\-]?[\d.]+)$/);
  if (!match) return null;
  const a =
    match[1] === "" || match[1] === undefined ? 1 : Number.parseFloat(match[1]);
  const b = match[2] ? Number.parseFloat(match[2]) : 0;
  const c = Number.parseFloat(match[3]);
  if (a === 0) return null;
  const x = (c - b) / a;
  const steps: string[] = [
    `Start with: ${eq.replace("=", " = ")}`,
    b !== 0
      ? `Subtract ${b > 0 ? b : `(${b})`} from both sides: ${a}x = ${c} - ${b} = ${c - b}`
      : `Equation: ${a}x = ${c}`,
    `Divide both sides by ${a}: x = ${c - b} / ${a}`,
    `x = ${x % 1 === 0 ? x : x.toFixed(4)}`,
  ];
  return { steps, answer: x % 1 === 0 ? x.toString() : x.toFixed(4) };
}

function buildStudyReply(query: string): string {
  const q = query.trim().toLowerCase();
  if (q.includes("derivative") || q.includes("d/dx")) {
    return "To find a derivative, apply the power rule: d/dx[xⁿ] = n·xⁿ⁻¹. For example, d/dx[x³] = 3x². Use the chain rule for composite functions. What specific function would you like help with?";
  }
  if (q.includes("integral") || q.includes("∫")) {
    return "Integration is the reverse of differentiation. The power rule for integrals: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C. For example, ∫x² dx = x³/3 + C. What function are you integrating?";
  }
  if (
    q.includes("pythagorean") ||
    (q.includes("triangle") && q.includes("hypotenuse"))
  ) {
    return "The Pythagorean theorem: a² + b² = c², where c is the hypotenuse. To find c: c = √(a² + b²). Example: a=3, b=4 → c = √(9+16) = √25 = 5. Give me your values and I'll solve it!";
  }
  if (q.includes("quadratic") || (q.includes("x²") && q.includes("="))) {
    return "For a quadratic equation ax² + bx + c = 0, use the quadratic formula:\nx = (-b ± √(b²-4ac)) / 2a\n\nThe discriminant b²-4ac tells you: >0 two real roots, =0 one root, <0 no real roots. What are your a, b, c values?";
  }
  if (q.includes("photosynthesis")) {
    return "Photosynthesis is how plants make food using sunlight:\n6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂\n\nLight reactions (in thylakoids) convert light to ATP and NADPH. The Calvin cycle (in stroma) uses these to fix CO₂ into glucose.";
  }
  if (q.includes("newton") || q.includes("force") || q.includes("f=ma")) {
    return "Newton's Laws of Motion:\n1. Inertia: An object at rest stays at rest unless acted on by a force.\n2. F = ma (Force = mass × acceleration)\n3. Every action has an equal and opposite reaction.\n\nF = ma means: if F = 20N and m = 4kg, then a = 20/4 = 5 m/s².";
  }
  return `Great study question about "${query}"! I'll search my knowledge base for articles, explanations, and examples to help you understand this topic.`;
}

function buildConversationalReply(
  query: string,
  articles: WikiArticle[],
): string {
  const q = query.trim();
  const first = articles[0];

  if (first?.fullSummary) {
    const summary = first.fullSummary.slice(0, 300).trim();
    const endsNicely = /[.!?]$/.test(summary);
    return summary + (endsNicely ? "" : "...");
  }

  if (first?.snippet) {
    return first.snippet
      .replace(/<[^>]+>/g, "")
      .trim()
      .slice(0, 300);
  }

  const topic = q.length > 50 ? `${q.slice(0, 47)}...` : q;
  return `Here's what I found about "${topic}". I've pulled together articles, images, and more from across the web for you.`;
}

function renderTextWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <a
        // biome-ignore lint/suspicious/noArrayIndexKey: link parts
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
        style={{ color: "oklch(0.65 0.16 220)" }}
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  steps?: string[];
  results?: {
    articles: WikiArticle[];
    images: WikiImage[];
    videos: WikiVideo[];
    audio: AudioResult[];
  };
  suggestions?: string[];
  isLoading?: boolean;
  isCalcResult?: boolean;
  isStudyAnswer?: boolean;
}

const RESEARCH_QUESTIONS = [
  "What is quantum entanglement?",
  "Tell me about the Roman Empire",
  "How does photosynthesis work?",
  "Who was Nikola Tesla?",
  "Explain the Big Bang theory",
  "What are black holes?",
];

const STUDY_QUESTIONS = [
  "Solve 2x + 5 = 11",
  "What is the quadratic formula?",
  "Explain Newton's second law",
  "Solve for x: 3x - 7 = 14",
  "What is the Pythagorean theorem?",
  "Find the derivative of x³",
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

function ArticleCard({
  article,
  onClick,
}: { article: WikiArticle; onClick?: () => void }) {
  return (
    <button
      type="button"
      className="rounded-xl p-3 flex gap-3 items-start w-full text-left cursor-pointer transition-opacity hover:opacity-90"
      style={{
        background: "oklch(0.18 0.05 260 / 0.7)",
        border: "1px solid oklch(0.3 0.06 255 / 0.4)",
      }}
      onClick={onClick}
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
    </button>
  );
}

function VideoCard({
  video,
  onClick,
}: { video: WikiVideo; onClick?: () => void }) {
  return (
    <button
      type="button"
      className="rounded-xl p-3 flex gap-3 items-center w-full text-left cursor-pointer transition-opacity hover:opacity-90"
      style={{
        background: "oklch(0.18 0.05 260 / 0.7)",
        border: "1px solid oklch(0.3 0.06 255 / 0.4)",
      }}
      onClick={onClick}
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
    </button>
  );
}

interface AIChatPageProps {
  onSearchMore?: (query: string) => void;
}

export function AIChatPage({ onSearchMore }: AIChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"research" | "study">("research");
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
                text: buildConversationalReply(q, results.articles),
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
    if (!canSearch()) {
      toast.error("Daily limit reached. Earn more credits in Settings!");
      return;
    }
    setInput("");

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text: query,
    };

    // Check math expression first
    const mathResult = evaluateMath(query);
    if (mathResult !== null) {
      const calcMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: `= ${mathResult}`,
        isCalcResult: true,
      };
      setMessages((prev) => [...prev, userMsg, calcMsg]);
      return;
    }

    // Check linear equation (study mode)
    if (mode === "study") {
      const eqResult = solveLinearEquation(query);
      if (eqResult !== null) {
        const studyMsg: Message = {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: `Answer: x = ${eqResult.answer}`,
          steps: eqResult.steps,
          isStudyAnswer: true,
        };
        setMessages((prev) => [...prev, userMsg, studyMsg]);
        return;
      }

      // Generic study reply with knowledge base search
      const studyText = buildStudyReply(query);
      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: "",
        isLoading: true,
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      recordSearch();
      pendingQueryRef.current = query;
      // Show study reply first, then update with real results
      setMessages((prev) =>
        prev.map((m) =>
          m.isLoading ? { ...m, isLoading: false, text: studyText } : m,
        ),
      );
      search(query);
      return;
    }

    const assistantMsg: Message = {
      id: `a-${Date.now()}`,
      role: "assistant",
      text: "",
      isLoading: true,
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    recordSearch();
    pendingQueryRef.current = query;
    search(query);
  };

  const isEmpty = messages.length === 0;
  const exampleQuestions =
    mode === "study" ? STUDY_QUESTIONS : RESEARCH_QUESTIONS;

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      {/* Mode toggle */}
      <div
        className="flex-shrink-0 flex justify-center pt-3 px-4"
        style={{ background: "oklch(0.10 0.04 265)" }}
      >
        <div
          className="flex rounded-full p-0.5 gap-0"
          style={{
            background: "oklch(0.18 0.05 260)",
            border: "1px solid oklch(0.28 0.06 255 / 0.5)",
          }}
        >
          <button
            type="button"
            data-ocid="ai.tab"
            onClick={() => setMode("research")}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background:
                mode === "research" ? "oklch(0.52 0.18 220)" : "transparent",
              color: mode === "research" ? "white" : "oklch(0.55 0.06 240)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Research
          </button>
          <button
            type="button"
            data-ocid="ai.tab"
            onClick={() => setMode("study")}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background:
                mode === "study" ? "oklch(0.65 0.18 145)" : "transparent",
              color: mode === "study" ? "white" : "oklch(0.55 0.06 240)",
            }}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Study
          </button>
        </div>
      </div>

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
            className="flex flex-col items-center gap-6 pt-6 px-2"
            data-ocid="ai.empty_state"
          >
            {/* Heading */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                {mode === "study" ? (
                  <BookOpen
                    className="w-6 h-6"
                    style={{ color: "oklch(0.72 0.18 145)" }}
                  />
                ) : (
                  <Sparkles
                    className="w-6 h-6"
                    style={{ color: "oklch(0.72 0.18 150)" }}
                  />
                )}
                <h2
                  className="font-display text-2xl font-bold"
                  style={{ color: "oklch(0.95 0.01 240)" }}
                >
                  {mode === "study" ? "Study Helper" : "Research Hub AI"}
                </h2>
              </div>
              <p className="text-sm" style={{ color: "oklch(0.55 0.05 240)" }}>
                {mode === "study"
                  ? "Solve equations, get step-by-step explanations, and learn"
                  : "Search across millions of articles, videos, audio & more"}
              </p>
            </div>

            {/* Example chips */}
            <div className="w-full max-w-lg">
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-2 text-center"
                style={{ color: "oklch(0.45 0.06 240)" }}
              >
                {mode === "study" ? "Try a problem" : "Try asking"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {exampleQuestions.map((q) => (
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
                          {mode === "study" ? "Thinking..." : "Researching..."}
                        </span>
                      </div>
                    ) : msg.isCalcResult ? (
                      <div>
                        <div
                          className="text-2xl font-bold font-mono"
                          style={{ color: "oklch(0.72 0.18 150)" }}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ) : msg.isStudyAnswer ? (
                      <div className="space-y-2">
                        <div
                          className="text-lg font-bold font-mono"
                          style={{ color: "oklch(0.72 0.18 145)" }}
                        >
                          {msg.text}
                        </div>
                        {msg.steps && (
                          <div className="space-y-1">
                            <p
                              className="text-xs font-semibold uppercase tracking-wide"
                              style={{ color: "oklch(0.55 0.06 240)" }}
                            >
                              Step-by-step:
                            </p>
                            {msg.steps.map((step, si) => (
                              <div
                                // biome-ignore lint/suspicious/noArrayIndexKey: ordered steps
                                key={si}
                                className="flex gap-2 text-sm"
                                style={{ color: "oklch(0.80 0.04 240)" }}
                              >
                                <span
                                  className="font-mono text-xs w-4 flex-shrink-0 mt-0.5"
                                  style={{ color: "oklch(0.65 0.18 145)" }}
                                >
                                  {si + 1}.
                                </span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span>{renderTextWithLinks(msg.text)}</span>
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
                              onClick={() => onSearchMore?.(article.title)}
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
                              onClick={() =>
                                video.url
                                  ? window.open(video.url, "_blank")
                                  : undefined
                              }
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
            background: "white",
            boxShadow: "0 2px 12px oklch(0 0 0 / 0.3)",
          }}
        >
          {mode === "study" ? (
            <BookOpen
              className="ml-4 w-5 h-5 flex-shrink-0"
              style={{ color: "oklch(0.55 0.12 145)" }}
            />
          ) : (
            <Search
              className="ml-4 w-5 h-5 flex-shrink-0"
              style={{ color: "oklch(0.45 0.06 240)" }}
            />
          )}
          <Input
            ref={inputRef}
            data-ocid="ai.input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "study"
                ? "Solve 2x+5=11, or ask a study question..."
                : "Ask anything... e.g. What is quantum physics?"
            }
            className="flex-1 h-12 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0 px-3"
            style={{ color: "#111" }}
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
                  ? mode === "study"
                    ? "oklch(0.65 0.18 145)"
                    : "oklch(0.72 0.18 150)"
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
        <p
          className="text-center text-xs mt-1.5"
          style={{ color: "oklch(0.45 0.05 240)" }}
        >
          {isAdmin()
            ? "Unlimited (Admin)"
            : `${getRemainingSearches() === Number.POSITIVE_INFINITY ? "∞" : getRemainingSearches()} searches left today`}
        </p>
      </div>
    </div>
  );
}
