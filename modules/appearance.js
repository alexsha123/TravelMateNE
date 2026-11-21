export const APPEARANCE_STORAGE_KEY = "roamne-appearance";
export const APPEARANCE_OPTIONS = ["auto", "light", "dark"];

export function normalizeAppearance(value) {
  return APPEARANCE_OPTIONS.includes(value) ? value : "auto";
}

export function initializeAppearance({
  root = document.documentElement,
  select = document.querySelector("#appearance-select"),
  storage,
  media = globalThis.matchMedia?.("(prefers-color-scheme: dark)"),
} = {}) {
  let preference = "auto";
  let persistentStorage = storage;
  try {
    persistentStorage ??= globalThis.localStorage;
    preference = normalizeAppearance(
      persistentStorage?.getItem(APPEARANCE_STORAGE_KEY),
    );
  } catch {
    preference = "auto";
  }

  function apply(next = preference) {
    preference = normalizeAppearance(next);
    root.dataset.themePreference = preference;
    const dark =
      preference === "dark" || (preference === "auto" && media?.matches);
    const resolved = dark ? "dark" : "light";
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved;
    if (select && select.value !== preference) select.value = preference;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", dark ? "#111b17" : "#163d32");
  }

  apply(preference);
  select?.addEventListener("change", () => {
    preference = normalizeAppearance(select.value);
    try {
      persistentStorage?.setItem(APPEARANCE_STORAGE_KEY, preference);
    } catch {
      // The selected theme still applies when storage is unavailable.
    }
    apply(preference);
  });

  globalThis.addEventListener?.("storage", (event) => {
    if (event.key === APPEARANCE_STORAGE_KEY) apply(event.newValue);
  });
  media?.addEventListener?.("change", () => {
    if (preference === "auto") apply("auto");
  });

  return { getPreference: () => preference, setPreference: apply };
}
