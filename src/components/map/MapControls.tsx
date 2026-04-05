"use client";

interface MapNavArrowsProps {
  panMap: (dx: number, dy: number) => void;
}

export function MapNavArrows({ panMap }: MapNavArrowsProps) {
  return (
    <>
      <button onClick={() => panMap(0, -1)} className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/40 text-white/70 rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/60 hover:text-white transition-all text-xs z-20 backdrop-blur-sm border border-white/5" aria-label="Pan Up">▲</button>
      <button onClick={() => panMap(0, 1)} className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/40 text-white/70 rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/60 hover:text-white transition-all text-xs z-20 backdrop-blur-sm border border-white/5" aria-label="Pan Down">▼</button>
      <button onClick={() => panMap(-1, 0)} className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/40 text-white/70 rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/60 hover:text-white transition-all text-xs z-20 backdrop-blur-sm border border-white/5" aria-label="Pan Left">◀</button>
      <button onClick={() => panMap(1, 0)} className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/40 text-white/70 rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/60 hover:text-white transition-all text-xs z-20 backdrop-blur-sm border border-white/5" aria-label="Pan Right">▶</button>
    </>
  );
}

interface ZoomControlsProps {
  zoomIndex: number;
  zoomLevels: number[];
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function ZoomControls({ zoomIndex, zoomLevels, onZoomIn, onZoomOut }: ZoomControlsProps) {
  const pct = Math.round((zoomLevels[zoomIndex] / 48) * 100);
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={onZoomOut}
        disabled={zoomIndex <= 0}
        className="text-[11px] w-7 h-7 bg-surface-highest text-primary border border-primary/30 rounded hover:bg-primary/10 transition-all font-bold disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
      >
        −
      </button>
      <span className="text-[9px] text-primary/60 font-mono w-10 text-center">{pct}%</span>
      <button
        onClick={onZoomIn}
        disabled={zoomIndex >= zoomLevels.length - 1}
        className="text-[11px] w-7 h-7 bg-surface-highest text-primary border border-primary/30 rounded hover:bg-primary/10 transition-all font-bold disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
      >
        +
      </button>
    </div>
  );
}
