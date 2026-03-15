import { useCallback, useState } from "react";
import type {
  AudioResult,
  SearchResults,
  SearchStatus,
  WikiArticle,
  WikiImage,
  WikiVideo,
} from "../types/research";
import {
  fetchArchiveAmericanLibraries,
  fetchArchiveBiodiversity,
  fetchArchiveFolkscanomy,
  fetchArchiveOpenLibraryTexts,
  fetchArchiveTorontoTexts,
  fetchArchiveUniversalLibrary,
  fetchArxivArticles,
  fetchCrossRefArticles,
  fetchDoajArticles,
  fetchEuropePMCArticles,
  fetchGutenbergArticles,
  fetchHathiTrustArticles,
  fetchInternetArchiveArticles,
  fetchNihArticles,
  fetchNsfArticles,
  fetchOpenAlexArticles,
  fetchOpenLibraryArticles,
  fetchPubMedArticles,
  fetchSemanticScholarArticles,
} from "./fetchArticles";
import {
  fetchAudio78rpm,
  fetchAudioArchive,
  fetchAudioBroad,
  fetchAudioEtree,
  fetchAudioFolk,
  fetchAudioGeorge,
  fetchAudioLibriVox,
  fetchAudioMusic,
  fetchAudioNews,
  fetchAudioOTR,
  fetchAudioPodcast,
  fetchAudioRadio,
  fetchAudioTech,
  fetchAudioWorldMusic,
  fetchCustomDomainAudio,
} from "./fetchAudio";
import {
  fetchArchiveImagesExtra,
  fetchArtInstituteImages,
  fetchClevelandMuseumImages,
  fetchDeviantArtImages,
  fetchDplaImages,
  fetchEuropeanaImages,
  fetchFlickrImages,
  fetchImgurImages,
  fetchLocImages,
  fetchMetMuseumImages,
  fetchNasaImages,
  fetchOpenverseImages,
  fetchPexelsImages,
  fetchPixabayImages,
  fetchRedditImages,
  fetchRijksmuseumImages,
  fetchSmithsonianImages,
  fetchUnsplashImages,
  fetchWikimediaImages,
} from "./fetchImages";
import {
  fetchArchiveAnimation,
  fetchArchiveComedyFilms,
  fetchArchiveComputerChronicles,
  fetchArchiveDocumentaries,
  fetchArchiveEducation,
  fetchArchiveFeatureFilms,
  fetchArchiveFilmNoir,
  fetchArchiveGovernment,
  fetchArchiveHomeMovies,
  fetchArchiveHorrorFilms,
  fetchArchiveInstructional,
  fetchArchiveMusicVideos,
  fetchArchiveMystery,
  fetchArchiveNews,
  fetchArchiveNewsreels,
  fetchArchiveOpenSourceMovies,
  fetchArchivePublicAffairs,
  fetchArchiveShortFilms,
  fetchArchiveSilentFilms,
  fetchArchiveSportsVideos,
  fetchArchiveWesternFilms,
  fetchBritishPatheVideos,
  fetchCSpanVideos,
  fetchClassicCartoonsVideos,
  fetchClassicTvVideos,
  fetchDailymotionVideos,
  fetchDemocracyNowVideos,
  fetchDplaVideos,
  fetchEuropeanFilmGateway,
  fetchFreeMovies,
  fetchInternetArchiveAll,
  fetchInternetArchiveVideos,
  fetchLocFilms,
  fetchMitOcwVideos,
  fetchMusicConcerts,
  fetchNFLFootage,
  fetchNasaVideos,
  fetchNewsPublicAffairsVideos,
  fetchNfbVideos,
  fetchOdyseeVideos,
  fetchOpenCulture,
  fetchPbsVideos,
  fetchPeertubeVideos,
  fetchPrelingerVideos,
  fetchSciFiHorrorVideos,
  fetchTedTalksVideos,
  fetchUcBerkeleyVideos,
  fetchVimeoCC,
  fetchWikimediaVideos,
  fetchYouTubeArchivedVideos,
  searchYouTubePublicDomain,
} from "./fetchVideos";

const WIKI_SEARCH = (q: string) =>
  `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*&srlimit=30&srprop=snippet|titlesnippet`;

const WIKI_SUMMARY = (title: string) =>
  `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

const COMMONS_SEARCH = (q: string) =>
  `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=400&format=json&origin=*&gsrlimit=80`;

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

const searchCache = new Map<
  string,
  { results: SearchResults; fuzzyUsed: boolean }
>();

export function useResearch() {
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [results, setResults] = useState<SearchResults>({
    articles: [],
    images: [],
    videos: [],
    films: [],
    audio: [],
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
      const [wikiRes, commonsRes] = await Promise.all([
        fetch(WIKI_SEARCH(query)).then((r) => r.json()),
        fetch(COMMONS_SEARCH(query)).then((r) => r.json()),
      ]);

      const searchItems = wikiRes?.query?.search ?? [];
      const wikiArticles: WikiArticle[] = searchItems.map((item: any) => ({
        pageid: item.pageid,
        title: item.title,
        snippet: stripHtml(item.snippet ?? ""),
        source: "Wikipedia",
      }));

      const topArticles = wikiArticles.slice(0, 10);
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

      const ytPublicDomainFilms = searchYouTubePublicDomain(query);

      // --- PHASE 1: Show Wikipedia + Wikimedia results immediately ---
      const phase1Results: SearchResults = {
        articles: wikiArticles,
        images: wikiImages,
        videos: wikiVideos,
        films: ytPublicDomainFilms,
        audio: [],
      };
      setResults(phase1Results);
      setStatus("success");

      // --- PHASE 2: Progressive background loading with 8s timeout ---
      function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), ms),
          ),
        ]);
      }

      const T = 25000;

      // Articles (background)
      withTimeout(fetchInternetArchiveArticles(query), T)
        .then((r) =>
          setResults((prev) => ({
            ...prev,
            articles: [...prev.articles, ...r],
          })),
        )
        .catch(() => {});
      withTimeout(fetchGutenbergArticles(query), T)
        .then((r) =>
          setResults((prev) => ({
            ...prev,
            articles: [...prev.articles, ...r],
          })),
        )
        .catch(() => {});
      withTimeout(fetchPubMedArticles(query), T)
        .then((r) =>
          setResults((prev) => ({
            ...prev,
            articles: [...prev.articles, ...r],
          })),
        )
        .catch(() => {});
      withTimeout(fetchNsfArticles(query), T)
        .then((r) =>
          setResults((prev) => ({
            ...prev,
            articles: [...prev.articles, ...r],
          })),
        )
        .catch(() => {});
      withTimeout(fetchNihArticles(query), T)
        .then((r) =>
          setResults((prev) => ({
            ...prev,
            articles: [...prev.articles, ...r],
          })),
        )
        .catch(() => {});
      withTimeout(fetchOpenLibraryArticles(query), T)
        .then((r) =>
          setResults((prev) => ({
            ...prev,
            articles: [...prev.articles, ...r],
          })),
        )
        .catch(() => {});
      withTimeout(fetchHathiTrustArticles(query), T)
        .then((r) =>
          setResults((prev) => ({
            ...prev,
            articles: [...prev.articles, ...r],
          })),
        )
        .catch(() => {});
      withTimeout(fetchArxivArticles(query), T)
        .then((r) =>
          setResults((prev) => ({
            ...prev,
            articles: [...prev.articles, ...r],
          })),
        )
        .catch(() => {});
      withTimeout(fetchCrossRefArticles(query), T)
        .then((r) =>
          setResults((prev) => ({
            ...prev,
            articles: [...prev.articles, ...r],
          })),
        )
        .catch(() => {});
      withTimeout(fetchDoajArticles(query), T)
        .then((r) =>
          setResults((prev) => ({
            ...prev,
            articles: [...prev.articles, ...r],
          })),
        )
        .catch(() => {});
      withTimeout(fetchArchiveAmericanLibraries(query), T)
        .then((r) =>
          setResults((prev) => ({
            ...prev,
            articles: [...prev.articles, ...r],
          })),
        )
        .catch(() => {});
      withTimeout(fetchArchiveBiodiversity(query), T)
        .then((r) =>
          setResults((prev) => ({
            ...prev,
            articles: [...prev.articles, ...r],
          })),
        )
        .catch(() => {});
      withTimeout(fetchArchiveFolkscanomy(query), T)
        .then((r) =>
          setResults((prev) => ({
            ...prev,
            articles: [...prev.articles, ...r],
          })),
        )
        .catch(() => {});
      withTimeout(fetchArchiveUniversalLibrary(query), T)
        .then((r) =>
          setResults((prev) => ({
            ...prev,
            articles: [...prev.articles, ...r],
          })),
        )
        .catch(() => {});
      withTimeout(fetchArchiveOpenLibraryTexts(query), T)
        .then((r) =>
          setResults((prev) => ({
            ...prev,
            articles: [...prev.articles, ...r],
          })),
        )
        .catch(() => {});
      withTimeout(fetchArchiveTorontoTexts(query), T)
        .then((r) =>
          setResults((prev) => ({
            ...prev,
            articles: [...prev.articles, ...r],
          })),
        )
        .catch(() => {});
      withTimeout(fetchOpenAlexArticles(query), T)
        .then((r) =>
          setResults((prev) => ({
            ...prev,
            articles: [...prev.articles, ...r],
          })),
        )
        .catch(() => {});
      withTimeout(fetchSemanticScholarArticles(query), T)
        .then((r) =>
          setResults((prev) => ({
            ...prev,
            articles: [...prev.articles, ...r],
          })),
        )
        .catch(() => {});
      withTimeout(fetchEuropePMCArticles(query), T)
        .then((r) =>
          setResults((prev) => ({
            ...prev,
            articles: [...prev.articles, ...r],
          })),
        )
        .catch(() => {});

      // Images (background)
      withTimeout(fetchNasaImages(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, images: [...prev.images, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchMetMuseumImages(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, images: [...prev.images, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchLocImages(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, images: [...prev.images, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchEuropeanaImages(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, images: [...prev.images, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchOpenverseImages(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, images: [...prev.images, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchSmithsonianImages(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, images: [...prev.images, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchFlickrImages(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, images: [...prev.images, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchArtInstituteImages(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, images: [...prev.images, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchClevelandMuseumImages(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, images: [...prev.images, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchDplaImages(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, images: [...prev.images, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchRijksmuseumImages(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, images: [...prev.images, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchPixabayImages(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, images: [...prev.images, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchDeviantArtImages(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, images: [...prev.images, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchRedditImages(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, images: [...prev.images, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchImgurImages(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, images: [...prev.images, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchUnsplashImages(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, images: [...prev.images, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchPexelsImages(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, images: [...prev.images, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchWikimediaImages(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, images: [...prev.images, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchArchiveImagesExtra(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, images: [...prev.images, ...r] })),
        )
        .catch(() => {});

      // Videos (background)
      withTimeout(fetchInternetArchiveVideos(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchNasaVideos(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchPrelingerVideos(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchBritishPatheVideos(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchCSpanVideos(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchLocFilms(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchDplaVideos(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchEuropeanFilmGateway(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchWikimediaVideos(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchYouTubeArchivedVideos(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchVimeoCC(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchArchiveAnimation(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchArchiveEducation(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchArchiveNews(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchPbsVideos(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchNfbVideos(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchUcBerkeleyVideos(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchDemocracyNowVideos(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchClassicTvVideos(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchClassicCartoonsVideos(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchSciFiHorrorVideos(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchMitOcwVideos(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchTedTalksVideos(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchNewsPublicAffairsVideos(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchArchiveSportsVideos(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchArchiveGovernment(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchArchiveComputerChronicles(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchArchivePublicAffairs(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchArchiveHomeMovies(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchArchiveDocumentaries(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchArchiveSilentFilms(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchArchiveShortFilms(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchArchiveComedyFilms(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchArchiveWesternFilms(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchArchiveHorrorFilms(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchInternetArchiveAll(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchDailymotionVideos(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchFreeMovies(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchArchiveMystery(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchArchiveFilmNoir(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchArchiveNewsreels(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchArchiveInstructional(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchNFLFootage(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchMusicConcerts(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchOpenCulture(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchPeertubeVideos(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchOdyseeVideos(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, videos: [...prev.videos, ...r] })),
        )
        .catch(() => {});

      // Films (background)
      withTimeout(fetchArchiveFeatureFilms(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, films: [...prev.films, ...r] })),
        )
        .catch(() => {});
      withTimeout(fetchArchiveOpenSourceMovies(query), T)
        .then((r) =>
          setResults((prev) => ({ ...prev, films: [...prev.films, ...r] })),
        )
        .catch(() => {});

      // Audio (background)
      const seenAudioIds = new Set<string>();
      const appendAudio = (items: AudioResult[]) => {
        setResults((prev) => {
          const existing = new Set(prev.audio.map((a) => a.id));
          const newItems = items.filter(
            (a) => !existing.has(a.id) && !seenAudioIds.has(a.id),
          );
          for (const a of newItems) {
            seenAudioIds.add(a.id);
          }
          if (newItems.length === 0) return prev;
          return { ...prev, audio: [...prev.audio, ...newItems] };
        });
      };
      withTimeout(fetchAudioEtree(query), T)
        .then(appendAudio)
        .catch(() => {});
      withTimeout(fetchAudioLibriVox(query), T)
        .then(appendAudio)
        .catch(() => {});
      withTimeout(fetchAudioArchive(query), T)
        .then(appendAudio)
        .catch(() => {});
      withTimeout(fetchAudioOTR(query), T)
        .then(appendAudio)
        .catch(() => {});
      withTimeout(fetchAudio78rpm(query), T)
        .then(appendAudio)
        .catch(() => {});
      withTimeout(fetchAudioBroad(query), T)
        .then(appendAudio)
        .catch(() => {});
      withTimeout(fetchAudioMusic(query), T)
        .then(appendAudio)
        .catch(() => {});
      withTimeout(fetchAudioFolk(query), T)
        .then(appendAudio)
        .catch(() => {});
      withTimeout(fetchAudioPodcast(query), T)
        .then(appendAudio)
        .catch(() => {});
      withTimeout(fetchAudioRadio(query), T)
        .then(appendAudio)
        .catch(() => {});
      withTimeout(fetchAudioGeorge(query), T)
        .then(appendAudio)
        .catch(() => {});
      withTimeout(fetchAudioTech(query), T)
        .then(appendAudio)
        .catch(() => {});
      withTimeout(fetchAudioNews(query), T)
        .then(appendAudio)
        .catch(() => {});
      withTimeout(fetchAudioWorldMusic(query), T)
        .then(appendAudio)
        .catch(() => {});
      withTimeout(fetchCustomDomainAudio(query), T)
        .then(appendAudio)
        .catch(() => {});

      // Cache will be best-effort updated after 10s with whatever arrived
      setTimeout(() => {
        setResults((finalState) => {
          searchCache.set(cacheKey, { results: finalState, fuzzyUsed: false });
          return finalState;
        });
      }, 20000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setStatus("error");
    }
  }, []);

  const expandArticle = useCallback(
    async (articleOrId: WikiArticle | number) => {
      const pageid =
        typeof articleOrId === "number" ? articleOrId : articleOrId.pageid;
      const article = results.articles.find((a) => a.pageid === pageid);
      if (!article || article.source !== "Wikipedia") return;
      const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exlimit=1&titles=${encodeURIComponent(article.title)}&format=json&origin=*`;
      const res = await fetch(url);
      const data = await res.json();
      const pages = data?.query?.pages ?? {};
      const page = Object.values(pages)[0] as any;
      if (page?.extract) {
        setResults((prev) => ({
          ...prev,
          articles: prev.articles.map((a) =>
            a.pageid === pageid
              ? { ...a, fullSummary: page.extract, expanded: true }
              : a,
          ),
        }));
      }
    },
    [results.articles],
  );

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
