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

// Replaced DPLA (requires paid API key) with Archive.org image search
export async function fetchArchiveImages(query: string): Promise<WikiImage[]> {
  try {
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+mediatype:image&fl[]=identifier,title,description&output=json&rows=50&sort[]=downloads+desc`;
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
    const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&source=deviantart&page_size=20`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.results ?? [])
      .filter((item: any) => item.url)
      .map((item: any, idx: number) => ({
        pageid: 9000000 + idx,
        title: item.title ?? "DeviantArt Image",
        url: item.url,
        thumbUrl: item.thumbnail ?? item.url,
        description: item.attribution ?? "",
        author: item.creator ?? undefined,
        source: "DeviantArt",
      }));
  } catch {
    return [];
  }
}

export async function fetchRedditImages(query: string): Promise<WikiImage[]> {
  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&type=link&limit=25&restrict_sr=false`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ResearchHub/1.0" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const posts = data?.data?.children ?? [];
    const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
    return posts
      .filter((p: any) => {
        const hint = p.data?.post_hint;
        const purl = p.data?.url ?? "";
        return hint === "image" || IMAGE_EXT.test(purl);
      })
      .map((p: any, idx: number) => {
        const d = p.data;
        const imgUrl = d.url ?? "";
        const thumb =
          d.thumbnail && d.thumbnail !== "self" && d.thumbnail !== "default"
            ? d.thumbnail
            : imgUrl;
        return {
          pageid: 11000000 + idx,
          title: d.title ?? "Reddit Image",
          url: imgUrl,
          thumbUrl: thumb,
          description: d.subreddit_name_prefixed ?? "",
          source: "Reddit",
        };
      });
  } catch {
    return [];
  }
}
