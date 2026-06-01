import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Activity, Cloud, Tv, EarOff, Zap, Move, RotateCcw, Sliders, Sparkles } from "lucide-react";
import { setLiveFeature, analyser } from "@/lib/ambient-engine";

// Default effects definitions matching parent index.tsx
const EFFECTS_LIST = [
  {
    id: "NORMAL",
    label: "Normal",
    icon: Activity,
    desc: "Pristine raw audio straight from the console line.",
  },
  {
    id: "DISTANT",
    label: "Distant",
    icon: Cloud,
    desc: "Simulates hearing acoustics drift from adjacent rooms.",
  },
  {
    id: "TV",
    label: "TV",
    icon: Tv,
    desc: "Classic speaker box tone modeled on nostalgic CRT hardware.",
  },
  {
    id: "MUFFLED",
    label: "Muffled",
    icon: EarOff,
    desc: "Heavy lowpass filtering, making the bass bloom underneath.",
  },
  {
    id: "STATIC",
    label: "Static",
    icon: Zap,
    desc: "Simulated radio dial multipath VHF receiver hiss.",
  },
  {
    id: "REVERB",
    label: "Reverb",
    icon: Sparkles,
    desc: "Atmosphere-expanding metallic reverberation chamber.",
  },
];

const EFFECT_DEFAULTS = {
  NORMAL: { lp: 20000, hp: 20, reverb: 0.0, static: 0.0, hum: 0.0 },
  DISTANT: { lp: 1400, hp: 450, reverb: 0.55, static: 0.04, hum: 0.008 },
  TV: { lp: 2800, hp: 550, reverb: 0.12, static: 0.07, hum: 0.015 },
  MUFFLED: { lp: 380, hp: 40, reverb: 0.05, static: 0.03, hum: 0.012 },
  REVERB: { lp: 7500, hp: 100, reverb: 0.85, static: 0.01, hum: 0.0 },
  STATIC: { lp: 3800, hp: 750, reverb: 0.15, static: 0.22, hum: 0.04 },
};

interface FMEffectsGridProps {
  effect: string;
  setEffect: (eff: string) => void;
  playing: boolean;
  master: number;
  muted: boolean;
}

export default function FMEffectsGrid({
  effect,
  setEffect,
  playing,
  master,
  muted,
}: FMEffectsGridProps) {
  const [lpFreq, setLpFreq] = useState(20000);
  const [hpFreq, setHpFreq] = useState(20);
  const [reverbWet, setReverbWet] = useState(0.0);
  const [staticVol, setStaticVol] = useState(0.0);
  const [humVol, setHumVol] = useState(0.0);

  // Active tab inside FX controls
  const [fxControlMode, setFxControlMode] = useState<"sliders" | "vector">("sliders");

  const volScale = muted ? 0 : master / 100;

  // Whenever effect changes, update React states with standard presets
  useEffect(() => {
    const defaults =
      EFFECT_DEFAULTS[effect as keyof typeof EFFECT_DEFAULTS] || EFFECT_DEFAULTS.NORMAL;
    setLpFreq(defaults.lp);
    setHpFreq(defaults.hp);
    setReverbWet(defaults.reverb);
    setStaticVol(defaults.static * volScale);
    setHumVol(defaults.hum * volScale);
  }, [effect, volScale]);

  // Handle individual parameter changes with direct engine modulation
  const handleCutoffChange = (val: number) => {
    setLpFreq(val);
    setLiveFeature("cutoff", val);
  };

  const handleResonanceChange = (val: number) => {
    setHpFreq(val);
    setLiveFeature("resonance", val);
  };

  const handleReverbChange = (val: number) => {
    setReverbWet(val);
    setLiveFeature("reverb", val);
  };

  const handleStaticChange = (val: number) => {
    setStaticVol(val);
    setLiveFeature("static", val);
  };

  const handleHumChange = (val: number) => {
    setHumVol(val);
    setLiveFeature("hum", val);
  };

  const handleReset = () => {
    const defaults =
      EFFECT_DEFAULTS[effect as keyof typeof EFFECT_DEFAULTS] || EFFECT_DEFAULTS.NORMAL;
    handleCutoffChange(defaults.lp);
    handleResonanceChange(defaults.hp);
    handleReverbChange(defaults.reverb);
    handleStaticChange(defaults.static * volScale);
    handleHumChange(defaults.hum * volScale);
  };

  // Logarithmic conversion helpers for visual X/Y Pad frequency mapping
  const minFreq = 40;
  const maxFreq = 20000;
  const maxStaticVal = 0.35;

  const freqToPct = (freq: number) => {
    const minLog = Math.log(minFreq);
    const maxLog = Math.log(maxFreq);
    return ((Math.log(Math.max(minFreq, freq)) - minLog) / (maxLog - minLog)) * 100;
  };

  const pctToFreq = (pct: number) => {
    const minLog = Math.log(minFreq);
    const maxLog = Math.log(maxFreq);
    return Math.round(Math.exp(minLog + (pct / 100) * (maxLog - minLog)));
  };

  // Dragging states of vector coordinate grid
  const padRef = useRef<HTMLDivElement>(null);
  const [padDragging, setPadDragging] = useState(false);

  const padX = freqToPct(lpFreq);
  const padY = (staticVol / maxStaticVal) * 100;

  const updateParamsFromPointer = (clientX: number, clientY: number) => {
    const pad = padRef.current;
    if (!pad) return;
    const rect = pad.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    // Invert Y direction so dragging UP increases value
    const y = Math.max(0, Math.min(100, (1 - (clientY - rect.top) / rect.height) * 100));

    const newFreq = pctToFreq(x);
    const newStatic = (y / 100) * maxStaticVal;

    handleCutoffChange(newFreq);
    handleStaticChange(newStatic);
  };

  const onPadPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!padRef.current) return;
    setPadDragging(true);
    padRef.current.setPointerCapture(e.pointerId);
    updateParamsFromPointer(e.clientX, e.clientY);
  };

  const onPadPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!padDragging) return;
    updateParamsFromPointer(e.clientX, e.clientY);
  };

  const onPadPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!padDragging) return;
    setPadDragging(false);
    if (padRef.current) {
      padRef.current.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className="flex flex-col gap-4 flex-1 h-full min-h-0">
      {/* 1. 3X2 GRID SELECTOR */}
      <div className="grid grid-cols-2 gap-2 shrink-0">
        {EFFECTS_LIST.map((e) => {
          const on = effect === e.id;
          const Icon = e.icon;
          return (
            <button
              key={e.id}
              onClick={() => setEffect(e.id)}
              className={`group flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all duration-300 relative overflow-hidden select-none cursor-pointer ${
                on
                  ? "border-ember bg-ember/[0.05] shadow-[0_0_12px_rgba(255,106,0,0.12)] text-foreground"
                  : "border-border/40 text-foreground/70 hover:border-border/80 hover:text-foreground bg-panel-deep/50 hover:bg-panel-deep/80"
              }`}
            >
              {on && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-ember shadow-[0_0_8px_#ff6a00]" />
              )}
              <div
                className={`p-1.5 rounded-lg mb-1.5 transition-all ${
                  on
                    ? "bg-ember/15 text-ember shadow-[0_0_8px_rgba(255,106,0,0.25)] scale-105"
                    : "bg-neutral-900/60 text-foreground/45 group-hover:text-foreground/80"
                }`}
              >
                <Icon className="h-4.5 w-4.5" strokeWidth={on ? 2 : 1.5} />
              </div>
              <span
                className={`text-[9px] font-mono font-bold tracking-[0.1em] ${
                  on ? "text-ember" : "text-foreground"
                }`}
              >
                {e.label.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. LIVE RETRO OSCILLOSCOPE MONITOR */}
      <OscopeCanvas playing={playing} />

      {/* 3. PHYSICAL SYNTHESIS CONTROLLER TAB */}
      <div className="flex-1 min-h-0 flex flex-col bg-panel-deep/30 rounded-xl border border-border/15 p-3 relative overflow-hidden">
        <div className="flex items-center justify-between shrink-0 mb-3 border-b border-border/10 pb-2">
          {/* Deck mode switcher */}
          <div className="flex items-center gap-1.5 bg-neutral-950/30 p-0.5 rounded-md border border-border/5">
            <button
              onClick={() => setFxControlMode("sliders")}
              className={`flex items-center gap-1 text-[8px] tracking-wider font-mono px-2 py-1 rounded transition-all cursor-pointer ${
                fxControlMode === "sliders"
                  ? "text-ember font-bold bg-secondary/50"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sliders className="h-2.5 w-2.5" /> FADERS
            </button>
            <button
              onClick={() => setFxControlMode("vector")}
              className={`flex items-center gap-1 text-[8px] tracking-wider font-mono px-2 py-1 rounded transition-all cursor-pointer ${
                fxControlMode === "vector"
                  ? "text-ember font-bold bg-secondary/50"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Move className="h-2.5 w-2.5" /> VECTOR_XY
            </button>
          </div>

          <button
            onClick={handleReset}
            title="Reset preset params"
            className="text-[8px] font-mono tracking-wider text-muted-foreground hover:text-ember flex items-center gap-1 bg-neutral-950/20 hover:bg-neutral-950/40 p-1.5 rounded border border-border/10 cursor-pointer transition-all"
          >
            <RotateCcw className="h-2.5 w-2.5" /> RESET
          </button>
        </div>

        {/* CONTROLS DISPLAY WRAPPER */}
        <div className="flex-1 overflow-y-auto pr-0.5 hidden-scrollbar min-h-0">
          {fxControlMode === "sliders" ? (
            <div className="flex flex-col gap-3 py-1">
              {/* Slider 1: Cutoff Frequency */}
              <div className="flex flex-col gap-1 font-mono">
                <div className="flex justify-between text-[9px] text-foreground/75 uppercase tracking-wide">
                  <span>LP Cutoff filter</span>
                  <span className="text-ember tabular-nums font-semibold">
                    {lpFreq >= 1000 ? `${(lpFreq / 1000).toFixed(1)}k` : lpFreq} Hz
                  </span>
                </div>
                <input
                  type="range"
                  className="ember w-full cursor-grab active:cursor-grabbing h-1.5"
                  min={40}
                  max={20000}
                  step={10}
                  value={lpFreq}
                  style={{ ["--val" as string]: `${freqToPct(lpFreq)}%` }}
                  onChange={(e) => handleCutoffChange(Number(e.target.value))}
                />
              </div>

              {/* Slider 2: HP / Resonance Filter */}
              <div className="flex flex-col gap-1 font-mono">
                <div className="flex justify-between text-[9px] text-foreground/75 uppercase tracking-wide">
                  <span>HP resonance</span>
                  <span className="text-ember tabular-nums font-semibold">{hpFreq} Hz</span>
                </div>
                <input
                  type="range"
                  className="ember w-full cursor-grab active:cursor-grabbing h-1.5"
                  min={20}
                  max={2000}
                  step={1}
                  value={hpFreq}
                  style={{ ["--val" as string]: `${((hpFreq - 20) / 1980) * 100}%` }}
                  onChange={(e) => handleResonanceChange(Number(e.target.value))}
                />
              </div>

              {/* Slider 3: Reverb Wet Level */}
              <div className="flex flex-col gap-1 font-mono">
                <div className="flex justify-between text-[9px] text-foreground/75 uppercase tracking-wide">
                  <span>Reverb decay block</span>
                  <span className="text-ember tabular-nums font-semibold">
                    {Math.round(reverbWet * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  className="ember w-full cursor-grab active:cursor-grabbing h-1.5"
                  min={0.0}
                  max={1.0}
                  step={0.01}
                  value={reverbWet}
                  style={{ ["--val" as string]: `${reverbWet * 100}%` }}
                  onChange={(e) => handleReverbChange(Number(e.target.value))}
                />
              </div>

              {/* Slider 4: Static Receiver Hiss */}
              <div className="flex flex-col gap-1 font-mono">
                <div className="flex justify-between text-[9px] text-foreground/75 uppercase tracking-wide">
                  <span>Static multipath noise</span>
                  <span className="text-ember tabular-nums font-semibold">
                    {Math.round(staticVol * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  className="ember w-full cursor-grab active:cursor-grabbing h-1.5"
                  min={0.0}
                  max={0.4}
                  step={0.01}
                  value={staticVol}
                  style={{ ["--val" as string]: `${(staticVol / 0.4) * 100}%` }}
                  onChange={(e) => handleStaticChange(Number(e.target.value))}
                />
              </div>

              {/* Slider 5: Power Hum level */}
              <div className="flex flex-col gap-1 font-mono">
                <div className="flex justify-between text-[9px] text-foreground/75 uppercase tracking-wide">
                  <span>Trans-coil generator buzz</span>
                  <span className="text-ember tabular-nums font-semibold">
                    {Math.round(humVol * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  className="ember w-full cursor-grab active:cursor-grabbing h-1.5"
                  min={0.0}
                  max={0.1}
                  step={0.001}
                  value={humVol}
                  style={{ ["--val" as string]: `${(humVol / 0.1) * 100}%` }}
                  onChange={(e) => handleHumChange(Number(e.target.value))}
                />
              </div>
            </div>
          ) : (
            /* XY VECTOR GRAPH INTERFACE */
            <div className="flex flex-col h-full gap-2 py-1">
              <div className="flex justify-between text-[8px] font-mono text-muted-foreground uppercase tracking-wider select-none shrink-0 border-b border-border/5 pb-1">
                <span>Vector XY coordinate</span>
                <span className="text-ember">
                  X: {lpFreq >= 1000 ? `${(lpFreq / 1000).toFixed(1)}k` : lpFreq}Hz | Y:{" "}
                  {Math.round(staticVol * 100)}%
                </span>
              </div>

              <div
                ref={padRef}
                className="flex-1 w-full min-h-[140px] bg-neutral-950/40 rounded-xl border border-border/20 cursor-crosshair overflow-hidden relative shadow-[inset_0_3px_10px_rgba(0,0,0,0.5)] touch-none select-none"
                onPointerDown={onPadPointerDown}
                onPointerMove={onPadPointerMove}
                onPointerUp={onPadPointerUp}
              >
                {/* Vintage CRT-style grid background layout */}
                <div className="absolute top-0 bottom-0 w-[1px] bg-border/5 left-1/4" />
                <div className="absolute top-0 bottom-0 w-[1px] bg-border/5 left-2/4" />
                <div className="absolute top-0 bottom-0 w-[1px] bg-border/5 left-3/4" />
                <div className="absolute left-0 right-0 h-[1px] bg-border/5 top-1/4" />
                <div className="absolute left-0 right-0 h-[1px] bg-border/5 top-2/4" />
                <div className="absolute left-0 right-0 h-[1px] bg-border/5 top-3/4" />

                {/* Subdued tracking coordinate lines aligned with current state */}
                <div
                  className="absolute left-0 right-0 h-[1.5px] bg-ember/15 border-t border-dashed border-ember/25 -translate-y-1/2 pointer-events-none"
                  style={{ top: `${100 - padY}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 w-[1.5px] bg-ember/15 border-l border-dashed border-ember/25 -translate-x-1/2 pointer-events-none"
                  style={{ left: `${padX}%` }}
                />

                {/* Dynamic visual rings that pulse slightly when dragging */}
                {padDragging && (
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-ember/30 w-16 h-16 pointer-events-none animate-ping duration-1000"
                    style={{ left: `${padX}%`, top: `${100 - padY}%` }}
                  />
                )}

                {/* Main glowing tracking puck node */}
                <div
                  className="absolute h-4 w-4 rounded-full bg-ember pointer-events-none -translate-x-1/2 -translate-y-1/2 shadow-[0_0_15px_#ff6a00,0_0_25px_var(--ember)] border border-white/20 select-none flex items-center justify-center transition-transform scale-100 active:scale-110"
                  style={{ left: `${padX}%`, top: `${100 - padY}%` }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>

                {/* Orientation labels */}
                <div className="absolute bottom-2 left-2 text-[7px] font-mono text-muted-foreground/45 select-none leading-none">
                  ◄ 40Hz (LOW FREQ)
                </div>
                <div className="absolute bottom-2 right-2 text-[7px] font-mono text-muted-foreground/45 select-none leading-none">
                  20kHz (LUSH FREQ) ►
                </div>
                <div className="absolute top-2 left-2 text-[7px] font-mono text-muted-foreground/45 select-none leading-none">
                  ▲ 35% RECEIVER HISS
                </div>
                <div className="absolute bottom-8 left-2 text-[7px] font-mono text-muted-foreground/45 select-none leading-none">
                  ▼ 0% RECEIVER HISS
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* OSCILLOSCOPE MONITOR WIDGET COUPLING WITH AUDIO ANALYSER */
function OscopeCanvas({ playing }: { playing: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const localAnalyser = analyser;
    const bufferLength = localAnalyser ? localAnalyser.fftSize / 2 : 128;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      const width = canvas.width;
      const height = canvas.height;

      // Dark background with trail fading effect
      ctx.fillStyle = "rgba(10, 5, 2, 0.22)";
      ctx.fillRect(0, 0, width, height);

      // Grid coordinate boxes
      ctx.strokeStyle = "rgba(255, 106, 0, 0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 106, 0, 0.08)";
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (playing && localAnalyser) {
        localAnalyser.getByteTimeDomainData(dataArray);

        ctx.strokeStyle = "rgba(255, 106, 0, 0.88)";
        ctx.shadowColor = "rgba(255, 106, 0, 0.65)";
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2.4;
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0; // reset glow shadow
      } else {
        // Idle heartbeat wobble animation
        ctx.strokeStyle = "rgba(255, 106, 0, 0.35)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);

        const segments = 50;
        const widthSlice = width / segments;
        for (let i = 0; i <= segments; i++) {
          let jitter = 0;
          if (playing) {
            // Simulated sine frequency
            jitter = Math.sin(i * 0.4 + Date.now() * 0.012) * 5;
          } else {
            // Ambient quiet wave jitter
            jitter = (Math.random() - 0.5) * 1.5;
          }
          ctx.lineTo(i * widthSlice, height / 2 + jitter);
        }
        ctx.stroke();
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [playing]);

  return (
    <div className="relative w-full h-[65px] bg-[#0b0401] rounded-xl overflow-hidden border border-border/15 shadow-inner shrink-0">
      <div className="absolute top-1.5 left-2 text-[8px] font-mono text-ember/50 tracking-wider select-none leading-none flex items-center gap-1">
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-ember opacity-75 ${
              playing ? "" : "hidden"
            }`}
          ></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-ember"></span>
        </span>
        CH-MONITOR-01
      </div>
      <div className="absolute top-1.5 right-2 text-[8px] font-mono text-ember/40 tracking-wider select-none leading-none">
        {playing ? "FM DYNAMIC FEED" : "RECEIVING STANDBY"}
      </div>
      <canvas ref={canvasRef} width={320} height={65} className="w-full h-full block" />
    </div>
  );
}
