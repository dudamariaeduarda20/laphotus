"use client";

interface SportPoint {
  sport: string;
  count: number;
}

interface Props {
  data: SportPoint[];
}

const ROW_HEIGHT = 32;
const LABEL_WIDTH = 120;
const WIDTH = 700;

export default function PhotosBySportChart({ data }: Props) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const barAreaWidth = WIDTH - LABEL_WIDTH - 50;
  const height = data.length * ROW_HEIGHT + 10;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${height}`}
      className="w-full h-auto"
      role="img"
      aria-label="Fotos publicadas por categoria/esporte"
    >
      {data.map((d, i) => {
        const barWidth = (d.count / max) * barAreaWidth;
        const y = i * ROW_HEIGHT + 6;
        return (
          <g key={d.sport}>
            <text
              x={LABEL_WIDTH - 8}
              y={y + 16}
              textAnchor="end"
              fontSize={12}
              fill="#374151"
            >
              {d.sport}
            </text>
            <rect
              x={LABEL_WIDTH}
              y={y}
              width={Math.max(barWidth, 2)}
              height={20}
              rx={3}
              fill="#09419b"
            >
              <title>
                {d.sport}: {d.count} foto{d.count === 1 ? "" : "s"}
              </title>
            </rect>
            <text x={LABEL_WIDTH + barWidth + 8} y={y + 15} fontSize={12} fill="#6b7280">
              {d.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
