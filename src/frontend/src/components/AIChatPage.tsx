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
    // biome-ignore lint/security/noGlobalEval: using Function constructor for safe math
    // biome-ignore lint/security/noGlobalEval: safe
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
  followUps?: string[];
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

function generateFollowUps(query: string): string[] {
  const q = query.toLowerCase();
  if (q.includes("what") || q.includes("how"))
    return ["Give me an example", "Why is this important?", "Tell me more"];
  if (q.includes("who"))
    return ["What did they do?", "When did this happen?", "Related figures"];
  if (q.includes("why"))
    return ["Explain in simpler terms", "Give me an example", "Tell me more"];
  return ["Explain in simpler terms", "Related topics", "Fun facts about this"];
}

const APP_FAQ: Record<string, string> = {
  tabs: "Research Hub has these main sections: Articles, Images, Videos, Films, Audio, GIFs & Memes, E-books, AI Chat (that's me!), News, Datasets, Tools, Community Forums, Direct Messages, Archive.org, Settings, and Admin.",
  follow:
    "To follow someone, go to Community, tap on a user's profile or username, then tap the Follow button. They'll appear in your Following list on your profile page.",
  "direct message":
    "To send a direct message, you need to be friends first. Go to a user's profile, send a friend request, and once they accept, you can chat in the Messages tab.",
  comics:
    "Comics are managed through the Admin panel. Admins can browse and manage the comic library from within the admin dashboard.",
  admin:
    "Admin access requires the passcode TRX. Admins can moderate content, promote users to Moderator or Admin roles, manage communities, run polls, and block users from chats.",
  search:
    "The main search bar at the top searches everything at once -- articles, images, videos, and more. Each tab also has its own search bar for more targeted searches.",
  ebooks:
    "The E-books tab lets you search and read books from Project Gutenberg and Open Library. Tap any book to read it right inside the app for free!",
  sensitive:
    "Sensitive content is blurred by default. You can turn this off in Settings by toggling the Sensitive Content Filter switch.",
  settings:
    "In Settings you can toggle: Dark Mode, Sensitive Content Filter, Notifications, Compact Mode, Auto-Play Videos, and adjust Text Size.",
  credits:
    "AI credits let you do more searches per day. Earn them by logging in daily, installing the app, or participating in the community. Admins have unlimited credits.",
  archive:
    "The Archive tab lets you browse Internet Archive (archive.org) content directly. You can also find Archive content in the Videos, Images, and Audio tabs.",
  community:
    "The Community tab has Reddit-style forums where you can post, reply, upvote, and join discussions. You can also follow other users and send direct messages.",
  news: "The News tab aggregates articles from multiple sources including BBC, NPR, HackerNews, The Guardian, and more. You can also post your own news articles.",
};

function getAppFAQAnswer(query: string): string | null {
  const q = query.toLowerCase();
  const isAboutApp =
    q.includes("research hub") ||
    q.includes("this app") ||
    q.includes("the app") ||
    q.includes("your app") ||
    q.includes("this site") ||
    q.includes("this website") ||
    q.includes("how do i") ||
    q.includes("how do you") ||
    q.includes("how to") ||
    q.includes("can i") ||
    q.includes("where is") ||
    q.includes("what tabs") ||
    q.includes("do you have");

  if (isAboutApp) {
    for (const [key, answer] of Object.entries(APP_FAQ)) {
      if (q.includes(key)) return answer;
    }
    if (
      (q.includes("what") || q.includes("tell me")) &&
      (q.includes("app") ||
        q.includes("site") ||
        q.includes("website") ||
        q.includes("tabs") ||
        q.includes("features"))
    ) {
      return "Research Hub is your all-in-one research platform! I can help you find articles, images, videos, audio, e-books, GIFs, memes, news, and more. We also have AI Chat (that's me!), community forums, direct messaging, and tools like citation generators and mind maps. What would you like to explore?";
    }
  }
  return null;
}
function getConversationalReply(query: string): string | null {
  const q = query.trim().toLowerCase();

  // Greetings
  const greetings = [
    "hi",
    "hello",
    "hey",
    "howdy",
    "hiya",
    "sup",
    "yo",
    "greetings",
    "good morning",
    "good afternoon",
    "good evening",
    "good night",
  ];
  if (
    greetings.some(
      (g) => q === g || q.startsWith(`${g} `) || q.startsWith(`${g}!`),
    )
  ) {
    const replies = [
      "Hey there! I'm your Research Hub study partner. Ask me anything — science, history, math, literature, current events. What's on your mind?",
      "Hi! Ready to learn something new today? I can help you research any topic, solve math problems, or just chat. What are you curious about?",
      "Hello! I'm here to help you explore, learn, and discover. Got a question or something you want to research?",
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  // How are you / what's up
  if (
    q.match(
      /^(how are you|how r u|how are u|what'?s up|how'?s it going|how do you do|you ok|are you ok)/,
    )
  ) {
    return "I'm doing great, thanks for asking! I'm always ready to help you learn something new. What would you like to explore today?";
  }

  // What's your name
  if (
    q.match(
      /^(what'?s your name|who are you|what are you|tell me about yourself|introduce yourself)/,
    )
  ) {
    return "I'm the Research Hub AI — your study partner and research assistant! I can answer questions, explain concepts, solve math, and search across millions of articles, videos, and more. What do you want to learn about?";
  }

  // What can you do
  if (
    q.match(
      /^(what can you do|what do you do|help|how do you work|what are your abilities|what are your features)/,
    )
  ) {
    return "I can do a lot! Here's what I'm good at: answer any question directly, solve math, explain science/history/literature, and search across millions of articles, videos, and audio. I can also answer questions about this app. Just type anything you're curious about!";
  }

  // Thank you
  if (q.match(/^(thanks|thank you|thank u|thx|ty|appreciate it|cheers)/)) {
    return "You're welcome! Happy to help anytime. Got any more questions?";
  }

  // Bye / goodbye
  if (q.match(/^(bye|goodbye|see you|see ya|later|cya|good night|take care)/)) {
    return "See you later! Come back anytime you have questions or want to explore something new. Happy researching!";
  }

  // Definition queries — answer directly
  const defMatch = q.match(
    /^(what(?:'s| is) (?:the )?(?:definition of |meaning of )?|define |meaning of |explain |what does .+ mean)(.+)/,
  );
  if (defMatch) {
    // Don't catch multi-word research queries, only simple "what is X" with a short term
    const term = defMatch[2]?.trim() ?? "";
    if (term && term.split(" ").length <= 4 && !term.includes("?")) {
      // Return null to let the normal research flow handle it, but we'll prepend the direct answer style
      return null;
    }
  }

  return null;
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
                followUps: generateFollowUps(q),
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

    // Check conversational/casual messages first (greetings, thanks, etc.)
    const conversationalReply = getConversationalReply(query);
    if (conversationalReply !== null) {
      setMessages((prev) => [
        ...prev,
        { id: `u-${Date.now() - 1}`, role: "user" as const, text: query },
        {
          id: `a-${Date.now()}`,
          role: "assistant" as const,
          text: conversationalReply,
          followUps: [
            "Tell me something interesting",
            "What can you research?",
            "How do I use this app?",
          ],
        },
      ]);
      return;
    }

    // Check FAQ for app-related questions first
    const faqAnswer = getAppFAQAnswer(query);
    if (faqAnswer !== null) {
      const faqMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: faqAnswer,
        followUps: [
          "What would you like to know more about?",
          "Tell me more about the community",
          "How do I get started?",
        ],
      };
      setMessages((prev) => [
        ...prev,
        { id: `u-${Date.now() - 1}`, role: "user", text: query },
        faqMsg,
      ]);
      return;
    }

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
                  {/* Follow-up question chips */}
                  {!msg.isLoading &&
                    msg.followUps &&
                    msg.followUps.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span
                          className="text-[10px] w-full"
                          style={{ color: "oklch(0.45 0.04 240)" }}
                        >
                          Ask a follow-up:
                        </span>
                        {msg.followUps.map((fu) => (
                          <button
                            key={fu}
                            type="button"
                            data-ocid="ai.secondary_button"
                            onClick={() => handleSend(fu)}
                            className="text-xs px-3 py-1.5 rounded-full transition-all hover:opacity-90"
                            style={{
                              background: "oklch(0.52 0.18 145 / 0.12)",
                              border: "1px solid oklch(0.52 0.18 145 / 0.35)",
                              color: "oklch(0.72 0.14 145)",
                            }}
                          >
                            {fu}
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
                : "Ask me anything -- history, science, math, current events, or anything you're curious about."
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
