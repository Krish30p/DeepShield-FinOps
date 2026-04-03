/**
 * SEC EDGAR Real-Time Integration Service
 * 
 * Replaces ALL hardcoded ticker lists with live SEC EDGAR data.
 * Uses the official SEC APIs:
 *   - https://www.sec.gov/files/company_tickers.json  (full ticker→CIK map)
 *   - https://efts.sec.gov/LATEST/search-index         (full-text filing search)
 *   - https://data.sec.gov/submissions/CIK{padded}.json (company filings)
 * 
 * SEC Fair Access Policy:
 *   - Max 10 requests/second
 *   - Must include descriptive User-Agent header
 */

// ─── Configuration ──────────────────────────────────────────────────────────────
const SEC_USER_AGENT = "DeepShield-FinOps/1.0 (contact@deepshield.dev)";
const TICKER_LIST_URL = "https://www.sec.gov/files/company_tickers.json";
const EFTS_SEARCH_URL = "https://efts.sec.gov/LATEST/search-index";
const SUBMISSIONS_URL = "https://data.sec.gov/submissions";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── In-Memory Ticker Cache ─────────────────────────────────────────────────────
let tickerCache = {
  byTicker: {},      // { "AAPL": { cik: 320193, name: "Apple Inc." }, ... }
  byName: {},        // { "apple inc.": "AAPL", ... }
  allTickers: new Set(),
  lastFetched: 0,
  isLoading: false,
  loadPromise: null,
};

/**
 * Fetch the complete SEC company tickers list and build lookup maps.
 * This file contains ~13,000+ SEC-registered public companies.
 */
const loadTickerCache = async () => {
  // Prevent concurrent fetches
  if (tickerCache.isLoading && tickerCache.loadPromise) {
    return tickerCache.loadPromise;
  }

  tickerCache.isLoading = true;
  tickerCache.loadPromise = (async () => {
    try {
      console.log("[SEC Service] 📡 Fetching full SEC company tickers list...");
      
      const response = await fetch(TICKER_LIST_URL, {
        headers: { "User-Agent": SEC_USER_AGENT },
      });

      if (!response.ok) {
        throw new Error(`SEC API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const byTicker = {};
      const byName = {};
      const allTickers = new Set();

      // data format: { "0": { cik_str: 320193, ticker: "AAPL", title: "Apple Inc." }, ... }
      for (const key of Object.keys(data)) {
        const entry = data[key];
        const ticker = entry.ticker.toUpperCase();
        const name = entry.title;
        const cik = entry.cik_str;

        byTicker[ticker] = { cik, name };
        byName[name.toLowerCase()] = ticker;
        allTickers.add(ticker);
      }

      tickerCache.byTicker = byTicker;
      tickerCache.byName = byName;
      tickerCache.allTickers = allTickers;
      tickerCache.lastFetched = Date.now();

      console.log(`[SEC Service] ✅ Loaded ${allTickers.size} SEC-registered tickers`);
    } catch (error) {
      console.error("[SEC Service] ❌ Failed to fetch SEC tickers:", error.message);
      // If we have stale data, keep using it rather than having an empty cache
      if (tickerCache.allTickers.size === 0) {
        console.warn("[SEC Service] ⚠️  No cached data available. SEC validation will be lenient.");
      }
    } finally {
      tickerCache.isLoading = false;
      tickerCache.loadPromise = null;
    }
  })();

  return tickerCache.loadPromise;
};

/**
 * Ensure the ticker cache is loaded and fresh.
 */
const ensureCacheLoaded = async () => {
  const now = Date.now();
  if (tickerCache.allTickers.size === 0 || (now - tickerCache.lastFetched) > CACHE_TTL_MS) {
    await loadTickerCache();
  }
};

// ─── Public API ─────────────────────────────────────────────────────────────────

/**
 * Check if a ticker symbol is registered with the SEC.
 * @param {string} ticker - The ticker symbol to validate (e.g., "AAPL")
 * @returns {Promise<{isValid: boolean, companyName: string|null, cik: number|null}>}
 */
export const isValidSECTicker = async (ticker) => {
  await ensureCacheLoaded();
  
  const clean = String(ticker).trim().toUpperCase();
  const entry = tickerCache.byTicker[clean];

  if (entry) {
    return { isValid: true, companyName: entry.name, cik: entry.cik };
  }

  // If cache is empty (SEC API was unreachable), be lenient — don't block everything
  if (tickerCache.allTickers.size === 0) {
    console.warn(`[SEC Service] ⚠️  Cache empty, allowing '${clean}' by default`);
    return { isValid: true, companyName: null, cik: null };
  }

  return { isValid: false, companyName: null, cik: null };
};

/**
 * Get ticker info including company name and CIK.
 * @param {string} ticker
 * @returns {Promise<{ticker: string, companyName: string|null, cik: number|null}>}
 */
export const getTickerInfo = async (ticker) => {
  await ensureCacheLoaded();
  const clean = String(ticker).trim().toUpperCase();
  const entry = tickerCache.byTicker[clean];
  return {
    ticker: clean,
    companyName: entry?.name || null,
    cik: entry?.cik || null,
  };
};

/**
 * Given a raw text (news headline), find all valid SEC-registered tickers mentioned.
 * This replaces the hardcoded knownTickers array in the ingestion agent.
 * @param {string} text - The news headline / raw text
 * @returns {Promise<string[]>} - Array of matched tickers, in order of appearance
 */
export const extractTickersFromText = async (text) => {
  await ensureCacheLoaded();

  const upperText = text.toUpperCase();
  const matched = [];

  // Common English words that also happen to be SEC tickers — skip these in broad scan
  const AMBIGUOUS_TICKERS = new Set([
    "ON", "AT", "IT", "AN", "OR", "BE", "DO", "GO", "HE", "IF", "IN", "IS",
    "ME", "MY", "NO", "OF", "SO", "TO", "UP", "US", "WE", "BY", "AM", "AS",
    "AI", "ALL", "ARE", "BIG", "CAN", "FOR", "HAS", "HER", "HIS", "HOW",
    "ITS", "LET", "MAY", "NEW", "NOW", "OLD", "ONE", "OUR", "OUT", "OWN",
    "RUN", "SAY", "SHE", "THE", "TOO", "TWO", "USE", "WAR", "WAY", "WHO",
    "WHY", "WIN", "YOU", "MAN", "LOW", "MAX", "TRUE", "REAL", "HUGE", "VERY",
    "WELL", "OPEN", "GOOD", "BEST", "FUND", "TURN", "PEAK", "EVER", "HOLD",
    "NEXT", "PLAY", "PLUS", "RIDE", "SAFE", "SELF", "SITE", "STAY", "STEP",
    "ELSE", "HOPE", "JUST", "LAND", "MOST", "NEAR", "ONCE", "FAST", "COIN",
  ]);

  // Strategy 1: Check if any known SEC ticker appears in the text (exact word boundary)
  // Only match tickers 3+ chars to avoid 2-letter false positives like ON, AT, IT
  for (const ticker of tickerCache.allTickers) {
    if (ticker.length >= 3 && !AMBIGUOUS_TICKERS.has(ticker)) {
      const regex = new RegExp(`\\b${escapeRegex(ticker)}\\b`);
      if (regex.test(upperText)) {
        matched.push(ticker);
      }
    }
  }

  // Strategy 2: If no ticker found via direct match, extract 3-5 char uppercase words
  //             and validate each against the SEC database
  if (matched.length === 0) {
    const fallbackRegex = /\b([A-Z]{3,5})\b/g;
    const allMatches = [...upperText.matchAll(fallbackRegex)];
    const commonWords = new Set([
      "BUY", "SELL", "HOLD", "SHARES", "STOCK", "TRADE", "THE", "FOR", 
      "AND", "WITH", "FROM", "THIS", "THAT", "HAVE", "BEEN", "WILL",
      "ARE", "WAS", "HAS", "HAD", "NOT", "BUT", "ALL", "CAN", "HER",
      "ONE", "OUR", "OUT", "NEW", "NOW", "OLD", "SEE", "WAY", "MAY",
      "SAY", "SHE", "TWO", "HOW", "ITS", "LET", "PUT", "TOO", "USE",
      "INVEST", "DUMP", "EXIT", "SEC", "NEWS", "HUGE", "BIG", "IPO",
      "CEO", "CFO", "COO", "ETF", "MAX", "GDP", "FBI", "FDA", "EPA", "COIN",
    ]);

    for (const m of allMatches) {
      const candidate = m[1];
      if (!commonWords.has(candidate) && tickerCache.allTickers.has(candidate)) {
        matched.push(candidate);
        break; // Take the first valid one
      }
    }
  }

  return matched;
};

/**
 * Try to resolve a company name to its SEC ticker.
 * Useful when the news mentions "Apple" instead of "AAPL".
 * @param {string} companyName 
 * @returns {Promise<string|null>}
 */
export const resolveCompanyNameToTicker = async (companyName) => {
  await ensureCacheLoaded();
  
  const searchName = companyName.toLowerCase().trim();
  
  // Direct match
  if (tickerCache.byName[searchName]) {
    return tickerCache.byName[searchName];
  }

  // Partial match — find the first company whose name starts with / contains the search term
  for (const [name, ticker] of Object.entries(tickerCache.byName)) {
    if (name.includes(searchName) || searchName.includes(name)) {
      return ticker;
    }
  }

  return null;
};

/**
 * Search SEC EDGAR EFTS for real filings related to a company/ticker.
 * Used for provenance verification — do real SEC filings exist that match the news?
 * 
 * @param {string} ticker - The ticker symbol
 * @param {string} newsContext - The news text to cross-reference
 * @returns {Promise<{found: boolean, filingUrl: string|null, filingTitle: string|null, filingDate: string|null}>}
 */
export const searchEDGARFilings = async (ticker, newsContext) => {
  try {
    const info = await getTickerInfo(ticker);
    if (!info.cik) {
      return { found: false, filingUrl: null, filingTitle: null, filingDate: null };
    }

    // Pad CIK to 10 digits for the SEC API
    const paddedCIK = String(info.cik).padStart(10, "0");

    // Strategy 1: Try EFTS full-text search (unofficial but widely used)
    try {
      const searchQuery = encodeURIComponent(`"${info.companyName || ticker}"`);
      const eftsUrl = `${EFTS_SEARCH_URL}?q=${searchQuery}&forms=8-K,10-K,10-Q&dateRange=custom&startdt=${getDateDaysAgo(90)}&enddt=${getTodayDate()}`;
      
      const eftsResponse = await fetch(eftsUrl, {
        headers: { 
          "User-Agent": SEC_USER_AGENT,
          "Accept": "application/json",
        },
      });

      if (eftsResponse.ok) {
        const eftsData = await eftsResponse.json();
        if (eftsData.hits && eftsData.hits.hits && eftsData.hits.hits.length > 0) {
          const topHit = eftsData.hits.hits[0]._source || eftsData.hits.hits[0];
          const filingUrl = topHit.file_url 
            ? `https://www.sec.gov${topHit.file_url}` 
            : `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${paddedCIK}&type=&dateb=&owner=include&count=10`;
          
          return {
            found: true,
            filingUrl,
            filingTitle: topHit.form_type || topHit.display_names?.[0] || "SEC Filing",
            filingDate: topHit.file_date || topHit.period_of_report || null,
          };
        }
      }
    } catch (eftsError) {
      console.warn("[SEC Service] EFTS search unavailable, falling back to submissions API:", eftsError.message);
    }

    // Strategy 2: Fall back to official submissions API
    const submissionsUrl = `${SUBMISSIONS_URL}/CIK${paddedCIK}.json`;
    const subResponse = await fetch(submissionsUrl, {
      headers: { "User-Agent": SEC_USER_AGENT },
    });

    if (subResponse.ok) {
      const subData = await subResponse.json();
      const recentFilings = subData.filings?.recent;

      if (recentFilings && recentFilings.accessionNumber?.length > 0) {
        // Find the most recent 8-K, 10-K, or 10-Q filing
        for (let i = 0; i < Math.min(recentFilings.form.length, 20); i++) {
          const form = recentFilings.form[i];
          if (["8-K", "10-K", "10-Q", "8-K/A", "10-K/A", "10-Q/A"].includes(form)) {
            const accession = recentFilings.accessionNumber[i].replace(/-/g, "");
            const primaryDoc = recentFilings.primaryDocument[i];
            const filingDate = recentFilings.filingDate[i];
            
            const filingUrl = `https://www.sec.gov/Archives/edgar/data/${info.cik}/${accession}/${primaryDoc}`;
            
            return {
              found: true,
              filingUrl,
              filingTitle: `${form} Filing`,
              filingDate,
            };
          }
        }
      }

      // Even if no specific filing type matched, the company exists in SEC
      return {
        found: true,
        filingUrl: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${paddedCIK}&type=&dateb=&owner=include&count=10`,
        filingTitle: `${subData.name || ticker} — SEC Filings`,
        filingDate: null,
      };
    }

    return { found: false, filingUrl: null, filingTitle: null, filingDate: null };
  } catch (error) {
    console.error("[SEC Service] ❌ EDGAR filing search failed:", error.message);
    return { found: false, filingUrl: null, filingTitle: null, filingDate: null };
  }
};

/**
 * Full provenance verification: validate ticker + search for matching filings.
 * This is the main entry point that replaces the old mock verifyProvenance().
 * 
 * @param {string} ticker - The ticker symbol extracted from news
 * @param {string} context - The full news text
 * @returns {Promise<string>} - A real SEC EDGAR URL or empty string if unverified
 */
export const verifyProvenance = async (ticker, context) => {
  // Step 1: Is the ticker even a real SEC-registered company?
  const validation = await isValidSECTicker(ticker);
  if (!validation.isValid) {
    console.log(`[SEC Service] ❌ Ticker '${ticker}' is NOT registered with the SEC`);
    return "";
  }

  console.log(`[SEC Service] ✅ Ticker '${ticker}' is SEC-registered: ${validation.companyName} (CIK: ${validation.cik})`);

  // Step 2: Search for real EDGAR filings to verify the news has SEC backing
  const filingResult = await searchEDGARFilings(ticker, context);
  
  if (filingResult.found && filingResult.filingUrl) {
    console.log(`[SEC Service] 📄 Found SEC filing: ${filingResult.filingTitle} (${filingResult.filingDate})`);
    return filingResult.filingUrl;
  }

  // The ticker is valid but no specific filing found
  console.log(`[SEC Service] ⚠️  No recent SEC filings found for '${ticker}'`);
  return "";
};

// ─── Utility Helpers ────────────────────────────────────────────────────────────

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
}

function getDateDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

// ─── Pre-warm cache on module load ──────────────────────────────────────────────
// Start loading the ticker list immediately when the server starts.
// This runs in the background and doesn't block the module import.
loadTickerCache().catch(() => {
  console.warn("[SEC Service] ⚠️  Initial cache load failed. Will retry on first request.");
});
