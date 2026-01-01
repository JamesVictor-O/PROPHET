import {
  PredictionMarket,
  ReputationSystem,
  MarketFactory,
} from "../generated";

// Helper function to initialize global stats
async function ensureGlobalStats(context: any) {
  let stats = await context.GlobalStats.get("global");
  if (!stats) {
    context.GlobalStats.set({
      id: "global",
      totalMarkets: 0n,
      totalPredictions: 0n,
      totalVolume: 0n,
      totalUsers: 0n,
      totalResolved: 0n,
    });
  }
}

PredictionMarket.MarketCreated.handler(async ({ event, context }: any) => {
  // Store raw event
  context.PredictionMarket_MarketCreated.set({
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    marketId: event.params.marketId,
    creator: event.params.creator,
    question: event.params.question,
    category: event.params.category,
    endTime: event.params.endTime,
  });

  context.Market.set({
    id: event.params.marketId.toString(),
    marketId: event.params.marketId,
    creator: event.params.creator.toLowerCase(),
    question: event.params.question,
    category: event.params.category,
    marketType: 0n, // Default to Binary, can be updated from contract state if needed
    endTime: event.params.endTime,
    status: "Active",
    resolved: false,
    yesPool: 0n,
    noPool: 0n,
    totalPool: 0n,
    createdAt: BigInt(event.block.timestamp),
    predictionCount: 0n,
  });

  // Update global stats
  await ensureGlobalStats(context);
  const stats = await context.GlobalStats.get("global");
  if (stats) {
    context.GlobalStats.set({
      ...stats,
      totalMarkets: stats.totalMarkets + 1n,
    });
  }
});

// 2. Prediction Made Handler
PredictionMarket.PredictionMade.handler(async ({ event, context }: any) => {
  // Store raw event
  context.PredictionMarket_PredictionMade.set({
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    marketId: event.params.marketId,
    user: event.params.user,
    side: event.params.side,
    outcomeIndex: event.params.outcomeIndex,
    amount: event.params.amount,
  });

  // Get or create Prediction entity
  const predictionId = `${
    event.params.marketId
  }-${event.params.user.toLowerCase()}`;
  let prediction = await context.Prediction.get(predictionId);

  if (!prediction) {
    // Create new prediction
    context.Prediction.set({
      id: predictionId,
      marketId: event.params.marketId,
      user: event.params.user.toLowerCase(),
      side: event.params.side,
      outcomeIndex: event.params.outcomeIndex,
      amount: event.params.amount,
      timestamp: BigInt(event.block.timestamp),
      claimed: false,
    });

    // Update market prediction count
    const market = await context.Market.get(event.params.marketId.toString());
    if (market) {
      context.Market.set({
        ...market,
        predictionCount: market.predictionCount + 1n,
      });
    }
  } else {
    // Update existing prediction (user can stake more)
    context.Prediction.set({
      ...prediction,
      amount: prediction.amount + event.params.amount,
    });
  }

  // Update Market pools (simplified - in reality you'd need to check market type)
  const market = await context.Market.get(event.params.marketId.toString());
  if (market) {
    const isYes = event.params.side === 0n;
    context.Market.set({
      ...market,
      yesPool: isYes ? market.yesPool + event.params.amount : market.yesPool,
      noPool: !isYes ? market.noPool + event.params.amount : market.noPool,
      totalPool: market.totalPool + event.params.amount,
    });
  }

  // Update or create User entity
  let user = await context.User.get(event.params.user.toLowerCase());
  if (!user) {
    user = {
      id: event.params.user.toLowerCase(),
      address: event.params.user.toLowerCase(),
      username: null,
      totalPredictions: 0n,
      correctPredictions: 0n,
      totalWinnings: 0n,
      currentStreak: 0n,
      bestStreak: 0n,
      reputationScore: 0n,
      totalStaked: 0n,
    };
  }
  context.User.set({
    ...user,
    totalPredictions: user.totalPredictions + 1n,
    totalStaked: user.totalStaked + event.params.amount,
  });

  // Update global stats
  const stats = await context.GlobalStats.get("global");
  if (stats) {
    context.GlobalStats.set({
      ...stats,
      totalPredictions: stats.totalPredictions + 1n,
      totalVolume: stats.totalVolume + event.params.amount,
    });
  }
});

// 3. Market Resolved Handler
PredictionMarket.MarketResolved.handler(async ({ event, context }: any) => {
  // Store raw event
  context.PredictionMarket_MarketResolved.set({
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    marketId: event.params.marketId,
    winningOutcome: event.params.winningOutcome,
    winningOutcomeIndex: event.params.winningOutcomeIndex,
    totalPayout: event.params.totalPayout,
  });

  // Update Market entity
  const market = await context.Market.get(event.params.marketId.toString());
  if (market) {
    context.Market.set({
      ...market,
      status: "Resolved",
      resolved: true,
      winningOutcome: event.params.winningOutcome,
      winningOutcomeIndex: event.params.winningOutcomeIndex,
      resolvedAt: BigInt(event.block.timestamp),
    });
  }

  // Update global stats
  const stats = await context.GlobalStats.get("global");
  if (stats) {
    context.GlobalStats.set({
      ...stats,
      totalResolved: stats.totalResolved + 1n,
    });
  }
});

// 4. Payout Claimed Handler
PredictionMarket.PayoutClaimed.handler(async ({ event, context }: any) => {
  // Store raw event
  context.PredictionMarket_PayoutClaimed.set({
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    marketId: event.params.marketId,
    user: event.params.user,
    amount: event.params.amount,
  });

  // Update Prediction entity
  const predictionId = `${
    event.params.marketId
  }-${event.params.user.toLowerCase()}`;
  const prediction = await context.Prediction.get(predictionId);
  if (prediction) {
    context.Prediction.set({
      ...prediction,
      claimed: true,
    });
  }

  // Update User entity
  const user = await context.User.get(event.params.user.toLowerCase());
  if (user) {
    context.User.set({
      ...user,
      totalWinnings: user.totalWinnings + event.params.amount,
    });
  }
});

// 5. Reputation Updated Handler
ReputationSystem.ReputationUpdated.handler(async ({ event, context }: any) => {
  // Store raw event
  context.ReputationSystem_ReputationUpdated.set({
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    newScore: event.params.newScore,
    streak: event.params.streak,
  });

  // Update User entity
  let user = await context.User.get(event.params.user.toLowerCase());
  if (!user) {
    user = {
      id: event.params.user.toLowerCase(),
      address: event.params.user.toLowerCase(),
      username: null,
      totalPredictions: 0n,
      correctPredictions: 0n,
      totalWinnings: 0n,
      currentStreak: 0n,
      bestStreak: 0n,
      reputationScore: 0n,
      totalStaked: 0n,
    };
  }
  context.User.set({
    ...user,
    reputationScore: event.params.newScore,
    currentStreak: event.params.streak,
    bestStreak:
      event.params.streak > user.bestStreak
        ? event.params.streak
        : user.bestStreak,
  });
});

// 6. Username Set Handler
ReputationSystem.UsernameSet.handler(async ({ event, context }: any) => {
  // Store raw event
  context.ReputationSystem_UsernameSet.set({
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    username: event.params.username,
  });

  // Update User entity
  let user = await context.User.get(event.params.user.toLowerCase());
  if (!user) {
    user = {
      id: event.params.user.toLowerCase(),
      address: event.params.user.toLowerCase(),
      username: null,
      totalPredictions: 0n,
      correctPredictions: 0n,
      totalWinnings: 0n,
      currentStreak: 0n,
      bestStreak: 0n,
      reputationScore: 0n,
      totalStaked: 0n,
    };
  }
  context.User.set({
    ...user,
    username: event.params.username,
  });

  // Update global stats (if this is a new user)
  if (!user.totalPredictions || user.totalPredictions === 0n) {
    const stats = await context.GlobalStats.get("global");
    if (stats) {
      context.GlobalStats.set({
        ...stats,
        totalUsers: stats.totalUsers + 1n,
      });
    }
  }
});

// 7. Ownership Transferred Handler (optional, for completeness)
MarketFactory.OwnershipTransferred.handler(async ({ event, context }: any) => {
  context.MarketFactory_OwnershipTransferred.set({
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    previousOwner: event.params.previousOwner,
    newOwner: event.params.newOwner,
  });
});
