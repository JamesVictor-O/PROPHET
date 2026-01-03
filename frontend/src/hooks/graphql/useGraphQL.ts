/**
 * Frontend GraphQL endpoint (Envio/Hasura).
 *
 * We do NOT silently fall back to localhost or a hardcoded production URL.
 * You must set `NEXT_PUBLIC_ENVIO_GRAPHQL_URL` (preferred) or `NEXT_PUBLIC_HASURA_URL`.
 */
const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL ||
  process.env.NEXT_PUBLIC_HASURA_URL;

interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

async function graphqlQuery<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  if (!GRAPHQL_ENDPOINT) {
    throw new Error(
      "Missing GraphQL endpoint. Set NEXT_PUBLIC_ENVIO_GRAPHQL_URL to your Hasura /v1/graphql endpoint (or set NEXT_PUBLIC_HASURA_URL)."
    );
  }

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
