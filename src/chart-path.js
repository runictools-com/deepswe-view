export function buildStepPath(points) {
  if (points.length === 0) return "";

  const [first, ...rest] = points;
  return [
    `M ${first.x} ${first.y}`,
    ...rest.flatMap((point) => [`H ${point.x}`, `V ${point.y}`]),
  ].join(" ");
}
