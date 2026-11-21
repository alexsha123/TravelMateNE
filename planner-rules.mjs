export function calculateDayCosts({
  dailyBudget,
  fare,
  overnight,
  permitCost,
}) {
  const budget = Math.max(0, Number(dailyBudget) || 0);
  const transferFare = Math.max(0, Number(fare) || 0);
  const permit = Math.max(0, Number(permitCost) || 0);
  const stay = overnight ? Math.round(budget * 0.4) : 0;
  const meals = Math.round(budget * 0.27);
  const localTransport = Math.round(budget * 0.14);
  const activities = Math.max(
    0,
    budget - stay - meals - localTransport - permit,
  );
  const transport = localTransport + transferFare;

  return {
    stay,
    meals,
    transport,
    activities,
    permitCost: permit,
    total: stay + meals + transport + activities + permit,
  };
}
