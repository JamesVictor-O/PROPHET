## Envio Indexer for PROPHET

_Please refer to the [documentation website](https://docs.envio.dev) for a thorough guide on all [Envio](https://envio.dev) indexer features_

### Setup and Run

**Important**: You must run `codegen` before the TypeScript code will compile, as it generates the `generated` module.

```bash
# 1. Install dependencies
npm install

# 2. Generate types from config.yaml and schema.graphql (REQUIRED)
npm run codegen

# 3. Start the indexer
npm run dev
```

Visit http://localhost:8080 to see the GraphQL Playground, local password is `testing`.

**Note**: The `generated` module is created by `npm run codegen`. If you see TypeScript errors about missing `generated` module, run `npm run codegen` first.

### Pre-requisites

- [Node.js (use v18 or newer)](https://nodejs.org/en/download/current)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/installation)
- [Docker desktop](https://www.docker.com/products/docker-desktop/)

### Configuration

The indexer is configured to track events from:

- **MarketFactory** (`0xe44Ea520518CCD7709CD13BCd37161518fA2e580`) - Market creation
- **PredictionMarket** (`0x7FcfD3947A638377c37f445A794c1Ec0590c05f3`) - Predictions and market resolution
- **Oracle** (`0x99C0b5dd3A58Da47D3e38FC857CB8F1e3db66a22`) - Market resolution
- **ReputationSystem** (`0xE562ef4B289ee17FB3c9B254bB44F018C573BF55`) - User reputation and usernames

**Network**: Base Sepolia (Chain ID: 84532)

**Note**: Update `start_block` in `config.yaml` with the actual deployment block number.

### GraphQL Queries

Once running, visit `http://localhost:8080/v1/graphql` and try:

#### 1. Get All Markets

```graphql
query GetMarkets {
  Market(limit: 10, order_by: { createdAt: desc }) {
    id
    marketId
    creator
    question
    category
    marketType
    totalPool
    status
    resolved
    predictionCount
    createdAt
  }
}
```

#### 2. Get Market with Predictions

```graphql
query GetMarketDetails($marketId: String!) {
  Market(where: { id: { _eq: $marketId } }) {
    id
    question
    category
    creator
    totalPool
    yesPool
    noPool
    status
    resolved
    winningOutcome
    predictionCount
  }

  Prediction(
    where: { marketId: { _eq: $marketId } }
    order_by: { timestamp: desc }
  ) {
    user
    side
    outcomeIndex
    amount
    timestamp
    claimed
  }
}
```

#### 3. Get User Stats

```graphql
query GetUserStats($address: String!) {
  User(where: { address: { _eq: $address } }) {
    address
    username
    totalPredictions
    correctPredictions
    totalWinnings
    currentStreak
    bestStreak
    reputationScore
    totalStaked
  }

  Prediction(where: { user: { _eq: $address } }) {
    marketId
    side
    outcomeIndex
    amount
    timestamp
    claimed
  }
}
```

#### 4. Get Global Statistics

```graphql
query GetGlobalStats {
  GlobalStats(where: { id: { _eq: "global" } }) {
    totalMarkets
    totalPredictions
    totalVolume
    totalUsers
    totalResolved
  }
}
```

#### 5. Get Active Markets

```graphql
query GetActiveMarkets {
  Market(where: { status: { _eq: "Active" } }, order_by: { createdAt: desc }) {
    marketId
    question
    category
    totalPool
    predictionCount
    endTime
  }
}
```

#### 6. Get User Predictions

```graphql
query GetUserPredictions($userAddress: String!) {
  Prediction(
    where: { user: { _eq: $userAddress } }
    order_by: { timestamp: desc }
  ) {
    marketId
    side
    outcomeIndex
    amount
    timestamp
    claimed
  }
}
```

### Architecture

**Event Flow**:

```
Contract Event → Envio Indexer → PostgreSQL → GraphQL API → Frontend
```

**Data Models**:

**Raw Events**:

- Stored exactly as emitted (e.g., `PredictionMarket_MarketCreated`)
- Used for historical event queries

**Aggregated Entities**:

- `Market` - Complete market lifecycle state
- `Prediction` - User prediction records
- `User` - User statistics and reputation
- `GlobalStats` - Platform-wide metrics

### Production Deployment

When ready for production:

```bash
# Build the indexer
npm run codegen

# Deploy to Envio Hosted Service
envio deploy

# Or self-host using Docker
docker build -t prophet-indexer .
docker run -p 8080:8080 prophet-indexer
```

### Troubleshooting

**Indexer won't start?**

- ✅ Check Docker is running: `docker ps`
- ✅ Check logs: `npm run dev` and look for errors
- ✅ Verify RPC is accessible

**No data showing?**

- ✅ Check start_block in config.yaml is correct
- ✅ Verify contract addresses match deployment
- ✅ Check if events have been emitted on-chain

**GraphQL errors?**

- ✅ Run `npm run codegen` after schema changes
- ✅ Check handler implementations for errors
- ✅ Review indexer logs
