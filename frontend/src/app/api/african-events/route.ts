import { NextResponse } from "next/server";

/**
 * API Route for fetching African events
 * 
 * This is a placeholder that returns mock data.
 * Replace this with your actual API integration.
 * 
 * Example integrations:
 * - NewsAPI: https://newsapi.org/docs/endpoints/top-headlines
 * - Custom backend API
 * - RSS feeds
 * - Web scraping service
 */

export async function GET() {
  try {
    // TODO: Replace with actual API call
    // Example with NewsAPI:
    // const response = await fetch(
    //   `https://newsapi.org/v2/top-headlines?country=ng&apiKey=${process.env.NEWS_API_KEY}`
    // );
    // const data = await response.json();
    
    // For now, return mock data
    const now = new Date();
    
    const mockData = {
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

    return NextResponse.json(mockData, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error fetching African events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

