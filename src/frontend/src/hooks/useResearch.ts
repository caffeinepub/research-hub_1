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
  fetchPixabayImages,
  fetchRedditImages,
  fetchRijksmuseumImages,
  fetchSmithsonianImages,
} from "./fetchImages";
import {
  fetchArchiveAnimation,
  fetchArchiveComputerChronicles,
  fetchArchiveEducation,
  fetchArchiveFeatureFilms,
  fetchArchiveGovernment,
  fetchArchiveHomeMovies,
  fetchArchiveNews,
  fetchArchiveOpenSourceMovies,
  fetchArchivePublicAffairs,
  fetchArchiveSportsVideos,
  fetchBritishPatheVideos,
  fetchCSpanVideos,
  fetchClassicCartoonsVideos,
  fetchClassicTvVideos,
  fetchDemocracyNowVideos,
  fetchDplaVideos,
  fetchEuropeanFilmGateway,
  fetchInternetArchiveVideos,
  fetchLocFilms,
  fetchMitOcwVideos,
  fetchNasaVideos,
  fetchNewsPublicAffairsVideos,
  fetchNfbVideos,
  fetchPbsVideos,
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

function broadenQuery(query: string): string {
  const words = query.trim().split(/\s+/);
  return words.length > 1 ? words[0] : query;
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

      const extra = <T>(r: PromiseSettledResult<T[]>): T[] =>
        r.status === "fulfilled" ? r.value : [];

      const [
        iaArticlesR,
        gutenbergR,
        pubmedR,
        nsfR,
        nihR,
        nasaImgR,
        metR,
        locImgR,
        europeanaR,
        iaVidR,
        nasaVidR,
        openverseR,
        smithsonianR,
        prelingerR,
        openLibR,
        hathiR,
        flickrR,
        patheR,
        cspanR,
        locFilmR,
        dplaVidR,
        efgR,
        wikiVidR,
        ytArchR,
        featFilmR,
        openSrcR,
        vimeoR,
        archAnimR,
        archEduR,
        archNewsR,
        arxivR,
        crossrefR,
        doajR,
        artInstR,
        clevelandR,
        dplaImgR,
        rijksR,
        pbsR,
        nfbR,
        ucbR,
        dnR,
        classTvR,
        classCartR,
        scifiR,
        mitR,
        tedR,
        newsAffR,
        amerLibR,
        bioR,
        folkR,
        univR,
        openLibTxtR,
        torontoR,
        sportsR,
        govR,
        compR,
        pubAffR,
        homeMovR,
        openAlexR,
        semSchR,
        europePmcR,
        pixabayR,
        etreeR,
        librivoxR,
        archAudioR,
        otrR,
        rpmlR,
        broadR,
        musicR,
        folkAudioR,
        podcastR,
        radioR,
        georgeR,
        techAudioR,
        newsAudioR,
        worldMusicR,
        deviantArtImgR,
        redditImgR,
        imgurImgR,
        customDomainAudioR,
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
        fetchArxivArticles(query),
        fetchCrossRefArticles(query),
        fetchDoajArticles(query),
        fetchArtInstituteImages(query),
        fetchClevelandMuseumImages(query),
        fetchDplaImages(query),
        fetchRijksmuseumImages(query),
        fetchPbsVideos(query),
        fetchNfbVideos(query),
        fetchUcBerkeleyVideos(query),
        fetchDemocracyNowVideos(query),
        fetchClassicTvVideos(query),
        fetchClassicCartoonsVideos(query),
        fetchSciFiHorrorVideos(query),
        fetchMitOcwVideos(query),
        fetchTedTalksVideos(query),
        fetchNewsPublicAffairsVideos(query),
        fetchArchiveAmericanLibraries(query),
        fetchArchiveBiodiversity(query),
        fetchArchiveFolkscanomy(query),
        fetchArchiveUniversalLibrary(query),
        fetchArchiveOpenLibraryTexts(query),
        fetchArchiveTorontoTexts(query),
        fetchArchiveSportsVideos(query),
        fetchArchiveGovernment(query),
        fetchArchiveComputerChronicles(query),
        fetchArchivePublicAffairs(query),
        fetchArchiveHomeMovies(query),
        fetchOpenAlexArticles(query),
        fetchSemanticScholarArticles(query),
        fetchEuropePMCArticles(query),
        fetchPixabayImages(query),
        fetchAudioEtree(query),
        fetchAudioLibriVox(query),
        fetchAudioArchive(query),
        fetchAudioOTR(query),
        fetchAudio78rpm(query),
        fetchAudioBroad(query),
        fetchAudioMusic(query),
        fetchAudioFolk(query),
        fetchAudioPodcast(query),
        fetchAudioRadio(query),
        fetchAudioGeorge(query),
        fetchAudioTech(query),
        fetchAudioNews(query),
        fetchAudioWorldMusic(query),
        fetchDeviantArtImages(query),
        fetchRedditImages(query),
        fetchImgurImages(query),
        fetchCustomDomainAudio(query),
      ]);

      let articles: WikiArticle[] = [
        ...wikiArticles,
        ...extra(iaArticlesR),
        ...extra(gutenbergR),
        ...extra(pubmedR),
        ...extra(nsfR),
        ...extra(nihR),
        ...extra(openLibR),
        ...extra(hathiR),
        ...extra(arxivR),
        ...extra(crossrefR),
        ...extra(doajR),
        ...extra(amerLibR),
        ...extra(bioR),
        ...extra(folkR),
        ...extra(univR),
        ...extra(openLibTxtR),
        ...extra(torontoR),
        ...extra(openAlexR),
        ...extra(semSchR),
        ...extra(europePmcR),
      ];

      let images: WikiImage[] = [
        ...wikiImages,
        ...extra(nasaImgR),
        ...extra(metR),
        ...extra(locImgR),
        ...extra(europeanaR),
        ...extra(openverseR),
        ...extra(smithsonianR),
        ...extra(flickrR),
        ...extra(artInstR),
        ...extra(clevelandR),
        ...extra(dplaImgR),
        ...extra(rijksR),
        ...extra(pixabayR),
        ...extra(deviantArtImgR),
        ...extra(redditImgR),
        ...extra(imgurImgR),
      ];

      let videos: WikiVideo[] = [
        ...wikiVideos,
        ...extra(iaVidR),
        ...extra(nasaVidR),
        ...extra(prelingerR),
        ...extra(patheR),
        ...extra(cspanR),
        ...extra(locFilmR),
        ...extra(dplaVidR),
        ...extra(efgR),
        ...extra(wikiVidR),
        ...extra(ytArchR),
        ...extra(vimeoR),
        ...extra(archAnimR),
        ...extra(archEduR),
        ...extra(archNewsR),
        ...extra(pbsR),
        ...extra(ucbR),
        ...extra(dnR),
        ...extra(classTvR),
        ...extra(mitR),
        ...extra(tedR),
        ...extra(newsAffR),
        ...extra(sportsR),
        ...extra(govR),
        ...extra(compR),
        ...extra(pubAffR),
        ...extra(homeMovR),
      ];

      let films: WikiVideo[] = [
        ...ytPublicDomainFilms,
        ...extra(featFilmR),
        ...extra(openSrcR),
        ...extra(prelingerR),
        ...extra(patheR),
        ...extra(efgR),
        ...extra(wikiVidR).filter((v) => v.mime.startsWith("video")),
        ...extra(nfbR),
        ...extra(classCartR),
        ...extra(scifiR),
      ];

      const allAudio: AudioResult[] = [
        ...extra(etreeR),
        ...extra(librivoxR),
        ...extra(archAudioR),
        ...extra(otrR),
        ...extra(rpmlR),
        ...extra(broadR),
        ...extra(musicR),
        ...extra(folkAudioR),
        ...extra(podcastR),
        ...extra(radioR),
        ...extra(georgeR),
        ...extra(techAudioR),
        ...extra(newsAudioR),
        ...extra(worldMusicR),
        ...extra(customDomainAudioR),
      ];
      const seenAudioIds = new Set<string>();
      const audio: AudioResult[] = allAudio.filter((a) => {
        if (seenAudioIds.has(a.id)) return false;
        seenAudioIds.add(a.id);
        return true;
      });

      // Fuzzy fallback
      const needsFuzzyImages = images.length < 3;
      const needsFuzzyVideos = videos.length < 3;
      let fuzzyActivated = false;

      if (needsFuzzyImages || needsFuzzyVideos) {
        const broadQ = broadenQuery(query);
        if (broadQ !== query) {
          const fuzzyFetches: Promise<any>[] = [];
          if (needsFuzzyImages)
            fuzzyFetches.push(
              fetchOpenverseImages(broadQ),
              fetchFlickrImages(broadQ),
              fetchNasaImages(broadQ),
            );
          if (needsFuzzyVideos)
            fuzzyFetches.push(
              fetchInternetArchiveVideos(broadQ),
              fetchBritishPatheVideos(broadQ),
              fetchPrelingerVideos(broadQ),
            );
          const fuzzyResults = await Promise.allSettled(fuzzyFetches);
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

      const finalResults: SearchResults = {
        articles,
        images,
        videos,
        films,
        audio,
      };
      searchCache.set(cacheKey, {
        results: finalResults,
        fuzzyUsed: fuzzyActivated,
      });
      setResults(finalResults);
      setStatus("success");
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
