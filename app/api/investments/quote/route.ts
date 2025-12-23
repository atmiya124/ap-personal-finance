import { NextRequest, NextResponse } from "next/server";

// Mark route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

// Alpha Vantage API for stock prices (free tier: 5 calls/minute, 500 calls/day)
// You can get a free API key from https://www.alphavantage.co/support/#api-key
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

// Alternative: Yahoo Finance API (no key required, but less reliable)
async function getYahooFinanceQuote(symbol: string) {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?interval=1d&range=1d`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch from Yahoo Finance");
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];

    if (!result || !result.meta) {
      throw new Error("Invalid response from Yahoo Finance");
    }

    const price = result.meta.regularMarketPrice || result.meta.previousClose;
    const change = result.meta.regularMarketChange || 0;
    const changePercent = result.meta.regularMarketChangePercent || 0;
    const companyName = result.meta.longName || result.meta.shortName || symbol.toUpperCase();

    return {
      symbol: symbol.toUpperCase(),
      name: companyName,
      price,
      change,
      changePercent: changePercent * 100,
      currency: result.meta.currency || "USD",
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Yahoo Finance API error:", error);
    }
    throw error;
  }
}

// Alpha Vantage API for stock prices
async function getAlphaVantageQuote(symbol: string) {
  if (!ALPHA_VANTAGE_API_KEY) {
    throw new Error("Alpha Vantage API key not configured");
  }

  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol.toUpperCase()}&apikey=${ALPHA_VANTAGE_API_KEY}`,
      {
        next: { revalidate: 60 }, // Cache for 60 seconds
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch from Alpha Vantage");
    }

    const data = await response.json();

    if (data["Error Message"] || data["Note"]) {
      throw new Error(data["Error Message"] || "API rate limit exceeded");
    }

    const quote = data["Global Quote"];
    if (!quote || !quote["05. price"]) {
      throw new Error("Invalid response from Alpha Vantage");
    }

    // Try to get company name from Alpha Vantage overview endpoint
    let companyName = quote["01. symbol"];
    try {
      const overviewResponse = await fetch(
        `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol.toUpperCase()}&apikey=${ALPHA_VANTAGE_API_KEY}`,
        {
          next: { revalidate: 3600 }, // Cache for 1 hour
        }
      );
      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        if (overviewData.Name) {
          companyName = overviewData.Name;
        }
      }
    } catch (error) {
      // If overview fails, just use symbol
      // Silently continue without company name
    }

    return {
      symbol: quote["01. symbol"],
      name: companyName,
      price: parseFloat(quote["05. price"]),
      change: parseFloat(quote["09. change"]),
      changePercent: parseFloat(quote["10. change percent"].replace("%", "")),
      currency: "USD",
    };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Alpha Vantage API error:", error);
      }
      throw error;
    }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");
  const type = searchParams.get("type") || "stock"; // stock, crypto, etc.

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol parameter is required" },
      { status: 400 }
    );
  }

  try {
    let quote;

    // Try Alpha Vantage first if API key is configured
    if (ALPHA_VANTAGE_API_KEY && type === "stock") {
      try {
        quote = await getAlphaVantageQuote(symbol);
      } catch (error) {
        // Fallback to Yahoo Finance if Alpha Vantage fails
        quote = await getYahooFinanceQuote(symbol);
      }
    } else {
      // Use Yahoo Finance as default
      quote = await getYahooFinanceQuote(symbol);
    }

    return NextResponse.json(quote);
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching quote:", error);
    }
    return NextResponse.json(
      { error: error.message || "Failed to fetch stock price" },
      { status: 500 }
    );
  }
}


