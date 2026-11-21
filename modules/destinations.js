export function filterDestinations(destinations, filters) {
  const normalize = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase();
  const query = normalize(filters.search).trim();
  return destinations
    .filter(
      (destination) =>
        !query ||
        [
          destination.name,
          destination.state,
          destination.district,
          destination.description,
          ...(destination.vibes || []),
        ].some((value) => normalize(value).includes(query)),
    )
    .filter(
      (destination) =>
        filters.state === "all" || destination.state === filters.state,
    )
    .filter(
      (destination) =>
        filters.vibe === "all" || destination.vibes.includes(filters.vibe),
    )
    .filter(
      (destination) =>
        filters.season === "all" ||
        destination.seasons.includes(filters.season),
    );
}

export function listDestinationStates(destinations) {
  return [
    ...new Set(destinations.map((destination) => destination.state)),
  ].sort();
}
