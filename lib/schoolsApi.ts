let cachedSchools: any = null;
let inFlightSchoolsPromise: Promise<any> | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("schools-updated", () => {
    cachedSchools = null;
  });
}

/**
 * Fetch schools with deduplication for simultaneous calls and in-memory caching.
 * @param forceRefresh When true, bypasses the in-memory cache and fetches fresh data.
 */
export async function fetchSchoolsCached(forceRefresh = false): Promise<any> {
  if (!forceRefresh && cachedSchools) {
    return cachedSchools;
  }

  // Deduplicate concurrent requests so only one HTTP call is in flight at a time
  if (inFlightSchoolsPromise) {
    return inFlightSchoolsPromise;
  }

  inFlightSchoolsPromise = (async () => {
    try {
      const response = await fetch("/api/schools");
      if (!response.ok) {
        throw new Error(`Failed to fetch schools: ${response.status}`);
      }
      const data = await response.json();
      cachedSchools = data;
      return data;
    } finally {
      inFlightSchoolsPromise = null;
    }
  })();

  return inFlightSchoolsPromise;
}

/**
 * Manually invalidate the cached schools data.
 */
export function invalidateSchoolsCache() {
  cachedSchools = null;
}

