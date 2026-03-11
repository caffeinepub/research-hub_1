import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BookMarked,
  Brain,
  Calculator,
  CalendarDays,
  Copy,
  Loader2,
  Plus,
  Quote,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

type CitationStyle = "apa" | "mla" | "chicago";
type CitationType = "article" | "book" | "website";
type ToolKey = "citation" | "timeline" | "mindmap" | "calculator";

interface CitationData {
  title: string;
  authors: string;
  year: string;
  journal: string;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
  url: string;
  publisher: string;
  city: string;
  type: CitationType;
}

function formatAPA(c: CitationData): string {
  const authors = c.authors || "Unknown Author";
  const year = c.year ? `(${c.year})` : "(n.d.)";
  const title = c.title || "Untitled";
  if (c.type === "book") {
    return `${authors}. ${year}. ${title}. ${c.publisher || "Unknown Publisher"}.`;
  }
  if (c.type === "website") {
    return `${authors}. ${year}. ${title}. ${c.url || ""}`.trim();
  }
  const journal = c.journal ? `, ${c.journal}` : "";
  const vol = c.volume ? `, ${c.volume}` : "";
  const iss = c.issue ? `(${c.issue})` : "";
  const pg = c.pages ? `, ${c.pages}` : "";
  const doi = c.doi ? ` https://doi.org/${c.doi}` : c.url ? ` ${c.url}` : "";
  return `${authors}. ${year}. ${title}${journal}${vol}${iss}${pg}.${doi}`;
}

function formatMLA(c: CitationData): string {
  const authors = c.authors || "Unknown Author";
  const title = c.title || "Untitled";
  const year = c.year || "n.d.";
  if (c.type === "book") {
    return `${authors}. ${title}. ${c.publisher || "Unknown Publisher"}, ${year}.`;
  }
  if (c.type === "website") {
    return `${authors}. "${title}." Web. ${year}. ${c.url || ""}`.trim();
  }
  const journal = c.journal ? ` ${c.journal}` : "";
  const vol = c.volume ? `, vol. ${c.volume}` : "";
  const iss = c.issue ? `, no. ${c.issue}` : "";
  const pg = c.pages ? `, pp. ${c.pages}` : "";
  return `${authors}. "${title}."${journal}${vol}${iss}, ${year}${pg}.`;
}

function formatChicago(c: CitationData): string {
  const authors = c.authors || "Unknown Author";
  const title = c.title || "Untitled";
  const year = c.year || "n.d.";
  if (c.type === "book") {
    return `${authors}. ${title}. ${c.city ? `${c.city}: ` : ""}${c.publisher || "Unknown Publisher"}, ${year}.`;
  }
  if (c.type === "website") {
    return `${authors}. "${title}." Accessed ${year}. ${c.url || ""}`.trim();
  }
  const journal = c.journal ? ` "${title}." ${c.journal}` : ` "${title}.""}`;
  const vol = c.volume ? ` ${c.volume}` : "";
  const iss = c.issue ? `, no. ${c.issue}` : "";
  const pg = c.pages ? `: ${c.pages}` : "";
  return `${authors}.${journal}${vol}${iss} (${year})${pg}.`;
}

function CitationGenerator() {
  const [style, setStyle] = useState<CitationStyle>("apa");
  const [form, setForm] = useState<CitationData>({
    type: "article",
    title: "",
    authors: "",
    year: "",
    journal: "",
    volume: "",
    issue: "",
    pages: "",
    doi: "",
    url: "",
    publisher: "",
    city: "",
  });
  const [loading, setLoading] = useState(false);
  const [citation, setCitation] = useState("");
  const [saved, setSaved] = useState<string[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("saved_citations") || "[]",
      ) as string[];
    } catch {
      return [];
    }
  });

  const lookupDOI = async () => {
    if (!form.doi.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.crossref.org/works/${encodeURIComponent(form.doi.trim())}`,
      );
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      const w = data.message;
      const authorList = (w.author || []) as {
        family?: string;
        given?: string;
      }[];
      const authors = authorList
        .map((a) => `${a.family || ""}, ${(a.given || "")[0] || ""}.`)
        .join("; ");
      const pubYear =
        w.published?.["date-parts"]?.[0]?.[0] ||
        w["published-print"]?.["date-parts"]?.[0]?.[0];
      setForm((prev) => ({
        ...prev,
        title: w.title?.[0] || prev.title,
        authors: authors || prev.authors,
        year: pubYear ? String(pubYear) : prev.year,
        journal: w["container-title"]?.[0] || prev.journal,
        volume: w.volume || prev.volume,
        issue: w.issue || prev.issue,
        pages: w.page || prev.pages,
        publisher: w.publisher || prev.publisher,
        type: "article",
      }));
      toast.success("Metadata loaded from DOI!");
    } catch {
      toast.error("Could not find DOI. Please fill in manually.");
    } finally {
      setLoading(false);
    }
  };

  const generate = () => {
    let result = "";
    if (style === "apa") result = formatAPA(form);
    else if (style === "mla") result = formatMLA(form);
    else result = formatChicago(form);
    setCitation(result);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(citation);
    toast.success("Citation copied!");
  };

  const saveCitation = () => {
    const updated = [citation, ...saved].slice(0, 20);
    setSaved(updated);
    localStorage.setItem("saved_citations", JSON.stringify(updated));
    toast.success("Citation saved!");
  };

  const updateField = (key: keyof CitationData, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  type FieldDef = [keyof CitationData, string];
  const articleFields: FieldDef[] = [
    ["journal", "Journal"],
    ["volume", "Volume"],
    ["issue", "Issue"],
    ["pages", "Pages"],
  ];
  const bookFields: FieldDef[] = [
    ["publisher", "Publisher"],
    ["city", "City"],
  ];
  const websiteFields: FieldDef[] = [["url", "URL"]];
  const baseFields: FieldDef[] = [
    ["title", "Title *"],
    ["authors", "Author(s) *"],
    ["year", "Year *"],
  ];
  const extraFields =
    form.type === "article"
      ? articleFields
      : form.type === "book"
        ? bookFields
        : websiteFields;
  const allFields: FieldDef[] = [...baseFields, ...extraFields];

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-1">
          {(["article", "book", "website"] as CitationType[]).map((t) => (
            <button
              key={t}
              type="button"
              data-ocid="citation.tab"
              onClick={() => updateField("type", t)}
              className="px-3 py-1 rounded text-xs font-medium capitalize transition-colors"
              style={{
                background:
                  form.type === t
                    ? "oklch(0.52 0.18 220 / 0.2)"
                    : "oklch(0.18 0.04 260)",
                color:
                  form.type === t
                    ? "oklch(0.72 0.15 220)"
                    : "oklch(0.65 0.05 240)",
                border: `1px solid ${
                  form.type === t
                    ? "oklch(0.52 0.18 220 / 0.5)"
                    : "oklch(0.28 0.06 260)"
                }`,
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(["apa", "mla", "chicago"] as CitationStyle[]).map((s) => (
            <button
              key={s}
              type="button"
              data-ocid="citation.tab"
              onClick={() => setStyle(s)}
              className="px-3 py-1 rounded text-xs font-semibold uppercase transition-colors"
              style={{
                background:
                  style === s
                    ? "oklch(0.65 0.18 55 / 0.2)"
                    : "oklch(0.18 0.04 260)",
                color:
                  style === s ? "oklch(0.72 0.18 55)" : "oklch(0.65 0.05 240)",
                border: `1px solid ${
                  style === s
                    ? "oklch(0.65 0.18 55 / 0.5)"
                    : "oklch(0.28 0.06 260)"
                }`,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div
        className="p-3 rounded-lg"
        style={{
          background: "oklch(0.16 0.03 260)",
          border: "1px solid oklch(0.26 0.05 260)",
        }}
      >
        <Label
          className="text-xs mb-1 block"
          style={{ color: "oklch(0.72 0.08 240)" }}
        >
          Auto-fill from DOI
        </Label>
        <div className="flex gap-2">
          <Input
            data-ocid="citation.input"
            value={form.doi}
            onChange={(e) => updateField("doi", e.target.value)}
            placeholder="e.g. 10.1126/science.1234567"
            className="h-8 text-sm flex-1"
            style={{ color: "white" }}
          />
          <Button
            type="button"
            data-ocid="citation.secondary_button"
            size="sm"
            variant="outline"
            onClick={lookupDOI}
            disabled={loading || !form.doi.trim()}
            className="h-8 text-xs"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Look up"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {allFields.map(([key, lbl]) => (
          <div key={key}>
            <Label
              className="text-xs mb-0.5 block"
              style={{ color: "oklch(0.65 0.05 240)" }}
            >
              {lbl}
            </Label>
            <Input
              data-ocid="citation.input"
              value={(form[key] as string) || ""}
              onChange={(e) => updateField(key, e.target.value)}
              className="h-8 text-sm"
              style={{ color: "white" }}
            />
          </div>
        ))}
      </div>

      <Button
        type="button"
        data-ocid="citation.primary_button"
        onClick={generate}
        className="w-full"
        style={{ background: "oklch(0.52 0.18 220)" }}
        disabled={!form.title || !form.authors}
      >
        <Quote className="w-4 h-4 mr-2" /> Generate Citation
      </Button>

      {citation && (
        <div
          className="p-4 rounded-lg space-y-2"
          style={{
            background: "oklch(0.16 0.03 260)",
            border: "1px solid oklch(0.26 0.05 260)",
          }}
        >
          <p
            className="text-sm italic leading-relaxed"
            style={{ color: "oklch(0.88 0.02 240)" }}
          >
            {citation}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              data-ocid="citation.secondary_button"
              size="sm"
              variant="outline"
              onClick={copyToClipboard}
              className="text-xs h-7"
            >
              <Copy className="w-3 h-3 mr-1" /> Copy
            </Button>
            <Button
              type="button"
              data-ocid="citation.save_button"
              size="sm"
              variant="outline"
              onClick={saveCitation}
              className="text-xs h-7"
            >
              <BookMarked className="w-3 h-3 mr-1" /> Save
            </Button>
          </div>
        </div>
      )}

      {saved.length > 0 && (
        <div>
          <p
            className="text-xs font-semibold mb-2"
            style={{ color: "oklch(0.65 0.05 240)" }}
          >
            Saved Citations ({saved.length})
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {saved.map((c, i) => (
              <div
                key={c.slice(0, 20)}
                data-ocid={`citation.item.${i + 1}`}
                className="p-3 rounded-lg flex gap-2 items-start"
                style={{
                  background: "oklch(0.14 0.03 260)",
                  border: "1px solid oklch(0.22 0.04 260)",
                }}
              >
                <p
                  className="text-xs flex-1 italic"
                  style={{ color: "oklch(0.82 0.02 240)" }}
                >
                  {c}
                </p>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    type="button"
                    data-ocid={`citation.secondary_button.${i + 1}`}
                    onClick={() => {
                      navigator.clipboard.writeText(c);
                      toast.success("Copied!");
                    }}
                  >
                    <Copy
                      className="w-3 h-3"
                      style={{ color: "oklch(0.55 0.06 240)" }}
                    />
                  </button>
                  <button
                    type="button"
                    data-ocid={`citation.delete_button.${i + 1}`}
                    onClick={() => {
                      const updated = saved.filter((_, idx) => idx !== i);
                      setSaved(updated);
                      localStorage.setItem(
                        "saved_citations",
                        JSON.stringify(updated),
                      );
                    }}
                  >
                    <Trash2
                      className="w-3 h-3"
                      style={{ color: "oklch(0.55 0.12 20)" }}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface TimelineEvent {
  id: number;
  date: string;
  title: string;
  description: string;
  color: string;
}

const TIMELINE_COLORS = [
  "oklch(0.65 0.18 220)",
  "oklch(0.65 0.18 140)",
  "oklch(0.65 0.18 55)",
  "oklch(0.65 0.18 280)",
  "oklch(0.65 0.18 20)",
  "oklch(0.65 0.18 200)",
];

function TimelineBuilder() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [newDate, setNewDate] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [timelineTitle, setTimelineTitle] = useState("My Research Timeline");

  const addEvent = () => {
    if (!newDate.trim() || !newTitle.trim()) return;
    const ev: TimelineEvent = {
      id: Date.now(),
      date: newDate.trim(),
      title: newTitle.trim(),
      description: newDesc.trim(),
      color: TIMELINE_COLORS[events.length % TIMELINE_COLORS.length],
    };
    setEvents((prev) =>
      [...prev, ev].sort((a, b) => a.date.localeCompare(b.date)),
    );
    setNewDate("");
    setNewTitle("");
    setNewDesc("");
  };

  const removeEvent = (id: number) =>
    setEvents((prev) => prev.filter((ev) => ev.id !== id));

  const exportText = () => {
    const lines = [`# ${timelineTitle}`, ""];
    for (const e of events) {
      lines.push(`**${e.date}** — ${e.title}`);
      if (e.description) lines.push(e.description);
      lines.push("");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "timeline.txt";
    a.click();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label
          className="text-xs mb-1 block"
          style={{ color: "oklch(0.65 0.05 240)" }}
        >
          Timeline Title
        </Label>
        <Input
          data-ocid="timeline.input"
          value={timelineTitle}
          onChange={(e) => setTimelineTitle(e.target.value)}
          className="h-9 font-semibold"
          style={{ color: "white" }}
        />
      </div>

      <div
        className="p-3 rounded-lg space-y-2"
        style={{
          background: "oklch(0.16 0.03 260)",
          border: "1px solid oklch(0.26 0.05 260)",
        }}
      >
        <p
          className="text-xs font-semibold"
          style={{ color: "oklch(0.65 0.05 240)" }}
        >
          Add Event
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label
              className="text-xs mb-0.5 block"
              style={{ color: "oklch(0.55 0.04 240)" }}
            >
              Date *
            </Label>
            <Input
              data-ocid="timeline.input"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              placeholder="e.g. 1543 or Jan 2024"
              className="h-8 text-sm"
              style={{ color: "white" }}
            />
          </div>
          <div>
            <Label
              className="text-xs mb-0.5 block"
              style={{ color: "oklch(0.55 0.04 240)" }}
            >
              Title *
            </Label>
            <Input
              data-ocid="timeline.input"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Event title"
              className="h-8 text-sm"
              style={{ color: "white" }}
            />
          </div>
        </div>
        <div>
          <Label
            className="text-xs mb-0.5 block"
            style={{ color: "oklch(0.55 0.04 240)" }}
          >
            Description (optional)
          </Label>
          <Textarea
            data-ocid="timeline.textarea"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Brief description..."
            rows={2}
            className="text-sm resize-none"
            style={{ color: "white" }}
          />
        </div>
        <Button
          type="button"
          data-ocid="timeline.primary_button"
          onClick={addEvent}
          disabled={!newDate.trim() || !newTitle.trim()}
          className="w-full h-8 text-sm"
          style={{ background: "oklch(0.52 0.18 220)" }}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Event
        </Button>
      </div>

      {events.length === 0 ? (
        <div
          data-ocid="timeline.empty_state"
          className="flex flex-col items-center py-10 text-center"
        >
          <CalendarDays
            className="w-10 h-10 mb-2"
            style={{ color: "oklch(0.38 0.06 240)" }}
          />
          <p className="text-sm text-muted-foreground">
            Add events to build your timeline
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-3">
            <h3
              className="font-display font-bold text-sm"
              style={{ color: "oklch(0.90 0.02 240)" }}
            >
              {timelineTitle}
            </h3>
            <Button
              type="button"
              data-ocid="timeline.secondary_button"
              size="sm"
              variant="outline"
              onClick={exportText}
              className="text-xs h-7"
            >
              Export
            </Button>
          </div>
          <div className="relative pl-4">
            <div
              className="absolute left-4 top-0 bottom-0 w-px"
              style={{ background: "oklch(0.28 0.06 260)" }}
            />
            {events.map((ev, i) => (
              <div
                key={ev.id}
                data-ocid={`timeline.item.${i + 1}`}
                className="relative flex gap-3 pb-5 last:pb-0"
              >
                <div
                  className="absolute left-0 w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    background: ev.color,
                    top: "4px",
                    transform: "translateX(-4.5px)",
                  }}
                />
                <div className="pl-4 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className="text-[11px] font-mono"
                        style={{ color: ev.color }}
                      >
                        {ev.date}
                      </span>
                      <p
                        className="font-semibold text-sm"
                        style={{ color: "oklch(0.90 0.02 240)" }}
                      >
                        {ev.title}
                      </p>
                      {ev.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {ev.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      data-ocid={`timeline.delete_button.${i + 1}`}
                      onClick={() => removeEvent(ev.id)}
                      className="flex-shrink-0 p-1"
                    >
                      <X
                        className="w-3.5 h-3.5"
                        style={{ color: "oklch(0.45 0.08 20)" }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface MindNode {
  id: number;
  text: string;
  parent: number | null;
  color: string;
}

function MindMapBuilder() {
  const [nodes, setNodes] = useState<MindNode[]>([
    {
      id: 1,
      text: "Research Topic",
      parent: null,
      color: "oklch(0.65 0.18 220)",
    },
  ]);
  const [newText, setNewText] = useState("");
  const [selectedParent, setSelectedParent] = useState<number>(1);
  const nextId = useRef(2);

  const getDepth = (id: number): number => {
    const node = nodes.find((n) => n.id === id);
    if (!node || node.parent === null) return 0;
    return 1 + getDepth(node.parent);
  };

  const getChildren = (id: number) => nodes.filter((n) => n.parent === id);

  const addNode = () => {
    if (!newText.trim()) return;
    const parentNode = nodes.find((n) => n.id === selectedParent);
    const depth = getDepth(selectedParent);
    const colors = [
      "oklch(0.65 0.18 140)",
      "oklch(0.65 0.18 55)",
      "oklch(0.65 0.18 280)",
      "oklch(0.65 0.18 20)",
      "oklch(0.65 0.18 200)",
    ];
    setNodes((prev) => [
      ...prev,
      {
        id: nextId.current++,
        text: newText.trim(),
        parent: selectedParent,
        color: parentNode
          ? colors[depth % colors.length]
          : "oklch(0.65 0.18 220)",
      },
    ]);
    setNewText("");
  };

  const removeNode = (id: number) => {
    const toRemove = new Set<number>();
    const collect = (nid: number) => {
      toRemove.add(nid);
      for (const c of getChildren(nid)) {
        collect(c.id);
      }
    };
    collect(id);
    setNodes((prev) => prev.filter((node) => !toRemove.has(node.id)));
    if (toRemove.has(selectedParent)) setSelectedParent(1);
  };

  const renderNode = (node: MindNode, depth: number): React.ReactNode => {
    const children = getChildren(node.id);
    return (
      <div
        key={node.id}
        className={depth > 0 ? "ml-6 border-l pl-3" : ""}
        style={{ borderColor: "oklch(0.28 0.06 260)" }}
      >
        <div
          className="flex items-center gap-2 py-1.5"
          data-ocid={`mindmap.item.${node.id}`}
        >
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: node.color }}
          />
          <span
            className={`text-sm ${depth === 0 ? "font-bold" : ""}`}
            style={{
              color:
                depth === 0 ? "oklch(0.92 0.02 240)" : "oklch(0.84 0.02 240)",
            }}
          >
            {node.text}
          </span>
          {node.parent !== null && (
            <button
              type="button"
              data-ocid={`mindmap.delete_button.${node.id}`}
              onClick={() => removeNode(node.id)}
              className="ml-auto p-0.5 opacity-40 hover:opacity-100"
            >
              <X className="w-3 h-3" style={{ color: "oklch(0.55 0.12 20)" }} />
            </button>
          )}
        </div>
        {children.map((c) => renderNode(c, depth + 1))}
      </div>
    );
  };

  const rootNode = nodes.find((n) => n.parent === null);

  return (
    <div className="space-y-4">
      <div
        className="p-3 rounded-lg space-y-2"
        style={{
          background: "oklch(0.16 0.03 260)",
          border: "1px solid oklch(0.26 0.05 260)",
        }}
      >
        <p
          className="text-xs font-semibold"
          style={{ color: "oklch(0.65 0.05 240)" }}
        >
          Add Branch
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <Label
              className="text-xs mb-0.5 block"
              style={{ color: "oklch(0.55 0.04 240)" }}
            >
              Parent Node
            </Label>
            <select
              data-ocid="mindmap.select"
              value={selectedParent}
              onChange={(e) => setSelectedParent(Number(e.target.value))}
              className="w-full h-8 rounded-md border px-2 text-sm"
              style={{
                background: "oklch(0.18 0.04 260)",
                borderColor: "oklch(0.28 0.06 260)",
                color: "white",
              }}
            >
              {nodes.map((n) => (
                <option
                  key={n.id}
                  value={n.id}
                  style={{ background: "oklch(0.18 0.04 260)" }}
                >
                  {n.text}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label
              className="text-xs mb-0.5 block"
              style={{ color: "oklch(0.55 0.04 240)" }}
            >
              New Branch Text *
            </Label>
            <Input
              data-ocid="mindmap.input"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addNode()}
              placeholder="e.g. Key concept"
              className="h-8 text-sm"
              style={{ color: "white" }}
            />
          </div>
        </div>
        <Button
          type="button"
          data-ocid="mindmap.primary_button"
          onClick={addNode}
          disabled={!newText.trim()}
          className="h-8 text-sm"
          style={{ background: "oklch(0.52 0.18 220)" }}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Branch
        </Button>
      </div>

      <div
        className="p-4 rounded-lg min-h-40"
        style={{
          background: "oklch(0.13 0.03 260)",
          border: "1px solid oklch(0.22 0.04 260)",
        }}
      >
        {rootNode && renderNode(rootNode, 0)}
      </div>
    </div>
  );
}

function safeCalc(expr: string): number {
  const tokens = expr.replace(/\s+/g, "").match(/[+\-*/()]|\d+\.?\d*/g) || [];
  let pos = 0;

  const parseExpr = (): number => {
    let left = parseTerm();
    while (tokens[pos] === "+" || tokens[pos] === "-") {
      const op = tokens[pos++];
      const right = parseTerm();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  };

  const parseTerm = (): number => {
    let left = parseFactor();
    while (tokens[pos] === "*" || tokens[pos] === "/") {
      const op = tokens[pos++];
      const right = parseFactor();
      left = op === "*" ? left * right : left / right;
    }
    return left;
  };

  const parseFactor = (): number => {
    if (tokens[pos] === "(") {
      pos++;
      const val = parseExpr();
      pos++; // consume ')'
      return val;
    }
    if (tokens[pos] === "-") {
      pos++;
      return -parseFactor();
    }
    return Number.parseFloat(tokens[pos++] || "0");
  };

  const result = parseExpr();
  if (!Number.isFinite(result)) throw new Error("Invalid");
  return result;
}

function ResearchCalculator() {
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  const calculate = () => {
    if (!expr.trim()) return;
    try {
      const safe = expr.replace(/[^0-9+\-*/().\s]/g, "").trim();
      const res = safeCalc(safe);
      const resultStr = `${expr} = ${Number(res.toFixed(10)).toString()}`;
      setResult(resultStr);
      setHistory((h) => [resultStr, ...h].slice(0, 20));
    } catch {
      setResult("Error: invalid expression");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          data-ocid="calculator.input"
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && calculate()}
          placeholder="e.g. 245 * 18 or (100 + 50) / 3"
          className="flex-1 h-10 font-mono text-sm"
          style={{ color: "white" }}
        />
        <Button
          type="button"
          data-ocid="calculator.primary_button"
          onClick={calculate}
          style={{ background: "oklch(0.52 0.18 220)" }}
          className="h-10 px-4"
        >
          =
        </Button>
      </div>
      {result && (
        <div
          className="p-3 rounded-lg font-mono text-sm"
          style={{
            background: "oklch(0.16 0.03 260)",
            border: "1px solid oklch(0.26 0.05 260)",
            color: result.startsWith("Error")
              ? "oklch(0.65 0.18 25)"
              : "oklch(0.72 0.18 140)",
          }}
        >
          {result}
        </div>
      )}
      {history.length > 1 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">History</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {history.slice(1).map((h) => (
              <div
                key={h}
                className="text-xs font-mono text-muted-foreground px-2 py-1 rounded"
                style={{ background: "oklch(0.14 0.03 260)" }}
              >
                {h}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          "7",
          "8",
          "9",
          "/",
          "4",
          "5",
          "6",
          "*",
          "1",
          "2",
          "3",
          "-",
          "0",
          ".",
          "=",
          "+",
        ].map((k) => (
          <button
            key={k}
            type="button"
            data-ocid="calculator.button"
            onClick={() => {
              if (k === "=") calculate();
              else setExpr((e) => e + k);
            }}
            className="h-10 rounded-lg font-mono text-sm font-medium transition-colors"
            style={{
              background: ["+", "-", "*", "/", "="].includes(k)
                ? "oklch(0.52 0.18 220 / 0.2)"
                : "oklch(0.20 0.04 260)",
              color: ["+", "-", "*", "/", "="].includes(k)
                ? "oklch(0.72 0.15 220)"
                : "oklch(0.85 0.03 240)",
              border: "1px solid oklch(0.28 0.05 260)",
            }}
          >
            {k}
          </button>
        ))}
      </div>
      <button
        type="button"
        data-ocid="calculator.secondary_button"
        onClick={() => {
          setExpr("");
          setResult("");
        }}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Clear
      </button>
    </div>
  );
}

const TOOLS: {
  key: ToolKey;
  icon: React.ElementType;
  label: string;
  desc: string;
}[] = [
  {
    key: "citation",
    icon: Quote,
    label: "Citation Generator",
    desc: "APA, MLA, Chicago",
  },
  {
    key: "timeline",
    icon: CalendarDays,
    label: "Timeline Builder",
    desc: "Visual research timelines",
  },
  {
    key: "mindmap",
    icon: Brain,
    label: "Mind Map",
    desc: "Organize ideas visually",
  },
  {
    key: "calculator",
    icon: Calculator,
    label: "Calculator",
    desc: "Math & expressions",
  },
];

export function InteractiveToolsTab() {
  const [activeTool, setActiveTool] = useState<ToolKey>("citation");

  return (
    <div data-ocid="tools.section" className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TOOLS.map(({ key, icon: Icon, label, desc }) => (
          <button
            key={key}
            type="button"
            data-ocid="tools.tab"
            onClick={() => setActiveTool(key)}
            className="archive-card p-3 text-left flex flex-col gap-1.5 transition-colors"
            style={{
              borderColor:
                activeTool === key ? "oklch(0.52 0.18 220 / 0.6)" : undefined,
              background:
                activeTool === key ? "oklch(0.52 0.18 220 / 0.08)" : undefined,
            }}
          >
            <Icon
              className="w-4 h-4"
              style={{
                color:
                  activeTool === key
                    ? "oklch(0.72 0.15 220)"
                    : "oklch(0.55 0.06 240)",
              }}
            />
            <p
              className="font-semibold text-xs leading-tight"
              style={{
                color:
                  activeTool === key
                    ? "oklch(0.88 0.03 240)"
                    : "oklch(0.70 0.04 240)",
              }}
            >
              {label}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {desc}
            </p>
          </button>
        ))}
      </div>

      <div
        className="p-4 rounded-xl"
        style={{
          background: "oklch(0.14 0.03 260)",
          border: "1px solid oklch(0.24 0.05 260)",
        }}
      >
        {activeTool === "citation" && <CitationGenerator />}
        {activeTool === "timeline" && <TimelineBuilder />}
        {activeTool === "mindmap" && <MindMapBuilder />}
        {activeTool === "calculator" && <ResearchCalculator />}
      </div>
    </div>
  );
}
