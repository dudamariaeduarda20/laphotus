"use client";

interface DayPoint {
  date: string;
  count: number;
}

interface Props {
  data: DayPoint[];
}

const WIDTH = 700;
const HEIGHT = 180;
const PADDING = 24;

export default function SalesBarChart({ data }: Props) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const barWidth = (WIDTH - PADDING * 2) / data.length;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full h-auto"
      role="img"
      aria-label="Vendas por dia nos últimos 30 dias"
    >
      {data.map((d, i) => {
        const barHeight = (d.count / max) * (HEIGHT - PADDING * 2);
        const x = PADDING + i * barWidth;
        const y = HEIGHT - PADDING - barHeight;
        return (
          <g key={d.date}>
            <rect
              x={x + barWidth * 0.15}
              y={y}
              width={barWidth * 0.7}
              height={Math.max(barHeight, d.count > 0 ? 2 : 0)}
              rx={2}
              fill="#09419b"
              opacity={d.count > 0 ? 1 : 0.15}
            />
            <title>
              {new Date(d.date).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              })}
              : {d.count} venda{d.count === 1 ? "" : "s"}
            </title>
          </g>
        );
      })}
      <line
        x1={PADDING}
        y1={HEIGHT - PADDING}
        x2={WIDTH - PADDING}
        y2={HEIGHT - PADDING}
        stroke="#e2e8f0"
        strokeWidth={1}
      />
    </svg>
  );
}
