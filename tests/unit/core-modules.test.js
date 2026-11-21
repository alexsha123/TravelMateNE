import { describe, expect, it } from "vitest";
import {
  hasBrowserSupabaseConfig,
  isAdministrativeKey,
  isSafeSupabaseUrl,
  safeAuthRedirectUrl,
  signInWithGoogle,
} from "../../modules/auth.js";
import {
  filterDestinations,
  listDestinationStates,
} from "../../modules/destinations.js";
import { minimumTripBudget } from "../../modules/planner.js";
import {
  normalizeAppearance,
  APPEARANCE_STORAGE_KEY,
} from "../../modules/appearance.js";
import {
  parseSavedPlan,
  serializeItinerary,
} from "../../modules/saved-trips.js";
import {
  heroSlideImageUrls,
  nextSlideIndex,
  SLIDE_AUTOPLAY_MS,
} from "../../modules/slideshow.js";

const destinations = [
  {
    name: "Shillong",
    state: "Meghalaya",
    vibes: ["Culture"],
    seasons: ["Winter"],
  },
  {
    name: "Kaziranga",
    state: "Assam",
    vibes: ["Wildlife"],
    seasons: ["Spring"],
  },
];

describe("shared application modules", () => {
  it("normalizes appearance choices and uses a stable persisted setting key", () => {
    expect(normalizeAppearance("dark")).toBe("dark");
    expect(normalizeAppearance("light")).toBe("light");
    expect(normalizeAppearance("auto")).toBe("auto");
    expect(normalizeAppearance("contrast")).toBe("auto");
    expect(APPEARANCE_STORAGE_KEY).toBe("roamne-appearance");
  });

  it("keeps the hero slideshow interval at exactly three seconds", () => {
    expect(SLIDE_AUTOPLAY_MS).toBe(3000);
  });

  it("filters destinations across search, state, vibe, and season", () => {
    expect(
      filterDestinations(destinations, {
        search: "kaz",
        state: "all",
        vibe: "Wildlife",
        season: "Spring",
      }).map((destination) => destination.name),
    ).toEqual(["Kaziranga"]);
    expect(listDestinationStates(destinations)).toEqual(["Assam", "Meghalaya"]);
  });

  it("accepts only safe project URLs and blocks admin keys from browser config", () => {
    expect(isSafeSupabaseUrl("https://project.supabase.co")).toBe(true);
    expect(isSafeSupabaseUrl("http://project.supabase.co")).toBe(false);
    expect(isSafeSupabaseUrl("https://user:password@project.supabase.co")).toBe(
      false,
    );
    expect(isSafeSupabaseUrl("http://localhost:54321")).toBe(true);
    expect(isAdministrativeKey("sb_secret_forbidden")).toBe(true);
    const serviceRole = `x.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.x`;
    expect(isAdministrativeKey(serviceRole)).toBe(true);
    expect(
      hasBrowserSupabaseConfig({
        url: "https://project.supabase.co",
        publishableKey: "sb_publishable_test",
      }),
    ).toBe(true);
    expect(
      hasBrowserSupabaseConfig({ url: "https://project.supabase.co" }),
    ).toBe(false);
  });

  it("keeps OAuth redirects on the current trusted application origin", () => {
    expect(
      safeAuthRedirectUrl({
        protocol: "https:",
        hostname: "travel.example",
        origin: "https://travel.example",
        pathname: "/planner.html",
      }),
    ).toBe("https://travel.example/planner.html");
    expect(
      safeAuthRedirectUrl({
        protocol: "https:",
        hostname: "travel.example",
        origin: "https://travel.example",
        pathname: "//evil.example",
      }),
    ).toBeNull();
    expect(
      safeAuthRedirectUrl({
        protocol: "http:",
        hostname: "travel.example",
        origin: "http://travel.example",
        pathname: "/",
      }),
    ).toBeNull();
    expect(
      safeAuthRedirectUrl({
        protocol: "https:",
        hostname: "roamne.vercel.app",
        origin: "https://roamne.vercel.app",
        pathname: "/settings.html",
      }),
    ).toBe("https://roamne.vercel.app/settings.html");
  });

  it("starts Google OAuth with the current RoamNE page as its safe redirect", async () => {
    const calls = [];
    const client = {
      auth: {
        signInWithOAuth: async (options) => {
          calls.push(options);
          return { data: { url: "https://accounts.google.com/" }, error: null };
        },
      },
    };
    const redirectTo = safeAuthRedirectUrl({
      protocol: "https:",
      hostname: "roamne.vercel.app",
      origin: "https://roamne.vercel.app",
      pathname: "/settings.html",
    });

    await signInWithGoogle(client, redirectTo);

    expect(calls).toEqual([
      {
        provider: "google",
        options: { redirectTo: "https://roamne.vercel.app/settings.html" },
      },
    ]);
  });

  it("serializes saved itinerary details and tolerates malformed stored JSON", () => {
    const plan = {
      route: "Guwahati → Shillong",
      minDays: 2,
      total: 5200,
      days: [
        {
          day: 1,
          title: "Shillong",
          destination: { name: "Shillong" },
          stay: 1000,
        },
      ],
    };
    const snapshot = serializeItinerary(plan, {
      hub: "Guwahati",
      duration: 2,
      budget: 8000,
      month: "October",
    });
    expect(snapshot.days[0].destination.name).toBe("Shillong");
    expect(parseSavedPlan(JSON.stringify(snapshot))).toEqual(snapshot);
    expect(parseSavedPlan("not-json")).toBeNull();
  });

  it("wraps slide navigation and estimates fixed plus daily trip costs", () => {
    expect(nextSlideIndex(11, 12)).toBe(0);
    expect(nextSlideIndex(0, 12, -1)).toBe(11);
    expect(nextSlideIndex(0, 0)).toBe(0);
    expect(minimumTripBudget(4, 1800, 1200)).toBe(8400);
    expect(
      heroSlideImageUrls({ photo: { src: "/photos/valley.webp" } }),
    ).toEqual({
      desktop: "/photos/valley.webp",
      mobile: "/photos/valley-hero-mobile.webp",
    });
  });
});
