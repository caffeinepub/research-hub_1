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

const INSTRUMENTS = {
  Guitar: { strings: ["E2", "A2", "D3", "G3", "B3", "E4"], tuning: "Standard" },
  Ukulele: { strings: ["G4", "C4", "E4", "A4"], tuning: "Standard" },
  Bass: { strings: ["E1", "A1", "D2", "G2"], tuning: "Standard" },
  Mandolin: { strings: ["G3", "D4", "A4", "E5"], tuning: "Standard" },
  Violin: { strings: ["G3", "D4", "A4", "E5"], tuning: "Standard" },
  Banjo: { strings: ["D3", "B3", "G3", "D4", "G4"], tuning: "Standard" },
  "Uke Baritone": { strings: ["D3", "G3", "B3", "E4"], tuning: "Standard" },
};

// ─── Tuning Presets ───────────────────────────────────────────────────────

const GUITAR_TUNINGS: Record<string, string[]> = {
  Standard: ["E2", "A2", "D3", "G3", "B3", "E4"],
  "Drop D": ["D2", "A2", "D3", "G3", "B3", "E4"],
  "Open G": ["D2", "G2", "D3", "G3", "B3", "D4"],
  "Open D": ["D2", "A2", "D3", "F#3", "A3", "D4"],
  "Open E": ["E2", "B2", "E3", "G#3", "B3", "E4"],
  "Open A": ["E2", "A2", "E3", "A3", "C#4", "E4"],
  DADGAD: ["D2", "A2", "D3", "G3", "A3", "D4"],
  "Half Step Down": ["Eb2", "Ab2", "Db3", "Gb3", "Bb3", "Eb4"],
  "Full Step Down": ["D2", "G2", "C3", "F3", "A3", "D4"],
  "Drop C": ["C2", "G2", "C3", "F3", "A3", "D4"],
  Custom: ["E2", "A2", "D3", "G3", "B3", "E4"],
};

const UKULELE_TUNINGS: Record<string, string[]> = {
  Standard: ["G4", "C4", "E4", "A4"],
  "Low G": ["G3", "C4", "E4", "A4"],
  "D Tuning": ["A4", "D4", "F#4", "B4"],
  Custom: ["G4", "C4", "E4", "A4"],
};

const BASS_TUNINGS: Record<string, string[]> = {
  Standard: ["E1", "A1", "D2", "G2"],
  "Drop D": ["D1", "A1", "D2", "G2"],
  "5-String": ["B0", "E1", "A1", "D2", "G2"],
  Custom: ["E1", "A1", "D2", "G2"],
};

const MANDOLIN_TUNINGS: Record<string, string[]> = {
  Standard: ["G3", "D4", "A4", "E5"],
  Custom: ["G3", "D4", "A4", "E5"],
};

const VIOLIN_TUNINGS: Record<string, string[]> = {
  Standard: ["G3", "D4", "A4", "E5"],
  Custom: ["G3", "D4", "A4", "E5"],
};

const BANJO_TUNINGS: Record<string, string[]> = {
  Standard: ["D3", "B3", "G3", "D4", "G4"],
  "Open G": ["G3", "B3", "G3", "D4", "G4"],
  Custom: ["D3", "B3", "G3", "D4", "G4"],
};

const UKE_BARITONE_TUNINGS: Record<string, string[]> = {
  Standard: ["D3", "G3", "B3", "E4"],
  Custom: ["D3", "G3", "B3", "E4"],
};

const TUNINGS_BY_INSTRUMENT: Record<string, Record<string, string[]>> = {
  Guitar: GUITAR_TUNINGS,
  Ukulele: UKULELE_TUNINGS,
  Bass: BASS_TUNINGS,
  Mandolin: MANDOLIN_TUNINGS,
  Violin: VIOLIN_TUNINGS,
  Banjo: BANJO_TUNINGS,
  "Uke Baritone": UKE_BARITONE_TUNINGS,
};

const STRING_FREQUENCIES: Record<string, number> = {
  // Bass range
  B0: 30.87,
  D1: 36.71,
  E1: 41.2,
  A1: 55.0,
  // Low guitar / bass
  C2: 65.41,
  D2: 73.42,
  Eb2: 77.78,
  E2: 82.41,
  G2: 98.0,
  Ab2: 103.83,
  A2: 110.0,
  // Mid range
  B2: 123.47,
  C3: 130.81,
  Db3: 138.59,
  D3: 146.83,
  Eb3: 155.56,
  E3: 164.81,
  F3: 174.61,
  "F#3": 185.0,
  Gb3: 185.0,
  G3: 196.0,
  "G#3": 207.65,
  Ab3: 207.65,
  A3: 220.0,
  Bb3: 233.08,
  B3: 246.94,
  // Upper range
  C4: 261.63,
  "C#4": 277.18,
  D4: 293.66,
  Eb4: 311.13,
  E4: 329.63,
  F4: 349.23,
  "F#4": 369.99,
  G4: 392.0,
  "G#4": 415.3,
  A4: 440.0,
  B4: 493.88,
  // High range
  C5: 523.25,
  "D#5": 622.25,
  E5: 659.25,
  A5: 880.0,
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

// ─── YIN Pitch Detection ──────────────────────────────────────────────────

function yinPitchDetect(buf: Float32Array, sampleRate: number): number {
  const threshold = 0.1;
  const W = buf.length;
  const halfW = Math.floor(W / 2);

  // RMS gating — ignore silence
  let rms = 0;
  for (let i = 0; i < W; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / W);
  if (rms < 0.015) return -1;

  const diff = new Float32Array(halfW);
  // Step 1 & 2: difference function
  for (let tau = 0; tau < halfW; tau++) {
    let s = 0;
    for (let j = 0; j < halfW; j++) {
      const d = buf[j] - buf[j + tau];
      s += d * d;
    }
    diff[tau] = s;
  }

  // Step 3: cumulative mean normalised difference
  const cmndf = new Float32Array(halfW);
  cmndf[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < halfW; tau++) {
    runningSum += diff[tau];
    cmndf[tau] = diff[tau] / (runningSum / tau);
  }

  // Step 4: absolute threshold — first dip below threshold
  let tau = 2;
  while (tau < halfW) {
    if (cmndf[tau] < threshold) {
      while (tau + 1 < halfW && cmndf[tau + 1] < cmndf[tau]) tau++;
      break;
    }
    tau++;
  }
  if (tau === halfW) return -1;

  // Step 5: parabolic interpolation for sub-sample accuracy
  if (tau > 0 && tau < halfW - 1) {
    const s0 = cmndf[tau - 1];
    const s1 = cmndf[tau];
    const s2 = cmndf[tau + 1];
    const denom = 2 * s1 - s2 - s0;
    if (denom !== 0) {
      tau += (s2 - s0) / (2 * denom);
    }
  }

  return sampleRate / tau;
}

function freqToNote(freq: number): {
  note: string;
  octave: number;
  cents: number;
} {
  const noteNum = 12 * (Math.log(freq / 440) / Math.log(2));
  const noteIdx = ((Math.round(noteNum) % 12) + 12) % 12;
  const note = NOTES[noteIdx];
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
  const [instrument, setInstrument] =
    useState<keyof typeof INSTRUMENTS>("Guitar");
  const [tuning, setTuning] = useState("Standard");
  const [customStrings, setCustomStrings] = useState<string[]>([
    ...GUITAR_TUNINGS.Standard,
  ]);
  const [active, setActive] = useState(false);
  const [detectedNote, setDetectedNote] = useState<{
    note: string;
    octave: number;
    cents: number;
  } | null>(null);
  const [targetString, setTargetString] = useState<string | null>(null);
  const [playingString, setPlayingString] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  // When instrument changes, reset to Standard tuning
  const handleInstrumentChange = (inst: keyof typeof INSTRUMENTS) => {
    setInstrument(inst);
    setTuning("Standard");
    setCustomStrings([...TUNINGS_BY_INSTRUMENT[inst].Standard]);
  };

  // When tuning preset changes
  const handleTuningChange = (newTuning: string) => {
    setTuning(newTuning);
    if (newTuning !== "Custom") {
      setCustomStrings([...TUNINGS_BY_INSTRUMENT[instrument][newTuning]]);
    }
  };

  // Get the active strings based on tuning selection
  const activeStrings =
    tuning === "Custom"
      ? customStrings
      : (TUNINGS_BY_INSTRUMENT[instrument][tuning] ??
        TUNINGS_BY_INSTRUMENT[instrument].Standard);

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
      await ctx.resume();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096; // larger buffer = more accurate low notes
      analyserRef.current = analyser;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      setActive(true);

      const buf = new Float32Array(analyser.fftSize);
      const tick = () => {
        analyser.getFloatTimeDomainData(buf);
        const freq = yinPitchDetect(buf, ctx.sampleRate);
        if (freq > 30 && freq < 2000) {
          setDetectedNote(freqToNote(freq));
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      alert(
        "Microphone access required for the tuner. Please allow microphone access in your browser settings.",
      );
    }
  }, []);

  useEffect(() => () => stopTuner(), [stopTuner]);

  const cents = detectedNote?.cents ?? 0;
  // Needle spans -50 to +50 cents mapped to -60deg to +60deg
  const needleAngle = Math.max(-60, Math.min(60, cents * 1.2));
  const inTune = Math.abs(cents) < 5;
  const centsLabel = detectedNote
    ? `${cents > 0 ? "+" : ""}${Math.round(cents)}¢`
    : "";

  // Arc geometry: semicircle from 210deg to 330deg (bottom arc)
  const arcR = 90;
  const cx = 112;
  const cy = 115;
  const startAngle = 210 * (Math.PI / 180);
  const endAngle = 330 * (Math.PI / 180);
  const arcX1 = cx + arcR * Math.cos(startAngle);
  const arcY1 = cy + arcR * Math.sin(startAngle);
  const arcX2 = cx + arcR * Math.cos(endAngle);
  const arcY2 = cy + arcR * Math.sin(endAngle);

  // Needle angle in radians: 270deg = straight up, offset by cents
  const needleRad = (270 + needleAngle) * (Math.PI / 180);
  const needleLen = 75;
  const nx = cx + needleLen * Math.cos(needleRad);
  const ny = cy + needleLen * Math.sin(needleRad);

  const tuneStatus = !detectedNote
    ? null
    : inTune
      ? "✓ In Tune"
      : cents < 0
        ? `▲ Tune Up  ${Math.abs(Math.round(cents))}¢`
        : `▼ Tune Down  ${Math.round(cents)}¢`;

  const tuningOptions = Object.keys(TUNINGS_BY_INSTRUMENT[instrument]);

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
              onClick={() => handleInstrumentChange(inst)}
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

      {/* Tuning selector */}
      <div className="w-full space-y-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor="tuning-select"
            className="text-xs font-semibold uppercase tracking-widest shrink-0"
            style={{ color: "oklch(0.55 0.06 240)" }}
          >
            Tuning
          </label>
          <select
            id="tuning-select"
            data-ocid="tuner.tuning_select"
            value={tuning}
            onChange={(e) => handleTuningChange(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl text-sm font-medium appearance-none cursor-pointer"
            style={{
              background: "oklch(0.16 0.04 260)",
              color: "white",
              border: "1px solid oklch(0.30 0.06 240)",
              outline: "none",
            }}
          >
            {tuningOptions.map((t) => (
              <option
                key={t}
                value={t}
                style={{ background: "#1e293b", color: "white" }}
              >
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Custom string inputs */}
        {tuning === "Custom" && (
          <div className="space-y-2">
            <p className="text-xs" style={{ color: "oklch(0.55 0.06 240)" }}>
              Enter note names (e.g. E2, A2, D3)
            </p>
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${customStrings.length}, 1fr)`,
              }}
            >
              {customStrings.map((s, i) => (
                <input
                  // biome-ignore lint/suspicious/noArrayIndexKey: string slots are positional
                  key={i}
                  type="text"
                  value={s}
                  maxLength={4}
                  aria-label={`String ${i + 1}`}
                  onChange={(e) => {
                    const updated = [...customStrings];
                    updated[i] = e.target.value.trim();
                    setCustomStrings(updated);
                  }}
                  className="text-center text-sm font-bold rounded-lg px-1 py-2"
                  style={{
                    background: "oklch(0.13 0.03 260)",
                    color: "white",
                    border: "1px solid oklch(0.30 0.06 240)",
                    outline: "none",
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chromatic needle gauge — GuitarApp style */}
      <div className="relative">
        <svg
          width={224}
          height={145}
          viewBox="0 0 224 145"
          role="img"
          aria-label="Chromatic tuner gauge"
        >
          <title>Chromatic tuner needle gauge</title>

          {/* Background arc track */}
          <path
            d={`M ${arcX1} ${arcY1} A ${arcR} ${arcR} 0 0 1 ${arcX2} ${arcY2}`}
            fill="none"
            stroke="#1e293b"
            strokeWidth={18}
            strokeLinecap="round"
          />

          {/* Colored zone: green center, yellow/red edges */}
          {/* Red zone left */}
          <path
            d={`M ${arcX1} ${arcY1} A ${arcR} ${arcR} 0 0 1 ${cx + arcR * Math.cos(240 * (Math.PI / 180))} ${cy + arcR * Math.sin(240 * (Math.PI / 180))}`}
            fill="none"
            stroke="#ef4444"
            strokeWidth={18}
            strokeLinecap="round"
            opacity={0.35}
          />
          {/* Yellow zone left */}
          <path
            d={`M ${cx + arcR * Math.cos(240 * (Math.PI / 180))} ${cy + arcR * Math.sin(240 * (Math.PI / 180))} A ${arcR} ${arcR} 0 0 1 ${cx + arcR * Math.cos(258 * (Math.PI / 180))} ${cy + arcR * Math.sin(258 * (Math.PI / 180))}`}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={18}
            opacity={0.4}
          />
          {/* Green center zone */}
          <path
            d={`M ${cx + arcR * Math.cos(262 * (Math.PI / 180))} ${cy + arcR * Math.sin(262 * (Math.PI / 180))} A ${arcR} ${arcR} 0 0 1 ${cx + arcR * Math.cos(278 * (Math.PI / 180))} ${cy + arcR * Math.sin(278 * (Math.PI / 180))}`}
            fill="none"
            stroke="#22c55e"
            strokeWidth={18}
            opacity={0.5}
          />
          {/* Yellow zone right */}
          <path
            d={`M ${cx + arcR * Math.cos(278 * (Math.PI / 180))} ${cy + arcR * Math.sin(278 * (Math.PI / 180))} A ${arcR} ${arcR} 0 0 1 ${cx + arcR * Math.cos(300 * (Math.PI / 180))} ${cy + arcR * Math.sin(300 * (Math.PI / 180))}`}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={18}
            opacity={0.4}
          />
          {/* Red zone right */}
          <path
            d={`M ${cx + arcR * Math.cos(300 * (Math.PI / 180))} ${cy + arcR * Math.sin(300 * (Math.PI / 180))} A ${arcR} ${arcR} 0 0 1 ${arcX2} ${arcY2}`}
            fill="none"
            stroke="#ef4444"
            strokeWidth={18}
            strokeLinecap="round"
            opacity={0.35}
          />

          {/* Tick marks */}
          {[-50, -25, 0, 25, 50].map((c) => {
            const a = (270 + c * 1.2) * (Math.PI / 180);
            const inner = arcR - 12;
            const outer = arcR + 2;
            return (
              <line
                key={c}
                x1={cx + inner * Math.cos(a)}
                y1={cy + inner * Math.sin(a)}
                x2={cx + outer * Math.cos(a)}
                y2={cy + outer * Math.sin(a)}
                stroke={c === 0 ? "#22c55e" : "#475569"}
                strokeWidth={c === 0 ? 2 : 1}
              />
            );
          })}

          {/* Center line (0 cents) */}
          <line
            x1={cx}
            y1={cy - arcR + 5}
            x2={cx}
            y2={cy - 20}
            stroke="#22c55e"
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.5}
          />

          {/* Needle */}
          {detectedNote && (
            <>
              <line
                x1={cx}
                y1={cy}
                x2={nx}
                y2={ny}
                stroke={
                  inTune
                    ? "#22c55e"
                    : Math.abs(cents) < 15
                      ? "#f59e0b"
                      : "#ef4444"
                }
                strokeWidth={3}
                strokeLinecap="round"
                style={{ transition: "x2 0.08s, y2 0.08s" }}
              />
              <circle
                cx={cx}
                cy={cy}
                r={7}
                fill={
                  inTune
                    ? "#22c55e"
                    : Math.abs(cents) < 15
                      ? "#f59e0b"
                      : "#ef4444"
                }
              />
            </>
          )}
          {!detectedNote && <circle cx={cx} cy={cy} r={7} fill="#334155" />}

          {/* Labels */}
          <text
            x={arcX1 - 4}
            y={arcY1 + 14}
            fill="#64748b"
            fontSize={9}
            textAnchor="middle"
          >
            -50
          </text>
          <text
            x={arcX2 + 4}
            y={arcY2 + 14}
            fill="#64748b"
            fontSize={9}
            textAnchor="middle"
          >
            +50
          </text>
          <text
            x={cx}
            y={cy - arcR - 4}
            fill="#64748b"
            fontSize={9}
            textAnchor="middle"
          >
            0
          </text>
        </svg>

        {/* Detected note display — overlaid at center */}
        <div
          className="absolute flex flex-col items-center"
          style={{
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            paddingBottom: 4,
          }}
        >
          {detectedNote ? (
            <>
              <span
                className="text-5xl font-bold leading-none"
                style={{
                  color: inTune
                    ? "#22c55e"
                    : Math.abs(cents) < 15
                      ? "#f59e0b"
                      : "#ef4444",
                  textShadow: inTune ? "0 0 20px #22c55e60" : "none",
                  transition: "color 0.15s",
                }}
              >
                {detectedNote.note}
              </span>
              <span
                className="text-xs font-mono mt-0.5"
                style={{ color: "oklch(0.55 0.05 240)" }}
              >
                {detectedNote.octave} · {centsLabel}
              </span>
            </>
          ) : (
            <span
              className="text-3xl font-bold"
              style={{ color: "oklch(0.35 0.04 260)" }}
            >
              —
            </span>
          )}
        </div>
      </div>

      {/* Status badge */}
      <div
        className="px-5 py-2 rounded-2xl text-sm font-bold tracking-wide min-w-[140px] text-center"
        style={{
          background:
            inTune && detectedNote
              ? "oklch(0.25 0.12 145 / 0.35)"
              : "oklch(0.18 0.04 260)",
          color:
            inTune && detectedNote
              ? "#22c55e"
              : !detectedNote
                ? "oklch(0.40 0.05 260)"
                : Math.abs(cents) < 15
                  ? "#f59e0b"
                  : "#ef4444",
          border: `1px solid ${inTune && detectedNote ? "#22c55e40" : "oklch(0.26 0.04 260)"}`,
          transition: "all 0.2s",
        }}
      >
        {tuneStatus ?? (active ? "Listening…" : "Start tuner")}
      </div>

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
          {instrument} Strings — {tuning}
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {activeStrings.map((s, idx) => {
            const freq = STRING_FREQUENCIES[s];
            const isTarget =
              detectedNote &&
              `${detectedNote.note}${detectedNote.octave}` === s;
            return (
              <button
                // biome-ignore lint/suspicious/noArrayIndexKey: string slots are fixed positions
                key={`${s}-${idx}`}
                type="button"
                data-ocid="tuner.string_button"
                onClick={() => {
                  setTargetString(targetString === s ? null : s);
                  if (freq) {
                    setPlayingString(s);
                    playTone(
                      freq,
                      getAudioContext().currentTime,
                      2,
                      0.45,
                      "triangle",
                    );
                    setTimeout(
                      () => setPlayingString((p) => (p === s ? null : p)),
                      2000,
                    );
                  }
                }}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all"
                style={{
                  background: isTarget
                    ? "oklch(0.52 0.18 200 / 0.2)"
                    : playingString === s
                      ? "oklch(0.42 0.18 160 / 0.2)"
                      : targetString === s
                        ? "oklch(0.22 0.06 260)"
                        : "oklch(0.14 0.03 260)",
                  border: `1px solid ${
                    isTarget
                      ? "oklch(0.52 0.18 200)"
                      : playingString === s
                        ? "oklch(0.55 0.18 160)"
                        : "oklch(0.25 0.04 260)"
                  }`,
                  color: isTarget ? "#00b4d8" : "white",
                  transform: playingString === s ? "scale(1.04)" : "scale(1)",
                  transition: "all 0.15s",
                }}
              >
                {/* Visual string bar — thicker for lower strings */}
                <div
                  style={{
                    width: "100%",
                    height: `${Math.max(2, 7 - idx)}px`,
                    borderRadius: "9999px",
                    background: isTarget
                      ? "#00b4d8"
                      : playingString === s
                        ? "oklch(0.65 0.20 160)"
                        : "oklch(0.40 0.08 240)",
                    transition: "background 0.15s",
                  }}
                />
                <span className="text-base font-bold leading-none">
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
                  {freq ? `${Math.round(freq)}Hz` : "?"}
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
