"use client";

interface CoordinateGridProps {
  viewportW: number;
  viewportH: number;
  minX: number;
  minY: number;
  tileSize: number;
}

export default function CoordinateGrid({ viewportW, viewportH, minX, minY, tileSize }: CoordinateGridProps) {
  const labels: { x: number; y: number; label: string; isRow: boolean }[] = [];

  // Column headers (x axis) - every 5th tile
  for (let c = 0; c < viewportW; c++) {
    const worldX = minX + c;
    if (worldX % 5 === 0 && worldX >= 1 && worldX <= 50) {
      labels.push({ x: c * tileSize + tileSize / 2, y: -2, label: String(worldX), isRow: false });
    }
  }

  // Row headers (y axis) - every 5th tile
  for (let r = 0; r < viewportH; r++) {
    const worldY = minY + r;
    if (worldY % 5 === 0 && worldY >= 1 && worldY <= 50) {
      labels.push({ x: -2, y: r * tileSize + tileSize / 2, label: String(worldY), isRow: true });
    }
  }

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-25 overflow-visible">
      {labels.map((l, i) => (
        <text
          key={i}
          x={l.x}
          y={l.y < 0 ? 10 : l.y} // Prevent clipping above viewport
          textAnchor={l.isRow ? 'start' : 'middle'} // Shift row labels inside
          dominantBaseline={l.isRow ? 'middle' : 'auto'}
          fill="rgba(255, 255, 255, 0.6)"
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
          style={{ textShadow: '1px 1px 2px black' }}
        >
          {l.label}
        </text>
      ))}

      {/* Vertical grid lines — at LEFT edge of every 5th tile */}
      {Array.from({ length: viewportW }).map((_, c) => {
        const worldX = minX + c;
        if (worldX % 5 !== 0 || worldX < 1 || worldX > 50) return null;
        const px = c * tileSize;
        return (
          <line
            key={`v-${c}`}
            x1={px} y1={0}
            x2={px} y2={viewportH * tileSize}
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        );
      })}

      {/* Horizontal grid lines — at TOP edge of every 5th tile */}
      {Array.from({ length: viewportH }).map((_, r) => {
        const worldY = minY + r;
        if (worldY % 5 !== 0 || worldY < 1 || worldY > 50) return null;
        const py = r * tileSize;
        return (
          <line
            key={`h-${r}`}
            x1={0} y1={py}
            x2={viewportW * tileSize} y2={py}
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        );
      })}
    </svg>
  );
}
