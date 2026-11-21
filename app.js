import {
  isAdministrativeKey,
  isSafeSupabaseUrl,
  safeAuthRedirectUrl,
  hasBrowserSupabaseConfig,
  initializeAuthSession,
  signInWithEmail as authenticateWithEmail,
  signUpWithEmail,
  signInWithGoogle as authenticateWithGoogle,
} from "./modules/auth.js";
import {
  filterDestinations,
  listDestinationStates,
} from "./modules/destinations.js";
import {
  fallbackDestinations,
  destinationPhotography,
  destinationCoordinates,
} from "./modules/destination-data.js";
let makeItinerary;
import {
  parseSavedPlan,
  serializeItinerary,
  fetchSavedTrips,
  fetchSavedTrip,
  insertSavedTrip,
  removeSavedTrip,
} from "./modules/saved-trips.js";
import { bindIfPresent, escapeHtml } from "./modules/ui.js";
import { startApp } from "./modules/app-init.js";
import { initializeAppearance } from "./modules/appearance.js";

let destinations = fallbackDestinations;
let supabaseClient = null;
let supabaseReady = false;
let authUser = null;
let currentAuthMode = "login";
let deleteAccountRequestInProgress = false;
let favoriteDestinationNames = new Set();
let noticeTimer = null;
const modalReturnFocus = new Map();
let mapLibraryPromise = null;
let mapInitObserver = null;
const states = listDestinationStates(destinations);
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const imageUrl = (id, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

function destinationImageSrc(d, w = 800) {
  const photo = destinationPhotography[d.name];
  if (photo) return photo.src;
  return typeof d.image === "string" &&
    d.image.startsWith("/assets/images/destinations/")
    ? d.image
    : imageUrl(d.image, w);
}
function destinationCardImageSrc(d) {
  const source = destinationImageSrc(d, 800);
  return destinationPhotography[d.name]
    ? source.replace(/\.webp$/, "-card.webp")
    : source;
}
function photoCreditMarkup(d) {
  const p = destinationPhotography[d.name];
  return p
    ? `<p class="image-credit">Photo: <a href="${p.source}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.author)}</a> · <a href="${p.licenseUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.license)}</a>${p.modification ? ` · ${escapeHtml(p.modification)}` : ""}</p>`
    : "";
}
function renderPhotoCredits() {
  const list = $("#photo-credit-list");
  if (!list) return;
  list.innerHTML = Object.entries(destinationPhotography)
    .map(
      ([name, p]) =>
        `<li><strong>${escapeHtml(name)}</strong><span><a href="${p.source}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.title)}</a> · Photo by ${escapeHtml(p.author)} · <a href="${p.licenseUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.license)}</a>${p.modification ? ` · ${escapeHtml(p.modification)}` : ""}</span></li>`,
    )
    .join("");
}

const filterValues = { search: "", state: "all", vibe: "all", season: "all" };

function setMobileNavOpen(
  open,
  { focusFirst = false, restoreFocus = false } = {},
) {
  const nav = $(".main-nav"),
    toggle = $(".mobile-menu");
  if (!nav || !toggle) return false;
  const mobile = matchMedia("(max-width: 650px)").matches,
    isOpen = mobile && Boolean(open);
  nav.classList.toggle("open", isOpen);
  document.body.classList.toggle("navigation-open", isOpen);
  nav.inert = mobile && !isOpen;
  toggle.setAttribute("aria-expanded", String(isOpen));
  toggle.setAttribute(
    "aria-label",
    isOpen ? "Close navigation" : "Open navigation",
  );
  if (focusFirst && isOpen) {
    const first =
      nav.querySelector('[aria-current="page"]') ||
      nav.querySelector("a, button");
    first?.focus({ preventScroll: true });
  } else if (restoreFocus && !isOpen) {
    toggle.focus({ preventScroll: true });
  }
  return isOpen;
}

function syncMobileNavMode() {
  const nav = $(".main-nav");
  if (!nav) return;
  const mobile = matchMedia("(max-width: 650px)").matches;
  if (!mobile) nav.classList.remove("open");
  nav.inert = mobile && !nav.classList.contains("open");
  document.body.classList.toggle(
    "navigation-open",
    mobile && nav.classList.contains("open"),
  );
  if (mobile && !nav.classList.contains("open")) {
    const toggle = $(".mobile-menu");
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.setAttribute("aria-label", "Open navigation");
  }
}

function populateStateFilter() {
  const el = $("#state-filter");
  if (!el) return;
  states.forEach((s) => el.add(new Option(s, s)));
}
function cardMarkup(d) {
  const saved = favoriteDestinationNames.has(d.name),
    fullImage = destinationImageSrc(d, 1200),
    cardImage = destinationCardImageSrc(d),
    responsive = destinationPhotography[d.name]
      ? `srcset="${cardImage} 800w, ${fullImage} 1600w" sizes="(max-width: 650px) calc(100vw - 52px), (max-width: 900px) 40vw, 350px"`
      : "";
  return `<article class="destination-card" tabindex="0" data-destination="${escapeHtml(d.name)}"><div class="destination-image"><img loading="lazy" src="${cardImage}" ${responsive} data-image-retry="true" alt="${escapeHtml(destinationPhotography[d.name]?.alt || `Landscape near ${d.name}`)}" decoding="async"/><span class="destination-state">${escapeHtml(d.state)}</span>${d.gem ? '<span class="gem-badge">✦ HIDDEN GEM</span>' : ""}<button class="heart-button ${saved ? "saved" : ""}" aria-label="${saved ? "Remove" : "Save"} ${escapeHtml(d.name)}" aria-pressed="${saved}">${saved ? "♥" : "♡"}</button></div><div class="destination-body"><div class="destination-title-row"><h3>${escapeHtml(d.name)}</h3><span class="daily-budget"><b>₹${Number(d.budget).toLocaleString("en-IN")}</b> / day</span></div><p>${escapeHtml(d.description)}</p><div class="card-meta"><div class="tag-list">${d.vibes
    .slice(0, 2)
    .map((v) => `<span class="mini-tag">${escapeHtml(v)}</span>`)
    .join("")}</div><span class="card-arrow">↗</span></div></div></article>`;
}
function renderDestinations() {
  const grid = $("#destination-grid");
  if (!grid) return;
  const list = filterDestinations(destinations, filterValues);
  grid.innerHTML = list.map(cardMarkup).join("");
  grid.hidden = !list.length;
  const empty = $("#empty-state");
  if (empty) empty.hidden = !!list.length;
  const count = $("#result-count");
  if (count)
    count.textContent = list.length
      ? `Showing ${list.length} destination${list.length === 1 ? "" : "s"}`
      : "No destinations match your search and filters";
  const emptyHelp = $("#empty-detail");
  if (emptyHelp) {
    const query = filterValues.search.trim();
    emptyHelp.textContent = query
      ? `No places match “${query}”. Try a shorter name or clear your filters.`
      : "Try a different state, vibe or season, or clear your filters to see all 12 places.";
  }
  const chipRoot = $("#filter-chips");
  if (chipRoot) {
    const active = Object.entries(filterValues)
      .filter(([_, v]) => v && v !== "all")
      .map(([k, v]) => (k === "search" ? `“${v}”` : v));
    const chips = active.map((value) => {
      const chip = document.createElement("span");
      chip.className = "filter-chip";
      chip.textContent = value;
      return chip;
    });
    chipRoot.replaceChildren(...chips);
  }
  $("#clear-filters")?.classList.toggle(
    "visible",
    Object.values(filterValues).some((value) => value && value !== "all"),
  );
}
function permitInfo(d) {
  if (d.permit === "ilp") {
    const note =
      d.state === "Arunachal Pradesh"
        ? "Indian citizens from outside Arunachal need an ILP; foreign nationals need the applicable PAP/RAP. Check current eligibility, validity and entry checkpoints on the official portal."
        : d.state === "Nagaland"
          ? "Visitors from outside Nagaland need an ILP. Permit category, documents and fees depend on visitor status; foreign visitors should also check whether a PAP applies."
          : d.state === "Mizoram"
            ? "Non-indigenous visitors generally require an ILP; the state portal lists exceptions and application categories. Confirm current requirements before travel."
            : "Indian citizens who are not indigenous or permanent residents of Manipur need an ILP. Confirm current documents, fees and entry rules on the official portal.";
    return [
      "ILP CHECK REQUIRED",
      "permit-required",
      note + " Carry valid photo ID.",
    ];
  }
  if (d.permit === "pap")
    return [
      "PAP / ROUTE PERMIT",
      "permit-check",
      "Lachung and other restricted North Sikkim routes require advance permits. Requirements differ for Indian and foreign visitors and can change with road conditions; check Sikkim Tourism guidance and arrange required permits through an authorized operator. Carry original photo ID.",
    ];
  return [
    "NO SPECIAL PERMIT LISTED",
    "permit-none",
    "No special permit is listed for this destination in this guide. Rules can vary by nationality, route and current orders; verify with the official tourism authority before departure. Carry valid photo ID.",
  ];
}
function permitLink(d) {
  if (d.state === "Arunachal Pradesh")
    return ["Official Arunachal eILP portal", "https://eilp.arunachal.gov.in/"];
  if (d.state === "Nagaland")
    return ["Official Nagaland ILP portal", "https://ilp.nagaland.gov.in/"];
  if (d.state === "Mizoram")
    return ["Official Mizoram ILP portal", "https://ilp.mizoram.gov.in/"];
  if (d.state === "Manipur")
    return [
      "Official Manipur ILP portal",
      "https://manipurilponline.mn.gov.in/",
    ];
  if (d.state === "Sikkim")
    return [
      "Sikkim Tourism permit information",
      "https://www.sikkimtourism.gov.in/rap",
    ];
  return ["Official state tourism information", "https://tourism.gov.in/"];
}
const defaultColumns = {
  destinations: {
    budget: "daily_budget",
    vibes: "vibes",
    seasons: "seasons",
    latitude: "latitude",
    longitude: "longitude",
    details: "details",
  },
  profiles: { id: "id", username: "username" },
  favorites: { userId: "user_id", destinationId: "destination_id" },
  itineraries: {
    id: "id",
    userId: "user_id",
    title: "title",
    hub: "hub",
    month: "travel_month",
    duration: "duration",
    totalBudget: "total_budget",
    estimatedCost: "estimated_cost",
    plan: "plan",
  },
};
function tableName(key) {
  return (window.TRAVELMATENE_SUPABASE?.tables || {})[key] || key;
}
function dbColumn(table, key) {
  return (
    (window.TRAVELMATENE_SUPABASE?.columns?.[table] || {})[key] ||
    defaultColumns[table][key]
  );
}
function configuredSupabase() {
  return hasBrowserSupabaseConfig(window.TRAVELMATENE_SUPABASE || {});
}
function notify(message, type = "info") {
  const el = $("#app-notice");
  if (!el) return;
  const messageNode = $("#notice-message", el),
    retry = $("#notice-retry", el),
    dismiss = $("#notice-dismiss", el);
  if (messageNode) messageNode.textContent = message;
  else el.textContent = message;
  if (retry) {
    retry.hidden = true;
    retry.onclick = null;
  }
  el.className = "app-notice " + type;
  el.hidden = false;
  if (dismiss && !dismiss.dataset.bound) {
    dismiss.addEventListener("click", () => {
      el.hidden = true;
      clearTimeout(noticeTimer);
    });
    dismiss.dataset.bound = "true";
  }
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => (el.hidden = true), 8500);
}
function notifyWithRetry(message, type, label, action) {
  notify(message, type);
  const notice = $("#app-notice"),
    button = $("#notice-retry", notice);
  if (!button) return;
  button.textContent = label;
  button.hidden = false;
  clearTimeout(noticeTimer);
  button.onclick = async () => {
    button.disabled = true;
    button.textContent = "Retrying…";
    try {
      const succeeded = await action();
      if (succeeded !== false) notice.hidden = true;
      else button.textContent = label;
    } catch {
      button.textContent = label;
    } finally {
      button.disabled = false;
    }
  };
}
function initializeImageRetries() {
  document.addEventListener(
    "error",
    (event) => {
      const image = event.target;
      if (!(image instanceof HTMLImageElement) || !image.dataset.imageRetry)
        return;
      if (image.dataset.fallbackActive === "true") return;
      if (!image.dataset.failedSource)
        image.dataset.failedSource = image.currentSrc || image.src;
      image.dataset.fallbackActive = "true";
      image.removeAttribute("srcset");
      image.removeAttribute("sizes");
      image.src = "/assets/images/destinations/fallback.svg";
      let retry = image.parentElement?.querySelector(".image-retry-button");
      if (!retry) {
        retry = document.createElement("button");
        retry.className = "image-retry-button";
        retry.type = "button";
        retry.textContent = "Retry photo";
        retry.setAttribute(
          "aria-label",
          "Retry loading this destination photo",
        );
        retry.addEventListener("click", () => {
          retry.disabled = true;
          image.dataset.fallbackActive = "false";
          image.src = image.dataset.failedSource;
          retry.textContent = "Loading…";
        });
        image.parentElement?.appendChild(retry);
      } else {
        retry.disabled = false;
        retry.textContent = "Retry photo";
      }
    },
    true,
  );
  document.addEventListener(
    "load",
    (event) => {
      const image = event.target;
      if (
        image instanceof HTMLImageElement &&
        image.dataset.imageRetry &&
        image.dataset.fallbackActive !== "true" &&
        image.naturalWidth > 0
      )
        image.parentElement?.querySelector(".image-retry-button")?.remove();
    },
    true,
  );
}
function initializeBackToTop() {
  const button = $("#back-to-top");
  if (!button) return;
  const update = () => {
    const visible = window.scrollY > 640;
    button.hidden = !visible;
    button.classList.toggle("is-visible", visible);
  };
  window.addEventListener("scroll", update, { passive: true });
  button.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  });
  update();
}
function authMessage(message, isError = false) {
  const el = $("#auth-message");
  el.textContent = message;
  el.classList.toggle("error", isError);
}
function showAppModal(id, focusSelector) {
  const modal = $("#" + id);
  if (!modal) return;
  modalReturnFocus.set(id, document.activeElement);
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  const target = focusSelector
    ? modal.querySelector(focusSelector)
    : modal.querySelector("[role=dialog]");
  target?.focus();
}
function hideAppModal(id) {
  const modal = $("#" + id);
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  const target = modalReturnFocus.get(id);
  if (target?.isConnected) target.focus();
  modalReturnFocus.delete(id);
  if (
    !document.querySelector(
      ".modal-backdrop:not([hidden]),.itinerary-overlay:not([hidden])",
    )
  )
    document.body.style.overflow = "";
}
function trapDialogTab(event) {
  if (event.key !== "Tab") return;
  const modal = [
    ...document.querySelectorAll(
      ".modal-backdrop:not([hidden]),.itinerary-overlay:not([hidden])",
    ),
  ].find((node) => node.querySelector("[role=dialog]"));
  if (!modal) return;
  const dialog = modal.querySelector("[role=dialog]"),
    items = [
      ...dialog.querySelectorAll(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
      ),
    ].filter((node) => node.getClientRects().length);
  if (!items.length) {
    event.preventDefault();
    dialog.focus();
    return;
  }
  const first = items[0],
    last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
function openAuth(mode = "login", message = "") {
  currentAuthMode = mode;
  setAuthMode(mode);
  authMessage(message);
  showAppModal("auth-modal", "#auth-email");
}
function closeAuth() {
  hideAppModal("auth-modal");
}
function setAuthMode(mode) {
  currentAuthMode = mode;
  const signup = mode === "signup";
  $("#auth-login-mode").classList.toggle("active", !signup);
  $("#auth-signup-mode").classList.toggle("active", signup);
  $("#auth-name-wrap").hidden = !signup;
  $("#auth-name").required = signup;
  $("#auth-password").autocomplete = signup
    ? "new-password"
    : "current-password";
  $("#auth-title").textContent = signup
    ? "Create your account"
    : "Welcome back.";
  $("#auth-submit").textContent = signup ? "Create account" : "Sign in";
  authMessage("");
}
function setAuthNav() {
  const button = $("#auth-trigger");
  if (button) {
    button.textContent = authUser ? "Logout" : "Login / Sign Up";
    if (authUser) button.setAttribute("aria-label", "Logout");
    else button.removeAttribute("aria-label");
  }
  // EXPERIMENTAL_ACCOUNT_DELETION_START
  const settings = $("#account-settings");
  if (settings) {
    settings.hidden = !authUser;
    const email = $("#account-email");
    if (email) email.textContent = authUser?.email || "Signed-in account";
  }
  // EXPERIMENTAL_ACCOUNT_DELETION_END
  const state = $("#settings-auth-state");
  if (state)
    state.textContent =
      authUser?.email ||
      "Sign in to see your account details and manage saved data.";
  const signin = $(".settings-signin");
  if (signin) signin.hidden = !!authUser;
}
function openDeleteAccount() {
  if (!authUser) {
    notify("Sign in before opening account settings.", "warning");
    return;
  }
  const modal = $("#delete-account-modal"),
    input = $("#delete-account-confirm"),
    button = $("#delete-account-submit");
  input.value = "";
  $("#delete-account-message").textContent = "";
  $("#delete-account-message").classList.remove("error");
  button.disabled = true;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  input.focus();
}
function closeDeleteAccount() {
  if (deleteAccountRequestInProgress) return;
  $("#delete-account-modal").hidden = true;
  document.body.style.overflow = "";
  $("#delete-account-confirm").value = "";
}
async function deletionResponseMessage(error) {
  try {
    const response = error?.context;
    if (response && typeof response.clone === "function") {
      const body = await response.clone().json();
      if (typeof body?.message === "string") return body.message;
    }
  } catch {
    /* Use the generic message when the response body is malformed. */
  }
  return "We could not confirm account deletion. Your session has been left in place; retry or contact support.";
}
function clearLocalSupabaseSessionFallback() {
  try {
    const configuredKey = supabaseClient?.auth?.storageKey;
    const projectRef = new URL(window.TRAVELMATENE_SUPABASE.url).hostname.split(
      ".",
    )[0];
    localStorage.removeItem(configuredKey || `sb-${projectRef}-auth-token`);
    return true;
  } catch {
    return false;
  }
}
function showLoggedOutHome() {
  $$(".nav-link").forEach((link) =>
    link.classList.toggle("active", link.dataset.tab === "explore"),
  );
  $(".main-nav").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
async function deleteMyAccount() {
  const input = $("#delete-account-confirm"),
    button = $("#delete-account-submit"),
    message = $("#delete-account-message");
  if (deleteAccountRequestInProgress) return;
  if (!authUser || !supabaseReady || !supabaseClient) {
    message.textContent =
      "Your signed-in session is unavailable. Refresh and sign in again before retrying.";
    message.classList.add("error");
    return;
  }
  if (input.value !== "DELETE") {
    message.textContent = "Type DELETE exactly to confirm.";
    message.classList.add("error");
    return;
  }
  deleteAccountRequestInProgress = true;
  button.disabled = true;
  button.textContent = "Deleting…";
  $("#delete-account-cancel").disabled = true;
  $$(".delete-account-close").forEach((close) => (close.disabled = true));
  message.textContent = "Verifying your account and removing its saved data…";
  message.classList.remove("error");
  let serverDeletionConfirmed = false;
  try {
    const { data, error } = await supabaseClient.functions.invoke(
      "delete-account",
      { body: { confirmation: "DELETE" } },
    );
    if (error) throw error;
    if (data?.deleted !== true)
      throw new Error(
        data?.message ||
          "We could not confirm account deletion. Your session has been left in place; retry or contact support.",
      );
    serverDeletionConfirmed = true;
    let localSessionCleared = false;
    try {
      const { error: sessionError } = await supabaseClient.auth.signOut({
        scope: "local",
      });
      localSessionCleared = !sessionError;
      if (sessionError)
        localSessionCleared = clearLocalSupabaseSessionFallback();
    } catch {
      localSessionCleared = clearLocalSupabaseSessionFallback();
    }
    await handleAuthChange(null);
    $("#delete-account-modal").hidden = true;
    document.body.style.overflow = "";
    input.value = "";
    showLoggedOutHome();
    if (localSessionCleared)
      notify(
        "Your account and saved RoamNE data have been deleted.",
        "success",
      );
    else
      notify(
        "Your account was deleted, but this browser could not clear its local session. Close this tab and clear RoamNE site data before returning.",
        "warning",
      );
  } catch (error) {
    if (serverDeletionConfirmed) {
      const localSessionCleared = clearLocalSupabaseSessionFallback();
      await handleAuthChange(null);
      $("#delete-account-modal").hidden = true;
      document.body.style.overflow = "";
      input.value = "";
      showLoggedOutHome();
      notify(
        localSessionCleared
          ? "Your account and saved data were deleted."
          : "Your account was deleted, but local session storage could not be cleared; close this tab and clear site data.",
        "warning",
      );
    } else {
      message.textContent = await deletionResponseMessage(error);
      message.classList.add("error");
    }
  } finally {
    deleteAccountRequestInProgress = false;
    button.textContent = "Delete My Account";
    $("#delete-account-cancel").disabled = false;
    $$(".delete-account-close").forEach((close) => (close.disabled = false));
    button.disabled = input.value !== "DELETE";
  }
}
function setTripsMessage(message) {
  const el = $("#trips-message");
  if (el) el.textContent = message;
}
function normalizeArray(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed
        : value.replace(/^{|}$/g, "").split(",").filter(Boolean);
    } catch {
      return value.replace(/^{|}$/g, "").split(",").filter(Boolean);
    }
  }
  return fallback;
}
function imageKey(value, fallback) {
  if (typeof value !== "string") return fallback;
  if (/^\/?assets\/images\/destinations\/[A-Za-z0-9._-]+$/.test(value))
    return value.startsWith("/") ? value : `/${value}`;
  const match = value.match(/photo-[A-Za-z0-9-]+/);
  return match
    ? match[0]
    : /^photo-[A-Za-z0-9-]+$/.test(value)
      ? value
      : fallback;
}
function loadSupabaseLibrary() {
  if (window.supabase?.createClient) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      error
        ? reject(error)
        : window.supabase?.createClient
          ? resolve()
          : reject(new Error("Supabase client did not initialize."));
    };
    const timer = setTimeout(
      () => finish(new Error("Supabase client download timed out.")),
      8000,
    );
    script.src =
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.2/dist/umd/supabase.js";
    script.integrity =
      "sha384-A97u3Qnt9GZHURO9YJZRe7VQgGUeFzcv6I1oIGnUTxQrCxnpQMwR0/G8F2zt9abZ";
    script.crossOrigin = "anonymous";
    script.async = true;
    script.onload = () => finish();
    script.onerror = () =>
      finish(new Error("Supabase client could not be downloaded."));
    document.head.appendChild(script);
  });
}
function normalizeDestination(row) {
  const details = row[dbColumn("destinations", "details")] || row.details || {},
    base = fallbackDestinations.find((d) => d.name === row.name) || {};
  const lat = Number(
    row[dbColumn("destinations", "latitude")] ??
      row.lat ??
      row.latitude ??
      details.latitude ??
      base.coordinates?.[0],
  );
  const lng = Number(
    row[dbColumn("destinations", "longitude")] ??
      row.lng ??
      row.longitude ??
      details.longitude ??
      base.coordinates?.[1],
  );
  const val = (names, fallback) => {
    for (const name of names) {
      if (row[name] !== undefined && row[name] !== null) return row[name];
      if (details[name] !== undefined && details[name] !== null)
        return details[name];
    }
    return fallback;
  };
  return {
    ...base,
    ...details,
    id: row.id,
    name: row.name || base.name,
    state: row.state || details.state || base.state,
    district: val(["district"], base.district),
    description: row.description || details.description || base.description,
    descriptionLong: val(
      ["description_long", "descriptionLong"],
      base.descriptionLong || row.description,
    ),
    budget: Number(
      row[dbColumn("destinations", "budget")] ??
        row.daily_budget_inr ??
        row.budget_per_day ??
        row.budget ??
        details.budget ??
        base.budget ??
        0,
    ),
    vibes: normalizeArray(
      row[dbColumn("destinations", "vibes")] ??
        row.travel_vibes ??
        row.vibes ??
        details.vibes,
      base.vibes || [],
    ),
    seasons: normalizeArray(
      row[dbColumn("destinations", "seasons")] ??
        row.best_seasons ??
        row.seasons ??
        details.seasons,
      base.seasons || [],
    ),
    coordinates:
      Number.isFinite(lat) && Number.isFinite(lng)
        ? [lat, lng]
        : base.coordinates || null,
    image: imageKey(
      row.image_url || row.image || details.image,
      base.image || "photo-1470770841072-f978cf4d019e",
    ),
    airport: val(["airport", "nearest_airport"], base.airport || ""),
    rail: val(["rail", "nearest_railway", "rail_hub"], base.rail || ""),
    gem: Boolean(val(["gem", "hidden_gem"], base.gem)),
    permit: val(["permit"], base.permit || "none"),
    network: val(
      ["network", "mobile_network"],
      base.network || "Not specified",
    ),
    atm: val(["atm", "atm_availability"], base.atm || "Not specified"),
    transport: val(
      ["transport", "local_transport"],
      base.transport || "Ask local operators",
    ),
    dishes: normalizeArray(
      val(["dishes", "local_dishes"], base.dishes),
      base.dishes || [],
    ),
    etiquette: val(
      ["etiquette", "cultural_etiquette"],
      base.etiquette || "Ask before photographing and follow local guidance.",
    ),
  };
}
async function loadRemoteDestinations() {
  if (!supabaseReady) return false;
  try {
    const result = await Promise.race([
      supabaseClient.from(tableName("destinations")).select("*"),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Destination request timed out.")),
          8000,
        ),
      ),
    ]);
    if (result.error) throw result.error;
    if (!result.data?.length)
      throw new Error(
        "The destination table is empty or not readable with its current policies.",
      );
    destinations = result.data.map(normalizeDestination);
    renderDestinations();
    const guideDestination = $("#guide-destination");
    if (guideDestination) renderGuide(guideDestination.value);
    if (destinationMap) {
      destinationMapMarkers.forEach((marker) => marker.remove());
      destinationMapMarkers = [];
      const points = [];
      destinations.forEach((d) => {
        if (!d.coordinates) return;
        const marker = L.marker(d.coordinates, {
          icon: destinationMapIcon(d),
          title: d.name,
          alt: d.name,
        }).addTo(destinationMap);
        marker.bindTooltip(
          "<strong>" +
            escapeHtml(d.name) +
            "</strong><br><span>" +
            escapeHtml(d.state) +
            " · est. ₹" +
            Number(d.budget).toLocaleString("en-IN") +
            "/day</span>",
        );
        marker.on("click", () => openDestination(d.name));
        destinationMapMarkers.push(marker);
        points.push(d.coordinates);
      });
      if (points.length)
        destinationMap.fitBounds(points, { padding: [28, 28], maxZoom: 6 });
    }
    return true;
  } catch (error) {
    console.warn(
      "Supabase destinations unavailable; using bundled data.",
      error,
    );
    notifyWithRetry(
      "Supabase destinations could not be loaded. The bundled destination list remains available; check your connection or public table access and retry.",
      "warning",
      "Retry destinations",
      loadRemoteDestinations,
    );
    return false;
  }
}
async function refreshFavorites() {
  favoriteDestinationNames = new Set();
  if (!supabaseReady || !authUser) {
    renderDestinations();
    return;
  }
  const userColumn = dbColumn("favorites", "userId"),
    destinationColumn = dbColumn("favorites", "destinationId");
  try {
    const { data, error } = await supabaseClient
      .from(tableName("favorites"))
      .select(destinationColumn)
      .eq(userColumn, authUser.id);
    if (error) throw error;
    (data || []).forEach((row) => {
      const ref = String(row[destinationColumn]);
      const d = destinations.find(
        (item) => String(item.id ?? item.name) === ref,
      );
      if (d) favoriteDestinationNames.add(d.name);
    });
    renderDestinations();
  } catch (error) {
    console.warn("Could not restore favorites.", error);
    notify(
      "Favorites could not be loaded. Check the favorites table columns and RLS policies.",
      "warning",
    );
  }
}
async function upsertProfile(user) {
  const columns = {
      id: dbColumn("profiles", "id"),
      username: dbColumn("profiles", "username"),
    },
    payload = {
      [columns.id]: user.id,
      [columns.username]:
        user.user_metadata?.username ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Traveler",
    };
  try {
    const { error } = await supabaseClient
      .from(tableName("profiles"))
      .upsert(payload, { onConflict: columns.id });
    if (error) throw error;
  } catch (error) {
    console.warn(
      "Profile row was not written; check the existing profiles policy and columns.",
      error,
    );
    notify(
      "Signed in, but the profile could not be synced. Check the existing profiles columns and RLS policy.",
      "warning",
    );
  }
}
async function handleAuthChange(user) {
  authUser = user || null;
  setAuthNav();
  if (authUser) {
    await upsertProfile(authUser);
    await refreshFavorites();
    await loadSavedTrips();
  } else {
    favoriteDestinationNames.clear();
    renderDestinations();
    renderSavedTrips([]);
    setTripsMessage(
      supabaseReady
        ? "Sign in to save and revisit your itineraries."
        : "Set up Supabase to enable private saved trips.",
    );
  }
}
async function initializeSupabase() {
  setAuthNav();
  if (!configuredSupabase()) {
    setTripsMessage(
      "Add the local Supabase URL and publishable key to enable accounts and saved trips.",
    );
    if (location.protocol === "https:")
      notify(
        "Supabase is not configured in this build. Destination browsing uses bundled data; sign-in, favorites and saved trips need Vercel SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY build settings.",
        "warning",
      );
    return false;
  }
  const config = window.TRAVELMATENE_SUPABASE;
  if (!isSafeSupabaseUrl(config.url)) {
    notify(
      "Supabase was not initialized: use an HTTPS project URL (HTTP is allowed only on localhost).",
      "error",
    );
    setTripsMessage(
      "The configured Supabase URL is not safe for browser authentication.",
    );
    return false;
  }
  if (isAdministrativeKey(config.publishableKey)) {
    notify(
      "Supabase was not initialized: browser configuration must use a publishable key, never a secret or service-role key.",
      "error",
    );
    setTripsMessage("The local key is not a publishable key.");
    return false;
  }
  try {
    await loadSupabaseLibrary();
    supabaseClient = window.supabase.createClient(
      config.url,
      config.publishableKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    );
    supabaseReady = true;
    await initializeAuthSession(supabaseClient, handleAuthChange);
    await loadRemoteDestinations();
    return true;
  } catch (error) {
    console.error("Supabase initialization failed.", error);
    notifyWithRetry(
      "Supabase could not connect. The explorer is using bundled destinations; check your connection and retry.",
      "warning",
      "Retry connection",
      async () => {
        supabaseClient = null;
        supabaseReady = false;
        await initializeSupabase();
        return supabaseReady;
      },
    );
    return false;
  }
}
async function submitAuth(event) {
  event.preventDefault();
  if (!supabaseReady) {
    authMessage("Add your local Supabase URL and publishable key first.", true);
    return;
  }
  const email = $("#auth-email").value.trim(),
    password = $("#auth-password").value,
    name = $("#auth-name").value.trim(),
    button = $("#auth-submit");
  button.disabled = true;
  authMessage("Connecting…");
  try {
    if (currentAuthMode === "signup") {
      const { data, error } = await signUpWithEmail(supabaseClient, {
        email,
        password,
        username: name,
        redirectTo: safeAuthRedirectUrl(),
      });
      if (error) throw error;
      if (data.session) {
        authMessage("Account created. You are signed in.");
        closeAuth();
      } else
        authMessage(
          "Check your email to confirm your account, then return here to sign in.",
        );
    } else {
      const { error } = await authenticateWithEmail(supabaseClient, {
        email,
        password,
      });
      if (error) throw error;
      authMessage("Signed in.");
      closeAuth();
    }
  } catch (error) {
    authMessage(
      error.message ||
        "Could not complete that request. Check your connection and try again.",
      true,
    );
  } finally {
    button.disabled = false;
  }
}
async function signInWithGoogle() {
  if (!supabaseReady) {
    authMessage("Add your local Supabase URL and publishable key first.", true);
    return;
  }
  const button = $("#auth-google");
  button.disabled = true;
  authMessage("Connecting to Google…");
  try {
    const { error } = await authenticateWithGoogle(
      supabaseClient,
      safeAuthRedirectUrl(),
    );
    if (error) throw error;
    authMessage("Redirecting to Google…");
  } catch (error) {
    authMessage(
      error.message ||
        "Google sign-in could not start. Check the Google provider settings in Supabase and try again.",
      true,
    );
    button.disabled = false;
  }
}
function consumeOAuthRedirectError() {
  const url = new URL(location.href),
    keys = ["error", "error_code", "error_description"];
  let message = "";
  for (const source of ["search", "hash"]) {
    const raw = source === "search" ? url.search.slice(1) : url.hash.slice(1);
    if (!raw) continue;
    const params = new URLSearchParams(raw),
      description = params.get("error_description"),
      code = params.get("error_code") || params.get("error");
    if (!message && (description || code)) message = description || code;
    keys.forEach((key) => params.delete(key));
    const remaining = params.toString();
    if (source === "search") url.search = remaining ? `?${remaining}` : "";
    else url.hash = remaining ? `#${remaining}` : "";
  }
  if (!message) return "";
  history.replaceState(history.state, "", url.pathname + url.search + url.hash);
  return `Google sign-in failed: ${message.slice(0, 300)}`;
}
function renderGuide(name) {
  if (!$("#guide-content") || !$("#culture-content")) return;
  const d = destinations.find((x) => x.name === name) || destinations[0];
  if (!d) return;
  const [badge, cls, permit] = permitInfo(d),
    [linkLabel, linkUrl] = permitLink(d),
    monsoon = ["June", "July", "August", "September"].includes(
      $("#guide-month-input")?.value || $("#month-input")?.value || "",
    );
  const warning = monsoon
    ? "Heavy monsoon: expect landslide risk, road delays and ferry/trek disruptions. Check locally before departure."
    : `Best season: ${d.seasons.map(escapeHtml).join(" · ")}. Check same-day road and weather updates before setting out.`;
  $("#guide-content").innerHTML =
    `<article class="guide-card"><div class="guide-card-head"><span class="guide-icon">▣</span><h3>Permits & entry</h3><span class="permit-status ${cls}">${badge}</span></div><p>${escapeHtml(permit)}</p><a class="official-link" href="${linkUrl}" target="_blank" rel="noopener">${escapeHtml(linkLabel)} ↗</a></article><article class="guide-card"><div class="guide-card-head"><span class="guide-icon">⌁</span><h3>Stay connected</h3></div><div class="condition-row"><span>Mobile network</span><strong>${escapeHtml(d.network)}</strong></div><div class="condition-row"><span>ATMs & cash</span><strong>${escapeHtml(d.atm)}</strong></div></article><article class="guide-card"><div class="guide-card-head"><span class="guide-icon">☼</span><h3>Road & season</h3></div><p class="${monsoon ? "condition-row warning" : ""}">${warning}</p><div class="condition-row"><span>Closest hubs</span><strong>${escapeHtml(d.airport)} · ${escapeHtml(d.rail)}</strong></div></article>`;
  $("#culture-content").innerHTML =
    `<div class="culture-heading"><span class="section-kicker">A LITTLE LOCAL KNOW-HOW</span><h3>${escapeHtml(d.name)}, thoughtfully.</h3><p>Small gestures make a better journey.</p></div><div class="culture-column"><h4>GETTING AROUND</h4><p>${escapeHtml(d.transport)}</p></div><div class="culture-column"><h4>TRY A BITE</h4><div class="dish-list">${d.dishes.map((x) => `<span class="dish-pill">${escapeHtml(x)}</span>`).join("")}</div></div><div class="culture-column"><h4>LOCAL ETIQUETTE</h4><p>${escapeHtml(d.etiquette)}</p></div>`;
}
function setTab(tab) {
  const routes = {
    explore: "/",
    planner: "/planner.html",
    guide: "/guide.html",
    trips: "/trips.html",
    settings: "/settings.html",
  };
  const route = routes[tab];
  if (
    route &&
    location.pathname !== route &&
    !(tab === "explore" && location.pathname === "/index.html")
  ) {
    location.assign(route);
    return;
  }
  document.getElementById(`${tab}-section`)?.scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
    block: "start",
  });
  if (tab === "trips") loadSavedTrips();
  if (innerWidth <= 650) setMobileNavOpen(false);
}
function openDestination(name) {
  const d = destinations.find((x) => x.name === name);
  if (!d) return;
  const [badge, , permit] = permitInfo(d);
  $("#modal-content").innerHTML =
    `<div class="modal-hero"><img src="${destinationImageSrc(d, 1200)}" data-image-retry="true" alt="${escapeHtml(destinationPhotography[d.name]?.alt || d.name)}" decoding="async"/><span>${escapeHtml(d.district)} · ${escapeHtml(d.state)}</span></div><div class="modal-inner"><span class="section-kicker">${d.gem ? "HIDDEN GEM" : "NORTH EAST FAVOURITE"} · ${badge}</span><h2 id="modal-title">${escapeHtml(d.name)}</h2>${photoCreditMarkup(d)}<p>${escapeHtml(d.descriptionLong)}</p><div class="modal-stats"><span>EST. DAILY BUDGET<b>₹${Number(d.budget).toLocaleString("en-IN")} / person</b></span><span>NEAREST AIRPORT<b>${escapeHtml(d.airport)}</b></span><span>RAIL HUB<b>${escapeHtml(d.rail)}</b></span></div><h3>Worth knowing</h3><p>${escapeHtml(permit)}</p><p><b>Mobile:</b> ${escapeHtml(d.network)} <b>ATMs:</b> ${escapeHtml(d.atm)}</p><h3>Get around</h3><p>${escapeHtml(d.transport)}</p><h3>Taste & travel kindly</h3><p><b>Try:</b> ${d.dishes.map(escapeHtml).join(", ")}. ${escapeHtml(d.etiquette)}</p><button class="button button-primary modal-plan" data-destination-plan="${escapeHtml(d.name)}">Plan a trip here <span>→</span></button></div>`;
  showAppModal("destination-modal", ".modal-close");
}
function closeModal() {
  hideAppModal("destination-modal");
}
function closeItinerary() {
  hideAppModal("itinerary-overlay");
}
function renderSavedTrips(rows) {
  const grid = $("#saved-trips-grid");
  if (!grid) return;
  const empty = $("#empty-trips");
  if (!authUser) {
    grid.innerHTML = "";
    if (empty) empty.hidden = false;
    return;
  }
  if (!rows.length) {
    grid.innerHTML = "";
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;
  grid.innerHTML = rows
    .map((row) => {
      const data = parseSavedPlan(row[dbColumn("itineraries", "plan")]);
      const id = String(row[dbColumn("itineraries", "id")] ?? row.id ?? "");
      const title =
        row[dbColumn("itineraries", "title")] || data?.label || "Saved trip";
      const days = Number(
        row[dbColumn("itineraries", "duration")] ||
          data?.duration ||
          data?.days?.length ||
          0,
      );
      const total = Number(
        row[dbColumn("itineraries", "estimatedCost")] || data?.total || 0,
      );
      const hub =
        row[dbColumn("itineraries", "hub")] || data?.hub || "Starting hub";
      const month =
        row[dbColumn("itineraries", "month")] || data?.month || "Month";
      return (
        '<article class="saved-trip-card" data-trip-id="' +
        escapeHtml(id) +
        '"><span class="section-kicker">SAVED ITINERARY · ' +
        days +
        " DAYS</span><h3>" +
        escapeHtml(title) +
        "</h3><p>" +
        escapeHtml(hub + " · " + month) +
        " · Estimated ₹" +
        total.toLocaleString("en-IN") +
        '</p><div class="saved-trip-actions"><button class="button button-secondary" data-trip-open="' +
        escapeHtml(id) +
        '">Open & print</button><button class="saved-trip-delete" data-trip-delete="' +
        escapeHtml(id) +
        '">Delete</button></div></article>'
      );
    })
    .join("");
}
async function loadSavedTrips() {
  if (!authUser || !supabaseReady) {
    renderSavedTrips([]);
    return;
  }
  setTripsMessage("Loading your private itineraries…");
  const userColumn = dbColumn("itineraries", "userId");
  try {
    const rows = await fetchSavedTrips(
      supabaseClient,
      tableName("itineraries"),
      userColumn,
      authUser.id,
    );
    renderSavedTrips(rows);
    setTripsMessage(
      rows.length
        ? "Your saved itineraries are visible only to your account."
        : "Your saved trips will appear here.",
    );
  } catch (error) {
    console.warn("Could not load saved itineraries.", error);
    renderSavedTrips([]);
    setTripsMessage(
      "Could not load trips. Check the existing itinerary columns and RLS policy.",
    );
  }
}
async function saveCurrentItinerary() {
  if (!authUser) {
    openAuth("login", "Sign in to save this itinerary.");
    return;
  }
  if (!supabaseReady) {
    notify(
      "Add the local Supabase URL and publishable key to save trips.",
      "warning",
    );
    return;
  }
  const plan = window.currentItinerary,
    meta = window.currentItineraryMeta;
  if (!plan || !meta) {
    notify("Generate a trip plan before saving it.", "warning");
    return;
  }
  const snapshot = serializeItinerary(plan, meta),
    columns = {
      userId: dbColumn("itineraries", "userId"),
      title: dbColumn("itineraries", "title"),
      hub: dbColumn("itineraries", "hub"),
      month: dbColumn("itineraries", "month"),
      duration: dbColumn("itineraries", "duration"),
      totalBudget: dbColumn("itineraries", "totalBudget"),
      estimatedCost: dbColumn("itineraries", "estimatedCost"),
      plan: dbColumn("itineraries", "plan"),
    },
    payload = {
      [columns.userId]: authUser.id,
      [columns.title]: meta.label || plan.route,
      [columns.hub]: meta.hub,
      [columns.month]: meta.month,
      [columns.duration]: meta.duration,
      [columns.totalBudget]: meta.budget,
      [columns.estimatedCost]: plan.total,
      [columns.plan]: snapshot,
    },
    button = $("#save-itinerary");
  if (button) {
    button.disabled = true;
    button.textContent = "Saving…";
  }
  try {
    await insertSavedTrip(supabaseClient, tableName("itineraries"), payload);
    notify("Itinerary saved to My trips.", "success");
    await loadSavedTrips();
  } catch (error) {
    console.error("Could not save itinerary.", error);
    notify(
      "Could not save this trip. Check the itinerary table columns and RLS policy.",
      "error",
    );
  } finally {
    const current = $("#save-itinerary");
    if (current) {
      current.disabled = false;
      current.textContent = "Save itinerary";
    }
  }
}
async function deleteSavedTrip(id) {
  if (!authUser || !supabaseReady) return;
  const idColumn = dbColumn("itineraries", "id"),
    userColumn = dbColumn("itineraries", "userId");
  try {
    await removeSavedTrip(
      supabaseClient,
      tableName("itineraries"),
      idColumn,
      id,
      userColumn,
      authUser.id,
    );
    notify("Saved itinerary deleted.", "success");
    await loadSavedTrips();
  } catch (error) {
    console.error("Could not delete itinerary.", error);
    notify(
      "Could not delete this trip. Check the existing itinerary policy.",
      "error",
    );
  }
}
function openSavedTrip(id) {
  const card = $(
    '.saved-trip-card[data-trip-id="' + CSS.escape(String(id)) + '"]',
  );
  if (!card) return;
  const rawId = dbColumn("itineraries", "id"),
    rawData = dbColumn("itineraries", "plan");
  fetchSavedTrip(
    supabaseClient,
    tableName("itineraries"),
    rawId,
    id,
    dbColumn("itineraries", "userId"),
    authUser.id,
  ).then(({ data, error }) => {
    if (error || !data) {
      notify("Could not open the saved trip.", "error");
      return;
    }
    let snapshot = data[rawData];
    if (typeof snapshot === "string") {
      try {
        snapshot = JSON.parse(snapshot);
      } catch {
        snapshot = null;
      }
    }
    if (!snapshot?.days) {
      notify("This saved itinerary uses an unsupported data format.", "error");
      return;
    }
    const plan = {
      route: snapshot.route,
      minDays: snapshot.minDays || snapshot.duration,
      total: snapshot.total,
      hub: snapshot.hub,
      month: snapshot.month,
      days: snapshot.days.map((day) => ({
        ...day,
        destination:
          destinations.find((d) => d.name === day.destination?.name) ||
          day.destination,
      })),
    };
    const tripHub = data[dbColumn("itineraries", "hub")] || snapshot.hub,
      tripMonth = data[dbColumn("itineraries", "month")] || snapshot.month,
      tripDuration = Number(
        data[dbColumn("itineraries", "duration")] ||
          snapshot.duration ||
          plan.days.length,
      ),
      tripBudget = Number(
        data[dbColumn("itineraries", "totalBudget")] ||
          snapshot.budget ||
          snapshot.total,
      );
    window.currentItinerary = plan;
    window.currentItineraryMeta = {
      hub: tripHub,
      duration: tripDuration,
      budget: tripBudget,
      month: tripMonth,
      label: data[dbColumn("itineraries", "title")] || snapshot.label,
    };
    showItinerary(plan, {
      budget: tripBudget,
      month: tripMonth || "January",
      duration: tripDuration,
      hub: tripHub || "Unknown",
      presetLabel: data[dbColumn("itineraries", "title")] || snapshot.label,
      saved: true,
    });
  });
}
async function toggleFavorite(destination, button) {
  if (!authUser) {
    openAuth("login", "Sign in to save places to your favourites.");
    return;
  }
  if (!supabaseReady) {
    notify(
      "Add the local Supabase URL and publishable key to save favourites.",
      "warning",
    );
    return;
  }
  if (destination.id == null) {
    notify(
      "This destination is not linked to a database record yet. Check public read access and seed the destinations table.",
      "warning",
    );
    return;
  }
  const userColumn = dbColumn("favorites", "userId"),
    destinationColumn = dbColumn("favorites", "destinationId"),
    reference = destination.id,
    saved = favoriteDestinationNames.has(destination.name);
  button.disabled = true;
  try {
    if (saved) {
      const { error } = await supabaseClient
        .from(tableName("favorites"))
        .delete()
        .eq(userColumn, authUser.id)
        .eq(destinationColumn, reference);
      if (error) throw error;
      favoriteDestinationNames.delete(destination.name);
    } else {
      const { error } = await supabaseClient
        .from(tableName("favorites"))
        .insert({ [userColumn]: authUser.id, [destinationColumn]: reference });
      if (error) throw error;
      favoriteDestinationNames.add(destination.name);
    }
    renderDestinations();
  } catch (error) {
    console.error("Could not update favorite.", error);
    notify(
      "Could not update this favourite. Check the favorites table columns and RLS policy.",
      "error",
    );
  } finally {
    const current = $(
      '.heart-button[aria-label*="' + CSS.escape(destination.name) + '"]',
    );
    if (current) current.disabled = false;
  }
}
function showItinerary(plan, options) {
  const budget = options.budget,
    month = options.month,
    duration = options.duration,
    hub = options.hub,
    actual = plan.total;
  let title = "",
    reason = "";
  if (duration < plan.minDays) {
    title = "This route needs more time.";
    reason =
      plan.route +
      " is best planned over at least " +
      plan.minDays +
      " days for its transfer legs and time at the destination. Extend the trip or choose a closer route.";
    if (actual > budget)
      reason +=
        " It is also estimated at ₹" +
        actual.toLocaleString("en-IN") +
        ", above your budget.";
  } else if (actual > budget) {
    title = "A little more budget is needed.";
    reason =
      "This practical route is estimated at ₹" +
      actual.toLocaleString("en-IN") +
      " per person. Increase the budget or shorten the trip. The estimate includes transfers, accommodation, meals, activities and permits.";
  }
  if (title) {
    $("#itinerary-content").innerHTML =
      '<div class="itinerary-head"><span class="section-kicker">TRIP CHECK</span><h2 id="itinerary-title">' +
      title +
      "</h2><p>" +
      reason +
      '</p></div><div class="budget-summary"><span>ESTIMATED ROUTE COST</span><strong>₹' +
      actual.toLocaleString("en-IN") +
      '</strong></div><button class="button button-primary itinerary-close-button">Back to planner <span>→</span></button>';
  } else {
    const totals = plan.days.reduce(
      (s, d) => ({
        stay: s.stay + d.stay,
        meals: s.meals + d.meals,
        transport: s.transport + d.transport,
        activities: s.activities + d.activities,
        permits: s.permits + d.permitCost,
      }),
      { stay: 0, meals: 0, transport: 0, activities: 0, permits: 0 },
    );
    const monsoon = ["June", "July", "August", "September"].includes(month),
      warning = monsoon
        ? "Monsoon warning: June–September can bring landslides, road closures and ferry delays. Reconfirm conditions locally."
        : "Times and fares are approximate. Roads, shared rides, activities and permits are not live; confirm before travel.";
    const days = plan.days
      .map(
        (x) =>
          '<article class="itinerary-day"><div class="day-top"><span class="day-number">' +
          x.day +
          "</span><h3>" +
          escapeHtml(x.title) +
          '</h3></div><div class="day-activities"><b>' +
          escapeHtml(x.transfer) +
          "</b><br>" +
          escapeHtml(x.activity) +
          '</div><div class="day-costs"><span>Stay <b>₹' +
          x.stay +
          "</b></span><span>Meals <b>₹" +
          x.meals +
          "</b></span><span>Transport <b>₹" +
          x.transport +
          "</b></span><span>Activities <b>₹" +
          x.activities +
          "</b></span><span>Permits <b>₹" +
          x.permitCost +
          "</b></span></div></article>",
      )
      .join("");
    const label =
      options.presetLabel || duration + "-day " + plan.route + " trip";
    $("#itinerary-content").innerHTML =
      '<header class="itinerary-head"><span class="section-kicker">RULE-BASED ESTIMATE · APPROXIMATE INR</span><h2 id="itinerary-title">' +
      escapeHtml(label) +
      "</h2><p>Starting in " +
      escapeHtml(hub) +
      " · " +
      duration +
      " days · " +
      escapeHtml(month) +
      '</p><div class="budget-summary"><span>ESTIMATED TOTAL<br><small>Per person · indicative prices</small></span><strong>₹' +
      actual.toLocaleString("en-IN") +
      '</strong></div></header><div class="itinerary-cost-summary"><span>Stay <b>₹' +
      totals.stay.toLocaleString("en-IN") +
      "</b></span><span>Meals <b>₹" +
      totals.meals.toLocaleString("en-IN") +
      "</b></span><span>Transport <b>₹" +
      totals.transport.toLocaleString("en-IN") +
      "</b></span><span>Activities <b>₹" +
      totals.activities.toLocaleString("en-IN") +
      "</b></span><span>Permits <b>₹" +
      totals.permits.toLocaleString("en-IN") +
      "</b></span><span>Budget left <b>₹" +
      (budget - actual).toLocaleString("en-IN") +
      '</b></span></div><p class="trip-condition ' +
      (monsoon ? "trip-condition-warning" : "") +
      '">ⓘ ' +
      warning +
      '</p><div class="day-list">' +
      days +
      '</div><div class="itinerary-actions">' +
      (options.saved
        ? ""
        : '<button class="button button-secondary" id="save-itinerary">Save itinerary</button>') +
      '<button class="button button-primary" id="print-itinerary">↓ &nbsp; Download / print itinerary</button><button class="button button-secondary itinerary-close-button">' +
      (options.saved ? "Close itinerary" : "Edit my plan") +
      "</button></div>";
  }
  showAppModal("itinerary-overlay", ".itinerary-close");
  if (title) clearItinerarySequence();
  else renderItinerarySequence(plan);
}

function generateFromForm() {
  const hub = $("#hub-input").value,
    duration = Number($("#duration-input").value),
    budget = Math.max(0, Number($("#budget-input").value) || 0),
    month = $("#month-input").value,
    interests = $$(".interest-options input:checked").map((x) => x.value);
  const plan = makeItinerary(
    destinations,
    hub,
    duration,
    month,
    interests,
    window.requestedDestination || null,
  );
  window.currentItinerary = plan;
  window.currentItineraryMeta = {
    budget: budget,
    month: month,
    hub: hub,
    duration: duration,
    label: duration + "-day " + plan.route + " trip",
  };
  showItinerary(plan, {
    budget: budget,
    month: month,
    hub: hub,
    duration: duration,
  });
}

function preset(key) {
  if (!$("#planner-form")) {
    location.assign(`/planner.html?preset=${encodeURIComponent(key)}`);
    return;
  }
  const isZiro = key === "ziro",
    hub = isZiro ? "Dibrugarh" : "Guwahati",
    duration = isZiro ? 5 : 3,
    budget = isZiro ? 16500 : 8000,
    month = $("#month-input").value,
    interests = isZiro ? ["Culture", "Offbeat"] : ["Culture", "Adventure"],
    preferred = isZiro ? "Ziro Valley" : "Dawki & Umngot",
    label = isZiro
      ? "5-Day Ziro Valley Cultural Trip"
      : "Guwahati → Shillong → Dawki";
  $("#hub-input").value = hub;
  $("#duration-input").value = duration;
  $("#budget-input").value = budget;
  $$(".interest-options input").forEach(
    (x) => (x.checked = interests.includes(x.value)),
  );
  window.requestedDestination = null;
  setTab("planner");
  const plan = makeItinerary(
    destinations,
    hub,
    duration,
    month,
    interests,
    preferred,
  );
  window.currentItinerary = plan;
  window.currentItineraryMeta = {
    budget: budget,
    month: month,
    hub: hub,
    duration: duration,
    label: label,
  };
  showItinerary(plan, {
    budget: budget,
    month: month,
    hub: hub,
    duration: duration,
    presetLabel: label,
  });
}

document.addEventListener("click", function (e) {
  const planButton = e.target.closest(".modal-plan");
  if (planButton)
    window.requestedDestination = planButton.dataset.destinationPlan;
});

let destinationMap = null,
  destinationMapMarkers = [],
  itineraryRouteLayer = null,
  destinationBaseLayer = null,
  mapTileReady = false,
  mapTileFallbackShown = false,
  mapTileWatchdog = null;
const MAP_ATTRIBUTION =
  '<a href="https://openfreemap.org/" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> · Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
destinations.forEach((d) => {
  d.coordinates = destinationCoordinates[d.name] || null;
});

function destinationMapIcon(d) {
  return L.divIcon({
    className: "",
    html:
      '<div class="map-marker ' +
      (d.gem ? "gem" : "") +
      '"><span>•</span></div>',
    iconSize: [23, 23],
    iconAnchor: [11, 22],
    popupAnchor: [0, -20],
  });
}
function routeMapIcon(n) {
  return L.divIcon({
    className: "",
    html: '<div class="map-route-number">' + n + "</div>",
    iconSize: [23, 23],
    iconAnchor: [11, 11],
  });
}
function showMapTileFallback(message) {
  if (mapTileFallbackShown) return;
  mapTileFallbackShown = true;
  if (mapTileWatchdog) clearTimeout(mapTileWatchdog);
  $("#map-loading")?.setAttribute("hidden", "");
  $("#destination-map")?.setAttribute("aria-busy", "false");
  if (
    destinationBaseLayer &&
    destinationMap &&
    destinationMap.hasLayer(destinationBaseLayer)
  )
    destinationBaseLayer.remove();
  const fallback = document.createElement("div");
  fallback.id = "map-tile-fallback";
  fallback.className = "map-tile-fallback";
  fallback.setAttribute("role", "status");
  fallback.setAttribute("aria-live", "polite");
  const title = document.createElement("strong"),
    detail = document.createElement("span"),
    retry = document.createElement("button");
  title.textContent = "Map tiles are unavailable.";
  detail.textContent =
    message ||
    "Destination pins and itinerary order remain available. Check your connection and retry the map.";
  retry.className = "map-retry-button";
  retry.type = "button";
  retry.textContent = "Retry map";
  retry.addEventListener("click", () => window.location.reload());
  fallback.append(title, detail, retry);
  destinationMap.getContainer().appendChild(fallback);
}
function showMapLibraryFallback(element, message) {
  element.replaceChildren();
  element.setAttribute("aria-busy", "false");
  const fallback = document.createElement("div"),
    detail = document.createElement("p"),
    retry = document.createElement("button");
  fallback.className = "map-fallback";
  fallback.setAttribute("role", "status");
  detail.textContent = message;
  retry.className = "map-retry-button";
  retry.type = "button";
  retry.textContent = "Retry map";
  retry.addEventListener("click", () => window.location.reload());
  fallback.append(detail, retry);
  element.appendChild(fallback);
}
function initDestinationMap() {
  const el = document.getElementById("destination-map");
  if (!el) return;
  if (!window.L) {
    $("#map-loading")?.setAttribute("hidden", "");
    el.setAttribute("aria-busy", "false");
    showMapLibraryFallback(
      el,
      "The map library did not load. Destination cards are still available; check your connection and retry.",
    );
    return;
  }
  destinationMap = L.map(el, {
    scrollWheelZoom: false,
    zoomControl: true,
    keyboard: true,
  });
  if (window.maplibregl && L.maplibreGL) {
    destinationBaseLayer = L.maplibreGL({
      style: "https://tiles.openfreemap.org/styles/positron",
      attribution: MAP_ATTRIBUTION,
    }).addTo(destinationMap);
  } else {
    showMapTileFallback(
      "The map renderer did not load. Your destination pins and trip path are still interactive.",
    );
  }
  const bounds = [];
  destinations.forEach((d) => {
    if (!d.coordinates) return;
    const marker = L.marker(d.coordinates, {
      icon: destinationMapIcon(d),
      title: d.name,
      alt: d.name,
    }).addTo(destinationMap);
    marker.bindTooltip(
      "<strong>" +
        escapeHtml(d.name) +
        "</strong><br><span>" +
        escapeHtml(d.state) +
        " · est. ₹" +
        d.budget.toLocaleString("en-IN") +
        "/day</span>",
    );
    marker.on("click", () => openDestination(d.name));
    destinationMapMarkers.push(marker);
    bounds.push(d.coordinates);
  });
  if (bounds.length)
    destinationMap.fitBounds(bounds, { padding: [28, 28], maxZoom: 6 });
  if (destinationBaseLayer) {
    const glMap = destinationBaseLayer._glMap,
      markReady = () => {
        if (mapTileFallbackShown) return;
        mapTileReady = true;
        $("#map-loading")?.setAttribute("hidden", "");
        el.setAttribute("aria-busy", "false");
        if (mapTileWatchdog) clearTimeout(mapTileWatchdog);
      };
    if (glMap) {
      if (glMap.loaded()) markReady();
      else {
        glMap.once("load", markReady);
        glMap.once("idle", markReady);
      }
      glMap.on("error", (event) => {
        if (event.error && event.error.status >= 400)
          showMapTileFallback(
            "The map provider returned an error. Your destination pins and trip path are still interactive.",
          );
      });
    }
    mapTileWatchdog = setTimeout(() => {
      if (!mapTileReady)
        showMapTileFallback(
          "The map provider did not finish loading. Your destination pins and trip path are still interactive.",
        );
    }, 25000);
  }
  itineraryRouteLayer = L.layerGroup().addTo(destinationMap);
  requestAnimationFrame(() => destinationMap.invalidateSize());
  window.addEventListener(
    "resize",
    () => destinationMap && destinationMap.invalidateSize(),
  );
}
function loadMapStylesheet(href, integrity) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`link[data-map-asset="${href}"]`);
    if (existing) {
      existing.sheet
        ? resolve()
        : existing.addEventListener("load", resolve, { once: true });
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.integrity = integrity;
    link.crossOrigin = "anonymous";
    link.dataset.mapAsset = href;
    link.onload = resolve;
    link.onerror = () =>
      reject(new Error("Map styles could not be downloaded."));
    document.head.appendChild(link);
  });
}
function loadMapScript(src, integrity) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.integrity = integrity;
    script.crossOrigin = "anonymous";
    script.async = true;
    script.onload = resolve;
    script.onerror = () =>
      reject(new Error("Map library could not be downloaded."));
    document.head.appendChild(script);
  });
}
function loadMapLibraries() {
  if (!mapLibraryPromise)
    mapLibraryPromise = (async () => {
      await Promise.all([
        loadMapStylesheet(
          "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
          "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=",
        ),
        loadMapStylesheet(
          "https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css",
          "sha384-uTttxo/aOKbdE5RlD/SPzSDoDmNvGlUYPjONi2MN/b7c9HPSvW07OIuyP7uL6jxK",
        ),
      ]);
      await loadMapScript(
        "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
        "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=",
      );
      await loadMapScript(
        "https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js",
        "sha384-5+cfbwT0iiub6VsQAdn6yz16nr6sDiQoHx6tm4O8OVYXHYOxcffFmCJBL0dgdvGp",
      );
      await loadMapScript(
        "https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.1.3/leaflet-maplibre-gl.js",
        "sha384-LIxE/QjpJKC2A91yD40ZisdYtFbgAjl58jqpo9/MUZNgwhqsTfzwrTlqv6nDdzzB",
      );
    })();
  return mapLibraryPromise;
}
function initializeMapWhenVisible() {
  const el = $("#destination-map");
  if (!el) return;
  const start = async () => {
    mapInitObserver?.disconnect();
    el.setAttribute("aria-busy", "true");
    const loading = $("#map-loading");
    if (loading) {
      loading.hidden = false;
      loading.textContent = "Loading map tiles and destination pins…";
    }
    try {
      await loadMapLibraries();
      if (destinationMap) return;
      initDestinationMap();
      if (window.currentItinerary)
        renderItinerarySequence(window.currentItinerary);
    } catch (error) {
      console.warn(
        "Map libraries could not be loaded; the destination explorer remains available.",
        error,
      );
      if (loading) loading.hidden = true;
      showMapLibraryFallback(
        el,
        "The map display is unavailable. Destination cards and the travel guide still work; check your connection and retry.",
      );
    }
  };
  if ("IntersectionObserver" in window) {
    mapInitObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) start();
      },
      { rootMargin: "180px 0px" },
    );
    mapInitObserver.observe(el);
  } else start();
}
function clearItinerarySequence() {
  if (itineraryRouteLayer) itineraryRouteLayer.clearLayers();
  const list = document.getElementById("map-itinerary-sequence");
  if (list) list.innerHTML = "";
  const title = document.getElementById("map-route-title");
  if (title) title.textContent = "Your trip will appear here.";
  const note = document.getElementById("map-route-note");
  if (note)
    note.textContent =
      "Build a plan to see its destination sequence. Dotted connectors show order only, not driving routes.";
}
function renderItinerarySequence(plan) {
  if (!destinationMap || !itineraryRouteLayer || !plan || !plan.days) return;
  itineraryRouteLayer.clearLayers();
  const coords = [],
    seen = new Map();
  const list = document.getElementById("map-itinerary-sequence");
  list.innerHTML = plan.days
    .map(
      (day) =>
        "<li><b>" +
        String(day.day).padStart(2, "0") +
        "</b><span>" +
        escapeHtml(day.destination.name) +
        "</span></li>",
    )
    .join("");
  document.getElementById("map-route-title").textContent =
    "Day-by-day destination sequence";
  document.getElementById("map-route-note").textContent =
    "The dotted connector indicates destination order only; it is not a road or travel-time route.";
  plan.days.forEach((day) => {
    const d = day.destination;
    if (!d.coordinates) return;
    if (!seen.has(d.name)) {
      const n = seen.size + 1;
      seen.set(d.name, n);
      coords.push(d.coordinates);
      L.marker(d.coordinates, {
        icon: routeMapIcon(n),
        interactive: false,
        keyboard: false,
        zIndexOffset: 800,
      }).addTo(itineraryRouteLayer);
    }
  });
  if (coords.length > 1)
    L.polyline(coords, {
      color: "#c86f51",
      weight: 3,
      dashArray: "5 8",
      opacity: 0.78,
      interactive: false,
    }).addTo(itineraryRouteLayer);
  if (coords.length)
    destinationMap.fitBounds(coords, { padding: [52, 52], maxZoom: 8 });
}

async function bootApp() {
  initializeAppearance();
  initializeBackToTop();
  initializeImageRetries();
  syncMobileNavMode();
  window.addEventListener("resize", syncMobileNavMode, { passive: true });
  window.addEventListener("offline", () =>
    notify(
      "You appear to be offline. Bundled destination details remain available; map tiles and account sync need a connection.",
      "warning",
    ),
  );
  window.addEventListener("online", () =>
    notify(
      "Connection restored. Retry any destination or map request that did not finish.",
      "success",
    ),
  );
  destinations = fallbackDestinations.map((d) => ({
    ...d,
    coordinates: destinationCoordinates[d.name] || null,
  }));
  if ($("#planner-form")) {
    ({ makeItinerary } = await import("./modules/planner.js"));
  }
  initializeSupabase();
  initializeMapWhenVisible();
  populateStateFilter();
  renderDestinations();
  renderPhotoCredits();
  if ($("#hero-slideshow")) {
    const { heroQuotes, initializeHeroSlideshow } =
      await import("./modules/slideshow.js");
    const heroSlides = fallbackDestinations
      .filter((destination) => destinationPhotography[destination.name])
      .map((destination) => ({
        name: destination.name,
        state: destination.state,
        quote: heroQuotes[destination.name],
        photo: destinationPhotography[destination.name],
      }));
    initializeHeroSlideshow(heroSlides, openDestination);
  }

  const guideSelect = $("#guide-destination");
  if (guideSelect) {
    destinations.forEach((d) =>
      guideSelect.add(new Option(`${d.name} · ${d.state}`, d.name)),
    );
    guideSelect.value = destinations.some((d) => d.name === "Tawang")
      ? "Tawang"
      : destinations[0]?.name || "";
    renderGuide(guideSelect.value);
  }

  bindIfPresent("#search-input", "input", (e) => {
    filterValues.search = e.target.value.trim().toLowerCase();
    renderDestinations();
  });
  bindIfPresent("#state-filter", "change", (e) => {
    filterValues.state = e.target.value;
    renderDestinations();
  });
  bindIfPresent("#vibe-filter", "change", (e) => {
    filterValues.vibe = e.target.value;
    renderDestinations();
  });
  bindIfPresent("#season-filter", "change", (e) => {
    filterValues.season = e.target.value;
    renderDestinations();
  });
  bindIfPresent("#clear-filters", "click", () => {
    filterValues.search = "";
    filterValues.state = filterValues.vibe = filterValues.season = "all";
    const search = $("#search-input");
    if (search) search.value = "";
    ["#state-filter", "#vibe-filter", "#season-filter"].forEach((selector) => {
      const element = $(selector);
      if (element) element.value = "all";
    });
    renderDestinations();
  });
  bindIfPresent("#empty-clear", "click", () => $("#clear-filters")?.click());
  bindIfPresent("#auth-trigger", "click", async () => {
    const button = $("#auth-trigger");
    if (!authUser) {
      openAuth("login");
      return;
    }
    if (!supabaseReady || !supabaseClient) {
      notify(
        "Could not sign out because the account service is unavailable. Try again when connected.",
        "error",
      );
      return;
    }
    button.disabled = true;
    button.textContent = "Signing out…";
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      await handleAuthChange(null);
      notify("You have been signed out.", "success");
    } catch (error) {
      console.error("Sign out failed.", error);
      setAuthNav();
      notify(
        error.message ||
          "Sign out failed. Please check your connection and try again.",
        "error",
      );
    } finally {
      button.disabled = false;
      setAuthNav();
    }
  });
  bindIfPresent("#auth-form", "submit", submitAuth);
  bindIfPresent("#auth-google", "click", signInWithGoogle);
  bindIfPresent("#auth-login-mode", "click", () => setAuthMode("login"));
  bindIfPresent("#auth-signup-mode", "click", () => setAuthMode("signup"));
  bindIfPresent("#auth-modal", "click", (e) => {
    if (e.target.id === "auth-modal") closeAuth();
  });

  // EXPERIMENTAL_ACCOUNT_DELETION_START
  bindIfPresent("#delete-account-open", "click", openDeleteAccount);
  bindIfPresent("#delete-account-confirm", "input", (e) => {
    $("#delete-account-submit").disabled = e.target.value !== "DELETE";
    $("#delete-account-message").textContent = "";
    $("#delete-account-message").classList.remove("error");
  });
  bindIfPresent("#delete-account-submit", "click", deleteMyAccount);
  bindIfPresent("#delete-account-cancel", "click", closeDeleteAccount);
  $$(".delete-account-close").forEach((button) =>
    button.addEventListener("click", closeDeleteAccount),
  );
  bindIfPresent("#delete-account-modal", "click", (e) => {
    if (e.target.id === "delete-account-modal") closeDeleteAccount();
  });
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      $("#delete-account-modal") &&
      !$("#delete-account-modal").hidden
    )
      closeDeleteAccount();
  });
  // EXPERIMENTAL_ACCOUNT_DELETION_END

  bindIfPresent("#destination-modal", "click", (e) => {
    if (e.target.id === "destination-modal") closeModal();
  });
  bindIfPresent("#itinerary-overlay", "click", (e) => {
    if (e.target.id === "itinerary-overlay") closeItinerary();
  });
  bindIfPresent("#guide-destination", "change", (e) =>
    renderGuide(e.target.value),
  );
  bindIfPresent("#guide-month-input", "change", () =>
    renderGuide(guideSelect?.value),
  );
  bindIfPresent("#month-input", "change", () =>
    renderGuide(guideSelect?.value),
  );
  bindIfPresent("#planner-form", "submit", (e) => {
    e.preventDefault();
    generateFromForm();
  });
  bindIfPresent(".mobile-menu", "click", () => {
    setMobileNavOpen(!$(".main-nav")?.classList.contains("open"), {
      focusFirst: true,
    });
  });
  document.addEventListener(
    "click",
    (event) => {
      const nav = $(".main-nav"),
        toggle = $(".mobile-menu");
      if (
        nav?.classList.contains("open") &&
        !nav.contains(event.target) &&
        !toggle?.contains(event.target)
      )
        setMobileNavOpen(false);
    },
    true,
  );
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && $(".main-nav")?.classList.contains("open")) {
      event.preventDefault();
      setMobileNavOpen(false, { restoreFocus: true });
    }
  });
  bindIfPresent(".settings-signin", "click", () => openAuth("login"));

  document.addEventListener("click", (e) => {
    if (e.target.closest(".image-retry-button")) return;
    const heart = e.target.closest(".heart-button");
    if (heart) {
      e.stopPropagation();
      const destination = destinations.find(
        (d) =>
          d.name === heart.closest(".destination-card")?.dataset.destination,
      );
      if (destination) toggleFavorite(destination, heart);
      return;
    }
    const card = e.target.closest(".destination-card");
    if (card) openDestination(card.dataset.destination);
    const tab = e.target.closest("[data-tab]");
    if (tab) {
      if (tab.tagName === "A") return;
      setTab(tab.dataset.tab);
    }
    const go = e.target.closest("[data-go-tab]");
    if (go) {
      e.preventDefault();
      setTab(go.dataset.goTab);
    }
    const pre = e.target.closest("[data-preset]");
    if (pre) {
      e.preventDefault();
      preset(pre.dataset.preset);
    }
    const planButton = e.target.closest(".modal-plan");
    if (planButton) {
      const name = planButton.dataset.destinationPlan;
      window.requestedDestination = name;
      closeModal();
      const plannerReady = $("#planner-form");
      if (plannerReady) {
        const destination = destinations.find((x) => x.name === name);
        if (destination) {
          $("#hub-input").value =
            destination.state === "Manipur"
              ? "Imphal"
              : destination.state === "Sikkim"
                ? "Bagdogra"
                : destination.state === "Arunachal Pradesh"
                  ? "Dibrugarh"
                  : "Guwahati";
          setTab("planner");
        }
      } else
        location.assign(
          `/planner.html?destination=${encodeURIComponent(name)}`,
        );
    }
    if (e.target.closest(".modal-close")) {
      closeModal();
      closeItinerary();
      closeAuth();
    }
    if (e.target.closest(".itinerary-close-button")) closeItinerary();
    if (e.target.closest("#print-itinerary")) window.print();
    if (e.target.closest("#save-itinerary")) saveCurrentItinerary();
    const open = e.target.closest("[data-trip-open]");
    if (open) openSavedTrip(open.dataset.tripOpen);
    const remove = e.target.closest("[data-trip-delete]");
    if (remove) deleteSavedTrip(remove.dataset.tripDelete);
  });
  document.addEventListener("keydown", (e) => {
    trapDialogTab(e);
    if (e.key === "Escape") {
      if ($("#auth-modal") && !$("#auth-modal").hidden) closeAuth();
      else if ($("#itinerary-overlay") && !$("#itinerary-overlay").hidden)
        closeItinerary();
      else if ($("#destination-modal") && !$("#destination-modal").hidden)
        closeModal();
    }
  });

  const query = new URLSearchParams(location.search);
  if ($("#planner-form")) {
    const presetName = query.get("preset");
    if (presetName === "shillong" || presetName === "ziro") preset(presetName);
    const requested = query.get("destination");
    if (requested) {
      window.requestedDestination = requested;
      const destination = destinations.find((item) => item.name === requested);
      if (destination) {
        $("#hub-input").value =
          destination.state === "Manipur"
            ? "Imphal"
            : destination.state === "Sikkim"
              ? "Bagdogra"
              : destination.state === "Arunachal Pradesh"
                ? "Dibrugarh"
                : "Guwahati";
      }
    }
  }
  const oauthError = consumeOAuthRedirectError();
  if (oauthError) openAuth("login", oauthError);
}
startApp(bootApp);
