import { EyeOff } from "lucide-react";
import { useState } from "react";
import { isSensitiveContent } from "../utils/sensitiveContent";

interface Props {
  children: React.ReactNode;
  label?: string;
}

export function SensitiveContentBlur({ children, label }: Props) {
  const [revealed, setRevealed] = useState(false);
  const sensitive = isSensitiveContent(label ?? "");

  if (!sensitive || revealed) {
    return <>{children}</>;
  }

  return (
    <div className="relative" style={{ isolation: "isolate" }}>
      {/* Blurred content underneath */}
      <div
        style={{
          filter: "blur(12px)",
          pointerEvents: "none",
          userSelect: "none",
        }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl"
        style={{
          background: "oklch(0.08 0.03 260 / 0.88)",
          backdropFilter: "blur(4px)",
          zIndex: 10,
        }}
      >
        <EyeOff className="w-5 h-5" style={{ color: "oklch(0.72 0.12 30)" }} />
        <p
          className="text-xs font-semibold text-center"
          style={{ color: "oklch(0.90 0.02 240)" }}
        >
          Sensitive Content
        </p>
        <p
          className="text-[10px] text-center px-3"
          style={{ color: "oklch(0.58 0.05 240)" }}
        >
          Are you sure you want to view this?
        </p>
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-1 px-3 py-1 rounded-lg text-xs font-medium transition-all"
          style={{
            background: "oklch(0.52 0.16 30 / 0.2)",
            border: "1px solid oklch(0.52 0.16 30 / 0.5)",
            color: "oklch(0.80 0.14 30)",
          }}
        >
          View Anyway
        </button>
      </div>
    </div>
  );
}
