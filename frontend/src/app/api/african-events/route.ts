import { NextResponse } from "next/server";

/**
 * API Route for fetching African events from The News API
 *
 * Uses thenewsapi.com to fetch headlines from African countries
 *
 * Environment Variables Required:
 * - NEWS_API_TOKEN: Your API token from thenewsapi.com dashboard
 */

interface NewsAPIArticle {
  uuid: string;
  title: string;
  description: string;
  snippet: string;
  url: string;
  image_url: string | null;
  language: string;
  published_at: string;
  source: string;
  categories: string[];
  locale: string;
  similar?: NewsAPIArticle[];
}

interface NewsAPIResponse {
  data: NewsAPIArticle[];
}

// African country codes for The News API
const AFRICAN_COUNTRIES = [
  "ng", // Nigeria
  "za", // South Africa
  "ke", // Kenya
  "gh", // Ghana
  "eg", // Egypt
  "ma", // Morocco
  "tz", // Tanzania
  "et", // Ethiopia
  "ug", // Uganda
  "ci", // Côte d'Ivoire
  "dz", // Algeria
  "sd", // Sudan
  "ao", // Angola
  "mz", // Mozambique
  "mg", // Madagascar
  "cm", // Cameroon
  "ne", // Niger
  "bf", // Burkina Faso
  "ml", // Mali
  "mw", // Malawi
  "zm", // Zambia
  "zw", // Zimbabwe
  "sn", // Senegal
  "td", // Chad
  "so", // Somalia
  "gn", // Guinea
  "rw", // Rwanda
  "bj", // Benin
  "tn", // Tunisia
  "er", // Eritrea
  "tg", // Togo
  "sl", // Sierra Leone
  "ly", // Libya
  "lr", // Liberia
  "cg", // Republic of the Congo
  "cf", // Central African Republic
  "mr", // Mauritania
  "gm", // Gambia
  "bw", // Botswana
  "ga", // Gabon
  "ls", // Lesotho
  "gw", // Guinea-Bissau
  "eq", // Equatorial Guinea
  "mu", // Mauritius
  "dj", // Djibouti
  "re", // Réunion
  "km", // Comoros
  "cv", // Cape Verde
  "sc", // Seychelles
  "st", // São Tomé and Príncipe
].join(",");

// Map News API categories to our categories
function mapCategory(newsCategories: string[]): string {
  const categoryMap: Record<string, string> = {
    business: "Business",
    technology: "Technology",
    sports: "Sports",
    entertainment: "Entertainment",
    health: "Health",
    science: "Science",
    general: "General",
    politics: "Politics",
  };

  for (const cat of newsCategories) {
    const lower = cat.toLowerCase();
    if (categoryMap[lower]) {
      return categoryMap[lower];
    }
  }

  return newsCategories[0] || "General";
}

// Extract country name from locale (e.g., "ng" -> "Nigeria")
function getCountryName(locale: string): string {
  const countryMap: Record<string, string> = {
    ng: "Nigeria",
    za: "South Africa",
    ke: "Kenya",
    gh: "Ghana",
    eg: "Egypt",
    ma: "Morocco",
    tz: "Tanzania",
    et: "Ethiopia",
    ug: "Uganda",
    ci: "Côte d'Ivoire",
    dz: "Algeria",
    sd: "Sudan",
    ao: "Angola",
    mz: "Mozambique",
    mg: "Madagascar",
    cm: "Cameroon",
    ne: "Niger",
    bf: "Burkina Faso",
    ml: "Mali",
    mw: "Malawi",
    zm: "Zambia",
    zw: "Zimbabwe",
    sn: "Senegal",
    td: "Chad",
    so: "Somalia",
    gn: "Guinea",
    rw: "Rwanda",
    bj: "Benin",
    tn: "Tunisia",
    er: "Eritrea",
    tg: "Togo",
    sl: "Sierra Leone",
    ly: "Libya",
    lr: "Liberia",
    cg: "Republic of the Congo",
    cf: "Central African Republic",
    mr: "Mauritania",
    gm: "Gambia",
    bw: "Botswana",
    ga: "Gabon",
    ls: "Lesotho",
    gw: "Guinea-Bissau",
    eq: "Equatorial Guinea",
    mu: "Mauritius",
    dj: "Djibouti",
    re: "Réunion",
    km: "Comoros",
    cv: "Cape Verde",
    sc: "Seychelles",
    st: "São Tomé and Príncipe",
  };

  return countryMap[locale.toLowerCase()] || locale.toUpperCase();
}

export async function GET() {
  try {
    const apiToken = process.env.NEWS_API_TOKEN;

    if (!apiToken) {
      console.warn("❌ NEWS_API_TOKEN not set, returning mock data");
      return NextResponse.json(getMockData());
    }

    console.log("🟢 [News API] Fetching headlines from The News API...");
    console.log("🟢 [News API] Token:", apiToken.substring(0, 10) + "...");

    // Fetch headlines from African countries
    // Note: /headlines endpoint requires Standard plan or above
    // Using /all endpoint which is available on free plan
    // Free plan typically allows limit=3, so we'll request 3 and filter
    const url = new URL("https://api.thenewsapi.com/v1/news/all");
    url.searchParams.set("api_token", apiToken);
    // Use only top African countries for free plan (limit might be 3)
    url.searchParams.set("locale", "ng,za,ke,gh,eg"); // Top 5 African countries
    url.searchParams.set("language", "en");
    url.searchParams.set("limit", "3"); // Free plan limit is usually 3

    console.log(
      "🟢 [News API] Request URL:",
      url.toString().replace(apiToken, "***")
    );

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 300, // Cache for 5 minutes
      },
    });

    console.log(
      "🟢 [News API] Response status:",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ News API error: ${response.status} ${response.statusText}`
      );
      console.error("❌ Error response:", errorText.substring(0, 500));
      // Fallback to mock data on API error
      return NextResponse.json(getMockData());
    }

    const rawData = await response.json();
    console.log("🟢 [News API] Raw response structure:", {
      keys: Object.keys(rawData),
      hasData: !!rawData.data,
      dataType: Array.isArray(rawData.data) ? "array" : typeof rawData.data,
      dataLength: rawData.data?.length || 0,
      meta: rawData.meta,
    });

    // Handle different possible response formats
    let apiData: NewsAPIResponse;
    if (Array.isArray(rawData)) {
      // If response is directly an array
      apiData = { data: rawData };
    } else if (rawData.data && Array.isArray(rawData.data)) {
      // If response has data property (standard format)
      apiData = rawData as NewsAPIResponse;
    } else {
      console.error(
        "❌ [News API] Unexpected response format:",
        JSON.stringify(rawData).substring(0, 500)
      );
      return NextResponse.json(getMockData());
    }

    // Filter for African countries only (since /all endpoint may return global news)
    // Be lenient - if locale is not set, include it if it's from an African source
    if (apiData.data && apiData.data.length > 0) {
      const africanLocales = AFRICAN_COUNTRIES.split(",").map((l) =>
        l.toLowerCase()
      );
      const africanSources = [
        "bbc",
        "cnn",
        "reuters",
        "africa",
        "nigeria",
        "kenya",
        "south africa",
        "ghana",
        "egypt",
      ];

      apiData.data = apiData.data.filter((article) => {
        const locale = article.locale?.toLowerCase();
        const source = article.source?.toLowerCase() || "";
        if (locale && africanLocales.includes(locale)) {
          return true;
        }
        if (africanSources.some((afSource) => source.includes(afSource))) {
          return true;
        }

        return false;
      });

      console.log("🟢 [News API] Filtered to African countries:", {
        before: rawData.data?.length || 0,
        after: apiData.data.length,
      });
    }

    console.log("🟢 [News API] Processed data:", {
      hasData: !!apiData.data,
      dataLength: apiData.data?.length || 0,
      firstArticle: apiData.data?.[0]?.title || "N/A",
    });

    if (!apiData.data || apiData.data.length === 0) {
      console.warn("⚠️ No African news data from News API after filtering");
      console.warn("⚠️ Note: /headlines endpoint requires Standard plan");
      console.warn("⚠️ Using /all endpoint which may have limited filtering");
      return NextResponse.json(getMockData());
    }

    // Transform News API data to our format
    const articles = apiData.data.map((article) => ({
      id: article.uuid,
      title: article.title,
      description: article.description || article.snippet,
      category: mapCategory(article.categories),
      country: getCountryName(article.locale),
      source: article.source,
      publishedAt: article.published_at,
      url: article.url,
      imageUrl: article.image_url || undefined,
      tags: article.categories.slice(0, 3), // Use first 3 categories as tags
    }));

    // Sort by published date (newest first)
    articles.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // Split into trending (first 4) and latest (rest)
    const trending = articles.slice(0, 4);
    const latest = articles.slice(4, 12);

    console.log("✅ [News API] Successfully transformed data:", {
      trendingCount: trending.length,
      latestCount: latest.length,
    });

    return NextResponse.json(
      { trending, latest },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("❌ Error fetching African events:", error);
    if (error instanceof Error) {
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);
    }
    return NextResponse.json(getMockData());
  }
}

// Fallback mock data
function getMockData() {
  const now = new Date();

  return {
    trending: [
      {
        id: "1",
        title: "Nigeria's Tech Sector Sees Record Investment in Q4 2024",
        description:
          "Major tech companies announce $500M in funding rounds, signaling strong growth in West Africa's digital economy.",
        category: "Technology",
        country: "Nigeria",
        source: "TechCrunch Africa",
        publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        url: "https://example.com",
        tags: ["Tech", "Investment", "West Africa"],
      },
      {
        id: "2",
        title: "Kenya Launches Green Energy Initiative for 2025",
        description:
          "Government announces ambitious renewable energy targets, aiming for 100% clean energy by 2030.",
        category: "Environment",
        country: "Kenya",
        source: "African Business",
        publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        url: "https://example.com",
        tags: ["Energy", "Sustainability", "East Africa"],
      },
    ],
    latest: [
      {
        id: "3",
        title: "Egypt Announces Major Infrastructure Project",
        description:
          "New transportation network to connect major cities, expected to boost economic growth in the region.",
        category: "Infrastructure",
        country: "Egypt",
        source: "African News",
        publishedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
        url: "https://example.com",
        tags: ["Infrastructure", "Development", "North Africa"],
      },
    ],
  };
}
