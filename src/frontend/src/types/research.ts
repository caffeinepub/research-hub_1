export interface WikiArticle {
  pageid: number;
  title: string;
  snippet: string;
  source: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  summary?: string;
  description?: string;
  fullSummary?: string;
  expanded?: boolean;
}

export interface WikiImage {
  pageid: number;
  title: string;
  url: string;
  thumbUrl: string;
  source: string;
  description?: string;
  author?: string;
  license?: string;
}

export interface WikiVideo {
  pageid: number;
  title: string;
  url: string;
  mime: string;
  source: string;
  thumbUrl?: string;
  description?: string;
  embedUrl?: string;
}

export interface AudioResult {
  id: string;
  title: string;
  description?: string;
  creator?: string;
  source: string;
  embedUrl: string;
  downloadUrl: string;
  year?: string;
}

export interface SearchResults {
  articles: WikiArticle[];
  images: WikiImage[];
  videos: WikiVideo[];
  films: WikiVideo[];
  audio: AudioResult[];
}

export type SearchStatus = "idle" | "loading" | "success" | "error";
