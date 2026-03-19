import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileMusic,
  Guitar,
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
  frets: number[];
  fingers: number[];
  startFret?: number;
  barre?: { fret: number; fromString: number; toString: number };
  notes?: number[]; // frequencies to play
}

interface SheetResult {
  title: string;
  composer: string;
  url: string;
  source: "IMSLP" | "MuseScore";
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

const GUITAR_CHORDS: ChordDiagram[] = [
  {
    name: "C",
    frets: [-1, 3, 2, 0, 1, 0],
    fingers: [0, 3, 2, 0, 1, 0],
    notes: [130.81, 261.63, 329.63, 392.0, 523.25],
  },
  {
    name: "D",
    frets: [-1, -1, 0, 2, 3, 2],
    fingers: [0, 0, 0, 1, 3, 2],
    notes: [146.83, 293.66, 369.99, 440.0],
  },
  {
    name: "E",
    frets: [0, 2, 2, 1, 0, 0],
    fingers: [0, 2, 3, 1, 0, 0],
    notes: [82.41, 123.47, 164.81, 207.65, 246.94, 329.63],
  },
  {
    name: "Em",
    frets: [0, 2, 2, 0, 0, 0],
    fingers: [0, 2, 3, 0, 0, 0],
    notes: [82.41, 123.47, 164.81, 196.0, 246.94, 329.63],
  },
  {
    name: "F",
    frets: [1, 1, 2, 3, 3, 1],
    fingers: [1, 1, 2, 4, 3, 1],
    barre: { fret: 1, fromString: 0, toString: 5 },
    notes: [87.31, 130.81, 174.61, 220.0, 261.63, 349.23],
  },
  {
    name: "G",
    frets: [3, 2, 0, 0, 0, 3],
    fingers: [2, 1, 0, 0, 0, 3],
    notes: [98.0, 123.47, 146.83, 196.0, 246.94, 392.0],
  },
  {
    name: "A",
    frets: [-1, 0, 2, 2, 2, 0],
    fingers: [0, 0, 1, 2, 3, 0],
    notes: [110.0, 220.0, 277.18, 329.63, 440.0],
  },
  {
    name: "Am",
    frets: [-1, 0, 2, 2, 1, 0],
    fingers: [0, 0, 2, 3, 1, 0],
    notes: [110.0, 220.0, 261.63, 329.63, 440.0],
  },
  {
    name: "Dm",
    frets: [-1, -1, 0, 2, 3, 1],
    fingers: [0, 0, 0, 2, 3, 1],
    notes: [146.83, 220.0, 293.66, 349.23],
  },
  {
    name: "G7",
    frets: [3, 2, 0, 0, 0, 1],
    fingers: [3, 2, 0, 0, 0, 1],
    notes: [98.0, 123.47, 146.83, 196.0, 246.94, 349.23],
  },
  {
    name: "C7",
    frets: [-1, 3, 2, 3, 1, 0],
    fingers: [0, 3, 2, 4, 1, 0],
    notes: [130.81, 261.63, 329.63, 415.3, 523.25],
  },
  {
    name: "D7",
    frets: [-1, -1, 0, 2, 1, 2],
    fingers: [0, 0, 0, 2, 1, 3],
    notes: [146.83, 261.63, 329.63, 440.0],
  },
  {
    name: "E7",
    frets: [0, 2, 0, 1, 0, 0],
    fingers: [0, 2, 0, 1, 0, 0],
    notes: [82.41, 123.47, 146.83, 196.0, 246.94, 329.63],
  },
  {
    name: "A7",
    frets: [-1, 0, 2, 0, 2, 0],
    fingers: [0, 0, 2, 0, 3, 0],
    notes: [110.0, 220.0, 261.63, 329.63, 440.0],
  },
  {
    name: "Cmaj7",
    frets: [-1, 3, 2, 0, 0, 0],
    fingers: [0, 3, 2, 0, 0, 0],
    notes: [130.81, 261.63, 329.63, 392.0, 493.88],
  },
  {
    name: "Gmaj7",
    frets: [3, 2, 0, 0, 0, 2],
    fingers: [3, 2, 0, 0, 0, 1],
    notes: [98.0, 123.47, 146.83, 196.0, 246.94, 493.88],
  },
  {
    name: "Dmaj7",
    frets: [-1, -1, 0, 2, 2, 2],
    fingers: [0, 0, 0, 1, 2, 3],
    notes: [146.83, 293.66, 369.99, 493.88],
  },
  {
    name: "Fmaj7",
    frets: [-1, -1, 3, 2, 1, 0],
    fingers: [0, 0, 3, 2, 1, 0],
    notes: [174.61, 261.63, 329.63, 440.0],
  },
  {
    name: "Bm",
    frets: [-1, 2, 4, 4, 3, 2],
    fingers: [0, 1, 3, 4, 2, 1],
    barre: { fret: 2, fromString: 1, toString: 5 },
    notes: [123.47, 246.94, 293.66, 369.99, 493.88],
  },
  {
    name: "F#m",
    frets: [2, 4, 4, 2, 2, 2],
    fingers: [1, 3, 4, 1, 1, 1],
    barre: { fret: 2, fromString: 0, toString: 5 },
    notes: [92.5, 185.0, 220.0, 277.18, 369.99, 493.88],
  },
];

// ─── Shared Audio Context ─────────────────────────────────────────────────

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    sharedAudioCtx = new AudioContext();
  }
  if (sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

function playTone(
  freq: number,
  startTime: number,
  duration = 1.5,
  volume = 0.4,
  type: OscillatorType = "triangle",
) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration);
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
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <iframe
        src="https://guitarapp.com/tuner.html?embed=true"
        allow="microphone"
        title="GuitarApp Online Tuner"
        style={{ width: 360, height: 520, border: "none", borderRadius: 4 }}
      />
    </div>
  );
}

function MetronomeTab() {
  const [bpm, setBpm] = useState(120);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(false);
  const [_beatCount, setBeatCount] = useState(0);
  const [_tapTimes, setTapTimes] = useState<number[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextBeatTimeRef = useRef<number>(0);
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;
  const runningRef = useRef(false);

  const playMetronomeClick = useCallback(
    (ctx: AudioContext, when: number, emphasis: boolean) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = emphasis ? 1050 : 800;
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(0.7, when + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, when + 0.06);
      osc.start(when);
      osc.stop(when + 0.07);
    },
    [],
  );

  const scheduleBeats = useCallback(() => {
    if (!runningRef.current) return;
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const interval = 60 / bpmRef.current;
    const now = ctx.currentTime;
    const lookAhead = 0.1; // schedule 100ms ahead

    while (nextBeatTimeRef.current < now + lookAhead) {
      setBeatCount((prev) => {
        const next = prev + 1;
        playMetronomeClick(ctx, nextBeatTimeRef.current, next % 4 === 1);
        // flash UI on downbeat
        const delay = Math.max(0, (nextBeatTimeRef.current - now) * 1000);
        setTimeout(() => {
          setBeat(true);
          setTimeout(() => setBeat(false), 80);
        }, delay);
        return next;
      });
      nextBeatTimeRef.current += interval;
    }

    timeoutRef.current = setTimeout(scheduleBeats, 25);
  }, [playMetronomeClick]);

  const start = useCallback(async () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    await ctx.resume();
    runningRef.current = true;
    nextBeatTimeRef.current = ctx.currentTime;
    setBeatCount(0);
    setRunning(true);
    scheduleBeats();
  }, [scheduleBeats]);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setRunning(false);
    setBeat(false);
  }, []);

  useEffect(
    () => () => {
      stop();
      audioCtxRef.current?.close();
    },
    [stop],
  );

  const handleTap = useCallback(() => {
    const now = Date.now();
    setTapTimes((prev) => {
      const newTaps = [...prev.slice(-7), now];
      if (newTaps.length >= 2) {
        const intervals = newTaps.slice(1).map((t, i) => t - newTaps[i]);
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        setBpm(Math.min(240, Math.max(40, Math.round(60000 / avg))));
      }
      return newTaps;
    });
  }, []);

  return (
    <div className="flex flex-col items-center gap-8 py-6 max-w-sm mx-auto">
      {/* Beat flash circle */}
      <div
        className="w-28 h-28 rounded-full flex items-center justify-center select-none"
        style={{
          background: beat
            ? "oklch(0.52 0.22 200 / 0.85)"
            : "oklch(0.16 0.04 260)",
          border: `4px solid ${
            beat ? "oklch(0.72 0.22 200)" : "oklch(0.26 0.04 260)"
          }`,
          boxShadow: beat
            ? "0 0 40px oklch(0.52 0.22 200 / 0.6), inset 0 0 20px oklch(0.72 0.22 200 / 0.3)"
            : "none",
          transition: "background 0.04s, box-shadow 0.04s, border-color 0.04s",
        }}
      >
        <Timer
          className="w-12 h-12"
          style={{ color: beat ? "white" : "oklch(0.42 0.06 260)" }}
        />
      </div>

      {/* BPM display */}
      <div className="text-center">
        <div
          className="text-7xl font-bold tabular-nums"
          style={{ color: "white" }}
        >
          {bpm}
        </div>
        <div
          className="text-sm font-semibold tracking-widest uppercase"
          style={{ color: "oklch(0.52 0.05 240)" }}
        >
          BPM
        </div>
      </div>

      {/* BPM slider */}
      <div className="w-full space-y-2">
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
          className="flex justify-between text-xs"
          style={{ color: "oklch(0.45 0.04 260)" }}
        >
          <span>40 Largo</span>
          <span>120 Allegro</span>
          <span>240 Presto</span>
        </div>
      </div>

      {/* Tempo preset labels */}
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
              border: `1px solid ${
                Math.abs(bpm - t.bpm) < 10
                  ? "oklch(0.52 0.18 200)"
                  : "oklch(0.25 0.04 260)"
              }`,
              color: "white",
            }}
          >
            {t.label} · {t.bpm}
          </button>
        ))}
      </div>

      {/* Tap + Start/Stop controls */}
      <div className="flex gap-3 w-full">
        <Button
          data-ocid="metronome.tap_button"
          onClick={handleTap}
          variant="outline"
          className="flex-1 py-4 text-base font-bold"
          style={{
            borderColor: "oklch(0.35 0.06 260)",
            color: "white",
            background: "oklch(0.15 0.04 260)",
          }}
        >
          Tap
        </Button>
        <Button
          data-ocid="metronome.toggle"
          onClick={running ? stop : start}
          className="flex-1 py-4 text-base font-bold"
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
  const [playingChord, setPlayingChord] = useState<string | null>(null);

  const filtered = GUITAR_CHORDS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handlePlayChord = useCallback((chord: ChordDiagram) => {
    if (!chord.notes?.length) return;
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    setPlayingChord(chord.name);
    chord.notes.forEach((freq, i) => {
      playTone(freq, now + i * 0.03, 1.8, 0.3, "triangle");
    });
    setTimeout(() => setPlayingChord(null), chord.notes.length * 30 + 200);
  }, []);

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
        Guitar · {filtered.length} chords · Tap any chord to hear it
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filtered.map((chord) => (
          <button
            key={chord.name}
            type="button"
            data-ocid="chords.chord_button"
            onClick={() => handlePlayChord(chord)}
            className="flex flex-col items-center rounded-2xl py-4 px-2 transition-all hover:opacity-90 active:scale-95"
            style={{
              background:
                playingChord === chord.name
                  ? "oklch(0.18 0.08 200)"
                  : "oklch(0.14 0.03 260)",
              border: `1px solid ${
                playingChord === chord.name
                  ? "oklch(0.52 0.18 200)"
                  : "oklch(0.22 0.04 260)"
              }`,
              boxShadow:
                playingChord === chord.name
                  ? "0 0 16px oklch(0.52 0.18 200 / 0.3)"
                  : "none",
              transition: "all 0.15s",
            }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span
                className="font-bold text-lg"
                style={{
                  color: playingChord === chord.name ? "#00b4d8" : "white",
                }}
              >
                {chord.name}
              </span>
              <span
                className="text-[10px] opacity-60"
                style={{
                  color: playingChord === chord.name ? "#00b4d8" : "white",
                }}
              >
                ▶
              </span>
            </div>
            <ChordSVG chord={chord} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Notes Tab ─────────────────────────────────────────────────────────────

function NotesTab() {
  const [selected, setSelected] = useState<string | null>(null);

  const handlePlayNote = useCallback((note: string) => {
    const freq = NOTE_FREQUENCIES_C4[note];
    if (!freq) return;
    setSelected(note);
    const ctx = getAudioContext();
    playTone(freq, ctx.currentTime, 1.2, 0.45, "triangle");
    setTimeout(() => setSelected(null), 1200);
  }, []);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <p className="text-sm" style={{ color: "oklch(0.60 0.05 240)" }}>
        All 12 notes at octave 4 (A4 = 440 Hz) · Tap any note to hear it
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {NOTES.map((note) => (
          <button
            key={note}
            type="button"
            data-ocid="notes.note_button"
            onClick={() => handlePlayNote(note)}
            className="flex flex-col items-center py-4 rounded-2xl transition-all active:scale-95"
            style={{
              background:
                selected === note
                  ? "oklch(0.52 0.18 200 / 0.25)"
                  : "oklch(0.14 0.03 260)",
              border: `1px solid ${
                selected === note
                  ? "oklch(0.52 0.18 200)"
                  : "oklch(0.22 0.04 260)"
              }`,
              boxShadow:
                selected === note
                  ? "0 0 18px oklch(0.52 0.18 200 / 0.35)"
                  : "none",
              color: "white",
              transition: "all 0.12s",
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
            {selected === note && (
              <span className="text-[10px] mt-1" style={{ color: "#00b4d8" }}>
                ♪ playing
              </span>
            )}
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
    setResults([
      {
        title: `${query} — IMSLP Results`,
        composer: "Various Composers",
        url: `https://imslp.org/wiki/Special:Search?search=${encodeURIComponent(query)}`,
        source: "IMSLP",
      },
      {
        title: `${query} — MuseScore Sheets`,
        composer: "Community",
        url: `https://musescore.com/search?text=${encodeURIComponent(query)}`,
        source: "MuseScore",
      },
    ]);
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
                onClick={() => setQuery(s)}
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
          Instrument tuner, metronome, chord charts, music notes &amp; sheet
          music
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
      </Tabs>
    </div>
  );
}
