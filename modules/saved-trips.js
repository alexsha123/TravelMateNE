export function serializeItinerary(plan, meta) {
  return {
    version: 1,
    route: plan.route,
    minDays: plan.minDays,
    total: plan.total,
    hub: meta.hub,
    duration: meta.duration,
    budget: meta.budget,
    month: meta.month,
    label: meta.label || `${meta.duration}-day ${plan.route} trip`,
    days: plan.days.map((day) => ({
      day: day.day,
      title: day.title,
      transfer: day.transfer,
      fare: day.fare,
      activity: day.activity,
      overnight: day.overnight,
      stay: day.stay,
      meals: day.meals,
      transport: day.transport,
      activities: day.activities,
      permitCost: day.permitCost,
      destination: { ...day.destination },
    })),
  };
}

export function parseSavedPlan(value) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function fetchSavedTrips(client, table, userColumn, userId) {
  const { data, error } = await client
    .from(table)
    .select("*")
    .eq(userColumn, userId);
  if (error) throw error;
  return (data || []).sort((a, b) =>
    String(b.created_at || "").localeCompare(String(a.created_at || "")),
  );
}

export function fetchSavedTrip(
  client,
  table,
  idColumn,
  id,
  userColumn,
  userId,
) {
  return client
    .from(table)
    .select("*")
    .eq(idColumn, id)
    .eq(userColumn, userId)
    .single();
}

export async function insertSavedTrip(client, table, payload) {
  const { error } = await client.from(table).insert(payload);
  if (error) throw error;
}

export async function removeSavedTrip(
  client,
  table,
  idColumn,
  id,
  userColumn,
  userId,
) {
  const { error } = await client
    .from(table)
    .delete()
    .eq(idColumn, id)
    .eq(userColumn, userId);
  if (error) throw error;
}
