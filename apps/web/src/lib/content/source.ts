import 'server-only';

/**
 * Where public content comes from.
 *
 * The database is authoritative. The TypeScript modules under `@/content` stay
 * in the repository as the baseline the database was seeded from, and are used
 * only when the API cannot be reached.
 *
 * That fallback is deliberate, and it is the reason this file exists rather
 * than a bare `fetch` in each page:
 *
 *  - **A brochure must not go down because an API did.** The marketing site is
 *    the thing that earns the enquiries. Serving slightly stale copy while the
 *    API restarts is the correct failure; a 500 is not.
 *  - **A build must not require a running API.** CI builds the web and API
 *    images independently and the web image builds first, so at build time
 *    there is nothing to call. Without a fallback every static page would fail
 *    to generate.
 *
 * The cost is that content can be silently old, so every fallback is logged at
 * error level with the path that failed. If those lines appear in production,
 * the site is serving the repository, not the database.
 */

const API_URL = process.env['API_INTERNAL_URL'] ?? 'http://localhost:4000';

/**
 * How long a cached response survives without anyone publishing anything.
 *
 * Publishing revalidates by tag and is effectively instant, so this is not the
 * refresh mechanism — it is the backstop for the two cases where a tag never
 * arrives: a revalidation that failed every retry, and a page generated from
 * the fallback because the API was down at build time. Five minutes is short
 * enough that neither becomes permanent and long enough that it is not a
 * polling loop.
 */
const BACKSTOP_SECONDS = 300;

/**
 * Returns null when the content could not be fetched, rather than a fallback
 * value. The caller owns the baseline and knows its shape; handing it back here
 * only to compare identities made every caller assert its way out of the type.
 */
export async function fetchContent<T>(path: string, tag: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}/api/public/content/${path}`, {
      headers: { accept: 'application/json' },
      next: { tags: [tag], revalidate: BACKSTOP_SECONDS },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const body: unknown = await res.json();
    if (!Array.isArray(body) && typeof body !== 'object') {
      throw new Error(`Unexpected payload for ${path}`);
    }

    return body as T;
  } catch (error) {
    // Loud on purpose. This is the line that tells an operator the site is
    // serving the repository rather than the database.
    console.error(
      `[content] /public/content/${path} unavailable — serving the built-in baseline.`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
