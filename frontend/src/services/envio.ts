const HASURA_URL = process.env.NEXT_PUBLIC_HASURA_URL;
const ADMIN_SECRET = process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET;

export async function fetchGraphQL(query: string, variables: any = {}) {
  const response = await fetch(HASURA_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Hasura-Admin-Secret": ADMIN_SECRET!,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const result = await response.json();
  if (result.errors) {
    console.error("GraphQL Errors:", result.errors);
    throw new Error(result.errors[0].message);
  }
  return result.data;
}

export const GET_MARKETS = `
  query GetMarkets {
    Market(order_by: {createdAt: desc}) {
      id
      question
      category
      creator
      totalPool
      yesPool
      noPool
      status
      resolved
      endTime
      createdAt
    }
  }
`;

export const GET_USER_PREDICTIONS = `
  query GetUserPredictions($user: String!) {
    Prediction(where: {user: {_ilike: $user}}, order_by: {timestamp: desc}) {
      id
      marketId
      amount
      side
      timestamp
      claimed
    }
  }
`;

export const GET_GLOBAL_ACTIVITY = `
  query GetGlobalActivity {
    Prediction(limit: 10, order_by: {timestamp: desc}) {
      id
      marketId
      user
      amount
      side
      timestamp
    }
    Market(limit: 5, order_by: {createdAt: desc}) {
      id
      question
      creator
      createdAt
    }
  }
`;
