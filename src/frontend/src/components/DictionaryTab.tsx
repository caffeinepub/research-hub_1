import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Search, Volume2 } from "lucide-react";
import { useState } from "react";

interface DictDefinition {
  definition: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
}

interface DictMeaning {
  partOfSpeech: string;
  definitions: DictDefinition[];
  synonyms: string[];
  antonyms: string[];
}

interface DictEntry {
  word: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string; audio?: string }>;
  meanings: DictMeaning[];
}

interface DatamuseWord {
  word: string;
  score: number;
}

function getAllSynonyms(entry: DictEntry, extra: DatamuseWord[]): string[] {
  const set = new Set<string>();
  for (const m of entry.meanings) {
    for (const s of m.synonyms) set.add(s);
    for (const d of m.definitions) {
      for (const s of d.synonyms) set.add(s);
    }
  }
  for (const w of extra) set.add(w.word);
  return [...set].slice(0, 30);
}

function getAllAntonyms(entry: DictEntry, extra: DatamuseWord[]): string[] {
  const set = new Set<string>();
  for (const m of entry.meanings) {
    for (const a of m.antonyms) set.add(a);
    for (const d of m.definitions) {
      for (const a of d.antonyms) set.add(a);
    }
  }
  for (const w of extra) set.add(w.word);
  return [...set].slice(0, 20);
}

export function DictionaryTab() {
  const [inputWord, setInputWord] = useState("");
  const [entries, setEntries] = useState<DictEntry[]>([]);
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [antonyms, setAntonyms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [searched, setSearched] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const lookup = async (word: string) => {
    const w = word.trim().toLowerCase();
    if (!w) return;
    setLoading(true);
    setNotFound(false);
    setEntries([]);
    setSynonyms([]);
    setAntonyms([]);
    setAudioUrl(null);
    setSearched(w);

    const [dictRes, synRes, antRes] = await Promise.allSettled([
      fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`,
      ),
      fetch(
        `https://api.datamuse.com/words?rel_syn=${encodeURIComponent(w)}&max=20`,
      ),
      fetch(
        `https://api.datamuse.com/words?rel_ant=${encodeURIComponent(w)}&max=10`,
      ),
    ]);

    let foundEntries: DictEntry[] = [];

    if (dictRes.status === "fulfilled" && dictRes.value.ok) {
      try {
        const data: DictEntry[] = await dictRes.value.json();
        foundEntries = data;
        setEntries(data);

        // Find audio
        for (const entry of data) {
          for (const ph of entry.phonetics ?? []) {
            if (ph.audio) {
              setAudioUrl(
                ph.audio.startsWith("//") ? `https:${ph.audio}` : ph.audio,
              );
              break;
            }
          }
          if (audioUrl) break;
        }
      } catch {
        setNotFound(true);
      }
    } else {
      setNotFound(true);
    }

    const extraSyn: DatamuseWord[] =
      synRes.status === "fulfilled" && synRes.value.ok
        ? await synRes.value.json().catch(() => [])
        : [];
    const extraAnt: DatamuseWord[] =
      antRes.status === "fulfilled" && antRes.value.ok
        ? await antRes.value.json().catch(() => [])
        : [];

    if (foundEntries.length > 0) {
      setSynonyms(getAllSynonyms(foundEntries[0], extraSyn));
      setAntonyms(getAllAntonyms(foundEntries[0], extraAnt));
    } else {
      setSynonyms(extraSyn.map((w) => w.word));
      setAntonyms(extraAnt.map((w) => w.word));
    }

    setLoading(false);
  };

  const handleSearch = () => lookup(inputWord);
  const handleChipSearch = (word: string) => {
    setInputWord(word);
    lookup(word);
  };

  const phonetic =
    entries[0]?.phonetic ?? entries[0]?.phonetics?.find((p) => p.text)?.text;

  const playAudio = () => {
    if (audioUrl) {
      new Audio(audioUrl).play().catch(() => null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-2 space-y-6">
      {/* Search bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "oklch(0.6 0.1 230)" }}
          />
          <Input
            data-ocid="dictionary.search_input"
            value={inputWord}
            onChange={(e) => setInputWord(e.target.value)}
            placeholder="Look up any word..."
            className="pl-10 h-12 text-base rounded-xl"
            style={{
              background: "oklch(0.18 0.04 260)",
              border: "1px solid oklch(0.3 0.06 260)",
              color: "oklch(0.95 0.02 240)",
            }}
          />
        </div>
        <Button
          data-ocid="dictionary.submit_button"
          type="submit"
          disabled={loading || !inputWord.trim()}
          className="h-12 px-6 rounded-xl font-semibold"
          style={{ background: "oklch(0.52 0.18 220)" }}
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </form>

      {/* Loading */}
      {loading && (
        <div data-ocid="dictionary.loading_state" className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      )}

      {/* Not found */}
      {!loading && notFound && searched && (
        <div data-ocid="dictionary.empty_state" className="text-center py-16">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="font-display text-lg text-muted-foreground">
            Word not found: &ldquo;{searched}&rdquo;
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Check the spelling or try a different word.
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && entries.length > 0 && (
        <div className="space-y-6">
          {/* Word header */}
          <div className="flex items-end gap-4">
            <h1
              className="font-display text-4xl font-bold"
              style={{ color: "oklch(0.9 0.06 230)" }}
            >
              {entries[0].word}
            </h1>
            {phonetic && (
              <span className="text-lg text-muted-foreground font-mono">
                {phonetic}
              </span>
            )}
            {audioUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-ocid="dictionary.toggle"
                onClick={playAudio}
                className="gap-1"
              >
                <Volume2 className="w-4 h-4" />
                Pronounce
              </Button>
            )}
          </div>

          {/* Meanings */}
          {entries[0].meanings.map((meaning, mi) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: stable
            <div key={mi} className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className="text-sm px-3 py-1 font-medium italic"
                  style={{
                    background: "oklch(0.52 0.18 220 / 0.2)",
                    color: "oklch(0.78 0.18 220)",
                  }}
                >
                  {meaning.partOfSpeech}
                </Badge>
                <Separator className="flex-1" />
              </div>

              <ol className="space-y-3 list-decimal list-inside">
                {meaning.definitions.map((def, di) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: stable
                  <li key={di} className="space-y-1">
                    <span className="text-foreground/90">{def.definition}</span>
                    {def.example && (
                      <p className="text-sm text-muted-foreground italic ml-4">
                        &ldquo;{def.example}&rdquo;
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ))}

          {/* Synonyms */}
          {synonyms.length > 0 && (
            <div
              className="rounded-xl p-4 space-y-3"
              style={{
                background: "oklch(0.16 0.04 260)",
                border: "1px solid oklch(0.28 0.06 260)",
              }}
            >
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                Synonyms
              </h3>
              <div className="flex flex-wrap gap-2">
                {synonyms.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleChipSearch(s)}
                    className="px-3 py-1 rounded-full text-sm transition-colors hover:opacity-80"
                    style={{
                      background: "oklch(0.52 0.18 220 / 0.15)",
                      color: "oklch(0.78 0.18 220)",
                      border: "1px solid oklch(0.52 0.18 220 / 0.3)",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Antonyms */}
          {antonyms.length > 0 && (
            <div
              className="rounded-xl p-4 space-y-3"
              style={{
                background: "oklch(0.16 0.04 260)",
                border: "1px solid oklch(0.28 0.06 260)",
              }}
            >
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                Antonyms
              </h3>
              <div className="flex flex-wrap gap-2">
                {antonyms.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => handleChipSearch(a)}
                    className="px-3 py-1 rounded-full text-sm transition-colors hover:opacity-80"
                    style={{
                      background: "oklch(0.65 0.18 20 / 0.15)",
                      color: "oklch(0.78 0.18 20)",
                      border: "1px solid oklch(0.65 0.18 20 / 0.3)",
                    }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state (initial) */}
      {!loading && entries.length === 0 && !notFound && (
        <div className="text-center py-20 space-y-3">
          <BookOpen className="w-14 h-14 mx-auto text-muted-foreground/30" />
          <p className="font-display text-xl text-muted-foreground">
            Dictionary &amp; Thesaurus
          </p>
          <p className="text-sm text-muted-foreground/60">
            Search any word for definitions, synonyms, and antonyms
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {[
              "serendipity",
              "ephemeral",
              "resilience",
              "cosmos",
              "eloquent",
            ].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => handleChipSearch(w)}
                className="px-3 py-1.5 rounded-full text-sm transition-colors hover:opacity-80"
                style={{
                  background: "oklch(0.26 0.06 260 / 0.6)",
                  color: "oklch(0.72 0.08 230)",
                  border: "1px solid oklch(0.35 0.06 260)",
                }}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
