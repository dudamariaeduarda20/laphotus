"use client";

interface Point {
  date: string;
  total: number;
}

interface Props {
  data: Point[];
}

const WIDTH = 700;
const HEIGHT = 180;
const PADDING = 24;

export default function CumulativeLineChart({ data }: Props) {
  const max = Math.max(1, ...data.map((d) => d.total));
  const stepX = (WIDTH - PADDING * 2) / Math.max(1, data.length - 1);

  const points = data.map((d, i) => {
    const x = PADDING + i * stepX;
    const y = HEIGHT - PADDING - (d.total / max) * (HEIGHT - PADDING * 2);
    return { x, y, d };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");

  const areaPath =
    `${linePath} L${points[points.length - 1]?.x ?? PADDING},${HEIGHT - PADDING} ` +
    `L${PADDING},${HEIGHT - PADDING} Z`;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full h-auto"
      role="img"
      aria-label="Ganhos acumulados nos últimos 30 dias"
    >
      <path d={areaPath} fill="#ff2f92" opacity={0.08} />
      <path d={linePath} fill="none" stroke="#ff2f92" strokeWidth={2} />
      {points.map((p) => (
        <circle key={p.d.date} cx={p.x} cy={p.y} r={2} fill="#ff2f92">
          <title>
            {new Date(p.d.date).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
            })}
            : € {p.d.total.toFixed(2)}
          </title>
        </circle>
      ))}
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
