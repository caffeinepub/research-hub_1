import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart3,
  Database,
  Download,
  ExternalLink,
  Loader2,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Dataset {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  category: string;
  format?: string;
  downloads?: number;
  updated?: string;
}

const DATASET_CATEGORIES = [
  { label: "All", value: "" },
  { label: "Science", value: "science" },
  { label: "Health", value: "health" },
  { label: "Economics", value: "economics" },
  { label: "Environment", value: "environment" },
  { label: "Education", value: "education" },
  { label: "Government", value: "government" },
];

const SOURCE_COLORS: Record<string, string> = {
  "data.gov": "oklch(0.65 0.18 220)",
  "World Bank": "oklch(0.65 0.14 55)",
  WHO: "oklch(0.65 0.18 200)",
  "Our World in Data": "oklch(0.65 0.18 140)",
  Kaggle: "oklch(0.65 0.18 280)",
  arXiv: "oklch(0.65 0.18 200)",
  NASA: "oklch(0.65 0.18 220)",
  NOAA: "oklch(0.65 0.14 200)",
};

async function fetchDataGov(query: string): Promise<Dataset[]> {
  try {
    const q = query || "research";
    const res = await fetch(
      `https://catalog.data.gov/api/3/action/package_search?q=${encodeURIComponent(q)}&rows=15`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    const results = data?.result?.results || [];
    return results.map((d: any, i: number) => ({
      id: `datagov-${d.id || i}`,
      title: d.title || "Untitled Dataset",
      description: (d.notes || d.description || "")
        .replace(/<[^>]+>/g, "")
        .slice(0, 200),
      url: `https://catalog.data.gov/dataset/${d.name || d.id}`,
      source: "data.gov",
      category: d.groups?.[0]?.name || "government",
      format: d.resources?.[0]?.format || "CSV",
      downloads: d.tracking_summary?.total || 0,
      updated: d.metadata_modified?.slice(0, 10) || "",
    }));
  } catch {
    return [];
  }
}

async function fetchWorldBank(query: string): Promise<Dataset[]> {
  try {
    const q = query || "development";
    const res = await fetch(
      `https://search.worldbank.org/api/v2/wds?format=json&qterm=${encodeURIComponent(q)}&rows=10&fl=docdt,display_title,docty,url,subtopic`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    const docs = data?.documents || {};
    return Object.values(docs)
      .slice(0, 10)
      .map((d: any, i: number) => ({
        id: `wb-${i}`,
        title: d.display_title || "World Bank Dataset",
        description: (
          d.subtopic || "World Bank research data and publications"
        ).slice(0, 200),
        url: d.url || "https://data.worldbank.org",
        source: "World Bank",
        category: "economics",
        format: d.docty || "PDF",
        updated: d.docdt?.slice(0, 10) || "",
      }));
  } catch {
    return [];
  }
}

async function fetchNASADatasets(query: string): Promise<Dataset[]> {
  try {
    const q = query || "earth science";
    const res = await fetch(
      `https://data.nasa.gov/api/3/action/package_search?q=${encodeURIComponent(q)}&rows=8`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    const results = data?.result?.results || [];
    return results.map((d: any, i: number) => ({
      id: `nasa-${d.id || i}`,
      title: d.title || "NASA Dataset",
      description: (d.notes || "").replace(/<[^>]+>/g, "").slice(0, 200),
      url: `https://data.nasa.gov/dataset/${d.name || d.id}`,
      source: "NASA",
      category: "science",
      format: d.resources?.[0]?.format || "CSV",
      updated: d.metadata_modified?.slice(0, 10) || "",
    }));
  } catch {
    return [];
  }
}

export function DatasetsTab() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const loadDatasets = useCallback(async (q: string, _cat: string) => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        fetchDataGov(q),
        fetchWorldBank(q),
        fetchNASADatasets(q),
      ]);
      const all: Dataset[] = [];
      for (const r of results) {
        if (r.status === "fulfilled") all.push(...r.value);
      }
      setDatasets(all);
      setPage(1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDatasets("", "");
  }, [loadDatasets]);

  const handleSearch = () => loadDatasets(query, activeCategory);

  const displayed = datasets.slice(0, page * ITEMS_PER_PAGE);

  return (
    <div data-ocid="datasets.section" className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <BarChart3
          className="w-5 h-5"
          style={{ color: "oklch(0.65 0.18 220)" }}
        />
        <div>
          <h2
            className="font-display font-bold text-lg"
            style={{ color: "oklch(0.92 0.02 240)" }}
          >
            Datasets & Statistics
          </h2>
          <p className="text-xs text-muted-foreground">
            Open data from data.gov, World Bank, NASA, and more
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "oklch(0.50 0.06 240)" }}
          />
          <Input
            data-ocid="datasets.search_input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search datasets (climate, health, economics...)"
            className="pl-9 h-10"
            style={{ color: "white" }}
          />
        </div>
        <Button
          type="button"
          data-ocid="datasets.primary_button"
          onClick={handleSearch}
          style={{ background: "oklch(0.52 0.18 220)" }}
          className="h-10 px-4"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 flex-wrap">
        {DATASET_CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            data-ocid="datasets.tab"
            onClick={() => {
              setActiveCategory(c.value);
              loadDatasets(query, c.value);
            }}
            className="chip-btn"
            style={{
              background:
                activeCategory === c.value
                  ? "oklch(0.52 0.18 220 / 0.2)"
                  : undefined,
              borderColor:
                activeCategory === c.value
                  ? "oklch(0.52 0.18 220 / 0.5)"
                  : undefined,
              color:
                activeCategory === c.value ? "oklch(0.72 0.15 220)" : undefined,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div
          data-ocid="datasets.loading_state"
          className="flex items-center justify-center py-12"
        >
          <Loader2
            className="w-6 h-6 animate-spin"
            style={{ color: "oklch(0.65 0.18 220)" }}
          />
          <span className="ml-2 text-sm text-muted-foreground">
            Fetching open datasets...
          </span>
        </div>
      )}

      {/* Empty state */}
      {!loading && datasets.length === 0 && (
        <div
          data-ocid="datasets.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <Database
            className="w-12 h-12 mb-3"
            style={{ color: "oklch(0.40 0.06 240)" }}
          />
          <p className="text-muted-foreground text-sm">
            No datasets found. Try a different search.
          </p>
        </div>
      )}

      {/* Dataset grid */}
      {!loading && datasets.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayed.map((ds, i) => (
              <div
                key={ds.id}
                data-ocid={`datasets.item.${i + 1}`}
                className="archive-card p-4 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{
                      backgroundColor: (
                        SOURCE_COLORS[ds.source] || "oklch(0.55 0.08 240)"
                      ).replace(")", " / 0.15)"),
                      color: SOURCE_COLORS[ds.source] || "oklch(0.65 0.08 240)",
                    }}
                  >
                    {ds.source}
                  </span>
                  {ds.format && (
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 flex-shrink-0"
                    >
                      {ds.format}
                    </Badge>
                  )}
                </div>
                <p
                  className="font-semibold text-sm leading-snug"
                  style={{ color: "oklch(0.92 0.02 240)" }}
                >
                  {ds.title}
                </p>
                {ds.description && (
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {ds.description}
                  </p>
                )}
                {ds.updated && (
                  <p className="text-[10px] text-muted-foreground">
                    Updated: {ds.updated}
                  </p>
                )}
                <div className="flex gap-2 mt-auto pt-1">
                  <a
                    href={ds.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg transition-colors"
                    style={{
                      background: "oklch(0.52 0.18 220 / 0.15)",
                      color: "oklch(0.72 0.15 220)",
                    }}
                  >
                    <ExternalLink className="w-3 h-3" /> View Dataset
                  </a>
                  <a
                    href={ds.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg transition-colors"
                    style={{
                      background: "oklch(0.65 0.18 140 / 0.15)",
                      color: "oklch(0.65 0.18 140)",
                    }}
                  >
                    <Download className="w-3 h-3" /> Download
                  </a>
                </div>
              </div>
            ))}
          </div>

          {displayed.length < datasets.length && (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                data-ocid="datasets.pagination_next"
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                className="px-6"
              >
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
