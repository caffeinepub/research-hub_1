import type { WikiImage } from "../types/research";

export async function fetchNasaImages(query: string): Promise<WikiImage[]> {
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

export async function fetchMetMuseumImages(
  query: string,
): Promise<WikiImage[]> {
  const searchRes = await fetch(
    `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(query)}&hasImages=true`,
  );
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

export async function fetchLocImages(query: string): Promise<WikiImage[]> {
  const url = `https://www.loc.gov/photos/?q=${encodeURIComponent(query)}&fo=json&c=12`;
  const res = await fetch(url);
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
}

export async function fetchEuropeanaImages(
  query: string,
): Promise<WikiImage[]> {
  const url = `https://api.europeana.eu/record/v2/search.json?wskey=api2demo&query=${encodeURIComponent(query)}&qf=TYPE:IMAGE&rows=12`;
  const res = await fetch(url);
  const data = await res.json();
  return (data?.items ?? [])
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

export async function fetchOpenverseImages(
  query: string,
): Promise<WikiImage[]> {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license=cc0,pdm&page_size=12`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
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
}

export async function fetchSmithsonianImages(
  query: string,
): Promise<WikiImage[]> {
  const url = `https://api.si.edu/openaccess/api/v1.0/search?q=${encodeURIComponent(query)}&api_key=OPENACCESS&rows=8`;
  const res = await fetch(url);
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
}

export async function fetchFlickrImages(query: string): Promise<WikiImage[]> {
  try {
    const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&source=flickr&page_size=12`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.ok) {
      const data = await res.json();
      const results = data?.results ?? [];
      if (results.length > 0) {
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
      }
    }
  } catch (_) {
    /* fall through */
  }
  return [];
}

export async function fetchArtInstituteImages(
  query: string,
): Promise<WikiImage[]> {
  const url = `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(query)}&limit=8&fields=id,title,image_id,artist_display`;
  const res = await fetch(url);
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
}

export async function fetchClevelandMuseumImages(
  query: string,
): Promise<WikiImage[]> {
  const url = `https://openaccess-api.clevelandart.org/api/artworks?q=${encodeURIComponent(query)}&has_image=1&limit=8`;
  const res = await fetch(url);
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
}

export async function fetchDplaImages(query: string): Promise<WikiImage[]> {
  const url = `https://api.dp.la/v2/items?q=${encodeURIComponent(query)}&sourceResource.type=image&page_size=8`;
  const res = await fetch(url);
  const data = await res.json();
  return (data?.docs ?? [])
    .filter((doc: any) => doc.object)
    .map((doc: any, idx: number) => ({
      pageid: 4500000 + idx,
      title: doc.sourceResource?.title?.[0] ?? "DPLA Image",
      url: doc.object,
      thumbUrl: doc.object,
      description: doc.sourceResource?.description?.[0] ?? "",
      source: "DPLA",
    }));
}

export async function fetchRijksmuseumImages(
  query: string,
): Promise<WikiImage[]> {
  const url = `https://www.rijksmuseum.nl/api/en/collection?key=0fiuZFh4&q=${encodeURIComponent(query)}&imgonly=true&ps=8&s=relevance`;
  const res = await fetch(url);
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
}

export async function fetchPixabayImages(query: string): Promise<WikiImage[]> {
  const url = `https://pixabay.com/api/?key=44889585-a6a1c2d9fea81e4c3a92c80a8&q=${encodeURIComponent(query)}&image_type=photo&per_page=12&safesearch=true`;
  const res = await fetch(url);
  const data = await res.json();
  return (data?.hits ?? []).map((item: any, idx: number) => ({
    pageid: 8000000 + idx,
    title: item.tags ?? "Pixabay Image",
    url: item.webformatURL,
    thumbUrl: item.previewURL,
    description: `By ${item.user}`,
    source: "Pixabay",
  }));
}
