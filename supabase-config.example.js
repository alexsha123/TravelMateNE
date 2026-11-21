// Copy this file to supabase-config.js and fill in your project values.
// The browser may contain only the Project URL and publishable key (sb_publishable_...).
// Never place a secret key (sb_secret_...) or legacy service_role key here.
window.TRAVELMATENE_SUPABASE = {
  url: 'https://YOUR_PROJECT_REF.supabase.co',
  publishableKey: 'YOUR_SUPABASE_PUBLISHABLE_KEY',
  tables: {
    destinations: 'destinations',
    profiles: 'profiles',
    favorites: 'favorites',
    itineraries: 'itineraries'
  },
  // Defaults match the documented starter schema; change these names locally
  // if your existing table columns use different names.
  columns: {
    destinations: {
      budget: 'daily_budget',
      vibes: 'vibes',
      seasons: 'seasons',
      latitude: 'latitude',
      longitude: 'longitude',
      details: 'details'
    },
    profiles: { id: 'id', username: 'username' },
    favorites: { userId: 'user_id', destinationId: 'destination_id' },
    itineraries: {
      id: 'id',
      userId: 'user_id',
      title: 'title',
      hub: 'hub',
      month: 'travel_month',
      duration: 'duration',
      totalBudget: 'total_budget',
      estimatedCost: 'estimated_cost',
      plan: 'plan'
    }
  }
};
