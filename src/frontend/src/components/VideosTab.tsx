import { Skeleton } from "@/components/ui/skeleton";
import { Play, Video } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { WikiVideo } from "../types/research";

interface Props {
  videos: WikiVideo[];
  loading: boolean;
}

const SKELETON_IDS = ["sk-a", "sk-b", "sk-c", "sk-d", "sk-e", "sk-f"];

export function VideosTab({ videos, loading }: Props) {
  const [selected, setSelected] = useState<WikiVideo | null>(null);
  const activeVideo = selected ?? videos[0] ?? null;

  if (loading) {
    return (
      <div data-ocid="search.loading_state" className="space-y-4">
        <Skeleton className="w-full aspect-video rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SKELETON_IDS.map((id) => (
            <Skeleton key={id} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div
        data-ocid="videos.empty_state"
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <Video className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground text-lg font-display">
          No videos found
        </p>
        <p className="text-muted-foreground/60 text-sm mt-1">
          Try searching for a topic that might have video content
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activeVideo && (
        <motion.div
          data-ocid="videos.player"
          key={activeVideo.pageid}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden border border-border/60 bg-black"
        >
          {/* biome-ignore lint/a11y/useMediaCaption: public domain video source may not have captions */}
          <video
            key={activeVideo.url}
            controls
            className="w-full aspect-video"
            style={{ maxHeight: "500px" }}
          >
            <source src={activeVideo.url} type={activeVideo.mime} />
            Your browser does not support this video format.
          </video>
          <div className="p-4 bg-card">
            <h3 className="font-display font-semibold text-base text-foreground">
              {activeVideo.title}
            </h3>
            {activeVideo.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {activeVideo.description}
              </p>
            )}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {videos.map((video, idx) => (
          <motion.div
            key={video.pageid}
            data-ocid={`videos.item.${idx + 1}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`video-thumb bg-card border border-border/60 rounded-xl p-3 flex gap-3 items-start ${
              activeVideo?.pageid === video.pageid ? "active" : ""
            }`}
            onClick={() => setSelected(video)}
          >
            <div className="flex-shrink-0 w-14 h-10 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              {video.thumbUrl ? (
                <img
                  src={video.thumbUrl}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Play className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
                {video.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono uppercase">
                {video.mime.split("/")[1]}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
