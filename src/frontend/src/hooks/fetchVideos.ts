import type { WikiVideo } from "../types/research";

// ── YouTube Public Domain ──
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
    id: "TkqIHlFoBTg",
    title: "House on Haunted Hill (1959)",
    keywords: ["haunted hill", "1959", "horror", "vincent price"],
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
    id: "KSfFfMJROJs",
    title: "The Immigrant (1917) - Charlie Chaplin",
    keywords: ["chaplin", "immigrant", "1917", "silent", "comedy"],
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
    id: "rB0TNKQ9HXc",
    title: "Of Mice and Men (1939)",
    keywords: ["of mice and men", "1939", "drama"],
  },
];

export function searchYouTubePublicDomain(query: string): WikiVideo[] {
  const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = YOUTUBE_PUBLIC_DOMAIN.filter((film) =>
    queryWords.some((word) =>
      film.keywords.some((kw) => kw.includes(word) || word.includes(kw)),
    ),
  );
  let results = matches.slice(0, 8);
  if (results.length < 6) {
    const matchedIds = new Set(results.map((f) => f.id));
    const fill = YOUTUBE_PUBLIC_DOMAIN.filter((f) => !matchedIds.has(f.id));
    const offset = queryWords.join("").length % (fill.length || 1);
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

function archiveVideo(collection: string, source: string, baseId: number) {
  return async (query: string): Promise<WikiVideo[]> => {
    try {
      const queryStr = collection
        ? `${query} AND collection:${collection} AND mediatype:movies`
        : `${query} AND mediatype:movies`;
      const params = new URLSearchParams({
        q: queryStr,
        output: "json",
        rows: "50",
      });
      params.append("fl[]", "identifier");
      params.append("fl[]", "title");
      params.append("fl[]", "description");
      params.append("sort[]", "downloads desc");
      const url = `https://archive.org/advancedsearch.php?${params.toString()}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) return [];
      const data = await res.json();
      return (data?.response?.docs ?? []).map((doc: any, idx: number) => ({
        pageid: baseId + idx,
        title: doc.title ?? doc.identifier ?? "Untitled",
        url: `https://archive.org/details/${doc.identifier}`,
        embedUrl: `https://archive.org/embed/${doc.identifier}`,
        mime: "video/mp4" as const,
        thumbUrl: `https://archive.org/services/img/${doc.identifier}`,
        description: doc.description ?? "",
        source,
      }));
    } catch {
      return [];
    }
  };
}

export const fetchInternetArchiveVideos = archiveVideo(
  "",
  "Internet Archive",
  200000,
);
export const fetchPrelingerVideos = archiveVideo(
  "prelinger",
  "Prelinger Archives",
  1400000,
);
export const fetchBritishPatheVideos = archiveVideo(
  "britishpathe",
  "British Pathé",
  1800000,
);
export const fetchCSpanVideos = archiveVideo(
  "c-span",
  "C-SPAN Archive",
  1900000,
);
export const fetchYouTubeArchivedVideos = archiveVideo(
  "youtube",
  "YouTube (Archived)",
  2400000,
);
export const fetchArchiveFeatureFilms = archiveVideo(
  "feature_films",
  "Archive Feature Films",
  2500000,
);
export const fetchArchiveOpenSourceMovies = archiveVideo(
  "opensource_movies",
  "Archive Open Source",
  2600000,
);
export const fetchArchiveAnimation = archiveVideo(
  "animationandcartoons",
  "Archive Animation",
  2800000,
);
export const fetchArchiveEducation = archiveVideo(
  "education",
  "Archive Education",
  2900000,
);
export const fetchArchiveNews = archiveVideo(
  "tv",
  "Archive News & TV",
  3000000,
);
export const fetchPbsVideos = archiveVideo(
  "pbsnewshour",
  "PBS NewsHour",
  4700000,
);
export const fetchNfbVideos = archiveVideo(
  "nfb-films",
  "National Film Board",
  4800000,
);
export const fetchUcBerkeleyVideos = archiveVideo(
  "UCBerkeleyEducation",
  "UC Berkeley",
  4900000,
);
export const fetchDemocracyNowVideos = archiveVideo(
  "democracynow",
  "Democracy Now",
  5000000,
);
export const fetchClassicTvVideos = archiveVideo(
  "televisionarchive",
  "Classic TV",
  5100000,
);
export const fetchClassicCartoonsVideos = archiveVideo(
  "animationandcartoons",
  "Classic Cartoons",
  5200000,
);
export const fetchSciFiHorrorVideos = archiveVideo(
  "SciFi_Horror",
  "Sci-Fi & Horror Archive",
  5300000,
);
export const fetchMitOcwVideos = archiveVideo(
  "mitopencourseware",
  "MIT OpenCourseWare",
  5400000,
);
export const fetchTedTalksVideos = archiveVideo(
  "tedtalks",
  "TED Talks",
  5500000,
);
export const fetchNewsPublicAffairsVideos = archiveVideo(
  "newsandpublicaffairs",
  "News & Public Affairs",
  5600000,
);
export const fetchArchiveSportsVideos = archiveVideo(
  "sports",
  "Archive Sports",
  6600000,
);
export const fetchArchiveGovernment = archiveVideo(
  "usnationalarchivesvideos",
  "US National Archives",
  6700000,
);
export const fetchArchiveComputerChronicles = archiveVideo(
  "computerchronicles",
  "Computer Chronicles",
  6800000,
);
export const fetchArchivePublicAffairs = archiveVideo(
  "publicaffairs",
  "Archive Public Affairs",
  6900000,
);
export const fetchArchiveHomeMovies = archiveVideo(
  "homemovies",
  "Archive Home Movies",
  7000000,
);

export async function fetchNasaVideos(query: string): Promise<WikiVideo[]> {
  try {
    const url = `https://images.nasa.gov/api/v1/search?q=${encodeURIComponent(query)}&media_type=video&page_size=6`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.collection?.items ?? [])
      .filter((item: any) => item.links?.[0]?.href && item.data?.[0])
      .map((item: any, idx: number) => {
        const meta = item.data[0];
        return {
          pageid: 100000 + idx,
          title: meta.title ?? "NASA Video",
          url: item.links[0].href,
          mime: "video/mp4",
          description: meta.description ?? "",
          source: "NASA",
        };
      });
  } catch {
    return [];
  }
}

export async function fetchLocFilms(query: string): Promise<WikiVideo[]> {
  try {
    const url = `https://www.loc.gov/film/?q=${encodeURIComponent(query)}&fo=json&c=8`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.results ?? [])
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
  } catch {
    return [];
  }
}

export async function fetchDplaVideos(query: string): Promise<WikiVideo[]> {
  try {
    const url = `https://api.dp.la/v2/items?q=${encodeURIComponent(query)}&sourceResource.type=moving+image&page_size=6`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.docs ?? [])
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
  } catch {
    return [];
  }
}

export async function fetchEuropeanFilmGateway(
  query: string,
): Promise<WikiVideo[]> {
  try {
    const url = `https://api.europeana.eu/record/v2/search.json?wskey=api2demo&query=${encodeURIComponent(query)}&qf=TYPE:VIDEO&rows=20`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const EMBEDDABLE = /\.(mp4|webm|ogg)$/i;
    const results: WikiVideo[] = [];
    for (const item of data?.items ?? []) {
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
  } catch {
    return [];
  }
}

export async function fetchWikimediaVideos(
  query: string,
): Promise<WikiVideo[]> {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}+filetype:video&prop=imageinfo&iiprop=url|mime&format=json&origin=*&gsrlimit=25`;
    const res = await fetch(url);
    if (!res.ok) return [];
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
  } catch {
    return [];
  }
}

export async function fetchVimeoCC(query: string): Promise<WikiVideo[]> {
  try {
    const url = `https://api.openverse.org/v1/videos/?q=${encodeURIComponent(query)}&source=vimeo&page_size=8`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.results ?? []).map((item: any, idx: number) => {
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
  } catch {
    return [];
  }
}
