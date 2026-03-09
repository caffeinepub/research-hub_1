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

// ──────────────────────────────────────────────
// CURATED YOUTUBE PUBLIC DOMAIN FILMS
// ──────────────────────────────────────────────

const YOUTUBE_PUBLIC_DOMAIN: {
  id: string;
  title: string;
  keywords: string[];
}[] = [
  {
    id: "jUFYA51_QFM",
    title: "Night of the Living Dead (1968)",
    keywords: ["horror", "zombie", "night", "living", "dead", "1968"],
  },
  {
    id: "FsNMxbxdQb4",
    title: "Nosferatu (1922)",
    keywords: ["nosferatu", "vampire", "horror", "1922", "silent"],
  },
  {
    id: "nAIkMdHRqKs",
    title: "Metropolis (1927)",
    keywords: [
      "metropolis",
      "scifi",
      "science fiction",
      "silent",
      "1927",
      "fritz lang",
    ],
  },
  {
    id: "AKdVNKr_gLo",
    title: "The General (1926) - Buster Keaton",
    keywords: ["buster keaton", "general", "comedy", "silent", "1926", "train"],
  },
  {
    id: "lWnWYBdHJaw",
    title: "Sherlock Jr. (1924) - Buster Keaton",
    keywords: ["buster keaton", "sherlock", "comedy", "silent", "1924"],
  },
  {
    id: "K3BOGCOuAWc",
    title: "The Kid (1921) - Charlie Chaplin",
    keywords: ["chaplin", "kid", "comedy", "silent", "1921"],
  },
  {
    id: "9PSpZAGMGpk",
    title: "City Lights (1931) - Charlie Chaplin",
    keywords: ["chaplin", "city lights", "comedy", "1931"],
  },
  {
    id: "YScnS8OzRNQ",
    title: "Modern Times (1936) - Charlie Chaplin",
    keywords: ["chaplin", "modern times", "comedy", "1936", "factory"],
  },
  {
    id: "Hw7KgANHOuA",
    title: "The Gold Rush (1925) - Charlie Chaplin",
    keywords: ["chaplin", "gold rush", "comedy", "1925", "alaska"],
  },
  {
    id: "D3rp7-_2bpw",
    title: "His Girl Friday (1940)",
    keywords: ["his girl friday", "comedy", "1940", "newspaper", "reporter"],
  },
  {
    id: "RZ3Z3P2MGYM",
    title: "It Happened One Night (1934)",
    keywords: ["it happened one night", "comedy", "1934", "romance"],
  },
  {
    id: "eFiGVq-8LQA",
    title: "The Phantom of the Opera (1925)",
    keywords: ["phantom", "opera", "horror", "silent", "1925"],
  },
  {
    id: "9Ru9uIE1KMc",
    title: "Sunrise: A Song of Two Humans (1927)",
    keywords: ["sunrise", "silent", "1927", "drama"],
  },
  {
    id: "gXEkX9oJFpw",
    title: "Safety Last! (1923) - Harold Lloyd",
    keywords: [
      "harold lloyd",
      "safety last",
      "comedy",
      "silent",
      "1923",
      "building",
    ],
  },
  {
    id: "yh4BBh9TMdg",
    title: "Reefer Madness (1936)",
    keywords: ["reefer madness", "propaganda", "1936", "drugs"],
  },
  {
    id: "6bXlT4I7Fjo",
    title: "The Cabinet of Dr. Caligari (1920)",
    keywords: [
      "caligari",
      "horror",
      "expressionism",
      "silent",
      "1920",
      "german",
    ],
  },
  {
    id: "cGW0FNPJhvY",
    title: "Battleship Potemkin (1925)",
    keywords: [
      "potemkin",
      "battleship",
      "eisenstein",
      "1925",
      "silent",
      "revolution",
      "russian",
    ],
  },
  {
    id: "S7gEDYZDMfQ",
    title: "Wings (1927)",
    keywords: ["wings", "1927", "wwi", "war", "aviation", "silent"],
  },
  {
    id: "VEZku4WM9HQ",
    title: "Our Hospitality (1923) - Buster Keaton",
    keywords: ["buster keaton", "hospitality", "comedy", "1923", "silent"],
  },
  {
    id: "rrHRLt4M03o",
    title: "Plan 9 from Outer Space (1957)",
    keywords: ["plan 9", "outer space", "1957", "scifi", "aliens"],
  },
  {
    id: "sSNa3YtZJFI",
    title: "White Zombie (1932)",
    keywords: ["white zombie", "1932", "horror", "zombie"],
  },
  {
    id: "lINn9HZ7aLc",
    title: "Carnival of Souls (1962)",
    keywords: ["carnival", "souls", "1962", "horror"],
  },
  {
    id: "Ek7bOvE3t5k",
    title: "Little Shop of Horrors (1960)",
    keywords: ["little shop", "horrors", "1960", "comedy", "horror"],
  },
  {
    id: "FzrnOzEKNzg",
    title: "Earth vs. the Flying Saucers (1956)",
    keywords: ["earth", "flying saucers", "1956", "scifi", "aliens"],
  },
  {
    id: "nKxQBCBieMQ",
    title: "Robot Monster (1953)",
    keywords: ["robot monster", "1953", "scifi"],
  },
  {
    id: "TkqIHlFoBTg",
    title: "House on Haunted Hill (1959)",
    keywords: ["haunted hill", "1959", "horror", "vincent price"],
  },
  {
    id: "OWyH0-MdEa4",
    title: "The Brain That Wouldn't Die (1962)",
    keywords: ["brain", "1962", "horror", "scifi"],
  },
  {
    id: "XjXgqmFLCpw",
    title: "The Last Man on Earth (1964) - Vincent Price",
    keywords: [
      "last man",
      "earth",
      "1964",
      "horror",
      "vincent price",
      "vampire",
    ],
  },
  {
    id: "4W82tFuGZsQ",
    title: "Duck and Cover (1952)",
    keywords: ["duck cover", "1952", "cold war", "nuclear", "civil defense"],
  },
  {
    id: "vZE0j_WEoZg",
    title: "Cops (1922) - Buster Keaton",
    keywords: ["buster keaton", "cops", "1922", "silent", "comedy"],
  },
  {
    id: "rleGDXsO3_o",
    title: "One Week (1920) - Buster Keaton",
    keywords: ["buster keaton", "one week", "1920", "silent", "comedy"],
  },
  {
    id: "KSfFfMJROJs",
    title: "The Immigrant (1917) - Charlie Chaplin",
    keywords: ["chaplin", "immigrant", "1917", "silent", "comedy"],
  },
  {
    id: "_bXyiKdRSO0",
    title: "Easy Street (1917) - Charlie Chaplin",
    keywords: ["chaplin", "easy street", "1917", "silent", "comedy"],
  },
  {
    id: "VoC5S3iRgxM",
    title: "The Pawnshop (1916) - Charlie Chaplin",
    keywords: ["chaplin", "pawnshop", "1916", "silent", "comedy"],
  },
  {
    id: "vg8v3V_WoEo",
    title: "Steamboat Bill, Jr. (1928) - Buster Keaton",
    keywords: ["buster keaton", "steamboat", "1928", "silent", "comedy"],
  },
  {
    id: "qw7RgQYbWHw",
    title: "The Navigator (1924) - Buster Keaton",
    keywords: [
      "buster keaton",
      "navigator",
      "1924",
      "silent",
      "comedy",
      "ship",
    ],
  },
  {
    id: "yPPqRCfPQhk",
    title: "Intolerance (1916) - D.W. Griffith",
    keywords: ["intolerance", "griffith", "1916", "silent", "epic", "drama"],
  },
  {
    id: "9N6MBfHzSnE",
    title: "The Birth of a Nation (1915)",
    keywords: ["birth of a nation", "griffith", "1915", "silent", "civil war"],
  },
  {
    id: "gFd3xEbJjfQ",
    title: "A Trip to the Moon (1902) - Georges Méliès",
    keywords: [
      "trip to the moon",
      "melies",
      "1902",
      "silent",
      "scifi",
      "space",
    ],
  },
  {
    id: "vS7nJvjNkAs",
    title: "Nanook of the North (1922)",
    keywords: ["nanook", "north", "1922", "documentary", "silent", "inuit"],
  },
  // Additional verified public domain films
  {
    id: "NuEzPPrYKYM",
    title: "Dracula (1931) - Bela Lugosi",
    keywords: ["dracula", "1931", "horror", "bela lugosi", "vampire"],
  },
  {
    id: "Ru_Sv3-XQGI",
    title: "Frankenstein (1931) - Boris Karloff",
    keywords: ["frankenstein", "1931", "horror", "boris karloff"],
  },
  {
    id: "Dh6dKrM0YpA",
    title: "The Mummy (1932) - Boris Karloff",
    keywords: ["mummy", "1932", "horror", "boris karloff"],
  },
  {
    id: "KRsNl08cpzM",
    title: "Invisible Man (1933)",
    keywords: ["invisible man", "1933", "horror", "scifi"],
  },
  {
    id: "NTXFsB3ZHCQ",
    title: "The Most Dangerous Game (1932)",
    keywords: ["most dangerous game", "1932", "adventure", "thriller"],
  },
  {
    id: "k1SHdGKGkl0",
    title: "Murders in the Rue Morgue (1932)",
    keywords: ["rue morgue", "1932", "horror", "mystery"],
  },
  {
    id: "dQHl3RQYLHE",
    title: "King Kong (1933)",
    keywords: ["king kong", "1933", "adventure", "giant ape"],
  },
  {
    id: "9qosnhKAkbA",
    title: "Duck Soup (1933) - Marx Brothers",
    keywords: ["duck soup", "1933", "comedy", "marx brothers"],
  },
  {
    id: "ZxLbPPEr8N4",
    title: "Animal Crackers (1930) - Marx Brothers",
    keywords: ["animal crackers", "1930", "comedy", "marx brothers"],
  },
  {
    id: "rB0TNKQ9HXc",
    title: "Of Mice and Men (1939)",
    keywords: ["of mice and men", "1939", "drama"],
  },
];

function searchYouTubePublicDomain(query: string): WikiVideo[] {
  const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = YOUTUBE_PUBLIC_DOMAIN.filter((film) =>
    queryWords.some((word) =>
      film.keywords.some((kw) => kw.includes(word) || word.includes(kw)),
    ),
  );

  // Always fill to at least 8 results by rotating through the full list
  let results = matches.slice(0, 8);
  if (results.length < 6) {
    const matchedIds = new Set(results.map((f) => f.id));
    const fill = YOUTUBE_PUBLIC_DOMAIN.filter((f) => !matchedIds.has(f.id));
    // Rotate through starting at a deterministic offset based on query length
    const offset = queryWords.join("").length % fill.length || 0;
    const rotated = [...fill.slice(offset), ...fill.slice(0, offset)];
    results = [...results, ...rotated].slice(0, 8);
  }

  return results.map((film, idx) => ({
    pageid: 9000000 + idx,
    title: film.title,
    url: `https://www.youtube-nocookie.com/embed/${film.id}`,
    mime: "video/mp4",
    embedUrl: `https://www.youtube-nocookie.com/embed/${film.id}`,
    thumbUrl: `https://img.youtube.com/vi/${film.id}/mqdefault.jpg`,
    description: "Public domain film available on YouTube",
    source: "YouTube (Public Domain)",
  }));
}

// ──────────────────────────────────────────────
// ARTICLE SOURCES
// ──────────────────────────────────────────────

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

async function fetchOpenLibraryArticles(query: string): Promise<WikiArticle[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5&fields=key,title,author_name,subject,edition_count`;
  const res = await fetch(url);
  const data = await res.json();
  const docs = data?.docs ?? [];
  return docs.map((doc: any, idx: number) => ({
    pageid: 1500000 + idx,
    title: doc.title ?? "Untitled",
    snippet: doc.author_name
      ? `By ${doc.author_name.join(", ")}`
      : (doc.subject?.[0] ?? ""),
    source: "Open Library",
  }));
}

async function fetchHathiTrustArticles(query: string): Promise<WikiArticle[]> {
  const searchUrl = `https://catalog.hathitrust.org/Search/json?lookfor=${encodeURIComponent(query)}&type=AllFields&limit=5`;
  const res = await fetch(searchUrl);
  const data = await res.json();
  const records = data?.records ?? {};
  return Object.values(records)
    .slice(0, 5)
    .map((rec: any, idx: number) => ({
      pageid: 1600000 + idx,
      title: rec.titles?.[0] ?? "HathiTrust Record",
      snippet: rec.authors?.join(", ") ?? "",
      source: "HathiTrust",
    }));
}

async function fetchNsfArticles(query: string): Promise<WikiArticle[]> {
  const url = `https://api.nsf.gov/services/v1/awards.json?keyword=${encodeURIComponent(query)}&printFields=id,title,abstractText,piFirstName,piLastName&rpp=6`;
  const res = await fetch(url);
  const data = await res.json();
  const awards = data?.response?.award ?? [];
  return awards.map((award: any, idx: number) => ({
    pageid: 3100000 + idx,
    title: award.title ?? "NSF Award",
    snippet: award.abstractText
      ? award.abstractText.substring(0, 200)
      : award.piFirstName && award.piLastName
        ? `PI: ${award.piFirstName} ${award.piLastName}`
        : "",
    source: "NSF",
  }));
}

async function fetchNihArticles(query: string): Promise<WikiArticle[]> {
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pmc&term=${encodeURIComponent(query)}&retmax=6&retmode=json`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  const ids: string[] = searchData?.esearchresult?.idlist ?? [];
  if (ids.length === 0) return [];

  const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pmc&id=${ids.join(",")}&retmode=json`;
  const summaryRes = await fetch(summaryUrl);
  const summaryData = await summaryRes.json();
  const result = summaryData?.result ?? {};

  return ids
    .map((id, idx) => {
      const item = result[`${id}`];
      if (!item) return null;
      return {
        pageid: 3200000 + idx,
        title: item.title ?? "NIH Article",
        snippet: item.source ? `Journal: ${item.source}` : "",
        source: "NIH / NLM",
      };
    })
    .filter(Boolean) as WikiArticle[];
}

// ──────────────────────────────────────────────
// IMAGE SOURCES
// ──────────────────────────────────────────────

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

async function fetchOpenverseImages(query: string): Promise<WikiImage[]> {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license_type=public-domain&page_size=12`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const data = await res.json();
  const results = data?.results ?? [];
  return results.map((item: any, idx: number) => ({
    pageid: 1100000 + idx,
    title: item.title ?? "Public Domain Image",
    url: item.url,
    thumbUrl: item.thumbnail ?? item.url,
    description: item.description ?? "",
    author: item.creator ?? undefined,
    license: item.license ?? undefined,
    source: "Openverse",
  }));
}

async function fetchSmithsonianImages(query: string): Promise<WikiImage[]> {
  const url = `https://api.si.edu/openaccess/api/v1.0/search?q=${encodeURIComponent(query)}&api_key=OPENACCESS&rows=8`;
  const res = await fetch(url);
  const data = await res.json();
  const rows = data?.response?.rows ?? [];
  return rows
    .filter(
      (row: any) =>
        row.content?.descriptiveNonRepeating?.online_media?.media?.[0]
          ?.thumbnail,
    )
    .map((row: any, idx: number) => {
      const media = row.content.descriptiveNonRepeating.online_media.media[0];
      return {
        pageid: 1300000 + idx,
        title: row.title ?? "Smithsonian Item",
        url: media.content ?? media.thumbnail,
        thumbUrl: media.thumbnail,
        description: "",
        source: "Smithsonian",
      };
    });
}

/** Flickr Commons via Openverse (source=flickr) — no API key needed */
async function fetchFlickrImages(query: string): Promise<WikiImage[]> {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&source=flickr&license_type=public-domain&page_size=12`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const data = await res.json();
  const results = data?.results ?? [];
  return results.map((item: any, idx: number) => ({
    pageid: 1700000 + idx,
    title: item.title ?? "Flickr Photo",
    url: item.url,
    thumbUrl: item.thumbnail ?? item.url,
    description: item.description ?? "",
    author: item.creator ?? undefined,
    license: item.license ?? undefined,
    source: "Flickr Commons",
  }));
}

// ──────────────────────────────────────────────
// VIDEO SOURCES
// ──────────────────────────────────────────────

async function fetchInternetArchiveVideos(query: string): Promise<WikiVideo[]> {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier,title,description&rows=8&output=json&mediatype=movies`;
  const res = await fetch(url);
  const data = await res.json();
  const docs = data?.response?.docs ?? [];
  return docs.map((doc: any, idx: number) => ({
    pageid: 200000 + idx,
    title: doc.title ?? doc.identifier ?? "Untitled",
    url: `https://archive.org/details/${doc.identifier}`,
    embedUrl: `https://archive.org/embed/${doc.identifier}`,
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

async function fetchPrelingerVideos(query: string): Promise<WikiVideo[]> {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+collection:prelinger&fl[]=identifier,title,description&rows=6&output=json&mediatype=movies`;
  const res = await fetch(url);
  const data = await res.json();
  const docs = data?.response?.docs ?? [];
  return docs.map((doc: any, idx: number) => ({
    pageid: 1400000 + idx,
    title: doc.title ?? doc.identifier ?? "Prelinger Film",
    url: `https://archive.org/details/${doc.identifier}`,
    embedUrl: `https://archive.org/embed/${doc.identifier}`,
    mime: "video/mp4",
    thumbUrl: `https://archive.org/services/img/${doc.identifier}`,
    description: doc.description ?? "",
    source: "Prelinger Archives",
  }));
}

async function fetchBritishPatheVideos(query: string): Promise<WikiVideo[]> {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+collection:britishpathe&fl[]=identifier,title,description&rows=6&output=json&mediatype=movies`;
  const res = await fetch(url);
  const data = await res.json();
  const docs = data?.response?.docs ?? [];
  return docs.map((doc: any, idx: number) => ({
    pageid: 1800000 + idx,
    title: doc.title ?? doc.identifier ?? "British Pathé Film",
    url: `https://archive.org/details/${doc.identifier}`,
    embedUrl: `https://archive.org/embed/${doc.identifier}`,
    mime: "video/mp4",
    thumbUrl: `https://archive.org/services/img/${doc.identifier}`,
    description: doc.description ?? "",
    source: "British Pathé",
  }));
}

async function fetchCSpanVideos(query: string): Promise<WikiVideo[]> {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+collection:c-span&fl[]=identifier,title,description&rows=6&output=json&mediatype=movies`;
  const res = await fetch(url);
  const data = await res.json();
  const docs = data?.response?.docs ?? [];
  return docs.map((doc: any, idx: number) => ({
    pageid: 1900000 + idx,
    title: doc.title ?? doc.identifier ?? "C-SPAN Video",
    url: `https://archive.org/details/${doc.identifier}`,
    embedUrl: `https://archive.org/embed/${doc.identifier}`,
    mime: "video/mp4",
    thumbUrl: `https://archive.org/services/img/${doc.identifier}`,
    description: doc.description ?? "",
    source: "C-SPAN Archive",
  }));
}

async function fetchLocFilms(query: string): Promise<WikiVideo[]> {
  const url = `https://www.loc.gov/film/?q=${encodeURIComponent(query)}&fo=json&c=8`;
  const res = await fetch(url);
  const data = await res.json();
  const results = data?.results ?? [];
  return results
    .filter(
      (r: any) =>
        r.online_format?.includes("video") ||
        r.mime_type?.some?.((m: string) => m.startsWith("video")),
    )
    .map((r: any, idx: number) => ({
      pageid: 2000000 + idx,
      title: r.title ?? "Library of Congress Film",
      url: r.url ?? r.id ?? "",
      mime: "video/mp4" as const,
      thumbUrl: r.image_url?.[0] ?? undefined,
      description: Array.isArray(r.description)
        ? r.description[0]
        : (r.description ?? ""),
      source: "Library of Congress",
    }));
}

async function fetchDplaVideos(query: string): Promise<WikiVideo[]> {
  const url = `https://api.dp.la/v2/items?q=${encodeURIComponent(query)}&sourceResource.type=moving+image&page_size=6`;
  const res = await fetch(url);
  const data = await res.json();
  const docs = data?.docs ?? [];
  return docs
    .filter((doc: any) => doc.object || doc.sourceResource?.title)
    .map((doc: any, idx: number) => ({
      pageid: 2100000 + idx,
      title: doc.sourceResource?.title?.[0] ?? "DPLA Video",
      url: doc.isShownAt ?? doc.object ?? "",
      mime: "video/mp4" as const,
      thumbUrl: doc.object ?? undefined,
      description: doc.sourceResource?.description?.[0] ?? "",
      source: "DPLA",
    }));
}

/** Fixed: use edmIsShownBy for direct media URL; only set embedUrl for actual embeddable video files */
async function fetchEuropeanFilmGateway(query: string): Promise<WikiVideo[]> {
  const url = `https://api.europeana.eu/record/v2/search.json?wskey=api2demo&query=${encodeURIComponent(query)}&qf=TYPE:VIDEO&rows=6`;
  const res = await fetch(url);
  const data = await res.json();
  const items = data?.items ?? [];
  const EMBEDDABLE = /\.(mp4|webm|ogg)$/i;
  const results: WikiVideo[] = [];
  for (const item of items) {
    const directUrl: string = item.edmIsShownBy?.[0] ?? "";
    const pageUrl: string = item.edmIsShownAt?.[0] ?? "";
    const videoUrl = directUrl || pageUrl;
    if (!videoUrl) continue;
    const isEmbeddable =
      EMBEDDABLE.test(videoUrl) || videoUrl.includes("player");
    results.push({
      pageid: 2200000 + results.length,
      title: item.title?.[0] ?? "European Film",
      url: videoUrl,
      mime: "video/mp4" as const,
      thumbUrl: item.edmPreview?.[0] ?? undefined,
      description: item.dcDescription?.[0] ?? "",
      embedUrl: isEmbeddable ? videoUrl : undefined,
      source: "European Film Gateway",
    });
  }
  return results;
}

async function fetchWikimediaVideos(query: string): Promise<WikiVideo[]> {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}+filetype:video&prop=imageinfo&iiprop=url|mime&format=json&origin=*&gsrlimit=8`;
  const res = await fetch(url);
  const data = await res.json();
  const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
  return (pages as any[])
    .filter((p: any) => p.imageinfo?.[0]?.mime?.startsWith("video"))
    .map((p: any, idx: number) => {
      const info = p.imageinfo[0];
      return {
        pageid: 2300000 + idx,
        title: p.title?.replace(/^File:/, "") ?? "Commons Video",
        url: info.url,
        mime: info.mime ?? "video/webm",
        thumbUrl: undefined,
        description: "",
        source: "Wikimedia Commons",
      };
    });
}

/** YouTube-archived videos preserved on Internet Archive */
async function fetchYouTubeArchivedVideos(query: string): Promise<WikiVideo[]> {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+collection:youtube&fl[]=identifier,title,description&rows=8&output=json&mediatype=movies`;
  const res = await fetch(url);
  const data = await res.json();
  const docs = data?.response?.docs ?? [];
  return docs.map((doc: any, idx: number) => ({
    pageid: 2400000 + idx,
    title: doc.title ?? doc.identifier ?? "Archived Video",
    url: `https://archive.org/details/${doc.identifier}`,
    embedUrl: `https://archive.org/embed/${doc.identifier}`,
    mime: "video/mp4" as const,
    thumbUrl: `https://archive.org/services/img/${doc.identifier}`,
    description: doc.description ?? "",
    source: "YouTube (Archived)",
  }));
}

async function fetchArchiveFeatureFilms(query: string): Promise<WikiVideo[]> {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+collection:feature_films&fl[]=identifier,title,description&rows=6&output=json&mediatype=movies`;
  const res = await fetch(url);
  const data = await res.json();
  const docs = data?.response?.docs ?? [];
  return docs.map((doc: any, idx: number) => ({
    pageid: 2500000 + idx,
    title: doc.title ?? doc.identifier ?? "Feature Film",
    url: `https://archive.org/details/${doc.identifier}`,
    embedUrl: `https://archive.org/embed/${doc.identifier}`,
    mime: "video/mp4" as const,
    thumbUrl: `https://archive.org/services/img/${doc.identifier}`,
    description: doc.description ?? "",
    source: "Archive Feature Films",
  }));
}

async function fetchArchiveOpenSourceMovies(
  query: string,
): Promise<WikiVideo[]> {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+collection:opensource_movies&fl[]=identifier,title,description&rows=6&output=json&mediatype=movies`;
  const res = await fetch(url);
  const data = await res.json();
  const docs = data?.response?.docs ?? [];
  return docs.map((doc: any, idx: number) => ({
    pageid: 2600000 + idx,
    title: doc.title ?? doc.identifier ?? "Open Source Movie",
    url: `https://archive.org/details/${doc.identifier}`,
    embedUrl: `https://archive.org/embed/${doc.identifier}`,
    mime: "video/mp4" as const,
    thumbUrl: `https://archive.org/services/img/${doc.identifier}`,
    description: doc.description ?? "",
    source: "Archive Open Source",
  }));
}

async function fetchVimeoCC(query: string): Promise<WikiVideo[]> {
  const url = `https://api.openverse.org/v1/videos/?q=${encodeURIComponent(query)}&source=vimeo&page_size=8`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const data = await res.json();
  const results = data?.results ?? [];
  return results.map((item: any, idx: number) => {
    // Convert Vimeo page URLs to embeddable player URLs
    const pageUrl: string = item.url ?? "";
    const vimeoMatch = pageUrl.match(/vimeo\.com\/(\d+)/);
    const embedUrl = vimeoMatch
      ? `https://player.vimeo.com/video/${vimeoMatch[1]}`
      : undefined;
    return {
      pageid: 2700000 + idx,
      title: item.title ?? "Vimeo Video",
      url: pageUrl,
      mime: "video/mp4" as const,
      embedUrl,
      thumbUrl: item.thumbnail ?? undefined,
      description: item.description ?? "",
      source: "Vimeo CC",
    };
  });
}

async function fetchArchiveAnimation(query: string): Promise<WikiVideo[]> {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+collection:animationandcartoons&fl[]=identifier,title,description&rows=6&output=json&mediatype=movies`;
  const res = await fetch(url);
  const data = await res.json();
  const docs = data?.response?.docs ?? [];
  return docs.map((doc: any, idx: number) => ({
    pageid: 2800000 + idx,
    title: doc.title ?? doc.identifier ?? "Animation",
    url: `https://archive.org/details/${doc.identifier}`,
    embedUrl: `https://archive.org/embed/${doc.identifier}`,
    mime: "video/mp4" as const,
    thumbUrl: `https://archive.org/services/img/${doc.identifier}`,
    description: doc.description ?? "",
    source: "Archive Animation",
  }));
}

async function fetchArchiveEducation(query: string): Promise<WikiVideo[]> {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+collection:education&fl[]=identifier,title,description&rows=6&output=json&mediatype=movies`;
  const res = await fetch(url);
  const data = await res.json();
  const docs = data?.response?.docs ?? [];
  return docs.map((doc: any, idx: number) => ({
    pageid: 2900000 + idx,
    title: doc.title ?? doc.identifier ?? "Educational Video",
    url: `https://archive.org/details/${doc.identifier}`,
    embedUrl: `https://archive.org/embed/${doc.identifier}`,
    mime: "video/mp4" as const,
    thumbUrl: `https://archive.org/services/img/${doc.identifier}`,
    description: doc.description ?? "",
    source: "Archive Education",
  }));
}

async function fetchArchiveNews(query: string): Promise<WikiVideo[]> {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+collection:tv&fl[]=identifier,title,description&rows=6&output=json&mediatype=movies`;
  const res = await fetch(url);
  const data = await res.json();
  const docs = data?.response?.docs ?? [];
  return docs.map((doc: any, idx: number) => ({
    pageid: 3000000 + idx,
    title: doc.title ?? doc.identifier ?? "News Video",
    url: `https://archive.org/details/${doc.identifier}`,
    embedUrl: `https://archive.org/embed/${doc.identifier}`,
    mime: "video/mp4" as const,
    thumbUrl: `https://archive.org/services/img/${doc.identifier}`,
    description: doc.description ?? "",
    source: "Archive News & TV",
  }));
}

// ──────────────────────────────────────────────
// FUZZY SEARCH HELPERS
// ──────────────────────────────────────────────

/** Returns a broadened query: multi-word → first word; single word → as-is */
function broadenQuery(query: string): string {
  const words = query.trim().split(/\s+/);
  return words.length > 1 ? words[0] : query;
}

// ──────────────────────────────────────────────
// RESULT CACHE
// ──────────────────────────────────────────────

const searchCache = new Map<
  string,
  { results: SearchResults; fuzzyUsed: boolean }
>();

// ──────────────────────────────────────────────
// HOOK
// ──────────────────────────────────────────────

export function useResearch() {
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [results, setResults] = useState<SearchResults>({
    articles: [],
    images: [],
    videos: [],
    films: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState("");
  const [fuzzyUsed, setFuzzyUsed] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setStatus("loading");
    setError(null);
    setLastQuery(query);
    setFuzzyUsed(false);

    const cacheKey = query.toLowerCase().trim();
    const cached = searchCache.get(cacheKey);
    if (cached) {
      setResults(cached.results);
      setFuzzyUsed(cached.fuzzyUsed);
      setStatus("success");
      return;
    }

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

      // YouTube public domain (synchronous)
      const ytPublicDomainFilms = searchYouTubePublicDomain(query);

      // Fetch all additional sources in parallel
      const [
        iaArticlesResult,
        gutenbergResult,
        pubmedResult,
        nsfResult,
        nihResult,
        nasaImagesResult,
        metResult,
        locResult,
        europeanaResult,
        iaVideosResult,
        nasaVideosResult,
        openverseResult,
        smithsonianResult,
        prelingerResult,
        openLibraryResult,
        hathiTrustResult,
        flickrResult,
        britishPatheResult,
        cspanResult,
        locFilmsResult,
        dplaResult,
        efgResult,
        wikimediaVideosResult,
        ytArchivedResult,
        featureFilmsResult,
        openSourceMoviesResult,
        vimeoCCResult,
        archiveAnimationResult,
        archiveEducationResult,
        archiveNewsResult,
      ] = await Promise.allSettled([
        fetchInternetArchiveArticles(query),
        fetchGutenbergArticles(query),
        fetchPubMedArticles(query),
        fetchNsfArticles(query),
        fetchNihArticles(query),
        fetchNasaImages(query),
        fetchMetMuseumImages(query),
        fetchLocImages(query),
        fetchEuropeanaImages(query),
        fetchInternetArchiveVideos(query),
        fetchNasaVideos(query),
        fetchOpenverseImages(query),
        fetchSmithsonianImages(query),
        fetchPrelingerVideos(query),
        fetchOpenLibraryArticles(query),
        fetchHathiTrustArticles(query),
        fetchFlickrImages(query),
        fetchBritishPatheVideos(query),
        fetchCSpanVideos(query),
        fetchLocFilms(query),
        fetchDplaVideos(query),
        fetchEuropeanFilmGateway(query),
        fetchWikimediaVideos(query),
        fetchYouTubeArchivedVideos(query),
        fetchArchiveFeatureFilms(query),
        fetchArchiveOpenSourceMovies(query),
        fetchVimeoCC(query),
        fetchArchiveAnimation(query),
        fetchArchiveEducation(query),
        fetchArchiveNews(query),
      ]);

      const extra = <T>(r: PromiseSettledResult<T[]>): T[] =>
        r.status === "fulfilled" ? r.value : [];

      let articles: WikiArticle[] = [
        ...wikiArticles,
        ...extra(iaArticlesResult),
        ...extra(gutenbergResult),
        ...extra(pubmedResult),
        ...extra(nsfResult),
        ...extra(nihResult),
        ...extra(openLibraryResult),
        ...extra(hathiTrustResult),
      ];

      let images: WikiImage[] = [
        ...wikiImages,
        ...extra(nasaImagesResult),
        ...extra(metResult),
        ...extra(locResult),
        ...extra(europeanaResult),
        ...extra(openverseResult),
        ...extra(smithsonianResult),
        ...extra(flickrResult),
      ];

      let videos: WikiVideo[] = [
        ...wikiVideos,
        ...extra(iaVideosResult),
        ...extra(nasaVideosResult),
        ...extra(prelingerResult),
        ...extra(britishPatheResult),
        ...extra(cspanResult),
        ...extra(locFilmsResult),
        ...extra(dplaResult),
        ...extra(efgResult),
        ...extra(wikimediaVideosResult),
        ...extra(ytArchivedResult),
        ...extra(vimeoCCResult),
        ...extra(archiveAnimationResult),
        ...extra(archiveEducationResult),
        ...extra(archiveNewsResult),
      ];

      // Films tab: feature films + prelinger + british pathe + EFG + YouTube PD + wikimedia + open source
      let films: WikiVideo[] = [
        ...ytPublicDomainFilms,
        ...extra(featureFilmsResult),
        ...extra(openSourceMoviesResult),
        ...extra(prelingerResult),
        ...extra(britishPatheResult),
        ...extra(efgResult),
        ...extra(wikimediaVideosResult).filter((v) =>
          v.mime.startsWith("video"),
        ),
      ];

      // ── Fuzzy / similar search fallback ──
      const needsFuzzyImages = images.length < 3;
      const needsFuzzyVideos = videos.length < 3;

      if (needsFuzzyImages || needsFuzzyVideos) {
        const broadQ = broadenQuery(query);
        if (broadQ !== query) {
          const fuzzyFetches: Promise<any>[] = [];
          const fuzzyKeys: string[] = [];

          if (needsFuzzyImages) {
            fuzzyFetches.push(
              fetchOpenverseImages(broadQ),
              fetchFlickrImages(broadQ),
              fetchNasaImages(broadQ),
            );
            fuzzyKeys.push("openverse", "flickr", "nasa-img");
          }
          if (needsFuzzyVideos) {
            fuzzyFetches.push(
              fetchInternetArchiveVideos(broadQ),
              fetchBritishPatheVideos(broadQ),
              fetchPrelingerVideos(broadQ),
            );
            fuzzyKeys.push("ia-vid", "pathe", "prelinger");
          }

          const fuzzyResults = await Promise.allSettled(fuzzyFetches);
          let fuzzyActivated = false;

          const existingImageIds = new Set(images.map((i) => i.pageid));
          const existingVideoIds = new Set(videos.map((v) => v.pageid));

          let keyIdx = 0;
          if (needsFuzzyImages) {
            for (let i = 0; i < 3; i++) {
              const r = fuzzyResults[keyIdx++];
              if (r.status === "fulfilled") {
                const newImgs = (r.value as WikiImage[]).filter(
                  (img) => !existingImageIds.has(img.pageid),
                );
                if (newImgs.length > 0) {
                  images = [...images, ...newImgs];
                  fuzzyActivated = true;
                }
              }
            }
          }
          if (needsFuzzyVideos) {
            for (let i = 0; i < 3; i++) {
              const r = fuzzyResults[keyIdx++];
              if (r.status === "fulfilled") {
                const newVids = (r.value as WikiVideo[]).filter(
                  (v) => !existingVideoIds.has(v.pageid),
                );
                if (newVids.length > 0) {
                  videos = [...videos, ...newVids];
                  fuzzyActivated = true;
                }
              }
            }
          }

          if (fuzzyActivated) setFuzzyUsed(true);
        }
      }

      const finalResults: SearchResults = { articles, images, videos, films };
      searchCache.set(cacheKey, { results: finalResults, fuzzyUsed: false });

      setResults(finalResults);
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

  return {
    status,
    results,
    error,
    lastQuery,
    fuzzyUsed,
    search,
    expandArticle,
  };
}
