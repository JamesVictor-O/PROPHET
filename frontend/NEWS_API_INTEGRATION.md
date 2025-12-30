# News API Integration for African Events

## Overview

The dashboard home page now displays real-time African news from The News API (thenewsapi.com). The integration fetches headlines from 50+ African countries and displays them in:

1. **Top Ticker Bar** - Scrolling headlines from trending news
2. **High Volatility Updates** - Featured trending articles
3. **Calendar & Intel** - Latest news feed

## Setup

### 1. Get API Token

1. Sign up for a free account at [thenewsapi.com](https://thenewsapi.com)
2. Get your API token from the dashboard
3. Add it to your `.env.local` file:

```env
NEWS_API_TOKEN=your_api_token_here
```

### 2. Environment Variables

Add to `PROPHET/frontend/.env.local`:

```env
# The News API Token
NEWS_API_TOKEN=your_api_token_here
```

## How It Works

### API Route

**File:** `PROPHET/frontend/src/app/api/african-events/route.ts`

- Fetches headlines from 50+ African countries
- Filters for English language articles
- Transforms News API response to our `AfricanEvent` format
- Falls back to mock data if API is unavailable or token is missing

### Data Flow

1. **Frontend Hook** (`useAfricanEvents.ts`)
   - Calls `/api/african-events` endpoint
   - Auto-refetches every 5 minutes
   - Caches data for 2 minutes

2. **API Route** (`/api/african-events/route.ts`)
   - Fetches from The News API with African country codes
   - Maps News API categories to our categories
   - Returns `{ trending: [], latest: [] }` format

3. **Home Page** (`/dashboard/home/page.tsx`)
   - Displays trending news in ticker and featured section
   - Shows latest news in sidebar feed
   - Includes real-time timestamps and country information

## Features

### Supported African Countries

The integration fetches news from 50+ African countries including:
- Nigeria, South Africa, Kenya, Ghana, Egypt, Morocco
- Tanzania, Ethiopia, Uganda, Côte d'Ivoire, Algeria
- And 40+ more African nations

### Category Mapping

News API categories are mapped to our categories:
- `business` → Business
- `technology` → Technology
- `sports` → Sports
- `entertainment` → Entertainment
- `health` → Health
- `science` → Science
- `general` → General
- `politics` → Politics

### Real-Time Updates

- **Ticker Bar**: Shows latest 8 trending headlines
- **Featured Section**: Displays top 4 trending articles
- **Sidebar Feed**: Shows latest 8 articles
- **Auto-refresh**: Updates every 5 minutes

## Error Handling

The integration includes robust error handling:

1. **Missing API Token**: Falls back to mock data
2. **API Errors**: Returns mock data with console warning
3. **Empty Results**: Falls back to mock data
4. **Network Errors**: Gracefully handles and logs errors

## Testing

1. **With API Token**:
   - Set `NEWS_API_TOKEN` in `.env.local`
   - Restart dev server
   - Visit `/dashboard/home`
   - Should see real African news

2. **Without API Token**:
   - Remove or don't set `NEWS_API_TOKEN`
   - Visit `/dashboard/home`
   - Should see mock data (fallback)

## API Endpoint Details

**Endpoint:** `GET https://api.thenewsapi.com/v1/news/headlines`

**Parameters:**
- `api_token`: Your API token (required)
- `locale`: Comma-separated African country codes
- `language`: `en` (English only)
- `headlines_per_category`: `10` (max articles per category)
- `include_similar`: `false` (exclude similar articles)

## Response Format

The API route returns:

```typescript
{
  trending: AfricanEvent[];  // Top 4 articles
  latest: AfricanEvent[];     // Next 8 articles
}
```

Where `AfricanEvent` includes:
- `id`: Unique article ID
- `title`: Article headline
- `description`: Article description/snippet
- `category`: Mapped category
- `country`: Country name
- `source`: News source domain
- `publishedAt`: ISO timestamp
- `url`: Article URL
- `imageUrl`: Article image URL (if available)
- `tags`: Category tags

## Future Enhancements

Potential improvements:
- [ ] Add filtering by category
- [ ] Add search functionality
- [ ] Cache articles in database
- [ ] Add image display for articles
- [ ] Add "Read More" functionality
- [ ] Add country-specific filtering
- [ ] Add date range filtering

