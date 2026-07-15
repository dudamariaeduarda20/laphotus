"use client";

interface WeekPoint {
  weekStart: string;
  count: number;
}

interface Props {
  data: WeekPoint[];
}

const WIDTH = 700;
const HEIGHT = 180;
const PADDING = 24;

export default function WeeklySignupsChart({ data }: Props) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const barWidth = (WIDTH - PADDING * 2) / data.length;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full h-auto"
      role="img"
      aria-label="Novos utilizadores por semana"
    >
      {data.map((d, i) => {
        const barHeight = (d.count / max) * (HEIGHT - PADDING * 2);
        const x = PADDING + i * barWidth;
        const y = HEIGHT - PADDING - barHeight;
        return (
          <g key={d.weekStart}>
            <rect
              x={x + barWidth * 0.15}
              y={y}
              width={barWidth * 0.7}
              height={Math.max(barHeight, d.count > 0 ? 2 : 0)}
              rx={2}
              fill="#ff2f92"
              opacity={d.count > 0 ? 1 : 0.15}
            />
            <title>
              Semana de{" "}
              {new Date(d.weekStart).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              })}
              : {d.count} novo{d.count === 1 ? "" : "s"} utilizador
              {d.count === 1 ? "" : "es"}
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
