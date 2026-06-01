import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { RAW_MAP_DATA } from "./world_map_data";
import { RainyCanvas } from "./RainyCanvas";
import {
  ensureStarted,
  setChannelVolume,
  setMasterVolume,
  setPaused,
  type ChannelId,
  initRadio,
  setRadioEffect,
  setRadioVolume,
  updateRetroSimulation,
  setRadioSource,
  playRadio,
  pauseRadio,
  getCtx,
  analyser,
} from "@/lib/ambient-engine";
import {
  Radio,
  LayoutGrid,
  Map as MapIcon,
  Compass,
  Plus,
  Music2,
  Wind,
  Waves,
  Settings,
  X,
  Moon,
  Sun,
  Heart,
  MoreHorizontal,
  CloudRain,
  Cloud,
  Train,
  Building2,
  Coffee,
  Disc3,
  SkipBack,
  SkipForward,
  Pause,
  Play,
  Volume2,
  VolumeX,
  AudioLines,
  Flame,
  Trees,
  Bell,
  Bug,
  Tv,
  Zap,
  EarOff,
  Speaker,
  Activity,
  PlayCircle,
  Search,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "motion/react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import japanNight from "@/assets/images/tokyo_nights_1779584981314.png";
import icelandImg from "@/assets/images/iceland_wind_1779570548430.png";
import keralaImg from "@/assets/images/kerala_monsoon_1779570567484.png";
import parisImg from "@/assets/images/paris_cafe_1779570585340.png";
import nycImg from "@/assets/images/new_york_rain_1779570609319.png";

import londonImg from "@/assets/images/london_underground_1779571524180.png";
import seoulImg from "@/assets/images/seoul_market_1779571551246.png";
import swissImg from "@/assets/images/swiss_alps_1779571571816.png";
import amazonImg from "@/assets/images/amazon_rainforest_1779571611379.png";
import saharaImg from "@/assets/images/sahara_dunes_1779571856838.png";
import romeImg from "@/assets/images/rome_piazza_1779571879001.png";
import kyotoImg from "@/assets/images/kyoto_bamboo_1779571901364.png";
import laImg from "@/assets/images/la_night_1779571922833.png";
import berlinImg from "@/assets/images/berlin_underground_1779571943138.png";
import maldivesImg from "@/assets/images/maldives_night_1779571966944.png";
import seattleImg from "@/assets/images/seattle_cafe_1779571987672.png";
import tvPlaceholderImg from "@/assets/images/retro_tv_placeholder_1779584546302.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VibeJungle — Global Ambient Radio" },
      {
        name: "description",
        content:
          "Tune into ambient radio from around the globe, layered with soothing environmental sounds. Rain, distant trains, café murmur, vinyl crackle.",
      },
    ],
  }),
  component: Index,
});

type EnvKey = ChannelId;

const ENV_ROWS: { key: EnvKey; label: string; icon: typeof CloudRain }[] = [
  { key: "rain", label: "Rain", icon: CloudRain },
  { key: "thunder", label: "Thunder", icon: Cloud },
  { key: "wind", label: "Night Wind", icon: Wind },
  { key: "ocean", label: "Ocean Waves", icon: Waves },
  { key: "forest", label: "Forest Birds", icon: Trees },
  { key: "crickets", label: "Crickets", icon: Bug },
  { key: "fireplace", label: "Fireplace", icon: Flame },
  { key: "cafe", label: "Cafe Murmur", icon: Coffee },
  { key: "train", label: "Distant Train", icon: Train },
  { key: "city", label: "City Ambience", icon: Building2 },
  { key: "chimes", label: "Wind Chimes", icon: Bell },
  { key: "vinyl", label: "Vinyl Crackle", icon: Disc3 },
];

const STATIONS = [
  {
    id: "kerala",
    title: "Kerala Monsoon",
    country: "India",
    timeZone: "Asia/Kolkata",
    desc: "Heavy rain on the backwaters. Distant thunder rolling.",
    tags: "Rain · Monsoon · Thunder",
    image: keralaImg,
    env: {
      rain: 90,
      thunder: 20,
      wind: 10,
      ocean: 10,
      forest: 0,
      crickets: 0,
      fireplace: 0,
      cafe: 0,
      train: 0,
      city: 0,
      chimes: 0,
      vinyl: 0,
    } as Record<EnvKey, number>,
  },
  {
    id: "japan",
    title: "Tokyo Nights FM",
    country: "Japan",
    timeZone: "Asia/Tokyo",
    desc: "City lights. Distant trains. Late night conversations.",
    tags: "Ambient · City · Night",
    image: japanNight,
    env: {
      rain: 0,
      thunder: 0,
      wind: 0,
      ocean: 0,
      forest: 0,
      crickets: 0,
      fireplace: 0,
      cafe: 10,
      train: 45,
      city: 30,
      chimes: 0,
      vinyl: 25,
    } as Record<EnvKey, number>,
  },
  {
    id: "iceland",
    title: "Reykjavík Winds",
    country: "Iceland",
    timeZone: "Atlantic/Reykjavik",
    desc: "Howling winds over the glacier. A crackling fire inside.",
    tags: "Wind · Cold · Fire",
    image: icelandImg,
    env: {
      rain: 0,
      thunder: 0,
      wind: 80,
      ocean: 0,
      forest: 0,
      crickets: 0,
      fireplace: 60,
      cafe: 0,
      train: 0,
      city: 0,
      chimes: 0,
      vinyl: 0,
    } as Record<EnvKey, number>,
  },
  {
    id: "paris",
    title: "Paris Cafe",
    country: "France",
    timeZone: "Europe/Paris",
    desc: "Murmur of voices, clinking coffee cups, a rainy evening.",
    tags: "Cafe · Rain · Relax",
    image: parisImg,
    env: {
      rain: 40,
      thunder: 0,
      wind: 0,
      ocean: 0,
      forest: 0,
      crickets: 0,
      fireplace: 0,
      cafe: 80,
      train: 0,
      city: 10,
      chimes: 0,
      vinyl: 10,
    } as Record<EnvKey, number>,
  },
  {
    id: "ny",
    title: "Brooklyn Rain",
    country: "NYC",
    timeZone: "America/New_York",
    desc: "Neon reflections and passing sirens. A rainy city night.",
    tags: "City · Rain · Night",
    image: nycImg,
    env: {
      rain: 60,
      thunder: 0,
      wind: 10,
      ocean: 0,
      forest: 0,
      crickets: 0,
      fireplace: 0,
      cafe: 0,
      train: 15,
      city: 60,
      chimes: 0,
      vinyl: 0,
    } as Record<EnvKey, number>,
  },
  {
    id: "london",
    title: "London Underground",
    country: "UK",
    timeZone: "Europe/London",
    desc: "Echoing platforms and the rumble of arriving trains.",
    tags: "Train · Ambient · City",
    image: londonImg,
    env: {
      rain: 10,
      thunder: 0,
      wind: 10,
      ocean: 0,
      forest: 0,
      crickets: 0,
      fireplace: 0,
      cafe: 0,
      train: 80,
      city: 30,
      chimes: 0,
      vinyl: 0,
    } as Record<EnvKey, number>,
  },
  {
    id: "seoul",
    title: "Seoul Night Market",
    country: "South Korea",
    timeZone: "Asia/Seoul",
    desc: "Sizzling street food, distant chatter, and soft rain.",
    tags: "City · Rain · Cafe",
    image: seoulImg,
    env: {
      rain: 30,
      thunder: 0,
      wind: 0,
      ocean: 0,
      forest: 0,
      crickets: 0,
      fireplace: 20,
      cafe: 60,
      train: 0,
      city: 50,
      chimes: 0,
      vinyl: 0,
    } as Record<EnvKey, number>,
  },
  {
    id: "swiss",
    title: "Swiss Alps Cabin",
    country: "Switzerland",
    timeZone: "Europe/Zurich",
    desc: "A howling blizzard outside, warmth from the crackling fire inside.",
    tags: "Wind · Fire · Cold",
    image: swissImg,
    env: {
      rain: 0,
      thunder: 0,
      wind: 90,
      ocean: 0,
      forest: 0,
      crickets: 0,
      fireplace: 80,
      cafe: 0,
      train: 0,
      city: 0,
      chimes: 10,
      vinyl: 0,
    } as Record<EnvKey, number>,
  },
  {
    id: "amazon",
    title: "Amazon Rainforest",
    country: "Brazil",
    timeZone: "America/Manaus",
    desc: "Heavy canopy rain, insects, and vibrant wildlife.",
    tags: "Rain · Forest · Crickets",
    image: amazonImg,
    env: {
      rain: 90,
      thunder: 15,
      wind: 5,
      ocean: 0,
      forest: 80,
      crickets: 70,
      fireplace: 0,
      cafe: 0,
      train: 0,
      city: 0,
      chimes: 0,
      vinyl: 0,
    } as Record<EnvKey, number>,
  },
  {
    id: "sahara",
    title: "Sahara Dunes",
    country: "Morocco",
    timeZone: "Africa/Casablanca",
    desc: "Relentless sand blowing across the dunes at dusk.",
    tags: "Wind · Ambient · Sand",
    image: saharaImg,
    env: {
      rain: 0,
      thunder: 0,
      wind: 85,
      ocean: 0,
      forest: 0,
      crickets: 0,
      fireplace: 0,
      cafe: 0,
      train: 0,
      city: 0,
      chimes: 0,
      vinyl: 20,
    } as Record<EnvKey, number>,
  },
  {
    id: "rome",
    title: "Rome Piazza",
    country: "Italy",
    timeZone: "Europe/Rome",
    desc: "Gentle evening showers hitting cobblestone streets.",
    tags: "City · Rain · Bells",
    image: romeImg,
    env: {
      rain: 40,
      thunder: 0,
      wind: 0,
      ocean: 0,
      forest: 0,
      crickets: 0,
      fireplace: 0,
      cafe: 20,
      train: 0,
      city: 40,
      chimes: 30,
      vinyl: 0,
    } as Record<EnvKey, number>,
  },
  {
    id: "kyoto",
    title: "Kyoto Bamboo Grove",
    country: "Japan",
    timeZone: "Asia/Tokyo",
    desc: "Wind rustling through tall bamboo, distant wind chimes.",
    tags: "Wind · Forest · Chimes",
    image: kyotoImg,
    env: {
      rain: 0,
      thunder: 0,
      wind: 50,
      ocean: 0,
      forest: 60,
      crickets: 40,
      fireplace: 0,
      cafe: 0,
      train: 0,
      city: 0,
      chimes: 50,
      vinyl: 0,
    } as Record<EnvKey, number>,
  },
  {
    id: "la",
    title: "Midnight Drive LA",
    country: "USA",
    timeZone: "America/Los_Angeles",
    desc: "Faint synthwave radio, highway wind, and city ambiance.",
    tags: "City · Wind · Vinyl",
    image: laImg,
    env: {
      rain: 0,
      thunder: 0,
      wind: 60,
      ocean: 0,
      forest: 0,
      crickets: 0,
      fireplace: 0,
      cafe: 0,
      train: 0,
      city: 70,
      chimes: 0,
      vinyl: 50,
    } as Record<EnvKey, number>,
  },
  {
    id: "berlin",
    title: "Berlin Underground",
    country: "Germany",
    timeZone: "Europe/Berlin",
    desc: "A desolate subway station with rumbling distant trains.",
    tags: "Train · City · Ambient",
    image: berlinImg,
    env: {
      rain: 0,
      thunder: 0,
      wind: 10,
      ocean: 0,
      forest: 0,
      crickets: 0,
      fireplace: 0,
      cafe: 0,
      train: 90,
      city: 20,
      chimes: 0,
      vinyl: 0,
    } as Record<EnvKey, number>,
  },
  {
    id: "maldives",
    title: "Bioluminescent Shore",
    country: "Maldives",
    timeZone: "Indian/Maldives",
    desc: "Gentle waves crashing on the beach at night.",
    tags: "Ocean · Night · Ambient",
    image: maldivesImg,
    env: {
      rain: 0,
      thunder: 0,
      wind: 20,
      ocean: 90,
      forest: 0,
      crickets: 0,
      fireplace: 0,
      cafe: 0,
      train: 0,
      city: 0,
      chimes: 0,
      vinyl: 0,
    } as Record<EnvKey, number>,
  },
  {
    id: "seattle",
    title: "Seattle Roast",
    country: "USA",
    timeZone: "America/Los_Angeles",
    desc: "Rain tapping on a coffee shop window in the Pacific Northwest.",
    tags: "Cafe · Rain · Relax",
    image: seattleImg,
    env: {
      rain: 60,
      thunder: 10,
      wind: 0,
      ocean: 0,
      forest: 0,
      crickets: 0,
      fireplace: 10,
      cafe: 70,
      train: 0,
      city: 10,
      chimes: 0,
      vinyl: 0,
    } as Record<EnvKey, number>,
  },
];

const TV_HUE_MAP: Record<string, string> = {
  japan: "hue-rotate(180deg) saturate(1.2) contrast(1.05)", // Neon magenta/purple
  iceland: "hue-rotate(100deg) brightness(0.9) saturate(0.8)", // Cool slate bluish-gray
  kerala: "hue-rotate(0deg) saturate(1.1)", // Original lush green matching forest/monsoon
  paris: "hue-rotate(320deg) sepia(0.2) saturate(1.0)", // Warm vintage wooden-amber-orange
  ny: "hue-rotate(120deg) saturate(1.0) brightness(0.95)", // Concrete blue-gray
  london: "hue-rotate(260deg) saturate(1.1)", // Reddish/dark maroon
  seoul: "hue-rotate(230deg) saturate(1.3)", // Vibrant neon pink/violet
  swiss: "hue-rotate(110deg) saturate(0.9) brightness(0.95)", // Alpine Navy / Glacier Slate matching slate-blue
  amazon: "hue-rotate(15deg) saturate(1.2)", // Extra lush forest green
  sahara: "hue-rotate(330deg) saturate(1.1) brightness(1.05)", // Desert sand-gold/terracotta
  rome: "hue-rotate(345deg) saturate(1.1) brightness(1.1)", // Sunny warm Roman ochre
  kyoto: "hue-rotate(350deg) saturate(0.9) sepia(0.1)", // Warm amber lantern wood
  la: "hue-rotate(210deg) saturate(1.4)", // Vaporwave warm orange-purple
  berlin: "hue-rotate(80deg) saturate(0.6) brightness(0.85)", // Dark industrial slate gray
  maldives: "hue-rotate(60deg) saturate(1.3)", // Tropical teal/cyan
  seattle: "hue-rotate(130deg) saturate(0.7) brightness(0.9)", // Sage rainy green-blue
};

const TV_CHANNELS = [
  {
    id: "cozy-retro-drive",
    title: "CH-02: SYNTH DRIVE",
    embedUrl:
      "https://www.youtube.com/embed/5qap5aO4i9A?autoplay=1&mute=0&loop=1&playlist=5qap5aO4i9A&controls=0&showinfo=0&rel=0&iv_load_policy=3&enablejsapi=1",
    hue: 0,
    contrast: 130,
    brightness: 110,
  },
  {
    id: "cyberpunk-rain",
    title: "CH-05: COZY CHILL",
    embedUrl:
      "https://www.youtube.com/embed/coYw-JDasgM?autoplay=1&mute=0&loop=1&playlist=coYw-JDasgM&controls=0&showinfo=0&rel=0&iv_load_policy=3&enablejsapi=1",
    hue: 15,
    contrast: 120,
    brightness: 105,
  },
  {
    id: "neon-gridscape",
    title: "CH-08: NEON HORIZON",
    embedUrl:
      "https://www.youtube.com/embed/f3p_99uP79Y?autoplay=1&mute=0&loop=1&playlist=f3p_99uP79Y&controls=0&showinfo=0&rel=0&iv_load_policy=3&enablejsapi=1",
    hue: -10,
    contrast: 140,
    brightness: 120,
  },
  {
    id: "lofi-cafe",
    title: "CH-12: RETRO ANIME",
    embedUrl:
      "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=0&loop=1&playlist=jfKfPfyJRdk&controls=0&showinfo=0&rel=0&iv_load_policy=3&enablejsapi=1",
    hue: 5,
    contrast: 115,
    brightness: 100,
  },
];

const RADIO_STATIONS_BY_LOC: Record<string, { freq: number; name: string; url: string }[]> = {
  kerala: [
    {
      freq: 88.5,
      name: "SomaFM Suburbs of Goa",
      url: "https://ice1.somafm.com/suburbsofgoa-128-mp3",
    },
    { freq: 91.2, name: "SomaFM Secret Agent", url: "https://ice1.somafm.com/secretagent-128-mp3" },
    { freq: 94.3, name: "SomaFM Drone Zone", url: "https://ice1.somafm.com/dronezone-128-mp3" },
    { freq: 98.3, name: "SomaFM Beat Blender", url: "https://ice1.somafm.com/beatblender-128-mp3" },
    { freq: 102.5, name: "SomaFM Dub Step Beyond", url: "https://ice1.somafm.com/dubstep-128-mp3" },
    { freq: 105.8, name: "SomaFM Fluid", url: "https://ice1.somafm.com/fluid-128-mp3" },
  ],
  japan: [
    { freq: 88.5, name: "SomaFM PopTron", url: "https://ice1.somafm.com/poptron-128-mp3" },
    { freq: 91.2, name: "SomaFM Vaporwaves", url: "https://ice1.somafm.com/vaporwaves-128-mp3" },
    { freq: 94.3, name: "SomaFM Groove Salad", url: "https://ice1.somafm.com/groovesalad-128-mp3" },
    { freq: 98.3, name: "SomaFM Cliqhop", url: "https://ice1.somafm.com/cliqhop-128-mp3" },
    { freq: 102.5, name: "SomaFM The Trip", url: "https://ice1.somafm.com/thetrip-128-mp3" },
    { freq: 105.8, name: "SomaFM Synphaera", url: "https://ice1.somafm.com/synphaera-128-mp3" },
  ],
  iceland: [
    {
      freq: 88.5,
      name: "SomaFM Deep Space One",
      url: "https://ice1.somafm.com/deepspaceone-128-mp3",
    },
    {
      freq: 91.2,
      name: "SomaFM Space Station",
      url: "https://ice1.somafm.com/spacestation-128-mp3",
    },
    { freq: 94.3, name: "SomaFM Lush", url: "https://ice1.somafm.com/lush-128-mp3" },
    {
      freq: 98.3,
      name: "SomaFM Mission Control",
      url: "https://ice1.somafm.com/missioncontrol-128-mp3",
    },
    { freq: 102.5, name: "SomaFM SF 10-33", url: "https://ice1.somafm.com/sf1033-128-mp3" },
    { freq: 105.8, name: "SomaFM Dark Skies", url: "https://ice1.somafm.com/darkskies-128-mp3" },
  ],
  scotland: [
    { freq: 88.5, name: "SomaFM ThistleRadio", url: "https://ice1.somafm.com/thistle-128-mp3" },
    {
      freq: 91.2,
      name: "SomaFM Illinois Street",
      url: "https://ice1.somafm.com/illstreet-128-mp3",
    },
    { freq: 94.3, name: "SomaFM Underground 80s", url: "https://ice1.somafm.com/u80s-128-mp3" },
    { freq: 98.3, name: "SomaFM Indie Pop Rocks", url: "https://ice1.somafm.com/indiepop-128-mp3" },
    { freq: 102.5, name: "SomaFM Folk Forward", url: "https://ice1.somafm.com/folkfwd-128-mp3" },
    { freq: 105.8, name: "SomaFM Boot Liquor", url: "https://ice1.somafm.com/bootliquor-128-mp3" },
  ],
};

const INITIAL_ENV: Record<EnvKey, number> = STATIONS[0].env;

function Index() {
  const [active, setActive] = useState("Now Playing");
  const [currentStation, setCurrentStation] = useState(STATIONS[0].id);
  const [effect, setEffect] = useState("NORMAL");
  const [env, setEnv] = useState<Record<EnvKey, number>>(INITIAL_ENV);
  const [activeEnvs, setActiveEnvs] = useState<EnvKey[]>(
    (Object.keys(INITIAL_ENV) as EnvKey[]).filter((k) => INITIAL_ENV[k] > 0),
  );
  const [fmFrequency, setFmFrequency] = useState(91.2);
  const [activeRadioStation, setActiveRadioStation] = useState("");

  const [showAddEnv, setShowAddEnv] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [master, setMaster] = useState(70);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(new Date());
  const startedRef = useRef(false);
  const [signal, setSignal] = useState(80);
  const [showSettings, setShowSettings] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [donateAmount, setDonateAmount] = useState<number | string>(15);
  const [customAmount, setCustomAmount] = useState("");
  const [donateFrequency, setDonateFrequency] = useState<"once" | "monthly">("monthly");
  const [donateState, setDonateState] = useState<"form" | "processing" | "success">("form");
  const [donateStepText, setDonateStepText] = useState("PEERING BEACONS...");
  const [showRainEffect, setShowRainEffect] = useState(false);
  const [tvOn, setTvOn] = useState(true);
  const [tvChannel, setTvChannel] = useState(0);
  const [tvVisualMode, setTvVisualMode] = useState(0); // 0: Vintage, 1: Cyberpunk Amber, 2: Matrix Green, 3: Mono Silver
  const [tvScanlineMode, setTvScanlineMode] = useState(0); // 0: Solid Retro, 1: Clean High-Res, 2: Cyber Grid
  const [crtOffAnim, setCrtOffAnim] = useState(false);
  const [tuningFuzz, setTuningFuzz] = useState(false);
  const [customTvUrl, setCustomTvUrl] = useState("");
  const [tvUrlInput, setTvUrlInput] = useState("");
  const [showTvReceiver, setShowTvReceiver] = useState(false);
  const [tempMusicUrl, setTempMusicUrl] = useState("");
  const [customMusicUrl, setCustomMusicUrl] = useState("");
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mixerTab, setMixerTab] = useState<"mixer" | "effects">("mixer");

  const [tvJitter, setTvJitter] = useState({
    flicker: 1.0,
    verticalShift: 0,
    vignetteIntensity: 0.15,
    noiseOpacity: 0.12,
    hSyncWarp: 0,
    rollingLineTop: -10,
  });

  useEffect(() => {
    if (!tvOn || crtOffAnim) return;

    let active = true;

    const runRandomEffects = () => {
      if (!active) return;

      const randomFlicker = 0.97 + Math.random() * 0.05;
      const randomNoise = 0.05 + Math.random() * 0.11;
      const randomRoll = Math.sin(Date.now() / 2000) * 60 + 50;
      const hasGlitch = Math.random() > 0.95;
      const randomShift = hasGlitch ? (Math.random() - 0.5) * 2.0 : 0;
      const randomWarp = hasGlitch ? (Math.random() - 0.5) * 3 : 0;

      setTvJitter({
        flicker: randomFlicker,
        verticalShift: randomShift,
        vignetteIntensity: 0.12 + Math.random() * 0.06,
        noiseOpacity: randomNoise,
        hSyncWarp: randomWarp,
        rollingLineTop: randomRoll,
      });

      const nextDelay = 40 + Math.random() * 120;
      setTimeout(runRandomEffects, nextDelay);
    };

    runRandomEffects();

    return () => {
      active = false;
    };
  }, [tvOn, crtOffAnim]);

  const getHudTheme = () => {
    switch (tvVisualMode) {
      case 0: // Vintage
        return {
          text: "text-amber-500/90",
          activeText: "text-amber-450 text-amber-400",
          placeholder: "placeholder:text-amber-950/60",
          border: "border-amber-500/25",
          focusBorder: "focus:border-amber-400/80",
          bg: "bg-amber-950/15",
          alertBg: "bg-amber-500/15",
          activeBg: "hover:bg-amber-500/20",
          line: "border-amber-500/20",
          btn: "border-amber-500/30 hover:bg-amber-500/15 text-amber-300",
        };
      case 1: // Amber
        return {
          text: "text-amber-500",
          activeText: "text-amber-300",
          placeholder: "placeholder:text-amber-950/60",
          border: "border-amber-500/30",
          focusBorder: "focus:border-amber-400",
          bg: "bg-amber-950/20",
          alertBg: "bg-amber-500/20",
          activeBg: "hover:bg-amber-500/25",
          line: "border-amber-500/20",
          btn: "border-amber-500/40 hover:bg-amber-500/25 text-amber-200",
        };
      case 2: // Matrix Green
        return {
          text: "text-emerald-500",
          activeText: "text-emerald-300",
          placeholder: "placeholder:text-emerald-950/60",
          border: "border-emerald-500/30",
          focusBorder: "focus:border-emerald-400",
          bg: "bg-emerald-950/20",
          alertBg: "bg-emerald-500/20",
          activeBg: "hover:bg-emerald-500/25",
          line: "border-emerald-500/20",
          btn: "border-emerald-500/40 hover:bg-emerald-500/25 text-emerald-200",
        };
      case 3: // Mono Slate
      default:
        return {
          text: "text-neutral-400",
          activeText: "text-neutral-200",
          placeholder: "placeholder:text-neutral-800",
          border: "border-neutral-700/45",
          focusBorder: "focus:border-neutral-500",
          bg: "bg-neutral-900/20",
          alertBg: "bg-neutral-800/60",
          activeBg: "hover:bg-neutral-800/40",
          line: "border-neutral-800",
          btn: "border-neutral-700 hover:bg-neutral-850 text-neutral-200",
        };
    }
  };

  const handleTuneCustomTv = () => {
    if (!tvUrlInput.trim()) return;
    setTuningFuzz(true);

    let embedSrc = "";
    const trimmed = tvUrlInput.trim();
    try {
      if (trimmed.includes("youtube.com") || trimmed.includes("youtu.be")) {
        let videoId = "";
        let listId = "";

        if (trimmed.includes("list=")) {
          const match = trimmed.match(/[?&]list=([^#&?]+)/);
          if (match) listId = match[1];
        }

        if (trimmed.includes("v=")) {
          const match = trimmed.match(/[?&]v=([^#&?]+)/);
          if (match) videoId = match[1];
        }

        if (trimmed.includes("youtu.be/")) {
          const parts = trimmed.split("youtu.be/");
          if (parts[1]) {
            videoId = parts[1].split(/[?#&]/)[0];
          }
        }

        if (trimmed.includes("/shorts/")) {
          const match = trimmed.match(/\/shorts\/([^#&?]+)/);
          if (match) videoId = match[1];
        }

        if (trimmed.includes("/embed/")) {
          const match = trimmed.match(/\/embed\/([^#&?]+)/);
          if (match) videoId = match[1];
        }

        if (listId) {
          embedSrc = `https://www.youtube.com/embed/videoseries?list=${listId}&autoplay=1&mute=0&enablejsapi=1`;
        } else if (videoId) {
          embedSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&enablejsapi=1`;
        }
      } else {
        embedSrc = trimmed;
      }
    } catch (e) {
      console.error("Error parsing custom YT TV URL:", e);
    }

    if (embedSrc) {
      setCustomTvUrl(embedSrc);
      if (!tvOn) setTvOn(true);
    }

    setTimeout(() => {
      setTuningFuzz(false);
    }, 350);
  };

  const handleTvToggle = () => {
    if (tvOn) {
      setCrtOffAnim(true);
      setTimeout(() => {
        setTvOn(false);
        setCrtOffAnim(false);
      }, 450);
    } else {
      setTvOn(true);
    }
  };

  const handleTvVisualModeToggle = () => {
    if (!tvOn || crtOffAnim) return;
    setTuningFuzz(true);
    setTvVisualMode((prev) => (prev + 1) % 4);
    setTimeout(() => {
      setTuningFuzz(false);
    }, 250);
  };

  const handleTvScanlineToggle = () => {
    if (!tvOn || crtOffAnim) return;
    setTuningFuzz(true);
    setTvScanlineMode((prev) => (prev + 1) % 3);
    setTimeout(() => {
      setTuningFuzz(false);
    }, 150);
  };

  const handleChannelChange = () => {
    if (!tvOn || crtOffAnim) return;
    setTuningFuzz(true);
    setTvChannel((prev) => (prev + 1) % TV_CHANNELS.length);
    setTimeout(() => {
      setTuningFuzz(false);
    }, 350);
  };

  const embedUrl = (() => {
    try {
      const trimmed = customMusicUrl.trim();
      if (!trimmed) return "";

      if (trimmed.includes("spotify.com")) {
        const match = trimmed.match(/spotify\.com\/(track|playlist|album|episode)\/([a-zA-Z0-9]+)/);
        if (match) {
          return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator`;
        }
      }

      if (trimmed.includes("youtube.com") || trimmed.includes("youtu.be")) {
        let videoId = "";
        let listId = "";

        if (trimmed.includes("list=")) {
          const match = trimmed.match(/[?&]list=([^#&?]+)/);
          if (match) listId = match[1];
        }

        if (trimmed.includes("v=")) {
          const match = trimmed.match(/[?&]v=([^#&?]+)/);
          if (match) videoId = match[1];
        }

        if (trimmed.includes("youtu.be/")) {
          const parts = trimmed.split("youtu.be/");
          if (parts[1]) {
            videoId = parts[1].split(/[?#&]/)[0];
          }
        }

        if (trimmed.includes("/shorts/")) {
          const match = trimmed.match(/\/shorts\/([^#&?]+)/);
          if (match) videoId = match[1];
        }

        if (trimmed.includes("/embed/")) {
          const match = trimmed.match(/\/embed\/([^#&?]+)/);
          if (match) videoId = match[1];
        }

        if (listId) {
          return `https://www.youtube.com/embed/videoseries?list=${listId}&autoplay=1&enablejsapi=1`;
        }
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
        }
      }
    } catch (e) {
      console.error("Error parsing custom URL:", e);
    }
    return "";
  })();

  // Sync temp input state when system settings dialog is opened
  useEffect(() => {
    if (showSettings) {
      setTempMusicUrl(customMusicUrl);
    }
  }, [showSettings, customMusicUrl]);

  useEffect(() => {
    if (startedRef.current) {
      setMasterVolume(muted ? 0 : master / 100);
    }
  }, [master, muted]);

  // Sync radio station based on manual FM tuner
  useEffect(() => {
    if (!startedRef.current) return;

    if (customMusicUrl || (tvOn && !crtOffAnim)) {
      setRadioVolume(0);
      return;
    }

    const locStations = RADIO_STATIONS_BY_LOC[currentStation] || RADIO_STATIONS_BY_LOC["japan"];
    const closest = locStations.reduce((prev, curr) => {
      return Math.abs(curr.freq - fmFrequency) < Math.abs(prev.freq - fmFrequency) ? curr : prev;
    });

    // If within 0.3 MHz tolerance, "tune" into it
    if (Math.abs(closest.freq - fmFrequency) <= 0.3) {
      setActiveRadioStation(closest.name);
      setRadioSource(closest.url);
      // Volume scales down if slightly off-center (simulate imperfect tuning)
      const dist = Math.abs(closest.freq - fmFrequency);
      const tuneVol = Math.max(0, 1 - dist / 0.35); // 1.0 when perfectly dead-center

      const targetVol = muted ? 0 : (signal / 100) * tuneVol;
      setRadioVolume(targetVol);

      // If we are somewhat far off center, introduce static via effects
      if (dist > 0.15) {
        setRadioEffect("STATIC");
      } else {
        setRadioEffect(effect);
      }
    } else {
      // Out of bounds -> dead static / empty frequency
      setActiveRadioStation("");
      setRadioVolume(0);
    }
  }, [
    fmFrequency,
    playing,
    master,
    muted,
    effect,
    currentStation,
    customMusicUrl,
    tvOn,
    crtOffAnim,
    signal,
  ]);

  useEffect(() => {
    if (startedRef.current) {
      if (playing) {
        playRadio();
      } else {
        pauseRadio();
      }
    }
  }, [playing]);

  useEffect(() => {
    if (startedRef.current) {
      setRadioEffect(effect);
      updateRetroSimulation(
        playing && (!!customMusicUrl || (tvOn && !crtOffAnim)),
        effect,
        muted ? 0 : master / 100,
      );
    }
  }, [effect, playing, customMusicUrl, tvOn, crtOffAnim, master, muted]);

  const getIframeFilterClass = () => {
    switch (effect) {
      case "DISTANT":
        return "brightness-[0.70] contrast-[0.90] saturate-[0.70] blur-[0.6px] transition-all duration-500 scale-[0.98]";
      case "TV":
        return "brightness-[1.05] contrast-[1.25] saturate-[1.35] sepia-[0.10] animate-[pulse_4s_infinite] transition-all duration-500";
      case "MUFFLED":
        return "brightness-[0.55] saturate-[0.45] contrast-[0.95] blur-[2.4px] transition-all duration-500 scale-[0.95]";
      case "STATIC":
        return "brightness-[0.75] contrast-[1.40] saturate-[0.30] grayscale-[0.3] blur-[0.4px] transition-all duration-500";
      case "REVERB":
        return "brightness-[0.80] contrast-[0.95] saturate-[0.80] blur-[0.2px] transition-all duration-500";
      default:
        return "transition-all duration-500";
    }
  };

  const postToYoutube = (iframeId: string, func: string, args: unknown[] = []) => {
    try {
      const iframe = document.getElementById(iframeId) as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func, args }), "*");
      }
    } catch (e) {
      // Ignore
    }
  };

  // Synchronize both TV and custom feed YouTube players' volume and play/pause state relative to physical filters and reception system settings
  useEffect(() => {
    const syncYoutubeStates = () => {
      // 1. Sync External Feed iframe (custom music)
      if (customMusicUrl) {
        if (playing) {
          const baseVol = muted ? 0 : (master / 100) * (signal / 100) * 100;
          let multiplier = 1.0;
          switch (effect) {
            case "DISTANT":
              multiplier = 0.35;
              break;
            case "TV":
              multiplier = 0.75;
              break;
            case "MUFFLED":
              multiplier = 0.15;
              break;
            case "STATIC":
              multiplier = 0.25;
              break;
            case "REVERB":
              multiplier = 0.65;
              break;
            default:
              multiplier = 1.0;
          }
          const volValue = Math.round(baseVol * multiplier);
          postToYoutube("external-feed-iframe", "setVolume", [volValue]);
          postToYoutube("external-feed-iframe", "playVideo");
        } else {
          postToYoutube("external-feed-iframe", "pauseVideo");
          postToYoutube("external-feed-iframe", "setVolume", [0]);
        }
      }

      // 2. Sync Retro TV iframe
      if (tvOn && !crtOffAnim) {
        if (customMusicUrl) {
          // If custom music is playing, the retro TV should play muted in background
          postToYoutube("retro-tv-iframe", "setVolume", [0]);
          if (playing) {
            postToYoutube("retro-tv-iframe", "playVideo");
          } else {
            postToYoutube("retro-tv-iframe", "pauseVideo");
          }
        } else {
          // No external feed, so retro TV is the active audio source
          if (playing) {
            const baseVol = muted ? 0 : (master / 100) * (signal / 100) * 100;
            let multiplier = 1.0;
            switch (effect) {
              case "DISTANT":
                multiplier = 0.35;
                break;
              case "TV":
                multiplier = 0.75;
                break;
              case "MUFFLED":
                multiplier = 0.15;
                break;
              case "STATIC":
                multiplier = 0.25;
                break;
              case "REVERB":
                multiplier = 0.65;
                break;
              default:
                multiplier = 1.0;
            }
            const volValue = Math.round(baseVol * multiplier);
            postToYoutube("retro-tv-iframe", "setVolume", [volValue]);
            postToYoutube("retro-tv-iframe", "playVideo");
          } else {
            postToYoutube("retro-tv-iframe", "pauseVideo");
            postToYoutube("retro-tv-iframe", "setVolume", [0]);
          }
        }
      } else {
        postToYoutube("retro-tv-iframe", "pauseVideo");
        postToYoutube("retro-tv-iframe", "setVolume", [0]);
      }
    };

    syncYoutubeStates();
    // Run multiple times as the iframe takes time to load and mount
    const t1 = setTimeout(syncYoutubeStates, 300);
    const t2 = setTimeout(syncYoutubeStates, 800);
    const t3 = setTimeout(syncYoutubeStates, 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [
    playing,
    master,
    signal,
    effect,
    customMusicUrl,
    embedUrl,
    muted,
    tvOn,
    crtOffAnim,
    tvChannel,
    customTvUrl,
  ]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      let target = e.target as HTMLElement;
      while (target && target !== document.body) {
        if (target.tagName === "BUTTON" || target.closest("button")) {
          playClickSound();
          break;
        }
        target = target.parentElement as HTMLElement;
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted]);

  const playClickSound = () => {
    if (muted) return;
    try {
      const AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "square";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    if (currentStation === "japan") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", currentStation);
    }
  }, [currentStation]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const togglePlay = async () => {
    await ensureStarted();
    if (!startedRef.current) {
      initRadio();
      // wire initial volumes once context is live
      (Object.keys(env) as EnvKey[]).forEach((k) => setChannelVolume(k, env[k] / 100));
      setMasterVolume(master / 100);
      setRadioEffect(effect);
      setRadioVolume(signal / 100);
      startedRef.current = true;
    }
    const next = !playing;
    await setPaused(!next);
    setPlaying(next);
  };

  const handleNext = () => {
    if (tvOn && !crtOffAnim) {
      handleChannelChange();
    } else {
      const idx = STATIONS.findIndex((s) => s.id === currentStation);
      const nextIdx = (idx + 1) % STATIONS.length;
      onSelectStation(STATIONS[nextIdx].id);
    }
  };

  const handlePrev = () => {
    if (tvOn && !crtOffAnim) {
      setTuningFuzz(true);
      setTvChannel((prev) => (prev - 1 + TV_CHANNELS.length) % TV_CHANNELS.length);
      setTimeout(() => setTuningFuzz(false), 200);
    } else {
      const idx = STATIONS.findIndex((s) => s.id === currentStation);
      const prevIdx = (idx - 1 + STATIONS.length) % STATIONS.length;
      onSelectStation(STATIONS[prevIdx].id);
    }
  };

  const handleStartDonate = () => {
    setDonateState("processing");
    setDonateStepText("CONSTRUCTING SECURE EMBER CHANNEL...");

    setTimeout(() => {
      setDonateStepText("COMMENCING ENCRYPTED VALUE ROUTING...");
    }, 1200);

    setTimeout(() => {
      setDonateStepText("TRANSMITTING COZY ATMOSPHERES...");
    }, 2400);

    setTimeout(() => {
      setDonateStepText("TRANSMISSION HARMONIZED! THANK YOU!");
    }, 3600);

    setTimeout(() => {
      setDonateState("success");
    }, 4500);
  };

  const onEnvChange = async (key: EnvKey, value: number) => {
    setEnv((v) => ({ ...v, [key]: value }));
    if (!startedRef.current) {
      await ensureStarted();
      initRadio();
      (Object.keys(env) as EnvKey[]).forEach((k) =>
        setChannelVolume(k, (k === key ? value : env[k]) / 100),
      );
      setMasterVolume(master / 100);
      setRadioEffect(effect);
      setRadioVolume(signal / 100);
      startedRef.current = true;
      setPlaying(true);
    } else {
      setChannelVolume(key, value / 100);
    }
  };

  const onSelectStation = async (id: string, stayOnCurrentTab = false) => {
    if (!stayOnCurrentTab) {
      setActive("Now Playing");
    }
    setCurrentStation(id);
    const station = STATIONS.find((s) => s.id === id)!;
    setEnv(station.env);

    const activeKeys = (Object.keys(station.env) as EnvKey[]).filter((k) => station.env[k] > 0);
    setActiveEnvs(activeKeys);

    if (startedRef.current) {
      (Object.keys(station.env) as EnvKey[]).forEach((k) => {
        setChannelVolume(k, station.env[k] / 100);
      });
      if (!playing) {
        await setPaused(false);
        setPlaying(true);
      }
    } else {
      await ensureStarted();
      initRadio();
      startedRef.current = true;
      (Object.keys(station.env) as EnvKey[]).forEach((k) => {
        setChannelVolume(k, station.env[k] / 100);
      });
      setMasterVolume(master / 100);
      setRadioEffect(effect);
      setRadioVolume(signal / 100);
      await setPaused(false);
      setPlaying(true);
    }
  };

  const onAddEnv = (key: EnvKey) => {
    if (!activeEnvs.includes(key)) {
      setActiveEnvs((prev) => [...prev, key]);
      onEnvChange(key, 50);
    }
    setShowAddEnv(false);
  };

  const onMasterChange = (v: number) => {
    setMaster(v);
    if (startedRef.current) setMasterVolume(v / 100);
  };

  useEffect(
    () => () => {
      setPaused(true);
    },
    [],
  );

  const nav = [
    { label: "Now Playing", icon: Radio },
    { label: "Stations", icon: LayoutGrid },
    { label: "Map", icon: MapIcon },
    { label: "Discover", icon: Compass },
  ];

  const favorites = [
    { label: "Tokyo Nights", id: "japan", icon: Building2 },
    { label: "Reykjavík Winds", id: "iceland", icon: Wind },
    { label: "Kerala Monsoon", id: "kerala", icon: Waves },
    { label: "Paris Cafe", id: "paris", icon: Coffee },
  ];

  const effects = [
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
      icon: Activity,
      desc: "Atmosphere-expanding metallic reverberation chamber.",
    },
  ];

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <main className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-5 p-4 lg:p-5 pb-[calc(9rem+env(safe-area-inset-bottom))] lg:pb-28 min-h-0 overflow-y-auto lg:overflow-hidden relative">
        {/* SIDEBAR */}
        <aside className="hidden lg:flex col-span-2 flex-col gap-6 overflow-y-auto">
          <div className="flex flex-col items-center pt-3">
            <AudioLines className="h-7 w-7 ember-text" strokeWidth={1.5} />
            <h1 className="mt-2 font-display text-2xl tracking-wide ember-text uppercase">
              VibeJungle
            </h1>
            <p className="text-[10px] tracking-[0.3em] text-muted-foreground">GLOBAL RADIO</p>
          </div>

          <nav className="flex flex-col gap-1">
            <p className="text-[10px] tracking-[0.25em] text-muted-foreground px-3 mb-1">EXPLORE</p>
            {nav.map(({ label, icon: Icon }) => {
              const on = active === label;
              return (
                <button
                  key={label}
                  onClick={() => setActive(label)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    on
                      ? "bg-secondary/60 ember-text"
                      : "text-foreground/70 hover:text-foreground hover:bg-secondary/30"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between px-3 mb-1">
              <p className="text-[10px] tracking-[0.25em] text-muted-foreground">FAVORITES</p>
              <button className="text-muted-foreground hover:text-foreground">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            {favorites.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onSelectStation(id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  currentStation === id && active === "Now Playing"
                    ? "bg-secondary/50 text-foreground"
                    : "text-foreground/70 hover:text-foreground hover:bg-secondary/30"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-2.5 px-3 border-t border-border/20 pt-4">
            <button
              onClick={() => {
                setShowDonate(true);
                setDonateState("form");
              }}
              className="group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold text-background bg-ember hover:bg-ember-glow transition shadow-md shadow-ember/15 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Heart
                  className="h-3.5 w-3.5 text-background fill-background animate-pulse"
                  strokeWidth={2}
                />
                <span>Donate</span>
              </span>
              <span className="text-[9px] opacity-75 font-mono">STATION AID</span>
            </button>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/20 flex items-center gap-2 text-[10px] uppercase font-mono cursor-pointer"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </aside>

        {/* CENTER CONSOLE */}
        <section
          className={`col-span-1 lg:col-span-7 flex-col min-h-0 ${
            active === "Stations" || active === "Now Playing" ? "flex" : "hidden"
          }`}
        >
          <div className="bezel rounded-3xl p-4 lg:p-5 flex flex-col gap-4 flex-1 overflow-visible lg:overflow-y-auto hidden-scrollbar">
            {active === "Stations" ? (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4 px-2">
                  <p className="text-[10px] tracking-[0.3em] text-foreground/70">ALL STATIONS</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {STATIONS.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => onSelectStation(st.id)}
                      className={`group relative rounded-xl overflow-hidden aspect-video border text-left flex flex-col justify-end p-4 transition-all ${
                        currentStation === st.id
                          ? "border-amber/70 ring-1 ring-ember/50"
                          : "border-border/60 hover:border-ember/40 hover:shadow-lg"
                      }`}
                    >
                      <img
                        src={st.image}
                        alt={st.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
                      <div className="relative flex items-center justify-between">
                        <div>
                          <p className="font-display text-xl text-foreground leading-none mb-1">
                            {st.title}
                          </p>
                          <p className="text-xs text-foreground/80 tracking-wide">{st.country}</p>
                        </div>
                        {currentStation === st.id && playing ? (
                          <div className="h-8 w-8 rounded-full bg-ember/20 text-ember grid place-items-center backdrop-blur-md">
                            <AudioLines className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-foreground/10 text-foreground/80 grid place-items-center opacity-0 group-hover:opacity-100 backdrop-blur-md transition">
                            <PlayCircle className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Now Playing card */}
                {(() => {
                  const st = STATIONS.find((s) => s.id === currentStation)!;
                  return (
                    <div className="relative rounded-2xl overflow-hidden border border-border/60">
                      <img
                        src={st.image}
                        alt={`${st.country} at night`}
                        width={1280}
                        height={640}
                        className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
                          showRainEffect
                            ? "opacity-50 brightness-[0.40] saturate-[0.60] contrast-[1.05]"
                            : "opacity-90 brightness-[0.80] saturate-[0.85] contrast-[1.05]"
                        }`}
                      />
                      {showRainEffect && <RainyCanvas imageUrl={st.image} />}
                      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-background/15 pointer-events-none" />
                      <div className="relative p-5 sm:p-7 min-h-[220px] sm:min-h-[260px] flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                          <p className="text-[10px] tracking-[0.3em] text-foreground/70">
                            NOW PLAYING
                          </p>
                          <div className="flex items-center gap-3 text-xs tracking-[0.2em] font-mono">
                            <span className="text-foreground/80">
                              {time.toLocaleTimeString("en-US", {
                                timeZone: st.timeZone,
                                hour12: false,
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </span>
                            <div className="flex items-center gap-2">
                              {playing ? (
                                <>
                                  <span className="live-dot h-1.5 w-1.5 rounded-full bg-ember ember-glow" />
                                  <span className="ember-text font-sans hidden sm:inline">
                                    LIVE
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                                  <span className="text-muted-foreground font-sans hidden sm:inline">
                                    PAUSED
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-6 sm:mt-0">
                          <h2 className="font-display text-4xl sm:text-6xl ember-text leading-none">
                            {st.country}
                          </h2>
                          <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-light text-foreground">
                            {st.title}
                          </p>
                          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-foreground/60 max-w-md line-clamp-2">
                            {st.desc}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 pt-4">
                          <button className="h-8 w-8 sm:h-9 sm:w-9 grid place-items-center rounded-full border border-border/60 text-foreground/70 hover:text-ember hover:border-ember/60 transition">
                            <Heart className="h-4 w-4" />
                          </button>
                          <p className="text-[10px] sm:text-xs text-foreground/60 tracking-wide line-clamp-1">
                            {st.tags}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Tuner dial */}
                <div className="hidden sm:block">
                  <TunerDial
                    value={fmFrequency}
                    onChange={setFmFrequency}
                    activeStationInfo={activeRadioStation}
                  />
                </div>

                {/* Knobs + VU */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 items-center px-2 pt-2">
                  <InteractiveKnob
                    label="SIGNAL"
                    left="DISTANT"
                    right="NEAR"
                    value={signal}
                    onChange={setSignal}
                    muted={muted}
                  />
                  <div className="hidden sm:block">
                    <VisualizerPanel playing={playing} activeStationInfo={activeRadioStation} />
                  </div>
                  <InteractiveKnob
                    label="VOLUME"
                    left="−"
                    right="+"
                    value={master}
                    onChange={setMaster}
                    muted={muted}
                  />
                </div>

                {/* Speaker grille */}
                <div className="hidden sm:block grille rounded-xl h-16 mt-2 relative">
                  <span className="absolute right-3 bottom-2 text-[10px] tracking-[0.3em] text-foreground/40 uppercase">
                    VIBEJUNGLE
                  </span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN */}
        <aside
          className={`col-span-1 lg:col-span-3 flex-col gap-5 min-h-0 ${
            active === "Now Playing" ? "flex" : active === "Stations" ? "hidden lg:flex" : "hidden"
          }`}
        >
          {/* TV Section */}
          <div className="bezel rounded-2xl p-4 lg:p-5 shrink-0 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase font-semibold">
                  TV
                </p>
                {tvOn && !crtOffAnim && (
                  <span className="text-[9px] font-mono font-bold text-ember animate-pulse bg-ember/10 px-1.5 py-0.5 rounded border border-ember/30">
                    {customTvUrl ? "CH-YT: CUSTOM TUNE" : TV_CHANNELS[tvChannel].title}
                  </span>
                )}
              </div>
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-ember ember-glow animate-pulse" />
            </div>

            {/* Vintage CRT Cabinet */}
            <div className="relative w-full aspect-[3/2] overflow-hidden bg-transparent group">
              {/* SCREEN AREA UNDER THE CUTOUT */}
              <div
                className="absolute overflow-hidden bg-black"
                style={{
                  left: "9.64%",
                  top: "13.87%",
                  width: "63.54%",
                  height: "65.14%",
                  borderRadius: "10.5% / 15.5%",
                  boxShadow: "inset 0 0 20px rgba(0,0,0,0.95), inset 0 0 5px rgba(0,0,0,1)",
                }}
              >
                {tvOn && !crtOffAnim ? (
                  <motion.div
                    key="crt-screen-active"
                    initial={{
                      scaleX: 0.15,
                      scaleY: 0.003,
                      opacity: 0.5,
                      filter: "brightness(3.5) contrast(1.5)",
                    }}
                    animate={{
                      scaleX: 1,
                      scaleY: [0.003, 0.003, 1],
                      opacity: 1,
                      filter: [
                        "brightness(3.5) contrast(1.5)",
                        "brightness(2) contrast(1.2)",
                        "brightness(1) contrast(1)",
                      ],
                    }}
                    transition={{
                      duration: 0.65,
                      times: [0, 0.4, 1],
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="relative w-full h-full select-none"
                    style={{
                      transform: `translateX(${tvJitter.verticalShift}px) skewX(${tvJitter.hSyncWarp}deg)`,
                    }}
                  >
                    {/* The YouTube background video feed */}
                    <iframe
                      id="retro-tv-iframe"
                      src={customTvUrl || TV_CHANNELS[tvChannel].embedUrl}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      allow="autoplay; encrypted-media"
                      className="w-full h-full pointer-events-auto scale-[1.05]"
                      style={{
                        filter: (() => {
                          const base = `contrast(${TV_CHANNELS[tvChannel].contrast}%) brightness(${TV_CHANNELS[tvChannel].brightness * tvJitter.flicker}%) hue-rotate(${TV_CHANNELS[tvChannel].hue}deg) saturate(120%)`;
                          if (tvVisualMode === 0) return `${base} contrast(110%) sepia(10%)`;
                          if (tvVisualMode === 1)
                            return `${base} grayscale(100%) sepia(100%) hue-rotate(-20deg) saturate(350%) contrast(140%) brightness(100%)`;
                          if (tvVisualMode === 2)
                            return `${base} grayscale(100%) sepia(100%) hue-rotate(85deg) saturate(450%) contrast(150%) brightness(95%)`;
                          if (tvVisualMode === 3)
                            return `${base} grayscale(100%) contrast(145%) brightness(90%)`;
                          return base;
                        })(),
                      }}
                    />

                    {/* Phosphor warm-up flash overlay */}
                    <motion.div
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 0.45, delay: 0.25 }}
                      className="absolute inset-0 bg-white z-20 pointer-events-none mix-blend-screen"
                    />

                    {/* Scanline pattern overlay */}
                    <div
                      className={`absolute inset-0 pointer-events-none z-10 transition-all duration-300 ${
                        tvScanlineMode === 0
                          ? "bg-[linear-gradient(rgba(18,16,16,0)_40%,rgba(0,0,0,0.3)_40%)] bg-[size:100%_4px]"
                          : tvScanlineMode === 1
                            ? "bg-[linear-gradient(rgba(18,16,16,0)_60%,rgba(0,0,0,0.15)_60%)] bg-[size:100%_2px]"
                            : "bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.22)_50%),linear-gradient(90deg,rgba(18,16,16,0)_50%,rgba(0,0,0,0.12)_50%)] bg-[size:100%_4px,3px_100%]"
                      }`}
                    />

                    {/* Procedural dynamic grain/noise overlay (Randomized over time) */}
                    <div
                      className="absolute inset-0 pointer-events-none z-10 opacity-[0.09] mix-blend-overlay"
                      style={{
                        opacity: tvJitter.noiseOpacity,
                        backgroundImage:
                          Math.random() > 0.5
                            ? "radial-gradient(#fff 20%, transparent 20%)"
                            : "radial-gradient(#fff 25%, transparent 25%)",
                        backgroundSize: Math.random() > 0.5 ? "3px 3px" : "2px 2px",
                      }}
                    />

                    {/* Wandering horizontal scanline rolling band (randomized vertical hold) */}
                    <div
                      className="absolute inset-x-0 h-8 bg-white/5 blur-[3px] pointer-events-none z-10 mix-blend-overlay"
                      style={{
                        top: `${tvJitter.rollingLineTop}%`,
                      }}
                    />

                    {/* Vintage Phosphor glow & screen tint */}
                    <div
                      className={`absolute inset-0 pointer-events-none z-10 mix-blend-color-burn transition-all duration-300 ${
                        tvVisualMode === 0
                          ? "bg-[radial-gradient(circle,rgba(255,106,0,0.08)_0%,rgba(0,0,0,0.5)_110%)]"
                          : tvVisualMode === 1
                            ? "bg-[radial-gradient(circle,rgba(245,158,11,0.15)_0%,rgba(0,0,0,0.6)_110%)]"
                            : tvVisualMode === 2
                              ? "bg-[radial-gradient(circle,rgba(16,185,129,0.15)_0%,rgba(0,0,0,0.6)_110%)]"
                              : "bg-[radial-gradient(circle,rgba(255,255,255,0.05)_0%,rgba(0,0,0,0.5)_110%)]"
                      }`}
                    />

                    {/* Visual mode color wash overlay */}
                    {tvVisualMode === 1 && (
                      <div className="absolute inset-0 bg-amber-500/5 z-10 pointer-events-none mix-blend-color-dodge animate-pulse" />
                    )}
                    {tvVisualMode === 2 && (
                      <div className="absolute inset-0 bg-emerald-500/5 z-10 pointer-events-none mix-blend-color-dodge animate-pulse" />
                    )}

                    {/* Retro On-Screen HUD Console Menu (Manual custom frequency tuner) */}
                    {showTvReceiver && (
                      <div
                        className={`absolute inset-0 select-text p-4 flex flex-col justify-between z-20 font-mono ${
                          getHudTheme().text
                        } bg-black/95 backdrop-blur-sm pointer-events-auto transition-all duration-300 animate-fade-in`}
                      >
                        {/* Upper Header strip */}
                        <div
                          className={`flex items-center justify-between border-b ${getHudTheme().line} pb-1.5`}
                        >
                          <div
                            className={`flex items-center gap-1.5 text-[8px] md:text-[10px] uppercase font-bold tracking-widest ${
                              getHudTheme().activeText
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                tvVisualMode === 0
                                  ? "bg-amber-500"
                                  : tvVisualMode === 1
                                    ? "bg-amber-400"
                                    : tvVisualMode === 2
                                      ? "bg-emerald-400"
                                      : "bg-neutral-400"
                              } animate-pulse`}
                            />
                            [ MANUAL FREQUENCY TUNER ]
                          </div>
                          <button
                            onClick={() => setShowTvReceiver(false)}
                            className="text-[9px] px-1.5 py-0.5 border border-neutral-700 hover:border-neutral-500 rounded transition-colors uppercase font-bold"
                          >
                            Close [×]
                          </button>
                        </div>

                        {/* Middle Tuning Instructions & Input area */}
                        <div className="flex flex-col gap-1 my-auto">
                          <p className="text-[8px] md:text-[9.5px] opacity-80 leading-relaxed font-sans">
                            Inject direct video coordinate streams onto this terminal overlay. Key
                            in details below:
                          </p>

                          {/* URL input field row */}
                          <div className="flex gap-1.5 mt-1">
                            <input
                              type="text"
                              placeholder="youtube.com/watch?v=..."
                              value={tvUrlInput}
                              onChange={(e) => setTvUrlInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleTuneCustomTv();
                                  setShowTvReceiver(false);
                                }
                              }}
                              className={`flex-1 text-[9px] md:text-[10px] ${getHudTheme().bg} border ${
                                getHudTheme().border
                              } ${getHudTheme().focusBorder} rounded px-2 py-1 text-white focus:outline-none`}
                            />
                            <button
                              onClick={() => {
                                handleTuneCustomTv();
                                setShowTvReceiver(false);
                              }}
                              className={`px-3 py-1 ${getHudTheme().btn} rounded text-[9px] md:text-[10px] font-bold tracking-wider transition-colors`}
                            >
                              TUNE
                            </button>
                          </div>
                        </div>

                        {/* Lower quick presets list & scanline fine-tune */}
                        <div
                          className={`border-t ${getHudTheme().line} pt-1.5 flex flex-col gap-1`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[7.5px] uppercase tracking-wider opacity-60 font-bold">
                              Presets:
                            </span>
                            {customTvUrl && (
                              <button
                                onClick={() => {
                                  setTuningFuzz(true);
                                  setCustomTvUrl("");
                                  setTvUrlInput("");
                                  setTimeout(() => setTuningFuzz(false), 250);
                                  setShowTvReceiver(false);
                                }}
                                className="text-[7.5px] text-red-400 hover:underline uppercase font-bold"
                              >
                                Reset Preset
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-1 mt-0.5">
                            {[
                              {
                                label: "RAIN TOKYO",
                                url: "https://www.youtube.com/watch?v=5WqgY99vBmc",
                              },
                              {
                                label: "CHILL LOFI",
                                url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
                              },
                              {
                                label: "RETRO SYNTH",
                                url: "https://www.youtube.com/watch?v=4xDzrJK33S4",
                              },
                            ].map((p, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setTvUrlInput(p.url);
                                  setTuningFuzz(true);
                                  let parsed = "";
                                  try {
                                    const videoId = p.url.split("v=")[1];
                                    if (videoId) {
                                      parsed = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&enablejsapi=1`;
                                    }
                                  } catch (err) {
                                    console.error(err);
                                  }
                                  if (parsed) {
                                    setCustomTvUrl(parsed);
                                    if (!tvOn) setTvOn(true);
                                  }
                                  setTimeout(() => setTuningFuzz(false), 300);
                                  setShowTvReceiver(false);
                                }}
                                className="text-[8px] md:text-[8.5px] truncate px-1 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-neutral-800 text-neutral-300 hover:text-white transition-all duration-150"
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>

                          {/* Built-in Scanline micro selector */}
                          <div className="flex items-center justify-between text-[7px] md:text-[7.5px] opacity-70 mt-1">
                            <span className="uppercase">Scanline Overlay:</span>
                            <div className="flex gap-1">
                              {["Solid", "Phosphor", "Grid"].map((modeName, mIdx) => (
                                <button
                                  key={modeName}
                                  onClick={() => setTvScanlineMode(mIdx)}
                                  className={`px-1 py-0.5 rounded-sm border text-[6.5px] md:text-[7.5px] ${
                                    tvScanlineMode === mIdx
                                      ? "border-amber-500 bg-amber-500/10 text-amber-300"
                                      : "border-neutral-800 text-neutral-500 hover:text-neutral-300"
                                  }`}
                                >
                                  {modeName}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Glass screen reflection glare */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/0 via-white/5 to-white/10 z-10" />

                    {/* Analog static interference simulation when tuning channels */}
                    {tuningFuzz && (
                      <div className="absolute inset-0 bg-[#0c0c0d] z-30 flex flex-col items-center justify-center pointer-events-none animate-pulse">
                        <div className="absolute inset-0 opacity-[0.35] bg-[radial-gradient(#fff_25%,transparent_25%)] bg-[size:3px_3px]" />
                        <div className="absolute inset-0 opacity-[0.20] bg-[radial-gradient(#ff6a00_30%,transparent_30%)] bg-[size:5px_5px]" />
                        <div className="text-ember font-mono text-[9px] uppercase tracking-wider bg-black/85 px-2 py-1 rounded border border-ember/20 shadow-md">
                          NO SIGNAL
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="w-full h-full bg-[#050505] relative flex items-center justify-center">
                    {/* Display standard television static noise dots when fully turned off */}
                    <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#fff_30%,transparent_30%)] bg-[size:3px_3px]" />
                  </div>
                )}

                {/* CRT SHUTOFF ANIMATION DOT/LINE */}
                <AnimatePresence>
                  {crtOffAnim && (
                    <motion.div
                      initial={{ scaleX: 1, scaleY: 1, opacity: 1 }}
                      animate={{
                        scaleX: [1, 1, 0.02, 0],
                        scaleY: [1, 0.008, 0.008, 0],
                        opacity: [1, 1, 1, 0],
                      }}
                      transition={{ duration: 0.45, ease: "easeInOut" }}
                      className="absolute inset-0 bg-[#fefefe] z-40 flex items-center justify-center transition-colors duration-150"
                    >
                      {/* Bright amber spark fading away */}
                      <div className="w-5 h-5 rounded-full bg-ember shadow-[0_0_15px_#ff6a00,0_0_5px_#fff]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* SIGNAL/STANDBY INDICATOR LED */}
              <div
                className="absolute rounded-full transition-all duration-300 z-30"
                style={{
                  left: "85.0%",
                  top: "12.0%",
                  width: "1.2%",
                  height: "1.8%",
                  transform: "translate(-50%, -50%)",
                  boxShadow:
                    tvOn && !crtOffAnim
                      ? "0 0 10px rgba(239, 68, 68, 0.8), 0 0 3px rgba(239, 68, 68, 1)"
                      : "0 0 2px rgba(0,0,0,0.5)",
                  backgroundColor: tvOn && !crtOffAnim ? "#ef4444" : "#1e1b4b",
                  border: "1px solid rgba(0,0,0,0.8)",
                }}
                title={tvOn && !crtOffAnim ? "TV Status: Signal Locked" : "TV Status: Standby"}
              />

              {/* KNOB WELL RECESSED SOCKETS (True depth for 3D realism) */}
              <div
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: "81.05%",
                  top: "16.01%",
                  width: "7.96%",
                  height: "11.64%",
                  background: "radial-gradient(circle, #090605 60%, #1e1715 100%)",
                  boxShadow: "inset 0 3px 6px rgba(0,0,0,0.95), 0 1px 1px rgba(255,255,255,0.06)",
                  border: "1px solid #231b19",
                }}
              />
              <div
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: "81.11%",
                  top: "33.29%",
                  width: "7.90%",
                  height: "11.74%",
                  background: "radial-gradient(circle, #090605 60%, #1e1715 100%)",
                  boxShadow: "inset 0 3px 6px rgba(0,0,0,0.95), 0 1px 1px rgba(255,255,255,0.06)",
                  border: "1px solid #231b19",
                }}
              />

              {/* ROTARY CHANNEL DIAL UPPER KNOB (Component 3 cutout) */}
              <button
                onClick={handleChannelChange}
                onWheel={(e) => {
                  if (!tvOn || crtOffAnim) return;
                  setTuningFuzz(true);
                  if (e.deltaY > 0) {
                    setTvChannel((prev) => (prev + 1) % TV_CHANNELS.length);
                  } else {
                    setTvChannel((prev) => (prev - 1 + TV_CHANNELS.length) % TV_CHANNELS.length);
                  }
                  setTimeout(() => setTuningFuzz(false), 200);
                }}
                disabled={!tvOn || crtOffAnim}
                className={`absolute z-30 rounded-full transition-all duration-300 shadow-xl flex items-center justify-center pointer-events-auto hover:brightness-110 ${
                  !tvOn || crtOffAnim
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer active:scale-95 group/knob"
                }`}
                style={{
                  left: "81.45%",
                  top: "16.41%",
                  width: "7.16%",
                  height: "10.84%",
                  transform: `rotate(${tvChannel * (360 / TV_CHANNELS.length)}deg)`,
                  background:
                    "radial-gradient(circle at 50% 50%, transparent 58%, rgba(0,0,0,0.6) 62%), conic-gradient(from 45deg, #3d3432 0%, #1b1514 25%, #4d4341 50%, #1b1514 75%, #3d3432 100%)",
                  border: "2px solid #0f0a09",
                  boxShadow:
                    "inset 0 1px 2px rgba(255,255,255,0.15), 0 3px 5px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,0,0,0.95), 0 4px 10px rgba(0,0,0,0.45)",
                }}
                title={`Upper Dial (CH: ${TV_CHANNELS[tvChannel].title}) - Click or Scroll wheel to Change Channel`}
              >
                {/* Pointer notch indicator line */}
                <div className="w-1 h-[28%] bg-ember rounded-full shadow-[0_0_8px_#ff6a00] absolute top-1 left-1/2 -translate-x-1/2" />
                {/* Dial inner details with brushed face */}
                <div className="absolute inset-[18%] rounded-full border border-neutral-950 bg-gradient-to-br from-neutral-800 to-neutral-950 pointer-events-none flex items-center justify-center">
                  <div className="absolute inset-px rounded-full bg-gradient-to-tr from-neutral-900 to-neutral-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-950 border border-neutral-800/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" />
                </div>
              </button>

              {/* ROTARY VISUAL MODE LOWER KNOB (Component 4 cutout) */}
              <button
                onClick={handleTvVisualModeToggle}
                onWheel={(e) => {
                  if (!tvOn || crtOffAnim) return;
                  setTuningFuzz(true);
                  if (e.deltaY > 0) {
                    setTvVisualMode((prev) => (prev + 1) % 4);
                  } else {
                    setTvVisualMode((prev) => (prev - 1 + 4) % 4);
                  }
                  setTimeout(() => setTuningFuzz(false), 200);
                }}
                disabled={!tvOn || crtOffAnim}
                className={`absolute z-30 rounded-full transition-all duration-300 shadow-xl flex items-center justify-center pointer-events-auto hover:brightness-110 ${
                  !tvOn || crtOffAnim
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer active:scale-95 group/knob"
                }`}
                style={{
                  left: "81.51%",
                  top: "33.69%",
                  width: "7.10%",
                  height: "10.94%",
                  transform: `rotate(${tvVisualMode * 90}deg)`,
                  background:
                    "radial-gradient(circle at 50% 50%, transparent 58%, rgba(0,0,0,0.6) 62%), conic-gradient(from 45deg, #3d3432 0%, #1b1514 25%, #4d4341 50%, #1b1514 75%, #3d3432 100%)",
                  border: "2px solid #0f0a09",
                  boxShadow:
                    "inset 0 1px 2px rgba(255,255,255,0.15), 0 3px 5px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,0,0,0.95), 0 4px 10px rgba(0,0,0,0.45)",
                }}
                title={`Lower Dial (Mode: ${
                  tvVisualMode === 0
                    ? "Vintage"
                    : tvVisualMode === 1
                      ? "Amber"
                      : tvVisualMode === 2
                        ? "Matrix Green"
                        : "Mono Slate"
                }) - Click or Scroll wheel to Shift Screen Color`}
              >
                {/* Pointer notch indicator line */}
                <div className="w-1 h-[28%] bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)] absolute top-1 left-1/2 -translate-x-1/2" />
                {/* Dial inner details with brushed face */}
                <div className="absolute inset-[18%] rounded-full border border-neutral-950 bg-gradient-to-br from-neutral-800 to-neutral-950 pointer-events-none flex items-center justify-center">
                  <div className="absolute inset-px rounded-full bg-gradient-to-tr from-neutral-900 to-neutral-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-950 border border-neutral-800/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" />
                </div>
              </button>

              {/* TACTILE POWER SWITCH (Component 5 cutout) */}
              <button
                onClick={handleTvToggle}
                className="absolute z-30 rounded-full transition-all duration-150 shadow-md flex items-center justify-center pointer-events-auto active:scale-90"
                style={{
                  left: "80.14%",
                  top: "79.00%",
                  width: "2.86%",
                  height: "4.30%",
                  background:
                    tvOn && !crtOffAnim
                      ? "radial-gradient(circle, #dc2626 0%, #991b1b 60%, #450a0a 100%)"
                      : "radial-gradient(circle, #ef4444 0%, #b91c1c 65%, #7f1d1d 100%)",
                  border: "1.5px solid rgba(0, 0, 0, 0.75)",
                  transform: tvOn && !crtOffAnim ? "translateY(1px) scale(0.95)" : "none",
                  boxShadow:
                    tvOn && !crtOffAnim
                      ? "inset 0 2px 4px rgba(0,0,0,0.8), 0 1px 1.5px rgba(255,255,255,0.1)"
                      : "inset 0 1.5px 1.5px rgba(255,255,255,0.35), 0 3px 6px rgba(0,0,0,0.65)",
                }}
                title={tvOn ? "Switch TV Off" : "Switch TV On"}
              >
                {/* Push ring inner detail */}
                <div className="w-[45%] h-[45%] rounded-full border border-black/30 bg-black/10" />
              </button>

              {/* TACTILE CUSTOM YT RECEIVER SWITCH (Component 6 cutout) */}
              <button
                onClick={() => {
                  if (!tvOn || crtOffAnim) return;
                  setShowTvReceiver((prev) => !prev);
                }}
                disabled={!tvOn || crtOffAnim}
                className={`absolute z-30 rounded-full transition-all duration-150 shadow-md flex items-center justify-center pointer-events-auto active:scale-90 ${
                  !tvOn || crtOffAnim ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                }`}
                style={{
                  left: "87.57%",
                  top: "79.10%",
                  width: "2.60%",
                  height: "4.10%",
                  background: showTvReceiver
                    ? "radial-gradient(circle, #ffcbd1 0%, #dc2626 60%, #7f1d1d 100%)"
                    : "radial-gradient(circle, #f0f0f2 0%, #b1b1b5 55%, #52525b 100%)",
                  border: "1.5px solid rgba(0, 0, 0, 0.75)",
                  transform: showTvReceiver ? "translateY(1px) scale(0.91)" : "none",
                  boxShadow: showTvReceiver
                    ? "inset 0 1.5px 3px rgba(0,0,0,0.85), 0 0 8px rgba(239, 68, 68, 0.45)"
                    : "inset 0 1.5px 1.5px rgba(255,255,255,0.6), 0 3px 6px rgba(0,0,0,0.6)",
                }}
                title="Manual YouTube Receiver - Click to open custom channel tuner"
              >
                {/* Tiny metallic central indicator */}
                <div
                  className={`w-[35%] h-[35%] rounded-full border transition-colors ${
                    showTvReceiver ? "bg-red-400 border-red-700/60" : "bg-white/40 border-black/25"
                  }`}
                />
              </button>

              {/* TRANSPARENT TV CABINET IMAGE OVERLAY */}
              <img
                src={tvPlaceholderImg}
                alt="Retro TV Set Overlay"
                className="absolute inset-0 w-full h-full object-fill pointer-events-none z-20 transition-all duration-700 ease-in-out"
                style={{
                  filter: TV_HUE_MAP[currentStation] || "none",
                }}
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Combined Mixer and FX Tabbed Panel */}
          <div className="bezel rounded-2xl p-4 lg:p-5 flex flex-col flex-1 relative min-h-[350px] lg:min-h-0">
            {/* Retro styled tab bar */}
            <div className="flex items-center justify-between mb-5 shrink-0 border-b border-border/15 pb-2.5">
              <div className="flex items-center gap-1 bg-panel-deep p-0.5 rounded-lg border border-border/10">
                <button
                  onClick={() => setMixerTab("mixer")}
                  className={`text-[9px] tracking-[0.2em] font-mono px-3 py-1.5 rounded-md transition-all duration-200 cursor-pointer ${
                    mixerTab === "mixer"
                      ? "text-ember font-bold bg-secondary/70 shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  MIXER
                </button>
                <button
                  onClick={() => setMixerTab("effects")}
                  className={`text-[9px] tracking-[0.2em] font-mono px-3 py-1.5 rounded-md transition-all duration-200 cursor-pointer ${
                    mixerTab === "effects"
                      ? "text-ember font-bold bg-secondary/70 shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  FM EFFECTS
                </button>
              </div>

              {mixerTab === "mixer" && (
                <button
                  onClick={() => setShowAddEnv(!showAddEnv)}
                  className="text-[10px] tracking-[0.25em] px-2.5 py-1.5 rounded-md border border-border/60 text-foreground/60 hover:text-foreground hover:border-ember/60 hover:text-ember transition-all cursor-pointer font-bold uppercase select-none"
                >
                  + SOUND
                </button>
              )}
            </div>

            {/* Mixer Tab Content */}
            {mixerTab === "mixer" && (
              <>
                {showAddEnv && (
                  <div className="absolute top-16 right-5 w-48 bg-panel-deep rounded-xl shadow-xl border border-border/60 p-2 z-10 flex flex-col gap-1 max-h-64 overflow-y-auto">
                    {ENV_ROWS.filter((r) => !activeEnvs.includes(r.key)).map(
                      ({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => onAddEnv(key)}
                          className="flex items-center justify-between p-2 rounded-lg text-sm text-foreground/70 hover:bg-secondary/40 hover:text-foreground hover:text-ember transition-all text-left cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4" /> {label}
                          </span>
                          <Plus className="h-3 w-3" />
                        </button>
                      ),
                    )}
                    {ENV_ROWS.filter((r) => !activeEnvs.includes(r.key)).length === 0 && (
                      <p className="p-2 text-xs text-muted-foreground text-center">
                        All sounds added
                      </p>
                    )}
                  </div>
                )}

                {activeEnvs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground/50 opacity-60">
                    <Music2 className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-[10px] tracking-widest">NO SOUNDS ADDED</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3.5 overflow-y-auto pr-1 flex-1">
                    {activeEnvs.map((key) => {
                      const row = ENV_ROWS.find((r) => r.key === key)!;
                      const Icon = row.icon;
                      return (
                        <div
                          key={key}
                          className="grid grid-cols-[1fr_1.3fr_auto] items-center gap-3"
                        >
                          <div className="flex items-center gap-2 text-sm text-foreground/80">
                            <Icon className="h-4 w-4 ember-text" strokeWidth={1.5} />
                            {row.label}
                          </div>
                          <input
                            type="range"
                            className="ember w-full cursor-grab active:cursor-grabbing"
                            min={0}
                            max={100}
                            value={env[key]}
                            style={{ ["--val" as string]: `${env[key]}%` }}
                            onChange={(e) => onEnvChange(key, Number(e.target.value))}
                          />
                          <span className="text-xs text-foreground/60 w-10 text-right tabular-nums">
                            {env[key]}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* FM Effects Tab Content (Fills Space) */}
            {mixerTab === "effects" && (
              <div className="flex flex-col gap-2.5 overflow-y-auto pr-1 flex-1 hidden-scrollbar">
                {effects.map((e) => {
                  const on = effect === e.id;
                  const Icon = e.icon;
                  return (
                    <button
                      key={e.id}
                      onClick={() => setEffect(e.id)}
                      className={`group flex items-start gap-3.5 p-3 rounded-xl border text-left transition-all duration-300 relative overflow-hidden cursor-pointer ${
                        on
                          ? "border-ember/70 text-foreground bg-ember/[0.04] shadow-[inset_0_0_12px_rgba(255,106,0,0.05)]"
                          : "border-border/40 text-foreground/75 hover:text-foreground hover:border-border/80 bg-panel-deep/50 hover:bg-panel-deep/80"
                      }`}
                    >
                      {/* Accent glow bar on the left */}
                      {on && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-ember shadow-[0_0_10px_#ff6a00]" />
                      )}

                      <div
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          on
                            ? "bg-ember/15 text-ember shadow-[0_0_8px_rgba(255,106,0,0.2)]"
                            : "bg-neutral-900/80 text-foreground/50 group-hover:text-foreground/80"
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" strokeWidth={on ? 2 : 1.5} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-mono font-bold tracking-wider ${on ? "text-ember" : "text-foreground"}`}
                          >
                            {e.label.toUpperCase()}
                          </span>
                          {on && (
                            <span className="text-[8px] font-mono bg-ember/10 text-ember font-bold border border-ember/20 px-1.5 py-0.5 rounded tracking-widest leading-none">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-foreground/50 mt-1 leading-relaxed">
                          {e.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* MAP TAB - 3D INTERACTIVE GLOBE */}
        {active === "Map" && (
          <div className="col-span-1 lg:col-span-10 flex flex-col lg:grid lg:grid-cols-10 gap-5 min-h-0 h-full animate-in fade-in duration-300">
            {/* Globe Card Bezel */}
            <div className="bezel rounded-3xl p-4 lg:p-6 flex flex-col lg:col-span-7 h-full relative overflow-hidden min-h-[400px] lg:min-h-0">
              <div className="flex flex-col border-b border-border/40 pb-4 shrink-0">
                {(() => {
                  const st = STATIONS.find((s) => s.id === currentStation);
                  return (
                    <motion.div
                      key={currentStation}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-1"
                    >
                      <h2 className="text-xl font-display font-semibold tracking-tight leading-none text-ember uppercase">
                        {st?.title || "GLOBAL TRANSMISSION"}
                      </h2>
                      <p className="text-xs text-foreground/75 leading-relaxed mt-1">
                        {st?.desc || "Select a transmission point on the globe."}
                      </p>
                    </motion.div>
                  );
                })()}
              </div>

              {/* Globe Container */}
              <div className="flex-1 min-h-0 flex flex-col justify-between">
                <div className="flex-1 min-h-0">
                  <ThreeDGlobe
                    currentStation={currentStation}
                    onSelectStation={(id) => onSelectStation(id, true)}
                    playing={playing}
                  />
                </div>
                {/* Coordinates and Location name at the bottom of the globe container */}
                <div className="mt-4 pt-4 border-t border-border/15 flex flex-col items-center justify-center text-center shrink-0">
                  {(() => {
                    const st = STATIONS.find((s) => s.id === currentStation);
                    return (
                      <>
                        <motion.h3
                          key={`ctry-${currentStation}`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-2xl sm:text-3xl font-display font-semibold text-white tracking-wider uppercase leading-none"
                        >
                          {st?.country || "GLOBAL ORIGIN"}
                        </motion.h3>
                        <p className="text-[11px] text-ember font-mono font-bold tracking-[0.2em] mt-2 bg-ember/5 px-3 py-1 rounded-full border border-ember/20 shadow-[0_0_12px_rgba(255,106,0,0.1)] select-none">
                          {STATION_COORDS[currentStation]?.lat.toFixed(4)}° N,{" "}
                          {STATION_COORDS[currentStation]?.lon.toFixed(4)}° E
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Station selector list */}
            <div className="bezel rounded-3xl p-4 lg:p-5 flex flex-col lg:col-span-3 h-full overflow-hidden shrink-0 max-h-[350px] lg:max-h-none">
              <p className="text-[10.5px] tracking-[0.3em] text-muted-foreground mb-3 font-mono shrink-0">
                MARKERS ({STATIONS.length} DIRECTIVES)
              </p>

              {/* Markers search form */}
              <div className="flex gap-2 shrink-0 mb-4 font-mono">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
                  <input
                    type="text"
                    value={mapSearchQuery}
                    onChange={(e) => setMapSearchQuery(e.target.value)}
                    placeholder="FILTER STATIONS..."
                    className="w-full bg-neutral-950/40 hover:bg-neutral-950/60 focus:bg-neutral-950/80 border border-border/20 focus:border-ember/40 rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none transition-all uppercase tracking-wider"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (mapSearchQuery) {
                      setMapSearchQuery("");
                    }
                  }}
                  className="px-3 rounded-xl border border-border/40 bg-neutral-950/40 hover:bg-ember/10 hover:border-ember/40 text-[10px] uppercase font-bold text-muted-foreground hover:text-ember transition-all cursor-pointer flex items-center justify-center shrink-0 min-w-[70px]"
                >
                  {mapSearchQuery ? "CLEAR" : "SEARCH"}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1 hidden-scrollbar">
                {STATIONS.filter((st) => {
                  const q = mapSearchQuery.toLowerCase();
                  return (
                    st.title.toLowerCase().includes(q) ||
                    st.country.toLowerCase().includes(q) ||
                    (st.desc && st.desc.toLowerCase().includes(q))
                  );
                }).map((st) => (
                  <button
                    key={st.id}
                    onClick={() => onSelectStation(st.id, true)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      currentStation === st.id
                        ? "border-ember/40 bg-ember/5 text-foreground"
                        : "border-border/40 hover:border-ember/20 hover:bg-secondary/10 text-foreground/80 hover:text-foreground"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5 min-w-0 font-display">
                      <span className="text-[12.5px] tracking-wide leading-none">{st.title}</span>
                      <span className="text-[9.5px] text-muted-foreground uppercase tracking-wider">
                        {st.country}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {currentStation === st.id ? (
                        <span className="h-2 w-2 rounded-full bg-ember ember-glow animate-pulse" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/35" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DISCOVER TAB */}
        {active === "Discover" && (
          <div className="col-span-1 lg:col-span-10 flex flex-col lg:grid lg:grid-cols-10 gap-5 min-h-0 h-full animate-in fade-in duration-300">
            {/* Main dashboard space - 7 columns */}
            <div className="bezel rounded-3xl p-5 lg:p-6 flex flex-col flex-1 lg:col-span-10 h-full overflow-y-auto hidden-scrollbar">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5 mb-5 shrink-0">
                <div>
                  <h2 className="text-xl font-display tracking-wide truncate uppercase">
                    VIBEJUNGLE DISCOVER
                  </h2>
                  <p className="text-[10px] tracking-[0.25em] text-muted-foreground mt-0.5">
                    CURATED ATMOSPHERIC SCANNER
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-ember animate-pulse" />
                  <span className="font-mono text-[9px] text-foreground/60 tracking-widest uppercase">
                    SCANNING GLOBE FOR ACTIVE SIGNALS...
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <div className="inset-panel rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden">
                  <span className="absolute right-3 bottom-0.5 text-[28px] font-mono opacity-5 text-muted-foreground select-none">
                    01
                  </span>
                  <div className="flex items-center gap-2 text-ember">
                    <Radio className="h-4 w-4" />
                    <span className="text-[10px] tracking-widest uppercase font-mono">
                      ACTIVE FREQ
                    </span>
                  </div>
                  <p className="font-mono text-xl tracking-tight mt-1">94.80 MHz</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
                    Slight static overlay from North Atlantic breezes.
                  </p>
                </div>
                <div className="inset-panel rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden">
                  <span className="absolute right-3 bottom-0.5 text-[28px] font-mono opacity-5 text-muted-foreground select-none">
                    02
                  </span>
                  <div className="flex items-center gap-2 text-foreground/50">
                    <Compass className="h-4 w-4" />
                    <span className="text-[10px] tracking-widest uppercase font-mono">
                      STATION INDEX
                    </span>
                  </div>
                  <p className="font-mono text-xl tracking-tight mt-1">16 LOCATIONS</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
                    Broadcasting high-definition tactile field recordings.
                  </p>
                </div>
                <div className="inset-panel rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden">
                  <span className="absolute right-3 bottom-0.5 text-[28px] font-mono opacity-5 text-muted-foreground select-none">
                    03
                  </span>
                  <div className="flex items-center gap-2 text-foreground/50">
                    <Activity className="h-4 w-4" />
                    <span className="text-[10px] tracking-widest uppercase font-mono">
                      ATMOSPHERICS
                    </span>
                  </div>
                  <p className="font-mono text-xl tracking-tight mt-1">EXCELLENT</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
                    Dynamic layering algorithm optimizing mix-levels.
                  </p>
                </div>
              </div>

              <p className="text-[10px] tracking-[0.3em] text-muted-foreground shrink-0 mb-3 uppercase font-semibold">
                CURATED SIGNAL COLLECTIONS
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    title: "Pacific Storms",
                    desc: "Seattle & Kyoto channels combined with heavy monsoonal sweeps.",
                    tags: "Rain · Wind · Chimes",
                    stations: ["seattle", "kyoto"],
                  },
                  {
                    title: "Metropolitan Transit",
                    desc: "Subway rumbled trains under Brooklyn and London platforms.",
                    tags: "Train · City · Static",
                    stations: ["ny", "london"],
                  },
                  {
                    title: "Solitude Cabin",
                    desc: "Cozy fireplace vibes with Swiss blizzard and Icelandic winds.",
                    tags: "Fire · Wind · Cold",
                    stations: ["swiss", "iceland"],
                  },
                ].map((col, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelectStation(col.stations[0]);
                    }}
                    className="inset-panel rounded-2xl p-4 border border-border/30 text-left hover:border-ember/30 transition-all group hover:shadow-lg flex flex-col justify-between gap-4"
                  >
                    <div className="flex flex-col gap-1.5 font-display">
                      <p className="font-medium text-foreground group-hover:text-ember transition-colors leading-none">
                        {col.title}
                      </p>
                      <p className="text-xs text-foreground/60 leading-relaxed font-sans">
                        {col.desc}
                      </p>
                    </div>
                    <div className="flex items-center justify-between border-t border-border/10 pt-3">
                      <span className="text-[9px] font-mono text-muted-foreground tracking-wider">
                        {col.tags}
                      </span>
                      <span className="text-[9px] font-mono text-ember tracking-widest uppercase">
                        ACTIVATE
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MOBILE NAV BOTTOM */}
      <nav className="fixed bottom-0 inset-x-0 h-[calc(3.5rem+env(safe-area-inset-bottom))] bg-panel-deep border-t border-border/60 flex items-center justify-around z-50 lg:hidden px-2 pb-[env(safe-area-inset-bottom)]">
        {nav.map(({ label, icon: Icon }) => {
          const on = active === label;
          return (
            <button
              key={label}
              onClick={() => setActive(label)}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 ${on ? "text-ember ember-text" : "text-foreground/50"}`}
            >
              <Icon className="h-5 w-5" strokeWidth={on ? 2 : 1.5} />
              <span className="text-[9px] tracking-widest uppercase">{label}</span>
            </button>
          );
        })}
        <button
          onClick={() => {
            setShowDonate(true);
            setDonateState("form");
          }}
          className="flex flex-col items-center justify-center w-full h-full gap-1 text-foreground/50 hover:text-ember transition duration-150 cursor-pointer"
        >
          <Heart className="h-5 w-5 text-ember animate-pulse" strokeWidth={1.5} />
          <span className="text-[9px] tracking-widest uppercase font-semibold">Donate</span>
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="flex flex-col items-center justify-center w-full h-full gap-1 text-foreground/50 cursor-pointer"
        >
          <Settings className="h-5 w-5" strokeWidth={1.5} />
          <span className="text-[9px] tracking-widest uppercase">Settings</span>
        </button>
      </nav>

      {/* PLAYER BAR */}
      <footer className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] lg:bottom-0 inset-x-0 h-20 bg-panel-deep/95 backdrop-blur border-t border-border/60 px-4 lg:px-5 flex items-center justify-between z-40 lg:pb-0">
        <div className="flex items-center gap-3 w-auto lg:w-72">
          {(() => {
            const st = STATIONS.find((s) => s.id === currentStation);
            if (!st) return null;
            return (
              <>
                <img
                  src={st.image}
                  alt=""
                  className="h-10 w-10 lg:h-12 lg:w-14 object-cover rounded-md"
                />
                <div className="hidden sm:block">
                  <p className="text-sm line-clamp-1">{st.title}</p>
                  <p className="text-xs text-foreground/60">{st.country}</p>
                </div>
              </>
            );
          })()}
        </div>

        <div className="flex-1 lg:flex-none flex items-center justify-center gap-4 lg:gap-5">
          <button
            onClick={handlePrev}
            className="text-foreground/70 hover:text-ember cursor-pointer transition active:scale-90"
            title={tvOn && !crtOffAnim ? "Previous TV Channel" : "Previous Station"}
          >
            <SkipBack className="h-5 w-5" />
          </button>
          <button
            onClick={togglePlay}
            className="h-12 w-12 rounded-full grid place-items-center bg-ember text-primary-foreground ember-glow hover:scale-[1.08] cursor-pointer transition active:scale-95"
          >
            {playing ? (
              <Pause className="h-5 w-5" fill="currentColor" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
            )}
          </button>
          <button
            onClick={handleNext}
            className="text-foreground/70 hover:text-ember cursor-pointer transition active:scale-90"
            title={tvOn && !crtOffAnim ? "Next TV Channel" : "Next Station"}
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-3 w-72 justify-end">
          <button
            onClick={() => setMuted((m) => !m)}
            className="p-1 text-foreground/60 hover:text-foreground transition-colors hover:bg-foreground/5 rounded-md flex items-center justify-center shrink-0"
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? (
              <VolumeX className="h-4 w-4 text-ember animate-pulse" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <input
            type="range"
            className="ember w-32"
            min={0}
            max={100}
            value={master}
            onChange={(e) => onMasterChange(Number(e.target.value))}
            style={{ ["--val" as string]: `${master}%` }}
          />
          <button className="h-9 w-9 grid place-items-center rounded-full border border-ember/60 ember-text">
            <AudioLines className="h-4 w-4" />
          </button>
        </div>
      </footer>

      {embedUrl && (
        <div className="fixed bottom-24 lg:bottom-24 right-4 lg:right-6 w-[280px] sm:w-[320px] rounded-xl overflow-hidden border border-border/80 shadow-2xl z-50 bg-panel text-foreground">
          <div className="flex justify-between items-center px-3 py-2 bg-panel-deep border-b border-border/60 text-[10px] tracking-wider font-mono">
            <span className="text-ember font-semibold flex items-center gap-1.5">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-ember animate-pulse" />
              EXTERNAL FEED
            </span>
            <button
              onClick={() => {
                setCustomMusicUrl("");
                setTempMusicUrl("");
              }}
              className="text-foreground/50 hover:text-foreground hover:bg-white/10 p-1 rounded-md transition-all duration-200"
              title="Close Stream & Restore SomaFM"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          {customMusicUrl.includes("youtube") || customMusicUrl.includes("youtu.be") ? (
            <div className="aspect-video w-full bg-black/40">
              <iframe
                id="external-feed-iframe"
                src={embedUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                className={`w-full h-full animate-fade ${getIframeFilterClass()}`}
              />
            </div>
          ) : (
            <div className="h-[152px] w-full bg-black/40">
              <iframe
                id="external-feed-iframe"
                src={embedUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                className={`w-full h-full animate-fade ${getIframeFilterClass()}`}
              />
            </div>
          )}
        </div>
      )}

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-panel-deep border-border/60 text-foreground w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight text-2xl ember-text">
              System Settings
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-8 py-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="rain-effect" className="flex flex-col gap-1.5 cursor-pointer">
                <span className="text-sm font-semibold tracking-wide">
                  Atmospheric Console Effect
                </span>
                <span className="text-xs text-foreground/60 leading-relaxed max-w-[200px]">
                  Toggle the dynamic visual rain rendering sequence processing on the main terminal
                  screen.
                </span>
              </Label>
              <Switch
                id="rain-effect"
                checked={showRainEffect}
                onCheckedChange={setShowRainEffect}
                className="data-[state=checked]:bg-ember"
              />
            </div>

            <div className="h-px bg-border/40" />

            <div className="flex flex-col gap-3">
              <Label htmlFor="custom-music" className="text-sm font-semibold tracking-wide">
                Custom Transmitter Link
              </Label>
              <Input
                id="custom-music"
                placeholder="Paste YouTube or Spotify link..."
                value={tempMusicUrl}
                onChange={(e) => setTempMusicUrl(e.target.value)}
                className="bg-background border-border/60 placeholder:text-foreground/30 focus-visible:ring-ember h-10"
              />

              <div className="flex gap-2.5 mt-1">
                <button
                  onClick={() => setCustomMusicUrl(tempMusicUrl)}
                  className="flex-1 px-4 py-2 text-xs font-semibold tracking-wide uppercase bg-ember text-background rounded-md hover:bg-ember-glow transition shadow-lg shadow-ember/15"
                >
                  Apply Transmission
                </button>
                <button
                  onClick={() => {
                    setTempMusicUrl("");
                    setCustomMusicUrl("");
                  }}
                  className="px-4 py-2 text-xs font-semibold tracking-wide uppercase border border-border/60 text-foreground/75 hover:bg-secondary/40 rounded-md transition"
                >
                  Clear Feed
                </button>
              </div>

              {customMusicUrl && (
                <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-xl bg-background/50 border border-border/40">
                  <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-[10px] text-foreground/70 truncate flex-1 leading-none">
                    Active: {customMusicUrl}
                  </span>
                </div>
              )}

              <p className="text-xs text-foreground/50 leading-relaxed mt-1">
                Connect external feed to override the Soma FM ambient signal. Use the SIGNAL and
                VOLUME knobs to balance the atmospheric layers.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDonate} onOpenChange={setShowDonate}>
        <DialogContent className="!bg-[#0a0a0c] !border-neutral-800/80 text-white w-[95vw] sm:max-w-md max-h-[85vh] overflow-y-auto shadow-2xl">
          <AnimatePresence mode="wait">
            {donateState === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6 py-2"
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-ember/10 flex items-center justify-center border border-ember/20 shadow-[0_0_15px_rgba(255,106,0,0.1)] mb-1">
                    <Heart className="h-5 w-5 text-ember fill-ember/20 animate-pulse" />
                  </div>
                  <DialogTitle className="font-display tracking-tight text-2xl text-white">
                    Support VibeJungle
                  </DialogTitle>
                  <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                    VibeJungle is hosted by a small independent collective of audiophiles. Your
                    support keeps our global 3D transmission servers and ambient streams alive.
                  </p>
                </div>

                <div className="h-px bg-neutral-800/70" />

                {/* Donation frequency */}
                <div className="flex justify-center p-0.5 bg-neutral-950/80 rounded-xl border border-neutral-800/60">
                  <button
                    type="button"
                    onClick={() => setDonateFrequency("monthly")}
                    className={`flex-1 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      donateFrequency === "monthly"
                        ? "bg-ember text-black font-bold shadow-md shadow-ember/10"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    💖 Support Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setDonateFrequency("once")}
                    className={`flex-1 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      donateFrequency === "once"
                        ? "bg-ember text-black font-bold shadow-md shadow-ember/10"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    One-Time Gift
                  </button>
                </div>

                {/* Preset tiers */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono">
                    Select Donation Tier
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 15, 30, 100].map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => {
                          setDonateAmount(tier);
                          setCustomAmount("");
                        }}
                        className={`py-2 px-1 text-center font-mono rounded-xl border transition-all cursor-pointer ${
                          donateAmount === tier && !customAmount
                            ? "border-ember p-1 bg-ember/10 text-ember font-bold shadow-[0_0_12px_rgba(255,106,0,0.12)]"
                            : "border-neutral-800 hover:border-neutral-700 bg-neutral-950/40 text-zinc-300"
                        }`}
                      >
                        <span className="text-sm">${tier}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom input */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono">
                    Or input custom amount
                  </span>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2 text-sm text-zinc-500 font-mono">
                      $
                    </span>
                    <input
                      type="number"
                      placeholder="CUSTOM AMOUNT (USD)"
                      value={customAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomAmount(val);
                        setDonateAmount(val);
                      }}
                      className="w-full bg-[#141416]/90 border border-neutral-800 rounded-xl pl-8 pr-4 py-2 text-xs font-mono text-white focus-visible:ring-ember placeholder:text-zinc-650 outline-none focus:border-ember/80 transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="bg-neutral-950/50 px-3.5 py-3 rounded-2xl border border-neutral-800/60">
                  <p className="text-[10px] text-zinc-400 leading-relaxed italic">
                    {donateFrequency === "monthly" ? (
                      <span>
                        🌟 <strong>Monthly Member:</strong> Unlocks high-fidelity 320kbps streams,
                        priority server allocations, and a live glowing ruby badge in your feed!
                      </span>
                    ) : (
                      <span>
                        🍃 Your generous support funds 180 minutes of continuous cloud node
                        operations for Tokyo, Kerala, and Switzerland cabins.
                      </span>
                    )}
                  </p>
                </div>

                {/* Checkout CTA */}
                <button
                  type="button"
                  onClick={handleStartDonate}
                  disabled={!donateAmount || Number(donateAmount) <= 0}
                  className="w-full py-3 text-xs font-semibold tracking-wider uppercase bg-ember text-black rounded-xl hover:bg-ember-glow transition shadow-lg shadow-ember/15 disabled:opacity-40 disabled:pointer-events-none font-bold cursor-pointer"
                >
                  Confirm & Transmit ${donateAmount || "0"}
                </button>
              </motion.div>
            )}

            {donateState === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex flex-col items-center justify-center text-center gap-6 py-10"
              >
                {/* Visual loading ring */}
                <div className="relative h-20 w-20 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-ember/10 animate-pulse" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-ember animate-spin" />
                  <Heart className="h-8 w-8 text-ember animate-pulse fill-ember/10" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="font-display text-xl text-white font-semibold">
                    TRANSMITTING VALUE
                  </h3>
                  <code className="text-[10px] text-ember font-mono bg-ember/5 px-3 py-1.5 rounded-md border border-ember/20 max-w-xs animate-pulse tracking-widest uppercase">
                    {donateStepText}
                  </code>
                </div>
              </motion.div>
            )}

            {donateState === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center gap-6 py-6"
              >
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                  <Heart className="h-8 w-8 text-emerald-500 fill-emerald-500/10 animate-bounce" />
                </div>
                <div className="flex flex-col gap-2">
                  <DialogTitle className="font-display text-2xl text-white font-semibold flex items-center gap-2 justify-center">
                    Transmission Stabilized!
                  </DialogTitle>
                  <p className="text-xs text-zinc-400 max-w-xs leading-relaxed mt-1">
                    Your beautiful contribution of{" "}
                    <strong className="text-white">${donateAmount}</strong> has arrived at the
                    VibeJungle transmission core! Thank you for supporting cozy global atmospheres.
                  </p>
                </div>
                <div className="bg-neutral-950/50 px-4 py-3 rounded-2xl border border-neutral-800/60 max-w-sm">
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-mono uppercase tracking-wider">
                    TRANSMITTER NODE STATE: ONLINE ✨<br />
                    MEMBER RANK: SECURE GLOW
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDonate(false)}
                  className="w-full py-2.5 text-xs font-semibold tracking-wide uppercase border border-neutral-800 text-zinc-300 hover:bg-neutral-900/60 hover:text-white rounded-xl transition cursor-pointer"
                >
                  Return to Console
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ——————— sub-components ——————— */

function TunerDial({
  value,
  onChange,
  activeStationInfo = "",
}: {
  value: number;
  onChange: (v: number) => void;
  activeStationInfo?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const updateVal = (clientX: number) => {
      let pct = (clientX - rect.left) / rect.width;
      pct = Math.max(0, Math.min(1, pct));
      const freq = 88 + pct * (108 - 88);
      onChange(freq);
    };
    updateVal(e.clientX);

    const onMove = (ev: PointerEvent) => {
      updateVal(ev.clientX);
    };
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

  const fm = [88, 90, 92, 94, 96, 98, 100, 102, 104, 106, 108];
  const am = [530, 600, 700, 800, 1000, 1200, 1400, 1600];
  const pct = Math.max(0, Math.min(100, ((value - 88) / (108 - 88)) * 100));
  const pointerLeft = `calc(${pct}% * 0.88 + 6%)`;

  return (
    <div
      className="inset-panel rounded-xl px-4 py-5 relative overflow-hidden cursor-crosshair group group/tuner"
      ref={containerRef}
      onPointerDown={handlePointerDown}
    >
      <div className="absolute top-2 right-4 text-[10px] text-ember/80 font-mono tracking-widest uppercase z-10 font-bold bg-black/60 px-2 py-0.5 rounded backdrop-blur-md">
        {value.toFixed(1)} MHz
      </div>

      {activeStationInfo && (
        <div className="absolute top-2 left-4 text-[9px] sm:text-[10px] text-primary/80 font-mono tracking-widest uppercase truncate max-w-[60%] z-10 font-bold bg-black/60 px-2 py-0.5 rounded backdrop-blur-md">
          {activeStationInfo}
        </div>
      )}

      {/* Background glow when hovering tuner */}
      <div className="absolute inset-0 bg-ember/5 opacity-0 group-hover/tuner:opacity-100 transition-opacity pointer-events-none" />

      {/* Tuner Indicator Line */}
      <div
        className="absolute top-0 bottom-0 w-px bg-ember shadow-[0_0_8px_var(--ember)] transition-transform duration-75 ease-linear pointer-events-none z-20"
        style={{ left: pointerLeft }}
      />
      <div
        className="absolute top-0 z-20 transition-transform duration-75 ease-linear pointer-events-none"
        style={{ left: pointerLeft, transform: "translateX(-50%)" }}
      >
        <div className="w-0 h-0 border-x-[6px] border-x-transparent border-t-[8px] border-t-ember" />
      </div>

      <div className="flex items-center gap-2 sm:gap-4 select-none">
        <span className="ember-text font-display text-lg sm:text-xl shrink-0 w-6">FM</span>
        <div className="flex-1 flex justify-between text-xs sm:text-sm text-foreground/70 tabular-nums">
          {fm.map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
        <span className="text-[10px] sm:text-xs text-muted-foreground tracking-widest shrink-0 w-6">
          MHz
        </span>
      </div>
      <div className="mt-3 h-px bg-border/60 pointer-events-none" />
      <div className="flex items-center gap-2 sm:gap-4 mt-3 select-none">
        <span className="text-foreground/40 font-display text-lg sm:text-xl shrink-0 w-6">AM</span>
        <div className="flex-1 flex justify-between text-[10px] sm:text-xs text-foreground/40 tabular-nums">
          {am.map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
        <span className="text-[10px] sm:text-xs text-muted-foreground tracking-widest shrink-0 w-6">
          kHz
        </span>
      </div>
    </div>
  );
}

function InteractiveKnob({
  label,
  left,
  right,
  value,
  onChange,
  min = 0,
  max = 100,
  muted = false,
}: {
  label: string;
  left: string;
  right: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  muted?: boolean;
}) {
  const rotation = -135 + ((value - min) / (max - min)) * 270;

  const playKnobClick = () => {
    if (muted) return;
    try {
      const AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(200 + Math.random() * 50, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.02);

      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.02);
    } catch (e) {
      /* ignore web audio play failures */
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startVal = value;
    let lastTickVal = startVal;

    playKnobClick();

    const handlePointerMove = (ev: PointerEvent) => {
      const deltaY = startY - ev.clientY;
      let newVal = startVal + deltaY / 1.5; // adjusting sensitivity
      if (newVal < min) newVal = min;
      if (newVal > max) newVal = max;
      onChange(newVal);

      // Play soft tick sound when moving past thresholds
      if (Math.abs(newVal - lastTickVal) > 5) {
        playKnobClick();
        lastTickVal = newVal;
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <div className="flex flex-col items-center">
      <p className="text-[10px] tracking-[0.3em] text-muted-foreground mb-1 sm:mb-3 select-none">
        {label}
      </p>
      <div className="scale-[0.8] sm:scale-100 origin-center -my-3 sm:-my-0">
        <div
          className="knob h-32 w-32 rounded-full relative grid place-items-center cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown}
        >
          <div
            className="absolute top-3 left-1/2 h-5 w-1 -translate-x-1/2 rounded-full bg-ember ember-glow origin-bottom transition-transform"
            style={{
              transform: `translateX(-50%) rotate(${rotation}deg)`,
              transformOrigin: "50% 56px",
              transitionDuration: "0.05s",
            }}
          />
          {/* dots around knob */}
          {Array.from({ length: 11 }).map((_, i) => {
            const a = (-135 + i * 27) * (Math.PI / 180);
            const r = 58;
            const dotVal = min + (i / 10) * (max - min);
            const isActive = value >= dotVal - 2;

            return (
              <span
                key={i}
                className={`absolute h-1 w-1 rounded-full transition-colors duration-300 ${isActive ? "bg-ember shadow-[0_0_8px_var(--ember)]" : "bg-foreground/30"}`}
                style={{
                  left: `calc(50% + ${Math.sin(a) * r}px)`,
                  top: `calc(50% - ${Math.cos(a) * r}px)`,
                }}
              />
            );
          })}
        </div>
      </div>
      <div className="flex justify-between w-24 sm:w-32 mt-1 sm:mt-3 text-[10px] tracking-[0.25em] text-muted-foreground select-none">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  );
}

function VisualizerPanel({
  playing = false,
  activeStationInfo = "",
}: {
  playing?: boolean;
  activeStationInfo?: string;
}) {
  // We use useAnimationFrame or useEffect for the animations of other modes
  const [tick, setTick] = useState(0);
  const dataRef = useRef(new Uint8Array(64));

  useEffect(() => {
    if (!playing) return;
    let frameId: number;
    const animate = () => {
      if (analyser) {
        analyser.getByteFrequencyData(dataRef.current);
      }
      setTick((t) => t + 1);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [playing]);

  const time = tick * 0.05;
  const audioData = dataRef.current;

  // Calculate a generalized intensity sum (0-1)
  let intensity = 0;
  if (playing && analyser) {
    const sum = audioData.reduce((acc, val) => acc + val, 0);
    if (sum === 0) {
      // Fake visualizer for CORS-bypassed radio
      intensity = Math.abs(Math.sin(time * 3) * Math.cos(time * 2)) * 0.4 + 0.1;
    } else {
      intensity = (sum / (audioData.length * 255)) * 2; // scale up a bit to make it punchy
      intensity = Math.min(1, Math.max(0, intensity));
    }
  } else {
    // idle animation
    intensity = playing ? Math.abs(Math.sin(time)) * 0.2 : 0;
  }

  return (
    <div className="rounded-xl h-[13rem] sm:h-56 relative overflow-hidden bg-panel border-[12px] border-panel-deep shadow-[inset_0_4px_30px_rgba(0,0,0,0.5)] ring-1 ring-black group transition-all">
      {/* Background radial highlight */}
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at 50% 120%, color-mix(in oklch, var(--foreground) 10%, transparent) 0%, transparent 100%)",
        }}
      />

      {/* Noise texture overlay for subtle realism */}
      <div
        className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')",
        }}
      />

      {/* Screen shadow vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.7)] pointer-events-none" />

      {/* Active Station Information Plate */}
      {activeStationInfo && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/60 border border-white/10 rounded-full text-[10px] tracking-[0.1em] font-mono text-primary/90 flex flex-col items-center justify-center backdrop-blur-md shadow-xl z-20 text-center mx-auto whitespace-nowrap min-w-[20%] max-w-[80%] overflow-hidden text-ellipsis">
          <div className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${playing ? "animate-pulse" : ""} shadow-[0_0_8px_currentColor]`}
              style={{ backgroundColor: playing ? "var(--primary)" : "var(--muted-foreground)" }}
            />
            {activeStationInfo}
          </div>
        </div>
      )}

      {/* SVG Meter Face */}
      <svg
        viewBox="0 0 200 120"
        className="absolute inset-x-0 top-0 w-full h-[85%] text-muted-foreground"
      >
        {/* Main Arc Line */}
        <path
          d="M 22.2 92.2 A 110 110 0 0 1 177.8 92.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.6"
        />

        {/* Danger zone thick bar (from 0 to +3) */}
        <path
          d="M 148.1 75.6 A 106 106 0 0 1 174.9 95.1"
          fill="none"
          stroke="var(--ember)"
          strokeWidth="3.5"
          opacity="0.8"
        />

        {/* Ticks & Labels */}
        {Array.from({ length: 51 }).map((_, i) => {
          const angleDeg = 135 - (i / 50) * 90;
          const angleRad = (angleDeg * Math.PI) / 180;
          const isMajor = i % 10 === 0;
          const isMedium = i % 5 === 0 && !isMajor;
          const r1 = 110;
          const r2 = isMajor ? 98 : isMedium ? 102 : 105;
          const x1 = 100 + Math.cos(angleRad) * r1;
          const y1 = 170 - Math.sin(angleRad) * r1;
          const x2 = 100 + Math.cos(angleRad) * r2;
          const y2 = 170 - Math.sin(angleRad) * r2;

          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={isMajor ? "1.5" : "1"}
              opacity={isMajor ? 0.8 : 0.5}
            />
          );
        })}

        {/* Labels: 20, 10, 5, 0, 3 */}
        {[
          { i: 10, label: "20" },
          { i: 20, label: "10" },
          { i: 30, label: "5" },
          { i: 40, label: "0" },
          { i: 50, label: "3" },
        ].map(({ i, label }) => {
          const angleDeg = 135 - (i / 50) * 90;
          const angleRad = (angleDeg * Math.PI) / 180;
          const rLabel = 89;
          const x = 100 + Math.cos(angleRad) * rLabel;
          const y = 170 - Math.sin(angleRad) * rLabel;
          return (
            <text
              key={`lbl-${i}`}
              x={x}
              y={y}
              textAnchor="middle"
              alignmentBaseline="middle"
              fontSize="7"
              fontWeight="bold"
              fill="currentColor"
              opacity="0.8"
              className="font-sans"
            >
              {label}
            </text>
          );
        })}

        {/* Needle */}
        <g
          style={{
            transformOrigin: "100px 170px",
            transform: `rotate(${-40 + Math.min(1, intensity * 1.5) * 80}deg)`,
            transition: "transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          className="needle"
        >
          <polygon
            points="98.2,170 101.8,170 100.5,55 99.5,55"
            fill="black"
            opacity="0.4"
            transform="translate(1.5, 2)"
          />
          <polygon
            points="98.2,170 101.8,170 100.4,55 99.6,55"
            fill="var(--foreground)"
            opacity="0.95"
          />
          <polygon
            points="100,170 101.8,170 100.4,55 100,55"
            fill="var(--background)"
            opacity="0.3"
          />
        </g>
      </svg>

      {/* Center Pivot Bezel Cover */}
      <div className="absolute bottom-0 inset-x-0 h-[18%] bg-panel-deep border-t border-white/5 shadow-[0_-5px_15px_rgba(0,0,0,0.5)] flex justify-center items-end pb-1.5 sm:pb-2">
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-background shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_1px_1px_rgba(255,255,255,0.05)] mb-1 relative border border-white/5" />
      </div>
    </div>
  );
}

function MiniVU() {
  return (
    <div className="vu-face rounded-md h-14 relative overflow-hidden border-2 border-panel-deep">
      <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full text-muted-foreground">
        {Array.from({ length: 13 }).map((_, i) => {
          const a = Math.PI - (i / 12) * Math.PI;
          const x1 = 50 + Math.cos(a) * 38,
            y1 = 55 - Math.sin(a) * 38;
          const x2 = 50 + Math.cos(a) * 32,
            y2 = 55 - Math.sin(a) * 32;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              className={i > 9 ? "stroke-destructive" : "stroke-current"}
              strokeWidth="0.8"
            />
          );
        })}
        <text x="50" y="30" textAnchor="middle" fontSize="6" className="fill-current">
          -20 -10 -5 0 +3
        </text>
        <line
          className="needle stroke-foreground"
          x1="50"
          y1="55"
          x2="50"
          y2="18"
          strokeWidth="1"
        />
        <circle cx="50" cy="55" r="2" className="fill-foreground" />
      </svg>
    </div>
  );
}

/* ——————— 3D Globe Implementation ——————— */

const RAW_MAP = RAW_MAP_DATA;
const UNUSED_RAW_MAP = [
  "..........................................................................................",
  "......................####################...........................#....................",
  "...............#.....#####..############......................#........#..................",
  "..............#####.#..##.......########.......................#..############..#.........",
  "#...#############.#...#.#..#....#######...........#####.#....#.###########################",
  ".....##################.#.###...###.....##......######.###################################",
  "....###..#############....##......#............###.#.###############################..#...",
  ".....#......############..####..............#......#############################....##....",
  "..............###########.######...........###.##################################.........",
  "..............###############..#............####################################..........",
  "..............##############.................##.#####..########################..#........",
  "...............############................##....#..#######################...............",
  "...............############..................###...#..#####################..#.##.........",
  "................#########..................######.##..######################..............",
  "..................###.....................################.#################..............",
  "...................##....................#############.#####...############...............",
  "...................##..#...#.............##############.####....###..###..................",
  "......................###................#################......##....###.................",
  "........................#..#..............##############.#......#......#....#.............",
  "..........................#####............###############.......#....#...................",
  "..........................#######...............#########.............#..##...............",
  ".........................#########..............########...............#.###..#...........",
  ".........................############............######.........................##........",
  "..........................###########............######....................##.....#.......",
  "..........................##########.............#######.#....................#...........",
  "............................########............#######..#..................######........",
  "............................#######..............#####..#.................#########.......",
  "............................#####................#####....................##########......",
  "............................#####.................###.....................##########......",
  "...........................#####..................#.......................#....####.......",
  "...........................####..........................................................#",
  "...........................##...........................................................#.",
  "...........................##.............................................................",
  "...........................#..............................................................",
  "............................#.............................................................",
  "..........................................................................................",
  "..........................................................................................",
  ".........................................................#####....################........",
  "...........................#.#.............#############################################..",
  ".........####################...........##############################################....",
  ".........#################....#.###...################################################....",
];
const MAP_DATA = RAW_MAP.map((r) => r.padEnd(180, ".").slice(0, 180));

function isLand(lat: number, lon: number) {
  const y = Math.max(
    0,
    Math.min(MAP_DATA.length - 1, Math.floor(((90 - lat) / 180) * MAP_DATA.length)),
  );
  let normalizedLon = lon;
  while (normalizedLon < -180) normalizedLon += 360;
  while (normalizedLon >= 180) normalizedLon -= 360;
  const x = Math.max(
    0,
    Math.min(
      MAP_DATA[0].length - 1,
      Math.floor(((normalizedLon + 180) / 360) * MAP_DATA[0].length),
    ),
  );
  return MAP_DATA[y][x] === "#";
}

const STATION_COORDS: Record<string, { lat: number; lon: number }> = {
  japan: { lat: 35.6762, lon: 139.6503 },
  iceland: { lat: 64.1466, lon: -21.9426 },
  kerala: { lat: 10.8505, lon: 76.2711 },
  paris: { lat: 48.8566, lon: 2.3522 },
  ny: { lat: 40.7128, lon: -74.006 },
  london: { lat: 51.5074, lon: -0.1278 },
  seoul: { lat: 37.5665, lon: 126.978 },
  swiss: { lat: 46.8182, lon: 8.2275 },
  amazon: { lat: -3.4653, lon: -62.2159 },
  sahara: { lat: 28.0339, lon: 1.6596 },
  rome: { lat: 41.9028, lon: 12.4964 },
  kyoto: { lat: 35.0116, lon: 135.7681 },
  la: { lat: 34.0522, lon: -118.2437 },
  berlin: { lat: 52.52, lon: 13.405 },
  maldives: { lat: 3.2028, lon: 73.2207 },
  seattle: { lat: 47.6062, lon: -122.3321 },
};

// Compile static dot-grid representation of the Earth sphere at module scope
const GLOBE_DOTS: { x: number; y: number; z: number }[] = [];
(function populateGlobeDots() {
  const stepLat = 1.3;
  const stepLon = 1.2;
  for (let lat = -80; lat <= 85; lat += stepLat) {
    const phi = (lat * Math.PI) / 180;
    const cosPhi = Math.cos(phi);
    const adjustedStepLon = cosPhi > 0.1 ? stepLon / cosPhi : 15;
    for (let lon = -180; lon < 180; lon += adjustedStepLon) {
      if (isLand(lat, lon)) {
        const theta = (lon * Math.PI) / 180;
        const x = Math.cos(phi) * Math.sin(theta);
        const y = Math.sin(phi);
        const z = Math.cos(phi) * Math.cos(theta);
        GLOBE_DOTS.push({ x, y, z });
      }
    }
  }
})();

interface ThreeDGlobeProps {
  currentStation: string;
  onSelectStation: (id: string) => void;
  playing: boolean;
}

export function ThreeDGlobe({ currentStation, onSelectStation, playing }: ThreeDGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });
  const [hoveredStation, setHoveredStation] = useState<string | null>(null);

  // Synchronized state references to decouple requestAnimationFrame from react rendering schedules
  const playingRef = useRef(playing);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  const currentStationRef = useRef(currentStation);
  useEffect(() => {
    currentStationRef.current = currentStation;
  }, [currentStation]);

  const hoveredStationRef = useRef<string | null>(null);

  // Math coefficients updated in microtask loop bypass React scheduling delays (reach smooth 60 FPS)
  const rotX = useRef((20 * Math.PI) / 180);
  const rotY = useRef(0);
  const targetRotX = useRef((20 * Math.PI) / 180);
  const targetRotY = useRef(0);

  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragRot = useRef({ x: 0, y: 0 });
  const mousePos = useRef({ x: -1000, y: -1000 });
  const projectedStations = useRef<
    Record<string, { x: number; y: number; z: number; visible: boolean }>
  >({});

  const lastInteractionTime = useRef(Date.now());
  const velocityY = useRef(0);
  const velocityX = useRef(0);

  // When focused station switches, transition target view angles
  useEffect(() => {
    const coords = STATION_COORDS[currentStation];
    if (coords) {
      targetRotY.current = (-coords.lon * Math.PI) / 180;
      targetRotX.current = (coords.lat * Math.PI) / 180;
      velocityY.current = 0;
      velocityX.current = 0;
    }
  }, [currentStation]);

  // Handle high-precision resizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    hasDragged.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragRot.current = { x: targetRotX.current, y: targetRotY.current };
    velocityY.current = 0;
    velocityX.current = 0;
    lastInteractionTime.current = Date.now();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const handlePointerLeave = () => {
    mousePos.current = { x: -1000, y: -1000 };
  };

  const handleCanvasClick = () => {
    if (hasDragged.current) {
      return;
    }
    if (hoveredStation) {
      onSelectStation(hoveredStation);
    }
  };

  useEffect(() => {
    const handleGlobalMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasDragged.current = true;
      }

      const prevRotY = targetRotY.current;
      const prevRotX = targetRotX.current;

      targetRotY.current = dragRot.current.y + dx * 0.005;
      const maxRotX = (80 * Math.PI) / 180;
      targetRotX.current = Math.max(-maxRotX, Math.min(maxRotX, dragRot.current.x - dy * 0.005));

      velocityY.current = targetRotY.current - prevRotY;
      velocityX.current = targetRotX.current - prevRotX;
      lastInteractionTime.current = Date.now();
    };

    const handleGlobalUp = (e: PointerEvent) => {
      if (isDragging.current) {
        try {
          canvasRef.current?.releasePointerCapture(e.pointerId);
        } catch {
          // ignore potential stale/out-of-bounds pointer IDs
        }
        isDragging.current = false;
        lastInteractionTime.current = Date.now();
      }
    };

    window.addEventListener("pointermove", handleGlobalMove);
    window.addEventListener("pointerup", handleGlobalUp);
    window.addEventListener("pointercancel", handleGlobalUp);
    return () => {
      window.removeEventListener("pointermove", handleGlobalMove);
      window.removeEventListener("pointerup", handleGlobalUp);
      window.removeEventListener("pointercancel", handleGlobalUp);
    };
  }, []);

  // Frame Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const renderFrame = (timestamp: number) => {
      // Momentum physics and autopilot spin
      if (!isDragging.current) {
        if (Math.abs(velocityY.current) > 0.0001 || Math.abs(velocityX.current) > 0.0001) {
          targetRotY.current += velocityY.current;
          targetRotX.current += velocityX.current;

          const maxRotX = (80 * Math.PI) / 180;
          targetRotX.current = Math.max(-maxRotX, Math.min(maxRotX, targetRotX.current));

          velocityY.current *= 0.95;
          velocityX.current *= 0.95;
        } else {
          const idleTime = Date.now() - lastInteractionTime.current;
          if (idleTime > 600) {
            targetRotY.current += 0.0018;
          }
        }
      }

      // Smooth spherics interpolation
      rotX.current += (targetRotX.current - rotX.current) * 0.06;
      rotY.current += (targetRotY.current - rotY.current) * 0.06;

      const dpr = window.devicePixelRatio || 1;
      const width = dimensions.width;
      const height = dimensions.height;

      // Adjust backbuffer sizes
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const R = Math.min(width, height) * 0.38;

      // Circular shadow
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.02, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.fill();

      // Ambient orbit stroke
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 107, 53, 0.06)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Transform 3D coordinates
      const projectPoint = (x: number, y: number, z: number) => {
        const cosY = Math.cos(rotY.current);
        const sinY = Math.sin(rotY.current);
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        const y1 = y;

        const cosX = Math.cos(rotX.current);
        const sinX = Math.sin(rotX.current);
        const y2 = y1 * cosX - z1 * sinX;
        const z2 = y1 * sinX + z1 * cosX;
        const x2 = x1;

        return {
          x: cx + x2 * R,
          y: cy - y2 * R,
          z: z2,
        };
      };

      // Segment points into hemispheres
      const backDots: typeof GLOBE_DOTS = [];
      const frontDots: typeof GLOBE_DOTS = [];

      for (const d of GLOBE_DOTS) {
        const pt = projectPoint(d.x, d.y, d.z);
        if (pt.z < 0) {
          backDots.push(pt);
        } else {
          frontDots.push(pt);
        }
      }

      // Map stations locations
      const stationsToDraw: { id: string; x: number; y: number; z: number; isCurrent: boolean }[] =
        [];
      Object.entries(STATION_COORDS).forEach(([id, coords]) => {
        const phi = (coords.lat * Math.PI) / 180;
        const theta = (coords.lon * Math.PI) / 180;

        const sx = Math.cos(phi) * Math.sin(theta);
        const sy = Math.sin(phi);
        const sz = Math.cos(phi) * Math.cos(theta);

        const pt = projectPoint(sx, sy, sz);
        stationsToDraw.push({
          id,
          x: pt.x,
          y: pt.y,
          z: pt.z,
          isCurrent: id === currentStationRef.current,
        });

        projectedStations.current[id] = {
          x: pt.x,
          y: pt.y,
          z: pt.z,
          visible: pt.z >= 0,
        };
      });

      // Render back-hemisphere background dots (extremely faint)
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      for (const d of backDots) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render latitude alignment belt
      ctx.strokeStyle = "rgba(255, 107, 53, 0.03)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, R, Math.abs(R * Math.sin(rotX.current)), 0, 0, Math.PI * 2);
      ctx.stroke();

      // Render front-hemisphere landmass dots with 3D spherical depth shading
      for (const d of frontDots) {
        // d.z represents the depth (from 0.0 at the horizon edges to 1.0 directly in front)
        const depth = Math.max(0, Math.min(1, d.z));

        // Perspective scaling: Dots facing the screen are larger, edge dots are smaller
        const dotRadius = 0.45 + 0.65 * depth;

        // Opacity falloff: front-facing center land dots are bright, fading dynamically at the limb
        const opacity = 0.1 + 0.65 * Math.pow(depth, 1.4);

        ctx.fillStyle = `rgba(244, 241, 235, ${opacity})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Accent focused active region with a soft, glowing heat map
      const currentCoords = STATION_COORDS[currentStationRef.current];
      const activePt = projectedStations.current[currentStationRef.current];
      if (currentCoords && activePt && activePt.z >= 0) {
        for (const d of frontDots) {
          const dx = d.x - activePt.x;
          const dy = d.y - activePt.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = R * 0.45;
          if (dist < maxDist) {
            const distRatio = 1 - dist / maxDist;
            const depth = Math.max(0, Math.min(1, d.z));
            const dotRadius = 0.45 + 0.65 * depth + 0.45 * distRatio;
            const opacity = (0.15 + 0.65 * distRatio) * depth;

            // Draw secondary glowing amber highlights
            ctx.fillStyle = `rgba(255, 107, 53, ${opacity})`;
            ctx.beginPath();
            ctx.arc(d.x, d.y, dotRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Render active front targets
      let nearestStation: string | null = null;
      let minDistance = 14;

      stationsToDraw.forEach((st) => {
        if (st.z < 0) return;

        const dx = mousePos.current.x - st.x;
        const dy = mousePos.current.y - st.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDistance) {
          minDistance = dist;
          nearestStation = st.id;
        }

        const isHovered = hoveredStationRef.current === st.id;

        if (st.isCurrent) {
          const tFactor = (timestamp % 2000) / 2000;

          if (playingRef.current) {
            ctx.strokeStyle = `rgba(255, 107, 53, ${0.4 * (1 - tFactor)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(st.x, st.y, 6 + tFactor * 24, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = `rgba(255, 107, 53, ${0.25 * (1 - ((tFactor + 0.5) % 1.0))})`;
            ctx.beginPath();
            ctx.arc(st.x, st.y, 6 + ((tFactor + 0.5) % 1.0) * 24, 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.beginPath();
          ctx.arc(st.x, st.y, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = "#ff6b35";
          ctx.shadowColor = "#ff5722";
          ctx.shadowBlur = playingRef.current ? 10 : 4;
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.strokeStyle = "rgba(255, 107, 53, 0.7)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(st.x, st.y, 6, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(st.x, st.y, isHovered ? 4 : 3, 0, Math.PI * 2);
          ctx.fillStyle = isHovered ? "#ff6b35" : "rgba(255, 255, 255, 0.6)";
          ctx.shadowColor = isHovered ? "#ff5722" : "transparent";
          ctx.shadowBlur = isHovered ? 6 : 0;
          ctx.fill();
          ctx.shadowBlur = 0;

          if (isHovered) {
            ctx.strokeStyle = "rgba(255, 107, 53, 0.4)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(st.x, st.y, 7, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.arc(st.x, st.y, 5, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      });

      if (nearestStation !== hoveredStationRef.current) {
        hoveredStationRef.current = nearestStation;
        setHoveredStation(nearestStation);
      }

      ctx.restore();
      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, [dimensions]);

  const activeStationData = STATIONS.find((s) => s.id === currentStation);
  const hoveredStationData = hoveredStation ? STATIONS.find((s) => s.id === hoveredStation) : null;
  const hoverPos = hoveredStation ? projectedStations.current[hoveredStation] : null;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center select-none overflow-hidden pb-4 touch-none ${
        hoveredStation ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
      }`}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={handleCanvasClick}
        className="block touch-none"
      />

      {/* Hover tooltips */}
      {hoveredStationData && hoverPos && hoverPos.visible && (
        <div
          className="absolute z-30 pointer-events-none px-3 py-1.5 rounded-lg border border-border/75 bg-background/95 backdrop-blur shadow-xl flex flex-col gap-0.5 select-none animate-in fade-in zoom-in-95 duration-150 transition-all origin-bottom"
          style={{
            left: `${hoverPos.x}px`,
            top: `${hoverPos.y - 12}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="flex items-center gap-1.5 justify-center">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-ember ember-glow" />
            <p className="text-xs font-display text-foreground leading-none">
              {hoveredStationData.title}
            </p>
          </div>
          <p className="text-[9px] text-foreground/50 text-center tracking-widest uppercase">
            {hoveredStationData.country}
          </p>
        </div>
      )}
    </div>
  );
}
