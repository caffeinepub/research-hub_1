import type { WikiImage } from "../types/research";

export async function fetchNasaImages(query: string): Promise<WikiImage[]> {
  try {
    const url = `https://images.nasa.gov/api/v1/search?q=${encodeURIComponent(query)}&media_type=image&page_size=20`;
    const res = await fetch(url);
    if (!res.ok) return [];
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
  } catch {
    return [];
  }
}

export async function fetchMetMuseumImages(
  query: string,
): Promise<WikiImage[]> {
  try {
    const searchRes = await fetch(
      `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(query)}&hasImages=true`,
    );
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const ids: number[] = (searchData?.objectIDs ?? []).slice(0, 12);
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
          url: obj.primaryImage || obj.primaryImageSmall,
          thumbUrl: obj.primaryImageSmall,
          description: obj.creditLine ?? "",
          author: obj.artistDisplayName || undefined,
          source: "Met Museum",
        };
      })
      .filter(Boolean) as WikiImage[];
  } catch {
    return [];
  }
}

export async function fetchLocImages(query: string): Promise<WikiImage[]> {
  try {
    const url = `https://www.loc.gov/photos/?q=${encodeURIComponent(query)}&fo=json&c=20`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.results ?? [])
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
  } catch {
    return [];
  }
}

export async function fetchEuropeanaImages(
  query: string,
): Promise<WikiImage[]> {
  try {
    const url = `https://api.europeana.eu/record/v2/search.json?wskey=api2demo&query=${encodeURIComponent(query)}&qf=TYPE:IMAGE&rows=50&profile=rich`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.items ?? [])
      .filter((item: any) => item.edmPreview?.[0])
      .map((item: any, idx: number) => ({
        pageid: 300000 + idx,
        title: Array.isArray(item.title)
          ? item.title[0]
          : (item.title ?? "Europeana Item"),
        url: item.edmPreview[0],
        thumbUrl: item.edmPreview[0],
        description: Array.isArray(item.dcDescription)
          ? item.dcDescription[0]
          : "",
        license: item.rights?.[0] ?? undefined,
        source: "Europeana",
      }));
  } catch {
    return [];
  }
}

export async function fetchOpenverseImages(
  query: string,
): Promise<WikiImage[]> {
  try {
    const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license_type=commercial,modification&page_size=20`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.results ?? []).map((item: any, idx: number) => ({
      pageid: 1100000 + idx,
      title: item.title ?? "Public Domain Image",
      url: item.url,
      thumbUrl: item.thumbnail ?? item.url,
      description: item.description ?? "",
      author: item.creator ?? undefined,
      license: item.license ?? undefined,
      source: "Openverse",
    }));
  } catch {
    return [];
  }
}

export async function fetchSmithsonianImages(
  query: string,
): Promise<WikiImage[]> {
  try {
    const url = `https://api.si.edu/openaccess/api/v1.0/search?q=${encodeURIComponent(query)}&rows=30`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.response?.rows ?? [])
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
  } catch {
    return [];
  }
}

export async function fetchFlickrImages(query: string): Promise<WikiImage[]> {
  try {
    const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&source=flickr&page_size=20`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    const data = await res.json();
    const results = data?.results ?? [];
    return results.map((item: any, idx: number) => ({
      pageid: 1700000 + idx,
      title: item.title ?? "Flickr Photo",
      url: item.url ?? item.foreign_landing_url,
      thumbUrl: item.thumbnail ?? item.url,
      description: item.description ?? "",
      author: item.creator ?? undefined,
      license: item.license ?? undefined,
      source: "Flickr Commons",
    }));
  } catch {
    return [];
  }
}

export async function fetchArtInstituteImages(
  query: string,
): Promise<WikiImage[]> {
  try {
    const url = `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(query)}&limit=30&fields=id,title,image_id,artist_display`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data ?? [])
      .filter((item: any) => item.image_id)
      .map((item: any, idx: number) => ({
        pageid: 4300000 + idx,
        title: item.title ?? "Artwork",
        url: `https://www.artic.edu/iiif/2/${item.image_id}/full/843,/0/default.jpg`,
        thumbUrl: `https://www.artic.edu/iiif/2/${item.image_id}/full/400,/0/default.jpg`,
        description: item.artist_display ?? "",
        source: "Art Institute of Chicago",
      }));
  } catch {
    return [];
  }
}

export async function fetchClevelandMuseumImages(
  query: string,
): Promise<WikiImage[]> {
  try {
    const url = `https://openaccess-api.clevelandart.org/api/artworks?q=${encodeURIComponent(query)}&has_image=1&limit=30`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data ?? [])
      .filter((item: any) => item.images?.web?.url)
      .map((item: any, idx: number) => ({
        pageid: 4400000 + idx,
        title: item.title ?? "Artwork",
        url: item.images.web.url,
        thumbUrl: item.images.web.url,
        description: item.creators?.[0]?.description ?? "",
        source: "Cleveland Museum",
      }));
  } catch {
    return [];
  }
}

// Archive.org image search with proper URLSearchParams
export async function fetchArchiveImages(query: string): Promise<WikiImage[]> {
  try {
    const params = new URLSearchParams({
      q: `${query} AND mediatype:image`,
      output: "json",
      rows: "50",
    });
    params.append("fl[]", "identifier");
    params.append("fl[]", "title");
    params.append("fl[]", "description");
    params.append("sort[]", "downloads desc");
    const url = `https://archive.org/advancedsearch.php?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.response?.docs ?? [])
      .filter((doc: any) => doc.identifier)
      .map((doc: any, idx: number) => {
        const id = doc.identifier;
        const thumb = `https://archive.org/services/img/${id}`;
        return {
          pageid: 4500000 + idx,
          title: doc.title ?? "Archive.org Image",
          url: thumb,
          thumbUrl: thumb,
          description: Array.isArray(doc.description)
            ? doc.description[0]
            : (doc.description ?? ""),
          source: "Internet Archive",
        };
      });
  } catch {
    return [];
  }
}

export async function fetchRijksmuseumImages(
  query: string,
): Promise<WikiImage[]> {
  try {
    const url = `https://www.rijksmuseum.nl/api/en/collection?key=0fiuZFh4&q=${encodeURIComponent(query)}&imgonly=true&ps=12&s=relevance`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.artObjects ?? [])
      .filter((item: any) => item.webImage?.url)
      .map((item: any, idx: number) => ({
        pageid: 4600000 + idx,
        title: item.title ?? "Rijksmuseum Artwork",
        url: item.webImage.url,
        thumbUrl: item.headerImage?.url ?? item.webImage.url,
        description: item.principalOrFirstMaker ?? "",
        source: "Rijksmuseum",
      }));
  } catch {
    return [];
  }
}

export async function fetchPixabayImages(query: string): Promise<WikiImage[]> {
  try {
    const url = `https://pixabay.com/api/?key=44889585-a6a1c2d9fea81e4c3a92c80a8&q=${encodeURIComponent(query)}&image_type=photo&per_page=50&safesearch=true`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.hits ?? []).map((item: any, idx: number) => ({
      pageid: 8000000 + idx,
      title: item.tags ?? "Pixabay Image",
      url: item.webformatURL,
      thumbUrl: item.previewURL,
      description: `By ${item.user}`,
      source: "Pixabay",
    }));
  } catch {
    return [];
  }
}

// Alias for backward compatibility
export const fetchDplaImages = fetchArchiveImages;

export async function fetchDeviantArtImages(
  query: string,
): Promise<WikiImage[]> {
  try {
    // Try Openverse with unstable deviantart source param
    const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license_type=commercial,modification&page_size=20&unstable__source=deviantart`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.ok) {
      const data = await res.json();
      const results = data?.results ?? [];
      if (results.length > 0) {
        return results.map((item: any, idx: number) => ({
          pageid: 9000000 + idx,
          title: item.title ?? "DeviantArt Image",
          url: item.url,
          thumbUrl: item.thumbnail ?? item.url,
          description: item.attribution ?? "",
          author: item.creator ?? undefined,
          source: "DeviantArt",
        }));
      }
    }
    // Fallback: Wikimedia Commons artwork search
    const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}+artwork&prop=imageinfo&iiprop=url|mime&format=json&origin=*&gsrlimit=20`;
    const wikiRes = await fetch(wikiUrl);
    if (!wikiRes.ok) return [];
    const wikiData = await wikiRes.json();
    const pages = wikiData?.query?.pages
      ? Object.values(wikiData.query.pages)
      : [];
    return (pages as any[])
      .filter(
        (p: any) =>
          p.imageinfo?.[0]?.url &&
          /\.(jpg|jpeg|png|gif|webp)$/i.test(p.imageinfo[0].url),
      )
      .map((p: any, idx: number) => ({
        pageid: 9000000 + idx,
        title: (p.title ?? "Artwork").replace(/^File:/, ""),
        url: p.imageinfo[0].url,
        thumbUrl: p.imageinfo[0].url,
        description: "",
        source: "DeviantArt",
      }));
  } catch {
    return [];
  }
}

export async function fetchRedditImages(query: string): Promise<WikiImage[]> {
  try {
    const subreddits = [
      "pics",
      "EarthPorn",
      "Art",
      "itookapicture",
      "photographs",
    ];
    const results: WikiImage[] = [];
    const responses = await Promise.allSettled(
      subreddits.map((sub) =>
        fetch(
          `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&limit=10&sort=relevance&t=all`,
          { headers: { Accept: "application/json" } },
        ).then((r) => r.json()),
      ),
    );
    responses.forEach((res, subIdx) => {
      if (res.status !== "fulfilled") return;
      const posts = res.value?.data?.children ?? [];
      posts.forEach((p: any, idx: number) => {
        const d = p.data;
        const imgUrl = d.url_overridden_by_dest || d.url;
        if (!imgUrl || !/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(imgUrl)) return;
        const thumb =
          d.thumbnail &&
          d.thumbnail !== "self" &&
          d.thumbnail !== "default" &&
          d.thumbnail !== "nsfw"
            ? d.thumbnail
            : imgUrl;
        results.push({
          pageid: 7000000 + subIdx * 1000 + idx,
          title: d.title || "Reddit Image",
          url: imgUrl,
          thumbUrl: thumb,
          description: `r/${d.subreddit}`,
          source: "Reddit",
        });
      });
    });
    return results;
  } catch {
    return [];
  }
}

export async function fetchImgurImages(query: string): Promise<WikiImage[]> {
  try {
    const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&source=flickr&page_size=20&license_type=cc0,pdm`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.results ?? []).map((item: any, idx: number) => ({
      pageid: 7500000 + idx,
      title: item.title ?? "Image",
      url: item.url,
      thumbUrl: item.thumbnail ?? item.url,
      description: item.description ?? "",
      source: "Imgur",
    }));
  } catch {
    return [];
  }
}
