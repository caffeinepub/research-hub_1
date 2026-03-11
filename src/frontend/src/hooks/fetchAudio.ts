import type { AudioResult } from "../types/research";

function archiveAudio(
  collection: string,
  source: string,
  prefix: string,
  rows = 50,
) {
  return async (query: string): Promise<AudioResult[]> => {
    try {
      const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+mediatype:audio+AND+collection:${collection}&output=json&rows=${rows}&fl[]=identifier,title,description,creator,year&sort[]=downloads+desc`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return (data?.response?.docs ?? []).map((doc: any, idx: number) => ({
        id: `${prefix}-${doc.identifier ?? idx}`,
        title: doc.title ?? doc.identifier ?? source,
        description: doc.description ?? "",
        creator: doc.creator ?? undefined,
        year: doc.year ? String(doc.year) : undefined,
        source,
        embedUrl: `https://archive.org/embed/${doc.identifier}`,
        downloadUrl: `https://archive.org/details/${doc.identifier}`,
      }));
    } catch {
      return [];
    }
  };
}

// Broad Archive.org audio search (no collection filter)
export async function fetchAudioBroad(query: string): Promise<AudioResult[]> {
  try {
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+mediatype:audio&output=json&rows=50&fl[]=identifier,title,description,creator,year,collection&sort[]=downloads+desc`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.response?.docs ?? []).map((doc: any, idx: number) => ({
      id: `archive-broad-${doc.identifier ?? idx}`,
      title: doc.title ?? doc.identifier ?? "Archive Audio",
      description: doc.description ?? "",
      creator: doc.creator ?? undefined,
      year: doc.year ? String(doc.year) : undefined,
      source: "Archive.org",
      embedUrl: `https://archive.org/embed/${doc.identifier}`,
      downloadUrl: `https://archive.org/details/${doc.identifier}`,
    }));
  } catch {
    return [];
  }
}

export const fetchAudioEtree = archiveAudio(
  "etree",
  "Live Concerts (etree)",
  "etree",
  50,
);
export const fetchAudioLibriVox = archiveAudio(
  "librivoxaudio",
  "LibriVox",
  "librivox",
  50,
);
export const fetchAudioArchive = archiveAudio(
  "audio_bookspoetry",
  "Archive Audio",
  "archiveaudio",
  50,
);
export const fetchAudioOTR = archiveAudio(
  "oldtimeradio",
  "Old Time Radio",
  "otr",
  50,
);
export const fetchAudio78rpm = archiveAudio(
  "78rpm",
  "78rpm Records",
  "78rpm",
  50,
);
export const fetchAudioMusic = archiveAudio(
  "audio_music",
  "Archive Music",
  "audiomusic",
  50,
);
export const fetchAudioFolk = archiveAudio(
  "audio_folk",
  "Folk Music",
  "folk",
  50,
);
export const fetchAudioPodcast = archiveAudio(
  "audio_podcast",
  "Podcasts",
  "podcast",
  50,
);
export const fetchAudioRadio = archiveAudio(
  "audio_radio",
  "Radio Broadcasts",
  "radio",
  50,
);
export const fetchAudioGeorge = archiveAudio(
  "georgeblood",
  "Vintage Recordings",
  "george",
  50,
);
export const fetchAudioTech = archiveAudio(
  "audio_tech",
  "Tech Talks",
  "tech",
  50,
);
export const fetchAudioNews = archiveAudio(
  "audio_news",
  "News & Public Affairs",
  "news",
  50,
);
export const fetchAudioWorldMusic = archiveAudio(
  "audio_foreign",
  "World Music",
  "world",
  50,
);
