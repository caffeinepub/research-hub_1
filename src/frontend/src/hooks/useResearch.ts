import { useCallback, useState } from "react";
import type {
  SearchResults,
  SearchStatus,
  WikiArticle,
  WikiImage,
  WikiVideo,
} from "../types/research";

const WIKI_SEARCH = (q: string) =>
  `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*&srlimit=12&srprop=snippet|titlesnippet`;

const WIKI_SUMMARY = (title: string) =>
  `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

const COMMONS_SEARCH = (q: string) =>
  `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=400&format=json&origin=*&gsrlimit=40`;

const IMAGE_EXTS = /\.(jpe?g|png|gif|svg|webp)$/i;
const VIDEO_MIMES = ["video/webm", "video/ogg"];

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function fetchInternetArchiveArticles(
  query: string,
): Promise<WikiArticle[]> {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier,title,description,subject&rows=6&output=json&mediatype=texts`;
  const res = await fetch(url);
  const data = await res.json();
  const docs = data?.response?.docs ?? [];
  return docs.map((doc: any, idx: number) => ({
    pageid: 900000 + idx,
    title: doc.title ?? doc.identifier ?? "Untitled",
    snippet: doc.description ?? doc.subject ?? "",
    source: "Internet Archive",
  }));
}

async function fetchGutenbergArticles(query: string): Promise<WikiArticle[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=6&fields=key,title,author_name,first_sentence`;
  const res = await fetch(url);
  const data = await res.json();
  const docs = data?.docs ?? [];
  return docs.map((doc: any, idx: number) => {
    const firstSentence = doc.first_sentence?.value ?? "";
    const authors = doc.author_name?.join(", ") ?? "";
    return {
      pageid: 800000 + idx,
      title: doc.title ?? "Untitled",
      snippet: firstSentence || (authors ? `By ${authors}` : ""),
      source: "Project Gutenberg",
    };
  });
}

async function fetchPubMedArticles(query: string): Promise<WikiArticle[]> {
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=6&retmode=json`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  const ids: string[] = searchData?.esearchresult?.idlist ?? [];
  if (ids.length === 0) return [];

  const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
  const summaryRes = await fetch(summaryUrl);
  const summaryData = await summaryRes.json();
  const result = summaryData?.result ?? {};

  return ids
    .map((id, idx) => {
      const item = result[id];
      if (!item) return null;
      const authors = (item.authors ?? []).map((a: any) => a.name).join(", ");
      return {
        pageid: 700000 + idx,
        title: item.title ?? "Untitled",
        snippet: authors ? `Authors: ${authors}` : (item.source ?? ""),
        source: "PubMed",
      };
    })
    .filter(Boolean) as WikiArticle[];
}

async function fetchNasaImages(query: string): Promise<WikiImage[]> {
  const url = `https://images.nasa.gov/api/v1/search?q=${encodeURIComponent(query)}&media_type=image&page_size=12`;
  const res = await fetch(url);
  const data = await res.json();
  const items = data?.collection?.items ?? [];
  return items
    .filter((item: any) => item.links?.[0]?.href && item.data?.[0])
    .map((item: any, idx: number) => {
      const meta = item.data[0];
      const thumb = item.links[0].href;
      return {
        pageid: 600000 + idx,
        title: meta.title ?? "NASA Image",
        url: thumb,
        thumbUrl: thumb,
        description: meta.description ?? "",
        source: "NASA",
      };
    });
}

async function fetchMetMuseumImages(query: string): Promise<WikiImage[]> {
  const searchUrl = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(query)}&hasImages=true`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  const ids: number[] = (searchData?.objectIDs ?? []).slice(0, 6);
  if (ids.length === 0) return [];

  const results = await Promise.allSettled(
    ids.map((id) =>
      fetch(
        `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`,
      ).then((r) => r.json()),
    ),
  );

  return results
    .map((r, idx) => {
      if (r.status !== "fulfilled" || !r.value.primaryImageSmall) return null;
      const obj = r.value;
      return {
        pageid: 500000 + idx,
        title: obj.title ?? "Artwork",
        url: obj.primaryImageSmall,
        thumbUrl: obj.primaryImageSmall,
        description: obj.creditLine ?? "",
        author: obj.artistDisplayName || undefined,
        source: "Met Museum",
      };
    })
    .filter(Boolean) as WikiImage[];
}

async function fetchLocImages(query: string): Promise<WikiImage[]> {
  const url = `https://www.loc.gov/photos/?q=${encodeURIComponent(query)}&fo=json&c=12`;
  const res = await fetch(url);
  const data = await res.json();
  const results = data?.results ?? [];
  return results
    .filter((r: any) => r.image?.thumb)
    .map((r: any, idx: number) => ({
      pageid: 400000 + idx,
      title: r.title ?? "Library of Congress",
      url: r.image?.full ?? r.image?.thumb,
      thumbUrl: r.image?.thumb,
      description: Array.isArray(r.description)
        ? r.description[0]
        : (r.description ?? ""),
      source: "Library of Congress",
    }));
}

async function fetchEuropeanaImages(query: string): Promise<WikiImage[]> {
  const url = `https://api.europeana.eu/record/v2/search.json?wskey=api2demo&query=${encodeURIComponent(query)}&qf=TYPE:IMAGE&rows=12`;
  const res = await fetch(url);
  const data = await res.json();
  const items = data?.items ?? [];
  return items
    .filter((item: any) => item.edmPreview?.[0])
    .map((item: any, idx: number) => ({
      pageid: 300000 + idx,
      title: item.title?.[0] ?? "Europeana Item",
      url: item.edmPreview[0],
      thumbUrl: item.edmPreview[0],
      description: item.dcDescription?.[0] ?? "",
      license: item.rights?.[0] ?? undefined,
      source: "Europeana",
    }));
}

async function fetchInternetArchiveVideos(query: string): Promise<WikiVideo[]> {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier,title,description&rows=6&output=json&mediatype=movies`;
  const res = await fetch(url);
  const data = await res.json();
  const docs = data?.response?.docs ?? [];
  return docs.map((doc: any, idx: number) => ({
    pageid: 200000 + idx,
    title: doc.title ?? doc.identifier ?? "Untitled",
    url: `https://archive.org/download/${doc.identifier}/${doc.identifier}.mp4`,
    mime: "video/mp4",
    thumbUrl: `https://archive.org/services/img/${doc.identifier}`,
    description: doc.description ?? "",
    source: "Internet Archive",
  }));
}

async function fetchNasaVideos(query: string): Promise<WikiVideo[]> {
  const url = `https://images.nasa.gov/api/v1/search?q=${encodeURIComponent(query)}&media_type=video&page_size=6`;
  const res = await fetch(url);
  const data = await res.json();
  const items = data?.collection?.items ?? [];
  return items
    .filter((item: any) => item.links?.[0]?.href && item.data?.[0])
    .map((item: any, idx: number) => {
      const meta = item.data[0];
      const videoUrl = item.links[0].href;
      return {
        pageid: 100000 + idx,
        title: meta.title ?? "NASA Video",
        url: videoUrl,
        mime: "video/mp4",
        description: meta.description ?? "",
        source: "NASA",
      };
    });
}

export function useResearch() {
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [results, setResults] = useState<SearchResults>({
    articles: [],
    images: [],
    videos: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState("");

  const search = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setStatus("loading");
    setError(null);
    setLastQuery(query);

    try {
      // Core sources
      const [wikiRes, commonsRes] = await Promise.all([
        fetch(WIKI_SEARCH(query)).then((r) => r.json()),
        fetch(COMMONS_SEARCH(query)).then((r) => r.json()),
      ]);

      // Wikipedia Articles
      const searchItems = wikiRes?.query?.search ?? [];
      const wikiArticles: WikiArticle[] = searchItems.map((item: any) => ({
        pageid: item.pageid,
        title: item.title,
        snippet: stripHtml(item.snippet ?? ""),
        source: "Wikipedia",
      }));

      // Fetch summaries for top 6 wikipedia articles
      const topArticles = wikiArticles.slice(0, 6);
      const summaryResults = await Promise.allSettled(
        topArticles.map((a) =>
          fetch(WIKI_SUMMARY(a.title)).then((r) => r.json()),
        ),
      );
      summaryResults.forEach((res, i) => {
        if (res.status === "fulfilled" && res.value) {
          const s = res.value;
          topArticles[i].fullSummary = s.extract ?? "";
          topArticles[i].description = s.description ?? "";
          if (s.thumbnail?.source) {
            topArticles[i].thumbnail = {
              source: s.thumbnail.source,
              width: s.thumbnail.width ?? 200,
              height: s.thumbnail.height ?? 200,
            };
          }
        }
      });

      // Images and Videos from Wikimedia Commons
      const pages = commonsRes?.query?.pages
        ? Object.values(commonsRes.query.pages)
        : [];
      const wikiImages: WikiImage[] = [];
      const wikiVideos: WikiVideo[] = [];

      for (const page of pages as any[]) {
        const info = page.imageinfo?.[0];
        if (!info) continue;
        const url: string = info.url ?? "";
        const mime: string = info.mime ?? "";
        const thumb: string = info.thumburl ?? url;
        const desc = info.extmetadata?.ImageDescription?.value
          ? stripHtml(info.extmetadata.ImageDescription.value)
          : undefined;
        const author = info.extmetadata?.Artist?.value
          ? stripHtml(info.extmetadata.Artist.value)
          : undefined;
        const license = info.extmetadata?.LicenseShortName?.value ?? undefined;

        if (VIDEO_MIMES.includes(mime)) {
          wikiVideos.push({
            pageid: page.pageid,
            title: page.title.replace(/^File:/, ""),
            url,
            mime,
            thumbUrl: thumb !== url ? thumb : undefined,
            description: desc,
            source: "Wikimedia Commons",
          });
        } else if (IMAGE_EXTS.test(url)) {
          wikiImages.push({
            pageid: page.pageid,
            title: page.title.replace(/^File:/, ""),
            url,
            thumbUrl: thumb,
            description: desc,
            author,
            license,
            source: "Wikimedia Commons",
          });
        }
      }

      // Fetch additional sources in parallel
      const [
        iaArticlesResult,
        gutenbergResult,
        pubmedResult,
        nasaImagesResult,
        metResult,
        locResult,
        europeanaResult,
        iaVideosResult,
        nasaVideosResult,
      ] = await Promise.allSettled([
        fetchInternetArchiveArticles(query),
        fetchGutenbergArticles(query),
        fetchPubMedArticles(query),
        fetchNasaImages(query),
        fetchMetMuseumImages(query),
        fetchLocImages(query),
        fetchEuropeanaImages(query),
        fetchInternetArchiveVideos(query),
        fetchNasaVideos(query),
      ]);

      const extra = <T>(r: PromiseSettledResult<T[]>): T[] =>
        r.status === "fulfilled" ? r.value : [];

      const articles: WikiArticle[] = [
        ...wikiArticles,
        ...extra(iaArticlesResult),
        ...extra(gutenbergResult),
        ...extra(pubmedResult),
      ];

      const images: WikiImage[] = [
        ...wikiImages,
        ...extra(nasaImagesResult),
        ...extra(metResult),
        ...extra(locResult),
        ...extra(europeanaResult),
      ];

      const videos: WikiVideo[] = [
        ...wikiVideos,
        ...extra(iaVideosResult),
        ...extra(nasaVideosResult),
      ];

      setResults({ articles, images, videos });
      setStatus("success");
    } catch {
      setError(
        "Failed to fetch results. Please check your connection and try again.",
      );
      setStatus("error");
    }
  }, []);

  const expandArticle = useCallback(async (article: WikiArticle) => {
    if (article.fullSummary) {
      setResults((prev) => ({
        ...prev,
        articles: prev.articles.map((a) =>
          a.pageid === article.pageid ? { ...a, expanded: !a.expanded } : a,
        ),
      }));
      return;
    }
    if (article.source !== "Wikipedia") {
      // For non-Wikipedia articles, just toggle without fetching
      setResults((prev) => ({
        ...prev,
        articles: prev.articles.map((a) =>
          a.pageid === article.pageid ? { ...a, expanded: !a.expanded } : a,
        ),
      }));
      return;
    }
    try {
      const data = await fetch(WIKI_SUMMARY(article.title)).then((r) =>
        r.json(),
      );
      setResults((prev) => ({
        ...prev,
        articles: prev.articles.map((a) =>
          a.pageid === article.pageid
            ? { ...a, fullSummary: data.extract ?? "", expanded: true }
            : a,
        ),
      }));
    } catch {
      // silently fail
    }
  }, []);

  return { status, results, error, lastQuery, search, expandArticle };
}
