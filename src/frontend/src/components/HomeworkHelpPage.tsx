import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Calculator,
  FlaskConical,
  GraduationCap,
  Loader2,
  PenLine,
  Scroll,
  Send,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { WikiArticle, WikiVideo } from "../types/research";

type Subject = "math" | "science" | "history" | "english" | "writing";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  articles?: WikiArticle[];
  videos?: WikiVideo[];
  mathResult?: string;
  isLoading?: boolean;
}

const SUBJECTS: {
  key: Subject;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    key: "math",
    label: "Math",
    icon: Calculator,
    color: "oklch(0.72 0.18 55)",
  },
  {
    key: "science",
    label: "Science",
    icon: FlaskConical,
    color: "oklch(0.65 0.18 200)",
  },
  {
    key: "history",
    label: "History",
    icon: Scroll,
    color: "oklch(0.72 0.18 30)",
  },
  {
    key: "english",
    label: "English",
    icon: BookOpen,
    color: "oklch(0.65 0.18 320)",
  },
  {
    key: "writing",
    label: "Writing",
    icon: PenLine,
    color: "oklch(0.7 0.18 160)",
  },
];

const SUBJECT_PROMPTS: Record<Subject, string> = {
  math: "Enter a math problem or equation (e.g. 2x + 5 = 13, or 24 * 7)...",
  science: "Ask a science question (e.g. How does gravity work?)...",
  history: "Ask a history question (e.g. What caused WWI?)...",
  english: "Ask an English question (e.g. What is a metaphor?)...",
  writing: "Ask for writing help (e.g. How do I write a thesis statement?)...",
};

const EXAMPLE_QUESTIONS: Record<Subject, string[]> = {
  math: [
    "Solve: 3x² - 12 = 0",
    "What is 15% of 240?",
    "Area of a circle with radius 7",
    "Convert 3/4 to decimal",
  ],
  science: [
    "How does photosynthesis work?",
    "What is Newton's second law?",
    "Explain the water cycle",
    "What is DNA?",
  ],
  history: [
    "What caused World War I?",
    "Who was Cleopatra?",
    "Causes of the French Revolution",
    "Ancient Roman government",
  ],
  english: [
    "What is a simile vs metaphor?",
    "Explain iambic pentameter",
    "What is a thesis statement?",
    "Parts of speech",
  ],
  writing: [
    "How to write an introduction",
    "5-paragraph essay structure",
    "Improve my thesis: 'Dogs are good'",
    "MLA vs APA citation",
  ],
};

// --- Math evaluator ---
function tryMathEval(expr: string): string | null {
  // Only allow safe math characters
  const safe = expr.replace(/[^0-9+\-*/()^.%\s]/g, "").trim();
  if (!safe) return null;
  try {
    // Convert ^ to ** for exponentiation
    const normalized = safe.replace(/\^/g, "**");
    // Use Function constructor safely (only math chars allowed through filter above)
    const result = Function(`"use strict"; return (${normalized})`)();
    if (typeof result === "number" && Number.isFinite(result)) {
      return Number.isInteger(result)
        ? result.toString()
        : result.toFixed(6).replace(/\.?0+$/, "");
    }
  } catch {
    /* not evaluable */
  }
  return null;
}

function extractMathAnswer(
  question: string,
): { result: string; steps: string[] } | null {
  const q = question.trim();

  // Simple equation: ax + b = c  →  x = (c-b)/a
  const linearMatch = q.match(
    /([+-]?\d*\.?\d*)\s*x\s*([+-]\s*\d+\.?\d*)?\s*=\s*([+-]?\d+\.?\d*)/i,
  );
  if (linearMatch) {
    const a = Number.parseFloat(linearMatch[1] || "1") || 1;
    const b = Number.parseFloat((linearMatch[2] ?? "").replace(/\s/g, "")) || 0;
    const c = Number.parseFloat(linearMatch[3]);
    if (!Number.isNaN(a) && !Number.isNaN(b) && !Number.isNaN(c)) {
      const x = (c - b) / a;
      return {
        result: `x = ${x.toFixed(4).replace(/\.?0+$/, "")}`,
        steps: [
          `Starting equation: ${q}`,
          b !== 0
            ? `Subtract ${b} from both sides: ${a}x = ${c - b}`
            : `Coefficient: ${a}x = ${c}`,
          `Divide both sides by ${a}`,
          `x = ${c - b} ÷ ${a} = ${x.toFixed(4).replace(/\.?0+$/, "")}`,
        ],
      };
    }
  }

  // Direct expression (no variable)
  if (!/[a-wyz]/i.test(q)) {
    const result = tryMathEval(q.replace(/=/g, "").trim());
    if (result !== null) {
      return {
        result,
        steps: [
          `Expression: ${q.replace(/=/g, "").trim()}`,
          `Result: ${result}`,
        ],
      };
    }
  }

  // Percentage: X% of Y
  const pctMatch = q.match(/(\d+\.?\d*)\s*%\s*of\s*(\d+\.?\d*)/i);
  if (pctMatch) {
    const pct = Number.parseFloat(pctMatch[1]);
    const num = Number.parseFloat(pctMatch[2]);
    const result = (pct / 100) * num;
    return {
      result: result.toString(),
      steps: [
        `${pct}% of ${num}`,
        `= (${pct} ÷ 100) × ${num}`,
        `= ${pct / 100} × ${num}`,
        `= ${result}`,
      ],
    };
  }

  return null;
}

// --- Research fetcher for study help ---
async function fetchStudyContent(
  query: string,
  subject: Subject,
): Promise<{ articles: WikiArticle[]; videos: WikiVideo[] }> {
  const subjectHint: Record<Subject, string> = {
    math: "mathematics",
    science: "science",
    history: "history",
    english: "language english",
    writing: "writing grammar",
  };

  const enrichedQuery = `${query} ${subjectHint[subject]}`;

  try {
    const [wikiRes, arXivRes] = await Promise.allSettled([
      fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(enrichedQuery)}&format=json&origin=*&srlimit=5&srprop=snippet`,
      ).then((r) => r.json()),
      subject === "math" || subject === "science"
        ? fetch(
            `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=3`,
          ).then((r) => r.text())
        : Promise.resolve(null),
    ]);

    const articles: WikiArticle[] = [];

    if (wikiRes.status === "fulfilled") {
      const items = wikiRes.value?.query?.search ?? [];
      for (const item of items) {
        articles.push({
          pageid: item.pageid,
          title: item.title,
          snippet: item.snippet?.replace(/<[^>]*>/g, "") ?? "",
          source: "Wikipedia",
          expanded: false,
        });
      }
    }

    if (arXivRes.status === "fulfilled" && arXivRes.value) {
      const xml = arXivRes.value as string;
      const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) ?? [];
      for (const entry of entries.slice(0, 3)) {
        const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
        const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
        const _idMatch = entry.match(/<id>([\s\S]*?)<\/id>/);
        if (titleMatch && summaryMatch) {
          articles.push({
            pageid: Math.random(),
            title: titleMatch[1].trim(),
            snippet: summaryMatch[1].trim().slice(0, 200),
            source: "arXiv",
            expanded: false,
          });
        }
      }
    }

    // Archive.org educational videos
    const vidRes = await fetch(
      `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+mediatype:movies+AND+collection:educationalfilms&fl[]=identifier,title,description&rows=4&output=json`,
    )
      .then((r) => r.json())
      .catch(() => null);

    const videos: WikiVideo[] = [];
    if (vidRes?.response?.docs) {
      for (const doc of vidRes.response.docs) {
        videos.push({
          pageid: doc.identifier,
          title: doc.title ?? doc.identifier,
          url: `https://archive.org/embed/${doc.identifier}`,
          mime: "video/mp4",
          description: doc.description,
          source: "Internet Archive",
        });
      }
    }

    return { articles, videos };
  } catch {
    return { articles: [], videos: [] };
  }
}

function buildAssistantText(
  question: string,
  subject: Subject,
  mathAnswer: ReturnType<typeof extractMathAnswer>,
): string {
  if (subject === "math" && mathAnswer) {
    return [
      "📐 **Math Solution**",
      "",
      `**Problem:** ${question}`,
      `**Answer:** ${mathAnswer.result}`,
      "",
      "**Step-by-step:**",
      ...mathAnswer.steps.map((s, i) => `${i + 1}. ${s}`),
    ].join("\n");
  }

  const hints: Record<Subject, string> = {
    math: `I searched for "${question}" — here are educational resources to help you understand this math concept. Work through the articles, and try plugging numbers into the formulas shown.`,
    science: `Here's what I know about "${question}":\n\nScience covers the natural world through observation and experimentation. Based on your question, I've pulled the most relevant educational resources below — read through the articles and watch the videos to get a full explanation. The Wikipedia articles are especially detailed.`,
    history: `Let's explore "${question}" together:\n\nHistory helps us understand how and why events happened. I've found articles and archive materials that cover this topic in depth. Start with the top Wikipedia article for a solid overview, then explore the others for different perspectives.`,
    english: `Here's help with "${question}":\n\nEnglish language and literature have many rules and techniques worth mastering. I've found educational resources that explain this concept clearly. The articles below will give you definitions, examples, and context.`,
    writing: `Writing tips for "${question}":\n\nGood writing takes practice and structure. Here are the best resources I found to help you with this. Work through the articles step by step — they break down the techniques you need.`,
  };

  return hints[subject];
}

export function HomeworkHelpPage() {
  const [subject, setSubject] = useState<Subject>("math");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message count change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text: question,
    };

    const loadingMsg: Message = {
      id: `a-${Date.now()}`,
      role: "assistant",
      text: "",
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput("");

    const mathAnswer = subject === "math" ? extractMathAnswer(question) : null;
    const [studyContent] = await Promise.all([
      fetchStudyContent(question, subject),
    ]);

    const responseText = buildAssistantText(question, subject, mathAnswer);

    setMessages((prev) =>
      prev.map((m) =>
        m.id === loadingMsg.id
          ? {
              ...m,
              text: responseText,
              articles: studyContent.articles,
              videos: studyContent.videos,
              mathResult: mathAnswer?.result,
              isLoading: false,
            }
          : m,
      ),
    );
  };

  const handleExample = (q: string) => {
    setInput(q);
    inputRef.current?.focus();
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{ minHeight: "calc(100vh - 120px)" }}
    >
      {/* Subject selector */}
      <div className="flex gap-2 px-4 pt-4 pb-3 overflow-x-auto shrink-0">
        {SUBJECTS.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            type="button"
            data-ocid={`study.${key}_tab`}
            onClick={() => setSubject(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
            style={{
              background:
                subject === key
                  ? `${color.replace(")", " / 0.2)")}`
                  : "oklch(0.18 0.04 260)",
              color: subject === key ? color : "oklch(0.55 0.06 240)",
              border: `1px solid ${subject === key ? color.replace(")", " / 0.4)") : "oklch(0.28 0.06 260)"}`,
            }}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 space-y-4 pb-4"
        style={{ overscrollBehavior: "contain" }}
      >
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-8 text-center space-y-4"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{
                background: "oklch(0.72 0.18 55 / 0.12)",
                border: "1px solid oklch(0.72 0.18 55 / 0.25)",
              }}
            >
              <GraduationCap
                className="w-8 h-8"
                style={{ color: "oklch(0.78 0.18 55)" }}
              />
            </div>
            <div>
              <p
                className="font-display text-xl font-bold"
                style={{ color: "oklch(0.9 0.05 240)" }}
              >
                Study &amp; Homework Help
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Select a subject above, then ask your question
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {EXAMPLE_QUESTIONS[subject].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleExample(q)}
                  className="px-3 py-1.5 rounded-full text-sm transition-colors hover:opacity-80"
                  style={{
                    background: "oklch(0.26 0.06 260 / 0.6)",
                    color: "oklch(0.72 0.08 230)",
                    border: "1px solid oklch(0.35 0.06 260)",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "user" ? (
                <div
                  className="max-w-[80%] px-4 py-3 rounded-2xl text-sm"
                  style={{
                    background: "oklch(0.52 0.18 220)",
                    color: "white",
                  }}
                >
                  {msg.text}
                </div>
              ) : (
                <div className="max-w-[92%] w-full space-y-3">
                  {/* Assistant bubble */}
                  <div
                    className="px-4 py-3 rounded-2xl text-sm"
                    style={{
                      background: "oklch(0.16 0.04 260)",
                      border: "1px solid oklch(0.28 0.06 260)",
                    }}
                  >
                    {msg.isLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Searching educational resources...
                      </div>
                    ) : (
                      <pre
                        className="whitespace-pre-wrap text-foreground/90 font-sans text-sm leading-relaxed"
                        style={{ fontFamily: "inherit" }}
                      >
                        {msg.text}
                      </pre>
                    )}
                  </div>

                  {/* Math result badge */}
                  {msg.mathResult && (
                    <div
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl"
                      style={{
                        background: "oklch(0.72 0.18 55 / 0.15)",
                        border: "1px solid oklch(0.72 0.18 55 / 0.35)",
                      }}
                    >
                      <Calculator
                        className="w-4 h-4"
                        style={{ color: "oklch(0.78 0.18 55)" }}
                      />
                      <span
                        className="font-mono font-bold"
                        style={{ color: "oklch(0.85 0.15 55)" }}
                      >
                        {msg.mathResult}
                      </span>
                    </div>
                  )}

                  {/* Related articles */}
                  {!msg.isLoading && (msg.articles?.length ?? 0) > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Educational Resources
                      </p>
                      {msg.articles!.slice(0, 4).map((article) => (
                        <div
                          key={article.pageid}
                          className="rounded-xl p-3 flex gap-3 items-start"
                          style={{
                            background: "oklch(0.18 0.05 260 / 0.7)",
                            border: "1px solid oklch(0.3 0.06 255 / 0.4)",
                          }}
                        >
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-sm font-semibold leading-snug"
                              style={{ color: "oklch(0.92 0.04 240)" }}
                            >
                              {article.title}
                            </p>
                            <p
                              className="text-xs mt-0.5 line-clamp-2"
                              style={{ color: "oklch(0.62 0.05 240)" }}
                            >
                              {article.snippet}
                            </p>
                            <Badge
                              variant="outline"
                              className="mt-1 text-xs"
                              style={{
                                borderColor: "oklch(0.35 0.06 260)",
                                color: "oklch(0.6 0.08 240)",
                              }}
                            >
                              {article.source}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Related videos */}
                  {!msg.isLoading && (msg.videos?.length ?? 0) > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Educational Videos
                      </p>
                      {msg.videos!.slice(0, 2).map((video) => (
                        <div
                          key={video.pageid}
                          className="rounded-xl overflow-hidden"
                          style={{
                            border: "1px solid oklch(0.3 0.06 255 / 0.4)",
                          }}
                        >
                          <iframe
                            src={video.url}
                            title={video.title}
                            className="w-full aspect-video"
                            allowFullScreen
                            sandbox="allow-scripts allow-same-origin allow-presentation"
                          />
                          <div className="px-3 py-2">
                            <p className="text-xs text-muted-foreground truncate">
                              {video.title}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input bar */}
      <div
        className="shrink-0 border-t border-border/60 p-4"
        style={{
          background: "oklch(0.12 0.03 260 / 0.95)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex gap-2 items-end">
          <Textarea
            ref={inputRef}
            data-ocid="study.textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={SUBJECT_PROMPTS[subject]}
            className="flex-1 resize-none min-h-[48px] max-h-32 rounded-xl text-sm"
            rows={1}
            style={{
              background: "oklch(0.18 0.04 260)",
              border: "1px solid oklch(0.3 0.06 260)",
              color: "oklch(0.95 0.02 240)",
            }}
          />
          <Button
            type="button"
            data-ocid="study.submit_button"
            onClick={handleSend}
            disabled={!input.trim()}
            className="h-12 w-12 rounded-xl flex-shrink-0 p-0"
            style={{ background: "oklch(0.52 0.18 220)" }}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground/50 mt-1.5 text-center">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
