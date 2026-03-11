import type { WikiArticle } from "../types/research";

export async function fetchInternetArchiveArticles(
  query: string,
): Promise<WikiArticle[]> {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+mediatype:texts&fl[]=identifier,title,description,subject&rows=6&output=json`;
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

export async function fetchGutenbergArticles(
  query: string,
): Promise<WikiArticle[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=6&fields=key,title,author_name,first_sentence`;
  const res = await fetch(url);
  const data = await res.json();
  const docs = data?.docs ?? [];
  return docs.map((doc: any, idx: number) => ({
    pageid: 800000 + idx,
    title: doc.title ?? "Untitled",
    snippet:
      doc.first_sentence?.value ??
      (doc.author_name ? `By ${doc.author_name.join(", ")}` : ""),
    source: "Project Gutenberg",
  }));
}

export async function fetchPubMedArticles(
  query: string,
): Promise<WikiArticle[]> {
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
      return {
        pageid: 700000 + idx,
        title: item.title ?? "Untitled",
        snippet: item.authors?.length
          ? `Authors: ${item.authors.map((a: any) => a.name).join(", ")}`
          : (item.source ?? ""),
        source: "PubMed",
      };
    })
    .filter(Boolean) as WikiArticle[];
}

export async function fetchOpenLibraryArticles(
  query: string,
): Promise<WikiArticle[]> {
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

export async function fetchHathiTrustArticles(
  query: string,
): Promise<WikiArticle[]> {
  const url = `https://catalog.hathitrust.org/Search/json?lookfor=${encodeURIComponent(query)}&type=AllFields&limit=5`;
  const res = await fetch(url);
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

export async function fetchNsfArticles(query: string): Promise<WikiArticle[]> {
  const url = `https://api.nsf.gov/services/v1/awards.json?keyword=${encodeURIComponent(query)}&printFields=id,title,abstractText,piFirstName,piLastName&rpp=6`;
  const res = await fetch(url);
  const data = await res.json();
  const awards = data?.response?.award ?? [];
  return awards.map((award: any, idx: number) => ({
    pageid: 3100000 + idx,
    title: award.title ?? "NSF Award",
    snippet: award.abstractText
      ? award.abstractText.substring(0, 200)
      : award.piFirstName
        ? `PI: ${award.piFirstName} ${award.piLastName}`
        : "",
    source: "NSF",
  }));
}

export async function fetchNihArticles(query: string): Promise<WikiArticle[]> {
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

export async function fetchArxivArticles(
  query: string,
): Promise<WikiArticle[]> {
  const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=6`;
  const res = await fetch(url);
  const text = await res.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, "application/xml");
  const entries = Array.from(xml.querySelectorAll("entry"));
  return entries.map((entry, idx) => ({
    pageid: 4000000 + idx,
    title: entry.querySelector("title")?.textContent?.trim() ?? "arXiv Paper",
    snippet:
      entry.querySelector("summary")?.textContent?.trim().substring(0, 200) ??
      "",
    source: "arXiv",
  }));
}

export async function fetchCrossRefArticles(
  query: string,
): Promise<WikiArticle[]> {
  const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=6&select=DOI,title,abstract,author`;
  const res = await fetch(url);
  const data = await res.json();
  const items = data?.message?.items ?? [];
  return items.map((item: any, idx: number) => ({
    pageid: 4100000 + idx,
    title: Array.isArray(item.title)
      ? item.title[0]
      : (item.title ?? "CrossRef Article"),
    snippet: item.abstract
      ? item.abstract.substring(0, 200).replace(/<[^>]*>/g, "")
      : item.author?.[0]
        ? `${item.author[0].given ?? ""} ${item.author[0].family ?? ""}`.trim()
        : "",
    source: "CrossRef",
  }));
}

export async function fetchDoajArticles(query: string): Promise<WikiArticle[]> {
  const url = `https://doaj.org/api/search/articles/${encodeURIComponent(query)}?pageSize=6`;
  const res = await fetch(url);
  const data = await res.json();
  const results = data?.results ?? [];
  return results.map((item: any, idx: number) => ({
    pageid: 4200000 + idx,
    title: item.bibjson?.title ?? "DOAJ Article",
    snippet:
      item.bibjson?.abstract?.substring(0, 200) ??
      item.bibjson?.author?.[0]?.name ??
      "",
    source: "DOAJ",
  }));
}

export async function fetchArchiveAmericanLibraries(
  query: string,
): Promise<WikiArticle[]> {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+collection:americana+AND+mediatype:texts&fl[]=identifier,title,description,creator&rows=8&output=json`;
  const res = await fetch(url);
  const data = await res.json();
  return (data?.response?.docs ?? []).map((doc: any, idx: number) => ({
    pageid: 6000000 + idx,
    title: doc.title ?? doc.identifier ?? "American Libraries Text",
    snippet: doc.description ?? doc.creator ?? "",
    source: "American Libraries (Archive)",
  }));
}

export async function fetchArchiveBiodiversity(
  query: string,
): Promise<WikiArticle[]> {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+collection:biodiversity+AND+mediatype:texts&fl[]=identifier,title,description,creator&rows=6&output=json`;
  const res = await fetch(url);
  const data = await res.json();
  return (data?.response?.docs ?? []).map((doc: any, idx: number) => ({
    pageid: 6100000 + idx,
    title: doc.title ?? doc.identifier ?? "Biodiversity Heritage",
    snippet: doc.description ?? doc.creator ?? "",
    source: "Biodiversity Heritage Library",
  }));
}

export async function fetchArchiveFolkscanomy(
  query: string,
): Promise<WikiArticle[]> {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+collection:folkscanomy+AND+mediatype:texts&fl[]=identifier,title,description,creator&rows=6&output=json`;
  const res = await fetch(url);
  const data = await res.json();
  return (data?.response?.docs ?? []).map((doc: any, idx: number) => ({
    pageid: 6200000 + idx,
    title: doc.title ?? doc.identifier ?? "Folkscanomy Text",
    snippet: doc.description ?? doc.creator ?? "",
    source: "Folkscanomy",
  }));
}

export async function fetchArchiveUniversalLibrary(
  query: string,
): Promise<WikiArticle[]> {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+collection:universallibrary+AND+mediatype:texts&fl[]=identifier,title,description,creator&rows=6&output=json`;
  const res = await fetch(url);
  const data = await res.json();
  return (data?.response?.docs ?? []).map((doc: any, idx: number) => ({
    pageid: 6300000 + idx,
    title: doc.title ?? doc.identifier ?? "Universal Library Text",
    snippet: doc.description ?? doc.creator ?? "",
    source: "Universal Library",
  }));
}

export async function fetchArchiveOpenLibraryTexts(
  query: string,
): Promise<WikiArticle[]> {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+collection:openlibrary+AND+mediatype:texts&fl[]=identifier,title,description,creator&rows=6&output=json`;
  const res = await fetch(url);
  const data = await res.json();
  return (data?.response?.docs ?? []).map((doc: any, idx: number) => ({
    pageid: 6400000 + idx,
    title: doc.title ?? doc.identifier ?? "Open Library Text",
    snippet: doc.description ?? doc.creator ?? "",
    source: "Open Library Books",
  }));
}

export async function fetchArchiveTorontoTexts(
  query: string,
): Promise<WikiArticle[]> {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+collection:toronto+AND+mediatype:texts&fl[]=identifier,title,description,creator&rows=6&output=json`;
  const res = await fetch(url);
  const data = await res.json();
  return (data?.response?.docs ?? []).map((doc: any, idx: number) => ({
    pageid: 6500000 + idx,
    title: doc.title ?? doc.identifier ?? "Toronto Library Text",
    snippet: doc.description ?? doc.creator ?? "",
    source: "University of Toronto",
  }));
}

export async function fetchOpenAlexArticles(
  query: string,
): Promise<WikiArticle[]> {
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=6&select=id,title,abstract_inverted_index,authorships`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ResearchHub/1.0" },
  });
  const data = await res.json();
  const works = data?.results ?? [];
  return works.map((work: any, idx: number) => ({
    pageid: 7000000 + idx,
    title: work.title ?? "OpenAlex Work",
    snippet: work.authorships?.[0]?.author?.display_name
      ? `By ${work.authorships[0].author.display_name}`
      : "",
    source: "OpenAlex",
  }));
}

export async function fetchSemanticScholarArticles(
  query: string,
): Promise<WikiArticle[]> {
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=6&fields=title,abstract,authors`;
  const res = await fetch(url);
  const data = await res.json();
  const papers = data?.data ?? [];
  return papers.map((paper: any, idx: number) => ({
    pageid: 7100000 + idx,
    title: paper.title ?? "Semantic Scholar Paper",
    snippet: paper.abstract
      ? paper.abstract.substring(0, 200)
      : (paper.authors?.[0]?.name ?? ""),
    source: "Semantic Scholar",
  }));
}

export async function fetchEuropePMCArticles(
  query: string,
): Promise<WikiArticle[]> {
  const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(query)}&format=json&pageSize=6`;
  const res = await fetch(url);
  const data = await res.json();
  const results = data?.resultList?.result ?? [];
  return results.map((item: any, idx: number) => ({
    pageid: 7200000 + idx,
    title: item.title ?? "Europe PMC Article",
    snippet: item.abstractText
      ? item.abstractText.substring(0, 200)
      : (item.authorString ?? ""),
    source: "Europe PMC",
  }));
}
