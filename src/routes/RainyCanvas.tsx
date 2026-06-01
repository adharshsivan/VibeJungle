import { useEffect, useRef, useState } from "react";
import { RainyDay } from "./rainyday_impl";

interface RainyCanvasProps {
  imageUrl: string;
}

export function RainyCanvas({ imageUrl }: RainyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const engineRef = useRef<RainyDay | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    const checkImage = () => {
      const img = imgRef.current;
      if (img && img.complete && img.naturalWidth > 0) {
        setLoaded(true);
      }
    };
    checkImage();
    const interval = setInterval(checkImage, 100);
    return () => clearInterval(interval);
  }, [imageUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const img = imgRef.current;

    if (!canvas || !container || !img || !loaded) return;

    if (img.naturalWidth === 0 || img.naturalHeight === 0) {
      return;
    }

    if (engineRef.current) {
      engineRef.current.pause();
      engineRef.current = null;
    }

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 320;
    canvas.width = width;
    canvas.height = height;

    try {
      const engine = new RainyDay(
        {
          image: img,
          canvas: canvas,
          parentElement: container,
          width: width,
          height: height,
          blur: 1,
          opacity: 1.0,
          fps: 60,
          enableSizeChange: false,
          gravityThreshold: 2.0,
        } as unknown as RainyDayOptions,
        canvas,
      );

      // Fine, premium, realistic rain drops with relaxed frequency
      engine.rain(
        [
          [1, 1, 0.3], // very fine, tiny droplets (radius 1 to 2)
          [2, 2, 0.1], // small, subtle raindrops (radius 2 to 4)
          [3, 2, 0.05], // sparse slightly defined drops (radius 3 to 5)
        ],
        350, // lower spawning frequency (every 350ms) to reduce droplet count and clutter
      );

      engineRef.current = engine;
    } catch (err) {
      console.error("Rain effect init failed:", err);
    }

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      if (canvas && engineRef.current) {
        if (Math.abs(canvas.width - width) > 2 || Math.abs(canvas.height - height) > 2) {
          canvas.width = width;
          canvas.height = height;
          engineRef.current.options.width = width;
          engineRef.current.options.height = height;
          engineRef.current.prepareBackground();
          if (engineRef.current.glass) {
            engineRef.current.glass.width = width;
            engineRef.current.glass.height = height;
          }
          engineRef.current.prepareReflections();
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (engineRef.current) {
        engineRef.current.pause();
        engineRef.current = null;
      }
    };
  }, [imageUrl, loaded]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl overflow-hidden"
    >
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Rain backdrop loader"
        onLoad={() => setLoaded(true)}
        className="hidden"
        style={{ display: "none" }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-100 pointer-events-none"
      />
    </div>
  );
}
