// Two ways a return path travels:
//  1. ?next=/some/path on /login — works when the user logs straight in.
//  2. localStorage "redirectAfterLogin" — survives the sign-up → verify email
//     → log in round trip, where the URL is lost. Other pages already set this
//     key directly with a plain path; that still works (no timestamp = accepted).

const STORAGE_KEY = "redirectAfterLogin";
const STORAGE_AT_KEY = "redirectAfterLoginAt";
// A sign-up that's never finished shouldn't redirect someone weeks later
const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Only same-site relative paths are allowed, so a crafted link like
 * /login?next=https://evil.com can't bounce users off-site after login.
 */
export const safeNextPath = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  let path = raw;

  try {
    path = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (!path.startsWith("/")) return null; // must be relative
  if (path.startsWith("//") || path.startsWith("/\\")) return null; // protocol-relative
  if (/[\u0000-\u001f]/.test(path)) return null; // control chars
  if (path.startsWith("/login")) return null; // no loops

  return path;
};

/** Link to the auth page that returns to `next` afterwards. */
export const loginHref = (next: string, opts: { signup?: boolean } = {}) => {
  const params = new URLSearchParams();

  if (opts.signup) params.set("mode", "signup");
  params.set("next", next);

  return `/login?${params.toString()}`;
};

export const rememberRedirect = (path: string) => {
  const safe = safeNextPath(path);

  if (!safe) return;
  try {
    localStorage.setItem(STORAGE_KEY, safe);
    localStorage.setItem(STORAGE_AT_KEY, String(Date.now()));
  } catch {
    // ignore (private mode etc.)
  }
};

/** Reads and clears the stored return path. Returns null if missing/stale/unsafe. */
export const consumeRedirect = (): string | null => {
  try {
    const path = localStorage.getItem(STORAGE_KEY);
    const at = Number(localStorage.getItem(STORAGE_AT_KEY));

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_AT_KEY);

    if (at && Date.now() - at > MAX_AGE_MS) return null;

    return safeNextPath(path);
  } catch {
    return null;
  }
};