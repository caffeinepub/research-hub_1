import type { AudioResult } from "../types/research";

function archiveAudio(collection: string, source: string, prefix: string) {
  return async (query: string): Promise<AudioResult[]> => {
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+mediatype:audio+AND+collection:${collection}&output=json&rows=8&fl[]=identifier,title,description,creator,year`;
    const res = await fetch(url);
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
  };
}

export const fetchAudioEtree = archiveAudio(
  "etree",
  "Live Concerts (etree)",
  "etree",
);
export const fetchAudioLibriVox = archiveAudio(
  "librivoxaudio",
  "LibriVox",
  "librivox",
);
export const fetchAudioArchive = archiveAudio(
  "audio_bookspoetry",
  "Archive Audio",
  "archiveaudio",
);
export const fetchAudioOTR = archiveAudio(
  "oldtimeradio",
  "Old Time Radio",
  "otr",
);
export const fetchAudio78rpm = archiveAudio("78rpm", "78rpm Records", "78rpm");
