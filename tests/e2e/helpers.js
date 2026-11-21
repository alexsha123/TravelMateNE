export const mockDestinations = [
  [
    "Shillong",
    "Meghalaya",
    2200,
    "/assets/images/destinations/shillong.webp",
    25.5788,
    91.8933,
  ],
  [
    "Dawki & Umngot",
    "Meghalaya",
    1800,
    "/assets/images/destinations/dawki-umngot.webp",
    25.187,
    92.0167,
  ],
  [
    "Kaziranga",
    "Assam",
    2600,
    "/assets/images/destinations/kaziranga.webp",
    26.5775,
    93.1711,
  ],
  [
    "Majuli",
    "Assam",
    1700,
    "/assets/images/destinations/majuli.webp",
    26.95,
    94.18,
  ],
  [
    "Tawang",
    "Arunachal Pradesh",
    3200,
    "/assets/images/destinations/tawang.webp",
    27.586,
    91.859,
  ],
  [
    "Ziro Valley",
    "Arunachal Pradesh",
    2400,
    "/assets/images/destinations/ziro-valley.webp",
    27.544,
    93.819,
  ],
  [
    "Dzükōu Valley",
    "Nagaland",
    2100,
    "/assets/images/destinations/dzukou-valley.webp",
    25.53,
    94.03,
  ],
  [
    "Loktak Lake",
    "Manipur",
    1900,
    "/assets/images/destinations/loktak-lake.webp",
    24.55,
    93.78,
  ],
  [
    "Reiek",
    "Mizoram",
    1600,
    "/assets/images/destinations/reiek.webp",
    23.684,
    92.613,
  ],
  [
    "Unakoti",
    "Tripura",
    1500,
    "/assets/images/destinations/unakoti.webp",
    24.327,
    92.0665,
  ],
  [
    "Gangtok",
    "Sikkim",
    2400,
    "/assets/images/destinations/gangtok.webp",
    27.3389,
    88.6065,
  ],
  [
    "Lachung",
    "Sikkim",
    3400,
    "/assets/images/destinations/lachung.webp",
    27.688,
    88.745,
  ],
].map(([name, state, daily_budget, image_url, latitude, longitude], index) => ({
  id: index + 1,
  name,
  state,
  district: state,
  description: `Test fixture for ${name}.`,
  daily_budget,
  image_url,
  latitude,
  longitude,
  vibes: ["Culture", "Adventure"],
  seasons: ["Spring", "Autumn"],
  details: {},
}));

export function installMockSupabase({ destinations, destinationErrors = 0 }) {
  const fixtureUser = (id, email) => ({
    id,
    email,
    user_metadata: { username: email.split("@")[0] },
  });
  const users = {
    "traveler-a@example.test": fixtureUser(
      "test-user-a",
      "traveler-a@example.test",
    ),
    "traveler-b@example.test": fixtureUser(
      "test-user-b",
      "traveler-b@example.test",
    ),
  };
  const initialDatabase = {
    destinations,
    profiles: [
      { id: "test-user-a", username: "traveler-a" },
      { id: "test-user-b", username: "traveler-b" },
    ],
    favorites: [
      { user_id: "test-user-a", destination_id: 1 },
      { user_id: "test-user-b", destination_id: 2 },
    ],
    itineraries: [
      {
        id: "trip-a",
        user_id: "test-user-a",
        title: "A private trip",
        hub: "Guwahati",
        travel_month: "January",
        duration: 3,
        total_budget: 8000,
        estimated_cost: 7000,
        plan: { days: [] },
        created_at: "2026-01-01",
      },
      {
        id: "trip-b",
        user_id: "test-user-b",
        title: "B private trip",
        hub: "Imphal",
        travel_month: "March",
        duration: 2,
        total_budget: 6000,
        estimated_cost: 5000,
        plan: { days: [] },
        created_at: "2026-02-01",
      },
    ],
  };
  let storedDatabase;
  let storedUserId = null;
  try {
    storedDatabase = JSON.parse(localStorage.getItem("travelMateTestDatabase"));
    storedUserId = localStorage.getItem("travelMateTestUser");
  } catch {
    storedDatabase = null;
  }
  const database = storedDatabase || initialDatabase;
  const state = {
    user: Object.values(users).find((user) => user.id === storedUserId) || null,
    database,
    requests: [],
    listeners: [],
    destinationErrorsRemaining: Number(destinationErrors || 0),
  };
  const persist = () =>
    localStorage.setItem(
      "travelMateTestDatabase",
      JSON.stringify(state.database),
    );
  const session = () =>
    state.user
      ? {
          access_token: `test-token-${state.user.id}`,
          token_type: "bearer",
          user: state.user,
        }
      : null;
  const privateTable = (table) =>
    ["favorites", "itineraries", "profiles"].includes(table);
  const ownerColumn = (table) => (table === "profiles" ? "id" : "user_id");

  class TestQuery {
    constructor(table) {
      this.table = table;
      this.operation = "select";
      this.filters = [];
      this.payload = null;
      this.singleRow = false;
    }
    select() {
      if (this.operation === "insert" || this.operation === "update")
        this.returning = true;
      return this;
    }
    eq(column, value) {
      this.filters.push([column, value]);
      return this;
    }
    insert(payload) {
      this.operation = "insert";
      this.payload = payload;
      return this;
    }
    upsert(payload) {
      this.operation = "upsert";
      this.payload = payload;
      return this;
    }
    update(payload) {
      this.operation = "update";
      this.payload = payload;
      return this;
    }
    delete() {
      this.operation = "delete";
      return this;
    }
    single() {
      this.singleRow = true;
      return this.execute();
    }
    then(resolve, reject) {
      return this.execute().then(resolve, reject);
    }
    async execute() {
      state.requests.push({
        table: this.table,
        operation: this.operation,
        filters: [...this.filters],
        payload: this.payload,
      });
      if (
        this.table === "destinations" &&
        state.destinationErrorsRemaining > 0
      ) {
        state.destinationErrorsRemaining -= 1;
        return {
          data: null,
          error: {
            message: "Simulated public destination read failure",
            status: 503,
          },
        };
      }
      if (privateTable(this.table) && !state.user)
        return { data: null, error: { message: "JWT required", status: 401 } };
      const rows = state.database[this.table] || [];
      const owner = ownerColumn(this.table);
      const matches = (row) =>
        (!privateTable(this.table) || row[owner] === state.user.id) &&
        this.filters.every(
          ([key, value]) => String(row[key]) === String(value),
        );
      if (this.operation === "select") {
        const data = rows.filter(matches).map((row) => ({ ...row }));
        if (this.singleRow && data.length !== 1)
          return {
            data: null,
            error: { message: "No rows found", status: 406 },
          };
        return { data: this.singleRow ? data[0] : data, error: null };
      }
      if (this.operation === "insert" || this.operation === "upsert") {
        const inputs = Array.isArray(this.payload)
          ? this.payload
          : [this.payload];
        if (
          privateTable(this.table) &&
          inputs.some((row) => row?.[owner] !== state.user.id)
        )
          return {
            data: null,
            error: {
              message: "row-level security policy violation",
              status: 403,
            },
          };
        const inserted = inputs.map((row, index) => ({
          ...row,
          ...(this.table === "itineraries" && !row.id
            ? {
                id: `saved-${state.database.itineraries.length + index + 1}`,
                created_at: "2026-03-01",
              }
            : {}),
        }));
        if (this.operation === "upsert") {
          const conflictColumns =
            this.table === "favorites"
              ? ["user_id", "destination_id"]
              : [this.table === "profiles" ? "id" : "id"];
          for (const row of inserted) {
            const existing = rows.find((candidate) =>
              conflictColumns.every(
                (column) => String(candidate[column]) === String(row[column]),
              ),
            );
            if (existing) Object.assign(existing, row);
            else rows.push(row);
          }
        } else state.database[this.table].push(...inserted);
        persist();
        return { data: inserted, error: null };
      }
      if (this.operation === "update") {
        const changed = [];
        for (const row of rows.filter(matches)) {
          Object.assign(row, this.payload);
          changed.push({ ...row });
        }
        persist();
        return { data: changed, error: null };
      }
      if (this.operation === "delete") {
        const removed = rows.filter(matches);
        state.database[this.table] = rows.filter((row) => !matches(row));
        persist();
        return { data: removed.map((row) => ({ ...row })), error: null };
      }
      return {
        data: null,
        error: { message: "unsupported test operation", status: 400 },
      };
    }
  }

  const client = {
    auth: {
      async getSession() {
        return { data: { session: session() }, error: null };
      },
      onAuthStateChange(callback) {
        state.listeners.push(callback);
        return { data: { subscription: { unsubscribe() {} } } };
      },
      async signInWithPassword({ email, password }) {
        const user = users[email];
        if (!user || password !== "test-password")
          return {
            data: null,
            error: { message: "Invalid login credentials" },
          };
        state.user = user;
        localStorage.setItem("travelMateTestUser", user.id);
        const next = session();
        state.listeners.forEach((callback) => callback("SIGNED_IN", next));
        return { data: { user, session: next }, error: null };
      },
      async signUp({ email, password }) {
        return this.signInWithPassword({ email, password });
      },
      async signOut() {
        state.user = null;
        localStorage.removeItem("travelMateTestUser");
        state.listeners.forEach((callback) => callback("SIGNED_OUT", null));
        return { error: null };
      },
    },
    from(table) {
      return new TestQuery(table);
    },
  };
  window.__travelMateTestState = state;
  window.__travelMateTestClient = client;
  window.supabase = { createClient: () => client };
}

export async function openApp(
  page,
  { supabase = false, destinationErrors = 0, reducedMotion = "reduce" } = {},
) {
  await page.emulateMedia({ reducedMotion });
  await page.route("https://**/*", (route) => route.abort());
  if (supabase)
    await page.addInitScript(installMockSupabase, {
      destinations: mockDestinations,
      destinationErrors,
    });
  await page.route("**/supabase-config.js", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: supabase
        ? "window.TRAVELMATENE_SUPABASE={url:'https://test-project.supabase.co',publishableKey:'sb_publishable_test_key'};"
        : "window.TRAVELMATENE_SUPABASE=null;",
    }),
  );
  await page.goto("/index.html");
}

export async function signInAs(page, account = "a") {
  await page.getByRole("button", { name: /login|sign up/i }).click();
  await page.locator("#auth-email").fill(`traveler-${account}@example.test`);
  await page.locator("#auth-password").fill("test-password");
  await page.locator("#auth-submit").click();
  await page.getByRole("button", { name: /logout/i }).waitFor();
}
