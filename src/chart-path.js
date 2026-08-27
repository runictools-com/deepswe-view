export function buildStepPath(points) {
  if (points.length === 0) return "";

  const [first, ...rest] = points;
  return [
    `M ${first.x} ${first.y}`,
    ...rest.flatMap((point) => [`H ${point.x}`, `V ${point.y}`]),
  ].join(" ");
}

export function buildStepSegments(points) {
  if (points.length < 2) return [];

  return points.slice(1).flatMap((point, index) => {
    const previous = points[index];
    return [
      { config: previous.config, d: `M ${previous.x} ${previous.y} H ${point.x}` },
      { config: point.config, d: `M ${point.x} ${previous.y} V ${point.y}` },
    ];
  });
}
