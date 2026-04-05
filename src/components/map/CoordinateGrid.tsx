"use client";

interface CoordinateGridProps {
  viewportW: number;
  viewportH: number;
  minX: number;
  minY: number;
  tileSize: number;
}

export default function CoordinateGrid({ viewportW, viewportH, minX, minY, tileSize }: CoordinateGridProps) {
  const gap = 2;
  const labels: { x: number; y: number; label: string; isRow: boolean }[] = [];

  // Column headers (x axis) - every 5th tile
  for (let c = 0; c < viewportW; c++) {
    const worldX = minX + c;
    if (worldX % 5 === 0 && worldX >= 1 && worldX <= 50) {
      labels.push({ x: c * (tileSize + gap) + tileSize / 2 + gap, y: -2, label: String(worldX), isRow: false });
    }
  }

  // Row headers (y axis) - every 5th tile
  for (let r = 0; r < viewportH; r++) {
    const worldY = minY + r;
    if (worldY % 5 === 0 && worldY >= 1 && worldY <= 50) {
      labels.push({ x: -2, y: r * (tileSize + gap) + tileSize / 2 + gap, label: String(worldY), isRow: true });
    }
  }

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-25 overflow-visible" style={{ margin: '8px' }}>
      {labels.map((l, i) => (
        <text
          key={i}
          x={l.x}
          y={l.y}
          textAnchor={l.isRow ? 'end' : 'middle'}
          dominantBaseline={l.isRow ? 'middle' : 'auto'}
          fill="rgba(255, 198, 62, 0.4)"
          fontSize="8"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {l.label}
        </text>
      ))}

      {/* Grid lines every 5 tiles */}
      {Array.from({ length: viewportW }).map((_, c) => {
        const worldX = minX + c;
        if (worldX % 5 !== 0 || worldX < 1 || worldX > 50) return null;
        const px = c * (tileSize + gap) + gap;
        return (
          <line
            key={`v-${c}`}
            x1={px} y1={0}
            x2={px} y2={viewportH * (tileSize + gap)}
            stroke="rgba(255, 198, 62, 0.08)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        );
      })}
      {Array.from({ length: viewportH }).map((_, r) => {
        const worldY = minY + r;
        if (worldY % 5 !== 0 || worldY < 1 || worldY > 50) return null;
        const py = r * (tileSize + gap) + gap;
        return (
          <line
            key={`h-${r}`}
            x1={0} y1={py}
            x2={viewportW * (tileSize + gap)} y2={py}
            stroke="rgba(255, 198, 62, 0.08)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        );
      })}
    </svg>
  );
}
