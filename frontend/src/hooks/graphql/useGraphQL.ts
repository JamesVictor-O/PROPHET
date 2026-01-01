const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_HASURA_URL ||
  "https://prophet-production-0cb1.up.railway.app/v1/graphql";

interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

async function graphqlQuery<T>(query: string, variables: any = {}): Promise<T> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`);
  }

  const result: GraphQLResponse<T> = await response.json();

  if (result.errors) {
    throw new Error(
      `GraphQL errors: ${result.errors.map((e) => e.message).join(", ")}`
    );
  }

  return result.data;
}

export { graphqlQuery, GRAPHQL_ENDPOINT };
