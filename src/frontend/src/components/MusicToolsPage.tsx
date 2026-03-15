import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileMusic,
  Guitar,
  Loader2,
  Music,
  Music2,
  Play,
  Search,
  Square,
  Timer,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────

interface ChordDiagram {
  name: string;
  frets: number[]; // -1 = muted, 0 = open, 1-5 = fret number
  fingers: number[]; // finger numbers 0-4
  startFret?: number;
  barre?: { fret: number; fromString: number; toString: number };
}

interface SheetResult {
  title: string;
  composer: string;
  url: string;
  source: "IMSLP" | "MuseScore";
}

interface VideoResult {
  id: string;
  title: string;
  identifier: string;
}

// ─── Data ────────────────────────────────────────────────────────────────

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const NOTE_FREQUENCIES_C4: Record<string, number> = {
  C: 261.63,
  "C#": 277.18,
  D: 293.66,
  "D#": 311.13,
  E: 329.63,
  F: 349.23,
  "F#": 369.99,
  G: 392.0,
  "G#": 415.3,
  A: 440.0,
  "A#": 466.16,
  B: 493.88,
};

const INSTRUMENTS = {
  Guitar: { strings: ["E2", "A2", "D3", "G3", "B3", "E4"], tuning: "Standard" },
  Ukulele: { strings: ["G4", "C4", "E4", "A4"], tuning: "Standard" },
  Bass: { strings: ["E1", "A1", "D2", "G2"], tuning: "Standard" },
};

const STRING_FREQUENCIES: Record<string, number> = {
  E1: 41.2,
  A1: 55.0,
  D2: 73.42,
  G2: 98.0,
  E2: 82.41,
  A2: 110.0,
  D3: 146.83,
  G3: 196.0,
  B3: 246.94,
  E4: 329.63,
  G4: 392.0,
  C4: 261.63,
  A4: 440.0,
};

const GUITAR_CHORDS: ChordDiagram[] = [
  { name: "C", frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  { name: "D", frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  { name: "E", frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  { name: "Em", frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  {
    name: "F",
    frets: [1, 1, 2, 3, 3, 1],
    fingers: [1, 1, 2, 4, 3, 1],
    barre: { fret: 1, fromString: 0, toString: 5 },
  },
  { name: "G", frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  { name: "A", frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  { name: "Am", frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  { name: "Dm", frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  { name: "G7", frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  { name: "C7", frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  { name: "D7", frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  { name: "E7", frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  { name: "A7", frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
  { name: "Cmaj7", frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
  { name: "Gmaj7", frets: [3, 2, 0, 0, 0, 2], fingers: [3, 2, 0, 0, 0, 1] },
  { name: "Dmaj7", frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 2, 3] },
  { name: "Fmaj7", frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0] },
  {
    name: "Bm",
    frets: [-1, 2, 4, 4, 3, 2],
    fingers: [0, 1, 3, 4, 2, 1],
    barre: { fret: 2, fromString: 1, toString: 5 },
  },
  {
    name: "F#m",
    frets: [2, 4, 4, 2, 2, 2],
    fingers: [1, 3, 4, 1, 1, 1],
    barre: { fret: 2, fromString: 0, toString: 5 },
  },
];

// ─── Pitch Detection ─────────────────────────────────────────────────────

function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  const rms = Math.sqrt(buf.reduce((s, v) => s + v * v, 0) / SIZE);
  if (rms < 0.01) return -1;
  let r1 = 0;
  let r2 = SIZE - 1;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < 0.2) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < 0.2) {
      r2 = SIZE - i;
      break;
    }
  }
  const slice = buf.slice(r1, r2);
  const len = slice.length;
  const c = new Array(len).fill(0);
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < len - i; j++) {
      c[i] = c[i] + slice[j] * slice[j + i];
    }
  }
  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < len; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  let T0 = maxpos;
  const x1 = c[T0 - 1];
  const x2 = c[T0];
  const x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b2 = (x3 - x1) / 2;
  if (a) T0 = T0 - b2 / (2 * a);
  return sampleRate / T0;
}

function freqToNote(freq: number): {
  note: string;
  octave: number;
  cents: number;
} {
  const noteNum = 12 * (Math.log(freq / 440) / Math.log(2));
  const noteIdx = Math.round(noteNum) % 12;
  const adjustedIdx = ((noteIdx % 12) + 12) % 12;
  const note = NOTES[adjustedIdx];
  const octave = Math.floor((Math.round(noteNum) + 57) / 12);
  const cents = (noteNum - Math.round(noteNum)) * 100;
  return { note, octave, cents };
}

// ─── Chord SVG ────────────────────────────────────────────────────────────

function ChordSVG({ chord }: { chord: ChordDiagram }) {
  const W = 120;
  const H = 140;
  const pad = 20;
  const strWidth = (W - pad * 2) / 5;
  const fretHeight = 20;
  const numFrets = 5;
  const startFret = chord.startFret || 1;
  const fingerColors = ["#00b4d8", "#0096c7", "#0077b6", "#023e8a", "#00b4d8"];

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${chord.name} chord diagram`}
    >
      <title>{`${chord.name} chord diagram`}</title>
      {/* Nut */}
      {startFret === 1 && (
        <rect
          x={pad}
          y={pad - 4}
          width={W - pad * 2}
          height={4}
          fill="#ffffff"
          rx={1}
        />
      )}
      {/* Strings */}
      {[0, 1, 2, 3, 4, 5].map((s) => (
        <line
          key={s}
          x1={pad + s * strWidth}
          y1={pad}
          x2={pad + s * strWidth}
          y2={pad + fretHeight * numFrets}
          stroke="#334155"
          strokeWidth={1}
        />
      ))}
      {/* Frets */}
      {[0, 1, 2, 3, 4, 5].map((f) => (
        <line
          key={f}
          x1={pad}
          y1={pad + f * fretHeight}
          x2={W - pad}
          y2={pad + f * fretHeight}
          stroke="#334155"
          strokeWidth={f === 0 ? 2 : 1}
        />
      ))}
      {/* Barre */}
      {chord.barre && (
        <rect
          x={pad + chord.barre.fromString * strWidth - 6}
          y={pad + (chord.barre.fret - startFret) * fretHeight + 4}
          width={
            chord.barre.toString * strWidth -
            chord.barre.fromString * strWidth +
            12
          }
          height={12}
          rx={6}
          fill={fingerColors[0]}
          opacity={0.85}
        />
      )}
      {/* Finger dots */}
      {chord.frets.map((fret, s) => {
        if (fret === -1) {
          return (
            <text
              key={`muted-string-${s}-${chord.name}`}
              x={pad + s * strWidth}
              y={pad - 8}
              textAnchor="middle"
              fill="#ef4444"
              fontSize={10}
            >
              ×
            </text>
          );
        }
        if (fret === 0) {
          return (
            <circle
              key={`open-string-${s}-${chord.name}`}
              cx={pad + s * strWidth}
              cy={pad - 8}
              r={4}
              fill="none"
              stroke="#94a3b8"
              strokeWidth={1.5}
            />
          );
        }
        const cy = pad + (fret - startFret) * fretHeight + fretHeight / 2;
        return (
          <circle
            key={`fret-${fret}-string-${s}-${chord.name}`}
            cx={pad + s * strWidth}
            cy={cy}
            r={6}
            fill={
              chord.fingers[s]
                ? fingerColors[(chord.fingers[s] - 1) % 5]
                : "#00b4d8"
            }
          />
        );
      })}
      {/* Start fret label */}
      {startFret > 1 && (
        <text
          x={W - 10}
          y={pad + fretHeight / 2 + 4}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize={9}
        >
          {startFret}fr
        </text>
      )}
    </svg>
  );
}

// ─── Piano Keyboard ───────────────────────────────────────────────────────

function PianoKeys({ highlightNote }: { highlightNote?: string }) {
  const whites = ["C", "D", "E", "F", "G", "A", "B"];
  const blacks = [
    { note: "C#", pos: 0.6 },
    { note: "D#", pos: 1.6 },
    { note: "F#", pos: 3.6 },
    { note: "G#", pos: 4.6 },
    { note: "A#", pos: 5.6 },
  ];
  const kw = 28;
  const kh = 80;
  const W = kw * 7;

  return (
    <svg
      width={W}
      height={kh}
      viewBox={`0 0 ${W} ${kh}`}
      className="mx-auto"
      role="img"
      aria-label="Piano keyboard"
    >
      <title>Piano keyboard</title>
      {whites.map((n, i) => (
        <rect
          key={n}
          x={i * kw}
          y={0}
          width={kw - 1}
          height={kh}
          rx={3}
          fill={n === highlightNote ? "#00b4d8" : "#e2e8f0"}
          stroke="#334155"
          strokeWidth={1}
        />
      ))}
      {blacks.map(({ note, pos }) => (
        <rect
          key={note}
          x={pos * kw - 1}
          y={0}
          width={kw * 0.55}
          height={kh * 0.6}
          rx={2}
          fill={note === highlightNote ? "#00b4d8" : "#1e293b"}
        />
      ))}
    </svg>
  );
}

// ─── Tuner Tab ────────────────────────────────────────────────────────────

function TunerTab() {
  const [instrument, setInstrument] =
    useState<keyof typeof INSTRUMENTS>("Guitar");
  const [active, setActive] = useState(false);
  const [detectedNote, setDetectedNote] = useState<{
    note: string;
    octave: number;
    cents: number;
  } | null>(null);
  const [targetString, setTargetString] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopTuner = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop();
    }
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    setActive(false);
    setDetectedNote(null);
  }, []);

  const startTuner = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      setActive(true);

      const buf = new Float32Array(analyser.fftSize);
      const tick = () => {
        analyser.getFloatTimeDomainData(buf);
        const freq = autoCorrelate(buf, ctx.sampleRate);
        if (freq > 40 && freq < 2000) {
          setDetectedNote(freqToNote(freq));
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      alert(
        "Microphone access required for the tuner. Please allow microphone access.",
      );
    }
  }, []);

  useEffect(() => () => stopTuner(), [stopTuner]);

  const strings = INSTRUMENTS[instrument].strings;
  const cents = detectedNote?.cents ?? 0;
  const needleAngle = Math.max(-45, Math.min(45, cents * 0.9));
  const inTune = Math.abs(cents) < 5;

  return (
    <div className="flex flex-col items-center gap-6 py-4 max-w-md mx-auto">
      {/* Instrument selector */}
      <div className="flex gap-2">
        {(Object.keys(INSTRUMENTS) as (keyof typeof INSTRUMENTS)[]).map(
          (inst) => (
            <button
              key={inst}
              type="button"
              data-ocid={`tuner.${inst.toLowerCase()}_toggle`}
              onClick={() => setInstrument(inst)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background:
                  instrument === inst
                    ? "oklch(0.52 0.18 200)"
                    : "oklch(0.18 0.04 260)",
                color: "white",
                border:
                  instrument === inst
                    ? "1px solid oklch(0.60 0.18 200)"
                    : "1px solid oklch(0.28 0.04 260)",
              }}
            >
              {inst}
            </button>
          ),
        )}
      </div>

      {/* Needle gauge */}
      <div className="relative w-56 h-32">
        <svg
          width={224}
          height={128}
          viewBox="0 0 224 128"
          role="img"
          aria-label="Tuner gauge"
        >
          <title>Tuner needle gauge</title>
          {/* Arc */}
          <path
            d="M 20 110 A 92 92 0 0 1 204 110"
            fill="none"
            stroke="oklch(0.22 0.04 260)"
            strokeWidth={16}
            strokeLinecap="round"
          />
          <path
            d={"M 20 110 A 92 92 0 0 1 204 110"}
            fill="none"
            stroke={
              inTune ? "#22c55e" : Math.abs(cents) < 15 ? "#f59e0b" : "#ef4444"
            }
            strokeWidth={16}
            strokeLinecap="round"
            strokeDasharray={`${((cents + 50) / 100) * 290} 290`}
            opacity={0.3}
          />
          {/* Center line */}
          <line
            x1={112}
            y1={30}
            x2={112}
            y2={110}
            stroke="oklch(0.35 0.05 260)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          {/* Needle */}
          <line
            x1={112}
            y1={110}
            x2={112 + Math.sin((needleAngle * Math.PI) / 180) * 80}
            y2={110 - Math.cos((needleAngle * Math.PI) / 180) * 80}
            stroke={inTune ? "#22c55e" : "#00b4d8"}
            strokeWidth={3}
            strokeLinecap="round"
            style={{ transition: "all 0.1s" }}
          />
          <circle
            cx={112}
            cy={110}
            r={6}
            fill={inTune ? "#22c55e" : "#00b4d8"}
          />
          {/* Labels */}
          <text x={18} y={126} fill="#64748b" fontSize={10}>
            ♭ -50
          </text>
          <text x={100} y={22} textAnchor="middle" fill="#94a3b8" fontSize={10}>
            0
          </text>
          <text x={196} y={126} textAnchor="end" fill="#64748b" fontSize={10}>
            +50 ♯
          </text>
        </svg>
        {/* Detected note display */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-6">
          {detectedNote ? (
            <>
              <span
                className="text-4xl font-bold"
                style={{ color: inTune ? "#22c55e" : "white" }}
              >
                {detectedNote.note}
              </span>
              <span
                className="text-sm"
                style={{ color: "oklch(0.60 0.06 240)" }}
              >
                {detectedNote.octave} · {cents > 0 ? "+" : ""}
                {Math.round(cents)}¢
              </span>
            </>
          ) : (
            <span
              className="text-2xl font-bold"
              style={{ color: "oklch(0.40 0.05 260)" }}
            >
              —
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      {detectedNote && (
        <div
          className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{
            background: inTune
              ? "oklch(0.35 0.18 145 / 0.2)"
              : "oklch(0.22 0.06 260)",
            color: inTune ? "#22c55e" : "#94a3b8",
            border: `1px solid ${inTune ? "#22c55e40" : "oklch(0.30 0.04 260)"}`,
          }}
        >
          {inTune
            ? "✓ In Tune"
            : cents < 0
              ? `▲ Tune up ${Math.abs(Math.round(cents))}¢`
              : `▼ Tune down ${Math.round(cents)}¢`}
        </div>
      )}

      {/* Start/Stop */}
      <Button
        data-ocid="tuner.toggle"
        onClick={active ? stopTuner : startTuner}
        className="px-8 py-3 rounded-2xl font-semibold text-base"
        style={{
          background: active ? "oklch(0.45 0.18 20)" : "oklch(0.52 0.18 200)",
          color: "white",
        }}
      >
        {active ? (
          <>
            <Square className="w-4 h-4 mr-2" />
            Stop Tuner
          </>
        ) : (
          <>
            <Music2 className="w-4 h-4 mr-2" />
            Start Tuner
          </>
        )}
      </Button>

      {/* String reference */}
      <div className="w-full">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: "oklch(0.55 0.06 240)" }}
        >
          {instrument} Strings — {INSTRUMENTS[instrument].tuning}
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {strings.map((s) => {
            const freq = STRING_FREQUENCIES[s];
            const isTarget =
              detectedNote &&
              `${detectedNote.note}${detectedNote.octave}` === s;
            return (
              <button
                key={s}
                type="button"
                data-ocid="tuner.string_button"
                onClick={() => setTargetString(targetString === s ? null : s)}
                className="flex flex-col items-center py-3 rounded-xl transition-all"
                style={{
                  background: isTarget
                    ? "oklch(0.52 0.18 200 / 0.2)"
                    : targetString === s
                      ? "oklch(0.22 0.06 260)"
                      : "oklch(0.14 0.03 260)",
                  border: `1px solid ${isTarget ? "oklch(0.52 0.18 200)" : "oklch(0.25 0.04 260)"}`,
                  color: isTarget ? "#00b4d8" : "white",
                }}
              >
                <span className="text-lg font-bold">
                  {s.replace(/[0-9]/, "")}
                </span>
                <span
                  className="text-[10px]"
                  style={{ color: "oklch(0.55 0.05 240)" }}
                >
                  {s}
                </span>
                <span
                  className="text-[10px]"
                  style={{ color: "oklch(0.50 0.05 240)" }}
                >
                  {freq}Hz
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Metronome Tab ─────────────────────────────────────────────────────────

function MetronomeTab() {
  const [bpm, setBpm] = useState(120);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(false);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playClick = useCallback((emphasis = false) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = emphasis ? 1000 : 800;
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
    setBeat(true);
    setTimeout(() => setBeat(false), 80);
  }, []);

  const start = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    setRunning(true);
    playClick(true);
    intervalRef.current = setInterval(() => playClick(), (60 / bpm) * 1000);
  }, [bpm, playClick]);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setBeat(false);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (running) {
      stop();
      start();
    }
  }, [bpm]); // eslint-disable-line

  useEffect(
    () => () => {
      stop();
      audioCtxRef.current?.close();
    },
    [stop],
  );

  const handleTap = () => {
    const now = Date.now();
    const newTaps = [...tapTimes.slice(-7), now];
    setTapTimes(newTaps);
    if (newTaps.length >= 2) {
      const intervals = newTaps.slice(1).map((t, i) => t - newTaps[i]);
      const avgInterval =
        intervals.reduce((a, b) => a + b, 0) / intervals.length;
      setBpm(Math.round(60000 / avgInterval));
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 py-6 max-w-sm mx-auto">
      {/* Beat flash */}
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center transition-all"
        style={{
          background: beat
            ? "oklch(0.52 0.18 200 / 0.8)"
            : "oklch(0.18 0.04 260)",
          border: `3px solid ${beat ? "oklch(0.72 0.18 200)" : "oklch(0.28 0.04 260)"}`,
          boxShadow: beat ? "0 0 30px oklch(0.52 0.18 200 / 0.5)" : "none",
          transition: "all 0.05s",
        }}
      >
        <Timer
          className="w-10 h-10"
          style={{ color: beat ? "white" : "oklch(0.45 0.06 260)" }}
        />
      </div>

      {/* BPM display */}
      <div className="text-center">
        <div className="text-6xl font-bold" style={{ color: "white" }}>
          {bpm}
        </div>
        <div className="text-sm" style={{ color: "oklch(0.55 0.05 240)" }}>
          BPM
        </div>
      </div>

      {/* BPM slider */}
      <div className="w-full">
        <Slider
          data-ocid="metronome.bpm_input"
          min={40}
          max={240}
          step={1}
          value={[bpm]}
          onValueChange={([v]) => setBpm(v)}
          className="w-full"
        />
        <div
          className="flex justify-between text-xs mt-1"
          style={{ color: "oklch(0.50 0.04 260)" }}
        >
          <span>40</span>
          <span>120</span>
          <span>240</span>
        </div>
      </div>

      {/* Tempo labels */}
      <div className="flex flex-wrap gap-2 justify-center">
        {[
          { label: "Largo", bpm: 50 },
          { label: "Adagio", bpm: 70 },
          { label: "Andante", bpm: 85 },
          { label: "Moderato", bpm: 100 },
          { label: "Allegro", bpm: 140 },
          { label: "Presto", bpm: 180 },
        ].map((t) => (
          <button
            key={t.label}
            type="button"
            data-ocid="metronome.tempo_button"
            onClick={() => setBpm(t.bpm)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{
              background:
                Math.abs(bpm - t.bpm) < 10
                  ? "oklch(0.52 0.18 200 / 0.2)"
                  : "oklch(0.14 0.03 260)",
              border: `1px solid ${Math.abs(bpm - t.bpm) < 10 ? "oklch(0.52 0.18 200)" : "oklch(0.25 0.04 260)"}`,
              color: "white",
            }}
          >
            {t.label} · {t.bpm}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-4 w-full">
        <Button
          data-ocid="metronome.tap_button"
          onClick={handleTap}
          variant="outline"
          className="flex-1 py-4 text-base font-semibold"
          style={{
            borderColor: "oklch(0.35 0.06 260)",
            color: "white",
            background: "oklch(0.16 0.04 260)",
          }}
        >
          Tap
        </Button>
        <Button
          data-ocid="metronome.toggle"
          onClick={running ? stop : start}
          className="flex-1 py-4 text-base font-semibold"
          style={{
            background: running
              ? "oklch(0.45 0.18 20)"
              : "oklch(0.52 0.18 200)",
            color: "white",
          }}
        >
          {running ? (
            <>
              <Square className="w-4 h-4 mr-2" />
              Stop
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Chords Tab ───────────────────────────────────────────────────────────

function ChordsTab() {
  const [search, setSearch] = useState("");
  const [instrType] = useState<"Guitar">("Guitar");

  const filtered = GUITAR_CHORDS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: "oklch(0.50 0.05 240)" }}
        />
        <Input
          data-ocid="chords.search_input"
          placeholder="Search chords (C, Am, G7, Bm…)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-transparent border-border/40 text-white"
          style={{
            background: "oklch(0.14 0.03 260)",
            borderColor: "oklch(0.25 0.04 260)",
          }}
        />
      </div>
      <p className="text-xs" style={{ color: "oklch(0.55 0.05 240)" }}>
        {instrType} · {filtered.length} chords
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filtered.map((chord) => (
          <div
            key={chord.name}
            className="flex flex-col items-center rounded-2xl py-4 px-2"
            style={{
              background: "oklch(0.14 0.03 260)",
              border: "1px solid oklch(0.22 0.04 260)",
            }}
          >
            <span className="font-bold text-lg mb-2" style={{ color: "white" }}>
              {chord.name}
            </span>
            <ChordSVG chord={chord} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Notes Tab ─────────────────────────────────────────────────────────────

function NotesTab() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <p className="text-sm" style={{ color: "oklch(0.60 0.05 240)" }}>
        All 12 notes at octave 4 (A4 = 440 Hz standard tuning)
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {NOTES.map((note) => (
          <button
            key={note}
            type="button"
            data-ocid="notes.note_button"
            onClick={() => setSelected(selected === note ? null : note)}
            className="flex flex-col items-center py-4 rounded-2xl transition-all"
            style={{
              background:
                selected === note
                  ? "oklch(0.52 0.18 200 / 0.2)"
                  : "oklch(0.14 0.03 260)",
              border: `1px solid ${selected === note ? "oklch(0.52 0.18 200)" : "oklch(0.22 0.04 260)"}`,
              color: "white",
            }}
          >
            <span className="text-2xl font-bold">{note}</span>
            <span
              className="text-xs mt-1"
              style={{ color: "oklch(0.55 0.05 240)" }}
            >
              4
            </span>
            <span
              className="text-xs font-mono"
              style={{ color: "oklch(0.60 0.10 200)" }}
            >
              {NOTE_FREQUENCIES_C4[note]} Hz
            </span>
          </button>
        ))}
      </div>

      {/* Piano visualization */}
      {selected && (
        <div
          className="rounded-2xl p-5"
          style={{
            background: "oklch(0.12 0.03 260)",
            border: "1px solid oklch(0.22 0.04 260)",
          }}
        >
          <p
            className="text-center font-bold text-lg mb-3"
            style={{ color: "#00b4d8" }}
          >
            {selected}4 — {NOTE_FREQUENCIES_C4[selected]} Hz
          </p>
          <PianoKeys highlightNote={selected} />
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
            <div style={{ color: "oklch(0.60 0.05 240)" }}>
              <div className="font-semibold text-white">Wavelength</div>
              <div>{(343 / NOTE_FREQUENCIES_C4[selected]).toFixed(3)} m</div>
            </div>
            <div style={{ color: "oklch(0.60 0.05 240)" }}>
              <div className="font-semibold text-white">Period</div>
              <div>
                {((1 / NOTE_FREQUENCIES_C4[selected]) * 1000).toFixed(3)} ms
              </div>
            </div>
            <div style={{ color: "oklch(0.60 0.05 240)" }}>
              <div className="font-semibold text-white">MIDI</div>
              <div>{60 + NOTES.indexOf(selected)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sheets Tab ───────────────────────────────────────────────────────────

function SheetsTab() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SheetResult[]>([]);

  const handleSearch = () => {
    if (!query.trim()) return;
    const imslpResults: SheetResult[] = [
      {
        title: `${query} — IMSLP Results`,
        composer: "Various Composers",
        url: `https://imslp.org/wiki/Special:Search?search=${encodeURIComponent(query)}`,
        source: "IMSLP",
      },
    ];
    const musescoreResults: SheetResult[] = [
      {
        title: `${query} — MuseScore Sheets`,
        composer: "Community",
        url: `https://musescore.com/search?text=${encodeURIComponent(query)}`,
        source: "MuseScore",
      },
    ];
    setResults([...imslpResults, ...musescoreResults]);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          data-ocid="sheets.search_input"
          placeholder="Search sheet music (e.g. Beethoven Sonata, Clair de Lune)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="text-white"
          style={{
            background: "oklch(0.14 0.03 260)",
            borderColor: "oklch(0.25 0.04 260)",
          }}
        />
        <Button
          data-ocid="sheets.submit_button"
          onClick={handleSearch}
          style={{ background: "oklch(0.52 0.18 200)", color: "white" }}
        >
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {results.length === 0 && (
        <div className="text-center py-12">
          <FileMusic
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: "oklch(0.35 0.05 260)" }}
          />
          <p style={{ color: "oklch(0.55 0.05 240)" }}>
            Search for sheet music from IMSLP and MuseScore
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {[
              "Beethoven",
              "Bach Invention",
              "Chopin Nocturne",
              "Mozart Sonata",
              "Clair de Lune",
            ].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQuery(s);
                }}
                className="px-3 py-1.5 rounded-xl text-sm transition-all"
                style={{
                  background: "oklch(0.16 0.04 260)",
                  border: "1px solid oklch(0.28 0.04 260)",
                  color: "#00b4d8",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {results.map((r, i) => (
          <a
            // biome-ignore lint/suspicious/noArrayIndexKey: static sheet results
            key={i}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:opacity-80"
            style={{
              background: "oklch(0.14 0.03 260)",
              border: "1px solid oklch(0.22 0.04 260)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background:
                  r.source === "IMSLP"
                    ? "oklch(0.22 0.10 30 / 0.3)"
                    : "oklch(0.22 0.10 200 / 0.3)",
              }}
            >
              <FileMusic
                className="w-5 h-5"
                style={{ color: r.source === "IMSLP" ? "#f97316" : "#00b4d8" }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white text-sm">{r.title}</p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "oklch(0.55 0.05 240)" }}
              >
                {r.composer}
              </p>
            </div>
            <Badge
              className="shrink-0 text-xs"
              style={{
                background:
                  r.source === "IMSLP"
                    ? "oklch(0.22 0.10 30 / 0.3)"
                    : "oklch(0.22 0.10 200 / 0.3)",
                color: r.source === "IMSLP" ? "#f97316" : "#00b4d8",
              }}
            >
              {r.source}
            </Badge>
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── Video Tutorials Tab ──────────────────────────────────────────────────

function VideoTutorialsTab() {
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeVideo, setActiveVideo] = useState<VideoResult | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://archive.org/advancedsearch.php?q=music+tutorial+${encodeURIComponent(query)}&mediatype=movies&output=json&rows=12&fl[]=identifier,title`,
      );
      const data = await res.json();
      const items: VideoResult[] = (data?.response?.docs ?? []).map(
        (d: any) => ({
          id: d.identifier,
          title: d.title || d.identifier,
          identifier: d.identifier,
        }),
      );
      setVideos(items);
    } catch {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          data-ocid="videos.search_input"
          placeholder="Search music tutorials (e.g. guitar beginner, piano scales)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="text-white"
          style={{
            background: "oklch(0.14 0.03 260)",
            borderColor: "oklch(0.25 0.04 260)",
          }}
        />
        <Button
          data-ocid="videos.submit_button"
          onClick={handleSearch}
          disabled={loading}
          style={{ background: "oklch(0.52 0.18 200)", color: "white" }}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>

      {videos.length === 0 && !loading && (
        <div className="text-center py-12">
          <Play
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: "oklch(0.35 0.05 260)" }}
          />
          <p style={{ color: "oklch(0.55 0.05 240)" }}>
            Search music tutorials from Internet Archive
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {[
              "guitar basics",
              "piano scales",
              "music theory",
              "how to play ukulele",
              "drum lesson",
            ].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQuery(s);
                }}
                className="px-3 py-1.5 rounded-xl text-sm transition-all"
                style={{
                  background: "oklch(0.16 0.04 260)",
                  border: "1px solid oklch(0.28 0.04 260)",
                  color: "#00b4d8",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active player */}
      {activeVideo && (
        <div
          className="rounded-2xl overflow-hidden border"
          style={{ borderColor: "oklch(0.25 0.04 260)" }}
        >
          <iframe
            src={`https://archive.org/embed/${activeVideo.identifier}`}
            className="w-full aspect-video"
            allowFullScreen
            title={activeVideo.title}
          />
          <div className="p-3" style={{ background: "oklch(0.12 0.03 260)" }}>
            <p className="text-sm font-semibold text-white">
              {activeVideo.title}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {videos.map((v, i) => (
          <button
            key={v.id}
            type="button"
            data-ocid={`music.video.item.${i + 1}`}
            onClick={() => setActiveVideo(activeVideo?.id === v.id ? null : v)}
            className="flex items-center gap-3 p-3 rounded-2xl text-left transition-all hover:opacity-80"
            style={{
              background:
                activeVideo?.id === v.id
                  ? "oklch(0.52 0.18 200 / 0.1)"
                  : "oklch(0.14 0.03 260)",
              border: `1px solid ${activeVideo?.id === v.id ? "oklch(0.52 0.18 200)" : "oklch(0.22 0.04 260)"}`,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.22 0.10 200 / 0.2)" }}
            >
              <Play className="w-5 h-5" style={{ color: "#00b4d8" }} />
            </div>
            <p className="text-sm font-medium text-white line-clamp-2">
              {v.title}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export function MusicToolsPage() {
  return (
    <div className="min-h-full pb-8 px-4 py-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Music className="w-6 h-6" style={{ color: "#00b4d8" }} />
          <h1 className="text-2xl font-bold text-white">Music Tools</h1>
        </div>
        <p className="text-sm" style={{ color: "oklch(0.55 0.05 240)" }}>
          Instrument tuner, metronome, chord charts, music notes, sheet music,
          and video tutorials
        </p>
      </div>

      <Tabs defaultValue="tuner">
        <TabsList
          className="mb-6 flex flex-wrap gap-1 h-auto p-1"
          style={{ background: "oklch(0.12 0.03 260)" }}
        >
          {[
            { value: "tuner", label: "Tuner", icon: Music2 },
            { value: "metronome", label: "Metronome", icon: Timer },
            { value: "chords", label: "Chords", icon: Guitar },
            { value: "notes", label: "Notes", icon: Music },
            { value: "sheets", label: "Sheets", icon: FileMusic },
            { value: "videos", label: "Videos", icon: Play },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              data-ocid={`music.${value}_tab`}
              className="flex items-center gap-1.5 text-sm px-3 py-2"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="tuner">
          <TunerTab />
        </TabsContent>
        <TabsContent value="metronome">
          <MetronomeTab />
        </TabsContent>
        <TabsContent value="chords">
          <ChordsTab />
        </TabsContent>
        <TabsContent value="notes">
          <NotesTab />
        </TabsContent>
        <TabsContent value="sheets">
          <SheetsTab />
        </TabsContent>
        <TabsContent value="videos">
          <VideoTutorialsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
