import { NextRequest, NextResponse } from "next/server";

// Mark route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

// Multiple sources for company logos
// 1. LogoKit API (public, free, no key required) - PRIMARY SOURCE
// 2. Financial Modeling Prep (requires API key)
// 3. Finnhub (requires API key)
// 4. Clearbit Logo API (free, uses company domain)
// 5. Fallback to generic icons

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const FMP_API_KEY = process.env.FINANCIAL_MODELING_PREP_API_KEY;

// In-memory cache for logo URLs (cache for the duration of the server instance)
const logoCache = new Map<string, { url: string | null; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// LogoKit API - Public API for stock ticker logos
async function getLogoKitLogo(symbol: string): Promise<string | null> {
  const cacheKey = `logokit-${symbol.toUpperCase()}`;
  const cached = logoCache.get(cacheKey);
  
  // Check cache first
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.url;
  }

  // LogoKit is a public API - return the URL directly
  // The client will handle image load errors gracefully
  const logoUrl = `https://img.logokit.com/ticker/${symbol.toUpperCase()}`;
  
  // Cache the URL (we'll let the client verify if it loads)
  logoCache.set(cacheKey, { url: logoUrl, timestamp: Date.now() });
  return logoUrl;
}

// Get company domain from symbol (basic mapping for common stocks)
function getCompanyDomain(symbol: string): string | null {
  const domainMap: Record<string, string> = {
    AAPL: "apple.com",
    MSFT: "microsoft.com",
    GOOGL: "google.com",
    GOOG: "google.com",
    AMZN: "amazon.com",
    META: "meta.com",
    TSLA: "tesla.com",
    NVDA: "nvidia.com",
    JPM: "jpmorgan.com",
    V: "visa.com",
    JNJ: "jnj.com",
    WMT: "walmart.com",
    PG: "pg.com",
    MA: "mastercard.com",
    UNH: "unitedhealthgroup.com",
    HD: "homedepot.com",
    DIS: "disney.com",
    BAC: "bankofamerica.com",
    ADBE: "adobe.com",
    CRM: "salesforce.com",
    NKE: "nike.com",
    XOM: "exxonmobil.com",
    CVX: "chevron.com",
  };

  return domainMap[symbol.toUpperCase()] || null;
}

// Clearbit Logo API (free, no key required)
async function getClearbitLogo(symbol: string): Promise<string | null> {
  const domain = getCompanyDomain(symbol);
  if (!domain) return null;

  try {
    const response = await fetch(`https://logo.clearbit.com/${domain}`, {
      method: "HEAD",
    });

    if (response.ok) {
      return `https://logo.clearbit.com/${domain}`;
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Clearbit logo error:", error);
    }
  }

  return null;
}

// Financial Modeling Prep API
async function getFMPLogo(symbol: string): Promise<string | null> {
  if (!FMP_API_KEY) return null;

  try {
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/profile/${symbol.toUpperCase()}?apikey=${FMP_API_KEY}`,
      {
        next: { revalidate: 86400 }, // Cache for 24 hours
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data && data[0] && data[0].image) {
      return data[0].image;
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("FMP logo error:", error);
    }
  }

  return null;
}

// Finnhub API
async function getFinnhubLogo(symbol: string): Promise<string | null> {
  if (!FINNHUB_API_KEY) return null;

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol.toUpperCase()}&token=${FINNHUB_API_KEY}`,
      {
        next: { revalidate: 86400 }, // Cache for 24 hours
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data && data.logo) {
      return data.logo;
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Finnhub logo error:", error);
    }
  }

  return null;
}

// Fallback: Use a generic stock icon service
function getFallbackLogo(symbol: string): string {
  // You can use a service like https://stocklogos.com or similar
  // For now, return null and let the UI handle it
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${symbol.toUpperCase()}`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");
  const type = searchParams.get("type") || "stock";

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol parameter is required" },
      { status: 400 }
    );
  }

  try {
    let logo: string | null = null;

    // Try different sources in order of preference
    if (type === "stock") {
      // Try LogoKit first (public API, no key required)
      logo = await getLogoKitLogo(symbol);

      // Try Financial Modeling Prep if LogoKit fails
      if (!logo) {
        logo = await getFMPLogo(symbol);
      }

      // Try Finnhub if FMP fails
      if (!logo) {
        logo = await getFinnhubLogo(symbol);
      }

      // Try Clearbit as fallback
      if (!logo) {
        logo = await getClearbitLogo(symbol);
      }
    } else if (type === "crypto") {
      // For crypto, use CoinGecko or similar
      // For now, use a fallback
      logo = `https://cryptoicons.org/api/icon/${symbol.toLowerCase()}/200`;
    }

    // Final fallback
    if (!logo) {
      logo = getFallbackLogo(symbol);
    }

    return NextResponse.json({ symbol: symbol.toUpperCase(), logo });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching logo:", error);
    }
    return NextResponse.json(
      { error: error.message || "Failed to fetch logo" },
      { status: 500 }
    );
  }
}

