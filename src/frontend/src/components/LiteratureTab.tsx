import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, ChevronLeft, Loader2, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ComicsTab } from "./ComicsTab";

const GENRE_CHIPS = [
  { label: "Fiction", q: "fiction novel" },
  { label: "History", q: "history ancient" },
  { label: "Science", q: "science physics" },
  { label: "Philosophy", q: "philosophy plato" },
  { label: "Classic", q: "classic literature" },
  { label: "Mystery", q: "mystery detective" },
  { label: "Romance", q: "romance love" },
  { label: "Adventure", q: "adventure voyage" },
];

interface GutBook {
  id: number;
  title: string;
  authors: { name: string }[];
  formats: Record<string, string>;
  download_count: number;
  source: "gutenberg";
}

interface OLBook {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  source: "openlibrary";
  first_publish_year?: number;
}

type Book = GutBook | OLBook;

async function searchGutenberg(query: string): Promise<GutBook[]> {
  try {
    const res = await fetch(
      `https://gutendex.com/books/?search=${encodeURIComponent(query)}&page=1`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).slice(0, 20).map((b: GutBook) => ({
      ...b,
      source: "gutenberg" as const,
    }));
  } catch {
    return [];
  }
}

async function searchOpenLibrary(query: string): Promise<OLBook[]> {
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=15`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.docs || []).slice(0, 15).map((b: OLBook) => ({
      ...b,
      source: "openlibrary" as const,
    }));
  } catch {
    return [];
  }
}

function BooksSection() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [bookText, setBookText] = useState("");
  const [loadingText, setLoadingText] = useState(false);

  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setBooks([]);
    try {
      const [gut, ol] = await Promise.all([
        searchGutenberg(q),
        searchOpenLibrary(q),
      ]);
      const combined: Book[] = [];
      const maxLen = Math.max(gut.length, ol.length);
      for (let i = 0; i < maxLen; i++) {
        if (gut[i]) combined.push(gut[i]);
        if (ol[i]) combined.push(ol[i]);
      }
      setBooks(combined);
      if (combined.length === 0)
        toast.info("No books found. Try a different search.");
    } catch {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    doSearch("popular classics");
  }, []);

  const openBook = async (book: Book) => {
    setSelectedBook(book);
    setBookText("");
    if (book.source === "gutenberg") {
      const id = (book as GutBook).id;
      setLoadingText(true);
      const urls = [
        `https://www.gutenberg.org/files/${id}/${id}-0.txt`,
        `https://www.gutenberg.org/files/${id}/${id}.txt`,
        `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
      ];
      let text = "";
      for (const url of urls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            text = await res.text();
            break;
          }
        } catch {
          // try next
        }
      }
      setLoadingText(false);
      if (text) {
        setBookText(text.slice(0, 80000));
      } else {
        setBookText(
          `Unable to load text directly. Open on Project Gutenberg:\nhttps://www.gutenberg.org/ebooks/${id}`,
        );
      }
    } else {
      const olBook = book as OLBook;
      setBookText(
        `"${olBook.title}" by ${(olBook.author_name || ["Unknown"]).join(", ")}\n\nThis book is available on Open Library.\nVisit: https://openlibrary.org${olBook.key}\n\nOpen Library provides free access to millions of books. Some books have borrowing options or free reads available on their website.`,
      );
    }
  };

  if (selectedBook) {
    const title =
      selectedBook.source === "gutenberg"
        ? (selectedBook as GutBook).title
        : (selectedBook as OLBook).title;
    const author =
      selectedBook.source === "gutenberg"
        ? (selectedBook as GutBook).authors.map((a) => a.name).join(", ")
        : ((selectedBook as OLBook).author_name || ["Unknown"]).join(", ");

    return (
      <div
        className="flex flex-col"
        style={{ height: "100%", minHeight: "calc(100vh - 180px)" }}
      >
        <div
          className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b"
          style={{
            background: "oklch(0.10 0.04 265)",
            borderColor: "oklch(0.22 0.04 260)",
          }}
        >
          <Button
            type="button"
            data-ocid="literature.close_button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedBook(null);
              setBookText("");
            }}
            style={{ color: "oklch(0.72 0.10 240)" }}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold truncate"
              style={{ color: "oklch(0.92 0.03 240)" }}
            >
              {title}
            </p>
            <p
              className="text-xs truncate"
              style={{ color: "oklch(0.55 0.05 240)" }}
            >
              {author}
            </p>
          </div>
          <Button
            type="button"
            data-ocid="literature.close_button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedBook(null);
              setBookText("");
            }}
            style={{ color: "oklch(0.55 0.05 240)" }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4">
            {loadingText ? (
              <div
                data-ocid="literature.loading_state"
                className="flex flex-col items-center gap-3 py-16"
              >
                <Loader2
                  className="w-8 h-8 animate-spin"
                  style={{ color: "oklch(0.65 0.18 220)" }}
                />
                <p
                  className="text-sm"
                  style={{ color: "oklch(0.55 0.05 240)" }}
                >
                  Loading book text...
                </p>
              </div>
            ) : (
              <pre
                className="text-sm whitespace-pre-wrap leading-relaxed font-mono"
                style={{ color: "oklch(0.85 0.03 240)" }}
              >
                {bookText}
              </pre>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "oklch(0.50 0.06 240)" }}
          />
          <Input
            data-ocid="literature.search_input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") doSearch(query);
            }}
            placeholder="Search books, authors, topics..."
            className="pl-9"
            style={{ color: "white", background: "oklch(0.14 0.025 260)" }}
          />
        </div>
        <Button
          type="button"
          data-ocid="literature.primary_button"
          onClick={() => doSearch(query)}
          disabled={loading}
          style={{ background: "oklch(0.52 0.18 220)" }}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>

      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {GENRE_CHIPS.map((g) => (
          <button
            key={g.label}
            type="button"
            data-ocid="literature.tab"
            onClick={() => {
              setQuery(g.q);
              doSearch(g.q);
            }}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: "oklch(0.18 0.06 220 / 0.4)",
              border: "1px solid oklch(0.35 0.10 220 / 0.4)",
              color: "oklch(0.72 0.14 220)",
            }}
          >
            {g.label}
          </button>
        ))}
      </div>

      {loading && (
        <div
          data-ocid="literature.loading_state"
          className="flex justify-center py-12"
        >
          <Loader2
            className="w-8 h-8 animate-spin"
            style={{ color: "oklch(0.65 0.18 220)" }}
          />
        </div>
      )}

      {!loading && books.length === 0 && (
        <div
          data-ocid="literature.empty_state"
          className="flex flex-col items-center gap-3 py-16"
        >
          <BookOpen
            className="w-12 h-12"
            style={{ color: "oklch(0.35 0.08 240)" }}
          />
          <p
            className="text-sm font-medium"
            style={{ color: "oklch(0.55 0.05 240)" }}
          >
            Search for books above
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {books.map((book, i) => {
          const isGut = book.source === "gutenberg";
          const title = isGut
            ? (book as GutBook).title
            : (book as OLBook).title;
          const author = isGut
            ? (book as GutBook).authors.map((a) => a.name).join(", ")
            : ((book as OLBook).author_name || ["Unknown"]).join(", ");
          const coverId = !isGut ? (book as OLBook).cover_i : undefined;
          const coverUrl = coverId
            ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
            : null;

          return (
            <button
              key={isGut ? (book as GutBook).id : (book as OLBook).key}
              type="button"
              data-ocid={`literature.item.${i + 1}`}
              onClick={() => openBook(book)}
              className="text-left p-3 rounded-xl flex flex-col gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "oklch(0.13 0.025 260)",
                border: "1px solid oklch(0.22 0.04 260)",
              }}
            >
              <div
                className="w-full aspect-[2/3] rounded-lg overflow-hidden flex items-center justify-center"
                style={{ background: "oklch(0.18 0.04 260)" }}
              >
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                ) : (
                  <BookOpen
                    className="w-8 h-8"
                    style={{ color: "oklch(0.40 0.08 240)" }}
                  />
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <p
                  className="text-xs font-semibold leading-tight line-clamp-2"
                  style={{ color: "oklch(0.88 0.03 240)" }}
                >
                  {title}
                </p>
                <p
                  className="text-[10px] leading-tight line-clamp-1"
                  style={{ color: "oklch(0.55 0.05 240)" }}
                >
                  {author}
                </p>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full w-fit mt-1"
                  style={{
                    background: isGut
                      ? "oklch(0.25 0.10 145 / 0.4)"
                      : "oklch(0.25 0.10 220 / 0.4)",
                    color: isGut
                      ? "oklch(0.65 0.18 145)"
                      : "oklch(0.65 0.18 220)",
                  }}
                >
                  {isGut ? "Gutenberg" : "Open Library"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function LiteratureTab() {
  return (
    <div className="flex flex-col gap-0" style={{ height: "100%" }}>
      {/* Section header */}
      <div
        className="flex-shrink-0 px-4 pt-4 pb-2"
        style={{ background: "oklch(0.10 0.04 265)" }}
      >
        <h2
          className="text-lg font-bold mb-3"
          style={{ color: "oklch(0.92 0.03 240)" }}
        >
          Literature
        </h2>
        <Tabs defaultValue="all" className="w-full">
          <TabsList
            className="w-full mb-0"
            style={{ background: "oklch(0.16 0.04 260)" }}
          >
            <TabsTrigger
              value="all"
              data-ocid="literature.tab"
              className="flex-1"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="books"
              data-ocid="literature.tab"
              className="flex-1"
            >
              Books
            </TabsTrigger>
            <TabsTrigger
              value="comics"
              data-ocid="literature.tab"
              className="flex-1"
            >
              Comics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-3 pb-4">
            {/* Books first */}
            <div className="mb-2 px-1">
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "oklch(0.52 0.12 220)" }}
              >
                📚 Books
              </span>
            </div>
            <BooksSection />
            <div className="mt-6 mb-2 px-1">
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "oklch(0.62 0.16 30)" }}
              >
                🎨 Comics
              </span>
            </div>
            <ComicsTab />
          </TabsContent>

          <TabsContent value="books" className="mt-3 pb-4">
            <BooksSection />
          </TabsContent>

          <TabsContent value="comics" className="mt-3 pb-4">
            <ComicsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
