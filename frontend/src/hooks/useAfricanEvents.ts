import { useQuery } from "@tanstack/react-query";

export interface AfricanEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  country: string;
  source: string;
  publishedAt: string;
  url?: string;
  imageUrl?: string;
  tags?: string[];
}

interface AfricanEventsResponse {
  trending: AfricanEvent[];
  latest: AfricanEvent[];
}

// API endpoint - Update this with your actual API endpoint
const AFRICAN_EVENTS_API = process.env.NEXT_PUBLIC_AFRICAN_EVENTS_API || "/api/african-events";

async function fetchAfricanEvents(): Promise<AfricanEventsResponse> {
  try {
    // Try to fetch from API
    const response = await fetch(AFRICAN_EVENTS_API);
    
    if (!response.ok) {
      throw new Error("Failed to fetch events");
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn("API not available, using mock data:", error);
    // Fallback to mock data for development
    return getMockAfricanEvents();
  }
}

// Mock data for development/demo
function getMockAfricanEvents(): AfricanEventsResponse {
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
      {
        id: "3",
        title: "South Africa's Sports Team Wins Continental Championship",
        description:
          "Historic victory marks the country's third consecutive championship win in the continental tournament.",
        category: "Sports",
        country: "South Africa",
        source: "ESPN Africa",
        publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        url: "https://example.com",
        tags: ["Sports", "Championship", "Southern Africa"],
      },
      {
        id: "4",
        title: "Ghana's Film Industry Breaks Box Office Records",
        description:
          "Local productions dominate cinemas across West Africa, signaling a renaissance in African cinema.",
        category: "Entertainment",
        country: "Ghana",
        source: "Variety Africa",
        publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
        url: "https://example.com",
        tags: ["Film", "Entertainment", "West Africa"],
      },
    ],
    latest: [
      {
        id: "5",
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
      {
        id: "6",
        title: "Rwanda's Tourism Sector Shows Strong Recovery",
        description:
          "Visitor numbers reach pre-pandemic levels, with eco-tourism leading the growth.",
        category: "Tourism",
        country: "Rwanda",
        source: "Travel Africa",
        publishedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
        url: "https://example.com",
        tags: ["Tourism", "Recovery", "East Africa"],
      },
      {
        id: "7",
        title: "Morocco Hosts International Climate Summit",
        description:
          "African leaders gather to discuss climate action and sustainable development strategies.",
        category: "Politics",
        country: "Morocco",
        source: "African Politics",
        publishedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
        url: "https://example.com",
        tags: ["Climate", "Politics", "North Africa"],
      },
      {
        id: "8",
        title: "Tanzania's Agriculture Innovation Program Launches",
        description:
          "New initiative aims to modernize farming practices and increase food security across the region.",
        category: "Agriculture",
        country: "Tanzania",
        source: "African Agriculture",
        publishedAt: new Date(now.getTime() - 7 * 60 * 60 * 1000).toISOString(),
        url: "https://example.com",
        tags: ["Agriculture", "Innovation", "East Africa"],
      },
      {
        id: "9",
        title: "Senegal's Music Industry Goes Global",
        description:
          "Local artists break into international charts, showcasing West African music to the world.",
        category: "Music",
        country: "Senegal",
        source: "Music Africa",
        publishedAt: new Date(now.getTime() - 9 * 60 * 60 * 1000).toISOString(),
        url: "https://example.com",
        tags: ["Music", "Culture", "West Africa"],
      },
      {
        id: "10",
        title: "Ethiopia's Startup Ecosystem Gains Momentum",
        description:
          "Tech incubators and accelerators report record number of applications and successful exits.",
        category: "Technology",
        country: "Ethiopia",
        source: "Tech Africa",
        publishedAt: new Date(now.getTime() - 11 * 60 * 60 * 1000).toISOString(),
        url: "https://example.com",
        tags: ["Tech", "Startups", "East Africa"],
      },
    ],
  };
}

export function useAfricanEvents() {
  return useQuery<AfricanEventsResponse>({
    queryKey: ["african-events"],
    queryFn: fetchAfricanEvents,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  });
}

