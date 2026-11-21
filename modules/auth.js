const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function isSafeSupabaseUrl(value) {
  try {
    const url = new URL(value);
    const local = LOCAL_HOSTS.has(url.hostname);
    return (
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      url.pathname === "/" &&
      (url.protocol === "https:" || (url.protocol === "http:" && local))
    );
  } catch {
    return false;
  }
}

export function safeAuthRedirectUrl(locationLike = globalThis.location) {
  if (!locationLike) return null;
  const local = LOCAL_HOSTS.has(locationLike.hostname);
  if (
    locationLike.protocol !== "https:" &&
    !(locationLike.protocol === "http:" && local)
  ) {
    return null;
  }
  const pathname = String(locationLike.pathname || "/");
  if (
    !pathname.startsWith("/") ||
    pathname.startsWith("//") ||
    pathname.includes("\\")
  ) {
    return null;
  }
  const origin = new URL(locationLike.origin).origin;
  const redirect = new URL(pathname, origin);
  return redirect.origin === origin ? redirect.href : null;
}

export function isAdministrativeKey(key) {
  if (typeof key !== "string") return false;
  if (/^sb_secret_/i.test(key)) return true;
  try {
    const token = key.split(".")[1];
    if (!token) return false;
    const payload = JSON.parse(
      atob(token.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return payload.role === "service_role";
  } catch {
    return false;
  }
}

export function hasBrowserSupabaseConfig(config) {
  return Boolean(
    config?.url &&
    config?.publishableKey &&
    !config.url.includes("YOUR_PROJECT") &&
    !config.publishableKey.includes("YOUR_"),
  );
}

export async function initializeAuthSession(client, onUserChange) {
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  await onUserChange(data.session?.user || null);
  return client.auth.onAuthStateChange((_event, session) => {
    queueMicrotask(() => onUserChange(session?.user || null));
  });
}

export function signInWithEmail(client, credentials) {
  return client.auth.signInWithPassword(credentials);
}

export function signUpWithEmail(
  client,
  { email, password, username, redirectTo },
) {
  const options = { data: { username } };
  if (redirectTo) options.emailRedirectTo = redirectTo;
  return client.auth.signUp({ email, password, options });
}

export function signInWithGoogle(client, redirectTo) {
  const options = redirectTo ? { redirectTo } : {};
  return client.auth.signInWithOAuth({ provider: "google", options });
}
