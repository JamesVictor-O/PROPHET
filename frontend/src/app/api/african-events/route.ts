import { NextResponse } from "next/server";

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

    // Fetch top stories from African countries
    const url = new URL("https://api.thenewsapi.com/v1/news/top");
    url.searchParams.set("api_token", apiToken);

    // Use top African countries - free plan limit is 3, so we'll get 3 articles
    url.searchParams.set(
      "locale",
      AFRICAN_COUNTRIES.split(",").slice(0, 10).join(",")
    );
    url.searchParams.set("language", "en");
    url.searchParams.set("limit", "50");

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 300, // Cache for 5 minutes
      },
    });

    if (!response.ok) {
      console.error(
        `❌ News API error: ${response.status} ${response.statusText}`
      );
      return NextResponse.json(getMockData());
    }

    const rawData = await response.json();

    // Handle different possible response formats
    let apiData: NewsAPIResponse;
    if (Array.isArray(rawData)) {
      apiData = { data: rawData };
    } else if (rawData.data && Array.isArray(rawData.data)) {
      apiData = rawData as NewsAPIResponse;
    } else {
      console.error("❌ [News API] Unexpected response format");
      return NextResponse.json(getMockData());
    }

    // Filter for African countries only
    if (apiData.data && apiData.data.length > 0) {
      const africanLocales = AFRICAN_COUNTRIES.split(",").map((l) =>
        l.toLowerCase()
      );

      apiData.data = apiData.data.filter((article) => {
        const locale = article.locale?.toLowerCase();
        return locale && africanLocales.includes(locale);
      });
    }

    if (!apiData.data || apiData.data.length === 0) {
      console.warn("⚠️ No African news data from News API after filtering");
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
      tags: article.categories.slice(0, 3),
    }));

    articles.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    const trending = articles.slice(0, 4);
    const latest = articles.slice(4, 12);

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
