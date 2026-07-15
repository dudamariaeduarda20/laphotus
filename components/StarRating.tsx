interface Props {
  rating: number;
  size?: "sm" | "md";
}

/** Read-only star display — grid cards, review list, average rating. */
export default function StarRating({ rating, size = "sm" }: Props) {
  const rounded = Math.round(rating);
  const textSize = size === "sm" ? "text-sm" : "text-lg";
  return (
    <span className={`${textSize} text-[#f0bf38] leading-none`} aria-label={`${rating} de 5 estrelas`}>
      {"★".repeat(rounded)}
      <span className="text-gray-300">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}
